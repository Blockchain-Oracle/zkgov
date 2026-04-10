/**
 * CLI output formatters — human-readable terminal output.
 *
 * For machine-readable JSON output, use `--json` flag which bypasses
 * these formatters entirely.
 */
import type { Stats, Proposal, ProposalSummary, VoterInfo, MembersInfo, ActivityEvent } from "./queries.js";

// ─── ANSI color helpers ─────────────────────────────────────────
// Using raw ANSI codes to avoid a chalk dependency
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const GRAY = "\x1b[90m";

const bold = (s: string) => `${BOLD}${s}${RESET}`;
const dim = (s: string) => `${DIM}${s}${RESET}`;
const green = (s: string) => `${GREEN}${s}${RESET}`;
const red = (s: string) => `${RED}${s}${RESET}`;
const yellow = (s: string) => `${YELLOW}${s}${RESET}`;
const cyan = (s: string) => `${CYAN}${s}${RESET}`;
const gray = (s: string) => `${GRAY}${s}${RESET}`;

// ─── Shared helpers ─────────────────────────────────────────────

export function statusBadge(status: string): string {
  switch (status) {
    case "active": return green("● ACTIVE");
    case "passed": return green("✓ PASSED");
    case "defeated": return red("✗ DEFEATED");
    case "ended": return gray("○ ENDED");
    default: return dim(status.toUpperCase());
  }
}

export function progressBar(current: number, target: number, width = 20): string {
  if (target <= 0) return "░".repeat(width);
  const ratio = Math.min(current / target, 1);
  const filled = Math.round(ratio * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

export function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function formatDuration(endIso: string): string {
  const remaining = new Date(endIso).getTime() - Date.now();
  if (remaining <= 0) return "ended";
  const hours = Math.floor(remaining / 3600000);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

// ─── Formatters ─────────────────────────────────────────────────

export function formatStats(s: Stats): string {
  return [
    "",
    bold("  ZKGov — HashKey Chain Testnet"),
    gray("  " + "─".repeat(50)),
    `  Proposals:     ${bold(String(s.totalProposals))}`,
    `  Members:       ${bold(String(s.totalMembers))}`,
    `  Group ID:      ${s.activeGroupId}`,
    gray("  " + "─".repeat(50)),
    `  Contract:      ${cyan(s.contract)}`,
    `  Explorer:      ${dim(s.explorer)}`,
    "",
  ].join("\n");
}

export function formatVoter(v: VoterInfo): string {
  const status = v.registered ? green("✓ Registered") : red("✗ Not registered");
  const lines = [
    "",
    bold(`  Voter: ${v.address}`),
    gray("  " + "─".repeat(50)),
    `  Status:        ${status}`,
  ];
  if (v.commitment) {
    lines.push(`  Commitment:    ${dim(v.commitment.slice(0, 20) + "…")}`);
  }
  lines.push(`  Explorer:      ${dim(v.explorer)}`, "");
  return lines.join("\n");
}

export function formatMembers(m: MembersInfo): string {
  return [
    "",
    bold("  Semaphore Group"),
    gray("  " + "─".repeat(50)),
    `  Members:       ${bold(String(m.memberCount))}`,
    `  Merkle Depth:  ${m.merkleDepth}`,
    `  Merkle Root:   ${dim(m.merkleRoot.slice(0, 24) + "…")}`,
    "",
  ].join("\n");
}

export function formatProposalList(proposals: ProposalSummary[]): string {
  if (proposals.length === 0) return "\n  No proposals yet.\n";

  const lines = ["", bold("  Proposals"), gray("  " + "─".repeat(70))];

  for (const p of proposals) {
    const title = p.title.length > 50 ? p.title.slice(0, 47) + "…" : p.title;
    const votes = `${green(String(p.votes.for))}/${red(String(p.votes.against))}/${gray(String(p.votes.abstain))}`;
    const quorum = `${p.votes.total}/${p.quorum}`;
    lines.push(
      `  ${bold("#" + String(p.id).padStart(2, "0"))}  ${title.padEnd(52)}  ${statusBadge(p.status)}`,
      `       ${dim("votes")} ${votes}  ${dim("quorum")} ${quorum}  ${dim("ends")} ${formatDuration(p.votingEnd)}`,
      ""
    );
  }

  return lines.join("\n");
}

export function formatActivity(events: ActivityEvent[]): string {
  if (events.length === 0) return "\n  No activity yet.\n";

  const lines = ["", bold("  Recent Activity"), gray("  " + "─".repeat(70))];

  for (const e of events) {
    let line = "";
    if (e.type === "proposal_created") {
      line = `  ${green("+ ")}${bold(`#${e.proposalId}`)}  ${e.title}  ${dim("by " + truncateAddress(String(e.creator)))}`;
    } else if (e.type === "vote_cast") {
      const choiceColor = e.choice === "For" ? green : e.choice === "Against" ? red : gray;
      line = `  ${cyan("→ ")}vote ${choiceColor(String(e.choice))}  ${dim("on #" + e.proposalId)}`;
    } else if (e.type === "member_registered") {
      line = `  ${yellow("● ")}registered  ${dim(truncateAddress(String(e.member)))}`;
    }
    lines.push(line, `     ${dim("tx " + String(e.txHash).slice(0, 16) + "…")}`);
  }

  lines.push("");
  return lines.join("\n");
}

// ─── Proposal Detail View ───────────────────────────────────────
//
// Design choices (UX-first):
//   - Vote distribution: three separate bars (clearer than stacked)
//   - Description: first 400 chars with "…" (keeps terminal clean)
//   - Creator address: truncated with full on a separate "copy" line
//   - Time: both relative ("2d 4h") AND absolute date
//   - Layout: same for all proposals, status badge tells the story

export function formatProposalDetail(p: Proposal): string {
  const max = Math.max(p.votes.for, p.votes.against, p.votes.abstain, 1);

  // Clean up markdown headings from on-chain description
  const cleanDesc = (p.description || "")
    .replace(/^#+\s*/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const desc = cleanDesc.length > 400
    ? cleanDesc.slice(0, 400) + dim("…")
    : cleanDesc;

  const votingEnd = new Date(p.votingEnd);
  const endAbsolute = votingEnd.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });

  const lines: string[] = [
    "",
    bold(`  Proposal #${p.id}  ${statusBadge(p.status)}`),
    gray("  " + "─".repeat(70)),
    "",
    bold(`  ${p.title}`),
    "",
  ];

  if (desc) {
    // Indent the description body
    const indented = desc.split("\n").map((l) => `  ${dim(l)}`).join("\n");
    lines.push(indented, "");
  }

  lines.push(
    gray("  " + "─".repeat(70)),
    bold("  Votes"),
    `    ${green("For     ")}  ${green(progressBar(p.votes.for, max))}  ${bold(String(p.votes.for))}`,
    `    ${red("Against ")}  ${red(progressBar(p.votes.against, max))}  ${bold(String(p.votes.against))}`,
    `    ${gray("Abstain ")}  ${gray(progressBar(p.votes.abstain, max))}  ${bold(String(p.votes.abstain))}`,
    "",
    bold("  Quorum"),
    `    ${cyan(progressBar(p.votes.total, p.quorum))}  ${p.votes.total} / ${p.quorum}  ${p.votes.total >= p.quorum ? green("✓ reached") : yellow("○ pending")}`,
    "",
    gray("  " + "─".repeat(70)),
    `  ${dim("Ends:    ")}${endAbsolute}  ${dim("(" + formatDuration(p.votingEnd) + ")")}`,
    `  ${dim("Creator: ")}${truncateAddress(p.creator)}`,
    `  ${dim("         ")}${gray(p.creator)}`,
    `  ${dim("Chain:   ")}${gray(p.explorer)}`,
    "",
  );

  return lines.join("\n");
}
