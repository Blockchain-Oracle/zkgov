import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { publicClient, ZK_VOTING, EXPLORER_URL } from "../lib/chain.js";
import { ZK_VOTING_ABI } from "../lib/abi.js";
import { ok, err } from "../lib/format.js";

export function registerVoterTool(server: McpServer) {
  server.tool(
    "zkgov-check-voter",
    "Check if a wallet address is registered as a voter in ZKGov. Returns registration status and Semaphore identity commitment.",
    { address: z.string().describe("Ethereum/HashKey wallet address (0x...)") },
    async ({ address }) => {
      try {
        const result = await publicClient.readContract({
          address: ZK_VOTING,
          abi: ZK_VOTING_ABI,
          functionName: "isVoter",
          args: [address as `0x${string}`],
        }) as [boolean, bigint];

        return ok({
          address,
          registered: result[0],
          commitment: result[0] ? result[1].toString() : null,
          explorer: `${EXPLORER_URL}/address/${address}`,
        });
      } catch (e: any) {
        return err(`Failed to check voter: ${e.message}`);
      }
    }
  );
}

export function registerMembersTool(server: McpServer) {
  server.tool(
    "zkgov-members",
    "Get the total number of registered voters and the current Merkle tree root of the Semaphore group. Useful for verifying group state.",
    {},
    async () => {
      try {
        const [count, root, depth] = await Promise.all([
          publicClient.readContract({ address: ZK_VOTING, abi: ZK_VOTING_ABI, functionName: "memberCount" }) as Promise<bigint>,
          publicClient.readContract({ address: ZK_VOTING, abi: ZK_VOTING_ABI, functionName: "getMerkleRoot" }) as Promise<bigint>,
          publicClient.readContract({ address: ZK_VOTING, abi: ZK_VOTING_ABI, functionName: "getMerkleDepth" }) as Promise<bigint>,
        ]);

        return ok({
          memberCount: Number(count),
          merkleRoot: root.toString(),
          merkleDepth: Number(depth),
        });
      } catch (e: any) {
        return err(`Failed to read members: ${e.message}`);
      }
    }
  );
}
