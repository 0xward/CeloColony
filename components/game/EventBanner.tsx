'use client'
import { useEffect, useState } from 'react'
import { useGameStore }        from '@/store/gameStore'
import { eventTimeRemaining }  from '@/lib/game/events'
import Button                  from '@/components/ui/Button'

const EVENT_COLORS: Record<string, string> = {
  solar_flare:      '#F59E0B',
  asteroid_belt:    '#8B5CF6',
  trade_caravan:    '#35D07F',
  energy_surge:     '#22D3EE',
  population_boom:  '#EC4899',
  space_storm:      '#EF4444',
  celo_grant:       '#FBCC5C',
  rival_raid:       '#EF4444',
}

const EVENT_ICONS: Record<string, string> = {
  solar_flare:     '☀️',
  asteroid_belt:   '🪨',
  trade_caravan:   '🚀',
  energy_surge:    '⚡',
  population_boom: '👥',
  space_storm:     '🌪️',
  celo_grant:      '🏆',
  rival_raid:      '⚔️',
}

export default function EventBanner() {
  const { activeEvent, respondEvent } = useGameStore()
  const [timeLeft, setTimeLeft]       = useState('')

  useEffect(() => {
    if (!activeEvent) return
    setTimeLeft(eventTimeRemaining(activeEvent))
    const id = setInterval(() => {
      setTimeLeft(eventTimeRemaining(activeEvent))
    }, 1000)
    return () => clearInterval(id)
  }, [activeEvent])

  if (!activeEvent) return null

  const color = EVENT_COLORS[activeEvent.type] ?? '#35D07F'
  const icon  = EVENT_ICONS[activeEvent.type]  ?? '🌌'

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 text-sm"
      style={{
        background:   `${color}12`,
        borderBottom: `1px solid ${color}30`,
        borderTop:    `1px solid ${color}30`,
      }}
    >
      <span className="text-base flex-shrink-0">{icon}</span>

      <div className="flex-1 min-w-0">
        <span className="font-bold mr-2" style={{ color, fontFamily: 'var(--font-title)', fontSize: 12, letterSpacing: '0.05em' }}>
          EVENT
        </span>
        <span className="text-xs" style={{ color: 'var(--text)' }}>
          {activeEvent.name}
        </span>
        <span className="text-xs ml-2 hidden sm:inline" style={{ color: 'var(--text2)' }}>
          — {activeEvent.description}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs font-mono tabular-nums" style={{ color }}>
          {timeLeft}
        </span>
        {!activeEvent.responded && (
          <Button size="sm" variant="secondary" onClick={respondEvent}
            style={{ borderColor: `${color}50`, color }}>
            Respond
          </Button>
        )}
        {activeEvent.responded && (
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${color}20`, color }}>
            ✓ Responded
          </span>
        )}
      </div>
    </div>
  )
}
