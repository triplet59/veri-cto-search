"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";

const ApplicationSchema = z.object({
  candidateId: z.string().uuid(),
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  phoneCountryCode: z.string().regex(/^\+\d{1,4}$/, "Country code must look like +230"),
  phoneNumber: z.string().min(4).max(20),
  currentPosition: z.string().min(2).max(160),
  currentEmployer: z.string().min(1).max(160),
  countryOfResidence: z.string().min(2).max(80),
  salaryExpectancyUsd: z.coerce.number().min(0).max(5_000_000),
  availableStartDate: z.string().min(4).max(40), // free-form date string for flexibility
  noticePeriodText: z.string().max(200).optional().nullable(),
  linkedinUrl: z.string().url().optional().or(z.literal("")).nullable(),
});

export type ApplicationFormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

export async function submitApplication(
  _prev: ApplicationFormState,
  formData: FormData,
): Promise<ApplicationFormState> {
  const raw = Object.fromEntries(formData.entries());

  const parsed = ApplicationSchema.safeParse({
    candidateId: raw.candidateId,
    fullName: raw.fullName,
    email: raw.email,
    phoneCountryCode: raw.phoneCountryCode,
    phoneNumber: raw.phoneNumber,
    currentPosition: raw.currentPosition,
    currentEmployer: raw.currentEmployer,
    countryOfResidence: raw.countryOfResidence,
    salaryExpectancyUsd: raw.salaryExpectancyUsd,
    availableStartDate: raw.availableStartDate,
    noticePeriodText: raw.noticePeriodText || null,
    linkedinUrl: raw.linkedinUrl || null,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = String(issue.path[0] ?? "_");
      if (!fieldErrors[k]) fieldErrors[k] = issue.message;
    }
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors,
    };
  }

  const data = parsed.data;
  const supabase = createAdminClient();

  // Validate the CV file
  const cvFile = formData.get("cvFile");
  if (!(cvFile instanceof File) || cvFile.size === 0) {
    return { ok: false, message: "Please attach your CV." };
  }
  if (cvFile.size > 10 * 1024 * 1024) {
    return { ok: false, message: "CV file is too large (10MB max)." };
  }
  const allowed = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ];
  if (!allowed.includes(cvFile.type)) {
    return { ok: false, message: "Please upload your CV as a PDF or Word document." };
  }

  // Upload CV to Supabase Storage
  const ext = cvFile.name.split(".").pop()?.toLowerCase() || "pdf";
  const storagePath = `${data.candidateId}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await cvFile.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from("cv-uploads")
    .upload(storagePath, buffer, {
      contentType: cvFile.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("CV upload failed:", uploadError);
    return { ok: false, message: "Failed to upload CV. Please try again." };
  }

  // Insert CV upload record
  await supabase.from("cv_uploads").insert({
    candidate_id: data.candidateId,
    storage_path: storagePath,
    file_name: cvFile.name,
    mime_type: cvFile.type,
    file_size_bytes: cvFile.size,
  });

  // Update the candidate row with the application data
  const { error: updateError } = await supabase
    .from("candidates")
    .update({
      full_name: data.fullName,
      email: data.email.toLowerCase().trim(),
      phone_country_code: data.phoneCountryCode,
      phone_number: data.phoneNumber.trim(),
      current_position: data.currentPosition,
      current_employer: data.currentEmployer,
      country_of_residence: data.countryOfResidence,
      salary_expectancy_usd: data.salaryExpectancyUsd,
      available_start_date: parseDateOrNull(data.availableStartDate),
      notice_period_text: data.noticePeriodText,
      linkedin_url: data.linkedinUrl,
      status: "applied",
      applied_at: new Date().toISOString(),
    })
    .eq("id", data.candidateId);

  if (updateError) {
    console.error("Candidate update failed:", updateError);
    return { ok: false, message: "Failed to save application. Please try again." };
  }

  // Audit log
  await supabase.from("audit_log").insert({
    actor_label: "candidate",
    action: "submitted_application",
    target_type: "candidate",
    target_id: data.candidateId,
    details: { storage_path: storagePath, file_name: cvFile.name },
  });

  redirect("/apply/done");
}

function parseDateOrNull(s: string): string | null {
  // Best-effort — accept ISO or common UK / US formats.
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}
