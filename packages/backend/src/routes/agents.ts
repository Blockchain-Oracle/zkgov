import type { FastifyInstance } from "fastify"
import { randomBytes } from "node:crypto"
import bcrypt from "bcryptjs"
const { hash: bcryptHash } = bcrypt
import { db } from "../db/index.js"
import { agents, users } from "../db/schema.js"
import { eq, and } from "drizzle-orm"
import { createIdentity } from "../services/semaphore.js"

export async function agentRoutes(app: FastifyInstance) {
  // POST /agents — register a new agent
  app.post<{
    Body: { name: string; onChainAddress?: string }
  }>("/agents", { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const user = (request as any).user
    const { name, onChainAddress } = request.body

    if (!name) {
      return reply.status(400).send({ error: "name is required" })
    }

    if (!user.kycVerified) {
      return reply.status(403).send({ error: "You must be KYC verified to register agents" })
    }

    // Create Semaphore identity for agent
    const identity = createIdentity()

    // Generate API key
    const apiKey = `zkgov_${randomBytes(32).toString("hex")}`
    const apiKeyHashed = await bcryptHash(apiKey, 10)

    const [agent] = await db
      .insert(agents)
      .values({
        ownerId: user.id,
        name,
        apiKeyHash: apiKeyHashed,
        encryptedIdentity: identity.encryptedKey.ciphertext,
        identityCommitment: identity.commitment,
        encryptionIv: identity.encryptedKey.iv,
        onChainAddress: onChainAddress || null,
      })
      .returning()

    // Note: On-chain registration (agentRegistry.registerAgent + kycGate.registerAgent)
    // must be called from the owner's wallet since contracts check msg.sender.
    // The frontend handles this — same pattern as human KYC registration.

    return reply.status(201).send({
      agent: {
        id: agent.id,
        name: agent.name,
        apiKey, // Shown ONCE
        identityCommitment: agent.identityCommitment,
        onChainRegistration: onChainAddress ? {
          step1: {
            contract: "AgentRegistry",
            function: "registerAgent(address)",
            args: [onChainAddress],
            note: "Call from owner wallet to register agent address",
          },
          step2: {
            contract: "KycGate",
            function: "registerAgent(address, uint256)",
            args: [onChainAddress, identity.commitment],
            note: "Call from owner wallet to add agent to Semaphore group",
          },
        } : null,
      },
    })
  })

  // GET /agents — public listing of all active agents
  app.get("/agents", async () => {
    const allAgents = await db.query.agents.findMany({
      where: eq(agents.isActive, true),
    })

    return {
      agents: allAgents.map((a) => ({
        id: a.id,
        name: a.name,
        isActive: a.isActive,
        onChainAddress: a.onChainAddress,
        createdAt: a.createdAt?.toISOString(),
      })),
    }
  })

  // GET /agents/mine — list my agents (authenticated)
  app.get("/agents/mine", { preHandler: [(app as any).authenticate] }, async (request) => {
    const user = (request as any).user

    const myAgents = await db.query.agents.findMany({
      where: eq(agents.ownerId, user.id),
    })

    return {
      agents: myAgents.map((a) => ({
        id: a.id,
        name: a.name,
        isActive: a.isActive,
        onChainAddress: a.onChainAddress,
        identityCommitment: a.identityCommitment,
        createdAt: a.createdAt?.toISOString(),
      })),
    }
  })

  // DELETE /agents/:id — deregister agent
  app.delete<{ Params: { id: string } }>(
    "/agents/:id",
    { preHandler: [(app as any).authenticate] },
    async (request, reply) => {
      const user = (request as any).user
      const agentId = request.params.id

      const agent = await db.query.agents.findFirst({
        where: and(eq(agents.id, agentId), eq(agents.ownerId, user.id)),
      })

      if (!agent) {
        return reply.status(404).send({ error: "Agent not found" })
      }

      await db.update(agents).set({ isActive: false }).where(eq(agents.id, agentId))

      return { status: "deregistered" }
    }
  )
}
