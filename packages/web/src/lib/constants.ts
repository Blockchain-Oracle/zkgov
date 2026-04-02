/**
 * ZKGov Frontend Constants
 * Following a technical, data-first approach inspired by frames.ag
 */

export const APP_NAME = "ZKGov";
export const TAGLINE = "PRIVATE GOVERNANCE. VERIFIED RESULTS.";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
export const CHAIN_ID = 133; // HashKey Chain Testnet

export const NAVIGATION_ITEMS = [
  { label: "DASHBOARD", href: "/" },
  { label: "PROPOSALS", href: "/proposals" },
  { label: "ACTIVITY", href: "/activity" },
  { label: "AGENTS", href: "/agents" },
  { label: "PROFILE", href: "/profile" },
];

export const STATS_LABELS = {
  PROPOSALS: "PROPOSALS",
  VOTES: "VOTES CAST",
  VOTERS: "VERIFIED VOTERS",
  AGENTS: "ACTIVE AGENTS",
};

export const COLORS = {
  BG: "bg-[#0a0a0a]",
  SURFACE: "bg-[#111111]",
  BORDER: "border-white/10",
  ACCENT: "text-indigo-400",
  MUTED: "text-zinc-500",
  SUCCESS: "text-emerald-400",
  DANGER: "text-rose-400",
};

export const LOGO_SVG = `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2L3 6V12C3 17.5 6.8 22.5 12 24C17.2 22.5 21 17.5 21 12V6L12 2Z" stroke="currentColor" stroke-width="1.5" fill="none" opacity="0.3"/>
  <path d="M12 4L5 7V12C5 16.3 8 20.2 12 21.8C16 20.2 19 16.3 19 12V7L12 4Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
  <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;
