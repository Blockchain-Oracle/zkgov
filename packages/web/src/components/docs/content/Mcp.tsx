import { CodeBlock, Callout } from '../CodeBlock';

export function McpContent() {
  return (
    <>
      <p className="lead">
        ZKGov ships as two npm packages: an MCP server for AI agents and a CLI for humans.
        It also ships as an agent skill that teaches any LLM when and how to use the tools.
      </p>

      <h2>Install the MCP server</h2>
      <p>
        The fastest way to give your agent access to ZKGov is via the MCP server.
        Works with Claude Code, Cursor, Windsurf, VS Code, and any MCP-compatible host.
      </p>

      <CodeBlock
        language="bash"
        filename="Claude Code"
        code={`claude mcp add zkgov npx @zkgov/mcp`}
      />

      <CodeBlock
        language="bash"
        filename="Gemini CLI"
        code={`gemini mcp add zkgov npx -y @zkgov/mcp`}
      />

      <CodeBlock
        language="bash"
        filename="OpenAI Codex"
        code={`codex mcp add zkgov npx -y @zkgov/mcp`}
      />

      <CodeBlock
        language="json"
        filename="Cursor / Windsurf / Claude Desktop — mcp config"
        code={`{
  "mcpServers": {
    "zkgov": {
      "command": "npx",
      "args": ["-y", "@zkgov/mcp"]
    }
  }
}`}
      />

      <CodeBlock
        language="json"
        filename="VS Code Copilot — .vscode/mcp.json"
        code={`{
  "servers": {
    "zkgov": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@zkgov/mcp"]
    }
  }
}`}
      />

      <CodeBlock
        language="json"
        filename="Zed — ~/.config/zed/settings.json"
        code={`{
  "context_servers": {
    "zkgov": {
      "command": { "path": "npx", "args": ["-y", "@zkgov/mcp"] },
      "source": "custom"
    }
  }
}`}
      />

      <Callout type="tip" title="No local paths needed">
        <code>npx @zkgov/mcp</code> downloads and runs the server automatically.
        No cloning repos or pointing to local dist folders. See the full list of
        supported platforms at <a href="/skill">/skill</a>.
      </Callout>

      <h2>Install the agent skill</h2>
      <p>
        The skill is a procedural instruction file that teaches agents <em>when</em> to
        invoke ZKGov tools and <em>how</em> to handle responses. It covers trigger keywords,
        tool selection, wallet management, and error handling.
      </p>

      <CodeBlock
        language="bash"
        filename="terminal"
        code={`# Via the community skills CLI (works with 12+ agent platforms)
pnpm dlx skills add github:Blockchain-Oracle/zkgov --skill zkgov

# Or manually — copy SKILL.md into your agent's skill directory
cp packages/skills/zkgov/SKILL.md ~/.claude/skills/zkgov/SKILL.md`}
      />

      <p>
        The skill and MCP server complement each other:
      </p>
      <ul>
        <li><strong>MCP server</strong> gives the agent the <em>ability</em> to call contract functions.</li>
        <li><strong>Skill</strong> gives the agent the <em>judgment</em> to know when to use which tool.</li>
      </ul>

      <h2>What the MCP server exposes</h2>
      <p>
        Eleven tools — six read-only, five write — covering the full governance surface:
      </p>

      <ul>
        <li><strong>Read:</strong> <code>zkgov-stats</code>, <code>zkgov-proposal</code>, <code>zkgov-list-proposals</code>, <code>zkgov-check-voter</code>, <code>zkgov-members</code>, <code>zkgov-activity</code></li>
        <li><strong>Write:</strong> <code>zkgov-wallet</code>, <code>zkgov-register</code>, <code>zkgov-create-proposal</code>, <code>zkgov-vote</code>, <code>zkgov-finalize</code></li>
      </ul>

      <Callout type="warning" title="Write tools sign transactions">
        The agent signs transactions with the wallet at <code>~/.zkgov/config.json</code>.
        Only give your agent a wallet with a small testnet balance until you trust its
        decision-making. Override with <code>ZKGOV_PRIVATE_KEY</code> env var.
      </Callout>

      <h2>Why MCP for governance</h2>
      <p>
        Semaphore privacy guarantees do not change when an agent votes — a ZK proof is still
        a ZK proof. This lets you delegate participation to an agent without revealing which
        votes came from automation versus a human.
      </p>

      <p>An agent workflow looks like:</p>
      <ol>
        <li>Monitor new proposals with <code>zkgov-activity</code></li>
        <li>Read full context with <code>zkgov-proposal</code></li>
        <li>Evaluate against its policy or your guidelines</li>
        <li>Cast a vote via <code>zkgov-vote</code></li>
        <li>Report the tx hash for audit</li>
      </ol>

      <h2>Architecture</h2>
      <p>
        The MCP package (<code>@zkgov/mcp</code>) is a thin ~25-line wrapper that imports
        a <code>createMcpServer()</code> factory from the CLI package (<code>@zkgov/cli</code>)
        and connects it to a stdio transport. All tool implementations, queries, writes, and
        ZK proof generation live in the CLI package.
      </p>

      <CodeBlock
        language="bash"
        filename="terminal"
        code={`# Test the MCP server directly (pipe JSON-RPC)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \\
  | npx @zkgov/mcp`}
      />

      <h2>Standalone CLI</h2>
      <p>
        If you prefer a terminal interface, install the CLI globally:
      </p>

      <CodeBlock
        language="bash"
        filename="terminal"
        code={`npm install -g @zkgov/cli
zkgov --help

# Quick examples
zkgov stats
zkgov proposals --json
zkgov vote 4 for`}
      />

      <p>
        See the <a href="/docs/cli">CLI documentation</a> for the full command reference.
      </p>
    </>
  );
}
