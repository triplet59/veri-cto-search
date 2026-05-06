"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
      },
    });

    setSubmitting(false);
    if (error) {
      setError(error.message);
    } else {
      setMessage("Sign-in link sent. Check your email.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="veri-label">Email address</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="veri-input"
          placeholder="you@veri-global.com"
        />
      </div>

      {message && (
        <div className="rounded-xl border border-veri-ok/40 bg-veri-ok/10 px-4 py-3 text-sm text-veri-text">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-veri-err/40 bg-veri-err/10 px-4 py-3 text-sm text-veri-text">
          {error}
        </div>
      )}

      <button type="submit" disabled={submitting} className="veri-btn-primary w-full">
        {submitting ? "Sending…" : "Send sign-in link"}
      </button>
    </form>
  );
}
