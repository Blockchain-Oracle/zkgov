/**
 * Proposals Route — thin proxy that reads from the ZKVoting contract.
 * The frontend reads directly from the contract via wagmi.
 * This proxy exists so Telegram/Discord bots can fetch proposals
 * without needing their own RPC setup.
 */
import type { FastifyInstance } from "fastify"
import { publicClient } from "../plugins/chain.js"
import { env } from "../config/env.js"

const ZK_VOTING_ABI = [
  { name: "proposalCount", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "getProposalContent", type: "function", stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [{ name: "title", type: "string" }, { name: "description", type: "string" }, { name: "creator", type: "address" }] },
  { name: "getProposalState", type: "function", stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [
      { name: "votingStart", type: "uint256" }, { name: "votingEnd", type: "uint256" },
      { name: "quorum", type: "uint256" }, { name: "votesFor", type: "uint256" },
      { name: "votesAgainst", type: "uint256" }, { name: "votesAbstain", type: "uint256" },
      { name: "totalVotes", type: "uint256" }, { name: "finalized", type: "bool" },
      { name: "passed", type: "bool" }, { name: "isActive", type: "bool" },
    ] },
  { name: "getStats", type: "function", stateMutability: "view", inputs: [],
    outputs: [{ name: "totalProposals", type: "uint256" }, { name: "totalMembers", type: "uint256" }, { name: "activeGroupId", type: "uint256" }] },
] as const

export async function proposalRoutes(app: FastifyInstance) {
  // GET /proposals — list all proposals from contract
  app.get("/proposals", async () => {
    const count = await publicClient.readContract({
      address: env.ZK_VOTING_ADDRESS,
      abi: ZK_VOTING_ABI,
      functionName: "proposalCount",
    }) as bigint

    const proposals = []
    for (let i = Number(count); i >= 1; i--) {
      try {
        const [title, description, creator] = await publicClient.readContract({
          address: env.ZK_VOTING_ADDRESS,
          abi: ZK_VOTING_ABI,
          functionName: "getProposalContent",
          args: [BigInt(i)],
        }) as [string, string, string]

        const state = await publicClient.readContract({
          address: env.ZK_VOTING_ADDRESS,
          abi: ZK_VOTING_ABI,
          functionName: "getProposalState",
          args: [BigInt(i)],
        }) as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean, boolean, boolean]

        const [votingStart, votingEnd, quorum, votesFor, votesAgainst, votesAbstain, totalVotes, finalized, passed, isActive] = state

        const now = Date.now()
        const end = Number(votingEnd) * 1000
        const remaining = end - now

        proposals.push({
          id: i,
          title,
          description,
          creator,
          votingStart: new Date(Number(votingStart) * 1000).toISOString(),
          votingEnd: new Date(Number(votingEnd) * 1000).toISOString(),
          quorum: Number(quorum),
          votes: { for: Number(votesFor), against: Number(votesAgainst), abstain: Number(votesAbstain) },
          totalVotes: Number(totalVotes),
          finalized,
          passed,
          isActive,
          status: finalized ? (passed ? "succeeded" : "defeated") : isActive ? "active" : "ended",
          timeRemaining: remaining > 0 ? formatDuration(remaining) : null,
        })
      } catch { /* skip invalid proposals */ }
    }

    return { proposals, pagination: { total: proposals.length } }
  })

  // GET /proposals/:id — single proposal from contract
  app.get<{ Params: { id: string } }>("/proposals/:id", async (request, reply) => {
    const id = parseInt(request.params.id)

    try {
      const [title, description, creator] = await publicClient.readContract({
        address: env.ZK_VOTING_ADDRESS,
        abi: ZK_VOTING_ABI,
        functionName: "getProposalContent",
        args: [BigInt(id)],
      }) as [string, string, string]

      const state = await publicClient.readContract({
        address: env.ZK_VOTING_ADDRESS,
        abi: ZK_VOTING_ABI,
        functionName: "getProposalState",
        args: [BigInt(id)],
      }) as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean, boolean, boolean]

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
