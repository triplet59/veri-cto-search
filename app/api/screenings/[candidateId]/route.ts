// POST /api/screenings/:candidateId
// Triggers AI CV screening for a candidate.
//
// Internal endpoint — protected by checking the request comes from our own
// server (via the INTERNAL_API_TOKEN header). Called from the apply form's
// server action via `after()` so it runs after the candidate has been
// redirected to /apply/done.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAnthropic, MODELS } from "@/lib/anthropic";
import {
  SCREENING_SYSTEM_PROMPT,
  SCREENING_TOOL,
  type ScreeningResult,
} from "@/lib/prompts/cv-screening";

// Vercel function timeout. Hobby plan caps at 60s; Pro extends to 300s.
// PDF reading + Claude tool-use call typically completes in 15-40s; 60s gives headroom.
export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ candidateId: string }> },
) {
  // Internal-only auth: require a header that's set on the trigger side.
  const internalToken = request.headers.get("x-internal-token");
  if (internalToken !== process.env.INTERNAL_API_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { candidateId } = await params;
  console.log(`[screening] starting for candidate ${candidateId}`);
  const supabase = createAdminClient();

  // Look up the candidate and their most recent CV upload.
  const [{ data: candidate }, { data: cv }] = await Promise.all([
    supabase
      .from("candidates")
      .select("id, status")
      .eq("id", candidateId)
      .maybeSingle(),
    supabase
      .from("cv_uploads")
      .select("id, storage_path, mime_type, file_name")
      .eq("candidate_id", candidateId)
      .order("uploaded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!candidate) {
    return NextResponse.json({ error: "candidate not found" }, { status: 404 });
  }
  if (!cv) {
    return NextResponse.json({ error: "no cv uploaded" }, { status: 404 });
  }

  // Don't double-screen.
  const { data: existing } = await supabase
    .from("screenings")
    .select("id")
    .eq("candidate_id", candidateId)
    .limit(1)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: true, skipped: "already screened" });
  }

  // Mark as screening in progress
  await supabase
    .from("candidates")
    .update({ status: "screening" })
    .eq("id", candidateId);

  // Pull the CV bytes from storage.
  const { data: blob, error: dlError } = await supabase.storage
    .from("cv-uploads")
    .download(cv.storage_path);
  if (dlError || !blob) {
    console.error("Failed to download CV:", dlError);
    await supabase
      .from("candidates")
      .update({ status: "applied" })
      .eq("id", candidateId);
    return NextResponse.json(
      { error: "could not retrieve CV from storage" },
      { status: 500 },
    );
  }

  const buffer = Buffer.from(await blob.arrayBuffer());
  const base64Pdf = buffer.toString("base64");

  // Call Claude with the CV.
  let result: ScreeningResult;
  let inputTokens = 0;
  let outputTokens = 0;
  try {
    const anthropic = getAnthropic();
    // Note: the `document` content block type is fully supported at runtime
    // by the Anthropic API for PDF inputs, but the SDK's TypeScript types
    // in @anthropic-ai/sdk 0.32.x don't include it. Bypass the type check
    // for the request body — runtime behaviour is correct.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requestBody: any = {
      model: MODELS.screening,
      max_tokens: 4000,
      system: SCREENING_SYSTEM_PROMPT,
      tools: [SCREENING_TOOL],
      tool_choice: { type: "tool", name: SCREENING_TOOL.name },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64Pdf,
              },
            },
            {
              type: "text",
              text: "Please screen the attached CV for the Senior Technical Officer role described in the system prompt and call the record_screening tool with your structured assessment.",
            },
          ],
        },
      ],
    };

    // Hard timeout on the SDK call so a hung request triggers our catch block
    // instead of letting Vercel kill the function with no cleanup.
    console.log(`[screening] calling Claude with model ${MODELS.screening}`);
    const startedAt = Date.now();
    const response = await anthropic.messages.create(requestBody, {
      timeout: 50_000, // 50 seconds — leaves 10s for cleanup before Vercel's 60s cap
    });
    console.log(
      `[screening] Claude responded in ${Date.now() - startedAt}ms, ${response.usage.input_tokens}+${response.usage.output_tokens} tokens`,
    );

    inputTokens = response.usage.input_tokens;
    outputTokens = response.usage.output_tokens;

    const toolUse = response.content.find(
      (block) => block.type === "tool_use" && block.name === SCREENING_TOOL.name,
    );
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Claude did not call record_screening tool");
    }
    result = toolUse.input as ScreeningResult;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error ? err.stack : undefined;
    console.error("Screening failed:", errMsg, errStack);

    // Best-effort status revert and audit log so the candidate isn't stuck at "screening"
    try {
      await supabase
        .from("candidates")
        .update({ status: "applied" })
        .eq("id", candidateId);
      await supabase.from("audit_log").insert({
        actor_label: "system",
        action: "ai_screening_failed",
        target_type: "candidate",
        target_id: candidateId,
        details: { error: errMsg, model: MODELS.screening },
      });
    } catch (cleanupErr) {
      console.error("Cleanup after screening failure also failed:", cleanupErr);
    }

    return NextResponse.json(
      { error: "screening failed", details: errMsg },
      { status: 500 },
    );
  }

  // Persist the screening result.
  const { error: insertError } = await supabase.from("screenings").insert({
    candidate_id: candidateId,
    background_snapshot: result.background_snapshot,
    fit_signals: result.fit_signals,
    red_flags: result.red_flags,
    recommendation: result.recommendation,
    rationale: result.rationale,
    follow_up_questions: result.follow_up_questions,
    model_used: MODELS.screening,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
  });
  if (insertError) {
    console.error("Failed to write screening:", insertError);
    return NextResponse.json(
      { error: "could not save screening" },
      { status: 500 },
    );
  }

  // Move the candidate to "screened" status (awaiting admin review).
  await supabase
    .from("candidates")
    .update({
      status:
        result.recommendation === "decline" ? "rejected_at_cv" : "screened",
      screened_at: new Date().toISOString(),
    })
    .eq("id", candidateId);

  // Audit log
  await supabase.from("audit_log").insert({
    actor_label: "system",
    action: "ai_screened_candidate",
    target_type: "candidate",
    target_id: candidateId,
    details: {
      recommendation: result.recommendation,
      red_flags_count: result.red_flags.length,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
    },
  });

  return NextResponse.json({
    ok: true,
    recommendation: result.recommendation,
  });
}
