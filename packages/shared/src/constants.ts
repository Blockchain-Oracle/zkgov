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

// Contract addresses — populated after deployment
export const CONTRACTS = {
  semaphore: "",
  kycSBT: "",
  agentRegistry: "",
  kycGate: "",
  zkGovernance: "",
} as const

export const SEMAPHORE_GROUP_IDS = {
  human: 0,
  agent: 0,
} as const

export const VOTE_CHOICES = {
  NO: 0 as const,
  YES: 1 as const,
  ABSTAIN: 2 as const,
}

export const DEFAULT_VOTING_PERIOD = 48 * 60 * 60 // 48 hours
export const DEFAULT_QUORUM = 10
export const MIN_VOTING_PERIOD = 60 * 60 // 1 hour
export const MAX_VOTING_PERIOD = 30 * 24 * 60 * 60 // 30 days
