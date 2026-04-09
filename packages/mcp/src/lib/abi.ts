/**
 * ZKVoting contract ABI — view functions only (MCP is read-only).
 */
export const ZK_VOTING_ABI = [
  {
    name: "getProposalContent", type: "function", stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [
      { name: "title", type: "string" },
      { name: "description", type: "string" },
      { name: "creator", type: "address" },
    ],
  },
  {
    name: "getProposalState", type: "function", stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [
      { name: "votingStart", type: "uint256" },
      { name: "votingEnd", type: "uint256" },
      { name: "quorum", type: "uint256" },
      { name: "votesFor", type: "uint256" },
      { name: "votesAgainst", type: "uint256" },
      { name: "votesAbstain", type: "uint256" },
      { name: "totalVotes", type: "uint256" },
      { name: "finalized", type: "bool" },
      { name: "passed", type: "bool" },
      { name: "isActive", type: "bool" },
    ],
  },
  {
    name: "getStats", type: "function", stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "totalProposals", type: "uint256" },
      { name: "totalMembers", type: "uint256" },
      { name: "activeGroupId", type: "uint256" },
    ],
  },
  {
    name: "isVoter", type: "function", stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [
      { name: "registered", type: "bool" },
      { name: "commitment", type: "uint256" },
    ],
  },
  {
    name: "proposalCount", type: "function", stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "memberCount", type: "function", stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getMerkleRoot", type: "function", stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "getMerkleDepth", type: "function", stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  // Events
  {
    name: "ProposalCreated", type: "event",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "title", type: "string" },
      { name: "votingEnd", type: "uint256" },
    ],
  },
  {
    name: "VoteCast", type: "event",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "nullifier", type: "uint256" },
      { name: "choice", type: "uint8" },
    ],
  },
  {
    name: "MemberRegistered", type: "event",
    inputs: [
      { name: "member", type: "address", indexed: true },
      { name: "commitment", type: "uint256" },
    ],
  },
  {
    name: "ProposalFinalized", type: "event",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "passed", type: "bool" },
      { name: "votesFor", type: "uint256" },
      { name: "votesAgainst", type: "uint256" },
    ],
  },
] as const;
