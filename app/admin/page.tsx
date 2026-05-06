import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import type { CandidateStatus } from "@/lib/supabase/types";

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
  return user;
}

const STATUS_LABEL: Record<CandidateStatus, string> = {
  invited: "Invited",
  applied: "Applied",
  screening: "Screening",
  screened: "Screened",
  rejected_at_cv: "Rejected (CV)",
  assessment_sent: "Assessment sent",
  assessment_started: "Assessment in progress",
  assessment_submitted: "Assessment submitted",
  scoring: "Scoring",
  scored: "Scored",
  shortlisted: "Shortlisted",
  offer: "Offer",
  declined: "Declined",
  archived: "Archived",
};

const STATUS_TONE: Record<CandidateStatus, string> = {
  invited: "bg-veri-line text-veri-subtle",
  applied: "bg-veri-blue/15 text-veri-glow",
  screening: "bg-veri-warn/15 text-veri-warn",
  screened: "bg-veri-blue/15 text-veri-glow",
  rejected_at_cv: "bg-veri-err/15 text-veri-err",
  assessment_sent: "bg-veri-blue/15 text-veri-glow",
  assessment_started: "bg-veri-warn/15 text-veri-warn",
  assessment_submitted: "bg-veri-blue/20 text-veri-glow",
  scoring: "bg-veri-warn/15 text-veri-warn",
  scored: "bg-veri-ok/15 text-veri-ok",
  shortlisted: "bg-veri-ok/15 text-veri-ok",
  offer: "bg-veri-ok/20 text-veri-ok",
  declined: "bg-veri-err/15 text-veri-err",
  archived: "bg-veri-line text-veri-mute",
};

export default async function AdminDashboard() {
  await requireAdmin();
  const supabase = createAdminClient();
  const { data: candidates, error } = await supabase
    .from("candidates")
    .select(
      "id, full_name, email, country_of_residence, current_position, current_employer, status, invited_at, applied_at",
    )
    .order("invited_at", { ascending: false })
    .limit(200);

  if (error) {
    return <ErrorPanel message={error.message} />;
  }

  const list = candidates ?? [];

  const stats = list.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="veri-eyebrow mb-2">CTO Search</p>
          <h1 className="veri-h1">Pipeline</h1>
          <p className="text-veri-subtle mt-2">
            {list.length} candidate{list.length === 1 ? "" : "s"} across the funnel.
          </p>
        </div>
        <Link href="/admin/invite" className="veri-btn-primary">+ Invite candidate</Link>
      </div>

      {list.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(["invited", "applied", "screened", "scored"] as CandidateStatus[]).map((s) => (
            <div key={s} className="veri-card p-4">
              <p className="text-veri-mute text-xs uppercase tracking-wider mb-1">{STATUS_LABEL[s]}</p>
              <p className="text-veri-text text-2xl font-semibold">{stats[s] ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="veri-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-veri-ink/40 border-b border-veri-line">
              <tr className="text-left text-veri-mute uppercase tracking-wider text-xs">
                <th className="px-5 py-3">Candidate</th>
                <th className="px-5 py-3">Current role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Invited</th>
                <th className="px-5 py-3">Applied</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="border-t border-veri-line hover:bg-veri-ink/30">
                  <td className="px-5 py-4">
                    <Link href={`/admin/candidates/${c.id}`} className="block">
                      <span className="text-veri-text font-medium">
                        {c.full_name ?? <em className="text-veri-mute">Pending application</em>}
                      </span>
                      {c.email && (
                        <span className="block text-veri-mute text-xs mt-0.5">{c.email}</span>
                      )}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-veri-subtle">
                    {c.current_position
                      ? <>{c.current_position}{c.current_employer ? <span className="text-veri-mute"> @ {c.current_employer}</span> : null}</>
                      : <span className="text-veri-mute">—</span>}
                    {c.country_of_residence && (
                      <span className="block text-veri-mute text-xs mt-0.5">{c.country_of_residence}</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_TONE[c.status as CandidateStatus]}`}
                    >
                      {STATUS_LABEL[c.status as CandidateStatus]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-veri-mute text-xs">{formatDateTime(c.invited_at)}</td>
                  <td className="px-5 py-4 text-veri-mute text-xs">{formatDateTime(c.applied_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="veri-card p-10 text-center">
      <h2 className="veri-h2 mb-3">No candidates yet</h2>
      <p className="text-veri-subtle mb-6">
        Send your first invitation to start the pipeline.
      </p>
      <Link href="/admin/invite" className="veri-btn-primary">Invite candidate</Link>
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="veri-card border-veri-err/40 p-6">
      <p className="text-veri-err font-medium">Failed to load candidates.</p>
      <p className="text-veri-mute text-sm mt-2">{message}</p>
    </div>
  );
}
