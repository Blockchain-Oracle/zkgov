import { CodeBlock, Callout } from '../CodeBlock';

export function VotingFlowContent() {
  return (
    <>
      <p className="lead">
        The end-to-end voting flow has five steps. Most of the work happens in the browser —
        the contract only sees the final proof and the vote choice.
      </p>

      <h2>Step 1 — Open a proposal</h2>
      <p>
        Go to <strong>Proposals</strong>, pick one that is still active, and open its detail
        page. You will see the title, description, current tally, quorum progress, and the
        voting panel on the right side.
      </p>

      <h2>Step 2 — Confirm prerequisites</h2>
      <p>
        The voting panel guards these conditions in order:
      </p>
      <ol>
        <li><strong>Wallet connected</strong> — otherwise, a connect button.</li>
        <li><strong>ZK identity exists</strong> — otherwise, a sign-message prompt to derive one.</li>
        <li><strong>Registered on-chain</strong> — otherwise, a single tx to add your commitment to the group.</li>
      </ol>

      <p>
        These are one-time steps per wallet. Once done, you land directly on the vote UI for
        every future proposal.
      </p>

      <h2>Step 3 — Generate the proof</h2>
      <p>
        When you click <strong>For</strong> / <strong>Against</strong> / <strong>Abstain</strong>,
        the browser does three things locally:
      </p>
      <ol>
        <li>Fetches every registered member from <code>MemberRegistered</code> events.</li>
        <li>Builds a Merkle tree containing all commitments.</li>
        <li>Runs the Semaphore Groth16 circuit with your identity, the tree, the vote (as the "message"), and the proposal ID (as the "scope").</li>
      </ol>

      <CodeBlock
        language="typescript"
        code={`import { Group, generateProof } from "@semaphore-protocol/core";

const group = new Group(commitments.map(BigInt));
const proof = await generateProof(identity, group, choice, proposal.id);`}
      />

      <Callout type="info" title="Proof time">
        Proof generation takes 3–5 seconds in the browser. This is normal for Groth16 and is
        the dominant cost of ZK voting. The first vote in a fresh tab is slightly slower
        because the WASM circuit has to be compiled.
      </Callout>

      <h2>Step 4 — Submit on-chain</h2>
      <p>
        The browser sends a <code>castVote</code> transaction with the proof components and
        the vote choice. Your wallet pops up — you sign and broadcast. Gas is paid from the
        signing address.
      </p>

      <CodeBlock
        language="typescript"
        code={`await contract.castVote(
  BigInt(proposal.id),
  BigInt(proof.merkleTreeDepth),
  BigInt(proof.merkleTreeRoot),
  BigInt(proof.nullifier),
  BigInt(proof.message),
  proof.points.map(BigInt),
);`}
      />

      <h2>Step 5 — On-chain verification</h2>
      <p>
        The contract calls <code>semaphore.validateProof</code>, which:
      </p>
      <ul>
        <li>Checks the Merkle root matches the current on-chain group state.</li>
        <li>Verifies the Groth16 proof using the precompiled pairing verifier.</li>
        <li>Reverts if the nullifier was already used for this proposal.</li>
      </ul>

      <p>
        If all three pass, the contract increments the tally for your choice and records the
        nullifier. Your transaction hash is now a permanent, anonymous, verifiable vote.
      </p>

      <Callout type="success" title="What the UI shows after">
        The vote UI replaces itself with a "Vote Recorded" state and a link to the transaction
        on the explorer. The state is cached locally so a page refresh does not bring back the
        vote buttons.
      </Callout>
    </>
  );
}
