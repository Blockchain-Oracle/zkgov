import { createPublicClient, http, defineChain } from "viem"
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
