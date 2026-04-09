// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";
import "@semaphore-protocol/contracts/interfaces/ISemaphoreGroups.sol";

/**
 * @title ZKVoting
 * @notice Anonymous voting with ZK proof verification on-chain.
 *         Designed for UI-friendly view functions — the frontend reads
 *         everything from the contract, minimizing database dependency.
 *
 * Architecture:
 *   - Anyone can register their Semaphore identity commitment (no KYC gate)
 *   - Anyone can create proposals
 *   - Registered members vote anonymously via Semaphore ZK proofs
 *   - All state is on-chain: proposals, votes, membership
 *   - Rich view functions return data ready for the frontend
 */
contract ZKVoting {
    ISemaphore public semaphore;
    uint256 public groupId;
    uint256 public proposalCount;
    uint256 public memberCount;

    struct Proposal {
        string title;
        string description;
        address creator;
        uint256 votingStart;
        uint256 votingEnd;
        uint256 quorum;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 votesAbstain;
        bool finalized;
        bool passed;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(address => bool) public isRegistered;
    mapping(address => uint256) public memberCommitment;

    // Events for frontend indexing
    event MemberRegistered(address indexed member, uint256 commitment);
    event ProposalCreated(uint256 indexed proposalId, address indexed creator, string title, uint256 votingEnd);
    event VoteCast(uint256 indexed proposalId, uint256 nullifier, uint8 choice);
    event ProposalFinalized(uint256 indexed proposalId, bool passed, uint256 votesFor, uint256 votesAgainst);

    constructor(address _semaphore) {
        semaphore = ISemaphore(_semaphore);
        groupId = semaphore.createGroup();
    }

    // ─── Registration (no KYC gate) ──────────────────────────

    /**
     * @notice Register as a voter by submitting your Semaphore identity commitment.
     *         Anyone can register. The commitment is added to the on-chain Merkle tree.
     *         This is the only step needed before voting.
     */
    function register(uint256 identityCommitment) external {
        require(!isRegistered[msg.sender], "Already registered");

        isRegistered[msg.sender] = true;
        memberCommitment[msg.sender] = identityCommitment;
        memberCount++;

        semaphore.addMember(groupId, identityCommitment);

        emit MemberRegistered(msg.sender, identityCommitment);
    }

    // ─── Proposals ───────────────────────────────────────────

    /**
     * @notice Create a new proposal. Anyone can create proposals.
     * @param title Short title (stored on-chain for full decentralization)
     * @param description Full description (stored on-chain)
     * @param votingPeriod Duration in seconds
     * @param quorum Minimum total votes needed
     */
    function createProposal(
        string calldata title,
        string calldata description,
        uint256 votingPeriod,
        uint256 quorum
    ) external returns (uint256) {
        require(votingPeriod >= 1 hours, "Voting period too short");
        require(quorum > 0, "Quorum must be > 0");
        require(bytes(title).length > 0, "Title required");

        proposalCount++;
        uint256 proposalId = proposalCount;

        proposals[proposalId] = Proposal({
            title: title,
            description: description,
            creator: msg.sender,
            votingStart: block.timestamp,
            votingEnd: block.timestamp + votingPeriod,
            quorum: quorum,
            votesFor: 0,
            votesAgainst: 0,
            votesAbstain: 0,
            finalized: false,
            passed: false
        });

        emit ProposalCreated(proposalId, msg.sender, title, block.timestamp + votingPeriod);

        return proposalId;
    }

    // ─── Voting (ZK proof verified on-chain) ─────────────────

    /**
     * @notice Cast an anonymous vote using a Semaphore ZK proof.
     *         The proof proves group membership without revealing identity.
     *         Nullifier prevents double-voting (one vote per identity per proposal).
     * @param proposalId The proposal to vote on
     * @param choice 0 = Against, 1 = For, 2 = Abstain
     */
    function castVote(
        uint256 proposalId,
        uint256 merkleTreeDepth,
        uint256 merkleTreeRoot,
        uint256 nullifier,
        uint256 choice,
        uint256[8] calldata points
    ) external {
        Proposal storage p = proposals[proposalId];
        require(p.votingStart > 0, "Proposal does not exist");
        require(!p.finalized, "Proposal finalized");
        require(block.timestamp >= p.votingStart, "Voting not started");
        require(block.timestamp <= p.votingEnd, "Voting ended");
        require(choice <= 2, "Invalid choice");

        // Verify ZK proof on-chain via Semaphore
        ISemaphore.SemaphoreProof memory proof = ISemaphore.SemaphoreProof({
            merkleTreeDepth: merkleTreeDepth,
            merkleTreeRoot: merkleTreeRoot,
            nullifier: nullifier,
            message: choice,
            scope: proposalId,
            points: points
        });

        // This reverts if proof is invalid or nullifier already used
        semaphore.validateProof(groupId, proof);

        // Update tallies
        if (choice == 0) p.votesAgainst++;
        else if (choice == 1) p.votesFor++;
        else p.votesAbstain++;

        emit VoteCast(proposalId, nullifier, uint8(choice));
    }

    // ─── Finalization ────────────────────────────────────────

    /**
     * @notice Finalize a proposal after voting ends. Anyone can call this.
     */
    function finalizeProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(p.votingStart > 0, "Proposal does not exist");
        require(!p.finalized, "Already finalized");
        require(block.timestamp > p.votingEnd, "Voting not ended");

        uint256 totalVotes = p.votesFor + p.votesAgainst + p.votesAbstain;
        p.finalized = true;
        p.passed = totalVotes >= p.quorum && p.votesFor > p.votesAgainst;

        emit ProposalFinalized(proposalId, p.passed, p.votesFor, p.votesAgainst);
    }

    // ─── View Functions (Frontend-friendly) ──────────────────

    /**
     * @notice Get proposal content (title + description + creator).
     */
    function getProposalContent(uint256 proposalId) external view returns (
        string memory title,
        string memory description,
        address creator
    ) {
        Proposal storage p = proposals[proposalId];
        return (p.title, p.description, p.creator);
    }

    /**
     * @notice Get proposal voting state — everything the frontend needs for display.
     */
    function getProposalState(uint256 proposalId) external view returns (
        uint256 votingStart,
        uint256 votingEnd,
        uint256 quorum,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 votesAbstain,
        uint256 totalVotes,
        bool finalized,
        bool passed,
        bool isActive
    ) {
        Proposal storage p = proposals[proposalId];
        totalVotes = p.votesFor + p.votesAgainst + p.votesAbstain;
        isActive = !p.finalized && block.timestamp >= p.votingStart && block.timestamp <= p.votingEnd;

        return (
            p.votingStart, p.votingEnd, p.quorum,
            p.votesFor, p.votesAgainst, p.votesAbstain,
            totalVotes, p.finalized, p.passed, isActive
        );
    }

    /**
     * @notice Get platform statistics in a single call.
     */
    function getStats() external view returns (
        uint256 totalProposals,
        uint256 totalMembers,
        uint256 activeGroupId
    ) {
        return (proposalCount, memberCount, groupId);
    }

    /**
     * @notice Check if an address is a registered voter.
     */
    function isVoter(address account) external view returns (bool registered, uint256 commitment) {
        return (isRegistered[account], memberCommitment[account]);
    }

    /**
     * @notice Get the current Merkle root of the voter group.
     *         Needed by the frontend for proof generation.
     */
    function getMerkleRoot() external view returns (uint256) {
        return ISemaphoreGroups(address(semaphore)).getMerkleTreeRoot(groupId);
    }

    /**
     * @notice Get the current Merkle tree depth.
     *         Needed by the frontend for proof generation.
     */
    function getMerkleDepth() external view returns (uint256) {
        return ISemaphoreGroups(address(semaphore)).getMerkleTreeDepth(groupId);
    }

    /**
     * @notice Get the number of members in the voter group.
     */
    function getMerkleSize() external view returns (uint256) {
        return ISemaphoreGroups(address(semaphore)).getMerkleTreeSize(groupId);
    }
}
