'use client'
import { useState }         from 'react'
import { useGameStore }     from '@/store/gameStore'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { BUILDINGS }        from '@/lib/game/constants'
import { canAfford }        from '@/lib/game/engine'
import { purchaseBuildingOnChain } from '@/lib/celo/contracts'
import Button               from '@/components/ui/Button'
import type { BuildingType } from '@/types/game'

const ALL_TYPES = Object.keys(BUILDINGS) as BuildingType[]

interface Props { onClose: () => void }

export default function BuildModal({ onClose }: Props) {
  const { resources, colony, buildings, placeBuildingLocal, addToast } = useGameStore()
  const { address, isConnected } = useAccount()
  const { data: walletClient }   = useWalletClient()
  const publicClient             = usePublicClient()

  const [selected, setSelected] = useState<BuildingType | null>(null)
  const [loading,  setLoading]  = useState(false)

  const available = ALL_TYPES.filter((t) => BUILDINGS[t].unlockLevel <= colony.level)
  const slotsFull = buildings.length >= 12

  async function handleBuild() {
    if (!selected || !walletClient || !publicClient || !address) {
      addToast('Please connect your wallet first.', 'error'); return
    }
    if (slotsFull) { addToast('No available grid slots!', 'error'); return }

    setLoading(true)
    try {
      const txHash = await purchaseBuildingOnChain(walletClient, publicClient, selected)
      placeBuildingLocal(selected, txHash)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transaction failed'
      addToast(msg.includes('user rejected') ? 'Transaction cancelled.' : `Error: ${msg.slice(0, 80)}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const def = selected ? BUILDINGS[selected] : null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b" style={{ borderColor: 'var(--border2)' }}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold" style={{ fontFamily: 'var(--font-title)', fontSize: 16, letterSpacing: '0.08em' }}>
              CONSTRUCT BUILDING
            </h2>
            <button onClick={onClose} className="text-xl" style={{ color: 'var(--text2)' }}>✕</button>
          </div>
          {slotsFull && (
            <div className="mt-2 text-xs px-3 py-2 rounded" style={{ background: 'rgba(239,68,68,0.08)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)' }}>
              All 12 grid slots are occupied. Upgrade existing buildings.
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="p-4 grid grid-cols-2 gap-3" style={{ maxHeight: '45vh', overflowY: 'auto' }}>
          {available.map((type) => {
            const d   = BUILDINGS[type]
            const ok  = canAfford(resources, type)
            const sel = selected === type
            return (
              <button key={type} onClick={() => setSelected(sel ? null : type)}
                className={`building-card text-left ${sel ? 'selected' : ''} ${!ok ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-title)', color: d.color }}>
                    {d.name}
                  </span>
                </div>
                <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--text2)' }}>{d.desc}</p>
                <div className="flex flex-wrap gap-1">
                  <CostBadge label={`${d.cost.celo} CELO`}    color="#35D07F" />
                  {d.cost.gold      > 0 && <CostBadge label={`${d.cost.gold}G`}      color="#FBCC5C" />}
                  {d.cost.energy    > 0 && <CostBadge label={`${d.cost.energy}E`}    color="#22D3EE" />}
                  {d.cost.materials > 0 && <CostBadge label={`${d.cost.materials}M`} color="#8B5CF6" />}
                </div>
                {/* Income preview */}
                <div className="mt-2 text-xs" style={{ color: 'var(--text3)' }}>
                  Income: {Object.entries(d.income).map(([k, v]) => `+${v} ${k}`).join(', ')}
                </div>
              </button>
            )
          })}
        </div>

        {/* Selected detail + confirm */}
        {def && (
          <div className="p-4 border-t" style={{ borderColor: 'var(--border2)' }}>
            <p className="text-xs mb-4" style={{ color: 'var(--text2)' }}>
              <span style={{ color: def.color }}>⌖ {def.name}</span> — {def.lore}
            </p>
            {!isConnected ? (
              <p className="text-xs text-center" style={{ color: 'var(--text2)' }}>Connect wallet to purchase</p>
            ) : (
              <Button className="w-full" loading={loading} disabled={slotsFull} onClick={handleBuild}>
                {loading ? 'Awaiting signature…' : `⚡ Build · ${def.cost.celo} CELO`}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function CostBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
      {label}
    </span>
  )
}
