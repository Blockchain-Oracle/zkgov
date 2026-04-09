import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import fp from "fastify-plugin"
import fjwt from "@fastify/jwt"
import { env } from "../config/env.js"
import { db } from "../db/index.js"
import { users } from "../db/schema.js"
import { eq } from "drizzle-orm"

export const authPlugin = fp(async function authPlugin(app: FastifyInstance) {
  await app.register(fjwt, { secret: env.JWT_SECRET })

  app.decorate("authenticate", async function (request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization
    if (!authHeader) {
      return reply.status(401).send({ error: "No authorization header" })
    }

    const token = authHeader.replace("Bearer ", "")

    try {
      const decoded = app.jwt.verify<{ userId: string }>(token)
      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.userId),
      })
      if (!user) {
        return reply.status(401).send({ error: "User not found" })
      }
      ;(request as any).user = user
    } catch {
      return reply.status(401).send({ error: "Invalid token" })
    }
  })
})
