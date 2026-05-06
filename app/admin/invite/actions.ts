"use server";

import { z } from "zod";
import { createServerClient, createAdminClient } from "@/lib/supabase/server";
import { generateToken, siteUrl } from "@/lib/utils";

const InviteSchema = z.object({
  prospectName: z.string().max(120).optional().nullable(),
  prospectEmail: z.string().email().optional().or(z.literal("")).nullable(),
  source: z.string().max(120).optional().nullable(),
  sourceNotes: z.string().max(500).optional().nullable(),
});

export type InviteFormState = {
  ok: boolean;
  applyUrl?: string;
  message?: string;
};

export async function createInvite(
  _prev: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const ssr = await createServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return { ok: false, message: "Sign in required." };

  const parsed = InviteSchema.safeParse({
    prospectName: formData.get("prospectName") || null,
    prospectEmail: formData.get("prospectEmail") || null,
    source: formData.get("source") || null,
    sourceNotes: formData.get("sourceNotes") || null,
  });
  if (!parsed.success) {
    return { ok: false, message: "Please check the form fields." };
  }

  const data = parsed.data;
  const supabase = createAdminClient();
  const token = generateToken(24);

  const { error } = await supabase
    .from("candidates")
    .insert({
      apply_token: token,
      full_name: data.prospectName || null,
      email: data.prospectEmail || null,
      source: data.source || null,
      source_notes: data.sourceNotes || null,
      invited_by: user.id,
      status: "invited",
    });
  if (error) return { ok: false, message: error.message };

  await supabase.from("audit_log").insert({
    actor_id: user.id,
    actor_label: user.email,
    action: "invited_candidate",
    target_type: "candidate",
    details: { token_prefix: token.slice(0, 8), name: data.prospectName, source: data.source },
  });

  return {
    ok: true,
    applyUrl: siteUrl(`/apply/${token}`),
    message: "Invitation link created.",
  };
}
