// Hand-authored types matching the schema in supabase/migrations/.
// Can be regenerated via `supabase gen types typescript` once the CLI is wired up.

export type CandidateStatus =
  | "invited"
  | "applied"
  | "screening"
  | "screened"
  | "rejected_at_cv"
  | "assessment_sent"
  | "assessment_started"
  | "assessment_submitted"
  | "scoring"
  | "scored"
  | "shortlisted"
  | "offer"
  | "declined"
  | "archived";

export type ScreeningRecommendation =
  | "strong_proceed"
  | "proceed"
  | "phone_screen_first"
  | "decline";

export type ScoringRecommendation = "strong_hire" | "hire" | "maybe" | "no_hire";

export interface Candidate {
  id: string;
  apply_token: string;
  assessment_token: string | null;
  full_name: string | null;
  email: string | null;
  phone_country_code: string | null;
  phone_number: string | null;
  current_position: string | null;
  current_employer: string | null;
  country_of_residence: string | null;
  salary_expectancy_usd: number | null;
  available_start_date: string | null;
  notice_period_text: string | null;
  linkedin_url: string | null;
  status: CandidateStatus;
  invited_by: string | null;
  source: string | null;
  source_notes: string | null;
  invited_at: string;
  applied_at: string | null;
  screened_at: string | null;
  assessment_sent_at: string | null;
  assessment_started_at: string | null;
  assessment_submitted_at: string | null;
  scored_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CvUpload {
  id: string;
  candidate_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number | null;
  uploaded_at: string;
}
