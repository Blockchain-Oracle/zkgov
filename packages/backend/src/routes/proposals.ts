import type { FastifyInstance } from "fastify"
import { db } from "../db/index.js"
import { proposals, votes, comments } from "../db/schema.js"
import { eq, desc, sql, and } from "drizzle-orm"
import { keccak256, toBytes } from "viem"
import type { CreateProposalRequest } from "@zkgov/shared"
import { submitCreateProposal } from "../services/relayer.js"
import { broadcastToProposal } from "./sse.js"

const VOTER_GROUP_MAP: Record<string, number> = {
  humans: 0,
  agents: 1,
  both: 2,
}

export async function proposalRoutes(app: FastifyInstance) {
  // GET /proposals — list proposals
  app.get<{
    Querystring: { status?: string; page?: string; limit?: string; sort?: string }
  }>("/proposals", async (request) => {
    const { status, page = "1", limit = "20", sort = "newest" } = request.query
    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
    const offset = (pageNum - 1) * limitNum

    const conditions = status ? and(eq(proposals.status, status)) : undefined

    const items = await db.query.proposals.findMany({
      where: conditions,
      limit: limitNum,
      offset,
      orderBy: sort === "ending_soon"
        ? [proposals.votingEnd]
        : [desc(proposals.createdAt)],
    })

    // Get vote counts for each proposal
    const result = await Promise.all(
      items.map(async (p) => {
        const voteCounts = await db
          .select({
            choice: votes.voteChoice,
            count: sql<number>`count(*)::int`,
          })
          .from(votes)
          .where(eq(votes.proposalId, p.id))
          .groupBy(votes.voteChoice)

        const voteMap = { for: 0, against: 0, abstain: 0 }
        for (const v of voteCounts) {
          if (v.choice === 1) voteMap.for = v.count
          else if (v.choice === 0) voteMap.against = v.count
          else if (v.choice === 2) voteMap.abstain = v.count
        }

        const totalVotes = voteMap.for + voteMap.against + voteMap.abstain
        const now = new Date()
        const end = new Date(p.votingEnd)
        const remaining = end.getTime() - now.getTime()

        const commentCount = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(comments)
          .where(eq(comments.proposalId, p.id))

        return {
          id: p.id,
          onChainId: p.onChainId,
          title: p.title,
          description: p.description,
          proposalType: p.proposalType,
          voterGroup: p.voterGroup,
          votingStart: p.votingStart?.toISOString(),
          votingEnd: p.votingEnd?.toISOString(),
          quorum: p.quorum,
          status: p.status,
          votes: voteMap,
          totalVotes,
          quorumReached: totalVotes >= p.quorum,
          timeRemaining: remaining > 0 ? formatDuration(remaining) : null,
          commentCount: commentCount[0]?.count || 0,
          creator: {
            type: p.creatorAgentId ? "agent" : "human",
            displayName: "Anonymous",
          },
          createdAt: p.createdAt?.toISOString(),
        }
      })
    )

    const total = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(proposals)
      .where(conditions)

    return {
      proposals: result,
      pagination: { page: pageNum, limit: limitNum, total: total[0]?.count || 0 },
    }
  })

  // GET /proposals/:id — single proposal
  app.get<{ Params: { id: string } }>("/proposals/:id", async (request, reply) => {
    const id = parseInt(request.params.id)
    const proposal = await db.query.proposals.findFirst({
      where: eq(proposals.id, id),
    })

    if (!proposal) {
      return reply.status(404).send({ error: "Proposal not found" })
    }

    // Enrich with vote counts
    const voteCounts = await db
      .select({
        choice: votes.voteChoice,
        count: sql<number>`count(*)::int`,
      })
      .from(votes)
      .where(eq(votes.proposalId, id))
      .groupBy(votes.voteChoice)

    const voteMap = { for: 0, against: 0, abstain: 0 }
    for (const v of voteCounts) {
      if (v.choice === 1) voteMap.for = v.count
      else if (v.choice === 0) voteMap.against = v.count
      else if (v.choice === 2) voteMap.abstain = v.count
    }

    const totalVotes = voteMap.for + voteMap.against + voteMap.abstain
    const now = new Date()
    const end = new Date(proposal.votingEnd)
    const remaining = end.getTime() - now.getTime()

    const commentCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(comments)
      .where(eq(comments.proposalId, id))

    return {
      proposal: {
        ...proposal,
        votingStart: proposal.votingStart?.toISOString(),
        votingEnd: proposal.votingEnd?.toISOString(),
        votes: voteMap,
        totalVotes,
        quorumReached: totalVotes >= proposal.quorum,
        timeRemaining: remaining > 0 ? formatDuration(remaining) : null,
        commentCount: commentCount[0]?.count || 0,
        createdAt: proposal.createdAt?.toISOString(),
      },
    }
  })

  // POST /proposals — create proposal
  app.post<{ Body: CreateProposalRequest }>(
    "/proposals",
    { preHandler: [(app as any).authenticate] },
    async (request, reply) => {
      const { title, description, votingPeriod, quorum, voterGroup, proposalType } = request.body as any
      const user = (request as any).user
      const agent = (request as any).agent

      if (!title || !description) {
        return reply.status(400).send({ error: "title and description are required" })
      }

      const now = new Date()
      const votingEnd = new Date(now.getTime() + (votingPeriod || 172800) * 1000)

      // Submit to chain via relayer
      const contentHash = keccak256(toBytes(`${title}${description}`))
      const voterGroupNum = VOTER_GROUP_MAP[voterGroup || "both"] ?? 2
      let txHash: string | null = null

      try {
        txHash = await submitCreateProposal(
          contentHash as `0x${string}`,
          "",
          votingPeriod || 172800,
          quorum || 10,
          voterGroupNum
        )
      } catch (err) {
        // On-chain submission failed — still store locally for demo
        console.error("On-chain proposal creation failed:", err)
      }

      const [proposal] = await db
        .insert(proposals)
        .values({
          creatorId: agent ? null : user.id,
          creatorAgentId: agent?.id || null,
          title,
          description,
          proposalType: proposalType || "verified",
          voterGroup: voterGroup || "both",
          votingStart: now,
          votingEnd,
          quorum: quorum || 10,
          status: "active",
          txHash,
        })
        .returning()

      // Broadcast SSE event
      broadcastToProposal(proposal.id, "new_proposal", {
        id: proposal.id,
        title: proposal.title,
        votingEnd: votingEnd.toISOString(),
      })

      return reply.status(201).send({
        proposal: {
          id: proposal.id,
          title: proposal.title,
          status: proposal.status,
          votingEnd: votingEnd.toISOString(),
          txHash,
        },
      })
    }
  )

  // PATCH /proposals/:id — cancel
  app.patch<{ Params: { id: string } }>(
    "/proposals/:id",
    { preHandler: [(app as any).authenticate] },
    async (request, reply) => {
      const id = parseInt(request.params.id)
      const user = (request as any).user

      const proposal = await db.query.proposals.findFirst({
        where: eq(proposals.id, id),
      })

      if (!proposal) return reply.status(404).send({ error: "Not found" })
      if (proposal.creatorId !== user.id) return reply.status(403).send({ error: "Not creator" })
      if (proposal.status !== "active") return reply.status(400).send({ error: "Not active" })

      await db.update(proposals).set({ status: "cancelled" }).where(eq(proposals.id, id))

      return { status: "cancelled" }
    }
  )
}

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
  return `${hours}h ${minutes}m`
}
