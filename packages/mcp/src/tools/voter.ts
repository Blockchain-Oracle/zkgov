import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { checkVoter, getMembers } from "../lib/queries.js";
import { ok, err } from "../lib/format.js";

export function registerVoterTool(server: McpServer) {
  server.tool(
    "zkgov-check-voter",
    "Check if a wallet address is registered as a voter in ZKGov. Returns registration status and Semaphore identity commitment.",
    { address: z.string().describe("Ethereum/HashKey wallet address (0x...)") },
    async ({ address }) => {
      try {
        return ok(await checkVoter(address));
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
        return ok(await getMembers());
      } catch (e: any) {
        return err(`Failed to read members: ${e.message}`);
      }
    }
  );
}
