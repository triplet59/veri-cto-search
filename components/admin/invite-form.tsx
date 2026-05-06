"use client";

import { useActionState, useState } from "react";
import { createInvite, type InviteFormState } from "@/app/admin/invite/actions";

const initial: InviteFormState = { ok: false };

export function InviteForm() {
  const [state, formAction, isPending] = useActionState(createInvite, initial);
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-6">
      <form action={formAction} className="veri-card p-6 md:p-8 space-y-4">
        <Field label="Candidate name (optional)" name="prospectName" placeholder="If known" />
        <Field
          label="Candidate email (optional)"
          name="prospectEmail"
          type="email"
          placeholder="If known — for your records"
          hint="The candidate fills in their own details when they apply; this is only for your reference."
        />
        <Field
          label="Source"
          name="source"
          placeholder="e.g. Direct, Referral, Recruiter"
        />
        <Field
          label="Notes"
          name="sourceNotes"
          textarea
          placeholder="Any context about how you found them, who referred them, etc."
        />

        <div className="flex justify-end pt-2 border-t border-veri-line">
          <button type="submit" disabled={isPending} className="veri-btn-primary">
            {isPending ? "Creating link…" : "Create invitation link"}
          </button>
        </div>
      </form>

      {state.ok && state.applyUrl && (
        <div className="veri-card p-6 border-veri-ok/40">
          <p className="text-veri-ok font-medium mb-2">Invitation link ready</p>
          <p className="text-veri-subtle text-sm mb-4">
            Send this link to the candidate. It is unique to them; treat it as private.
          </p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={state.applyUrl}
              className="veri-input font-mono text-xs"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              type="button"
              className="veri-btn-ghost"
              onClick={async () => {
                if (state.applyUrl) {
                  await navigator.clipboard.writeText(state.applyUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {!state.ok && state.message && (
        <div className="rounded-xl border border-veri-err/40 bg-veri-err/10 px-4 py-3 text-sm text-veri-text">
          {state.message}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  hint,
  textarea,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  hint?: string;
  textarea?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="veri-label">{label}</label>
      {textarea ? (
        <textarea id={name} name={name} placeholder={placeholder} rows={3} className="veri-input resize-none" />
      ) : (
        <input id={name} name={name} type={type} placeholder={placeholder} className="veri-input" />
      )}
      {hint && <p className="veri-hint">{hint}</p>}
    </div>
  );
}
