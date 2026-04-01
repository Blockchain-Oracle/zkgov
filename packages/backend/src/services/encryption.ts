import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"
import { env } from "../config/env.js"

const ALGORITHM = "aes-256-gcm"

function getKey(): Buffer {
  return Buffer.from(env.IDENTITY_ENCRYPTION_KEY, "hex")
}

export function encrypt(plaintext: string): { ciphertext: Buffer; iv: Buffer } {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  // Append auth tag to ciphertext
  return { ciphertext: Buffer.concat([encrypted, tag]), iv }
}

export function decrypt(ciphertext: Buffer, iv: Buffer): string {
  const key = getKey()
  const tag = ciphertext.subarray(ciphertext.length - 16)
  const encrypted = ciphertext.subarray(0, ciphertext.length - 16)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(encrypted).toString("utf8") + decipher.final("utf8")
}
