import { CodeBlock, Callout } from '../CodeBlock';

export function IntroductionContent() {
  return (
    <>
      <p className="lead">
        ZKGov is an anonymous governance platform built on HashKey Chain. It lets any wallet
        holder register as a voter, create proposals, and cast votes that are cryptographically
        verified on-chain — without ever linking the vote back to a wallet address.
      </p>

      <h2>The problem with on-chain voting</h2>
      <p>
        Every transaction on a public blockchain is traceable. When you vote on a proposal,
        the link between your wallet and your choice is permanent and visible to anyone.
        This creates real-world problems: voter coercion, whale intimidation, reputation risk,
        and chilling effects on controversial proposals.
      </p>

      <h2>How ZKGov solves it</h2>
      <p>
        ZKGov uses the <strong>Semaphore</strong> zero-knowledge protocol to let you prove
        two things at once without revealing your identity:
      </p>
      <ul>
        <li>You are a registered voter in the governance group.</li>
        <li>You have not already voted on this specific proposal.</li>
      </ul>

      <p>
        A Groth16 ZK proof verifies both claims on-chain in a single transaction.
        The proof includes a <em>nullifier</em> — a one-way hash of your identity and the
        proposal ID — which prevents double-voting without revealing who you are.
      </p>

      <Callout type="info" title="Privacy model">
        Your wallet address is visible in the vote transaction (someone has to pay gas),
        but the link between <em>who you are</em> and <em>how you voted</em> is mathematically
        unlinkable. A relayer or batcher can further obscure even the gas payer.
      </Callout>

      <h2>What you can do with ZKGov</h2>
      <ul>
        <li><strong>Vote anonymously</strong> on governance proposals from the web UI, CLI, or via an AI agent.</li>
        <li><strong>Create proposals</strong> with custom voting periods and quorum requirements.</li>
        <li><strong>Verify results</strong> directly from the blockchain — no centralized API required.</li>
        <li><strong>Build on top</strong> with the MCP server so agents can participate.</li>
      </ul>

      <h2>Who is this for</h2>
      <p>
        ZKGov is built for DAOs, protocol governance, and any community that needs voting
        with real privacy guarantees. It is also a reference implementation for anyone
        building ZK-powered voting systems on EVM chains.
      </p>

      <CodeBlock
        language="bash"
        filename="terminal"
        code={`# Try it now from the CLI
pnpm --filter @zkgov/mcp dev stats`}
      />
    </>
  );
}
