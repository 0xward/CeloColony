// ─── Resources ────────────────────────────────────────────────────────────────
export interface Resources {
  gold:       number
  energy:     number
  materials:  number
  population: number
  happiness:  number   // 0-100
}

// ─── Building ─────────────────────────────────────────────────────────────────
export type BuildingType =
  | 'power_reactor'
  | 'minipay_station'
  | 'mento_bank'
  | 'ubeswap_market'
  | 'gooddollar_hub'
  | 'valora_terminal'
  | 'opera_hub'
  | 'research_lab'

export interface BuildingDef {
  id:           BuildingType
  name:         string
  desc:         string
  lore:         string
  color:        string
  accentColor:  string
  shape:        'tower' | 'pyramid' | 'dome' | 'wide' | 'antenna'
  cost: {
    gold:      number
    energy:    number
    materials: number
    celo:      string   // in CELO (e.g. "0.05")
  }
  income: Partial<Resources>
  upgradeCostMultiplier: number
  maxLevel:    number
  unlockLevel: number
  synergyWith: BuildingType[]
}

export interface PlacedBuilding {
  uid:          string          // unique instance id
  type:         BuildingType
  level:        number
  col:          number
  row:          number
  placedAt:     number          // timestamp ms
  lastHarvest:  number          // timestamp ms
  txHash:       string          // on-chain purchase tx
  accumulated:  Partial<Resources> // unharvested resources
}

// ─── Colony ───────────────────────────────────────────────────────────────────
export interface Colony {
  name:          string
  level:         number
  xp:            number
  xpToNext:      number
  founded:       number
  lastTick:      number
  totalCeloSpent: string        // wei string
  stats: {
    totalBuilt:    number
    totalUpgrades: number
    peakPop:       number
    eventsHandled: number
  }
}

// ─── Events ───────────────────────────────────────────────────────────────────
export type EventType =
  | 'solar_flare'
  | 'asteroid_belt'
  | 'trade_caravan'
  | 'energy_surge'
  | 'population_boom'
  | 'space_storm'
  | 'celo_grant'
  | 'rival_raid'

export interface GameEvent {
  id:          string
  type:        EventType
  name:        string
  description: string
  startsAt:    number
  endsAt:      number
  effect: {
    resource?:   keyof Resources
    multiplier?: number
    flat?:       number
    negative?:   boolean
  }
  responded:   boolean
  reward?:     Partial<Resources>
}

// ─── Feed ─────────────────────────────────────────────────────────────────────
export interface FeedEntry {
  id:          string
  playerName:  string
  playerAddr:  string
  action:      'build' | 'upgrade' | 'event' | 'milestone' | 'harvest'
  detail:      string
  timestamp:   number
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  address:       string
  name:          string
  level:         number
  population:    number
  totalBuildings: number
  score:         number
  celoSpent:     string
}

// ─── Full Game State ──────────────────────────────────────────────────────────
export interface GameState {
  colony:    Colony
  resources: Resources
  buildings: PlacedBuilding[]
  activeEvent: GameEvent | null
  eventHistory: GameEvent[]
  feed:      FeedEntry[]
  leaderboard: LeaderboardEntry[]
  isLoading: boolean
  isSyncing: boolean
  lastSaved: number
}

// ─── Wallet ───────────────────────────────────────────────────────────────────
export interface WalletState {
  address:     string | null
  celoBalance: string          // formatted CELO
  isConnected: boolean
  chainId:     number | null
  isMiniPay:   boolean
}

// ─── Canvas ───────────────────────────────────────────────────────────────────
export interface CanvasBuilding extends PlacedBuilding {
  screenX: number
  screenY: number
  glow:    number   // 0-1 animated glow
}

export interface Particle {
  x:      number
  y:      number
  vx:     number
  vy:     number
  life:   number   // 0-1
  color:  string
  size:   number
}

export interface Drone {
  x:       number
  y:       number
  angle:   number
  speed:   number
  path:    number
  pathT:   number
}
