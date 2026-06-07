import type { Resources, PlacedBuilding, Colony, GameState } from '@/types/game'
import {
  BUILDINGS, TICK_MS, OFFLINE_MAX_H, LEVEL_XP,
  happinessMultiplier, synergyBonus, BUILDING_SLOTS,
} from './constants'

// ─── Per-tick income ──────────────────────────────────────────────────────────
export function calcTickIncome(
  buildings: PlacedBuilding[],
  happiness: number,
  eventMultiplier = 1,
): Partial<Resources> {
  const happMult = happinessMultiplier(happiness)
  const totals: Partial<Resources> = {}

  for (const b of buildings) {
    const def      = BUILDINGS[b.type]
    const slotIdx  = BUILDING_SLOTS.findIndex(([c, r]) => c === b.col && r === b.row)
    const neighbors = getNeighborTypes(slotIdx, buildings)
    const synergy   = synergyBonus(b.type, neighbors)
    const levelMult = 1 + (b.level - 1) * 0.25   // +25% per level above 1

    for (const [res, base] of Object.entries(def.income) as [keyof Resources, number][]) {
      const amount = Math.floor(base * levelMult * happMult * synergy * eventMultiplier)
      totals[res]  = (totals[res] ?? 0) + amount
    }
  }
  return totals
}

// ─── Neighbors ────────────────────────────────────────────────────────────────
function getNeighborTypes(slotIdx: number, buildings: PlacedBuilding[]): import('@/types/game').BuildingType[] {
  if (slotIdx < 0) return []
  const [col, row] = BUILDING_SLOTS[slotIdx]
  return buildings
    .filter((b) => {
      const dc = Math.abs(b.col - col)
      const dr = Math.abs(b.row - row)
      return (dc <= 2 && dr <= 2) && !(dc === 0 && dr === 0)
    })
    .map((b) => b.type)
}

// ─── Apply income to resources ────────────────────────────────────────────────
export function applyIncome(
  resources: Resources,
  income: Partial<Resources>,
): Resources {
  const next = { ...resources }
  for (const [key, val] of Object.entries(income) as [keyof Resources, number][]) {
    if (key === 'happiness') {
      next.happiness = Math.min(100, Math.max(0, next.happiness + val))
    } else {
      next[key] = Math.floor(next[key] + val)
    }
  }
  // Happiness decays 1 point per tick if no hub buildings
  next.happiness = Math.max(0, next.happiness - 1)
  return next
}

// ─── Offline progress ────────────────────────────────────────────────────────
export function calcOfflineProgress(
  state: GameState,
  now = Date.now(),
): { resources: Resources; ticks: number } {
  const elapsed   = now - state.colony.lastTick
  const maxMs     = OFFLINE_MAX_H * 3_600_000
  const cappedMs  = Math.min(elapsed, maxMs)
  const ticks     = Math.floor(cappedMs / TICK_MS)

  if (ticks === 0) return { resources: state.resources, ticks: 0 }

  // Offline income is 50% of normal (to incentivize active play)
  const income = calcTickIncome(state.buildings, state.resources.happiness, 0.5)
  let resources = { ...state.resources }
  for (let i = 0; i < ticks; i++) {
    resources = applyIncome(resources, income)
  }
  return { resources, ticks }
}

// ─── XP & leveling ───────────────────────────────────────────────────────────
export function xpForBuild(level: number): number { return 20 + level * 10 }
export function xpForUpgrade(buildingLevel: number): number { return 10 + buildingLevel * 5 }

export function applyXP(colony: Colony, xpGain: number): Colony {
  let { xp, level } = colony
  xp += xpGain
  while (level < LEVEL_XP.length - 1 && xp >= LEVEL_XP[level]) {
    xp   -= LEVEL_XP[level]
    level += 1
  }
  return {
    ...colony,
    xp,
    level,
    xpToNext: LEVEL_XP[level] ?? LEVEL_XP[LEVEL_XP.length - 1],
  }
}

// ─── Build a new building ─────────────────────────────────────────────────────
export function buildBuilding(
  state: GameState,
  type: import('@/types/game').BuildingType,
  slotIdx: number,
  txHash: string,
): GameState {
  const def  = BUILDINGS[type]
  const [col, row] = BUILDING_SLOTS[slotIdx]
  const now  = Date.now()

  const placed: PlacedBuilding = {
    uid:         `${type}_${now}`,
    type,
    level:       1,
    col,
    row,
    placedAt:    now,
    lastHarvest: now,
    txHash,
    accumulated: {},
  }

  const resources = {
    ...state.resources,
    gold:      state.resources.gold      - def.cost.gold,
    energy:    state.resources.energy    - def.cost.energy,
    materials: state.resources.materials - def.cost.materials,
  }

  const colony = applyXP(
    {
      ...state.colony,
      totalCeloSpent: addWei(state.colony.totalCeloSpent, def.cost.celo),
      stats: {
        ...state.colony.stats,
        totalBuilt: state.colony.stats.totalBuilt + 1,
      },
    },
    xpForBuild(state.colony.level),
  )

  return {
    ...state,
    buildings: [...state.buildings, placed],
    resources,
    colony,
  }
}

// ─── Upgrade a building ───────────────────────────────────────────────────────
export function upgradeBuilding(
  state: GameState,
  uid: string,
  celoCost: string,
  resourceCost: Record<string, number>,
  txHash: string,
): GameState {
  const buildings = state.buildings.map((b) =>
    b.uid === uid ? { ...b, level: b.level + 1, txHash } : b,
  )

  const resources = {
    ...state.resources,
    gold:      state.resources.gold      - (resourceCost.gold      ?? 0),
    energy:    state.resources.energy    - (resourceCost.energy    ?? 0),
    materials: state.resources.materials - (resourceCost.materials ?? 0),
  }

  const colony = applyXP(
    {
      ...state.colony,
      totalCeloSpent: addWei(state.colony.totalCeloSpent, celoCost),
      stats: {
        ...state.colony.stats,
        totalUpgrades: state.colony.stats.totalUpgrades + 1,
      },
    },
    xpForUpgrade(buildings.find((b) => b.uid === uid)?.level ?? 1),
  )

  return { ...state, buildings, resources, colony }
}

// ─── Score (for leaderboard) ──────────────────────────────────────────────────
export function calcScore(state: GameState): number {
  const buildScore   = state.buildings.reduce((s, b) => s + b.level * 100, 0)
  const celoScore    = Math.floor(parseFloat(state.colony.totalCeloSpent) * 1000)
  const colonyScore  = state.colony.level * 500
  const popScore     = state.resources.population
  return buildScore + celoScore + colonyScore + popScore
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function addWei(a: string, bCelo: string): string {
  const aF = parseFloat(a)
  const bF = parseFloat(bCelo)
  return String(aF + bF)
}

export function nextAvailableSlot(buildings: PlacedBuilding[]): number {
  const occupied = new Set(buildings.map((b) => `${b.col},${b.row}`))
  return BUILDING_SLOTS.findIndex(([c, r]) => !occupied.has(`${c},${r}`))
}

export function canAfford(resources: Resources, type: import('@/types/game').BuildingType): boolean {
  const def = BUILDINGS[type]
  return (
    resources.gold      >= def.cost.gold &&
    resources.energy    >= def.cost.energy &&
    resources.materials >= def.cost.materials
  )
}
