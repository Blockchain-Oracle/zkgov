/**
 * MCP server factory for ZKGov.
 *
 * Creates and configures the McpServer with all 11 tools registered.
 * The caller is responsible for wiring a transport (stdio, SSE, etc.).
 *
 * Used by:
 *   - @zkgov/mcp (thin stdio wrapper for `npx @zkgov/mcp`)
 *   - CLI default action (falls back to MCP server mode when no subcommand)
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Read tools
import { registerStatsTool } from "./tools/stats.js";
import { registerProposalTool, registerListProposalsTool } from "./tools/proposal.js";
import { registerVoterTool, registerMembersTool } from "./tools/voter.js";
import { registerActivityTool } from "./tools/activity.js";

// Write tools
import {
  registerWalletTool,
  registerRegisterTool,
  registerCreateProposalTool,
  registerVoteTool,
  registerFinalizeTool,
} from "./tools/write.js";

export function createMcpServer(): McpServer {
  const server = new McpServer(
    { name: "zkgov", version: "0.0.1" },
    { capabilities: { tools: {} } }
  );

  // Read tools
  registerStatsTool(server);
  registerProposalTool(server);
  registerListProposalsTool(server);
  registerVoterTool(server);
  registerMembersTool(server);
  registerActivityTool(server);

  // Write tools
  registerWalletTool(server);
  registerRegisterTool(server);
  registerCreateProposalTool(server);
  registerVoteTool(server);
  registerFinalizeTool(server);

  return server;
}
