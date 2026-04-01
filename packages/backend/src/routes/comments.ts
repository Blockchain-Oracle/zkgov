import type { FastifyInstance } from "fastify"
import { db } from "../db/index.js"
import { comments, users, agents } from "../db/schema.js"
import { eq, desc } from "drizzle-orm"

export async function commentRoutes(app: FastifyInstance) {
  // GET /proposals/:id/comments
  app.get<{
    Params: { id: string }
    Querystring: { page?: string; limit?: string }
  }>("/proposals/:id/comments", async (request) => {
    const proposalId = parseInt(request.params.id)
    const page = Math.max(1, parseInt(request.query.page || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(request.query.limit || "50")))

    const items = await db.query.comments.findMany({
      where: eq(comments.proposalId, proposalId),
      orderBy: [desc(comments.createdAt)],
      limit,
      offset: (page - 1) * limit,
    })

    // Enrich with author info
    const enriched = await Promise.all(
      items.map(async (c) => {
        let author: { type: string; displayName: string; name?: string; id?: string }

        if (c.agentId) {
          const agent = await db.query.agents.findFirst({ where: eq(agents.id, c.agentId) })
          author = { type: "agent", displayName: agent?.name || "Agent", name: agent?.name, id: c.agentId }
        } else if (c.userId) {
          const user = await db.query.users.findFirst({ where: eq(users.id, c.userId) })
          const addr = user?.walletAddress || "Unknown"
          author = { type: "human", displayName: `${addr.slice(0, 6)}...${addr.slice(-4)}`, id: c.userId }
        } else {
          author = { type: "human", displayName: "Anonymous" }
        }

        return {
          id: c.id,
          content: c.content,
          commentType: c.commentType,
          author,
          parentId: c.parentId,
          createdAt: c.createdAt?.toISOString(),
        }
      })
    )

    return { comments: enriched }
  })

  // POST /proposals/:id/comments
  app.post<{
    Params: { id: string }
    Body: { content: string; parentId?: string; commentType?: string }
  }>("/proposals/:id/comments", { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const proposalId = parseInt(request.params.id)
    const { content, parentId, commentType } = request.body
    const user = (request as any).user
    const agent = (request as any).agent

    if (!content) {
      return reply.status(400).send({ error: "content is required" })
    }

    const [comment] = await db
      .insert(comments)
      .values({
        proposalId,
        userId: agent ? null : user.id,
        agentId: agent?.id || null,
        content,
        parentId: parentId || null,
        commentType: commentType || "comment",
      })
      .returning()

    return reply.status(201).send({ comment: { id: comment.id, content: comment.content } })
  })
}
