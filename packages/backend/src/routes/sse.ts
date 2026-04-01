import type { FastifyInstance } from "fastify"

// Simple in-memory event bus for SSE
type SSEClient = { id: string; reply: any }
const clients: Map<string, SSEClient[]> = new Map()
const globalClients: SSEClient[] = []

export function broadcastToProposal(proposalId: number, event: string, data: unknown) {
  const key = `proposal:${proposalId}`
  const proposalClients = clients.get(key) || []

  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

  for (const client of proposalClients) {
    try { client.reply.raw.write(message) } catch {}
  }

  // Also broadcast to global feed
  const globalMessage = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const client of globalClients) {
    try { client.reply.raw.write(globalMessage) } catch {}
  }
}

export async function sseRoutes(app: FastifyInstance) {
  // GET /sse/proposals/:id — per-proposal event stream
  app.get<{ Params: { id: string } }>("/sse/proposals/:id", async (request, reply) => {
    const proposalId = request.params.id
    const key = `proposal:${proposalId}`

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    })

    reply.raw.write(`event: connected\ndata: {"proposalId":"${proposalId}"}\n\n`)

    const clientId = Math.random().toString(36).substring(7)
    const client: SSEClient = { id: clientId, reply }

    if (!clients.has(key)) clients.set(key, [])
    clients.get(key)!.push(client)

    request.raw.on("close", () => {
      const list = clients.get(key)
      if (list) {
        clients.set(key, list.filter((c) => c.id !== clientId))
      }
    })

    // Keep connection open — don't return
    await new Promise(() => {})
  })

  // GET /sse/feed — global event stream
  app.get("/sse/feed", async (request, reply) => {
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    })

    reply.raw.write(`event: connected\ndata: {"feed":"global"}\n\n`)

    const clientId = Math.random().toString(36).substring(7)
    const client: SSEClient = { id: clientId, reply }
    globalClients.push(client)

    request.raw.on("close", () => {
      const idx = globalClients.findIndex((c) => c.id === clientId)
      if (idx !== -1) globalClients.splice(idx, 1)
    })

    await new Promise(() => {})
  })
}
