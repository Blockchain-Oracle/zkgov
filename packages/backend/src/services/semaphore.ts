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
