/**
 * ZKGov Shared Constants
 *
 * Contract addresses and chain config used across all packages.
 * These are the DEPLOYED contract addresses on HashKey Chain Testnet.
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
  semaphore: "0x39A5c71685d2B7c86fb051A29824010720AAB6E4",
  kycSBT: "0x551110C2B722D42399702869A82ee6E8CE368256",
  agentRegistry: "0x6D20F5797E72d24ceaB762EaD562e47618e34B74",
  kycGate: "0xDDf582e45B9f120D5ae7E94BD4e0b12798729B5f",
  zkGovernance: "0x38928DDE71a8993789BA86A910f898aD0E8271bf",
} as const

export const SEMAPHORE_GROUP_IDS = {
  human: 0,
  agent: 1,
} as const

// ─── Voting ──────────────────────────────────────────────────

export const VOTE_CHOICES = {
  NO: 0 as const,
  YES: 1 as const,
  ABSTAIN: 2 as const,
}

export const DEFAULT_VOTING_PERIOD = 48 * 60 * 60 // 48 hours
export const DEFAULT_QUORUM = 10
export const MIN_VOTING_PERIOD = 60 * 60 // 1 hour
export const MAX_VOTING_PERIOD = 30 * 24 * 60 * 60 // 30 days
