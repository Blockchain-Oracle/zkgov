/**
 * Stats Route — aggregated platform statistics in a single call.
 * Used by the dashboard/landing page to show proposal count, vote count,
 * voter count, and agent count without making 4 separate API calls.
 */
import type { FastifyInstance } from "fastify"
import { db } from "../db/index.js"
import { proposals, votes, users, agents, comments } from "../db/schema.js"
import { sql, eq, desc } from "drizzle-orm"

export async function statsRoutes(app: FastifyInstance) {
  // GET /activity — recent platform activity (votes, proposals, comments)
  app.get("/activity", async () => {
    // Get recent votes
    const recentVotes = await db.query.votes.findMany({
      orderBy: [desc(votes.createdAt)],
      limit: 20,
    })

    // Get recent proposals
    const recentProposals = await db.query.proposals.findMany({
      orderBy: [desc(proposals.createdAt)],
      limit: 10,
    })

    // Get recent comments
    const recentComments = await db.query.comments.findMany({
      orderBy: [desc(comments.createdAt)],
      limit: 10,
    })

    // Merge into a unified activity feed, sorted by time
    const activity = [
      ...recentVotes.map(v => ({
        id: v.id,
        type: "vote" as const,
        platform: v.submittedVia,
        text: `Anonymous vote cast on #${String(v.proposalId).padStart(3, '0')}`,
        proposalId: v.proposalId,
        time: v.createdAt?.toISOString() || new Date().toISOString(),
      })),
      ...recentProposals.map(p => ({
        id: `p-${p.id}`,
        type: "proposal" as const,
        platform: "web",
        text: `Proposal #${String(p.id).padStart(3, '0')} created: ${p.title}`,
        proposalId: p.id,
        time: p.createdAt?.toISOString() || new Date().toISOString(),
      })),
      ...recentComments.map(c => ({
        id: c.id,
        type: "comment" as const,
        platform: c.agentId ? "api" : "web",
        text: `Comment on #${String(c.proposalId).padStart(3, '0')}`,
        proposalId: c.proposalId,
        time: c.createdAt?.toISOString() || new Date().toISOString(),
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
     .slice(0, 30)

    return { activity }
  })

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
