"use server";

import { revalidatePath } from "next/cache";
import { createServerClient, createAdminClient } from "@/lib/supabase/server";
import { generateToken, siteUrl } from "@/lib/utils";
import { sendEmail, assessmentInviteEmail } from "@/lib/email";

export type SendAssessmentState = {
  ok: boolean;
  message?: string;
};

export async function sendAssessment(
  candidateId: string,
): Promise<SendAssessmentState> {
  const ssr = await createServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return { ok: false, message: "Sign in required." };

  const supabase = createAdminClient();
  const { data: candidate, error } = await supabase
    .from("candidates")
    .select("id, full_name, email, assessment_token, status")
    .eq("id", candidateId)
    .maybeSingle();

  if (error || !candidate) {
    return { ok: false, message: "Candidate not found." };
  }
  if (!candidate.email) {
    return { ok: false, message: "Candidate has no email on file." };
  }

  // Reuse existing assessment token if one exists; otherwise generate fresh.
  const token = candidate.assessment_token ?? generateToken(24);
  const assessmentUrl = siteUrl(`/assessment/${token}`);

  // Update candidate first so even if email fails the status is consistent.
  const { error: updateError } = await supabase
    .from("candidates")
    .update({
      assessment_token: token,
      status: "assessment_sent",
      assessment_sent_at: new Date().toISOString(),
    })
    .eq("id", candidateId);
  if (updateError) {
    return { ok: false, message: `Update failed: ${updateError.message}` };
  }

  // Send the email
  try {
    const candidateName = candidate.full_name ?? "there";
    const { subject, html, text } = assessmentInviteEmail(
      candidateName,
      assessmentUrl,
    );
    await sendEmail({ to: candidate.email, subject, html, text });
  } catch (err) {
    console.error("Assessment email failed:", err);
    return {
      ok: false,
      message:
        "Status was updated but the email failed to send. Resend the invitation or share the link manually.",
    };
  }

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    actor_label: user.email,
    action: "sent_assessment",
    target_type: "candidate",
    target_id: candidateId,
    details: { token_prefix: token.slice(0, 8), email: candidate.email },
  });

  revalidatePath(`/admin/candidates/${candidateId}`);
  return { ok: true, message: "Assessment invitation sent." };
}
