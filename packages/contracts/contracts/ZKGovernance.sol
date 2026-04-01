// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";
import "@semaphore-protocol/contracts/interfaces/ISemaphoreGroups.sol";
import "./KycGate.sol";

contract ZKGovernance {
    ISemaphore public semaphore;
    KycGate public kycGate;

    uint256 public proposalCount;

    enum ProposalState { Active, Succeeded, Defeated, Cancelled }
    enum VoterGroup { HumansOnly, AgentsOnly, Both }

    struct Proposal {
        bytes32 contentHash;
        string metadataURI;
        address creator;
        uint256 votingStart;
        uint256 votingEnd;
        uint256 quorum;
        VoterGroup voterGroup;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 votesAbstain;
        ProposalState state;
    }

    mapping(uint256 => Proposal) public proposals;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed creator,
        bytes32 contentHash,
        string metadataURI,
        uint256 votingStart,
        uint256 votingEnd,
        uint256 quorum,
        VoterGroup voterGroup
    );

    event VoteCast(
        uint256 indexed proposalId,
        uint256 nullifier,
        uint8 choice
    );

    event ProposalTallied(
        uint256 indexed proposalId,
        ProposalState result,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 votesAbstain
    );

    constructor(address _semaphore, address _kycGate) {
        semaphore = ISemaphore(_semaphore);
        kycGate = KycGate(_kycGate);
    }

    function createProposal(
        bytes32 contentHash,
        string calldata metadataURI,
        uint256 votingPeriod,
        uint256 quorum,
        VoterGroup voterGroup
    ) external returns (uint256) {
        require(votingPeriod >= 1, "Voting period too short");
        require(quorum > 0, "Quorum must be > 0");

        proposalCount++;
        uint256 proposalId = proposalCount;

        proposals[proposalId] = Proposal({
            contentHash: contentHash,
            metadataURI: metadataURI,
            creator: msg.sender,
            votingStart: block.timestamp,
            votingEnd: block.timestamp + votingPeriod,
            quorum: quorum,
            voterGroup: voterGroup,
            votesFor: 0,
            votesAgainst: 0,
            votesAbstain: 0,
            state: ProposalState.Active
        });

        emit ProposalCreated(
            proposalId, msg.sender, contentHash, metadataURI,
            block.timestamp, block.timestamp + votingPeriod, quorum, voterGroup
        );

        return proposalId;
    }

    function castVote(
        uint256 proposalId,
        uint256 merkleTreeDepth,
        uint256 merkleTreeRoot,
        uint256 nullifier,
        uint256 message,
        uint256[8] calldata points
    ) external {
        Proposal storage p = proposals[proposalId];
        require(p.state == ProposalState.Active, "Proposal not active");
        require(block.timestamp >= p.votingStart, "Voting not started");
        require(block.timestamp <= p.votingEnd, "Voting ended");
        require(message <= 2, "Invalid vote choice");

        uint256 groupId = _resolveGroup(p.voterGroup, merkleTreeRoot);

        ISemaphore.SemaphoreProof memory proof = ISemaphore.SemaphoreProof({
            merkleTreeDepth: merkleTreeDepth,
            merkleTreeRoot: merkleTreeRoot,
            nullifier: nullifier,
            message: message,
            scope: proposalId,
            points: points
        });

        semaphore.validateProof(groupId, proof);

        if (message == 0) p.votesAgainst++;
        else if (message == 1) p.votesFor++;
        else p.votesAbstain++;

        emit VoteCast(proposalId, nullifier, uint8(message));
    }

    function tallyProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(p.state == ProposalState.Active, "Already tallied");
        require(block.timestamp > p.votingEnd, "Voting not ended");

        uint256 totalVotes = p.votesFor + p.votesAgainst + p.votesAbstain;

        if (totalVotes >= p.quorum && p.votesFor > p.votesAgainst) {
            p.state = ProposalState.Succeeded;
        } else {
            p.state = ProposalState.Defeated;
        }

        emit ProposalTallied(proposalId, p.state, p.votesFor, p.votesAgainst, p.votesAbstain);
    }

    function cancelProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(p.creator == msg.sender, "Not creator");
        require(p.state == ProposalState.Active, "Not active");
        p.state = ProposalState.Cancelled;
    }

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }

    function _resolveGroup(VoterGroup vg, uint256 merkleTreeRoot) internal view returns (uint256) {
        uint256 hGroup = kycGate.humanGroupId();
        uint256 aGroup = kycGate.agentGroupId();

        if (vg == VoterGroup.HumansOnly) {
            return hGroup;
        }
        if (vg == VoterGroup.AgentsOnly) {
            return aGroup;
        }
        // Both — determine from Merkle root
        ISemaphoreGroups groups = ISemaphoreGroups(address(semaphore));
        if (groups.getMerkleTreeRoot(hGroup) == merkleTreeRoot) {
            return hGroup;
        }
        if (groups.getMerkleTreeRoot(aGroup) == merkleTreeRoot) {
            return aGroup;
        }
        revert("Invalid merkle root");
    }
}
