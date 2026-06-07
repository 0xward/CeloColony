import type { BuildingDef, BuildingType } from '@/types/game'

// ─── Grid ─────────────────────────────────────────────────────────────────────
export const GRID_COLS    = 7
export const GRID_ROWS    = 7
export const MAX_BUILDINGS = 12
export const TILE_W       = 64
export const TILE_H       = 32

// Pre-defined grid slots (col, row) sorted for painter's algorithm (back to front)
export const BUILDING_SLOTS: [number, number][] = [
  [1, 1], [3, 1], [5, 1],
  [1, 3], [3, 3], [5, 3],
  [2, 2], [4, 2],
  [2, 4], [4, 4],
  [1, 5], [5, 5],
]

// ─── Tick ─────────────────────────────────────────────────────────────────────
export const TICK_MS       = 5_000   // 5 seconds
export const SAVE_MS       = 30_000  // 30 seconds
export const OFFLINE_MAX_H = 12      // max hours of offline income

// ─── Buildings ────────────────────────────────────────────────────────────────
export const BUILDINGS: Record<BuildingType, BuildingDef> = {
  power_reactor: {
    id: 'power_reactor',
    name: 'Power Reactor',
    desc: 'Fusion core that powers the entire colony grid.',
    lore: 'Built with Celo validators in mind — decentralized, unstoppable.',
    color: '#22D3EE',
    accentColor: '#0891B2',
    shape: 'tower',
    cost: { gold: 0, energy: 0, materials: 0, celo: '0.02' },
    income: { energy: 60, gold: 10 },
    upgradeCostMultiplier: 1.7,
    maxLevel: 10,
    unlockLevel: 1,
    synergyWith: ['research_lab', 'valora_terminal'],
  },
  minipay_station: {
    id: 'minipay_station',
    name: 'MiniPay Station',
    desc: 'Frictionless payments hub generating colony income.',
    lore: 'Every transaction on Celo flows through here.',
    color: '#3B82F6',
    accentColor: '#1D4ED8',
    shape: 'wide',
    cost: { gold: 500, energy: 200, materials: 100, celo: '0.03' },
    income: { gold: 90, energy: 5, population: 2 },
    upgradeCostMultiplier: 1.8,
    maxLevel: 10,
    unlockLevel: 1,
    synergyWith: ['mento_bank', 'ubeswap_market'],
  },
  mento_bank: {
    id: 'mento_bank',
    name: 'Mento Bank',
    desc: 'Stablecoin reserve that compounds colony wealth.',
    lore: "Mento's algorithmic stability, colonized.",
    color: '#10B981',
    accentColor: '#047857',
    shape: 'pyramid',
    cost: { gold: 1200, energy: 400, materials: 300, celo: '0.06' },
    income: { gold: 180, materials: 20 },
    upgradeCostMultiplier: 1.9,
    maxLevel: 10,
    unlockLevel: 2,
    synergyWith: ['minipay_station', 'ubeswap_market'],
  },
  ubeswap_market: {
    id: 'ubeswap_market',
    name: 'Ubeswap Market',
    desc: 'DEX market amplifying all resource production.',
    lore: 'Liquidity pools power the space economy.',
    color: '#8B5CF6',
    accentColor: '#6D28D9',
    shape: 'dome',
    cost: { gold: 2000, energy: 600, materials: 500, celo: '0.08' },
    income: { gold: 120, energy: 30, materials: 40 },
    upgradeCostMultiplier: 1.85,
    maxLevel: 10,
    unlockLevel: 3,
    synergyWith: ['mento_bank', 'minipay_station'],
  },
  gooddollar_hub: {
    id: 'gooddollar_hub',
    name: 'GoodDollar Hub',
    desc: 'Universal basic income for all colony citizens.',
    lore: 'No citizen left behind — happiness guaranteed.',
    color: '#35D07F',
    accentColor: '#1a6b40',
    shape: 'dome',
    cost: { gold: 800, energy: 300, materials: 200, celo: '0.04' },
    income: { population: 8, happiness: 5, gold: 40 },
    upgradeCostMultiplier: 1.75,
    maxLevel: 10,
    unlockLevel: 2,
    synergyWith: ['opera_hub', 'minipay_station'],
  },
  valora_terminal: {
    id: 'valora_terminal',
    name: 'Valora Terminal',
    desc: 'Wallet gateway. Efficient energy conversion.',
    lore: 'Your keys, your colony.',
    color: '#F59E0B',
    accentColor: '#B45309',
    shape: 'antenna',
    cost: { gold: 600, energy: 100, materials: 150, celo: '0.025' },
    income: { energy: 45, gold: 30 },
    upgradeCostMultiplier: 1.65,
    maxLevel: 10,
    unlockLevel: 1,
    synergyWith: ['power_reactor', 'opera_hub'],
  },
  opera_hub: {
    id: 'opera_hub',
    name: 'Opera Social Hub',
    desc: 'Culture center boosting happiness and growth.',
    lore: 'Community is the strongest protocol.',
    color: '#EC4899',
    accentColor: '#9D174D',
    shape: 'wide',
    cost: { gold: 1500, energy: 500, materials: 400, celo: '0.07' },
    income: { happiness: 8, population: 5, gold: 60 },
    upgradeCostMultiplier: 1.8,
    maxLevel: 10,
    unlockLevel: 3,
    synergyWith: ['gooddollar_hub', 'valora_terminal'],
  },
  research_lab: {
    id: 'research_lab',
    name: 'Research Lab',
    desc: 'Technology accelerator. Unlocks advanced structures.',
    lore: 'Science is the fastest path to the stars.',
    color: '#A5B4FC',
    accentColor: '#4F46E5',
    shape: 'antenna',
    cost: { gold: 3000, energy: 1000, materials: 800, celo: '0.12' },
    income: { gold: 50, energy: 20, materials: 60 },
    upgradeCostMultiplier: 2.0,
    maxLevel: 10,
    unlockLevel: 4,
    synergyWith: ['power_reactor', 'ubeswap_market'],
  },
}

// ─── Level thresholds ─────────────────────────────────────────────────────────
export const LEVEL_XP: number[] = [
  0, 100, 250, 500, 900, 1500, 2400, 3800, 6000, 9500, 15000,
]

// ─── Happiness income multiplier ──────────────────────────────────────────────
export function happinessMultiplier(happiness: number): number {
  if (happiness >= 90) return 1.5
  if (happiness >= 70) return 1.2
  if (happiness >= 50) return 1.0
  if (happiness >= 30) return 0.8
  return 0.6
}

// ─── Synergy bonus ────────────────────────────────────────────────────────────
// Returns extra multiplier (1.0 = no bonus) for a building given its neighbors
export function synergyBonus(
  building: BuildingType,
  neighbors: BuildingType[],
): number {
  const def = BUILDINGS[building]
  const matches = neighbors.filter((n) => def.synergyWith.includes(n)).length
  return 1 + matches * 0.08  // +8% per synergy neighbor
}

// ─── Upgrade cost ─────────────────────────────────────────────────────────────
export function upgradeCeloCost(type: BuildingType, currentLevel: number): string {
  const base  = parseFloat(BUILDINGS[type].cost.celo)
  const cost  = base * Math.pow(BUILDINGS[type].upgradeCostMultiplier, currentLevel)
  return cost.toFixed(4)
}

export function upgradeResourceCost(
  type: BuildingType,
  currentLevel: number,
): Record<string, number> {
  const def  = BUILDINGS[type]
  const mult = Math.pow(def.upgradeCostMultiplier, currentLevel)
  return {
    gold:      Math.floor(def.cost.gold      * mult),
    energy:    Math.floor(def.cost.energy    * mult),
    materials: Math.floor(def.cost.materials * mult),
  }
}

// ─── Initial resources ────────────────────────────────────────────────────────
export const INITIAL_RESOURCES = {
  gold: 2000, energy: 800, materials: 400, population: 50, happiness: 70,
}

export const INITIAL_COLONY = {
  name: 'Nova Prime',
  level: 1, xp: 0, xpToNext: LEVEL_XP[1],
  founded: Date.now(), lastTick: Date.now(),
  totalCeloSpent: '0',
  stats: { totalBuilt: 0, totalUpgrades: 0, peakPop: 50, eventsHandled: 0 },
}
