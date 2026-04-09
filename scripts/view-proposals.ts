import { config } from "dotenv"
config({ path: "packages/backend/.env" })

/**
 * View all proposals from the ZKVoting contract.
 */
import { createPublicClient, http, defineChain } from "viem"

const chain = defineChain({
  id: 133, name: "HashKey Chain Testnet",
  nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
  rpcUrls: { default: { http: [process.env.HASHKEY_RPC_URL || "https://testnet.hsk.xyz"] } },
})

const ZK_VOTING_ABI = [
  { name: "proposalCount", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "getProposalContent", type: "function", stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [{ name: "title", type: "string" }, { name: "description", type: "string" }, { name: "creator", type: "address" }] },
  { name: "getProposalState", type: "function", stateMutability: "view",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [
      { type: "uint256" }, { type: "uint256" }, { type: "uint256" },
      { type: "uint256" }, { type: "uint256" }, { type: "uint256" },
      { type: "uint256" }, { type: "bool" }, { type: "bool" }, { type: "bool" },
    ] },
  { name: "getStats", type: "function", stateMutability: "view", inputs: [],
    outputs: [{ type: "uint256" }, { type: "uint256" }, { type: "uint256" }] },
] as const

async function main() {
  const addr = process.env.ZK_VOTING_ADDRESS
  if (!addr) { console.error("Set ZK_VOTING_ADDRESS"); process.exit(1) }

  const pub = createPublicClient({ chain, transport: http() })

  const [totalProposals, totalMembers] = await pub.readContract({
    address: addr as `0x${string}`, abi: ZK_VOTING_ABI, functionName: "getStats",
  }) as [bigint, bigint, bigint]

  console.log("═══════════════════════════════════════════")
  console.log(`  ${totalProposals} Proposals | ${totalMembers} Members`)
  console.log("═══════════════════════════════════════════")

  for (let i = Number(totalProposals); i >= 1; i--) {
    const [title] = await pub.readContract({
      address: addr as `0x${string}`, abi: ZK_VOTING_ABI,
      functionName: "getProposalContent", args: [BigInt(i)],
    }) as [string, string, string]

    const state = await pub.readContract({
      address: addr as `0x${string}`, abi: ZK_VOTING_ABI,
      functionName: "getProposalState", args: [BigInt(i)],
    }) as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean, boolean, boolean]

    const [, , quorum, votesFor, votesAgainst, votesAbstain, totalVotes, finalized, passed, isActive] = state
    const status = finalized ? (passed ? "PASSED" : "DEFEATED") : isActive ? "ACTIVE" : "ENDED"

    console.log(`\n  #${String(i).padStart(3, "0")}  [${status.padEnd(8)}]  ${title}`)
    console.log(`        Votes: ${votesFor}F / ${votesAgainst}A / ${votesAbstain}Ab  |  Quorum: ${totalVotes}/${quorum}`)
  }

  console.log("\n═══════════════════════════════════════════")
}

main().catch(console.error)
