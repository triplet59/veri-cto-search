// Displays the AI screening result on the candidate detail page.
// Read-only for v1 — admin override controls come in a follow-up.

import { formatDateTime } from "@/lib/utils";
import type { ScreeningRecommendation } from "@/lib/supabase/types";
import type {
  FitSignal,
  RedFlag,
  FitSignalRating,
} from "@/lib/prompts/cv-screening";

interface Screening {
  background_snapshot: string;
  fit_signals: FitSignal[] | null;
  red_flags: RedFlag[] | null;
  recommendation: ScreeningRecommendation | null;
  rationale: string | null;
  follow_up_questions: string | null;
  model_used: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  screened_at: string;
}

const REC_LABEL: Record<ScreeningRecommendation, string> = {
  strong_proceed: "Strong proceed",
  proceed: "Proceed",
  phone_screen_first: "Phone screen first",
  decline: "Decline",
};

const REC_TONE: Record<ScreeningRecommendation, string> = {
  strong_proceed: "bg-veri-ok/15 text-veri-ok border-veri-ok/40",
  proceed: "bg-veri-blue/15 text-veri-glow border-veri-blue/40",
  phone_screen_first: "bg-veri-warn/15 text-veri-warn border-veri-warn/40",
  decline: "bg-veri-err/15 text-veri-err border-veri-err/40",
};

const RATING_TONE: Record<FitSignalRating, string> = {
  absent: "bg-veri-line text-veri-mute",
  weak: "bg-veri-err/15 text-veri-err",
  present: "bg-veri-blue/15 text-veri-glow",
  strong: "bg-veri-ok/15 text-veri-ok",
};

const RATING_LABEL: Record<FitSignalRating, string> = {
  absent: "Absent",
  weak: "Weak",
  present: "Present",
  strong: "Strong",
};

const RED_FLAG_LABEL: Record<string, string> = {
  resume_inflation: "Resume inflation",
  no_fintech: "No fintech experience",
  no_regulated_env: "No regulated-environment experience",
  no_cloud: "No cloud experience",
  no_aws: "No AWS specifically",
  pure_leadership: "Pure leadership, no hands-on",
  job_hopping: "Job-hopping pattern",
  career_level_mismatch: "Career-level mismatch",
  stack_mismatch_no_php: "Stack mismatch (no PHP)",
  no_dr_compliance_audit: "No DR/compliance/audit signal",
  geo_timezone: "Geographic / time-zone concern",
  adjacent_not_fintech: "Adjacent-but-not-fintech",
};

export function ScreeningDisplay({ screening }: { screening: Screening }) {
  const rec = screening.recommendation;

  return (
    <div className="space-y-6">
      {/* Recommendation banner */}
      {rec && (
        <div
          className={`veri-card border-2 p-5 ${REC_TONE[rec]}`}
        >
          <p className="text-xs uppercase tracking-wider mb-1 opacity-80">
            AI screening recommendation
          </p>
          <p className="text-2xl font-semibold">{REC_LABEL[rec]}</p>
        </div>
      )}

      {/* Background snapshot */}
      {screening.background_snapshot && (
        <Block title="Background snapshot">
          <p className="text-veri-text leading-relaxed whitespace-pre-wrap">
            {screening.background_snapshot}
          </p>
        </Block>
      )}

      {/* Fit signals */}
      {screening.fit_signals && screening.fit_signals.length > 0 && (
        <Block title="Fit signals">
          <div className="overflow-hidden rounded-xl border border-veri-line">
            <table className="w-full text-sm">
              <thead className="bg-veri-ink/40 border-b border-veri-line">
                <tr className="text-left text-veri-mute uppercase tracking-wider text-xs">
                  <th className="px-4 py-2.5">Signal</th>
                  <th className="px-4 py-2.5 w-24">Rating</th>
                  <th className="px-4 py-2.5">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {screening.fit_signals.map((s, i) => (
                  <tr key={i} className="border-t border-veri-line align-top">
                    <td className="px-4 py-3 text-veri-text font-medium">
                      {s.label}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${RATING_TONE[s.rating]}`}
                      >
                        {RATING_LABEL[s.rating]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-veri-subtle">
                      <p>{s.evidence}</p>
                      {s.notes && (
                        <p className="text-veri-mute text-xs mt-1 italic">
                          {s.notes}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Block>
      )}

      {/* Red flags */}
      {screening.red_flags && screening.red_flags.length > 0 && (
        <Block title="Red flags">
          <ul className="space-y-2">
            {screening.red_flags.map((rf, i) => (
              <li
                key={i}
                className="rounded-xl border border-veri-err/30 bg-veri-err/5 px-4 py-3"
              >
                <p className="text-veri-err font-medium text-sm">
                  {RED_FLAG_LABEL[rf.key] || rf.key}
                </p>
                <p className="text-veri-subtle text-sm mt-1">
                  {rf.description}
                </p>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {/* Rationale */}
      {screening.rationale && (
        <Block title="Rationale">
          <p className="text-veri-text leading-relaxed whitespace-pre-wrap">
            {screening.rationale}
          </p>
        </Block>
      )}

      {/* Follow-up questions */}
      {screening.follow_up_questions && (
        <Block title="Follow-up questions for phone screen">
          <p className="text-veri-text leading-relaxed whitespace-pre-wrap">
            {screening.follow_up_questions}
          </p>
        </Block>
      )}

      {/* Metadata */}
      <p className="text-veri-mute text-xs">
        Screened {formatDateTime(screening.screened_at)}
        {screening.model_used && ` · ${screening.model_used}`}
        {screening.input_tokens !== null &&
          ` · ${screening.input_tokens.toLocaleString()} input + ${(
            screening.output_tokens ?? 0
          ).toLocaleString()} output tokens`}
      </p>
    </div>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="veri-card p-6">
      <h3 className="text-veri-mute uppercase tracking-wider text-xs font-medium mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function ScreeningPending() {
  return (
    <div className="veri-card p-6 border-veri-warn/30">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-veri-warn animate-pulse" />
        <p className="text-veri-text">AI screening in progress…</p>
      </div>
      <p className="text-veri-mute text-xs mt-2">
        Reading the CV and running the rubric. Usually completes within 30–60
        seconds. Refresh this page to check.
      </p>
    </div>
  );
}

export function ScreeningNotStarted() {
  return (
    <div className="veri-card p-6 border-veri-line">
      <p className="text-veri-mute text-sm">
        AI screening hasn't run for this candidate yet. It triggers
        automatically when the application is submitted; if you're seeing this
        on a candidate who has applied, the background trigger may have failed
        — try refreshing in a minute, or re-trigger manually.
      </p>
    </div>
  );
}
