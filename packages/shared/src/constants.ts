/**
 * ZKGov Shared Constants
 * Contract addresses and chain config used across all packages.
 */

// ─── Chain Configuration ─────────────────────────────────────

export const HASHKEY_TESTNET = {
  id: 133,
  name: "HashKey Chain Testnet",
  rpcUrl: "https://testnet.hsk.xyz",
  explorerUrl: "https://testnet-explorer.hsk.xyz",
  nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
} as const

export const HASHKEY_MAINNET = {
  id: 177,
  name: "HashKey Chain",
  rpcUrl: "https://mainnet.hsk.xyz",
  explorerUrl: "https://explorer.hsk.xyz",
  nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
} as const

// ─── Deployed Contract Addresses (HashKey Testnet) ───────────

export const CONTRACTS = {
  semaphore: "0x1f7cbB9947087b01fCd7963F296A76E0dA41AA6f",
  zkVoting: "0xEa625841E031758786141c8b13dD1b1137C9776C",
} as const

export const DEPLOYMENT_BLOCK = 26266477

// ─── Voting ──────────────────────────────────────────────────

export const VOTE_CHOICES = {
  AGAINST: 0 as const,
  FOR: 1 as const,
  ABSTAIN: 2 as const,
}

export const DEFAULT_VOTING_PERIOD = 48 * 60 * 60 // 48 hours
export const DEFAULT_QUORUM = 5
export const MIN_VOTING_PERIOD = 60 * 60 // 1 hour
export const MAX_VOTING_PERIOD = 30 * 24 * 60 * 60 // 30 days

// ─── ZKVoting ABI (canonical source — import from here) ─────

export const ZK_VOTING_ABI = [
  // Write
  { name: "register", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "identityCommitment", type: "uint256" }], outputs: [] },
  { name: "createProposal", type: "function", stateMutability: "nonpayable",
    inputs: [
      { name: "title", type: "string" }, { name: "description", type: "string" },
      { name: "votingPeriod", type: "uint256" }, { name: "quorum", type: "uint256" },
    ], outputs: [{ type: "uint256" }] },
  { name: "castVote", type: "function", stateMutability: "nonpayable",
    inputs: [
      { name: "proposalId", type: "uint256" }, { name: "merkleTreeDepth", type: "uint256" },
      { name: "merkleTreeRoot", type: "uint256" }, { name: "nullifier", type: "uint256" },
      { name: "choice", type: "uint256" }, { name: "points", type: "uint256[8]" },
    ], outputs: [] },
  { name: "finalizeProposal", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "proposalId", type: "uint256" }], outputs: [] },

  // View
  { name: "getProposalContent", type: "function", stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [{ name: "title", type: "string" }, { name: "description", type: "string" }, { name: "creator", type: "address" }] },
  { name: "getProposalState", type: "function", stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [
      { name: "votingStart", type: "uint256" }, { name: "votingEnd", type: "uint256" },
      { name: "quorum", type: "uint256" }, { name: "votesFor", type: "uint256" },
      { name: "votesAgainst", type: "uint256" }, { name: "votesAbstain", type: "uint256" },
      { name: "totalVotes", type: "uint256" }, { name: "finalized", type: "bool" },
      { name: "passed", type: "bool" }, { name: "isActive", type: "bool" },
    ] },
  { name: "getStats", type: "function", stateMutability: "view", inputs: [],
    outputs: [{ name: "totalProposals", type: "uint256" }, { name: "totalMembers", type: "uint256" }, { name: "activeGroupId", type: "uint256" }] },
  { name: "isVoter", type: "function", stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "registered", type: "bool" }, { name: "commitment", type: "uint256" }] },
  { name: "proposalCount", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "memberCount", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "getMerkleRoot", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "getMerkleDepth", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },

  // Events
  { name: "MemberRegistered", type: "event", inputs: [{ name: "member", type: "address", indexed: true }, { name: "commitment", type: "uint256" }] },
  { name: "ProposalCreated", type: "event", inputs: [{ name: "proposalId", type: "uint256", indexed: true }, { name: "creator", type: "address", indexed: true }, { name: "title", type: "string" }, { name: "votingEnd", type: "uint256" }] },
  { name: "VoteCast", type: "event", inputs: [{ name: "proposalId", type: "uint256", indexed: true }, { name: "nullifier", type: "uint256" }, { name: "choice", type: "uint8" }] },
  { name: "ProposalFinalized", type: "event", inputs: [{ name: "proposalId", type: "uint256", indexed: true }, { name: "passed", type: "bool" }, { name: "votesFor", type: "uint256" }, { name: "votesAgainst", type: "uint256" }] },
] as const
