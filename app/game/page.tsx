export const dynamic = 'force-dynamic'
'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useAccount }    from 'wagmi'
import { useGameStore }  from '@/store/gameStore'
import { rollEvent }     from '@/lib/game/events'
import GameCanvas        from '@/components/game/GameCanvas'
import HUD               from '@/components/game/HUD'
import EventBanner       from '@/components/game/EventBanner'
import ColonyPanel       from '@/components/game/ColonyPanel'
import BottomNav         from '@/components/game/BottomNav'
import BuildModal        from '@/components/game/BuildModal'
import UpgradeModal      from '@/components/game/UpgradeModal'
import Button            from '@/components/ui/Button'
import Link              from 'next/link'

export default function GamePage() {
  const { address, isConnected } = useAccount()
  const {
    init, startLoop, buildings, resources, colony,
    activeEvent, setActiveEvent, isLoading, addToast,
  } = useGameStore()

  const [activeTab,     setActiveTab]     = useState('colony')
  const [showBuild,     setShowBuild]     = useState(false)
  const [showUpgrade,   setShowUpgrade]   = useState(false)
  const [initialized,   setInitialized]   = useState(false)
  const stopLoopRef = useRef<(() => void) | null>(null)
  const eventTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Initialize when wallet connects ────────────────────────────────────────
  useEffect(() => {
    if (!isConnected || !address || initialized) return
    setInitialized(true)
    init(address).then(() => {
      stopLoopRef.current = startLoop()
    })
    return () => stopLoopRef.current?.()
  }, [isConnected, address, initialized, init, startLoop])

  // ── Random event roller (every 5 min) ─────────────────────────────────────
  useEffect(() => {
    if (!isConnected) return
    eventTimerRef.current = setInterval(() => {
      if (activeEvent) return
      const evt = rollEvent(colony.level)
      if (evt) {
        setActiveEvent(evt)
        addToast(`⚡ New event: ${evt.name}`, 'info')
      }
    }, 5 * 60_000)
    return () => { if (eventTimerRef.current) clearInterval(eventTimerRef.current) }
  }, [isConnected, activeEvent, colony.level, setActiveEvent, addToast])

  // ── Tile click ─────────────────────────────────────────────────────────────
  const handleTileClick = useCallback((col: number, row: number) => {
    const occupied = buildings.find((b) => b.col === col && b.row === row)
    if (occupied) { setShowUpgrade(true) } else { setShowBuild(true) }
  }, [buildings])

  // ── Not connected ─────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6"
        style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <div className="text-center">
          <h1 className="mb-2 font-bold" style={{ fontFamily: 'var(--font-title)', fontSize: 28, letterSpacing: '0.1em', color: 'var(--green)' }}>
            CELO COLONY
          </h1>
          <p className="text-sm" style={{ color: 'var(--text2)' }}>Connect your Celo wallet to start your colony</p>
        </div>
        <HUD />
        <Link href="/" className="text-xs" style={{ color: 'var(--text3)' }}>← Back to landing</Link>
      </main>
    )
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <div className="tx-spinner" style={{ width: 32, height: 32 }} />
        <p className="text-sm" style={{ color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>
          Loading colony data…
        </p>
      </main>
    )
  }

  return (
    <main className="h-screen flex flex-col overflow-hidden"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── HUD ── */}
      <HUD />

      {/* ── Event banner ── */}
      <EventBanner />

      {/* ── Game canvas area ── */}
      <div className="flex-1 relative overflow-hidden">

        {/* Main city canvas */}
        <div className="absolute inset-0">
          <GameCanvas
            buildings={buildings}
            happiness={resources.happiness}
            onTileClick={activeTab === 'colony' ? handleTileClick : undefined}
          />
        </div>

        {/* Side buttons (desktop + mobile) */}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          {[
            { icon: '⚡', label: 'Events',      badge: activeEvent && !activeEvent.responded ? 1 : 0 },
            { icon: '📋', label: 'Missions',    badge: 0 },
            { icon: '🎒', label: 'Inventory',   badge: 0 },
            { icon: '🏆', label: 'Leaderboard', badge: 0 },
          ].map((btn) => (
            <button key={btn.label}
              className="relative flex flex-col items-center gap-0.5 p-2 rounded-lg border transition-colors"
              style={{
                background:  'var(--panel)',
                borderColor: 'var(--border)',
                color:       'var(--text2)',
                minWidth:    48,
                backdropFilter: 'blur(12px)',
              }}
              onClick={() => btn.label === 'Leaderboard' ? setActiveTab('colony') : null}>
              <span className="text-lg leading-none">{btn.icon}</span>
              <span className="text-xs" style={{ fontSize: 8, fontFamily: 'var(--font-title)', letterSpacing: '0.04em' }}>
                {btn.label.toUpperCase()}
              </span>
              {btn.badge! > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center"
                  style={{ background: '#EF4444', color: '#fff', fontSize: 9 }}>
                  {btn.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Build button */}
        {activeTab === 'colony' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
            <Button
              size="lg"
              onClick={() => setShowBuild(true)}
              className="glow-green"
              style={{ fontFamily: 'var(--font-title)', letterSpacing: '0.08em', fontSize: 14 }}>
              🏗️ BUILD
            </Button>
            {buildings.length > 0 && (
              <Button
                size="lg"
                variant="secondary"
                onClick={() => setShowUpgrade(true)}
                style={{ fontFamily: 'var(--font-title)', letterSpacing: '0.08em', fontSize: 14 }}>
                ⬆ UPGRADE
              </Button>
            )}
          </div>
        )}

        {/* Empty state overlay */}
        {buildings.length === 0 && activeTab === 'colony' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center p-6 rounded-2xl"
              style={{ background: 'rgba(7,10,15,0.6)', border: '1px dashed rgba(53,208,127,0.2)' }}>
              <div className="text-3xl mb-2">🌌</div>
              <p className="text-sm font-bold mb-1" style={{ fontFamily: 'var(--font-title)', color: 'var(--green)' }}>
                EMPTY COLONY
              </p>
              <p className="text-xs" style={{ color: 'var(--text2)' }}>
                Click a tile or press BUILD to place your first structure
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Colony bottom panel ── */}
      <ColonyPanel />

      {/* ── Bottom nav ── */}
      <BottomNav activeTab={activeTab} onTab={setActiveTab} />
      <div style={{ height: 56 }} /> {/* spacer for fixed nav */}

      {/* ── Modals ── */}
      {showBuild   && <BuildModal   onClose={() => setShowBuild(false)}   />}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </main>
  )
}
