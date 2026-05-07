// Assessment scoring prompt + structured output schema.
// Encodes the same six weighted criteria + recommendation thresholds + red flags
// from the printable Scoring Workbook so the AI's read is comparable to a
// human assessor working from the same rubric.

import type { ScoringRecommendation } from "@/lib/supabase/types";

// ---------- Structured output shape ----------

export interface CriterionScore {
  key:
    | "architecture"
    | "fintech"
    | "legacy"
    | "cloud"
    | "leadership"
    | "communication";
  /** Display label */
  label: string;
  /** Weight (sums to 100 across all 6 criteria) */
  weight: number;
  /** 0-5 score */
  score: number;
  /** Notes citing evidence from the candidate's answers */
  notes: string;
}

export type RedFlagKey =
  | "big_bang_rewrite"
  | "missing_dr_rpo_rto"
  | "microservices_no_rationale"
  | "missing_compliance_audit_data_integrity"
  | "money_as_floats"
  | "no_test_thinking"
  | "weak_resistant_engineer_answer"
  | "weak_db_fragility_answer"
  | "weak_related_party_answer"
  | "weak_bank_deck_conversation_answer"
  | "leadership_examples_solo_ic"
  | "no_aws_migration_experience"
  | "weak_opacity_engagement"
  | "rebuild_back_office_in_house"
  | "dismissive_of_business";

export interface RedFlagFinding {
  key: RedFlagKey;
  description: string;
}

export interface AssessmentScore {
  criterion_scores: CriterionScore[];
  weighted_total: number;
  red_flags: RedFlagFinding[];
  recommendation: ScoringRecommendation;
  strengths: string;
  concerns: string;
  follow_up_questions: string;
  summary: string;
}

// ---------- Prompt ----------

export const SCORING_SYSTEM_PROMPT = `You are an experienced senior technical assessor evaluating a Chief-of-Engineering-level technical assessment for a Senior Technical Officer role at Veri / Gravitas Finance LLC, a Mauritius-FSC-regulated B2B investment administration platform.

Context the candidate was given (so you understand what their answers should reflect):

- Veri serves ~2,500 institutional clients (banks, brokers, asset managers, custodians, pension funds). B2B only.
- The role is hands-on architect-operator hybrid, not a pure leadership role at a 50-engineer company.
- Stack: PHP/Yii2 + Python + Java/Spring Boot + Angular. Mid-modernisation.
- Hosting: DigitalOcean Linux Debian → AWS migration in flight (board-approved 4-phase). ~25 services across 10+ servers.
- Daily cron-driven Opacity data import (back-office processor, related party with cross-shareholding).
- Active projects: PHP 8 upgrade, AWS migration, HA infrastructure, joint applicant form, MPS front-end redesign, etc.
- Compliance is owned by a separate Compliance Officer, not the STO.
- Bank counterparties (e.g. NCBA in Kenya) have been pitched a cloud-native architecture; reality is mid-modernisation. Diplomacy and pacing matter.

You will score the assessment against six weighted criteria, each on a 0-5 scale, weighted to a total out of 100:

1. Technical architecture & system design (weight 25)
2. Fintech / financial systems thinking (weight 20)
3. Legacy modernisation & migration planning (weight 15)
4. Cloud, security, governance & risk (weight 15)
5. Engineering leadership & team management (weight 15)
6. Communication clarity & commercial judgement (weight 10)

Score interpretation per criterion:
- 0: Not addressed or fundamentally wrong
- 1: Poor — generic, evasive, or showing significant gaps
- 2: Below standard — surface-level, recites textbook, no fintech-grade depth
- 3: Meets — sound choices, acknowledges trade-offs, no obvious gaps
- 4: Strong — clear judgement, named alternatives, evidence of having done this kind of work before
- 5: Exceptional — outstanding for THIS role specifically (architect-operator hybrid, bank-as-customer scale, related-party Opacity, mid-modernisation pacing). Reserved.

Weighted total = sum of (score × weight / 5) across the six criteria. Range 0-100.

Recommendation thresholds (guidance, not rigid):
- 80-100 weighted: strong_hire
- 65-79 weighted: hire
- 50-64 weighted: maybe (depends on red flags)
- below 50 weighted: no_hire

Red flags to watch for (any one warrants a structured conversation about whether to proceed; multiple together typically downgrade the recommendation):
- big_bang_rewrite: proposes wholesale rewrite of legacy with no incremental path or rollback strategy
- missing_dr_rpo_rto: omits disaster recovery, RPO/RTO targets, or backup verification from the HA answer
- microservices_no_rationale: prescribes "microservices everywhere" without rationale or migration phasing
- missing_compliance_audit_data_integrity: ignores compliance, audit trail, or financial data integrity
- money_as_floats: section-4 code uses floating-point numbers for monetary amounts (or ignores currency precision)
- no_test_thinking: code submission has no description of how to test it
- weak_resistant_engineer_answer: section-3 answer about a resistant engineer collapses to "performance manage them out" without distinguishing culture-shift from genuine performance issues
- weak_db_fragility_answer: section-5 fragile-DB-vs-fast-release answer either ships without flagging risk or refuses without commercial framing
- weak_related_party_answer: section-5 answer to the related-party Opacity scenario is defensive/naive, missing the bank-counterparty angle
- weak_bank_deck_conversation_answer: section-5 answer about a bank counterparty asking about cloud-native architecture overpromises or denies the gap
- leadership_examples_solo_ic: "leadership" examples are all solo IC work
- no_aws_migration_experience: candidate hasn't run an AWS or comparable cloud migration despite the active 4-phase programme
- weak_opacity_engagement: candidate doesn't engage meaningfully with the related-party Opacity question
- rebuild_back_office_in_house: candidate suggests rebuilding settlement/back-office in-house (Opacity is captive)
- dismissive_of_business: tone in scenarios is consistently dismissive of business stakeholders

Your output: a single tool call to record_score with the structured assessment. Be honest and specific. Cite the candidate's actual answers. Avoid generic praise or generic criticism.

Return ONLY the tool call — no other text.`;

export const SCORING_TOOL = {
  name: "record_score",
  description:
    "Record the structured assessment score for a candidate. Call exactly once.",
  input_schema: {
    type: "object" as const,
    properties: {
      criterion_scores: {
        type: "array",
        description:
          "Exactly 6 entries, one for each weighted criterion. Score each 0-5. Notes must cite evidence from the candidate's answers.",
        items: {
          type: "object",
          properties: {
            key: {
              type: "string",
              enum: [
                "architecture",
                "fintech",
                "legacy",
                "cloud",
                "leadership",
                "communication",
              ],
            },
            label: { type: "string" },
            weight: { type: "number" },
            score: { type: "number", minimum: 0, maximum: 5 },
            notes: {
              type: "string",
              description:
                "1-2 paragraphs citing evidence from the candidate's answers. Reference section numbers where relevant.",
            },
          },
          required: ["key", "label", "weight", "score", "notes"],
        },
      },
      weighted_total: {
        type: "number",
        description:
          "Sum of (score × weight / 5) across the six criteria. Range 0-100.",
      },
      red_flags: {
        type: "array",
        description:
          "List of red flags that genuinely apply. Empty array if none. Each entry includes a brief description of how the flag manifested.",
        items: {
          type: "object",
          properties: {
            key: {
              type: "string",
              enum: [
                "big_bang_rewrite",
                "missing_dr_rpo_rto",
                "microservices_no_rationale",
                "missing_compliance_audit_data_integrity",
                "money_as_floats",
                "no_test_thinking",
                "weak_resistant_engineer_answer",
                "weak_db_fragility_answer",
                "weak_related_party_answer",
                "weak_bank_deck_conversation_answer",
                "leadership_examples_solo_ic",
                "no_aws_migration_experience",
                "weak_opacity_engagement",
                "rebuild_back_office_in_house",
                "dismissive_of_business",
              ],
            },
            description: {
              type: "string",
              description:
                "1-2 sentences quoting or paraphrasing the candidate's answer that triggered the flag.",
            },
          },
          required: ["key", "description"],
        },
      },
      recommendation: {
        type: "string",
        enum: ["strong_hire", "hire", "maybe", "no_hire"],
        description:
          "Headline recommendation. Should align with weighted total but a serious red flag may downgrade.",
      },
      strengths: {
        type: "string",
        description: "Top 3 strengths, as a numbered list. 1-2 sentences each, citing evidence.",
      },
      concerns: {
        type: "string",
        description: "Top 3 concerns or gaps, as a numbered list. 1-2 sentences each, citing evidence.",
      },
      follow_up_questions: {
        type: "string",
        description:
          "5 targeted follow-up questions for the live finalist round, as a numbered list. Focused on resolving the gaps or red flags identified.",
      },
      summary: {
        type: "string",
        description:
          "One-paragraph summary of the candidate suitable for a busy chairman to read in 30 seconds. Honest, specific, commercially-minded.",
      },
    },
    required: [
      "criterion_scores",
      "weighted_total",
      "red_flags",
      "recommendation",
      "strengths",
      "concerns",
      "follow_up_questions",
      "summary",
    ],
  },
};
