import type { GameEvent, EventType, Resources } from '@/types/game'

// ─── Event definitions ────────────────────────────────────────────────────────
interface EventDef {
  type:        EventType
  name:        string
  description: string
  duration:    number  // ms
  effect: {
    resource?:   keyof Resources
    multiplier?: number
    flat?:       number
    negative?:   boolean
  }
  reward:      Partial<Resources>
  minLevel:    number  // colony level required
}

const EVENT_DEFS: EventDef[] = [
  {
    type:        'solar_flare',
    name:        'Solar Flare Incoming!',
    description: 'Charged particles reduce energy output -30% for 24h. Shield reactors now.',
    duration:    86_400_000,
    effect:      { resource: 'energy', multiplier: 0.7, negative: true },
    reward:      { gold: 500, materials: 200 },
    minLevel:    1,
  },
  {
    type:        'asteroid_belt',
    name:        'Asteroid Belt Detected',
    description: 'Rich mineral deposits nearby. Mining yields +50% materials for 6h.',
    duration:    21_600_000,
    effect:      { resource: 'materials', multiplier: 1.5 },
    reward:      { materials: 800, gold: 300 },
    minLevel:    2,
  },
  {
    type:        'trade_caravan',
    name:        'Trade Caravan Arrived',
    description: 'Galactic merchants offer +40% gold income for 12h.',
    duration:    43_200_000,
    effect:      { resource: 'gold', multiplier: 1.4 },
    reward:      { gold: 1200, energy: 400 },
    minLevel:    1,
  },
  {
    type:        'energy_surge',
    name:        'Quantum Energy Surge',
    description: 'Cosmic radiation doubles energy production for 3h.',
    duration:    10_800_000,
    effect:      { resource: 'energy', multiplier: 2.0 },
    reward:      { energy: 1000, gold: 200 },
    minLevel:    2,
  },
  {
    type:        'population_boom',
    name:        'Colony Population Boom',
    description: 'Immigration wave: +20 population and +15% happiness for 8h.',
    duration:    28_800_000,
    effect:      { resource: 'population', flat: 20 },
    reward:      { population: 30, gold: 400 },
    minLevel:    3,
  },
  {
    type:        'space_storm',
    name:        'Space Storm Warning',
    description: 'Magnetic storm disrupts all income by -20% for 4h. Ride it out.',
    duration:    14_400_000,
    effect:      { multiplier: 0.8, negative: true },
    reward:      { gold: 800, energy: 500, materials: 300 },
    minLevel:    1,
  },
  {
    type:        'celo_grant',
    name:        'Celo Foundation Grant',
    description: 'Colony recognized! Emergency CELO grant: flat +2000 gold income.',
    duration:    3_600_000,
    effect:      { resource: 'gold', flat: 2000 },
    reward:      { gold: 2000, materials: 500 },
    minLevel:    4,
  },
  {
    type:        'rival_raid',
    name:        'Rival Colony Raid!',
    description: 'Enemy colony attacks. All income -40% until you build a defense tower.',
    duration:    7_200_000,
    effect:      { multiplier: 0.6, negative: true },
    reward:      { gold: 1500, energy: 800, materials: 600 },
    minLevel:    5,
  },
]

// ─── Roll a random event ───────────────────────────────────────────────────────
export function rollEvent(colonyLevel: number, now = Date.now()): GameEvent | null {
  // 15% chance per check (called every few minutes)
  if (Math.random() > 0.15) return null

  const eligible = EVENT_DEFS.filter((e) => e.minLevel <= colonyLevel)
  if (!eligible.length) return null

  const def = eligible[Math.floor(Math.random() * eligible.length)]
  return {
    id:          `evt_${now}`,
    type:        def.type,
    name:        def.name,
    description: def.description,
    startsAt:    now,
    endsAt:      now + def.duration,
    effect:      def.effect,
    responded:   false,
    reward:      def.reward,
  }
}

// ─── Respond to event (player clicks respond) ─────────────────────────────────
export function respondToEvent(event: GameEvent): {
  event: GameEvent
  reward: Partial<Resources>
} {
  return {
    event:  { ...event, responded: true },
    reward: event.reward ?? {},
  }
}

// ─── Get event income multiplier ──────────────────────────────────────────────
export function getEventMultiplier(event: GameEvent | null, now = Date.now()): number {
  if (!event || now > event.endsAt) return 1
  if (!event.effect.multiplier) return 1
  return event.effect.multiplier
}

// ─── Event time remaining (formatted) ────────────────────────────────────────
export function eventTimeRemaining(event: GameEvent, now = Date.now()): string {
  const ms  = Math.max(0, event.endsAt - now)
  const h   = Math.floor(ms / 3_600_000)
  const m   = Math.floor((ms % 3_600_000) / 60_000)
  const s   = Math.floor((ms % 60_000) / 1_000)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}
