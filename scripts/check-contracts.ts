import { config } from "dotenv"
config({ path: "packages/backend/.env" })
/**
 * Verify all contracts are deployed and responsive on HashKey testnet.
 * Usage: npx tsx scripts/check-contracts.ts
 */
import "dotenv/config"
import { createPublicClient, http, defineChain, formatEther } from "viem"

const chain = defineChain({
  id: 133, name: "HashKey Chain Testnet",
  nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
  rpcUrls: { default: { http: [process.env.HASHKEY_RPC_URL || "https://testnet.hsk.xyz"] } },
})

const client = createPublicClient({ chain, transport: http() })

const CONTRACTS: Record<string, string | undefined> = {
  Semaphore: process.env.SEMAPHORE_ADDRESS,
  KycSBT: process.env.KYC_SBT_ADDRESS,
  AgentRegistry: process.env.AGENT_REGISTRY_ADDRESS,
  KycGate: process.env.KYC_GATE_ADDRESS,
  ZKGovernance: process.env.ZK_GOVERNANCE_ADDRESS,
}

async function main() {
  console.log("═══════════════════════════════════════════")
  console.log("  ZKGov Contract Health Check")
  console.log("═══════════════════════════════════════════")
  console.log(`  Chain: ${chain.name} (${chain.id})`)
  console.log(`  RPC: ${chain.rpcUrls.default.http[0]}`)
  console.log()

  // Check chain connectivity
  try {
    const blockNumber = await client.getBlockNumber()
    console.log(`  ✓ Chain connected — block #${blockNumber}`)
  } catch {
    console.log("  ✗ Chain connection FAILED")
    process.exit(1)
  }

  // Check relayer balance
  const relayerKey = process.env.RELAYER_PRIVATE_KEY
  if (relayerKey) {
    const { privateKeyToAccount } = await import("viem/accounts")
    const account = privateKeyToAccount(relayerKey as `0x${string}`)
    const balance = await client.getBalance({ address: account.address })
    console.log(`  ✓ Relayer ${account.address}: ${formatEther(balance)} HSK`)
    if (balance === 0n) console.log("    ⚠ Relayer has no funds — transactions will fail!")
  }
  console.log()

  // Check each contract
  let allGood = true
  for (const [name, addr] of Object.entries(CONTRACTS)) {
    if (!addr) {
      console.log(`  ✗ ${name}: NOT SET in .env`)
      allGood = false
      continue
    }

    try {
      const code = await client.getCode({ address: addr as `0x${string}` })
      if (code && code !== "0x") {
        console.log(`  ✓ ${name}: ${addr}`)
      } else {
        console.log(`  ✗ ${name}: ${addr} — NO CODE (not deployed?)`)
        allGood = false
      }
    } catch (e: any) {
      console.log(`  ✗ ${name}: ${addr} — ERROR: ${e.message}`)
      allGood = false
    }
  }

  // Check Semaphore group IDs
  const humanGroup = process.env.HUMAN_GROUP_ID
  const agentGroup = process.env.AGENT_GROUP_ID
  console.log()
  console.log(`  Human Group ID: ${humanGroup || "NOT SET"}`)
  console.log(`  Agent Group ID: ${agentGroup || "NOT SET"}`)

  console.log()
  console.log(allGood ? "  ✓ All contracts deployed and verified!" : "  ⚠ Some contracts need attention.")
  console.log("═══════════════════════════════════════════")
}

main().catch(console.error)
