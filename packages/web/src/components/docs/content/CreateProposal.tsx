import { CodeBlock, Callout } from '../CodeBlock';

export function CreateProposalContent() {
  return (
    <>
      <p className="lead">
        Anyone with a funded wallet can create a proposal. The creator sets the title,
        description, voting period, and quorum. There are no extra permissions or whitelists.
      </p>

      <h2>From the web UI</h2>
      <p>
        Open <strong>Proposals → Create Proposal</strong>. The form has four fields:
      </p>
      <ul>
        <li><strong>Title</strong> — a single-line summary shown in lists and cards.</li>
        <li><strong>Description</strong> — markdown-friendly long-form text with context and rationale.</li>
        <li><strong>Voting period</strong> — how long the voting window stays open, in hours or days.</li>
        <li><strong>Quorum</strong> — the minimum number of votes required for the result to count.</li>
      </ul>

      <p>
        Click submit and sign the transaction. The proposal is live as soon as the transaction
        confirms — there is no review queue or approval step.
      </p>

      <h2>From the CLI</h2>
      <p>
        The same action from the terminal, scriptable and useful for bots:
      </p>

      <CodeBlock
        language="bash"
        filename="terminal"
        code={`zkgov create "Increase validator rewards by 15%" \\
  --description "See governance forum post #42 for rationale." \\
  --period 172800 \\
  --quorum 5`}
      />

      <p>
        <code>--period</code> is in seconds (172800 = 48 hours). The CLI uses the wallet stored
        at <code>~/.zkgov/config.json</code> by default.
      </p>

      <h2>Choosing a voting period</h2>
      <p>
        Short periods work for uncontroversial operational decisions. Longer periods (3–7 days)
        work for anything with community impact — they give participants in different time zones
        a fair chance to review and vote.
      </p>

      <Callout type="tip" title="Good defaults">
        48 hours is a reasonable default for most proposals. Use 1 hour only for emergency
        pause actions. Never exceed 30 days — the contract enforces this as a hard cap.
      </Callout>

      <h2>Choosing a quorum</h2>
      <p>
        Quorum is the minimum total votes (for + against + abstain) required for the proposal
        to be considered valid. If the period ends without quorum, the proposal cannot pass
        regardless of the for/against ratio.
      </p>

      <ul>
        <li>Low quorum (1–3) → easier to pass, but vulnerable to quiet manipulation.</li>
        <li>High quorum (majority of registered voters) → harder to pass, but stronger legitimacy.</li>
      </ul>

      <h2>Lifecycle</h2>
      <ol>
        <li><strong>Created</strong> — proposal is written on-chain, voting window opens immediately.</li>
        <li><strong>Active</strong> — members can cast ZK votes.</li>
        <li><strong>Ended</strong> — voting window closed, but not yet finalized.</li>
        <li><strong>Finalized</strong> — someone calls <code>finalizeProposal(id)</code> to record the final outcome (passed / defeated).</li>
      </ol>

      <Callout type="warning" title="Finalization is not automatic">
        After the voting window ends, the proposal stays in "ended" status until someone
        calls <code>finalizeProposal</code>. Any address can do this — it is just a state
        transition. The UI shows an "awaiting finalization" badge for these.
      </Callout>
    </>
  );
}
