import type { FastifyInstance } from "fastify"
import { createHmac } from "node:crypto"
import { db } from "../db/index.js"
import { users, agents } from "../db/schema.js"
import { eq } from "drizzle-orm"
import { verifyMessage } from "viem"
import { createIdentity } from "../services/semaphore.js"
import { env } from "../config/env.js"

export async function authRoutes(app: FastifyInstance) {
  // POST /register — register with wallet signature
  app.post<{
    Body: { walletAddress: string; signature: string; nonce: string }
  }>("/register", async (request, reply) => {
    const { walletAddress, signature, nonce } = request.body

    if (!walletAddress || !signature || !nonce) {
      return reply.status(400).send({ error: "walletAddress, signature, and nonce are required" })
    }

    const address = walletAddress.toLowerCase() as `0x${string}`

    // Verify signature
    const message = `Sign in to ZKGov: ${nonce}`
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    })

    if (!isValid) {
      return reply.status(401).send({ error: "Invalid signature" })
    }

    // Check if user exists
    let user = await db.query.users.findFirst({
      where: eq(users.walletAddress, address),
    })

    if (user) {
      // Existing user — return JWT
      const token = app.jwt.sign({ userId: user.id }, { expiresIn: "24h" })
      return reply.send({
        token,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          kycVerified: user.kycVerified,
          telegramLinked: !!user.telegramId,
          discordLinked: !!user.discordId,
          identityCommitment: user.identityCommitment,
        },
      })
    }

    // New user — create Semaphore identity
    const identity = createIdentity()

    const [newUser] = await db
      .insert(users)
      .values({
        walletAddress: address,
        encryptedIdentity: identity.encryptedKey.ciphertext,
        identityCommitment: identity.commitment,
        encryptionIv: identity.encryptedKey.iv,
      })
      .returning()

    const token = app.jwt.sign({ userId: newUser.id }, { expiresIn: "24h" })

    return reply.status(201).send({
      token,
      user: {
        id: newUser.id,
        walletAddress: newUser.walletAddress,
        kycVerified: false,
        telegramLinked: false,
        discordLinked: false,
        identityCommitment: newUser.identityCommitment,
      },
    })
  })

  // GET /me — current user profile
  app.get("/me", { preHandler: [(app as any).authenticate] }, async (request) => {
    const user = (request as any).user
    const userAgents = await db.query.agents.findMany({
      where: eq(agents.ownerId, user.id),
    })

    return {
      id: user.id,
      walletAddress: user.walletAddress,
      kycVerified: user.kycVerified,
      kycLevel: user.kycLevel,
      telegramLinked: !!user.telegramId,
      discordLinked: !!user.discordId,
      agents: userAgents.map((a: any) => ({
        id: a.id,
        name: a.name,
        isActive: a.isActive,
      })),
      createdAt: user.createdAt,
    }
  })

  // POST /verify-kyc — check KYC on-chain
  app.post("/verify-kyc", { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const user = (request as any).user
    const { checkKycStatus } = await import("../services/kyc.js")
    const { isVerified, level } = await checkKycStatus(user.walletAddress as `0x${string}`)

    if (!isVerified) {
      return reply.status(400).send({ error: "No KYC SBT found for this wallet." })
    }

    const levelNames = ["NONE", "BASIC", "ADVANCED", "PREMIUM", "ULTIMATE"]

    await db
      .update(users)
      .set({ kycVerified: true, kycLevel: levelNames[level] || "BASIC" })
      .where(eq(users.id, user.id))

    // Return the data needed for the frontend to register on-chain
    // The user's wallet must call kycGate.registerHuman(commitment) directly
    // because the contract checks msg.sender for KYC ownership
    return {
      kycVerified: true,
      kycLevel: levelNames[level] || "BASIC",
      identityCommitment: user.identityCommitment,
      registration: {
        contractAddress: (await import("../config/env.js")).env.KYC_GATE_ADDRESS,
        functionName: "registerHuman",
        args: [user.identityCommitment],
        message: "Call kycGate.registerHuman() from your wallet to join the voter group.",
      },
    }
  })

  // POST /link/telegram — validate initData and link
  app.post<{
    Body: { initData: string }
  }>("/link/telegram", { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const { initData } = request.body
    const user = (request as any).user

    if (!initData) {
      return reply.status(400).send({ error: "initData is required" })
    }

    // Parse and validate Telegram initData
    const parsed = parseInitData(initData)
    if (!parsed || !validateInitData(initData)) {
      return reply.status(401).send({ error: "Invalid Telegram initData" })
    }

    const telegramId = BigInt(parsed.userId)

    await db
      .update(users)
      .set({ telegramId })
      .where(eq(users.id, user.id))

    return {
      linked: true,
      telegramId: parsed.userId,
      telegramUsername: parsed.username,
    }
  })
}

// Telegram initData helpers
function parseInitData(initData: string): { userId: string; username: string } | null {
  try {
    const params = new URLSearchParams(initData)
    const userStr = params.get("user")
    if (!userStr) return null
    const user = JSON.parse(userStr)
    return { userId: String(user.id), username: user.username || "" }
  } catch {
    return null
  }
}

function validateInitData(initData: string): boolean {
  const { TELEGRAM_BOT_TOKEN } = env
  if (!TELEGRAM_BOT_TOKEN) return true // Skip validation in dev

  const params = new URLSearchParams(initData)
  const hash = params.get("hash")
  if (!hash) return false

  params.delete("hash")
  const sorted = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n")

  const secretKey = createHmac("sha256", "WebAppData").update(TELEGRAM_BOT_TOKEN).digest()
  const computed = createHmac("sha256", secretKey).update(sorted).digest("hex")

  return computed === hash
}
