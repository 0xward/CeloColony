'use client'
import { useState }      from 'react'
import { useGameStore }  from '@/store/gameStore'
import { BUILDINGS }     from '@/lib/game/constants'

type Tab = 'overview' | 'buildings' | 'feed' | 'leaderboard'

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return String(Math.floor(n))
}

function timeAgo(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000)
  if (s < 60)   return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

export default function ColonyPanel() {
  const [tab, setTab]       = useState<Tab>('overview')
  const [open, setOpen]     = useState(false)
  const { colony, resources, buildings, feed, leaderboard, lastSaved } = useGameStore()

  const tabs: Tab[] = ['overview', 'buildings', 'feed', 'leaderboard']

  return (
    <div
      className="bottom-sheet"
      style={{ transform: open ? 'translateY(0)' : 'translateY(calc(100% - 48px))' }}
    >
      {/* Handle */}
      <button
        className="w-full flex items-center justify-between px-5 py-3"
        onClick={() => setOpen((p) => !p)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-1 rounded-full mx-auto" style={{ background: 'var(--border)', width: 32 }} />
        </div>
        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text2)' }}>
          <span>👥 {fmt(resources.population)}</span>
          <span>😊 {Math.round(resources.happiness)}%</span>
          <span>🏗️ {buildings.length}/12</span>
          {lastSaved > 0 && <span>💾 {timeAgo(lastSaved)}</span>}
        </div>
        <span className="text-xs" style={{ color: 'var(--text2)' }}>{open ? '▼' : '▲'}</span>
      </button>

      {open && (
        <>
          {/* Tabs */}
          <div className="flex border-b px-4 gap-1" style={{ borderColor: 'var(--border2)' }}>
            {tabs.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className="px-3 py-2 text-xs capitalize transition-colors"
                style={{
                  borderBottom:  tab === t ? '2px solid var(--green)' : '2px solid transparent',
                  color:         tab === t ? 'var(--green)' : 'var(--text2)',
                  fontFamily:    'var(--font-title)',
                  letterSpacing: '0.06em',
                }}>
                {t}
              </button>
            ))}
          </div>

          <div className="p-4 overflow-y-auto" style={{ maxHeight: '40vh' }}>
            {tab === 'overview' && <OverviewTab />}
            {tab === 'buildings' && <BuildingsTab />}
            {tab === 'feed' && <FeedTab />}
            {tab === 'leaderboard' && <LeaderboardTab />}
          </div>
        </>
      )}
    </div>
  )
}

// ── Overview ──────────────────────────────────────────────────────────────────
function OverviewTab() {
  const { colony, resources, buildings } = useGameStore()
  const totalIncome = buildings.reduce((s, b) => {
    const def = BUILDINGS[b.type]
    return s + (def.income.gold ?? 0) * (1 + (b.level - 1) * 0.25)
  }, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Colony Level"   value={String(colony.level)} color="var(--green)" />
        <Stat label="XP"             value={`${colony.xp} / ${colony.xpToNext}`} color="#FBCC5C" />
        <Stat label="Population"     value={fmt(resources.population)} color="#35D07F" />
        <Stat label="Happiness"      value={`${Math.round(resources.happiness)}%`} color="#EC4899" />
        <Stat label="Gold Income"    value={`+${fmt(totalIncome)}/tick`} color="#FBCC5C" />
        <Stat label="Buildings"      value={`${buildings.length} / 12`} color="var(--cyan)" />
        <Stat label="Total Built"    value={String(colony.stats.totalBuilt)}   color="var(--text2)" />
        <Stat label="CELO Spent"     value={`${parseFloat(colony.totalCeloSpent).toFixed(3)}`} color="#35D07F" />
      </div>

      {/* Happiness bar */}
      <div>
        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text2)' }}>
          <span>Happiness</span><span>{Math.round(resources.happiness)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill"
            style={{
              width: `${resources.happiness}%`,
              background: resources.happiness > 70 ? '#35D07F' : resources.happiness > 40 ? '#F59E0B' : '#EF4444',
            }} />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="panel p-3">
      <div className="text-xs mb-1" style={{ color: 'var(--text2)' }}>{label}</div>
      <div className="font-bold text-sm" style={{ color, fontFamily: 'var(--font-mono)' }}>{value}</div>
    </div>
  )
}

// ── Buildings ─────────────────────────────────────────────────────────────────
function BuildingsTab() {
  const { buildings } = useGameStore()
  if (!buildings.length) return (
    <p className="text-center text-sm py-6" style={{ color: 'var(--text2)' }}>
      No buildings yet. Click BUILD to start!
    </p>
  )
  return (
    <div className="grid grid-cols-2 gap-3">
      {buildings.map((b) => {
        const def = BUILDINGS[b.type]
        return (
          <div key={b.uid} className="panel p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: def.color }} />
              <span className="text-xs font-bold" style={{ color: def.color, fontFamily: 'var(--font-title)' }}>
                {def.name}
              </span>
            </div>
            <div className="progress-bar mb-1">
              <div className="progress-fill" style={{ width: `${(b.level / def.maxLevel) * 100}%`, background: def.color }} />
            </div>
            <div className="flex justify-between text-xs" style={{ color: 'var(--text2)' }}>
              <span>Lv.{b.level}</span>
              <span>+{Math.floor((def.income.gold ?? 0) * (1 + (b.level - 1) * 0.25))} G/tick</span>
            </div>
            <div className="mt-1 text-xs" style={{ color: 'var(--text3)' }}>
              {b.txHash.slice(0, 10)}…
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Feed ─────────────────────────────────────────────────────────────────────
function FeedTab() {
  const { feed } = useGameStore()
  const ACTION_ICONS: Record<string, string> = {
    build: '🏗️', upgrade: '⬆', event: '⚡', milestone: '🏆', harvest: '🌾',
  }
  if (!feed.length) return (
    <p className="text-center text-sm py-6" style={{ color: 'var(--text2)' }}>
      Waiting for colony activity…
    </p>
  )
  return (
    <div className="space-y-2">
      {feed.map((f) => (
        <div key={f.id} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: 'var(--border2)' }}>
          <span className="text-base flex-shrink-0">{ACTION_ICONS[f.action] ?? '🌌'}</span>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold" style={{ color: 'var(--green)' }}>{f.playerName} </span>
            <span className="text-xs" style={{ color: 'var(--text2)' }}>{f.detail}</span>
          </div>
          <span className="text-xs flex-shrink-0" style={{ color: 'var(--text3)' }}>{timeAgo(f.timestamp)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
function LeaderboardTab() {
  const { leaderboard } = useGameStore()
  if (!leaderboard.length) return (
    <p className="text-center text-sm py-6" style={{ color: 'var(--text2)' }}>
      Leaderboard loading…
    </p>
  )
  return (
    <div className="space-y-2">
      {leaderboard.map((e, i) => (
        <div key={e.address} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: 'var(--border2)' }}>
          <span className="w-6 text-xs text-center font-bold"
            style={{ color: i === 0 ? '#FBCC5C' : i === 1 ? '#94A3B8' : i === 2 ? '#CD7C2F' : 'var(--text3)' }}>
            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>{e.name}</div>
            <div className="text-xs" style={{ color: 'var(--text2)' }}>Lv.{e.level} · {e.totalBuildings} buildings</div>
          </div>
          <div className="text-xs font-bold" style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
            {fmt(e.score)}
          </div>
        </div>
      ))}
    </div>
  )
}
