import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import fp from "fastify-plugin"
import fjwt from "@fastify/jwt"
import { env } from "../config/env.js"
import { db } from "../db/index.js"
import { users, agents } from "../db/schema.js"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
const { compare } = bcrypt

export const authPlugin = fp(async function authPlugin(app: FastifyInstance) {
  await app.register(fjwt, { secret: env.JWT_SECRET })

  app.decorate("authenticate", async function (request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization
    if (!authHeader) {
      return reply.status(401).send({ error: "No authorization header" })
    }

    const token = authHeader.replace("Bearer ", "")

    // Try JWT first
    try {
      const decoded = app.jwt.verify<{ userId: string }>(token)
      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.userId),
      })
      if (!user) {
        return reply.status(401).send({ error: "User not found" })
      }
      ;(request as any).user = user
      return
    } catch {
      // Not a valid JWT, try API key
    }

    // Try API key (for agents)
    const agentList = await db.query.agents.findMany({
      where: eq(agents.isActive, true),
    })

    for (const agent of agentList) {
      if (await compare(token, agent.apiKeyHash)) {
        ;(request as any).agent = agent
        const owner = await db.query.users.findFirst({
          where: eq(users.id, agent.ownerId),
        })
        ;(request as any).user = owner
        return
      }
    }

    return reply.status(401).send({ error: "Invalid token or API key" })
  })
})
