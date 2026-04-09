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
