'use client'
import { useState }         from 'react'
import { useGameStore }     from '@/store/gameStore'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { BUILDINGS, BUILDING_SLOTS, upgradeCeloCost, upgradeResourceCost } from '@/lib/game/constants'
import { upgradeBuildingOnChain } from '@/lib/celo/contracts'
import Button               from '@/components/ui/Button'
import type { PlacedBuilding } from '@/types/game'

interface Props { onClose: () => void }

export default function UpgradeModal({ onClose }: Props) {
  const { buildings, resources, upgradeBuildingLocal, addToast } = useGameStore()
  const { isConnected }          = useAccount()
  const { data: walletClient }   = useWalletClient()
  const publicClient             = usePublicClient()

  const [selected, setSelected] = useState<PlacedBuilding | null>(null)
  const [loading,  setLoading]  = useState(false)

  async function handleUpgrade() {
    if (!selected || !walletClient || !publicClient) return

    const celoCost    = upgradeCeloCost(selected.type, selected.level)
    const resCost     = upgradeResourceCost(selected.type, selected.level)
    const slotIdx     = BUILDING_SLOTS.findIndex(([c, r]) => c === selected.col && r === selected.row)

    if (resources.gold < resCost.gold || resources.energy < resCost.energy || resources.materials < resCost.materials) {
      addToast('Not enough resources!', 'error'); return
    }

    setLoading(true)
    try {
      const txHash = await upgradeBuildingOnChain(
        walletClient, publicClient, slotIdx, selected.level + 1, celoCost,
      )
      upgradeBuildingLocal(selected.uid, celoCost, resCost, txHash)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transaction failed'
      addToast(msg.includes('user rejected') ? 'Transaction cancelled.' : `Error: ${msg.slice(0, 80)}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b" style={{ borderColor: 'var(--border2)' }}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold" style={{ fontFamily: 'var(--font-title)', fontSize: 16, letterSpacing: '0.08em' }}>
              UPGRADE BUILDING
            </h2>
            <button onClick={onClose} className="text-xl" style={{ color: 'var(--text2)' }}>✕</button>
          </div>
        </div>

        {/* Building list */}
        <div className="p-4 grid grid-cols-2 gap-3" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
          {buildings.length === 0 && (
            <p className="col-span-2 text-center text-sm py-8" style={{ color: 'var(--text2)' }}>
              No buildings yet. Build something first!
            </p>
          )}
          {buildings.map((b) => {
            const def      = BUILDINGS[b.type]
            const celoCost = upgradeCeloCost(b.type, b.level)
            const resCost  = upgradeResourceCost(b.type, b.level)
            const maxed    = b.level >= def.maxLevel
            const canPay   = !maxed &&
              resources.gold      >= resCost.gold &&
              resources.energy    >= resCost.energy &&
              resources.materials >= resCost.materials
            const sel = selected?.uid === b.uid

            return (
              <button key={b.uid}
                onClick={() => !maxed && setSelected(sel ? null : b)}
                className={`building-card text-left ${sel ? 'selected' : ''} ${maxed ? 'opacity-40 cursor-not-allowed' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold" style={{ color: def.color, fontFamily: 'var(--font-title)' }}>
                    {def.name}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: `${def.color}20`, color: def.color }}>
                    Lv.{b.level}{maxed ? ' MAX' : ''}
                  </span>
                </div>

                {/* Level progress */}
                <div className="progress-bar mb-2">
                  <div className="progress-fill" style={{ width: `${(b.level / def.maxLevel) * 100}%`, background: def.color }} />
                </div>

                {!maxed && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-xs" style={{ color: canPay ? '#35D07F' : '#FCA5A5' }}>
                      {celoCost} CELO
                    </span>
                    {resCost.gold      > 0 && <span className="text-xs" style={{ color: 'var(--text3)' }}>· {resCost.gold}G</span>}
                    {resCost.energy    > 0 && <span className="text-xs" style={{ color: 'var(--text3)' }}>· {resCost.energy}E</span>}
                    {resCost.materials > 0 && <span className="text-xs" style={{ color: 'var(--text3)' }}>· {resCost.materials}M</span>}
                  </div>
                )}

                {/* Income delta preview */}
                {!maxed && (
                  <div className="mt-1 text-xs" style={{ color: 'var(--text3)' }}>
                    {Object.entries(def.income).map(([k, v]) =>
                      `+${Math.floor(v * 0.25)}/tick ${k}`
                    ).join('  ')}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Confirm */}
        {selected && (
          <div className="p-4 border-t" style={{ borderColor: 'var(--border2)' }}>
            {!isConnected ? (
              <p className="text-xs text-center" style={{ color: 'var(--text2)' }}>Connect wallet to upgrade</p>
            ) : (
              <Button className="w-full" loading={loading} onClick={handleUpgrade}>
                {loading
                  ? 'Awaiting signature…'
                  : `⬆ Upgrade ${BUILDINGS[selected.type].name} → Lv.${selected.level + 1} · ${upgradeCeloCost(selected.type, selected.level)} CELO`
                }
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
