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

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletAddress: text("wallet_address").unique().notNull(),
  encryptedIdentity: bytea("encrypted_identity").notNull(),
  identityCommitment: text("identity_commitment").notNull(),
  encryptionIv: bytea("encryption_iv").notNull(),
  kycVerified: boolean("kyc_verified").default(false),
  kycLevel: text("kyc_level"),
  telegramId: bigint("telegram_id", { mode: "bigint" }).unique(),
  discordId: text("discord_id").unique(),
  createdAt: timestamp("created_at").defaultNow(),
})

export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  apiKeyHash: text("api_key_hash").unique().notNull(),
  encryptedIdentity: bytea("encrypted_identity").notNull(),
  identityCommitment: text("identity_commitment").notNull(),
  encryptionIv: bytea("encryption_iv").notNull(),
  isActive: boolean("is_active").default(true),
  onChainAddress: text("on_chain_address"),
  createdAt: timestamp("created_at").defaultNow(),
})

export const proposals = pgTable("proposals", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  onChainId: integer("on_chain_id"),
  creatorId: uuid("creator_id").references(() => users.id),
  creatorAgentId: uuid("creator_agent_id").references(() => agents.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  proposalType: text("proposal_type").notNull().default("verified"),
  voterGroup: text("voter_group").notNull().default("both"),
  votingStart: timestamp("voting_start").notNull(),
  votingEnd: timestamp("voting_end").notNull(),
  quorum: integer("quorum").notNull().default(10),
  status: text("status").notNull().default("active"),
  txHash: text("tx_hash"),
  createdAt: timestamp("created_at").defaultNow(),
})

export const votes = pgTable("votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalId: integer("proposal_id").references(() => proposals.id).notNull(),
  nullifierHash: text("nullifier_hash").unique().notNull(),
  voteChoice: smallint("vote_choice").notNull(),
  proof: jsonb("proof").notNull(),
  txHash: text("tx_hash"),
  txStatus: text("tx_status").default("pending"),
  submittedVia: text("submitted_via").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
})

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalId: integer("proposal_id").references(() => proposals.id).notNull(),
  userId: uuid("user_id").references(() => users.id),
  agentId: uuid("agent_id").references(() => agents.id),
  parentId: uuid("parent_id"),
  content: text("content").notNull(),
  commentType: text("comment_type").default("comment"),
  createdAt: timestamp("created_at").defaultNow(),
})

export const relayerTransactions = pgTable("relayer_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  txHash: text("tx_hash").unique(),
  txType: text("tx_type").notNull(),
  status: text("status").default("pending"),
  gasUsed: bigint("gas_used", { mode: "bigint" }),
  nonce: integer("nonce"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
})
