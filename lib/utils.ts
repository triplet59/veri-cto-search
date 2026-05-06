// Shared utilities used across the app.

/** Generate a URL-safe random token for tokenised candidate links. */
export function generateToken(bytes = 24): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Format ISO date string for display, returning empty string on null/invalid. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format datetime including time. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Build a public URL into the site, respecting NEXT_PUBLIC_SITE_URL when set. */
export function siteUrl(path = "/"): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  if (path.startsWith("/")) return `${base}${path}`;
  return `${base}/${path}`;
}
