import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { defineChain } from 'viem'
import { http } from 'wagmi'

// 1. Get projectId at https://cloud.reown.com
export const projectId = '854696010041d5b1297e641772658428' // Demo projectId

// 2. Define HashKey Chain Testnet
export const hashkeyTestnet = defineChain({
  id: 133,
  name: 'HashKey Chain Testnet',
  nativeCurrency: { name: 'HSK', symbol: 'HSK', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://hashkeychain-testnet.alt.technology'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://hashkeychain-testnet-explorer.alt.technology' },
  },
})

// 3. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [hashkeyTestnet],
  transports: {
    [hashkeyTestnet.id]: http(),
  },
})

// 4. Create AppKit
createAppKit({
  adapters: [wagmiAdapter],
  networks: [hashkeyTestnet],
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
