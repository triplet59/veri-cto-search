"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { saveDraft, submitAssessment } from "@/app/assessment/[token]/actions";

interface Draft {
  section_1_architecture: string | null;
  section_2_governance: string | null;
  section_3_leadership: string | null;
  section_4_code: string | null;
  section_4_language: string | null;
  section_4_assumptions: string | null;
  section_4_test_strategy: string | null;
  section_4_extension_notes: string | null;
  section_5_scenarios: Record<string, string> | null;
}

interface Props {
  candidateId: string;
  initialDraft: Partial<Draft> | null;
}

const SECTION_5_QUESTIONS: { key: string; prompt: string }[] = [
  {
    key: "q1",
    prompt:
      "A production deployment causes incorrect balances to be displayed for some institutional partners. What do you do in the first 30 minutes?",
  },
  {
    key: "q2",
    prompt:
      "The business wants a fast feature release for a bank counterparty, but engineering is concerned that the current shared-database design is fragile under the new load profile. How do you handle the conversation with the business, and how do you decide whether to ship, defer, or stage the release?",
  },
  {
    key: "q3",
    prompt:
      "Would you favour refactoring Veri's legacy PHP platform gradually, or replacing it completely over a longer horizon? Explain your reasoning, including how the existence of ~2,500 live institutional partners and an in-flight AWS migration affects your answer.",
  },
  {
    key: "q4",
    prompt:
      "What does \"high availability\" mean to you specifically in the context of financial systems handling daily reconciliation, settlement integration, and bank-counterparty SLAs? Be concrete about targets and trade-offs.",
  },
  {
    key: "q5",
    prompt:
      "What metrics would you track to know whether the engineering function is improving — month over month and quarter over quarter? Distinguish leading indicators from lagging indicators.",
  },
  {
    key: "q6",
    prompt:
      "During due diligence, a bank counterparty's vendor-risk team discovers that Veri's critical back-office processor is a closely-held related party with cross-shareholding. They raise concerns about conflict of interest and operational independence. How do you respond as Senior Technical Officer, and what would you change about how the relationship is presented and governed?",
  },
  {
    key: "q7",
    prompt:
      "NCBA — or any large bank counterparty — asks you, as the new Senior Technical Officer, to walk them through Veri's cloud-native architecture, microservices design, and 100K+ scale capability as described in our pitch deck. Today the platform is mid-modernisation and not yet at that state. How do you handle the conversation honestly and credibly, without losing the relationship and without overpromising?",
  },
];

export function AssessmentForm({ candidateId, initialDraft }: Props) {
  const [d, setD] = useState<Draft>({
    section_1_architecture: initialDraft?.section_1_architecture ?? "",
    section_2_governance: initialDraft?.section_2_governance ?? "",
    section_3_leadership: initialDraft?.section_3_leadership ?? "",
    section_4_code: initialDraft?.section_4_code ?? "",
    section_4_language: initialDraft?.section_4_language ?? "python",
    section_4_assumptions: initialDraft?.section_4_assumptions ?? "",
    section_4_test_strategy: initialDraft?.section_4_test_strategy ?? "",
    section_4_extension_notes: initialDraft?.section_4_extension_notes ?? "",
    section_5_scenarios: initialDraft?.section_5_scenarios ?? {},
  });

  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [submitting, startSubmit] = useTransition();
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save the latest draft (debounced via ref)
  const dRef = useRef(d);
  dRef.current = d;
  const savingRef = useRef(false);

  async function doSave() {
    if (savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    try {
      const result = await saveDraft({ candidateId, ...dRef.current });
      if (result.ok && result.savedAt) {
        setSavedAt(result.savedAt);
        setError(null);
      } else if (!result.ok) {
        setError(result.error ?? "Save failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  // Periodic auto-save every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      doSave();
    }, 60_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save on tab visibility change (when they switch away)
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") doSave();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setD((prev) => ({ ...prev, [key]: value }));
  }

  function updateScenario(qKey: string, value: string) {
    setD((prev) => ({
      ...prev,
      section_5_scenarios: { ...(prev.section_5_scenarios ?? {}), [qKey]: value },
    }));
  }

  function isReadyToSubmit(): boolean {
    if (!d.section_1_architecture || d.section_1_architecture.length < 100) return false;
    if (!d.section_2_governance || d.section_2_governance.length < 100) return false;
    if (!d.section_3_leadership || d.section_3_leadership.length < 100) return false;
    if (!d.section_4_code || d.section_4_code.length < 50) return false;
    if (!d.section_4_test_strategy || d.section_4_test_strategy.length < 50) return false;
    const allAnswered = SECTION_5_QUESTIONS.every(
      (q) => (d.section_5_scenarios?.[q.key] ?? "").length > 50,
    );
    return allAnswered;
  }

  async function onSubmit() {
    setError(null);
    // Save first to make sure latest state is persisted
    await doSave();
    startSubmit(async () => {
      const result = await submitAssessment(candidateId);
      if (!result.ok) {
        setError(result.error ?? "Submission failed");
        setShowSubmitConfirm(false);
      }
      // On success the action redirects, so no further client work needed.
    });
  }

  return (
    <div className="space-y-8">
      <SaveStatus savedAt={savedAt} isSaving={isSaving} error={error} />

      {/* Section 1 */}
      <Section
        number="1"
        title="Architecture & Modernisation Strategy"
        prompts={[
          "How would you assess the current platform in your first 30–60 days, including what artefacts and conversations you would prioritise.",
          "How would you approach the PHP 8 upgrade work specifically — given that the existing PHP codebase is the legacy core and an estimated ~2,500 institutional partners depend on it being available throughout.",
          "How would you continue and de-risk the in-flight DigitalOcean → AWS migration, including how you would sequence the four phases, where you would set blast-radius limits, and what would have to be true before each phase goes live.",
          "How would you close the gap between an architecture pitched to bank counterparties (cloud-native, microservices, segregated Prod/UAT/DR, 100K+ scale capability) and a current state that is mid-modernisation — without breaking live institutional partners and without setting an unrealistic timeline.",
          "How would you ensure financial data integrity throughout the modernisation — including reconciliation, settlement, and audit-trail continuity given that critical back-office processing flows through a third-party integration.",
          "What documentation you would create or refine first, and why.",
        ]}
        wordHint="Recommended length: 1,000 – 1,500 words."
      >
        <textarea
          className="veri-input min-h-[280px] font-sans"
          value={d.section_1_architecture ?? ""}
          onChange={(e) => update("section_1_architecture", e.target.value)}
          onBlur={doSave}
          placeholder="Your strategy…"
        />
      </Section>

      {/* Section 2 */}
      <Section
        number="2"
        title="Cloud, Risk & Governance"
        prompts={[
          "What are the biggest technical risks in modernising a legacy fintech platform that handles institutional transaction data and settlement integration with a third-party processor? What is your default approach for de-risking each one?",
          "Given that Veri's cloud usage is classified as Material Outsourcing, which technical controls would you treat as non-negotiable, and where would you push back if business pressure tried to relax them?",
          "What would you include in a cloud governance framework that supports the AWS migration, ISO 27001 and SOC 2 readiness, cross-border data residency for African jurisdictions, and an evidenced exit strategy?",
          "Our current DigitalOcean DR plan has a 24-hour RPO tested semi-annually. As bank-as-customer workloads come online, what would your target RPO/RTO be, how would you tighten DR on a live system without disrupting it, and how would you prove it works?",
          "How would you approach auditability, monitoring, and incident response across a hybrid stack (PHP/Python/Java) with infrastructure on DigitalOcean today and AWS tomorrow? Please include both proactive monitoring and post-incident learning.",
          "Describe how you have worked alongside a Compliance Officer or DPO in a previous role when making a major architecture decision — what worked, what didn't, and what you would do differently.",
        ]}
        wordHint="Recommended length: 700 – 1,000 words."
      >
        <textarea
          className="veri-input min-h-[280px] font-sans"
          value={d.section_2_governance ?? ""}
          onChange={(e) => update("section_2_governance", e.target.value)}
          onBlur={doSave}
          placeholder="Your governance approach…"
        />
      </Section>

      {/* Section 3 */}
      <Section
        number="3"
        title="Team Leadership, Delivery & Vendor Management"
        prompts={[
          "How would you assess the team in your first 30 days — what conversations, observations, and artefacts would you use to form a picture, and how would you decide what to act on first?",
          "How would you improve delivery discipline (SDLC, code review, testing, release governance, documentation) without damaging morale on a small team that has been operating under one set of norms for years?",
          "Which SDLC improvements would you prioritise in the first 90 days, and which would you deliberately defer for later — explaining why.",
          "How would you handle an engineer who resists documentation, testing, or code review — including how you would distinguish between a cultural shift that needs time and a performance issue that needs management.",
          "How would you structure technical hiring for future developers, given that you would also be designing the assessment process itself? What separates a good fintech engineering hire from a poor one in your view?",
          "This role is meaningfully more hands-on than a typical large-company CTO role — daily monitoring, SSL lifecycle, after-hours escalation. Describe a recent example where you debugged a production issue yourself, or stayed close enough to operations to spot a problem before it escalated.",
          "You will manage SLA-bearing vendor relationships such as KYC360 (48-hour onboarding SLA), custodian bank APIs, and trading venue connectivity. How do you set up a vendor relationship so that the technical interface stays robust and the commercial relationship is healthy — and how do you decide when to escalate a vendor problem upward versus solve it within your own team?",
        ]}
        wordHint="Recommended length: 700 – 1,000 words."
      >
        <textarea
          className="veri-input min-h-[280px] font-sans"
          value={d.section_3_leadership ?? ""}
          onChange={(e) => update("section_3_leadership", e.target.value)}
          onBlur={doSave}
          placeholder="Your leadership approach…"
        />
      </Section>

      {/* Section 4 */}
      <Section
        number="4"
        title="Practical Coding Task"
        prompts={[
          "Write a function (or set of functions) that validates required fields, rejects duplicate transaction IDs, rejects negative or zero amounts, handles monetary precision appropriately, groups valid transactions by account_id, and returns a summary including total count and amount per account, rejected count, and reasons for rejection.",
          "Each transaction has: transaction_id, account_id, amount, currency, timestamp, status.",
        ]}
        wordHint="Use any language: PHP, Python, Java, or JavaScript. Scored equally."
      >
        <div className="space-y-4">
          <div>
            <label className="veri-label">Language</label>
            <select
              className="veri-input"
              value={d.section_4_language ?? "python"}
              onChange={(e) => update("section_4_language", e.target.value)}
              onBlur={doSave}
            >
              <option value="php">PHP</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="javascript">JavaScript / TypeScript</option>
            </select>
          </div>
          <div>
            <label className="veri-label">Code</label>
            <textarea
              className="veri-input min-h-[280px] font-mono text-sm"
              value={d.section_4_code ?? ""}
              onChange={(e) => update("section_4_code", e.target.value)}
              onBlur={doSave}
              placeholder="// Your code…"
              spellCheck={false}
            />
          </div>
          <div>
            <label className="veri-label">Assumptions</label>
            <textarea
              className="veri-input min-h-[120px] font-sans"
              value={d.section_4_assumptions ?? ""}
              onChange={(e) => update("section_4_assumptions", e.target.value)}
              onBlur={doSave}
              placeholder="Any assumptions you've made (data sources, error semantics, character encoding, etc.)…"
            />
          </div>
          <div>
            <label className="veri-label">How you would test this in production-quality software</label>
            <textarea
              className="veri-input min-h-[150px] font-sans"
              value={d.section_4_test_strategy ?? ""}
              onChange={(e) => update("section_4_test_strategy", e.target.value)}
              onBlur={doSave}
              placeholder="Unit tests, integration tests, load tests, edge cases…"
            />
          </div>
          <div>
            <label className="veri-label">Extension notes</label>
            <textarea
              className="veri-input min-h-[120px] font-sans"
              value={d.section_4_extension_notes ?? ""}
              onChange={(e) => update("section_4_extension_notes", e.target.value)}
              onBlur={doSave}
              placeholder="How would you extend this for cross-currency aggregation, late-arriving transactions, or replay of a corrupted batch?"
            />
          </div>
        </div>
      </Section>

      {/* Section 5 */}
      <Section
        number="5"
        title="Short Scenario Questions"
        wordHint="A few paragraphs each. Recommended length: 600 – 1,000 words across all seven scenarios."
      >
        <div className="space-y-6">
          {SECTION_5_QUESTIONS.map((q, i) => (
            <div key={q.key}>
              <p className="text-veri-text font-medium mb-1">{i + 1}. {q.prompt}</p>
              <textarea
                className="veri-input min-h-[140px] font-sans"
                value={d.section_5_scenarios?.[q.key] ?? ""}
                onChange={(e) => updateScenario(q.key, e.target.value)}
                onBlur={doSave}
                placeholder="Your answer…"
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Submission */}
      <div className="veri-card p-6 md:p-8">
        <h2 className="veri-h2 mb-2">Submission</h2>
        <p className="text-veri-subtle mb-4">
          When you're ready, submit your assessment. After submission you cannot
          edit your answers. The shortlisted candidates will be invited to a live
          finalist round.
        </p>

        {!isReadyToSubmit() && (
          <p className="text-veri-warn text-sm mb-4">
            Some sections look unfinished — please ensure you've answered every
            question before submitting.
          </p>
        )}

        {error && (
          <div className="rounded-xl border border-veri-err/40 bg-veri-err/10 px-4 py-3 text-sm text-veri-text mb-4">
            {error}
          </div>
        )}

        {!showSubmitConfirm ? (
          <button
            type="button"
            disabled={!isReadyToSubmit() || submitting}
            onClick={() => setShowSubmitConfirm(true)}
            className="veri-btn-primary"
          >
            Submit assessment
          </button>
        ) : (
          <div className="rounded-xl border border-veri-blue/40 bg-veri-blue/10 px-4 py-4">
            <p className="text-veri-text mb-3">
              Are you sure you want to submit? You won't be able to edit afterwards.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onSubmit}
                disabled={submitting}
                className="veri-btn-primary"
              >
                {submitting ? "Submitting…" : "Yes, submit now"}
              </button>
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                disabled={submitting}
                className="veri-btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  number,
  title,
  prompts,
  wordHint,
  children,
}: {
  number: string;
  title: string;
  prompts?: string[];
  wordHint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="veri-card p-6 md:p-8">
      <p className="veri-eyebrow mb-2">Section {number}</p>
      <h2 className="veri-h2 mb-4">{title}</h2>
      {prompts && (
        <div className="mb-5">
          <p className="text-veri-subtle mb-2">Please address each of the following:</p>
          <ol className="list-decimal list-outside ml-5 space-y-1.5 text-veri-subtle text-sm">
            {prompts.map((p, i) => (<li key={i}>{p}</li>))}
          </ol>
        </div>
      )}
      {wordHint && <p className="veri-hint mb-4">{wordHint}</p>}
      {children}
    </div>
  );
}

function SaveStatus({
  savedAt,
  isSaving,
  error,
}: {
  savedAt: string | null;
  isSaving: boolean;
  error: string | null;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(i);
  }, []);

  let text = "Not saved yet";
  if (error) text = `Save failed: ${error}`;
  else if (isSaving) text = "Saving…";
  else if (savedAt) {
    const diffSec = Math.floor((now - Date.parse(savedAt)) / 1000);
    if (diffSec < 5) text = "Saved";
    else if (diffSec < 60) text = `Saved ${diffSec}s ago`;
    else text = `Saved ${Math.floor(diffSec / 60)}m ago`;
  }

  return (
    <div className="sticky top-2 z-10">
      <p className="inline-flex items-center gap-2 rounded-full bg-veri-surface/80 backdrop-blur border border-veri-line px-3 py-1.5 text-xs text-veri-mute">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            error ? "bg-veri-err" : isSaving ? "bg-veri-warn animate-pulse" : "bg-veri-ok"
          }`}
        />
        {text}
      </p>
    </div>
  );
}
