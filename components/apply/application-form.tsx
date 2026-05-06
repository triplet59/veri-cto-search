"use client";

import { useActionState } from "react";
import { submitApplication, type ApplicationFormState } from "@/app/apply/[token]/actions";

interface Props {
  token: string;
  candidateId: string;
}

const initial: ApplicationFormState = { ok: false };

export function ApplicationForm({ candidateId }: Props) {
  const [state, formAction, isPending] = useActionState(submitApplication, initial);

  return (
    <form
      action={formAction}
      className="space-y-6"
      encType="multipart/form-data"
    >
      <input type="hidden" name="candidateId" value={candidateId} />

      <Section title="About you">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full name" name="fullName" required error={state.fieldErrors?.fullName} />
          <Field
            label="Email address"
            name="email"
            type="email"
            required
            error={state.fieldErrors?.email}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field
            label="Country code"
            name="phoneCountryCode"
            placeholder="+230"
            required
            error={state.fieldErrors?.phoneCountryCode}
            hint="Including the plus sign"
          />
          <Field
            label="Phone number"
            name="phoneNumber"
            required
            className="md:col-span-2"
            error={state.fieldErrors?.phoneNumber}
          />
        </div>

        <Field
          label="Country of residence"
          name="countryOfResidence"
          required
          error={state.fieldErrors?.countryOfResidence}
        />

        <Field
          label="LinkedIn profile URL"
          name="linkedinUrl"
          type="url"
          placeholder="https://www.linkedin.com/in/..."
          error={state.fieldErrors?.linkedinUrl}
        />
      </Section>

      <Section title="Current role">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Current position"
            name="currentPosition"
            required
            error={state.fieldErrors?.currentPosition}
          />
          <Field
            label="Current employer"
            name="currentEmployer"
            error={state.fieldErrors?.currentEmployer}
            hint="Optional — leave blank if you'd rather not say at this stage."
          />
        </div>
      </Section>

      <Section title="Compensation and availability">
        <Field
          label="Salary expectancy (USD, annual)"
          name="salaryExpectancyUsd"
          type="number"
          required
          placeholder="e.g. 180000"
          error={state.fieldErrors?.salaryExpectancyUsd}
          hint="Total target compensation in US dollars per year. Approximate is fine."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Available start date"
            name="availableStartDate"
            type="date"
            required
            error={state.fieldErrors?.availableStartDate}
          />
          <Field
            label="Notice period"
            name="noticePeriodText"
            placeholder="e.g. 3 months"
            error={state.fieldErrors?.noticePeriodText}
          />
        </div>
      </Section>

      <Section title="CV">
        <label className="veri-label">Upload your CV (PDF or Word, 10MB max)</label>
        <input
          type="file"
          name="cvFile"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          required
          className="block w-full text-sm text-veri-subtle file:mr-4 file:rounded-xl file:border file:border-veri-line file:bg-veri-ink/60 file:text-veri-text file:px-4 file:py-2 file:font-medium file:cursor-pointer file:hover:border-veri-blue/60"
        />
        <p className="veri-hint">
          Your CV is uploaded over an encrypted connection and stored privately. Only Veri's
          hiring team can access it.
        </p>
      </Section>

      {state.message && !state.ok && (
        <div className="rounded-xl border border-veri-err/40 bg-veri-err/10 px-4 py-3 text-sm text-veri-text">
          {state.message}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-veri-line">
        <p className="text-veri-mute text-xs max-w-sm">
          By submitting, you confirm the information is accurate and consent to Veri processing
          it for the purpose of this recruitment.
        </p>
        <button type="submit" disabled={isPending} className="veri-btn-primary">
          {isPending ? "Submitting…" : "Submit application"}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="veri-card p-6 md:p-8 space-y-4">
      <h2 className="veri-h2 mb-2">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  hint,
  error,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="veri-label">
        {label} {required && <span className="text-veri-blue">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="veri-input"
      />
      {hint && <p className="veri-hint">{hint}</p>}
      {error && <p className="veri-hint text-veri-err">{error}</p>}
    </div>
  );
}
