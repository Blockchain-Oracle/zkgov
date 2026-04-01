import { describe, it, expect } from "vitest"

// Set encryption key before importing
process.env.IDENTITY_ENCRYPTION_KEY = "b".repeat(64)

const { createIdentity, restoreIdentity } = await import("../src/services/semaphore.js")

describe("Semaphore Service", () => {
  it("creates a new identity with encrypted key", () => {
    const result = createIdentity()

    expect(result.commitment).toBeTruthy()
    expect(result.commitment.length).toBeGreaterThan(5)
    expect(result.encryptedKey.ciphertext).toBeInstanceOf(Buffer)
    expect(result.encryptedKey.iv).toBeInstanceOf(Buffer)
    expect(result.encryptedKey.iv.length).toBe(12) // AES-GCM IV is 12 bytes
  })

  it("creates unique identities each time", () => {
    const id1 = createIdentity()
    const id2 = createIdentity()

    expect(id1.commitment).not.toBe(id2.commitment)
  })

  it("restores identity from encrypted key", () => {
    const original = createIdentity()

    const restored = restoreIdentity(
      original.encryptedKey.ciphertext,
      original.encryptedKey.iv
    )

    expect(restored.commitment.toString()).toBe(original.commitment)
  })
})
