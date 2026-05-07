"use client";

import { useState, useTransition } from "react";
import { sendAssessment } from "@/app/admin/candidates/[id]/actions";

interface Props {
  candidateId: string;
  candidateEmail: string | null;
  alreadySent: boolean;
  assessmentToken: string | null;
}

export function SendAssessmentButton({
  candidateId,
  candidateEmail,
  alreadySent,
  assessmentToken,
}: Props) {
  const [isPending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);

  function handleClick() {
    setMessage(null);
    start(async () => {
      const result = await sendAssessment(candidateId);
      setSuccess(result.ok);
      setMessage(result.message ?? null);
    });
  }

  const buttonLabel = alreadySent
    ? isPending
      ? "Re-sending…"
      : "Re-send assessment invitation"
    : isPending
      ? "Sending…"
      : "Send assessment invitation";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending || !candidateEmail}
          className={alreadySent ? "veri-btn-ghost" : "veri-btn-primary"}
        >
          {buttonLabel}
        </button>
        {!candidateEmail && (
          <span className="text-veri-warn text-sm">
            No email on file — cannot send.
          </span>
        )}
      </div>

      {message && (
        <p
          className={`text-sm ${
            success ? "text-veri-ok" : "text-veri-err"
          }`}
        >
          {message}
        </p>
      )}

      {alreadySent && assessmentToken && (
        <p className="text-veri-mute text-xs">
          Direct link (in case the email doesn't arrive):{" "}
          <span className="text-veri-blue font-mono break-all">
            {typeof window !== "undefined" ? window.location.origin : ""}
            /assessment/{assessmentToken}
          </span>
        </p>
      )}
    </div>
  );
}
