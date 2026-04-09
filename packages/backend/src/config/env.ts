import "dotenv/config"
// Inline constants from shared package (ESM workspace resolution issues with tsx)
// Source of truth: packages/shared/src/constants.ts
const CONTRACTS = {
  semaphore: "0x39A5c71685d2B7c86fb051A29824010720AAB6E4",
  kycSBT: "0x551110C2B722D42399702869A82ee6E8CE368256",
  agentRegistry: "0x6D20F5797E72d24ceaB762EaD562e47618e34B74",
  kycGate: "0xDDf582e45B9f120D5ae7E94BD4e0b12798729B5f",
  zkGovernance: "0x38928DDE71a8993789BA86A910f898aD0E8271bf",
} as const

const SEMAPHORE_GROUP_IDS = { human: 0, agent: 1 } as const
const HASHKEY_TESTNET = { id: 133, rpcUrl: "https://testnet.hsk.xyz" } as const

// Startup security warnings
if (!process.env.JWT_SECRET) {
  console.warn("WARNING: Using default JWT_SECRET. Set a real secret in .env for production.")
}
if (!process.env.IDENTITY_ENCRYPTION_KEY) {
  console.warn("WARNING: Using default IDENTITY_ENCRYPTION_KEY. Generate one with: openssl rand -hex 32")
}
if (!process.env.RELAYER_PRIVATE_KEY) {
  console.warn("WARNING: RELAYER_PRIVATE_KEY not set. On-chain transactions will fail.")
}

export const env = {
  PORT: parseInt(process.env.PORT || "3001"),
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://localhost:5432/zkgov",
  HASHKEY_RPC_URL: process.env.HASHKEY_RPC_URL || HASHKEY_TESTNET.rpcUrl,
  CHAIN_ID: parseInt(process.env.CHAIN_ID || String(HASHKEY_TESTNET.id)),

  // Contract addresses — defaults from shared constants (deployed addresses)
  SEMAPHORE_ADDRESS: (process.env.SEMAPHORE_ADDRESS || CONTRACTS.semaphore) as `0x${string}`,
  KYC_SBT_ADDRESS: (process.env.KYC_SBT_ADDRESS || CONTRACTS.kycSBT) as `0x${string}`,
  KYC_GATE_ADDRESS: (process.env.KYC_GATE_ADDRESS || CONTRACTS.kycGate) as `0x${string}`,
  ZK_GOVERNANCE_ADDRESS: (process.env.ZK_GOVERNANCE_ADDRESS || CONTRACTS.zkGovernance) as `0x${string}`,
  AGENT_REGISTRY_ADDRESS: (process.env.AGENT_REGISTRY_ADDRESS || CONTRACTS.agentRegistry) as `0x${string}`,
  HUMAN_GROUP_ID: process.env.HUMAN_GROUP_ID || String(SEMAPHORE_GROUP_IDS.human),
  AGENT_GROUP_ID: process.env.AGENT_GROUP_ID || String(SEMAPHORE_GROUP_IDS.agent),
  DEPLOYMENT_BLOCK: parseInt(process.env.DEPLOYMENT_BLOCK || "26256250"),

  // Relayer
  RELAYER_PRIVATE_KEY: (process.env.RELAYER_PRIVATE_KEY || "0x") as `0x${string}`,

  // Auth
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-in-production",
  IDENTITY_ENCRYPTION_KEY: process.env.IDENTITY_ENCRYPTION_KEY || "0".repeat(64),

  // Bots (optional — won't start without tokens)
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN || "",
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || "",
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET || "",
}
