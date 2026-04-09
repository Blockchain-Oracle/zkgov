import type { FastifyInstance } from "fastify"
import { createHmac } from "node:crypto"
import { db } from "../db/index.js"
import { users, agents } from "../db/schema.js"
import { eq } from "drizzle-orm"
import { verifyMessage, getAddress } from "viem"
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

    // Use checksummed address for signature verification (viem recovers checksummed)
    let address: `0x${string}`
    try {
      address = getAddress(walletAddress) as `0x${string}`
    } catch {
      return reply.status(400).send({ error: "Invalid wallet address" })
    }

    // Verify signature
    const message = `Sign in to ZKGov: ${nonce}`
    const isValid = await verifyMessage({
      address,
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
      identityCommitment: user.identityCommitment,
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

  // POST /verify-kyc — approve user on-chain via MockKycSBT, then verify
  // The relayer wallet (which owns the contract) calls setHuman() to approve the user,
  // then reads isHuman() to confirm. This is how KYC works in the demo:
  // we own the KYC contract and can approve anyone who requests it.
  // In production, a real KYC provider would issue the SBT.
  app.post("/verify-kyc", { preHandler: [(app as any).authenticate] }, async (request, reply) => {
    const user = (request as any).user

    if (user.kycVerified) {
      return { kycVerified: true, kycLevel: user.kycLevel, message: "Already verified." }
    }

    const { publicClient, getWalletClient, hashkeyTestnet } = await import("../plugins/chain.js")

    const KYC_ABI = [
      { name: "setHuman", type: "function", stateMutability: "nonpayable",
        inputs: [{ name: "user", type: "address" }, { name: "status", type: "bool" }, { name: "level", type: "uint8" }], outputs: [] },
      { name: "isHuman", type: "function", stateMutability: "view",
        inputs: [{ name: "account", type: "address" }], outputs: [{ type: "bool" }, { type: "uint8" }] },
    ] as const

    try {
      const wallet = getWalletClient()
      const kycAddr = (await import("../config/env.js")).env.KYC_SBT_ADDRESS

      // Step 1: Approve user on-chain (relayer calls setHuman as contract owner)
      const hash = await wallet.writeContract({
        address: kycAddr,
        abi: KYC_ABI,
        functionName: "setHuman",
        args: [user.walletAddress as `0x${string}`, true, 1],
        chain: hashkeyTestnet,
        account: wallet.account!,
      } as any)

      await publicClient.waitForTransactionReceipt({ hash })

      // Step 2: Verify it worked
      const [isKyc, level] = await publicClient.readContract({
        address: kycAddr,
        abi: KYC_ABI,
        functionName: "isHuman",
        args: [user.walletAddress as `0x${string}`],
      })

      if (!isKyc) {
        return reply.status(500).send({ error: "On-chain KYC approval failed." })
      }

      const levelNames = ["NONE", "BASIC", "ADVANCED", "PREMIUM", "ULTIMATE"]
      const kycLevel = levelNames[level] || "BASIC"

      // Step 3: Update database
      await db
        .update(users)
        .set({ kycVerified: true, kycLevel })
        .where(eq(users.id, user.id))

      return {
        kycVerified: true,
        kycLevel,
        txHash: hash,
        message: `KYC approved on-chain. TX: ${hash}`,
        identityCommitment: user.identityCommitment,
      }
    } catch (err: any) {
      return reply.status(500).send({
        error: `KYC verification failed: ${err.message || "Unknown error"}`,
      })
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
  // POST /telegram/login — unauthenticated Telegram login via initData
  // This is what the Mini App calls to get a JWT without needing wallet connection first
  app.post<{
    Body: { initData: string }
  }>("/telegram/login", async (request, reply) => {
    const { initData } = request.body

    if (!initData) {
      return reply.status(400).send({ error: "initData is required" })
    }

    const parsed = parseInitData(initData)
    if (!parsed || !validateInitData(initData)) {
      return reply.status(401).send({ error: "Invalid Telegram initData" })
    }

    const telegramId = BigInt(parsed.userId)

    // Check if this Telegram user is already linked to an account
    const existingUser = await db.query.users.findFirst({
      where: eq(users.telegramId, telegramId),
    })

    if (existingUser) {
      // User exists — return JWT
      const token = app.jwt.sign({ userId: existingUser.id }, { expiresIn: "24h" })
      return {
        linked: true,
        token,
        user: {
          id: existingUser.id,
          walletAddress: existingUser.walletAddress,
          kycVerified: existingUser.kycVerified,
          identityCommitment: existingUser.identityCommitment,
        },
      }
    }

    // User not linked — return Telegram info so Mini App shows registration
    return {
      linked: false,
      telegramUser: { id: parsed.userId, username: parsed.username },
      message: "Connect your wallet to start voting.",
    }
  })

  // POST /discord/lookup — find user by discord_id and return JWT
  // Used by the Discord bot to authenticate users for voting
  app.post<{
    Body: { discordId: string }
  }>("/discord/lookup", async (request, reply) => {
    const { discordId } = request.body

    if (!discordId) {
      return reply.status(400).send({ error: "discordId is required" })
    }

    const user = await db.query.users.findFirst({
      where: eq(users.discordId, discordId),
    })

    if (!user) {
      return reply.status(404).send({ error: "Discord account not linked" })
    }

    const token = app.jwt.sign({ userId: user.id }, { expiresIn: "1h" })

    return {
      token,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        kycVerified: user.kycVerified,
      },
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
