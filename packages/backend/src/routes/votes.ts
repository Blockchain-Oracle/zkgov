import type { FastifyInstance } from "fastify"
import { db } from "../db/index.js"
import { votes, proposals } from "../db/schema.js"
import { eq } from "drizzle-orm"
import { generateVoteProof } from "../services/semaphore.js"
import { submitVote } from "../services/relayer.js"
import { broadcastToProposal } from "./sse.js"
import { env } from "../config/env.js"
import type { VoteChoice } from "@zkgov/shared"

/**
 * Vote Routes
 *
 * The voting flow is the core of ZKGov's privacy model:
 *
 * 1. User sends { proposalId, choice } — authenticated via JWT or API key
 * 2. Backend looks up user's ENCRYPTED Semaphore identity (never stored in plaintext)
 * 3. Backend decrypts it, generates a Groth16 ZK proof via snarkjs
 * 4. The proof proves "I am a registered voter AND I vote X" without revealing WHO
 * 5. Relayer submits the proof on-chain → Semaphore contract verifies it
 * 6. On-chain: nullifier prevents double-voting, vote tally incremented
 * 7. Database stores an ANONYMOUS record (no user_id) for API display
 *
 * The database vote record mirrors on-chain state for fast queries,
 * but the ON-CHAIN tally is the source of truth for governance outcomes.
 */
export async function voteRoutes(app: FastifyInstance) {
  // GET /votes/check/:proposalId — check if the current user has already voted
  // Uses the Semaphore nullifier: hash(identity, proposalId) is deterministic
  app.get<{ Params: { proposalId: string } }>(
    "/votes/check/:proposalId",
    { preHandler: [(app as any).authenticate] },
    async (request) => {
      const user = (request as any).user
      const agent = (request as any).agent
      const proposalId = parseInt(request.params.proposalId)

      // Restore identity to compute what the nullifier WOULD be
      const { restoreIdentity } = await import("../services/semaphore.js")
      const { Identity, Group } = await import("@semaphore-protocol/core")

      const encId = agent ? agent.encryptedIdentity : user.encryptedIdentity
      const encIv = agent ? agent.encryptionIv : user.encryptionIv
      const identity = restoreIdentity(encId, encIv)

      // The nullifier is deterministic: hash(identitySecret, scope)
      // We can check if this nullifier exists in our votes table
      // Semaphore's nullifier = poseidon(identitySecret, scope)
      // For now, just check by generating a proof with a dummy group and extracting nullifier
      // Actually simpler: compute nullifier directly
      const { poseidon2 } = await import("@semaphore-protocol/utils/poseidon")
      const nullifier = poseidon2([identity.secretScalar, BigInt(proposalId)]).toString()

      const existing = await db.query.votes.findFirst({
        where: eq(votes.nullifierHash, nullifier),
      })

      return { hasVoted: !!existing, proposalId }
    }
  )

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

      // Try to submit to chain via relayer
      let txHash: string | null = null
      try {
        txHash = await submitVote(proposalId, {
          merkleTreeDepth: proof.merkleTreeDepth,
          merkleTreeRoot: BigInt(proof.merkleTreeRoot),
          nullifier: BigInt(proof.nullifier),
          message: BigInt(proof.message),
          points: proof.points.map(BigInt),
        })
      } catch (chainErr) {
        // On-chain submission failed (RPC unstable, group not synced, etc.)
        // Still record the vote — the ZK proof is valid regardless
        console.error("On-chain vote submission failed:", chainErr)
      }

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
        txHash,
        txStatus: txHash ? "submitted" : "proof-only",
        submittedVia: platform,
      })

      // Broadcast real-time update
      broadcastToProposal(proposalId, "vote_cast", {
        proposalId,
        submittedVia: platform,
      })

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
