import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { publicClient, ZK_VOTING, EXPLORER_URL } from "../lib/chain.js";
import { ZK_VOTING_ABI } from "../lib/abi.js";
import { ok, err } from "../lib/format.js";

export function registerStatsTool(server: McpServer) {
  server.tool(
    "zkgov-stats",
    "Get ZKGov platform statistics: total proposals, registered members, and group ID. All data read directly from the ZKVoting smart contract on HashKey Chain testnet.",
    {},
    async () => {
      try {
        const [totalProposals, totalMembers, activeGroupId] = await publicClient.readContract({
          address: ZK_VOTING,
          abi: ZK_VOTING_ABI,
          functionName: "getStats",
        }) as [bigint, bigint, bigint];

        return ok({
          totalProposals: Number(totalProposals),
          totalMembers: Number(totalMembers),
          activeGroupId: Number(activeGroupId),
          contract: ZK_VOTING,
          explorer: `${EXPLORER_URL}/address/${ZK_VOTING}`,
          chain: "HashKey Chain Testnet (ID: 133)",
        });
      } catch (e: any) {
        return err(`Failed to read stats: ${e.message}`);
      }
    }
  );
}
