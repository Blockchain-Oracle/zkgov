/**
 * ZKGov Frontend Constants
 */

export const APP_NAME = "ZKGov";
export const TAGLINE = "PRIVATE GOVERNANCE. VERIFIED RESULTS.";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
export const CHAIN_ID = 133;

export const NAVIGATION_ITEMS = [
  { label: "DASHBOARD", href: "/" },
  { label: "PROPOSALS", href: "/proposals" },
  { label: "ACTIVITY", href: "/activity" },
  { label: "DOCS", href: "/docs" },
  { label: "PROFILE", href: "/profile" },
];

export const STATS_LABELS = {
  PROPOSALS: "PROPOSALS",
  MEMBERS: "VOTERS",
  COMMENTS: "COMMENTS",
};
