import { publicClient, getWalletClient, hashkeyTestnet } from "../plugins/chain.js"
import { env } from "../config/env.js"
import { db } from "../db/index.js"
import { relayerTransactions } from "../db/schema.js"
import { eq } from "drizzle-orm"

// Minimal ABIs
const ZK_GOVERNANCE_ABI = [
  {
    inputs: [
      { name: "proposalId", type: "uint256" },
      { name: "merkleTreeDepth", type: "uint256" },
      { name: "merkleTreeRoot", type: "uint256" },
      { name: "nullifier", type: "uint256" },
      { name: "message", type: "uint256" },
      { name: "points", type: "uint256[8]" },
    ],
    name: "castVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "contentHash", type: "bytes32" },
      { name: "metadataURI", type: "string" },
      { name: "votingPeriod", type: "uint256" },
      { name: "quorum", type: "uint256" },
      { name: "voterGroup", type: "uint8" },
    ],
    name: "createProposal",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const

// Always fetch fresh nonce from chain to avoid stale nonce errors after restart or failed tx
async function getNonce(): Promise<number> {
  const wallet = getWalletClient()
  return await publicClient.getTransactionCount({
    address: wallet.account!.address,
  })
}

export async function submitVote(
  proposalId: number,
  proof: {
    merkleTreeDepth: number
    merkleTreeRoot: bigint
    nullifier: bigint
    message: bigint
    points: readonly bigint[]
  }
): Promise<string> {
  const wallet = getWalletClient()
  const nonce = await getNonce()

  const hash = await wallet.writeContract({
    address: env.ZK_GOVERNANCE_ADDRESS,
    abi: ZK_GOVERNANCE_ABI,
    functionName: "castVote" as const,
    args: [
      BigInt(proposalId),
      BigInt(proof.merkleTreeDepth),
      proof.merkleTreeRoot,
      proof.nullifier,
      proof.message,
      proof.points,
    ],
    chain: hashkeyTestnet,
    account: wallet.account!,
    nonce,
  } as any)

  await db.insert(relayerTransactions).values({
    txHash: hash,
    txType: "vote",
    status: "submitted",
    nonce,
  })

  // Confirm in background
  confirmTransaction(hash).catch(console.error)

  return hash
}

export async function submitCreateProposal(
  contentHash: `0x${string}`,
  metadataURI: string,
  votingPeriod: number,
  quorum: number,
  voterGroup: number
): Promise<string> {
  const wallet = getWalletClient()
  const nonce = await getNonce()

  const hash = await wallet.writeContract({
    address: env.ZK_GOVERNANCE_ADDRESS,
    abi: ZK_GOVERNANCE_ABI,
    functionName: "createProposal" as const,
    args: [
      contentHash,
      metadataURI,
      BigInt(votingPeriod),
      BigInt(quorum),
      voterGroup,
    ],
    chain: hashkeyTestnet,
    account: wallet.account!,
    nonce,
  } as any)

  await db.insert(relayerTransactions).values({
    txHash: hash,
    txType: "create_proposal",
    status: "submitted",
    nonce,
  })

  confirmTransaction(hash).catch(console.error)

  return hash
}

async function confirmTransaction(hash: string) {
  try {
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: hash as `0x${string}`,
    })
    await db
      .update(relayerTransactions)
      .set({
        status: receipt.status === "success" ? "confirmed" : "failed",
        gasUsed: receipt.gasUsed,
        confirmedAt: new Date(),
      })
      .where(eq(relayerTransactions.txHash, hash))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    await db
      .update(relayerTransactions)
      .set({ status: "failed", errorMessage: message })
      .where(eq(relayerTransactions.txHash, hash))
  }
}
