// Anthropic API client wrapper.
// Used server-side only; the API key never reaches the browser.

import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

// Default models — can be overridden per call.
// Names match Anthropic's current model identifiers as of 2026.
//
// We use Haiku for CV screening because:
//   - 5-15s typical response time (well within Vercel's 60s function limit)
//   - Sonnet was timing out on Vercel Hobby plan
//   - The screening rubric is well-structured (tool use), so Haiku's reasoning is sufficient
// Sonnet remains available for assessment scoring (Phase 3) where the input is much larger.
export const MODELS = {
  screening: "claude-haiku-4-5-20251001",
  scoring: "claude-sonnet-4-6",
  quick: "claude-haiku-4-5-20251001",
} as const;
