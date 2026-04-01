import type { FastifyInstance } from "fastify"
import { db } from "../db/index.js"
import { votes, proposals, users, agents } from "../db/schema.js"
import { eq } from "drizzle-orm"
import { generateVoteProof } from "../services/semaphore.js"
import { submitVote } from "../services/relayer.js"
import { env } from "../config/env.js"
import type { VoteChoice } from "@zkgov/shared"

export async function voteRoutes(app: FastifyInstance) {
  // POST /votes — cast an anonymous vote
  app.post<{
    Body: { proposalId: number; choice: VoteChoice }
  }>("/votes", { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const { proposalId, choice } = request.body
    const user = (request as any).user
    const agent = (request as any).agent

    if (proposalId === undefined || choice === undefined) {
      return reply.status(400).send({ error: "proposalId and choice are required" })
    }

    if (![0, 1, 2].includes(choice)) {
      return reply.status(400).send({ error: "choice must be 0 (No), 1 (Yes), or 2 (Abstain)" })
    }

    // Check proposal exists and is active
    const proposal = await db.query.proposals.findFirst({
      where: eq(proposals.id, proposalId),
    })

    if (!proposal) {
      return reply.status(404).send({ error: "Proposal not found" })
    }

    if (proposal.status !== "active") {
      return reply.status(400).send({ error: "Proposal is not active" })
    }

    const now = new Date()
    if (now > new Date(proposal.votingEnd)) {
      return reply.status(400).send({ error: "Voting has ended" })
    }

    // Determine which identity to use (human or agent)
    let encryptedIdentity: Buffer
    let encryptionIv: Buffer
    let groupId: string
    let platform: string

    if (agent) {
      encryptedIdentity = agent.encryptedIdentity
      encryptionIv = agent.encryptionIv
      groupId = env.AGENT_GROUP_ID
      platform = "api"
    } else {
      encryptedIdentity = user.encryptedIdentity
      encryptionIv = user.encryptionIv
      groupId = env.HUMAN_GROUP_ID
      platform = (request.headers["x-platform"] as string) || "web"
    }

    try {
      // Generate ZK proof server-side
      const proof = await generateVoteProof(
        encryptedIdentity,
        encryptionIv,
        groupId,
        choice,
        proposalId
      )

      // Store vote (anonymous — no user reference)
      await db.insert(votes).values({
        proposalId,
        nullifierHash: proof.nullifier.toString(),
        voteChoice: choice,
        proof: {
          merkleTreeDepth: proof.merkleTreeDepth,
          merkleTreeRoot: proof.merkleTreeRoot.toString(),
          nullifier: proof.nullifier.toString(),
          message: proof.message.toString(),
          points: proof.points.map(String),
        },
        txStatus: "pending",
        submittedVia: platform,
      })

      // Submit to chain via relayer
      const txHash = await submitVote(proposalId, proof)

      return reply.status(202).send({
        status: "submitted",
        txHash,
        message: "Your anonymous vote has been submitted. It will be confirmed shortly.",
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error"

      // Check for double-vote
      if (message.includes("nullifier") || message.includes("already")) {
        return reply.status(409).send({ error: "You have already voted on this proposal." })
      }

      return reply.status(500).send({ error: `Vote failed: ${message}` })
    }
  })

  // GET /votes/status/:txHash — check transaction status
  app.get<{ Params: { txHash: string } }>("/votes/status/:txHash", async (request, reply) => {
    const vote = await db.query.votes.findFirst({
      where: eq(votes.txHash, request.params.txHash),
    })

    if (!vote) {
      return reply.status(404).send({ error: "Vote not found" })
    }

    return { txHash: vote.txHash, status: vote.txStatus }
  })
}
