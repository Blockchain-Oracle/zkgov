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

  // GET /activity — recent on-chain events + comments
  app.get("/activity", async () => {
    const recentComments = await db.query.comments.findMany({
      orderBy: [desc(comments.createdAt)],
      limit: 20,
    })

    // Parse on-chain events
    let onChainActivity: any[] = []
    try {
      const { parseAbiItem, decodeEventLog } = await import("viem")

      const proposalCreatedEvent = parseAbiItem('event ProposalCreated(uint256 indexed proposalId, address indexed creator, string title, uint256 votingEnd)')
      const voteCastEvent = parseAbiItem('event VoteCast(uint256 indexed proposalId, uint256 nullifier, uint8 choice)')
      const memberRegisteredEvent = parseAbiItem('event MemberRegistered(address indexed member, uint256 commitment)')

      const logs = await publicClient.getLogs({
        address: env.ZK_VOTING_ADDRESS,
        fromBlock: BigInt(env.DEPLOYMENT_BLOCK),
        toBlock: 'latest',
      })

      const explorerUrl = "https://testnet-explorer.hsk.xyz"

      for (const log of logs.slice(-20)) {
        const txHash = log.transactionHash
        try {
          const decoded = decodeEventLog({ abi: [proposalCreatedEvent], data: log.data, topics: log.topics })
          onChainActivity.push({
            id: `pc-${txHash}`,
            type: 'proposal',
            platform: 'on-chain',
            text: `Proposal #${String((decoded.args as any).proposalId).padStart(3, '0')} created: ${(decoded.args as any).title}`,
            proposalId: Number((decoded.args as any).proposalId),
            txHash,
            explorerUrl: `${explorerUrl}/tx/${txHash}`,
            time: new Date().toISOString(),
          })
          continue
        } catch {}

        try {
          const decoded = decodeEventLog({ abi: [voteCastEvent], data: log.data, topics: log.topics })
          const choices = ['Against', 'For', 'Abstain']
          onChainActivity.push({
            id: `vc-${txHash}`,
            type: 'vote',
            platform: 'on-chain',
            text: `Anonymous vote (${choices[(decoded.args as any).choice] || '?'}) on proposal #${String((decoded.args as any).proposalId).padStart(3, '0')}`,
            proposalId: Number((decoded.args as any).proposalId),
            txHash,
            explorerUrl: `${explorerUrl}/tx/${txHash}`,
            time: new Date().toISOString(),
          })
          continue
        } catch {}

        try {
          const decoded = decodeEventLog({ abi: [memberRegisteredEvent], data: log.data, topics: log.topics })
          const addr = (decoded.args as any).member as string
          onChainActivity.push({
            id: `mr-${txHash}`,
            type: 'registration',
            platform: 'on-chain',
            text: `New voter registered: ${addr.slice(0, 6)}...${addr.slice(-4)}`,
            proposalId: 0,
            txHash,
            explorerUrl: `${explorerUrl}/tx/${txHash}`,
            time: new Date().toISOString(),
          })
        } catch {}
      }
    } catch {
      // RPC might be down
    }

    const activity = [
      ...recentComments.map(c => ({
        id: c.id,
        type: 'comment',
        platform: 'web',
        text: `Comment on proposal #${String(c.proposalId).padStart(3, '0')}`,
        proposalId: c.proposalId,
        txHash: null,
        explorerUrl: null,
        time: c.createdAt?.toISOString() || new Date().toISOString(),
      })),
      ...onChainActivity,
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
     .slice(0, 30)

    return { activity }
  })
}
