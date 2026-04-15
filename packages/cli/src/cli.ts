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
  getWalletInfo,
  register,
  createProposal,
  castVote,
  finalizeProposal,
} from "./lib/writes.js";
import {
  formatStats,
  formatProposalList,
  formatProposalDetail,
  formatVoter,
  formatMembers,
  formatActivity,
  formatWalletInfo,
  formatTxResult,
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
  if (program.opts().json) {
    process.stdout.write(JSON.stringify({ error: msg }) + "\n");
  } else {
    process.stderr.write(`\x1b[31mError:\x1b[0m ${msg}\n`);
  }
  process.exit(1);
}

// ─── Program ────────────────────────────────────────────────────

const program = new Command()
  .name("zkgov")
  .description("ZKGov — Anonymous governance on HashKey Chain (CLI + MCP)")
  .version("0.0.3")
  .option("--json", "Output raw JSON instead of formatted text");

// Default action: no subcommand → start MCP server on stdio
program.action(async () => {
  const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
  const { createMcpServer } = await import("./server.js");
  const server = createMcpServer();
  await server.connect(new StdioServerTransport());
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

// ─── Write Commands ─────────────────────────────────────────────

program
  .command("wallet")
  .description("Show your local wallet address, HSK balance, and voter status")
  .action(async () => {
    try {
      const data = await getWalletInfo();
      output(data, formatWalletInfo(data), program.opts());
    } catch (e) {
      fatal(e);
    }
  });

program
  .command("register")
  .description("Register your wallet as a voter (creates ZK identity on-chain)")
  .action(async () => {
    try {
      process.stderr.write("\x1b[2m  Registering on-chain...\x1b[0m\n");
      const tx = await register();
      output(tx, formatTxResult("Registration", tx), program.opts());
    } catch (e) {
      fatal(e);
    }
  });

program
  .command("create <title>")
  .description("Create a new governance proposal")
  .option("-d, --description <text>", "Proposal description", "No description provided")
  .option("-p, --period <seconds>", "Voting period in seconds (default 48h)", "172800")
  .option("-q, --quorum <n>", "Minimum total votes required", "3")
  .action(async (title: string, opts: { description: string; period: string; quorum: string }) => {
    try {
      process.stderr.write("\x1b[2m  Submitting proposal to chain...\x1b[0m\n");
      const tx = await createProposal({
        title,
        description: opts.description,
        votingPeriodSeconds: parseInt(opts.period, 10),
        quorum: parseInt(opts.quorum, 10),
      });
      output(tx, formatTxResult("Proposal creation", tx), program.opts());
    } catch (e) {
      fatal(e);
    }
  });

program
  .command("vote <proposalId> <choice>")
  .description("Cast an anonymous ZK-verified vote (choice: for|against|abstain)")
  .action(async (id: string, choice: string) => {
    try {
      const proposalId = parseInt(id, 10);
      if (isNaN(proposalId) || proposalId < 1) {
        fatal("Proposal ID must be a positive integer");
      }
      const normalizedChoice = choice.toLowerCase();
      if (!["for", "against", "abstain"].includes(normalizedChoice)) {
        fatal("Choice must be one of: for, against, abstain");
      }
      const choiceNum = normalizedChoice === "against" ? 0 : normalizedChoice === "for" ? 1 : 2;

      process.stderr.write("\x1b[2m  Generating ZK proof (this takes a few seconds)...\x1b[0m\n");
      const tx = await castVote(proposalId, choiceNum as 0 | 1 | 2);
      output(tx, formatTxResult(`Vote ${normalizedChoice.toUpperCase()} on #${proposalId}`, tx), program.opts());
    } catch (e) {
      fatal(e);
    }
  });

program
  .command("finalize <proposalId>")
  .description("Finalize a proposal after voting period has ended")
  .action(async (id: string) => {
    try {
      const proposalId = parseInt(id, 10);
      if (isNaN(proposalId) || proposalId < 1) {
        fatal("Proposal ID must be a positive integer");
      }
      process.stderr.write("\x1b[2m  Finalizing on-chain...\x1b[0m\n");
      const tx = await finalizeProposal(proposalId);
      output(tx, formatTxResult(`Finalization of #${proposalId}`, tx), program.opts());
    } catch (e) {
      fatal(e);
    }
  });

// ─── Parse ──────────────────────────────────────────────────────

program.parseAsync(process.argv).catch((e) => {
  fatal(e);
});
