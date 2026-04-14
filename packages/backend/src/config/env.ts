import "dotenv/config"
import { randomBytes } from "node:crypto"
import { CONTRACTS, DEPLOYMENT_BLOCK as DEFAULT_DEPLOYMENT_BLOCK } from "@zkgov/shared"

if (!process.env.JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET not set — generating a random ephemeral secret (tokens won't survive restarts)")
}

export const env = {
  PORT: parseInt(process.env.PORT || "3001"),
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://localhost:5432/zkgov",
  HASHKEY_RPC_URL: process.env.HASHKEY_RPC_URL || "https://testnet.hsk.xyz",
  CHAIN_ID: parseInt(process.env.CHAIN_ID || "133"),

  // Contract addresses — canonical source: @zkgov/shared
  SEMAPHORE_ADDRESS: (process.env.SEMAPHORE_ADDRESS || CONTRACTS.semaphore) as `0x${string}`,
  ZK_VOTING_ADDRESS: (process.env.ZK_VOTING_ADDRESS || CONTRACTS.zkVoting) as `0x${string}`,
  DEPLOYMENT_BLOCK: parseInt(process.env.DEPLOYMENT_BLOCK || String(DEFAULT_DEPLOYMENT_BLOCK)),

  // Auth — random fallback per process (unpredictable but ephemeral)
  JWT_SECRET: process.env.JWT_SECRET || randomBytes(32).toString("hex"),

  // Bots (optional)
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
}
