#!/usr/bin/env node
/**
 * ZKGov MCP Server
 *
 * Exposes ZKVoting contract data AND write operations as MCP tools
 * so AI agents can query governance state, register, create proposals,
 * vote anonymously with ZK proofs, and finalize proposals.
 *
 * The server manages its own wallet at ~/.zkgov/config.json.
 *
 * Usage:
 *   zkgov                     (stdio transport, default action)
 *   Add to claude_desktop_config.json as an MCP server
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

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

const server = new McpServer(
  { name: "zkgov", version: "0.0.1" },
  { capabilities: { tools: {} } }
);

// ── Read tools ──
registerStatsTool(server);
registerProposalTool(server);
registerListProposalsTool(server);
registerVoterTool(server);
registerMembersTool(server);
registerActivityTool(server);

// ── Write tools ──
registerWalletTool(server);
registerRegisterTool(server);
registerCreateProposalTool(server);
registerVoteTool(server);
registerFinalizeTool(server);

// Start with stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
