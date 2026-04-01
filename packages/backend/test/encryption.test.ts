import { describe, it, expect } from "vitest"

// Set encryption key before importing the module
process.env.IDENTITY_ENCRYPTION_KEY = "a".repeat(64)

const { encrypt, decrypt } = await import("../src/services/encryption.js")

describe("Encryption Service", () => {
  it("encrypts and decrypts a string correctly", () => {
    const original = "my-secret-private-key-12345"
    const { ciphertext, iv } = encrypt(original)
    const decrypted = decrypt(ciphertext, iv)
    expect(decrypted).toBe(original)
  })

  it("produces different ciphertexts for the same plaintext (random IV)", () => {
    const original = "same-input"
    const result1 = encrypt(original)
    const result2 = encrypt(original)
    expect(result1.ciphertext).not.toEqual(result2.ciphertext)
    expect(result1.iv).not.toEqual(result2.iv)
  })

  it("fails to decrypt with wrong IV", () => {
    const { ciphertext } = encrypt("test")
    const wrongIv = Buffer.alloc(12, 0)
    expect(() => decrypt(ciphertext, wrongIv)).toThrow()
  })

  it("handles empty string", () => {
    const { ciphertext, iv } = encrypt("")
    const decrypted = decrypt(ciphertext, iv)
    expect(decrypted).toBe("")
  })

  it("handles long strings", () => {
    const longStr = "x".repeat(10000)
    const { ciphertext, iv } = encrypt(longStr)
    const decrypted = decrypt(ciphertext, iv)
    expect(decrypted).toBe(longStr)
  })
})
