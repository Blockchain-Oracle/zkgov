/**
 * ZKVoting Contract ABI and address.
 * Used by wagmi hooks throughout the frontend.
 */

export const ZK_VOTING_ADDRESS = "0xEa625841E031758786141c8b13dD1b1137C9776C" as const
export const SEMAPHORE_ADDRESS = "0x1f7cbB9947087b01fCd7963F296A76E0dA41AA6f" as const
export const EXPLORER_URL = "https://testnet-explorer.hsk.xyz"

export const ZK_VOTING_ABI = [
  // Registration
  { name: "register", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "identityCommitment", type: "uint256" }], outputs: [] },

  // Proposals
  { name: "createProposal", type: "function", stateMutability: "nonpayable",
    inputs: [
      { name: "title", type: "string" }, { name: "description", type: "string" },
      { name: "votingPeriod", type: "uint256" }, { name: "quorum", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }] },

  // Voting
  { name: "castVote", type: "function", stateMutability: "nonpayable",
    inputs: [
      { name: "proposalId", type: "uint256" }, { name: "merkleTreeDepth", type: "uint256" },
      { name: "merkleTreeRoot", type: "uint256" }, { name: "nullifier", type: "uint256" },
      { name: "choice", type: "uint256" }, { name: "points", type: "uint256[8]" },
    ],
    outputs: [] },

  // Finalization
  { name: "finalizeProposal", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "proposalId", type: "uint256" }], outputs: [] },

  // View: Proposal content
  { name: "getProposalContent", type: "function", stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [{ name: "title", type: "string" }, { name: "description", type: "string" }, { name: "creator", type: "address" }] },

  // View: Proposal state
  { name: "getProposalState", type: "function", stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [
      { name: "votingStart", type: "uint256" }, { name: "votingEnd", type: "uint256" },
      { name: "quorum", type: "uint256" }, { name: "votesFor", type: "uint256" },
      { name: "votesAgainst", type: "uint256" }, { name: "votesAbstain", type: "uint256" },
      { name: "totalVotes", type: "uint256" }, { name: "finalized", type: "bool" },
      { name: "passed", type: "bool" }, { name: "isActive", type: "bool" },
    ] },

  // View: Stats
  { name: "getStats", type: "function", stateMutability: "view", inputs: [],
    outputs: [{ name: "totalProposals", type: "uint256" }, { name: "totalMembers", type: "uint256" }, { name: "activeGroupId", type: "uint256" }] },

  // View: Voter check
  { name: "isVoter", type: "function", stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "registered", type: "bool" }, { name: "commitment", type: "uint256" }] },

  // View: Merkle data (for proof generation)
  { name: "getMerkleRoot", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "getMerkleDepth", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "getMerkleSize", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },

  // View: Proposal count
  { name: "proposalCount", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "memberCount", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },

  // Events
  { name: "MemberRegistered", type: "event", inputs: [{ name: "member", type: "address", indexed: true }, { name: "commitment", type: "uint256" }] },
  { name: "ProposalCreated", type: "event", inputs: [{ name: "proposalId", type: "uint256", indexed: true }, { name: "creator", type: "address", indexed: true }, { name: "title", type: "string" }, { name: "votingEnd", type: "uint256" }] },
  { name: "VoteCast", type: "event", inputs: [{ name: "proposalId", type: "uint256", indexed: true }, { name: "nullifier", type: "uint256" }, { name: "choice", type: "uint8" }] },
  { name: "ProposalFinalized", type: "event", inputs: [{ name: "proposalId", type: "uint256", indexed: true }, { name: "passed", type: "bool" }, { name: "votesFor", type: "uint256" }, { name: "votesAgainst", type: "uint256" }] },
] as const
