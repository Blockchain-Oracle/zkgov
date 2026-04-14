import type { FastifyInstance } from "fastify"
import { createHmac } from "node:crypto"
import { db } from "../db/index.js"
import { users } from "../db/schema.js"
import { eq } from "drizzle-orm"
import { verifyMessage, getAddress } from "viem"
import { env } from "../config/env.js"

export async function authRoutes(app: FastifyInstance) {
  // POST /register — register with wallet signature (no Semaphore identity creation)
  app.post<{
    Body: { walletAddress: string; signature: string; nonce: string }
  }>("/register", async (request, reply) => {
    const { walletAddress, signature, nonce } = request.body

    if (!walletAddress || !signature || !nonce) {
      return reply.status(400).send({ error: "walletAddress, signature, and nonce are required" })
    }

    let address: `0x${string}`
    try {
      address = getAddress(walletAddress) as `0x${string}`
    } catch {
      return reply.status(400).send({ error: "Invalid wallet address" })
    }

    const message = `Sign in to ZKGov: ${nonce}`
    const isValid = await verifyMessage({ address, message, signature: signature as `0x${string}` })

    if (!isValid) {
      return reply.status(401).send({ error: "Invalid signature" })
    }

    // Check if user exists
    let user = await db.query.users.findFirst({ where: eq(users.walletAddress, address) })

    if (user) {
      const token = app.jwt.sign({ userId: user.id }, { expiresIn: "24h" })
      return reply.send({ token, user: { id: user.id, walletAddress: user.walletAddress } })
    }

    // New user
    const [newUser] = await db.insert(users).values({ walletAddress: address }).returning()
    const token = app.jwt.sign({ userId: newUser.id }, { expiresIn: "24h" })

    return reply.status(201).send({
      token,
      user: { id: newUser.id, walletAddress: newUser.walletAddress },
    })
  })

  // GET /me — user profile
  app.get("/me", { preHandler: [(app as any).authenticate] }, async (request) => {
    const user = (request as any).user
    return {
      id: user.id,
      walletAddress: user.walletAddress,
      telegramLinked: !!user.telegramId,
      createdAt: user.createdAt,
    }
  })

  // POST /link/telegram
  app.post<{ Body: { initData: string } }>(
    "/link/telegram",
    { preHandler: [(app as any).authenticate] },
    async (request, reply) => {
      const { initData } = request.body
      const user = (request as any).user
      if (!initData) return reply.status(400).send({ error: "initData is required" })

      const parsed = parseInitData(initData)
      if (!parsed || !validateInitData(initData)) {
        return reply.status(401).send({ error: "Invalid Telegram initData" })
      }

      await db.update(users).set({ telegramId: BigInt(parsed.userId) }).where(eq(users.id, user.id))
      return { linked: true, telegramId: parsed.userId }
    }
  )

  // POST /telegram/login — unauthenticated Telegram login
  app.post<{ Body: { initData: string } }>("/telegram/login", async (request, reply) => {
    const { initData } = request.body
    if (!initData) return reply.status(400).send({ error: "initData is required" })

    const parsed = parseInitData(initData)
    if (!parsed || !validateInitData(initData)) {
      return reply.status(401).send({ error: "Invalid Telegram initData" })
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.telegramId, BigInt(parsed.userId)),
    })

    if (existingUser) {
      const token = app.jwt.sign({ userId: existingUser.id }, { expiresIn: "24h" })
      return { linked: true, token, user: { id: existingUser.id, walletAddress: existingUser.walletAddress } }
    }

    return { linked: false, telegramUser: { id: parsed.userId, username: parsed.username } }
  })

}

function parseInitData(initData: string) {
  try {
    const params = new URLSearchParams(initData)
    const userStr = params.get("user")
    if (!userStr) return null
    const user = JSON.parse(userStr)
    return { userId: String(user.id), username: user.username || "" }
  } catch { return null }
}

function validateInitData(initData: string): boolean {
  const { TELEGRAM_BOT_TOKEN } = env
  if (!TELEGRAM_BOT_TOKEN) return false // reject if token not configured

  const params = new URLSearchParams(initData)
  const hash = params.get("hash")
  if (!hash) return false

  params.delete("hash")
  const sorted = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("\n")
  const secretKey = createHmac("sha256", "WebAppData").update(TELEGRAM_BOT_TOKEN).digest()
  const computed = createHmac("sha256", secretKey).update(sorted).digest("hex")

  return computed === hash
}
