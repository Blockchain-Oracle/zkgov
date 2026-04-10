#!/usr/bin/env node
/**
 * ZKGov CLI + MCP dual entry point.
 *
 *   zkgov                  — starts MCP server (stdio transport)
 *   zkgov stats            — show platform statistics
 *   zkgov proposals        — list all proposals
 *   zkgov proposal <id>    — show proposal details
 *   zkgov voter <address>  — check voter registration
 *   zkgov members          — show Semaphore group info
 *   zkgov activity         — show recent on-chain activity
 *
 * Every command accepts --json for machine-readable output.
 */
import { Command } from "commander";
import {
  getStats,
  getProposal,
  listProposals,
  checkVoter,
  getMembers,
  getActivity,
} from "./lib/queries.js";
import {
  formatStats,
  formatProposalList,
  formatProposalDetail,
  formatVoter,
  formatMembers,
  formatActivity,
} from "./lib/cli-format.js";

// ─── Output helpers ─────────────────────────────────────────────

function output(data: unknown, pretty: string, opts: { json?: boolean }) {
  if (opts.json) {
    process.stdout.write(JSON.stringify(data, null, 2) + "\n");
  } else {
    process.stdout.write(pretty + "\n");
  }
}

function fatal(e: unknown): never {
  const msg = e instanceof Error ? e.message : String(e);
  process.stderr.write(`\x1b[31mError:\x1b[0m ${msg}\n`);
  process.exit(1);
}

// ─── Program ────────────────────────────────────────────────────

const program = new Command()
  .name("zkgov")
  .description("ZKGov — Anonymous governance on HashKey Chain (CLI + MCP)")
  .version("0.0.1")
  .option("--json", "Output raw JSON instead of formatted text");

// Default action: no subcommand → start MCP server
program.action(async () => {
  await import("./index.js");
});

// ─── Commands ───────────────────────────────────────────────────

program
  .command("stats")
  .description("Show platform statistics (proposals, members, contract)")
  .action(async () => {
    try {
      const data = await getStats();
      output(data, formatStats(data), program.opts());
    } catch (e) {
      fatal(e);
    }
  });

program
  .command("proposals")
  .description("List all governance proposals with vote tallies")
  .action(async () => {
    try {
      const data = await listProposals();
      output({ total: data.length, proposals: data }, formatProposalList(data), program.opts());
    } catch (e) {
      fatal(e);
    }
  });

program
  .command("proposal <id>")
  .description("Show full details of a specific proposal")
  .action(async (id: string) => {
    try {
      const proposalId = parseInt(id, 10);
      if (isNaN(proposalId) || proposalId < 1) {
        fatal("Proposal ID must be a positive integer");
      }
      const data = await getProposal(proposalId);
      output(data, formatProposalDetail(data), program.opts());
    } catch (e) {
      fatal(e);
    }
  });

program
  .command("voter <address>")
  .description("Check if a wallet address is registered as a voter")
  .action(async (address: string) => {
    try {
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        fatal("Invalid Ethereum address format (expected 0x followed by 40 hex chars)");
      }
      const data = await checkVoter(address);
      output(data, formatVoter(data), program.opts());
    } catch (e) {
      fatal(e);
    }
  });

program
  .command("members")
  .description("Show Semaphore group info (member count, Merkle root, depth)")
  .action(async () => {
    try {
      const data = await getMembers();
      output(data, formatMembers(data), program.opts());
    } catch (e) {
      fatal(e);
    }
  });

program
  .command("activity")
  .description("Show recent on-chain governance activity")
  .option("-l, --limit <n>", "Max events to show", "20")
  .action(async (opts: { limit: string }) => {
    try {
      const limit = Math.min(Math.max(parseInt(opts.limit, 10) || 20, 1), 50);
      const data = await getActivity(limit);
      output({ total: data.length, events: data }, formatActivity(data), program.opts());
    } catch (e) {
      fatal(e);
    }
  });

// ─── Parse ──────────────────────────────────────────────────────

program.parseAsync(process.argv).catch((e) => {
  fatal(e);
});
