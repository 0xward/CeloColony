'use client'
import { useGameStore }                    from '@/store/gameStore'
import { useAccount, useConnect, useDisconnect, usePublicClient } from 'wagmi'
import { injected }                        from 'wagmi/connectors'
import { useEffect, useState }             from 'react'
import { getCeloBalance, getPendingRewards } from '@/lib/celo/contracts'
import { isMiniPay }                       from '@/lib/celo/wagmi'
import Button                              from '@/components/ui/Button'

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return String(Math.floor(n))
}

export default function HUD() {
  const { colony, resources, isSyncing, pendingRewards, setPendingRewards } = useGameStore()
  const { address, isConnected, chainId }  = useAccount()
  const { connect }    = useConnect()
  const { disconnect } = useDisconnect()
  const publicClient   = usePublicClient()
  const [celoBalance, setCeloBalance] = useState('0.0000')
  const [miniPay, setMiniPay] = useState(false)

  useEffect(() => { setMiniPay(isMiniPay()) }, [])

  useEffect(() => {
    if (!isConnected || !address || !publicClient) return
    const fetch = async () => {
      const bal     = await getCeloBalance(publicClient, address as `0x${string}`)
      const rewards = await getPendingRewards(publicClient, address as `0x${string}`)
      setCeloBalance(bal)
      setPendingRewards(rewards)
    }
    fetch()
    const id = setInterval(fetch, 30_000)
    return () => clearInterval(id)
  }, [isConnected, address, publicClient, setPendingRewards])

  const xpPct = Math.round((colony.xp / colony.xpToNext) * 100)

  return (
    <div className="panel px-4 py-3 flex items-center gap-3 flex-wrap" style={{ borderRadius: 0, borderLeft: 0, borderRight: 0, borderTop: 0 }}>
      {/* Colony level */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm"
          style={{ background: 'var(--green)', color: '#000', fontFamily: 'var(--font-title)' }}>
          {colony.level}
        </div>
        <div>
          <div className="text-xs" style={{ color: 'var(--text2)' }}>{colony.name}</div>
          <div className="progress-bar w-20 mt-0.5">
            <div className="progress-fill" style={{ width: `${xpPct}%`, background: 'var(--green)' }} />
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className="flex items-center gap-2 flex-1 flex-wrap">
        <Resource icon="⚡" value={fmt(resources.gold)}       label="Gold"       color="#FBCC5C" />
        <Resource icon="🔋" value={fmt(resources.energy)}     label="Energy"     color="#22D3EE" />
        <Resource icon="🪨" value={fmt(resources.materials)}  label="Materials"  color="#8B5CF6" />
        <Resource icon="👥" value={fmt(resources.population)} label="Population" color="#35D07F" />
        <Resource icon="😊" value={`${Math.round(resources.happiness)}%`} label="Happiness" color="#EC4899" />
      </div>

      {/* Sync dot */}
      {isSyncing && (
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--green)' }} title="Syncing..." />
      )}

      {/* Pending rewards */}
      {parseFloat(pendingRewards) > 0 && (
        <div className="resource-badge text-xs" style={{ borderColor: 'rgba(251,204,92,0.3)', color: '#FBCC5C' }}>
          🏆 {parseFloat(pendingRewards).toFixed(4)} CELO claimable
        </div>
      )}

      {/* Wallet */}
      {isConnected && address ? (
        <div className="flex items-center gap-2">
          <div className="resource-badge text-xs" style={{ borderColor: 'rgba(53,208,127,0.3)', color: 'var(--green)' }}>
            {miniPay ? '📱 MiniPay' : '🦊'} {celoBalance} CELO
          </div>
          <button onClick={() => disconnect()}
            className="text-xs px-2 py-1 rounded border"
            style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#FCA5A5', background: 'rgba(239,68,68,0.06)' }}>
            {address.slice(0, 6)}…{address.slice(-4)}
          </button>
        </div>
      ) : (
        <Button size="sm" onClick={() => connect({ connector: injected() })}>
          Connect Wallet
        </Button>
      )}
    </div>
  )
}

function Resource({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <div className="resource-badge" style={{ borderColor: `${color}22` }}>
      <span>{icon}</span>
      <span style={{ color, fontFamily: 'var(--font-mono)' }}>{value}</span>
    </div>
  )
}
