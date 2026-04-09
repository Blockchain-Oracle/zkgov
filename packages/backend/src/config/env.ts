import "dotenv/config"
import { CONTRACTS, HASHKEY_TESTNET, DEPLOYMENT_BLOCK as DEFAULT_DEPLOYMENT_BLOCK } from "@zkgov/shared"

if (!process.env.JWT_SECRET) {
  console.warn("WARNING: Using default JWT_SECRET. Set a real secret in .env for production.")
}

// Inline shared constants for ESM compatibility
const FALLBACK_CONTRACTS = {
  semaphore: "0x1f7cbB9947087b01fCd7963F296A76E0dA41AA6f",
  zkVoting: "0xEa625841E031758786141c8b13dD1b1137C9776C",
}

export const env = {
  PORT: parseInt(process.env.PORT || "3001"),
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://localhost:5432/zkgov",
  HASHKEY_RPC_URL: process.env.HASHKEY_RPC_URL || "https://testnet.hsk.xyz",
  CHAIN_ID: parseInt(process.env.CHAIN_ID || "133"),

  // Contract addresses
  SEMAPHORE_ADDRESS: (process.env.SEMAPHORE_ADDRESS || FALLBACK_CONTRACTS.semaphore) as `0x${string}`,
  ZK_VOTING_ADDRESS: (process.env.ZK_VOTING_ADDRESS || FALLBACK_CONTRACTS.zkVoting) as `0x${string}`,
  DEPLOYMENT_BLOCK: parseInt(process.env.DEPLOYMENT_BLOCK || "26266477"),

  // Auth
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-in-production",

  // Bots (optional)
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN || "",
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || "",
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET || "",
}
