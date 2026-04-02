import { describe, it, expect, beforeAll, afterAll } from "vitest"
import Fastify from "fastify"
import cors from "@fastify/cors"
import { authPlugin } from "../src/plugins/auth.js"
import { authRoutes } from "../src/routes/auth.js"
import { proposalRoutes } from "../src/routes/proposals.js"
import { commentRoutes } from "../src/routes/comments.js"

// Set env before importing
process.env.IDENTITY_ENCRYPTION_KEY = "c".repeat(64)
process.env.JWT_SECRET = "test-secret"
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://apple@localhost:5433/zkgov"

let app: ReturnType<typeof Fastify>

beforeAll(async () => {
  app = Fastify({ logger: false })
  await app.register(cors)
  await app.register(authPlugin)
  await app.register(authRoutes, { prefix: "/api/auth" })
  await app.register(proposalRoutes, { prefix: "/api" })
  await app.register(commentRoutes, { prefix: "/api" })
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

describe("API Routes", () => {
  describe("GET /api/proposals", () => {
    it("returns empty array when no proposals", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/proposals",
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.proposals).toBeInstanceOf(Array)
      expect(body.pagination).toBeDefined()
      expect(body.pagination.page).toBe(1)
    })

    it("filters by status", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/proposals?status=active",
      })

      expect(res.statusCode).toBe(200)
    })
  })

  describe("POST /api/auth/register", () => {
    it("rejects missing fields", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {},
      })

      expect(res.statusCode).toBe(400)
    })

    it("rejects invalid wallet address", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          walletAddress: "0xinvalid",
          signature: "0x0000",
          nonce: "test",
        },
      })

      expect(res.statusCode).toBe(400) // Invalid wallet address
    })
  })

  describe("POST /api/proposals", () => {
    it("rejects unauthenticated request", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/proposals",
        payload: {
          title: "Test Proposal",
          description: "A test",
          votingPeriod: 86400,
          quorum: 5,
          voterGroup: "both",
        },
      })

      expect(res.statusCode).toBe(401)
    })
  })

  describe("GET /api/proposals/:id", () => {
    it("returns 404 for non-existent proposal", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/proposals/99999",
      })

      expect(res.statusCode).toBe(404)
    })
  })

  describe("GET /api/proposals/:id/comments", () => {
    it("returns empty array for proposal with no comments", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/proposals/1/comments",
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.comments).toBeInstanceOf(Array)
    })
  })
})
