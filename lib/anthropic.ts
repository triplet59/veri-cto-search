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
export const MODELS = {
  // Heavy reasoning — use for assessment scoring (Phase 3) and CV screening
  screening: "claude-sonnet-4-6",
  // Fast & cheap — use for short tasks
  quick: "claude-haiku-4-5-20251001",
} as const;
