import type { Config } from "tailwindcss";

// Veri brand tokens — derived from the pitch deck and Bank Connectivity Presentation.
// Dark institutional theme with a clear accent blue.
export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        veri: {
          ink: "#0B0F14",      // primary background — near-black, slightly cool
          surface: "#10161F",  // raised cards / panels
          line: "#1E2733",     // borders / dividers
          mute: "#5B6675",     // muted text
          text: "#E6ECF3",     // primary text
          subtle: "#A7B0BC",   // secondary text
          blue: "#1E88E5",     // accent / CTA
          "blue-soft": "#1565C0",
          glow: "#3FA9FF",     // hover/highlight
          ok: "#39C796",
          warn: "#E2B93B",
          err: "#E2543B",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 12px 28px rgba(0,0,0,0.45)",
        "soft-blue": "0 0 0 1px rgba(30,136,229,0.4), 0 8px 24px rgba(30,136,229,0.18)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
