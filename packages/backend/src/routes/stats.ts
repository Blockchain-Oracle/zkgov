/**
 * Stats Route — reads from the ZKVoting contract + comment count from DB.
 */
import type { FastifyInstance } from "fastify"
import { publicClient } from "../plugins/chain.js"
import { env } from "../config/env.js"
import { db } from "../db/index.js"
import { comments } from "../db/schema.js"
import { sql, desc } from "drizzle-orm"

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

  // GET /activity — recent activity from contract events + comments
  app.get("/activity", async () => {
    // Get recent comments from DB
    const recentComments = await db.query.comments.findMany({
      orderBy: [desc(comments.createdAt)],
      limit: 20,
    })

    // Read proposal events from contract
    const ZK_VOTING_EVENTS_ABI = [
      { name: "ProposalCreated", type: "event", inputs: [
        { name: "proposalId", type: "uint256", indexed: true },
        { name: "creator", type: "address", indexed: true },
        { name: "title", type: "string" },
        { name: "votingEnd", type: "uint256" },
      ] },
      { name: "VoteCast", type: "event", inputs: [
        { name: "proposalId", type: "uint256", indexed: true },
        { name: "nullifier", type: "uint256" },
        { name: "choice", type: "uint8" },
      ] },
      { name: "MemberRegistered", type: "event", inputs: [
        { name: "member", type: "address", indexed: true },
        { name: "commitment", type: "uint256" },
      ] },
    ] as const

    let onChainActivity: any[] = []
    try {
      const logs = await publicClient.getLogs({
        address: env.ZK_VOTING_ADDRESS,
        fromBlock: BigInt(env.DEPLOYMENT_BLOCK),
        toBlock: 'latest',
      })

      onChainActivity = logs.map((log, i) => {
        // Parse event type from topics
        const proposalCreatedTopic = '0x' // simplified — just use index
        return {
          id: `chain-${i}`,
          type: 'vote',
          platform: 'web',
          text: `On-chain event at block ${Number(log.blockNumber)}`,
          proposalId: 0,
          time: new Date().toISOString(),
        }
      }).slice(-10)
    } catch {
      // RPC might be down — that's ok, just show comments
    }

    // Combine comments + on-chain events
    const activity = [
      ...recentComments.map(c => ({
        id: c.id,
        type: 'comment',
        platform: 'web',
        text: `Comment on proposal #${String(c.proposalId).padStart(3, '0')}`,
        proposalId: c.proposalId,
        time: c.createdAt?.toISOString() || new Date().toISOString(),
      })),
      ...onChainActivity,
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
     .slice(0, 30)

    return { activity }
  })
}
