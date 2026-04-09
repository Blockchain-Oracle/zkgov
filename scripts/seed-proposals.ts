import { config } from "dotenv"
config({ path: "packages/backend/.env" })

/**
 * Seed proposals by calling ZKVoting.createProposal() directly on-chain.
 */
import { createPublicClient, createWalletClient, http, defineChain } from "viem"
import { privateKeyToAccount } from "viem/accounts"

const chain = defineChain({
  id: 133, name: "HashKey Chain Testnet",
  nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
  rpcUrls: { default: { http: [process.env.HASHKEY_RPC_URL || "https://testnet.hsk.xyz"] } },
})

const ZK_VOTING_ABI = [
  { name: "createProposal", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "title", type: "string" }, { name: "description", type: "string" },
      { name: "votingPeriod", type: "uint256" }, { name: "quorum", type: "uint256" }],
    outputs: [{ type: "uint256" }] },
  { name: "proposalCount", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const

const PROPOSALS = [
  { title: "Allocate 10% of treasury to developer grants", description: "## Summary\n\nAllocate 10% of the HashKey Chain ecosystem treasury toward a developer grants program.\n\n## Motivation\n\nDeveloper adoption is the primary growth lever for any L2.\n\n## Specification\n\n- 6-month program\n- Grants committee of 5 elected members\n- Individual grants capped at $50K", votingPeriod: 172800, quorum: 3 },
  { title: "Increase validator rewards by 15%", description: "## Summary\n\nAdjust validator rewards upward by 15% to improve network security.\n\n## Impact\n\n- Estimated additional cost: ~$200K/quarter\n- Expected new validators: 8-12", votingPeriod: 259200, quorum: 2 },
  { title: "Establish a governance committee", description: "## Summary\n\nCreate a formal committee to oversee governance participation.\n\n## Structure\n\n- 5 members, quarterly mandate\n- Authority to manage proposal standards", votingPeriod: 604800, quorum: 5 },
]

async function main() {
  const pk = process.env.RELAYER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY
  if (!pk) { console.error("Set RELAYER_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY"); process.exit(1) }
  const zkVotingAddr = process.env.ZK_VOTING_ADDRESS
  if (!zkVotingAddr) { console.error("Set ZK_VOTING_ADDRESS"); process.exit(1) }

  const account = privateKeyToAccount(pk as `0x${string}`)
  const wallet = createWalletClient({ account, chain, transport: http() })
  const pub = createPublicClient({ chain, transport: http() })

  for (const p of PROPOSALS) {
    console.log(`Creating: "${p.title}"...`)
    const hash = await wallet.writeContract({
      address: zkVotingAddr as `0x${string}`,
      abi: ZK_VOTING_ABI,
      functionName: "createProposal",
      args: [p.title, p.description, BigInt(p.votingPeriod), BigInt(p.quorum)],
    })
    await pub.waitForTransactionReceipt({ hash })
    console.log(`  ✓ TX: ${hash}`)
  }

  const count = await pub.readContract({
    address: zkVotingAddr as `0x${string}`,
    abi: ZK_VOTING_ABI,
    functionName: "proposalCount",
  })
  console.log(`\nDone! ${count} proposals on-chain.`)
}

main().catch(console.error)
