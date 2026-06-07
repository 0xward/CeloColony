'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider }                     from 'wagmi'
import { wagmiConfig }                       from '@/lib/celo/wagmi'
import { useState, type ReactNode }          from 'react'
import Toast                                 from '@/components/ui/Toast'

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toast />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
