import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import { formatDateTime, formatDate } from "@/lib/utils";
import {
  ScreeningDisplay,
  ScreeningPending,
  ScreeningNotStarted,
} from "@/components/admin/screening-display";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const ssr = await createServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect("/admin/login");
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.length > 0 && !adminEmails.includes(user.email?.toLowerCase() || "")) {
    await ssr.auth.signOut();
    redirect("/admin/login");
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CandidateDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: candidate }, { data: cv }, { data: screening }] = await Promise.all([
    supabase.from("candidates").select("*").eq("id", id).maybeSingle(),
    supabase.from("cv_uploads").select("*").eq("candidate_id", id).order("uploaded_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("screenings").select("*").eq("candidate_id", id).order("screened_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (!candidate) notFound();

  // Generate a signed URL for the CV (10 minute window)
  let cvSignedUrl: string | null = null;
  if (cv?.storage_path) {
    const { data } = await supabase.storage
      .from("cv-uploads")
      .createSignedUrl(cv.storage_path, 600);
    cvSignedUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="space-y-8">
      <Link href="/admin" className="text-veri-subtle text-sm hover:text-veri-text">← Back to pipeline</Link>

      <div>
        <p className="veri-eyebrow mb-2">Candidate</p>
        <h1 className="veri-h1">{candidate.full_name ?? "Pending application"}</h1>
        <p className="text-veri-subtle mt-2">
          Status: <span className="text-veri-text">{candidate.status.replace(/_/g, " ")}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Block title="Contact">
          <KV label="Email" value={candidate.email} />
          <KV label="Phone" value={candidate.phone_country_code && candidate.phone_number ? `${candidate.phone_country_code} ${candidate.phone_number}` : null} />
          <KV label="Country" value={candidate.country_of_residence} />
          <KV label="LinkedIn" value={candidate.linkedin_url} link />
        </Block>

        <Block title="Current role">
          <KV label="Position" value={candidate.current_position} />
          <KV label="Employer" value={candidate.current_employer} />
        </Block>

        <Block title="Compensation & availability">
          <KV
            label="Salary expectancy"
            value={candidate.salary_expectancy_usd ? `$${Number(candidate.salary_expectancy_usd).toLocaleString()} USD` : null}
          />
          <KV label="Available start" value={formatDate(candidate.available_start_date)} />
          <KV label="Notice period" value={candidate.notice_period_text} />
        </Block>

        <Block title="Sourcing">
          <KV label="Source" value={candidate.source} />
          <KV label="Notes" value={candidate.source_notes} />
        </Block>
      </div>

      <Block title="CV">
        {cv ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-veri-text">{cv.file_name}</p>
              <p className="text-veri-mute text-xs mt-0.5">
                Uploaded {formatDateTime(cv.uploaded_at)} · {Math.round((cv.file_size_bytes || 0) / 1024)} KB
              </p>
            </div>
            {cvSignedUrl && (
              <a href={cvSignedUrl} target="_blank" rel="noreferrer" className="veri-btn-ghost">
                Open CV
              </a>
            )}
          </div>
        ) : (
          <p className="text-veri-mute text-sm">No CV uploaded yet.</p>
        )}
      </Block>

      {/* AI Screening */}
      <div>
        <h2 className="veri-h2 mb-4">AI screening</h2>
        {screening ? (
          <ScreeningDisplay screening={screening} />
        ) : candidate.status === "screening" ? (
          <ScreeningPending />
        ) : (
          <ScreeningNotStarted />
        )}
      </div>

      <Block title="Funnel timeline">
        <KV label="Invited" value={formatDateTime(candidate.invited_at)} />
        <KV label="Applied" value={formatDateTime(candidate.applied_at)} />
        <KV label="Screened" value={formatDateTime(candidate.screened_at)} />
        <KV label="Assessment sent" value={formatDateTime(candidate.assessment_sent_at)} />
        <KV label="Assessment submitted" value={formatDateTime(candidate.assessment_submitted_at)} />
        <KV label="Scored" value={formatDateTime(candidate.scored_at)} />
      </Block>

      {candidate.admin_notes && (
        <Block title="Admin notes">
          <p className="text-veri-subtle whitespace-pre-wrap">{candidate.admin_notes}</p>
        </Block>
      )}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="veri-card p-6">
      <h3 className="text-veri-mute uppercase tracking-wider text-xs font-medium mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function KV({ label, value, link }: { label: string; value: string | null | undefined; link?: boolean }) {
  if (!value) {
    return (
      <div className="flex items-baseline gap-3">
        <span className="text-veri-mute text-sm w-32 shrink-0">{label}</span>
        <span className="text-veri-mute text-sm">—</span>
      </div>
    );
  }
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-veri-mute text-sm w-32 shrink-0">{label}</span>
      {link ? (
        <a href={value} target="_blank" rel="noreferrer" className="veri-link text-sm break-all">{value}</a>
      ) : (
        <span className="text-veri-text text-sm">{value}</span>
      )}
    </div>
  );
}
