/**
 * Semaphore ZK Proof Service
 *
 * This is the core ZK layer. It handles:
 *   1. Creating Semaphore identities (private key + public commitment)
 *   2. Encrypting private keys at rest (AES-256-GCM)
 *   3. Generating Groth16 zero-knowledge proofs for anonymous voting
 *
 * The proof generation flow:
 *   - Decrypt user's Semaphore private key from database
 *   - Reconstruct the Semaphore group from on-chain events
 *   - Generate a ZK proof proving: "I am a member of this group AND I vote X"
 *     without revealing WHICH member I am
 *   - The proof includes a nullifier (hash of identity + proposalId)
 *     that prevents double-voting without revealing identity
 *
 * Why server-side? Users voting from Telegram/Discord can't run snarkjs
 * in a chat app. The backend holds their encrypted key and generates
 * proofs on their behalf. For web users, this could also be done
 * client-side in the browser via WASM.
 */
import { Identity, Group, generateProof } from "@semaphore-protocol/core"
import { SemaphoreEthers } from "@semaphore-protocol/data"
import { env } from "../config/env.js"
import { encrypt, decrypt } from "./encryption.js"
import type { VoteChoice } from "@zkgov/shared"

let semaphoreData: SemaphoreEthers | null = null

function getSemaphoreData(): SemaphoreEthers {
  if (!semaphoreData) {
    semaphoreData = new SemaphoreEthers(env.HASHKEY_RPC_URL, {
      address: env.SEMAPHORE_ADDRESS,
      startBlock: env.DEPLOYMENT_BLOCK,
    })
  }
  return semaphoreData
}

export function createIdentity(): {
  commitment: string
  encryptedKey: { ciphertext: Buffer; iv: Buffer }
} {
  const identity = new Identity()
  const privateKeyStr = typeof identity.privateKey === "string"
    ? identity.privateKey
    : Buffer.from(identity.privateKey as Uint8Array).toString("hex")
  const { ciphertext, iv } = encrypt(privateKeyStr)
  return {
    commitment: identity.commitment.toString(),
    encryptedKey: { ciphertext, iv },
  }
}

export function restoreIdentity(encryptedIdentity: Buffer, encryptionIv: Buffer): Identity {
  const privateKeyHex = decrypt(encryptedIdentity, encryptionIv)
  // Convert hex string back to Uint8Array (how it was stored)
  const privateKeyBytes = new Uint8Array(Buffer.from(privateKeyHex, "hex"))
  return new Identity(privateKeyBytes)
}

export async function generateVoteProof(
  encryptedIdentity: Buffer,
  encryptionIv: Buffer,
  groupId: string,
  choice: VoteChoice,
  proposalId: number
) {
  const identity = restoreIdentity(encryptedIdentity, encryptionIv)

  // Get group members from chain
  const data = getSemaphoreData()
  const members = await data.getGroupMembers(groupId)
  const group = new Group(members.map(BigInt))

  // Generate proof
  const proof = await generateProof(
    identity,
    group,
    choice,
    proposalId
  )

  return proof
}
