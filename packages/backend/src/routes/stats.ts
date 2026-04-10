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
      const { parseAbi, decodeEventLog } = await import("viem")

      // Full event ABI — viem dispatches to the right event by topic[0]
      const EVENTS_ABI = parseAbi([
        'event ProposalCreated(uint256 indexed proposalId, address indexed creator, string title, uint256 votingEnd)',
        'event VoteCast(uint256 indexed proposalId, uint256 nullifier, uint8 choice)',
        'event MemberRegistered(address indexed member, uint256 commitment)',
        'event ProposalFinalized(uint256 indexed proposalId, bool passed, uint256 votesFor, uint256 votesAgainst)',
      ])

      const logs = await publicClient.getLogs({
        address: env.ZK_VOTING_ADDRESS,
        fromBlock: BigInt(env.DEPLOYMENT_BLOCK),
        toBlock: 'latest',
      })

      const explorerUrl = "https://testnet-explorer.hsk.xyz"
      const recentLogs = logs.slice(-30)

      // Fetch block timestamps in parallel (one call per unique block)
      const uniqueBlockNumbers = Array.from(
        new Set(recentLogs.map((l) => l.blockNumber).filter((b): b is bigint => b !== null))
      )
      const blockTimestamps = new Map<string, string>()
      await Promise.all(
        uniqueBlockNumbers.map(async (blockNumber) => {
          try {
            const block = await publicClient.getBlock({ blockNumber })
            blockTimestamps.set(
              blockNumber.toString(),
              new Date(Number(block.timestamp) * 1000).toISOString()
            )
          } catch {
            // fall through — entry will default below
          }
        })
      )

      const getTime = (blockNumber: bigint | null) =>
        (blockNumber && blockTimestamps.get(blockNumber.toString())) ||
        new Date().toISOString()

      for (const log of recentLogs) {
        const txHash = log.transactionHash
        const time = getTime(log.blockNumber)
        const logIndex = log.logIndex ?? 0

        let decoded: any
        try {
          decoded = decodeEventLog({
            abi: EVENTS_ABI,
            data: log.data,
            topics: log.topics,
          })
        } catch {
          // Unknown event — skip
          continue
        }

        const eventName = decoded.eventName
        const args = decoded.args as any
        const baseId = `${eventName}-${txHash}-${logIndex}`

        if (eventName === 'ProposalCreated') {
          onChainActivity.push({
            id: baseId,
            type: 'proposal',
            platform: 'on-chain',
            text: `Proposal #${String(args.proposalId).padStart(3, '0')} created: ${args.title}`,
            proposalId: Number(args.proposalId),
            txHash,
            explorerUrl: `${explorerUrl}/tx/${txHash}`,
            time,
          })
        } else if (eventName === 'VoteCast') {
          const choices = ['Against', 'For', 'Abstain']
          onChainActivity.push({
            id: baseId,
            type: 'vote',
            platform: 'on-chain',
            text: `Anonymous vote (${choices[Number(args.choice)] || '?'}) on proposal #${String(args.proposalId).padStart(3, '0')}`,
            proposalId: Number(args.proposalId),
            txHash,
            explorerUrl: `${explorerUrl}/tx/${txHash}`,
            time,
          })
        } else if (eventName === 'MemberRegistered') {
          const addr = args.member as string
          onChainActivity.push({
            id: baseId,
            type: 'registration',
            platform: 'on-chain',
            text: `New voter registered: ${addr.slice(0, 6)}...${addr.slice(-4)}`,
            proposalId: 0,
            txHash,
            explorerUrl: `${explorerUrl}/tx/${txHash}`,
            time,
          })
        } else if (eventName === 'ProposalFinalized') {
          const outcome = args.passed ? 'PASSED' : 'DEFEATED'
          onChainActivity.push({
            id: baseId,
            type: 'finalization',
            platform: 'on-chain',
            text: `Proposal #${String(args.proposalId).padStart(3, '0')} finalized — ${outcome} (${args.votesFor} for / ${args.votesAgainst} against)`,
            proposalId: Number(args.proposalId),
            txHash,
            explorerUrl: `${explorerUrl}/tx/${txHash}`,
            time,
          })
        }
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
