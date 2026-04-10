import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getStats } from "../lib/queries.js";
import { ok, err } from "../lib/format.js";

export function registerStatsTool(server: McpServer) {
  server.tool(
    "zkgov-stats",
    "Get ZKGov platform statistics: total proposals, registered members, and group ID. All data read directly from the ZKVoting smart contract on HashKey Chain testnet.",
    {},
    async () => {
      try {
        return ok(await getStats());
      } catch (e: any) {
        return err(`Failed to read stats: ${e.message}`);
      }
    }
  );
}
