import { createPublicClient, createWalletClient, http, defineChain } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { env } from "../config/env.js"

export const hashkeyTestnet = defineChain({
  id: 133,
  name: "HashKey Chain Testnet",
  nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
  rpcUrls: { default: { http: [env.HASHKEY_RPC_URL] } },
  blockExplorers: {
    default: { name: "Explorer", url: "https://testnet-explorer.hsk.xyz" },
  },
})

export const publicClient = createPublicClient({
  chain: hashkeyTestnet,
  transport: http(),
})

// Relayer wallet — only initialized if private key is set
let _walletClient: ReturnType<typeof createWalletClient> | null = null

export function getWalletClient() {
  if (!_walletClient) {
    if (!env.RELAYER_PRIVATE_KEY || env.RELAYER_PRIVATE_KEY === "0x") {
      throw new Error("RELAYER_PRIVATE_KEY not configured")
    }
    const account = privateKeyToAccount(env.RELAYER_PRIVATE_KEY)
    _walletClient = createWalletClient({
      account,
      chain: hashkeyTestnet,
      transport: http(),
    })
  }
  return _walletClient
}
