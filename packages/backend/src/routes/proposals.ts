/**
 * Proposals Route — thin proxy that reads from the ZKVoting contract.
 * The frontend reads directly from the contract via wagmi.
 * This proxy exists so Telegram/Discord bots can fetch proposals
 * without needing their own RPC setup.
 */
import type { FastifyInstance } from "fastify"
import { publicClient } from "../plugins/chain.js"
import { env } from "../config/env.js"
import { ZK_VOTING_ABI } from "@zkgov/shared"

export async function proposalRoutes(app: FastifyInstance) {
  // GET /proposals — list all proposals from contract
  app.get("/proposals", async () => {
    const count = await publicClient.readContract({
      address: env.ZK_VOTING_ADDRESS,
      abi: ZK_VOTING_ABI,
      functionName: "proposalCount",
    }) as bigint

    // Fetch all proposals in parallel (2 calls per proposal, batched)
    const ids = Array.from({ length: Number(count) }, (_, i) => Number(count) - i)

    const results = await Promise.all(
      ids.map(async (i) => {
        try {
          const [content, state] = await Promise.all([
            publicClient.readContract({
              address: env.ZK_VOTING_ADDRESS, abi: ZK_VOTING_ABI,
              functionName: "getProposalContent", args: [BigInt(i)],
            }) as Promise<[string, string, string]>,
            publicClient.readContract({
              address: env.ZK_VOTING_ADDRESS, abi: ZK_VOTING_ABI,
              functionName: "getProposalState", args: [BigInt(i)],
            }) as Promise<[bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean, boolean, boolean]>,
          ])

          const [title, description, creator] = content
          const [votingStart, votingEnd, quorum, votesFor, votesAgainst, votesAbstain, totalVotes, finalized, passed, isActive] = state
          const end = Number(votingEnd) * 1000
          const remaining = end - Date.now()

          return {
            id: i, title, description, creator,
            votingStart: new Date(Number(votingStart) * 1000).toISOString(),
            votingEnd: new Date(end).toISOString(),
            quorum: Number(quorum),
            votes: { for: Number(votesFor), against: Number(votesAgainst), abstain: Number(votesAbstain) },
            totalVotes: Number(totalVotes),
            finalized, passed, isActive,
            status: finalized ? (passed ? "succeeded" : "defeated") : isActive ? "active" : "ended",
            timeRemaining: remaining > 0 ? formatDuration(remaining) : null,
          }
        } catch { return null }
      })
    )

    const proposals = results.filter((p): p is NonNullable<typeof p> => p !== null)

    return { proposals, pagination: { total: proposals.length } }
  })

  // GET /proposals/:id — single proposal from contract
  app.get<{ Params: { id: string } }>("/proposals/:id", async (request, reply) => {
    const id = parseInt(request.params.id)
    if (isNaN(id) || id <= 0) return reply.status(400).send({ error: "Invalid proposal ID" })

    try {
      const [content, stateResult] = await Promise.all([
        publicClient.readContract({
          address: env.ZK_VOTING_ADDRESS, abi: ZK_VOTING_ABI,
          functionName: "getProposalContent", args: [BigInt(id)],
        }) as Promise<[string, string, string]>,
        publicClient.readContract({
          address: env.ZK_VOTING_ADDRESS, abi: ZK_VOTING_ABI,
          functionName: "getProposalState", args: [BigInt(id)],
        }) as Promise<[bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean, boolean, boolean]>,
      ])

      const [title, description, creator] = content
      const state = stateResult

      const [votingStart, votingEnd, quorum, votesFor, votesAgainst, votesAbstain, totalVotes, finalized, passed, isActive] = state

      return {
        proposal: {
          id,
          title, description,
          creatorAddress: creator,
          creator: { type: "human", displayName: creator.slice(0, 6) + "..." + creator.slice(-4) },
          votingStart: new Date(Number(votingStart) * 1000).toISOString(),
          votingEnd: new Date(Number(votingEnd) * 1000).toISOString(),
          quorum: Number(quorum),
          votes: { for: Number(votesFor), against: Number(votesAgainst), abstain: Number(votesAbstain) },
          totalVotes: Number(totalVotes),
          finalized, passed, isActive,
          status: finalized ? (passed ? "succeeded" : "defeated") : isActive ? "active" : "ended",
        },
      }
    } catch {
      return reply.status(404).send({ error: "Proposal not found" })
    }
  })
}

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
  return `${hours}h ${minutes}m`
}
