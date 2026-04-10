import { CodeBlock, Callout } from '../CodeBlock';

export function ZkIdentityContent() {
  return (
    <>
      <p className="lead">
        A Semaphore identity is a locally-generated keypair with a matching public commitment.
        It is what lets you prove membership in the voter group without revealing which member you are.
      </p>

      <h2>What is an identity</h2>
      <p>
        A Semaphore identity has three parts:
      </p>
      <ul>
        <li><strong>Trapdoor</strong> — a secret scalar, never leaves your device.</li>
        <li><strong>Nullifier secret</strong> — another secret scalar used to derive vote nullifiers.</li>
        <li><strong>Commitment</strong> — a Poseidon hash of the two secrets. This is what goes on-chain.</li>
      </ul>

      <p>
        The commitment is the only public piece. It is added to the on-chain Semaphore group
        when you register. A ZK proof can later prove "I know the secrets behind one of these
        commitments" without saying <em>which</em> one.
      </p>

      <h2>How ZKGov derives identities</h2>
      <p>
        We derive the identity deterministically from a wallet signature. When you click
        <strong> Create Identity</strong>, your wallet signs a fixed message and the resulting
        signature is used as the identity seed.
      </p>

      <CodeBlock
        language="typescript"
        code={`import { Identity } from "@semaphore-protocol/identity";

const message = "zkgov: derive identity v1";
const signature = await signer.signMessage(message);
const identity = new Identity(signature);  // deterministic`}
      />

      <Callout type="tip" title="Why deterministic?">
        Because the same wallet always produces the same signature for the same message,
        you can recover your identity on any device by reconnecting your wallet. No seed
        phrase, no QR codes, no local backup to lose.
      </Callout>

      <h2>Nullifiers — the anti-double-vote mechanism</h2>
      <p>
        For each vote, Semaphore computes a nullifier as a hash of your identity secret
        and the proposal ID (called the "scope"). The contract records every nullifier it
        has seen — if you try to vote twice on the same proposal, the second transaction
        reverts because the nullifier already exists.
      </p>

      <CodeBlock
        language="typescript"
        code={`// Same identity + same proposalId → same nullifier → revert
// Same identity + different proposalId → different nullifier → ok
// Different identity + same proposalId → different nullifier → ok`}
      />

      <h2>What is leaked and what is not</h2>
      <p>
        When you cast a vote, the transaction exposes:
      </p>
      <ul>
        <li>The vote choice (for, against, abstain)</li>
        <li>The nullifier (a random-looking hash)</li>
        <li>The Merkle root of the group at proof time</li>
        <li>Which address paid gas for the transaction</li>
      </ul>

      <p>Critically, the transaction does <strong>not</strong> expose:</p>
      <ul>
        <li>Your identity commitment</li>
        <li>Which member of the group you are</li>
        <li>Any link between votes you cast on different proposals</li>
      </ul>

      <Callout type="warning" title="Gas payer leak">
        Whoever pays gas for the transaction <em>is</em> visible. If you register with address A
        and immediately vote with address A, observers can guess you are one of the most recent
        registrants. To fully decouple, vote later — or use a relayer to have someone else
        broadcast your transaction.
      </Callout>

      <h2>Losing your identity</h2>
      <p>
        Because the identity is derived from your wallet signature, you cannot lose it as long
        as you control the wallet. If you lose access to the wallet, you lose access to the
        identity — and any nullifiers you already burned stay burned.
      </p>
    </>
  );
}
