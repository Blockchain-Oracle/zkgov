import { CodeBlock, Callout } from '../CodeBlock';

export function McpContent() {
  return (
    <>
      <p className="lead">
        ZKGov ships with a Model Context Protocol server so AI agents can participate in
        governance. The same binary that runs the CLI also runs as an MCP stdio server when
        invoked without arguments.
      </p>

      <h2>What the MCP server exposes</h2>
      <p>
        Eleven tools are registered — six read-only and five write — covering the full
        governance surface:
      </p>

      <ul>
        <li><strong>Read:</strong> <code>zkgov-stats</code>, <code>zkgov-proposal</code>, <code>zkgov-list-proposals</code>, <code>zkgov-check-voter</code>, <code>zkgov-members</code>, <code>zkgov-activity</code></li>
        <li><strong>Write:</strong> <code>zkgov-wallet</code>, <code>zkgov-register</code>, <code>zkgov-create-proposal</code>, <code>zkgov-vote</code>, <code>zkgov-finalize</code></li>
      </ul>

      <h2>Connecting Claude Desktop</h2>
      <p>
        Add the server to your <code>claude_desktop_config.json</code>:
      </p>

      <CodeBlock
        language="json"
        filename="claude_desktop_config.json"
        code={`{
  "mcpServers": {
    "zkgov": {
      "command": "node",
      "args": ["/absolute/path/to/packages/mcp/dist/cli.js"]
    }
  }
}`}
      />

      <p>
        Restart Claude Desktop. You will see the ZKGov tools in the tool picker. Ask things like:
      </p>

      <ul>
        <li>"What proposals are currently active on ZKGov?"</li>
        <li>"Show me the details of proposal 7."</li>
        <li>"Create a proposal titled 'Fund hackathon prizes' with a 3-day voting period."</li>
        <li>"Vote 'for' on proposal 5."</li>
      </ul>

      <Callout type="warning" title="Write tools sign transactions">
        The agent will sign transactions with the wallet stored at <code>~/.zkgov/config.json</code>.
        Only give your agent access to a wallet with a small testnet balance until you trust
        its decision-making. You can override the wallet with <code>ZKGOV_PRIVATE_KEY</code>.
      </Callout>

      <h2>Why MCP for governance</h2>
      <p>
        The Semaphore privacy guarantees do not change when an agent is the one voting — a ZK
        proof is still a ZK proof. This lets you delegate participation to an agent without
        revealing which votes came from automation versus a human.
      </p>

      <p>
        An agent can:
      </p>
      <ul>
        <li>Monitor new proposals with <code>zkgov-activity</code></li>
        <li>Read full context with <code>zkgov-proposal</code></li>
        <li>Evaluate against its policy or the user's guidelines</li>
        <li>Cast a vote via <code>zkgov-vote</code></li>
        <li>Report back with the tx hash for audit</li>
      </ul>

      <h2>Running the server directly</h2>
      <p>
        If you want to test the MCP server without Claude Desktop, invoke it with no subcommand
        and pipe JSON-RPC requests via stdin:
      </p>

      <CodeBlock
        language="bash"
        filename="terminal"
        code={`echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \\
  | node packages/mcp/dist/cli.js`}
      />

      <Callout type="tip" title="Dual-mode binary">
        The same <code>cli.js</code> is both the CLI and the MCP server. If you pass a
        subcommand, you get the CLI. With no arguments, Commander's default action falls
        through and starts the stdio MCP server. One binary, two interfaces.
      </Callout>
    </>
  );
}
