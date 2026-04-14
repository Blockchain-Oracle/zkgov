// Tokens lifted from packages/web/src/app/globals.css
export const theme = {
  colors: {
    bg: "#0a0a0a",
    surface: "#111111",
    codeBg: "#0d0d0f",
    border: "#27272a",
    text: "#fafafa",
    muted: "#a1a1aa",
    accent: "#818cf8",
    accentStrong: "#4f46e5",
    success: "#34d399",
    danger: "#f87171",
  },
  fonts: {
    sans: "Geist, ui-sans-serif, system-ui, sans-serif",
    mono: "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  },
  letterSpacing: {
    nav: "0.1em",
    stat: "0.15em",
    badge: "0.05em",
  },
} as const;
