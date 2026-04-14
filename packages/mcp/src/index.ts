#!/usr/bin/env node
/**
 * @zkgov/mcp — ZKGov MCP stdio server.
 *
 * Thin wrapper: all tool implementations live in @zkgov/cli.
 * This package exists so `npx @zkgov/mcp` works cleanly with
 * MCP hosts (Claude Code, Cursor, Windsurf, VS Code, etc.).
 *
 * Install:
 *   claude mcp add zkgov npx @zkgov/mcp
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "@zkgov/cli";

async function main() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  process.stderr.write(
    `[zkgov-mcp] fatal: ${error instanceof Error ? error.stack ?? error.message : String(error)}\n`
  );
  process.exit(1);
});
