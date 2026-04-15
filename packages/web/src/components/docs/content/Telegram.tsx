import { CodeBlock, Callout } from '../CodeBlock';

export function TelegramContent() {
  return (
    <>
      <p className="lead">
        The ZKGov Telegram bot lets you browse proposals and check platform stats
        directly from any Telegram chat — no wallet, no web app required. It is a
        read-only interface: viewing proposals, tallies, and activity is instant.
        To cast an anonymous vote from Telegram, pair it with{' '}
        <a href="/docs/openclaw">OpenClaw</a>.
      </p>

      <h2>Add the bot</h2>
      <p>
        Search for <strong>@zkgovbot</strong> in Telegram, or open the link directly:
      </p>
      <CodeBlock
        language="bash"
        filename="telegram"
        code={`https://t.me/zkgovbot`}
      />
      <p>Send <code>/start</code> to get started.</p>

      <h2>Commands</h2>

      <h3>/proposals</h3>
      <p>
        Returns a paginated list of proposals (3 per page). Each entry shows the
        title, current vote tallies as text bars, quorum progress, and time remaining.
        Tap a proposal to see its full detail — description, creator, and explorer link.
      </p>

      <h3>/stats</h3>
      <p>
        Shows the current platform stats: total proposals, registered voters,
        and total comments. Sourced live from the contract on every call.
      </p>

      <h3>/help</h3>
      <p>Lists all available commands and links to the web app.</p>

      <Callout type="info" title="Read-only">
        The Telegram bot is a read interface. It cannot generate ZK proofs or sign
        transactions. To vote anonymously from Telegram, use{' '}
        <a href="/docs/openclaw">OpenClaw</a> — an open-source agent platform
        that connects ZKGov&apos;s MCP server to Telegram (and 20+ other chat apps).
      </Callout>

      <h2>What the bot shows</h2>
      <p>
        Every proposal entry in <code>/proposals</code> includes:
      </p>
      <ul>
        <li>Status badge (Active / Ended / Succeeded / Defeated)</li>
        <li>Vote bars — For / Against / Abstain as inline text progress</li>
        <li>Quorum progress (e.g. <code>4/5 required</code>)</li>
        <li>Time remaining or end timestamp</li>
        <li>Block explorer link for the proposal creation tx</li>
      </ul>

      <h2>Voting from Telegram</h2>
      <p>
        The bot links you to the web app for voting. For a fully in-chat experience —
        browse proposals, cast ZK-verified votes, and finalize outcomes without
        leaving Telegram — set up OpenClaw with the ZKGov MCP server:
      </p>
      <CodeBlock
        language="bash"
        filename="terminal"
        code={`# Add ZKGov to OpenClaw
openclaw mcp set zkgov '{"command":"npx","args":["-y","@zkgov/mcp"]}'
openclaw restart

# Install the skill
openclaw skill add zkgov`}
      />
      <p>
        After setup, send natural language messages in any OpenClaw-connected chat:
      </p>
      <CodeBlock
        language="bash"
        filename="telegram"
        code={`List active proposals
Vote for proposal 1
Show my voter status`}
      />
      <p>
        See the <a href="/docs/openclaw">OpenClaw guide</a> for the full setup walkthrough.
      </p>
    </>
  );
}
