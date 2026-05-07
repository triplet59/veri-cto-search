"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/utils";

const SectionFiveSchema = z.record(z.string(), z.string());

const DraftSchema = z.object({
  candidateId: z.string().uuid(),
  section_1_architecture: z.string().optional().nullable(),
  section_2_governance: z.string().optional().nullable(),
  section_3_leadership: z.string().optional().nullable(),
  section_4_code: z.string().optional().nullable(),
  section_4_language: z.string().optional().nullable(),
  section_4_assumptions: z.string().optional().nullable(),
  section_4_test_strategy: z.string().optional().nullable(),
  section_4_extension_notes: z.string().optional().nullable(),
  section_5_scenarios: z.union([z.string(), z.record(z.string(), z.string())]).optional().nullable(),
});

export type SaveResult = { ok: boolean; savedAt?: string; error?: string };

export async function saveDraft(input: unknown): Promise<SaveResult> {
  const parsed = DraftSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input" };
  }
  const data = parsed.data;
  const supabase = createAdminClient();

  // Confirm candidate is allowed to be saving (i.e. status is in the active range)
  const { data: candidate } = await supabase
    .from("candidates")
    .select("id, status")
    .eq("id", data.candidateId)
    .maybeSingle();
  if (!candidate) return { ok: false, error: "Candidate not found" };
  if (
    !["assessment_sent", "assessment_started"].includes(candidate.status)
  ) {
    return { ok: false, error: "Assessment is not in an editable state" };
  }

  // Parse section 5 scenarios — accept either JSON string or object
  let scenariosObj: Record<string, string> | null = null;
  if (data.section_5_scenarios) {
    if (typeof data.section_5_scenarios === "string") {
      try {
        scenariosObj = JSON.parse(data.section_5_scenarios);
      } catch {
        scenariosObj = null;
      }
    } else {
      scenariosObj = data.section_5_scenarios;
    }
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("assessment_submissions")
    .upsert(
      {
        candidate_id: data.candidateId,
        section_1_architecture: data.section_1_architecture ?? null,
        section_2_governance: data.section_2_governance ?? null,
        section_3_leadership: data.section_3_leadership ?? null,
        section_4_code: data.section_4_code ?? null,
        section_4_language: data.section_4_language ?? null,
        section_4_assumptions: data.section_4_assumptions ?? null,
        section_4_test_strategy: data.section_4_test_strategy ?? null,
        section_4_extension_notes: data.section_4_extension_notes ?? null,
        section_5_scenarios: scenariosObj,
        last_saved_at: now,
      },
      { onConflict: "candidate_id" },
    );
  if (error) return { ok: false, error: error.message };
  return { ok: true, savedAt: now };
}

export async function submitAssessment(
  candidateId: string,
): Promise<SaveResult> {
  const supabase = createAdminClient();

  // Verify candidate state
  const { data: candidate } = await supabase
    .from("candidates")
    .select("id, status")
    .eq("id", candidateId)
    .maybeSingle();
  if (!candidate) return { ok: false, error: "Candidate not found" };
  if (
    !["assessment_sent", "assessment_started"].includes(candidate.status)
  ) {
    return { ok: false, error: "Assessment is not submittable" };
  }

  const now = new Date().toISOString();
  const { data: submission } = await supabase
    .from("assessment_submissions")
    .select("id, started_at")
    .eq("candidate_id", candidateId)
    .maybeSingle();

  if (!submission) {
    return { ok: false, error: "No draft found to submit" };
  }

  // Mark submitted
  const totalSeconds = submission.started_at
    ? Math.round((Date.parse(now) - Date.parse(submission.started_at)) / 1000)
    : null;
  await supabase
    .from("assessment_submissions")
    .update({
      submitted_at: now,
      total_time_seconds: totalSeconds,
    })
    .eq("id", submission.id);
  await supabase
    .from("candidates")
    .update({
      status: "assessment_submitted",
      assessment_submitted_at: now,
    })
    .eq("id", candidateId);

  await supabase.from("audit_log").insert({
    actor_label: "candidate",
    action: "submitted_assessment",
    target_type: "candidate",
    target_id: candidateId,
    details: { submission_id: submission.id },
  });

  // Trigger AI scoring after redirect.
  after(async () => {
    try {
      const internalToken = process.env.INTERNAL_API_TOKEN;
      if (!internalToken) {
        console.warn("INTERNAL_API_TOKEN not set — skipping scoring trigger");
        return;
      }
      await fetch(siteUrl(`/api/scores/${candidateId}`), {
        method: "POST",
        headers: { "x-internal-token": internalToken },
      });
    } catch (err) {
      console.error("Background scoring trigger failed:", err);
    }
  });

  redirect("/assessment/done");
}
