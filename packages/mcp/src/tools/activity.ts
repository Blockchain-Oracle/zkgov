import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseAbiItem, decodeEventLog } from "viem";
import { publicClient, ZK_VOTING, EXPLORER_URL, DEPLOYMENT_BLOCK } from "../lib/chain.js";
import { ok, err } from "../lib/format.js";

const proposalCreatedEvent = parseAbiItem("event ProposalCreated(uint256 indexed proposalId, address indexed creator, string title, uint256 votingEnd)");
const voteCastEvent = parseAbiItem("event VoteCast(uint256 indexed proposalId, uint256 nullifier, uint8 choice)");
const memberRegisteredEvent = parseAbiItem("event MemberRegistered(address indexed member, uint256 commitment)");

export function registerActivityTool(server: McpServer) {
  server.tool(
    "zkgov-activity",
    "Get recent on-chain governance activity: proposals created, votes cast, and voter registrations. Parsed from contract events with transaction hashes and explorer links.",
    { limit: z.number().int().min(1).max(50).default(20).describe("Max events to return (default 20)") },
    async ({ limit }) => {
      try {
        const logs = await publicClient.getLogs({
          address: ZK_VOTING,
          fromBlock: BigInt(DEPLOYMENT_BLOCK),
          toBlock: "latest",
        });

        const choices = ["Against", "For", "Abstain"];
        const activity: any[] = [];

        for (const log of logs.slice(-limit * 2)) {
          const txHash = log.transactionHash;
          const explorerUrl = `${EXPLORER_URL}/tx/${txHash}`;

          try {
            const decoded = decodeEventLog({ abi: [proposalCreatedEvent], data: log.data, topics: log.topics });
            activity.push({
              type: "proposal_created",
              proposalId: Number((decoded.args as any).proposalId),
              title: (decoded.args as any).title,
              creator: (decoded.args as any).creator,
              txHash,
              explorerUrl,
            });
            continue;
          } catch {}

          try {
            const decoded = decodeEventLog({ abi: [voteCastEvent], data: log.data, topics: log.topics });
            activity.push({
              type: "vote_cast",
              proposalId: Number((decoded.args as any).proposalId),
              choice: choices[(decoded.args as any).choice] || "Unknown",
              txHash,
              explorerUrl,
            });
            continue;
          } catch {}

          try {
            const decoded = decodeEventLog({ abi: [memberRegisteredEvent], data: log.data, topics: log.topics });
            activity.push({
              type: "member_registered",
              member: (decoded.args as any).member,
              txHash,
              explorerUrl,
            });
          } catch {}
        }

        return ok({ total: activity.length, events: activity.slice(-limit).reverse() });
      } catch (e: any) {
        return err(`Failed to fetch activity: ${e.message}`);
      }
    }
  );
}
