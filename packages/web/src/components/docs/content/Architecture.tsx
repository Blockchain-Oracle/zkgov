import { CodeBlock, Callout } from '../CodeBlock';

export function ArchitectureContent() {
  return (
    <>
      <p className="lead">
        ZKGov is a minimal stack: a single on-chain contract, a browser-side ZK proof layer,
        and thin clients. There is no central database for voting — all state lives on HashKey Chain.
      </p>

      <h2>The stack</h2>
      <ul>
        <li><strong>ZKVoting contract</strong> — the single source of truth. Handles registration, proposals, votes, and tallies.</li>
        <li><strong>Semaphore v4</strong> — the zero-knowledge protocol for anonymous group membership and nullifier-based double-vote prevention.</li>
        <li><strong>Web UI</strong> — Next.js + wagmi + viem. Generates proofs in the browser via WebAssembly.</li>
        <li><strong>CLI + MCP server</strong> — a Node package that shares the same contract read/write logic, with both a human CLI and an AI-agent-facing MCP interface.</li>
        <li><strong>Telegram bot</strong> — a discovery surface; actual voting still happens via wallet signing.</li>
      </ul>

      <h2>Data flow</h2>
      <p>
        When you vote, this is what happens:
      </p>
      <ol>
        <li>Browser fetches all group members from on-chain <code>MemberRegistered</code> events.</li>
        <li>Browser builds a local Merkle tree (depth grows with member count).</li>
        <li>Browser generates a Groth16 proof using your identity secret, the tree, the vote choice, and the proposal ID as scope.</li>
        <li>Browser submits <code>castVote</code> with the proof fields — the wallet signs the transaction.</li>
        <li>Contract calls <code>semaphore.validateProof</code>, which reverts if the proof is invalid or the nullifier was already used.</li>
        <li>Contract increments the tally for the chosen option.</li>
      </ol>

      <Callout type="info" title="Why no indexer">
        ZKGov reads directly from the contract via <code>eth_call</code> and <code>eth_getLogs</code>.
        This keeps the architecture fully decentralized — anyone can verify vote counts
        and member lists just by pointing at the contract address.
      </Callout>

      <h2>The ZKVoting contract</h2>
      <p>
        One contract holds everything: the voter registry, proposals, tallies, and the Semaphore verifier integration.
      </p>

      <CodeBlock
        language="solidity"
        filename="ZKVoting.sol"
        code={`contract ZKVoting {
    ISemaphore public immutable semaphore;
    uint256 public immutable groupId;

    mapping(address => bool) public isRegistered;
    mapping(address => uint256) public memberCommitment;
    uint256 public memberCount;

    Proposal[] public proposals;

    function register(uint256 identityCommitment) external;
    function createProposal(string title, string description, uint256 period, uint256 quorum) external returns (uint256);
    function castVote(uint256 proposalId, uint256 merkleDepth, uint256 merkleRoot, uint256 nullifier, uint256 choice, uint256[8] points) external;
    function finalizeProposal(uint256 proposalId) external;
}`}
      />

      <h2>Trust assumptions</h2>
      <ul>
        <li>The <strong>Semaphore verifier contract</strong> is deployed and audited by the Semaphore team.</li>
        <li>The <strong>Groth16 trusted setup</strong> is the one shipped with the Semaphore protocol.</li>
        <li>The <strong>RPC provider</strong> you use to read chain state is assumed honest, though you can verify against any other RPC.</li>
      </ul>

      <p>
        There is <strong>no trusted server</strong> in the vote path. No relayer, no backend database,
        no centralized coordinator. The frontend is a convenience — every vote could be submitted
        by hand via a raw transaction if you wanted to.
      </p>
    </>
  );
}
