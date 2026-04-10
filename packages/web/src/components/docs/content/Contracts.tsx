import { CodeBlock, Callout } from '../CodeBlock';

export function ContractsContent() {
  return (
    <>
      <p className="lead">
        The on-chain surface is a single <code>ZKVoting.sol</code> contract that integrates
        with the deployed Semaphore v4 verifier. This page covers the public API, events,
        and deployment addresses.
      </p>

      <h2>Deployment addresses (HashKey Testnet)</h2>
      <ul>
        <li><strong>ZKVoting</strong> — <code>0xEa625841E031758786141c8b13dD1b1137C9776C</code></li>
        <li><strong>Semaphore</strong> — <code>0x1f7cbB9947087b01fCd7963F296A76E0dA41AA6f</code></li>
        <li><strong>Chain ID</strong> — 133</li>
        <li><strong>RPC</strong> — <code>https://testnet.hsk.xyz</code></li>
        <li><strong>Explorer</strong> — <code>https://testnet-explorer.hsk.xyz</code></li>
      </ul>

      <h2>Write functions</h2>

      <h3>register</h3>
      <CodeBlock
        language="solidity"
        code={`function register(uint256 identityCommitment) external;`}
      />
      <p>
        Registers <code>msg.sender</code> as a voter and adds the commitment to the Semaphore group.
        Reverts if the sender is already registered.
      </p>

      <h3>createProposal</h3>
      <CodeBlock
        language="solidity"
        code={`function createProposal(
    string title,
    string description,
    uint256 votingPeriod,
    uint256 quorum
) external returns (uint256 proposalId);`}
      />
      <p>
        Creates a new proposal. <code>votingPeriod</code> is in seconds (min 3600, max 2,592,000).
        Returns the new proposal ID.
      </p>

      <h3>castVote</h3>
      <CodeBlock
        language="solidity"
        code={`function castVote(
    uint256 proposalId,
    uint256 merkleTreeDepth,
    uint256 merkleTreeRoot,
    uint256 nullifier,
    uint256 choice,          // 0 = against, 1 = for, 2 = abstain
    uint256[8] calldata points
) external;`}
      />
      <p>
        Submits a ZK-verified vote. Calls <code>semaphore.validateProof</code> internally.
        Reverts if the proof is invalid, the nullifier is already used, or the voting period has ended.
      </p>

      <Callout type="info" title="No sender check on castVote">
        <code>castVote</code> does not require the caller to be registered. The ZK proof itself
        is the authentication. This means you can use a relayer to submit votes on behalf of
        others without compromising privacy.
      </Callout>

      <h3>finalizeProposal</h3>
      <CodeBlock
        language="solidity"
        code={`function finalizeProposal(uint256 proposalId) external;`}
      />
      <p>
        Transitions a proposal from ended to finalized. Any address can call this.
        Sets <code>passed = true</code> if quorum was reached and <code>votesFor &gt; votesAgainst</code>.
      </p>

      <h2>View functions</h2>
      <CodeBlock
        language="solidity"
        code={`function getStats() view returns (uint256 totalProposals, uint256 totalMembers, uint256 activeGroupId);
function getProposalContent(uint256 id) view returns (string title, string description, address creator);
function getProposalState(uint256 id) view returns (
    uint256 votingStart, uint256 votingEnd, uint256 quorum,
    uint256 votesFor, uint256 votesAgainst, uint256 votesAbstain,
    uint256 totalVotes, bool finalized, bool passed, bool isActive
);
function isVoter(address account) view returns (bool registered, uint256 commitment);
function getMerkleRoot() view returns (uint256);
function getMerkleDepth() view returns (uint256);
function memberCount() view returns (uint256);
function proposalCount() view returns (uint256);`}
      />

      <h2>Events</h2>
      <CodeBlock
        language="solidity"
        code={`event MemberRegistered(address indexed member, uint256 commitment);
event ProposalCreated(uint256 indexed proposalId, address indexed creator, string title, uint256 votingEnd);
event VoteCast(uint256 indexed proposalId, uint256 nullifier, uint8 choice);
event ProposalFinalized(uint256 indexed proposalId, bool passed, uint256 votesFor, uint256 votesAgainst);`}
      />

      <p>
        The frontend and CLI read these events to build the activity feed, the member list,
        and the Merkle tree used for proof generation. There is no indexer — everything
        comes from <code>eth_getLogs</code> on the deployment block onwards.
      </p>

      <Callout type="tip" title="Verify independently">
        You can query every one of these view functions directly from any RPC without trusting
        the ZKGov frontend. The explorer link above is enough to audit any proposal's state.
      </Callout>
    </>
  );
}
