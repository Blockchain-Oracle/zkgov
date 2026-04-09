#!/usr/bin/env node
/**
 * ZKGov MCP Server
 *
 * Exposes ZKVoting contract data as MCP tools so AI agents
 * can query governance proposals, vote tallies, voter status,
 * and on-chain activity on HashKey Chain.
 *
 * Usage:
 *   npx @zkgov/mcp            (stdio transport)
 *   Add to claude_desktop_config.json as an MCP server
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerStatsTool } from "./tools/stats.js";
import { registerProposalTool, registerListProposalsTool } from "./tools/proposal.js";
import { registerVoterTool, registerMembersTool } from "./tools/voter.js";
import { registerActivityTool } from "./tools/activity.js";

const server = new McpServer(
  { name: "zkgov", version: "0.0.1" },
  { capabilities: { tools: {} } }
);

// Register all tools
registerStatsTool(server);
registerProposalTool(server);
registerListProposalsTool(server);
registerVoterTool(server);
registerMembersTool(server);
registerActivityTool(server);

// Start with stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
