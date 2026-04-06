'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { wagmiAdapter } from '@/lib/appkit'
import { AuthProvider } from '@/hooks/useAuth'

export function AppProviders({ children }: { children: React.ReactNode }) {
  // Create QueryClient inside component to prevent SSR data leaks between requests
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
