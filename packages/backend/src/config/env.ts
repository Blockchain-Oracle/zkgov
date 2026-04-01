import "dotenv/config"

export const env = {
  PORT: parseInt(process.env.PORT || "3001"),
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://apple@localhost:5433/zkgov",
  HASHKEY_RPC_URL: process.env.HASHKEY_RPC_URL || "https://hashkeychain-testnet.alt.technology",
  CHAIN_ID: parseInt(process.env.CHAIN_ID || "133"),
  SEMAPHORE_ADDRESS: (process.env.SEMAPHORE_ADDRESS || "") as `0x${string}`,
  KYC_SBT_ADDRESS: (process.env.KYC_SBT_ADDRESS || "") as `0x${string}`,
  KYC_GATE_ADDRESS: (process.env.KYC_GATE_ADDRESS || "") as `0x${string}`,
  ZK_GOVERNANCE_ADDRESS: (process.env.ZK_GOVERNANCE_ADDRESS || "") as `0x${string}`,
  AGENT_REGISTRY_ADDRESS: (process.env.AGENT_REGISTRY_ADDRESS || "") as `0x${string}`,
  HUMAN_GROUP_ID: process.env.HUMAN_GROUP_ID || "0",
  AGENT_GROUP_ID: process.env.AGENT_GROUP_ID || "0",
  DEPLOYMENT_BLOCK: parseInt(process.env.DEPLOYMENT_BLOCK || "0"),
  RELAYER_PRIVATE_KEY: (process.env.RELAYER_PRIVATE_KEY || "0x") as `0x${string}`,
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-in-production",
  IDENTITY_ENCRYPTION_KEY: process.env.IDENTITY_ENCRYPTION_KEY || "0".repeat(64),
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN || "",
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || "",
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET || "",
}
