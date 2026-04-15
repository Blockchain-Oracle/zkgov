import { CodeBlock, Callout } from '../CodeBlock';
import { ConfigTabs } from '../ConfigTabs';

export function McpContent() {
  return (
    <>
      <p className="lead">
        ZKGov ships as two npm packages: an MCP server for AI agents and a CLI for humans.
        It also ships as an agent skill that teaches any LLM when and how to use the tools.
      </p>

      <h2>Install the MCP server</h2>
      <p>
        The fastest way to give your agent access to ZKGov. Pick your platform:
      </p>

      <ConfigTabs tabs={[
        {
          label: 'Claude Code',
          language: 'bash',
          code: 'claude mcp add zkgov npx @zkgov/mcp',
        },
        {
          label: 'Cursor',
          language: 'json',
          code: `// .cursor/mcp.json
{
  "mcpServers": {
    "zkgov": {
      "command": "npx",
      "args": ["-y", "@zkgov/mcp"]
    }
  }
}`,
        },
        {
          label: 'Windsurf',
          language: 'json',
          code: `// ~/.codeium/windsurf/mcp_config.json
{
  "mcpServers": {
    "zkgov": {
      "command": "npx",
      "args": ["-y", "@zkgov/mcp"]
    }
  }
}`,
        },
        {
          label: 'VS Code',
          language: 'json',
          code: `// .vscode/mcp.json
{
  "servers": {
    "zkgov": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@zkgov/mcp"]
    }
  }
}`,
        },
        {
          label: 'Claude Desktop',
          language: 'json',
          code: `// claude_desktop_config.json
{
  "mcpServers": {
    "zkgov": {
      "command": "npx",
      "args": ["-y", "@zkgov/mcp"]
    }
  }
}`,
        },
        {
          label: 'Gemini CLI',
          language: 'bash',
          code: 'gemini mcp add zkgov npx -y @zkgov/mcp',
        },
        {
          label: 'Codex',
          language: 'bash',
          code: 'codex mcp add zkgov npx -y @zkgov/mcp',
        },
        {
          label: 'Zed',
          language: 'json',
          code: `// ~/.config/zed/settings.json
{
  "context_servers": {
    "zkgov": {
      "command": {
        "path": "npx",
        "args": ["-y", "@zkgov/mcp"]
      },
      "source": "custom"
    }
  }
}`,
        },
      ]} />

      <Callout type="tip" title="No local paths needed">
        <code>npx @zkgov/mcp</code> downloads and runs the server automatically.
        See the full platform list + skill paths at <a href="/skill">/skill</a>.
      </Callout>

      <h2>Install the agent skill</h2>
      <p>
        The skill teaches agents <em>when</em> to invoke ZKGov tools and <em>how</em> to
        handle responses — trigger keywords, tool selection, wallet management, error handling.
      </p>

      <ConfigTabs tabs={[
        {
          label: 'Skills CLI',
          language: 'bash',
          code: 'pnpm dlx skills add github:Blockchain-Oracle/zkgov --skill zkgov',
        },
        {
          label: 'npx',
          language: 'bash',
          code: 'npx skills add github:Blockchain-Oracle/zkgov --skill zkgov',
        },
        {
          label: 'Prompt',
          language: 'text',
          code: 'Read https://zkgov.app/docs/skills and follow the instructions.',
        },
        {
          label: 'Manual',
          language: 'bash',
          code: `mkdir -p ~/.claude/skills/zkgov
curl -o ~/.claude/skills/zkgov/SKILL.md https://zkgov.app/docs/skills`,
        },
      ]} />

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
