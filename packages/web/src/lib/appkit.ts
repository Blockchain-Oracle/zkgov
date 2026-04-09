import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { defineChain } from 'viem'
import { http } from 'wagmi'

// 1. Get projectId at https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || ''

// 2. Define HashKey Chain Testnet
export const hashkeyTestnet = defineChain({
  id: 133,
  name: 'HashKey Chain Testnet',
  nativeCurrency: { name: 'HSK', symbol: 'HSK', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet.hsk.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://testnet-explorer.hsk.xyz' },
  },
})

// 3. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [hashkeyTestnet] as any,
  transports: {
    [hashkeyTestnet.id]: http(),
  },
})

// 4. Create AppKit
createAppKit({
  adapters: [wagmiAdapter],
  networks: [hashkeyTestnet] as any,
  projectId,
  features: {
    analytics: true,
    email: false,
    socials: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#818cf8',
    '--w3m-border-radius-master': '1px',
    '--w3m-font-family': 'var(--font-geist-mono)',
  }
})
