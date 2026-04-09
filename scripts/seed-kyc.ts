/**
 * Approve wallet addresses as KYC'd on the MockKycSBT contract.
 * Usage: npx tsx scripts/seed-kyc.ts [address1] [address2] ...
 * If no addresses provided, approves the deployer address.
 */
import { config } from "dotenv"
config({ path: "packages/backend/.env" })
import { createPublicClient, createWalletClient, http, defineChain } from "viem"
import { privateKeyToAccount } from "viem/accounts"

const chain = defineChain({
  id: 133, name: "HashKey Chain Testnet",
  nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
  rpcUrls: { default: { http: [process.env.HASHKEY_RPC_URL || "https://testnet.hsk.xyz"] } },
})

const KYC_ABI = [
  { name: "setHuman", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "user", type: "address" }, { name: "status", type: "bool" }, { name: "level", type: "uint8" }], outputs: [] },
  { name: "isHuman", type: "function", stateMutability: "view",
    inputs: [{ name: "account", type: "address" }], outputs: [{ type: "bool" }, { type: "uint8" }] },
] as const

async function main() {
  const pk = process.env.RELAYER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY
  if (!pk) { console.error("Set RELAYER_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY"); process.exit(1) }
  const kycAddr = process.env.KYC_SBT_ADDRESS
  if (!kycAddr) { console.error("Set KYC_SBT_ADDRESS"); process.exit(1) }

  const account = privateKeyToAccount(pk as `0x${string}`)
  const wallet = createWalletClient({ account, chain, transport: http() })
  const pub = createPublicClient({ chain, transport: http() })

  const addresses = process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : [account.address]

  for (const addr of addresses) {
    console.log(`Approving KYC for ${addr}...`)
    const hash = await wallet.writeContract({
      address: kycAddr as `0x${string}`, abi: KYC_ABI,
      functionName: "setHuman", args: [addr as `0x${string}`, true, 1],
    })
    await pub.waitForTransactionReceipt({ hash })

    const [isKyc, level] = await pub.readContract({
      address: kycAddr as `0x${string}`, abi: KYC_ABI,
      functionName: "isHuman", args: [addr as `0x${string}`],
    })
    console.log(`  ${addr}: KYC=${isKyc}, Level=${level}, TX=${hash}`)
  }
  console.log("\nDone!")
}

main().catch(console.error)
