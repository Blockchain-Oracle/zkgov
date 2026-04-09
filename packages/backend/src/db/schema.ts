/**
 * ZKGov Database Schema (Simplified)
 *
 * Most state lives on-chain in the ZKVoting contract:
 *   - Proposals (title, description, votes, quorum) → on-chain
 *   - Voter registration (identity commitments) → on-chain Semaphore group
 *   - Vote tallies → on-chain
 *   - Double-vote prevention → on-chain nullifiers
 *
 * The database only stores what CAN'T go on-chain:
 *   - User accounts (wallet ↔ Telegram ↔ Discord linking)
 *   - Comments/discussion (social layer)
 */

import { pgTable, uuid, text, bigint, integer, timestamp } from "drizzle-orm/pg-core"

/**
 * Users — platform identity mapping.
 * Links wallet address to Telegram/Discord for cross-platform features.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletAddress: text("wallet_address").unique().notNull(),
  telegramId: bigint("telegram_id", { mode: "bigint" }).unique(),
  discordId: text("discord_id").unique(),
  createdAt: timestamp("created_at").defaultNow(),
})

/**
 * Comments — off-chain discussion layer.
 * proposalId references the on-chain proposal ID (not a DB FK).
 */
export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalId: integer("proposal_id").notNull(),
  userId: uuid("user_id").references(() => users.id),
  parentId: uuid("parent_id"),
  content: text("content").notNull(),
  commentType: text("comment_type").default("comment"),
  createdAt: timestamp("created_at").defaultNow(),
})
