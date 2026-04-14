// Theme tokens lifted straight from packages/web/src/app/globals.css.
// Keep these in sync if the site's palette ever moves.
export const theme = {
  colors: {
    // Dark mode (what we render against)
    bg: "#0a0a0a",
    surface: "#111111",
    text: "#fafafa",
    muted: "#71717a",
    border: "rgba(255, 255, 255, 0.08)",
    borderActive: "rgba(129, 140, 248, 0.3)",
    accent: "#818cf8", // indigo-400, the dark-mode accent
    accentStrong: "#4f46e5", // indigo-600
    success: "#10b981",
    danger: "#ef4444",
    codeBg: "#0d0d0d",
  },
  fonts: {
    // Geist and Geist Mono are loaded via Google Fonts in Root.tsx
    sans: "'Geist', 'Inter', system-ui, -apple-system, sans-serif",
    mono: "'Geist Mono', 'JetBrains Mono', ui-monospace, monospace",
  },
  letterSpacing: {
    nav: "0.1em",
    stat: "0.15em",
    badge: "0.05em",
  },
};

export type Theme = typeof theme;
