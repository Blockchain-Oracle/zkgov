import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getProposal, listProposals } from "../lib/queries.js";
import { ok, err } from "../lib/format.js";

export function registerProposalTool(server: McpServer) {
  server.tool(
    "zkgov-proposal",
    "Get full details of a governance proposal by ID, including title, description, creator, vote tallies, quorum, timing, and status. Reads directly from the ZKVoting contract.",
    { proposalId: z.number().int().positive().describe("The proposal ID (1-based)") },
    async ({ proposalId }) => {
      try {
        return ok(await getProposal(proposalId));
      } catch (e: any) {
        return err(`Failed to read proposal ${proposalId}: ${e.message}`);
      }
    }
  );
}

export function registerListProposalsTool(server: McpServer) {
  server.tool(
    "zkgov-list-proposals",
    "List all governance proposals with their current vote tallies and status. Returns a summary of every proposal on-chain.",
    {},
    async () => {
      try {
        const proposals = await listProposals();
        return ok({ total: proposals.length, proposals });
      } catch (e: any) {
        return err(`Failed to list proposals: ${e.message}`);
      }
    }
  );
}
