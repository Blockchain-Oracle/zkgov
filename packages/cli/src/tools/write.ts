import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getWalletInfo,
  register,
  createProposal,
  castVote,
  finalizeProposal,
} from "../lib/writes.js";
import { ok, err } from "../lib/format.js";

export function registerWalletTool(server: McpServer) {
  server.tool(
    "zkgov-wallet",
    "Show the agent's wallet info: address, HSK balance, and voter registration status. On first call, auto-generates a new wallet stored at ~/.zkgov/config.json.",
    {},
    async () => {
      try {
        return ok(await getWalletInfo());
      } catch (e: any) {
        return err(`Failed to read wallet: ${e.message}`);
      }
    }
  );
}

export function registerRegisterTool(server: McpServer) {
  server.tool(
    "zkgov-register",
    "Register the agent's wallet as a voter on ZKGov. Creates a Semaphore identity from the wallet private key and submits it on-chain. Returns tx hash.",
    {},
    async () => {
      try {
        return ok(await register());
      } catch (e: any) {
        return err(`Failed to register: ${e.message}`);
      }
    }
  );
}

export function registerCreateProposalTool(server: McpServer) {
  server.tool(
    "zkgov-create-proposal",
    "Create a new governance proposal on ZKGov. The agent's wallet pays gas and becomes the creator. Returns tx hash and the new proposal ID.",
    {
      title: z.string().min(1).max(200).describe("Proposal title"),
      description: z.string().min(1).describe("Proposal description (markdown supported)"),
      votingPeriodSeconds: z.number().int().min(3600).max(2592000).default(172800).describe("Voting period in seconds (min 1h, max 30d, default 48h)"),
      quorum: z.number().int().min(1).default(3).describe("Minimum total votes required (default 3)"),
    },
    async (args) => {
      try {
        return ok(await createProposal(args));
      } catch (e: any) {
        return err(`Failed to create proposal: ${e.message}`);
      }
    }
  );
}

export function registerVoteTool(server: McpServer) {
  server.tool(
    "zkgov-vote",
    "Cast an anonymous ZK-verified vote on a proposal. Generates a Groth16 proof locally (~3-5 seconds) and submits it. The vote is unlinkable to the wallet address. Requires the wallet to already be registered.",
    {
      proposalId: z.number().int().positive().describe("The proposal ID to vote on"),
      choice: z.enum(["for", "against", "abstain"]).describe("Vote choice"),
    },
    async ({ proposalId, choice }) => {
      try {
        const choiceNum = choice === "against" ? 0 : choice === "for" ? 1 : 2;
        return ok(await castVote(proposalId, choiceNum as 0 | 1 | 2));
      } catch (e: any) {
        return err(`Failed to vote: ${e.message}`);
      }
    }
  );
}

export function registerFinalizeTool(server: McpServer) {
  server.tool(
    "zkgov-finalize",
    "Finalize a proposal after its voting period has ended. Anyone can call this. Records the final outcome on-chain. Returns tx hash.",
    { proposalId: z.number().int().positive().describe("The proposal ID to finalize") },
    async ({ proposalId }) => {
      try {
        return ok(await finalizeProposal(proposalId));
      } catch (e: any) {
        return err(`Failed to finalize: ${e.message}`);
      }
    }
  );
}
