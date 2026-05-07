// POST /api/scores/:candidateId
// Triggers AI assessment scoring for a candidate.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAnthropic, MODELS } from "@/lib/anthropic";
import {
  SCORING_SYSTEM_PROMPT,
  SCORING_TOOL,
  type AssessmentScore,
} from "@/lib/prompts/assessment-scoring";

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ candidateId: string }> },
) {
  const internalToken = request.headers.get("x-internal-token");
  if (internalToken !== process.env.INTERNAL_API_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { candidateId } = await params;
  console.log(`[scoring] starting for candidate ${candidateId}`);
  const supabase = createAdminClient();

  // Avoid double-scoring.
  const { data: existing } = await supabase
    .from("assessment_scores")
    .select("id")
    .eq("candidate_id", candidateId)
    .limit(1)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: true, skipped: "already scored" });
  }

  const { data: submission } = await supabase
    .from("assessment_submissions")
    .select("*")
    .eq("candidate_id", candidateId)
    .maybeSingle();
  if (!submission) {
    return NextResponse.json(
      { error: "no submission found" },
      { status: 404 },
    );
  }

  await supabase
    .from("candidates")
    .update({ status: "scoring" })
    .eq("id", candidateId);

  // Build a single string with all the candidate's answers for Claude to read.
  const submissionText = formatSubmissionForClaude(submission);

  let result: AssessmentScore;
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    const anthropic = getAnthropic();
    console.log(`[scoring] calling Claude with model ${MODELS.scoring}`);
    const startedAt = Date.now();
    const response = await anthropic.messages.create(
      {
        model: MODELS.scoring,
        max_tokens: 4000,
        system: SCORING_SYSTEM_PROMPT,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: [SCORING_TOOL] as any,
        tool_choice: { type: "tool", name: SCORING_TOOL.name },
        messages: [
          {
            role: "user",
            content: submissionText,
          },
        ],
      },
      { timeout: 50_000 },
    );
    console.log(
      `[scoring] Claude responded in ${Date.now() - startedAt}ms, ${response.usage.input_tokens}+${response.usage.output_tokens} tokens`,
    );
    inputTokens = response.usage.input_tokens;
    outputTokens = response.usage.output_tokens;

    const toolUse = response.content.find(
      (b) => b.type === "tool_use" && b.name === SCORING_TOOL.name,
    );
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Claude did not call record_score tool");
    }
    result = toolUse.input as AssessmentScore;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[scoring] failed:", errMsg);
    try {
      await supabase
        .from("candidates")
        .update({ status: "assessment_submitted" })
        .eq("id", candidateId);
      await supabase.from("audit_log").insert({
        actor_label: "system",
        action: "ai_scoring_failed",
        target_type: "candidate",
        target_id: candidateId,
        details: { error: errMsg, model: MODELS.scoring },
      });
    } catch (cleanupErr) {
      console.error("Cleanup after scoring failure also failed:", cleanupErr);
    }
    return NextResponse.json({ error: "scoring failed", details: errMsg }, { status: 500 });
  }

  // Persist the score
  const criteriaMap: Record<string, number> = {};
  for (const c of result.criterion_scores) {
    criteriaMap[c.key] = c.score;
  }
  const { error: insertErr } = await supabase.from("assessment_scores").insert({
    submission_id: submission.id,
    candidate_id: candidateId,
    score_architecture: criteriaMap.architecture ?? null,
    score_fintech: criteriaMap.fintech ?? null,
    score_legacy: criteriaMap.legacy ?? null,
    score_cloud: criteriaMap.cloud ?? null,
    score_leadership: criteriaMap.leadership ?? null,
    score_communication: criteriaMap.communication ?? null,
    weighted_total: result.weighted_total,
    criterion_notes: result.criterion_scores,
    red_flags: result.red_flags,
    red_flags_count: result.red_flags.length,
    recommendation: result.recommendation,
    strengths: result.strengths,
    concerns: result.concerns,
    follow_up_questions: result.follow_up_questions,
    summary: result.summary,
    model_used: MODELS.scoring,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
  });
  if (insertErr) {
    console.error("Failed to write score:", insertErr);
    return NextResponse.json(
      { error: "could not save score" },
      { status: 500 },
    );
  }

  await supabase
    .from("candidates")
    .update({
      status: "scored",
      scored_at: new Date().toISOString(),
    })
    .eq("id", candidateId);

  await supabase.from("audit_log").insert({
    actor_label: "system",
    action: "ai_scored_candidate",
    target_type: "candidate",
    target_id: candidateId,
    details: {
      recommendation: result.recommendation,
      weighted_total: result.weighted_total,
      red_flags_count: result.red_flags.length,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
    },
  });

  return NextResponse.json({
    ok: true,
    weighted_total: result.weighted_total,
    recommendation: result.recommendation,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatSubmissionForClaude(s: any): string {
  const sectionFive = s.section_5_scenarios ?? {};
  const scenarioLines = Object.keys(sectionFive)
    .sort()
    .map((k) => `### ${k.toUpperCase()}\n\n${sectionFive[k]}`)
    .join("\n\n");

  return `# Candidate's Technical Assessment Answers

The candidate completed a five-section technical assessment for the Senior Technical Officer role. Below are their answers exactly as submitted. Score them against the rubric and call the record_score tool.

---

## Section 1 — Architecture & Modernisation Strategy

${s.section_1_architecture ?? "[Not answered]"}

---

## Section 2 — Cloud, Risk & Governance

${s.section_2_governance ?? "[Not answered]"}

---

## Section 3 — Team Leadership, Delivery & Vendor Management

${s.section_3_leadership ?? "[Not answered]"}

---

## Section 4 — Practical Coding Task

**Language chosen:** ${s.section_4_language ?? "not specified"}

### Code

\`\`\`${s.section_4_language ?? ""}
${s.section_4_code ?? "[Not answered]"}
\`\`\`

### Assumptions

${s.section_4_assumptions ?? "[Not stated]"}

### Test strategy

${s.section_4_test_strategy ?? "[Not provided]"}

### Extension notes

${s.section_4_extension_notes ?? "[Not provided]"}

---

## Section 5 — Short Scenario Questions

${scenarioLines || "[No scenarios answered]"}
`;
}
