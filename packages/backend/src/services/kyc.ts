import { publicClient } from "../plugins/chain.js"
import { env } from "../config/env.js"

// Minimal ABI for isHuman function
const KYC_SBT_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "isHuman",
    outputs: [
      { name: "", type: "bool" },
      { name: "", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const

export async function checkKycStatus(walletAddress: `0x${string}`): Promise<{
  isVerified: boolean
  level: number
}> {
  if (!env.KYC_SBT_ADDRESS) {
    return { isVerified: false, level: 0 }
  }

  const result = await publicClient.readContract({
    address: env.KYC_SBT_ADDRESS,
    abi: KYC_SBT_ABI,
    functionName: "isHuman",
    args: [walletAddress],
  })

  return {
    isVerified: result[0],
    level: result[1],
  }
}
