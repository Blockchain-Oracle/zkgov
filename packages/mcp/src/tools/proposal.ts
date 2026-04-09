import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { publicClient, ZK_VOTING, EXPLORER_URL } from "../lib/chain.js";
import { ZK_VOTING_ABI } from "../lib/abi.js";
import { ok, err } from "../lib/format.js";

export function registerProposalTool(server: McpServer) {
  server.tool(
    "zkgov-proposal",
    "Get full details of a governance proposal by ID, including title, description, creator, vote tallies, quorum, timing, and status. Reads directly from the ZKVoting contract.",
    { proposalId: z.number().int().positive().describe("The proposal ID (1-based)") },
    async ({ proposalId }) => {
      try {
        const content = await publicClient.readContract({
          address: ZK_VOTING,
          abi: ZK_VOTING_ABI,
          functionName: "getProposalContent",
          args: [BigInt(proposalId)],
        }) as [string, string, string];

        const state = await publicClient.readContract({
          address: ZK_VOTING,
          abi: ZK_VOTING_ABI,
          functionName: "getProposalState",
          args: [BigInt(proposalId)],
        }) as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean, boolean, boolean];

        const [title, description, creator] = content;
        const [votingStart, votingEnd, quorum, votesFor, votesAgainst, votesAbstain, totalVotes, finalized, passed, isActive] = state;

        return ok({
          id: proposalId,
          title,
          description,
          creator,
          votingStart: new Date(Number(votingStart) * 1000).toISOString(),
          votingEnd: new Date(Number(votingEnd) * 1000).toISOString(),
          quorum: Number(quorum),
          votes: {
            for: Number(votesFor),
            against: Number(votesAgainst),
            abstain: Number(votesAbstain),
            total: Number(totalVotes),
          },
          status: finalized ? (passed ? "passed" : "defeated") : isActive ? "active" : "ended",
          finalized,
          passed,
          isActive,
          explorer: `${EXPLORER_URL}/address/${ZK_VOTING}`,
        });
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
        const count = await publicClient.readContract({
          address: ZK_VOTING,
          abi: ZK_VOTING_ABI,
          functionName: "proposalCount",
        }) as bigint;

        const proposals = [];
        for (let i = 1; i <= Number(count); i++) {
          const content = await publicClient.readContract({
            address: ZK_VOTING,
            abi: ZK_VOTING_ABI,
            functionName: "getProposalContent",
            args: [BigInt(i)],
          }) as [string, string, string];

          const state = await publicClient.readContract({
            address: ZK_VOTING,
            abi: ZK_VOTING_ABI,
            functionName: "getProposalState",
            args: [BigInt(i)],
          }) as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean, boolean, boolean];

          const [title, , creator] = content;
          const [, votingEnd, quorum, votesFor, votesAgainst, votesAbstain, totalVotes, finalized, passed, isActive] = state;

          proposals.push({
            id: i,
            title,
            creator,
            votingEnd: new Date(Number(votingEnd) * 1000).toISOString(),
            votes: { for: Number(votesFor), against: Number(votesAgainst), abstain: Number(votesAbstain), total: Number(totalVotes) },
            quorum: Number(quorum),
            status: finalized ? (passed ? "passed" : "defeated") : isActive ? "active" : "ended",
          });
        }

        return ok({ total: proposals.length, proposals });
      } catch (e: any) {
        return err(`Failed to list proposals: ${e.message}`);
      }
    }
  );
}
