import Fastify from "fastify"
import cors from "@fastify/cors"
import { env } from "./config/env.js"
import { authPlugin } from "./plugins/auth.js"
import { authRoutes } from "./routes/auth.js"
import { proposalRoutes } from "./routes/proposals.js"
import { voteRoutes } from "./routes/votes.js"
import { commentRoutes } from "./routes/comments.js"
import { agentRoutes } from "./routes/agents.js"
import { sseRoutes } from "./routes/sse.js"

const app = Fastify({ logger: true })

await app.register(cors, { origin: true })
await app.register(authPlugin)

// Health check
app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }))

// API routes
await app.register(authRoutes, { prefix: "/api/auth" })
await app.register(proposalRoutes, { prefix: "/api" })
await app.register(voteRoutes, { prefix: "/api" })
await app.register(commentRoutes, { prefix: "/api" })
await app.register(agentRoutes, { prefix: "/api" })
await app.register(sseRoutes, { prefix: "/api/sse" })

await app.listen({ port: env.PORT, host: "0.0.0.0" })
console.log(`ZKGov backend running on http://localhost:${env.PORT}`)
