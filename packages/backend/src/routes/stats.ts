/**
 * Stats Route — aggregated platform statistics in a single call.
 * Used by the dashboard/landing page to show proposal count, vote count,
 * voter count, and agent count without making 4 separate API calls.
 */
import type { FastifyInstance } from "fastify"
import { db } from "../db/index.js"
import { proposals, votes, users, agents } from "../db/schema.js"
import { sql, eq } from "drizzle-orm"

export async function statsRoutes(app: FastifyInstance) {
  // GET /stats — aggregated platform statistics
  app.get("/stats", async () => {
    const [proposalCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(proposals)

    const [voteCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(votes)

    const [voterCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.kycVerified, true))

    const [agentCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(agents)
      .where(eq(agents.isActive, true))

    return {
      proposals: proposalCount?.count || 0,
      votes: voteCount?.count || 0,
      voters: voterCount?.count || 0,
      agents: agentCount?.count || 0,
    }
  })
}
