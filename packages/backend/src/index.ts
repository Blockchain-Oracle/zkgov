import Fastify from "fastify"
import cors from "@fastify/cors"
import { env } from "./config/env.js"

const app = Fastify({ logger: true })

await app.register(cors, { origin: true })

app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }))

await app.listen({ port: env.PORT, host: "0.0.0.0" })
console.log(`ZKGov backend running on http://localhost:${env.PORT}`)
