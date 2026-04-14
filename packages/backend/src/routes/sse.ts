import type { FastifyInstance } from "fastify"
import { randomUUID } from "node:crypto"

// ─── Config ─────────────────────────────────────────────────────
const MAX_GLOBAL_CLIENTS = 500
const MAX_PROPOSAL_CLIENTS = 100
const HEARTBEAT_INTERVAL_MS = 30_000 // 30 seconds

// ─── In-memory client registry ──────────────────────────────────
type SSEClient = { id: string; reply: any }
const clients: Map<string, SSEClient[]> = new Map()
const globalClients: SSEClient[] = []

// Heartbeat — keeps connections alive and detects zombies
const heartbeat = setInterval(() => {
  const msg = `:heartbeat ${Date.now()}\n\n`
  for (let i = globalClients.length - 1; i >= 0; i--) {
    try {
      globalClients[i].reply.raw.write(msg)
    } catch {
      globalClients.splice(i, 1) // dead connection
    }
  }
  for (const [key, list] of clients.entries()) {
    for (let i = list.length - 1; i >= 0; i--) {
      try {
        list[i].reply.raw.write(msg)
      } catch {
        list.splice(i, 1)
      }
    }
    if (list.length === 0) clients.delete(key)
  }
}, HEARTBEAT_INTERVAL_MS)

// Prevent heartbeat from keeping the process alive on shutdown
heartbeat.unref()

// ─── Broadcast helpers ──────────────────────────────────────────
export function broadcastToProposal(proposalId: number, event: string, data: unknown) {
  const key = `proposal:${proposalId}`
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

  const proposalClients = clients.get(key) || []
  for (let i = proposalClients.length - 1; i >= 0; i--) {
    try { proposalClients[i].reply.raw.write(message) } catch { proposalClients.splice(i, 1) }
  }

  for (let i = globalClients.length - 1; i >= 0; i--) {
    try { globalClients[i].reply.raw.write(message) } catch { globalClients.splice(i, 1) }
  }
}

// ─── Routes ─────────────────────────────────────────────────────
export async function sseRoutes(app: FastifyInstance) {
  // GET /sse/proposals/:id — per-proposal event stream
  app.get<{ Params: { id: string } }>("/proposals/:id", async (request, reply) => {
    const proposalId = request.params.id
    const key = `proposal:${proposalId}`

    const list = clients.get(key) || []
    if (list.length >= MAX_PROPOSAL_CLIENTS) {
      return reply.status(503).send({ error: "Too many listeners on this proposal" })
    }

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    })

    reply.raw.write(`event: connected\ndata: {"proposalId":"${proposalId}"}\n\n`)

    const clientId = randomUUID()
    const client: SSEClient = { id: clientId, reply }

    if (!clients.has(key)) clients.set(key, [])
    clients.get(key)!.push(client)

    request.raw.on("close", () => {
      const l = clients.get(key)
      if (l) {
        clients.set(key, l.filter((c) => c.id !== clientId))
        if (clients.get(key)!.length === 0) clients.delete(key)
      }
    })

    await new Promise(() => {}) // keep connection open
  })

  // GET /sse/feed — global event stream
  app.get("/feed", async (request, reply) => {
    if (globalClients.length >= MAX_GLOBAL_CLIENTS) {
      return reply.status(503).send({ error: "Too many global listeners" })
    }

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    })

    reply.raw.write(`event: connected\ndata: {"feed":"global"}\n\n`)

    const clientId = randomUUID()
    const client: SSEClient = { id: clientId, reply }
    globalClients.push(client)

    request.raw.on("close", () => {
      const idx = globalClients.findIndex((c) => c.id === clientId)
      if (idx !== -1) globalClients.splice(idx, 1)
    })

    await new Promise(() => {}) // keep connection open
  })
}
