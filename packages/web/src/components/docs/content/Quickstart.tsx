import { CodeBlock, Callout } from '../CodeBlock';

export function QuickstartContent() {
  return (
    <>
      <p className="lead">
        Get from zero to your first anonymous vote in about two minutes. You need a wallet
        with a tiny amount of HSK on HashKey Chain testnet for gas.
      </p>

      <h2>1. Get testnet HSK</h2>
      <p>
        HashKey Chain testnet uses HSK as its native gas token. Request testnet tokens from
        the official faucet and confirm they arrived in your wallet. You only need a fraction
        of a token — gas on L2 is cheap.
      </p>

      <h2>2. Connect your wallet</h2>
      <p>
        Open ZKGov in your browser and click <strong>Connect</strong> in the top right.
        Any standard Ethereum wallet works — MetaMask, Rabby, Frame, Coinbase Wallet, or any
        WalletConnect provider. The app adds HashKey Chain testnet automatically if missing.
      </p>

      <h2>3. Create your ZK identity</h2>
      <p>
        After connecting, open your <strong>Profile</strong> page. You will see a prompt to
        create your Semaphore identity. Click the button and sign a deterministic message
        with your wallet.
      </p>

      <Callout type="tip" title="Deterministic identity">
        Your identity is derived from the signature — the same wallet always produces the
        same identity. This means you can recover your identity just by reconnecting your
        wallet from a different device. No seed phrase to back up.
      </Callout>

      <h2>4. Register on-chain</h2>
      <p>
        Registration is a single on-chain transaction that adds your identity commitment to
        the Semaphore group. This is the only time your wallet address is linked to your
        identity publicly — and even then, it is only the commitment (a hash), not your
        identity secret.
      </p>

      <CodeBlock
        language="solidity"
        code={`function register(uint256 identityCommitment) external {
    require(!isRegistered[msg.sender], "Already registered");
    isRegistered[msg.sender] = true;
    semaphore.addMember(groupId, identityCommitment);
}`}
      />

      <h2>5. Cast your first vote</h2>
      <p>
        Navigate to any active proposal, pick <strong>For</strong>, <strong>Against</strong>,
        or <strong>Abstain</strong>, and confirm in your wallet. The browser generates a
        Groth16 proof locally — this takes a few seconds — then submits it on-chain.
      </p>

      <Callout type="success" title="Done">
        Your vote is now recorded on the blockchain. The tally is public, but your specific
        choice is not linked to your address.
      </Callout>

      <h2>Next steps</h2>
      <ul>
        <li>Read <a href="/docs/architecture">Architecture</a> to understand how the pieces fit together.</li>
        <li>Learn about <a href="/docs/zk-identity">ZK Identity</a> for deeper privacy details.</li>
        <li>Try the <a href="/docs/cli">CLI</a> for scripted voting and automation.</li>
      </ul>
    </>
  );
}
