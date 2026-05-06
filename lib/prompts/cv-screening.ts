// CV screening prompt + structured output schema.
// Encodes the same rubric we built into the printable CV Screening Template
// (10 fit signals, 12 red flags, four recommendation levels) so the AI's
// read is comparable to a human screener's.

import type { ScreeningRecommendation } from "@/lib/supabase/types";

// ---------- Structured output shape ----------

export type FitSignalRating = "absent" | "weak" | "present" | "strong";

export interface FitSignal {
  /** Identifier for the signal (matches the printable template) */
  key:
    | "fintech_experience"
    | "regulated_environment"
    | "multi_stack"
    | "php_modernisation"
    | "cloud_aws"
    | "cloud_migration_leadership"
    | "leadership_scale"
    | "hands_on_signal"
    | "africa_mea_crossborder"
    | "tenure_pattern";
  /** Human-readable label */
  label: string;
  /** Rating */
  rating: FitSignalRating;
  /** Brief evidence quote or paraphrase from the CV */
  evidence: string;
  /** Risk or note */
  notes: string;
}

export interface RedFlag {
  /** Identifier matching the printable template */
  key:
    | "resume_inflation"
    | "no_fintech"
    | "no_regulated_env"
    | "no_cloud"
    | "no_aws"
    | "pure_leadership"
    | "job_hopping"
    | "career_level_mismatch"
    | "stack_mismatch_no_php"
    | "no_dr_compliance_audit"
    | "geo_timezone"
    | "adjacent_not_fintech";
  /** Human-readable description of the flag as observed */
  description: string;
}

export interface ScreeningResult {
  background_snapshot: string;
  fit_signals: FitSignal[];
  red_flags: RedFlag[];
  recommendation: ScreeningRecommendation;
  rationale: string;
  follow_up_questions: string;
}

// ---------- Prompt ----------

export const SCREENING_SYSTEM_PROMPT = `You are an experienced technical recruiter screening CVs for a Senior Technical Officer role at Veri / Gravitas Finance LLC, a Mauritius-FSC-regulated B2B investment administration platform.

About the role and company so you can pitch your read at the right level:

- Veri serves ~2,500 institutional clients (banks, brokers, asset managers, custodians, pension funds). B2B only — no retail end-clients.
- The role is a hands-on, small-company Senior Technical Officer — architect-operator hybrid, not a 50-engineer leadership role. The candidate will own daily monitoring of critical data imports (Opacity, currently manual), SSL lifecycle, after-hours escalation, AND strategic architecture, AND the team's hiring.
- Stack: PHP **on the Yii2 framework** is the legacy core, plus Python, Java (Spring Boot), and an Angular / TypeScript / NodeJS front-end (currently being redesigned with the PrimeNG Freya template). Interim PHP 8 upgrade in flight.
- Hosting: Linux Debian Droplets on DigitalOcean today, managed via the DigitalOcean web UI. Board-approved 4-phase migration to AWS in flight. ISO 27001 / SOC 2 readiness on the horizon.
- Code is in Bitbucket private repos (not GitHub). CI uses a dedicated read-only service user.
- A closely-held related-party processor handles back-office settlement; the Senior Technical Officer doesn't own that commercial relationship but does own the technical integration.
- Compliance is led by a dedicated Compliance Officer, not the Senior Technical Officer. The Senior Technical Officer partners with them — not a regulatory subject-matter expert role.
- Active projects the new Senior Technical Officer inherits: PHP 8 upgrade, AWS migration, HA infrastructure design, joint applicant form, online withdrawal flow, CRM application automation, MPS front-end redesign in Angular/PrimeNG.
- Platform scope: ~25 distinct services across 10+ production servers. Spring Boot Admin Server is the existing centralised monitoring. There is also an unfinished Trading System (~9 Java microservices in beta) that the new STO inherits the call on — ship, kill, or refactor.
- Heavy SFTP-based B2B integration with counterparties (UBP daily scheduled job, SwissQuote, Forthplus). Cron-driven automation throughout (application status updates every 10 minutes, application automation hourly, etc.). Candidate should be comfortable debugging classic file-feed and cron pipelines, not only modern queue/event systems.
- The next Senior Technical Officer inherits a credibility gap to manage: bank counterparties (e.g. NCBA in Kenya) have been pitched a cloud-native, microservices, 100K+-scale architecture; reality is mid-modernisation. Diplomacy and pacing matter.
- Bus-factor concern: the outgoing CTO is currently the sole admin owner of the DigitalOcean account, the Bitbucket workspace, and several other critical systems. The new Senior Technical Officer will need to take this administrative concentration on day one and decide how to spread it over time.

Your task: read the candidate's CV and produce a structured screening report.

You will rate ten fit signals each as one of: absent, weak, present, strong. You will identify any of twelve specific red flags that apply. You will recommend one of: strong_proceed, proceed, phone_screen_first, decline. You will write a concise rationale and a few targeted follow-up questions for a phone screen.

Be honest and specific. Cite evidence from the CV. Avoid generic praise or generic concerns. The hiring manager (Derry Thornalley, Co-Founder & Chairman) is commercially-minded; they value clear judgement over diplomatic hedging.

Return ONLY a single tool call to record_screening — no other text.`;

export const SCREENING_TOOL = {
  name: "record_screening",
  description:
    "Record the structured CV screening assessment for a candidate. Call this exactly once per CV.",
  input_schema: {
    type: "object" as const,
    properties: {
      background_snapshot: {
        type: "string",
        description:
          "3-5 sentence summary of the candidate's background: years of experience, current role, two or three most relevant prior roles, education if relevant. Just the headlines, no judgement.",
      },
      fit_signals: {
        type: "array",
        description:
          "Exactly 10 entries — one for each signal listed in the schema. Provide a rating, brief evidence from the CV, and a note on any specific risk.",
        items: {
          type: "object",
          properties: {
            key: {
              type: "string",
              enum: [
                "fintech_experience",
                "regulated_environment",
                "multi_stack",
                "php_modernisation",
                "cloud_aws",
                "cloud_migration_leadership",
                "leadership_scale",
                "hands_on_signal",
                "africa_mea_crossborder",
                "tenure_pattern",
              ],
            },
            label: {
              type: "string",
              description: "Human-readable label for the signal",
            },
            rating: {
              type: "string",
              enum: ["absent", "weak", "present", "strong"],
            },
            evidence: {
              type: "string",
              description:
                "Brief evidence quote or paraphrase from the CV. If absent, write 'No mention in CV.'",
            },
            notes: {
              type: "string",
              description:
                "Optional note on a specific risk or nuance. Empty string if no extra note.",
            },
          },
          required: ["key", "label", "rating", "evidence", "notes"],
        },
      },
      red_flags: {
        type: "array",
        description:
          "List of red flag keys that apply to this CV. Only include flags that genuinely apply — empty array if none. Each entry should include a brief description of how this flag manifested in the CV.",
        items: {
          type: "object",
          properties: {
            key: {
              type: "string",
              enum: [
                "resume_inflation",
                "no_fintech",
                "no_regulated_env",
                "no_cloud",
                "no_aws",
                "pure_leadership",
                "job_hopping",
                "career_level_mismatch",
                "stack_mismatch_no_php",
                "no_dr_compliance_audit",
                "geo_timezone",
                "adjacent_not_fintech",
              ],
            },
            description: {
              type: "string",
              description:
                "1-2 sentence description of how this red flag manifested in the candidate's CV.",
            },
          },
          required: ["key", "description"],
        },
      },
      recommendation: {
        type: "string",
        enum: ["strong_proceed", "proceed", "phone_screen_first", "decline"],
        description:
          "strong_proceed: clear strong fit, fast-track to assessment. proceed: good fit, send the assessment. phone_screen_first: some concerns warrant a 30-minute call before the assessment. decline: clear mismatch, polite rejection.",
      },
      rationale: {
        type: "string",
        description:
          "2-3 paragraphs explaining the recommendation. Reference specific signals and red flags. Tone: clear, honest, commercially-minded — like a senior recruiter writing for a busy chairman.",
      },
      follow_up_questions: {
        type: "string",
        description:
          "3-5 targeted questions to ask in a phone screen, focused on resolving the gaps or red flags identified above. Numbered list as plain text.",
      },
    },
    required: [
      "background_snapshot",
      "fit_signals",
      "red_flags",
      "recommendation",
      "rationale",
      "follow_up_questions",
    ],
  },
};
