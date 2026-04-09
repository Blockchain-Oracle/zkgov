import type { FastifyInstance } from "fastify"
import { db } from "../db/index.js"
import { comments, users } from "../db/schema.js"
import { eq, desc } from "drizzle-orm"
import { broadcastToProposal } from "./sse.js"

export async function commentRoutes(app: FastifyInstance) {
  // GET /proposals/:id/comments
  app.get<{ Params: { id: string } }>("/proposals/:id/comments", async (request) => {
    const proposalId = parseInt(request.params.id)

    const items = await db.query.comments.findMany({
      where: eq(comments.proposalId, proposalId),
      orderBy: [desc(comments.createdAt)],
      limit: 50,
    })

    const enriched = await Promise.all(
      items.map(async (c) => {
        let displayName = "Anonymous"
        if (c.userId) {
          const user = await db.query.users.findFirst({ where: eq(users.id, c.userId) })
          const addr = user?.walletAddress || "Unknown"
          displayName = `${addr.slice(0, 6)}...${addr.slice(-4)}`
        }

        return {
          id: c.id,
          content: c.content,
          commentType: c.commentType,
          author: { type: "human" as const, displayName },
          parentId: c.parentId,
          createdAt: c.createdAt?.toISOString(),
        }
      })
    )

    // Build threaded tree
    const commentMap = new Map<string, any>()
    const roots: any[] = []
    for (const c of enriched) commentMap.set(c.id, { ...c, replies: [] })
    for (const c of enriched) {
      const node = commentMap.get(c.id)!
      if (c.parentId && commentMap.has(c.parentId)) commentMap.get(c.parentId)!.replies.push(node)
      else roots.push(node)
    }

    return { comments: roots }
  })

  // POST /proposals/:id/comments
  app.post<{
    Params: { id: string }
    Body: { content: string; parentId?: string; commentType?: string }
  }>("/proposals/:id/comments", { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const proposalId = parseInt(request.params.id)
    const { content, parentId, commentType } = request.body
    const user = (request as any).user

    if (!content) return reply.status(400).send({ error: "content is required" })

    const [comment] = await db.insert(comments).values({
      proposalId,
      userId: user.id,
      content,
      parentId: parentId || null,
      commentType: commentType || "comment",
    }).returning()

    broadcastToProposal(proposalId, "comment_added", {
      proposalId,
      comment: { id: comment.id, content: comment.content },
    })

    return reply.status(201).send({ comment: { id: comment.id, content: comment.content } })
  })
}
