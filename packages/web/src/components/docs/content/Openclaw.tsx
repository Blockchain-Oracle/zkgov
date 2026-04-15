import { CodeBlock, Callout } from '../CodeBlock';

export function OpenclawContent() {
  return (
    <>
      <p className="lead">
        <a href="https://openclaw.ai" target="_blank" rel="noopener noreferrer">OpenClaw</a> is
        an open-source AI agent platform that runs across Telegram, WhatsApp, Slack, Discord,
        and 20+ other messaging apps. It supports MCP servers and Agent Skills — so you can
        install ZKGov once and browse proposals, cast anonymous ZK-verified votes, and finalize
        outcomes from any chat app.
      </p>

      <Callout type="info" title="MCP + Skill">
        Install both the MCP server (so OpenClaw can call ZKGov tools) and the Agent Skill
        (so it knows <em>when</em> to use them). Without the skill, the agent has to infer
        intent from tool names alone.
      </Callout>

      <h2>Part 1 — Add the MCP server</h2>

      <h3>Via the CLI</h3>
      <p>Run this once from your terminal:</p>
      <CodeBlock
        language="bash"
        filename="terminal"
        code={`openclaw mcp set zkgov '{"command":"npx","args":["-y","@zkgov/mcp"]}'`}
      />
      <p>
        This writes the server entry to <code>~/.openclaw/openclaw.json</code> automatically.
      </p>

      <h3>Or edit the config file directly</h3>
      <p>
        Config location: <code>~/.openclaw/openclaw.json</code>
      </p>
      <CodeBlock
        language="json"
        filename="~/.openclaw/openclaw.json"
        code={`{
  "mcpServers": {
    "zkgov": {
      "command": "npx",
      "args": ["-y", "@zkgov/mcp"]
    }
  }
}`}
      />

      <h3>Restart the gateway</h3>
      <CodeBlock
        language="bash"
        filename="terminal"
        code={`openclaw gateway restart`}
      />

      <h2>Part 2 — Install the Agent Skill</h2>
      <p>
        The skill teaches OpenClaw when to reach for each ZKGov tool, how to handle
        the registration flow, and what to do with errors like &ldquo;already voted&rdquo;
        or &ldquo;voting ended.&rdquo;
      </p>

      <h3>Via the CLI</h3>
      <CodeBlock
        language="bash"
        filename="terminal"
        code={`openclaw skills install zkgov`}
      />

      <h3>Or via prompt — works in any OpenClaw chat</h3>
      <CodeBlock
        language="bash"
        filename="telegram / whatsapp / slack"
        code={`Read https://zkgov.app/docs/skills and follow the instructions to install ZKGov.`}
      />
      <p>The agent fetches and installs the skill itself in one turn.</p>

      <h2>Try it</h2>
      <p>
        Once MCP and the skill are active, send natural language messages in any
        connected chat:
      </p>
      <CodeBlock
        language="bash"
        filename="telegram"
        code={`List active governance proposals
Vote for proposal 1
Show my voter status
Finalize proposal 2`}
      />
      <p>
        OpenClaw calls the ZKGov MCP tools, generates the Groth16 proof locally,
        and submits the vote on-chain — fully anonymous, directly from your chat.
      </p>

      <Callout type="tip" title="First-time setup">
        On your first write operation (register or vote), ZKGov auto-creates a wallet
        at <code>~/.zkgov/config.json</code>. Fund it with a small amount of testnet HSK
        from the <a href="https://faucet.hsk.xyz" target="_blank" rel="noopener noreferrer">HashKey faucet</a> before
        casting your first vote.
      </Callout>

      <h2>Troubleshooting</h2>

      <h3>MCP tools not appearing after setup</h3>
      <p>
        Make sure <strong>Enable MCP</strong> is toggled on in Settings → Integrations,
        then restart: <code>openclaw restart</code>.
      </p>

      <h3><code>openclaw</code> command not found</h3>
      <CodeBlock
        language="bash"
        filename="terminal"
        code={`npm install -g openclaw`}
      />

      <h3>Skill not triggering</h3>
      <p>
        Check the Skills panel — ZKGov should show as active. If installed but not
        triggering, invoke it explicitly: <em>&ldquo;Use ZKGov to list proposals.&rdquo;</em>
      </p>

      <h3>Wallet needs funds</h3>
      <p>
        Get testnet HSK from the{' '}
        <a href="https://faucet.hsk.xyz" target="_blank" rel="noopener noreferrer">
          HashKey faucet
        </a>. Gas costs are negligible — a few votes cost fractions of a cent.
      </p>
    </>
  );
}
