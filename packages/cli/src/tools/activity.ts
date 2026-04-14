import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getActivity } from "../lib/queries.js";
import { ok, err } from "../lib/format.js";

export function registerActivityTool(server: McpServer) {
  server.tool(
    "zkgov-activity",
    "Get recent on-chain governance activity: proposals created, votes cast, and voter registrations. Parsed from contract events with transaction hashes and explorer links.",
    { limit: z.number().int().min(1).max(50).default(20).describe("Max events to return (default 20)") },
    async ({ limit }) => {
      try {
        const events = await getActivity(limit);
        return ok({ total: events.length, events });
      } catch (e: any) {
        return err(`Failed to fetch activity: ${e.message}`);
      }
    }
  );
}
