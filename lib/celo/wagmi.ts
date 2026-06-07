'use client'
import { createConfig, http } from 'wagmi'
import { injected }           from 'wagmi/connectors'
import { celoMainnet }        from './config'

export const wagmiConfig = createConfig({
  chains:      [celoMainnet],
  connectors:  [injected()],
  transports:  { [celoMainnet.id]: http('https://forno.celo.org') },
  ssr: true,
})

// ─── MiniPay detection ────────────────────────────────────────────────────────
export function isMiniPay(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean((window as unknown as Record<string, unknown>).ethereum &&
    (window as unknown as { ethereum?: { isMiniPay?: boolean } }).ethereum?.isMiniPay)
}
