// Displays the AI assessment score on the candidate detail page.

import { formatDateTime } from "@/lib/utils";
import type { ScoringRecommendation } from "@/lib/supabase/types";
import type {
  CriterionScore,
  RedFlagFinding,
  RedFlagKey,
} from "@/lib/prompts/assessment-scoring";

interface Score {
  weighted_total: number | null;
  score_architecture: number | null;
  score_fintech: number | null;
  score_legacy: number | null;
  score_cloud: number | null;
  score_leadership: number | null;
  score_communication: number | null;
  criterion_notes: CriterionScore[] | null;
  red_flags: RedFlagFinding[] | null;
  recommendation: ScoringRecommendation | null;
  strengths: string | null;
  concerns: string | null;
  follow_up_questions: string | null;
  summary: string | null;
  model_used: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  scored_at: string;
}

const REC_LABEL: Record<ScoringRecommendation, string> = {
  strong_hire: "Strong hire",
  hire: "Hire",
  maybe: "Maybe",
  no_hire: "No hire",
};

const REC_TONE: Record<ScoringRecommendation, string> = {
  strong_hire: "bg-veri-ok/15 text-veri-ok border-veri-ok/40",
  hire: "bg-veri-blue/15 text-veri-glow border-veri-blue/40",
  maybe: "bg-veri-warn/15 text-veri-warn border-veri-warn/40",
  no_hire: "bg-veri-err/15 text-veri-err border-veri-err/40",
};

const RED_FLAG_LABEL: Record<RedFlagKey, string> = {
  big_bang_rewrite: "Big-bang rewrite proposed",
  missing_dr_rpo_rto: "DR / RPO / RTO not addressed",
  microservices_no_rationale: "Microservices without rationale",
  missing_compliance_audit_data_integrity: "Missing compliance / audit / data integrity",
  money_as_floats: "Money handled as floats",
  no_test_thinking: "No test thinking in code",
  weak_resistant_engineer_answer: "Weak handling of resistant engineer scenario",
  weak_db_fragility_answer: "Weak DB-fragility-vs-fast-release answer",
  weak_related_party_answer: "Weak answer to related-party scenario",
  weak_bank_deck_conversation_answer: "Weak handling of bank-deck credibility-gap scenario",
  leadership_examples_solo_ic: "'Leadership' examples are solo IC work",
  no_aws_migration_experience: "No AWS migration experience",
  weak_opacity_engagement: "Doesn't engage with Opacity scenario meaningfully",
  rebuild_back_office_in_house: "Suggests rebuilding back-office in-house",
  dismissive_of_business: "Dismissive of business stakeholders",
};

const CRITERION_LABEL: Record<string, string> = {
  architecture: "Technical architecture & system design",
  fintech: "Fintech / financial systems thinking",
  legacy: "Legacy modernisation & migration planning",
  cloud: "Cloud, security, governance & risk",
  leadership: "Engineering leadership & team management",
  communication: "Communication clarity & commercial judgement",
};

const CRITERION_WEIGHT: Record<string, number> = {
  architecture: 25,
  fintech: 20,
  legacy: 15,
  cloud: 15,
  leadership: 15,
  communication: 10,
};

export function ScoreDisplay({ score }: { score: Score }) {
  const rec = score.recommendation;
  const total = score.weighted_total ?? 0;

  return (
    <div className="space-y-6">
      {/* Headline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rec && (
          <div className={`veri-card border-2 p-5 col-span-1 ${REC_TONE[rec]}`}>
            <p className="text-xs uppercase tracking-wider mb-1 opacity-80">Recommendation</p>
            <p className="text-2xl font-semibold">{REC_LABEL[rec]}</p>
          </div>
        )}
        <div className="veri-card p-5 col-span-1">
          <p className="text-xs uppercase tracking-wider mb-1 text-veri-mute">Weighted total</p>
          <p className="text-3xl font-semibold text-veri-text">{total.toFixed(1)}<span className="text-veri-mute text-lg">/100</span></p>
        </div>
        <div className="veri-card p-5 col-span-1">
          <p className="text-xs uppercase tracking-wider mb-1 text-veri-mute">Red flags</p>
          <p className="text-3xl font-semibold text-veri-text">{score.red_flags?.length ?? 0}</p>
        </div>
      </div>

      {/* Summary */}
      {score.summary && (
        <Block title="Summary">
          <p className="text-veri-text leading-relaxed whitespace-pre-wrap">{score.summary}</p>
        </Block>
      )}

      {/* Criterion scores */}
      {score.criterion_notes && score.criterion_notes.length > 0 && (
        <Block title="Weighted criterion scores">
          <div className="overflow-hidden rounded-xl border border-veri-line">
            <table className="w-full text-sm">
              <thead className="bg-veri-ink/40 border-b border-veri-line">
                <tr className="text-left text-veri-mute uppercase tracking-wider text-xs">
                  <th className="px-4 py-2.5">Criterion</th>
                  <th className="px-4 py-2.5 w-20 text-center">Weight</th>
                  <th className="px-4 py-2.5 w-20 text-center">Score</th>
                  <th className="px-4 py-2.5 w-28 text-center">Weighted</th>
                  <th className="px-4 py-2.5">Notes</th>
                </tr>
              </thead>
              <tbody>
                {score.criterion_notes.map((c, i) => {
                  const weighted = (c.score * c.weight) / 5;
                  return (
                    <tr key={i} className="border-t border-veri-line align-top">
                      <td className="px-4 py-3 text-veri-text font-medium">{CRITERION_LABEL[c.key] ?? c.label}</td>
                      <td className="px-4 py-3 text-center text-veri-subtle">{c.weight}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block rounded-full bg-veri-blue/15 text-veri-glow px-2 py-0.5 text-xs font-medium">
                          {c.score}/5
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-veri-text">{weighted.toFixed(1)}</td>
                      <td className="px-4 py-3 text-veri-subtle">{c.notes}</td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-veri-blue/40 bg-veri-ink/40">
                  <td className="px-4 py-3 text-veri-text font-medium" colSpan={3}>Total</td>
                  <td className="px-4 py-3 text-center text-veri-text font-semibold text-lg">{total.toFixed(1)}</td>
                  <td className="px-4 py-3 text-veri-mute text-xs">Out of 100</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Block>
      )}

      {/* Red flags */}
      {score.red_flags && score.red_flags.length > 0 && (
        <Block title="Red flags">
          <ul className="space-y-2">
            {score.red_flags.map((rf, i) => (
              <li key={i} className="rounded-xl border border-veri-err/30 bg-veri-err/5 px-4 py-3">
                <p className="text-veri-err font-medium text-sm">
                  {RED_FLAG_LABEL[rf.key] ?? rf.key}
                </p>
                <p className="text-veri-subtle text-sm mt-1">{rf.description}</p>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {/* Strengths */}
      {score.strengths && (
        <Block title="Strengths">
          <p className="text-veri-text leading-relaxed whitespace-pre-wrap">{score.strengths}</p>
        </Block>
      )}

      {/* Concerns */}
      {score.concerns && (
        <Block title="Concerns / gaps">
          <p className="text-veri-text leading-relaxed whitespace-pre-wrap">{score.concerns}</p>
        </Block>
      )}

      {/* Follow-up */}
      {score.follow_up_questions && (
        <Block title="Follow-up questions for the live round">
          <p className="text-veri-text leading-relaxed whitespace-pre-wrap">{score.follow_up_questions}</p>
        </Block>
      )}

      <p className="text-veri-mute text-xs">
        Scored {formatDateTime(score.scored_at)}
        {score.model_used && ` · ${score.model_used}`}
        {score.input_tokens !== null &&
          ` · ${(score.input_tokens ?? 0).toLocaleString()} input + ${(score.output_tokens ?? 0).toLocaleString()} output tokens`}
      </p>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="veri-card p-6">
      <h3 className="text-veri-mute uppercase tracking-wider text-xs font-medium mb-3">{title}</h3>
      {children}
    </div>
  );
}

export function ScoringPending() {
  return (
    <div className="veri-card p-6 border-veri-warn/30">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-veri-warn animate-pulse" />
        <p className="text-veri-text">AI scoring in progress…</p>
      </div>
      <p className="text-veri-mute text-xs mt-2">
        Reading all five sections and applying the rubric. Usually completes within
        30–60 seconds. Refresh to check.
      </p>
    </div>
  );
}
// Suppress unused-import lint for CRITERION_WEIGHT in case future renderers use it.
void CRITERION_WEIGHT;
