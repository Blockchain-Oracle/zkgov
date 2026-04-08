/**
 * ZKGov Database Schema
 *
 * ARCHITECTURE NOTE: Why a database alongside on-chain contracts?
 *
 * The ZK voting itself is FULLY ON-CHAIN via Semaphore:
 *   - Vote validity → verified by Groth16 proof on-chain
 *   - Double-vote prevention → Semaphore nullifiers on-chain
 *   - Vote tallies → stored in ZKGovernance contract
 *   - Voter eligibility → KycGate checks KYC SBT on-chain
 *
 * The database handles what CAN'T or SHOULDN'T go on-chain:
 *   - User accounts: links wallet ↔ telegram ↔ discord (platform identity mapping)
 *   - Encrypted Semaphore keys: so users can vote from Telegram/Discord
 *     (chat apps can't generate ZK proofs — backend does it on their behalf)
 *   - Proposal text: title + description are too large for on-chain storage
 *     (only contentHash goes on-chain, full text lives here)
 *   - Comments/discussion: social layer, not governance-critical
 *   - Relayer tracking: monitor transaction status for the gasless relayer
 *
 * PRIVACY: The `votes` table has NO user_id or agent_id column.
 * Votes are anonymous even in our own database. The nullifier_hash
 * prevents double-voting but cannot be traced back to a voter.
 *
 * This is the same architecture used by Tornado Cash, Semaphore's
 * official examples, and other production ZK dApps.
 */

import {
  pgTable, uuid, text, boolean, bigint, integer,
  smallint, timestamp, jsonb, customType
} from "drizzle-orm/pg-core"

// Custom bytea type for encrypted data
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() { return "bytea" },
  fromDriver(val) { return val },
  toDriver(val) { return val },
})

/**
 * Users — platform identity mapping.
 * Links a wallet address to Telegram/Discord accounts and stores
 * the encrypted Semaphore identity key for server-side proof generation.
 * The identity commitment (public) goes on-chain in Semaphore groups.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletAddress: text("wallet_address").unique().notNull(),
  encryptedIdentity: bytea("encrypted_identity").notNull(),     // AES-256-GCM encrypted Semaphore private key
  identityCommitment: text("identity_commitment").notNull(),     // Public — registered on-chain in Semaphore group
  encryptionIv: bytea("encryption_iv").notNull(),                // 12-byte nonce for AES-GCM
  kycVerified: boolean("kyc_verified").default(false),
  kycLevel: text("kyc_level"),                                   // BASIC | ADVANCED | PREMIUM | ULTIMATE
  telegramId: bigint("telegram_id", { mode: "bigint" }).unique(),
  discordId: text("discord_id").unique(),
  createdAt: timestamp("created_at").defaultNow(),
})

/**
 * Agents — AI agent accounts owned by KYC'd humans.
 * Each agent has its own Semaphore identity (separate from owner)
 * and is registered in the on-chain agent Semaphore group.
 */
export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  apiKeyHash: text("api_key_hash").unique().notNull(),           // bcrypt hash — API key shown once at creation
  encryptedIdentity: bytea("encrypted_identity").notNull(),
  identityCommitment: text("identity_commitment").notNull(),
  encryptionIv: bytea("encryption_iv").notNull(),
  isActive: boolean("is_active").default(true),
  onChainAddress: text("on_chain_address"),                      // Agent's wallet address for on-chain registration
  createdAt: timestamp("created_at").defaultNow(),
})

/**
 * Proposals — off-chain metadata for on-chain proposals.
 * The full title/description live here (too expensive for on-chain storage).
 * A contentHash (keccak256 of title+description) is stored on-chain for integrity.
 */
export const proposals = pgTable("proposals", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  onChainId: integer("on_chain_id"),                             // Matches proposalId in ZKGovernance contract
  creatorId: uuid("creator_id").references(() => users.id),
  creatorAgentId: uuid("creator_agent_id").references(() => agents.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  proposalType: text("proposal_type").notNull().default("verified"), // "verified" (KYC required) | "open" (anyone)
  voterGroup: text("voter_group").notNull().default("both"),     // "humans" | "agents" | "both"
  votingStart: timestamp("voting_start").notNull(),
  votingEnd: timestamp("voting_end").notNull(),
  quorum: integer("quorum").notNull().default(10),
  status: text("status").notNull().default("active"),
  txHash: text("tx_hash"),                                       // On-chain creation transaction
  createdAt: timestamp("created_at").defaultNow(),
})

/**
 * Votes — ANONYMOUS vote records.
 *
 * CRITICAL: This table has NO user_id or agent_id column.
 * Votes cannot be traced back to a voter. The nullifier_hash
 * (from Semaphore) prevents double-voting without revealing identity.
 *
 * The actual vote verification happens ON-CHAIN:
 *   1. Backend generates ZK proof (server-side snarkjs)
 *   2. Relayer submits proof to ZKGovernance.castVote()
 *   3. Semaphore contract verifies the Groth16 proof
 *   4. Contract checks nullifier hasn't been used before
 *   5. Contract increments vote tally
 *
 * This table mirrors on-chain state for API queries and real-time display.
 */
export const votes = pgTable("votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalId: integer("proposal_id").references(() => proposals.id).notNull(),
  nullifierHash: text("nullifier_hash").unique().notNull(),      // Semaphore nullifier — prevents double-voting
  voteChoice: smallint("vote_choice").notNull(),                 // 0 = No, 1 = Yes, 2 = Abstain
  proof: jsonb("proof").notNull(),                               // ZK proof data (for verification/audit)
  txHash: text("tx_hash"),                                       // On-chain transaction hash
  txStatus: text("tx_status").default("pending"),                // pending | submitted | confirmed | failed
  submittedVia: text("submitted_via").notNull(),                 // web | telegram | discord | api
  createdAt: timestamp("created_at").defaultNow(),
})

/**
 * Comments — off-chain discussion layer (not governance-critical).
 * Supports threaded replies via parentId. Agent comments are
 * marked as "analysis" type and displayed differently in the UI.
 */
export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalId: integer("proposal_id").references(() => proposals.id).notNull(),
  userId: uuid("user_id").references(() => users.id),
  agentId: uuid("agent_id").references(() => agents.id),
  parentId: uuid("parent_id"),                                   // Self-referencing for threaded replies
  content: text("content").notNull(),
  commentType: text("comment_type").default("comment"),          // "comment" (human) | "analysis" (agent)
  createdAt: timestamp("created_at").defaultNow(),
})

/**
 * Relayer transactions — tracks gasless transaction submissions.
 * The relayer wallet submits on-chain transactions on behalf of users
 * so they never pay gas (which would leak their identity via on-chain payment).
 */
export const relayerTransactions = pgTable("relayer_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  txHash: text("tx_hash").unique(),
  txType: text("tx_type").notNull(),                             // vote | register | create_proposal
  status: text("status").default("pending"),                     // pending | submitted | confirmed | failed
  gasUsed: bigint("gas_used", { mode: "bigint" }),
  nonce: integer("nonce"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
})
