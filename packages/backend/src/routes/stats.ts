/**
 * Stats Route — reads from the ZKVoting contract + comment count from DB.
 */
import type { FastifyInstance } from "fastify"
import { publicClient } from "../plugins/chain.js"
import { env } from "../config/env.js"
import { db } from "../db/index.js"
import { comments } from "../db/schema.js"
import { sql } from "drizzle-orm"

const ZK_VOTING_ABI = [
  { name: "getStats", type: "function", stateMutability: "view", inputs: [],
    outputs: [{ name: "totalProposals", type: "uint256" }, { name: "totalMembers", type: "uint256" }, { name: "activeGroupId", type: "uint256" }] },
] as const

export async function statsRoutes(app: FastifyInstance) {
  app.get("/stats", async () => {
    try {
      const [totalProposals, totalMembers] = await publicClient.readContract({
        address: env.ZK_VOTING_ADDRESS,
        abi: ZK_VOTING_ABI,
        functionName: "getStats",
      }) as [bigint, bigint, bigint]

      const [commentCount] = await db.select({ count: sql<number>`count(*)::int` }).from(comments)

      return {
        proposals: Number(totalProposals),
        members: Number(totalMembers),
        comments: commentCount?.count || 0,
      }
    } catch {
      return { proposals: 0, members: 0, comments: 0 }
    }
  })
}
