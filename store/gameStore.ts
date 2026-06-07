'use client'
import { create }    from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { GameState, PlacedBuilding, GameEvent, FeedEntry, LeaderboardEntry, Resources } from '@/types/game'
import type { BuildingType }    from '@/types/game'
import {
  calcTickIncome, applyIncome, calcOfflineProgress,
  buildBuilding, upgradeBuilding as upgradeB,
  nextAvailableSlot,
} from '@/lib/game/engine'
import { getEventMultiplier, respondToEvent } from '@/lib/game/events'
import { TICK_MS, SAVE_MS, INITIAL_RESOURCES, INITIAL_COLONY } from '@/lib/game/constants'
import {
  saveColony, loadColony, upsertPlayer,
  updateLeaderboard, addFeedEntry, subscribeFeed, subscribeLeaderboard,
} from '@/lib/firebase/gamedb'

// ─── Initial state ─────────────────────────────────────────────────────────────
const INITIAL_STATE: GameState = {
  colony:       INITIAL_COLONY,
  resources:    INITIAL_RESOURCES,
  buildings:    [],
  activeEvent:  null,
  eventHistory: [],
  feed:         [],
  leaderboard:  [],
  isLoading:    false,
  isSyncing:    false,
  lastSaved:    0,
}

// ─── Store ────────────────────────────────────────────────────────────────────
interface Store extends GameState {
  walletAddress: string | null
  pendingRewards: string
  toasts: { id: string; msg: string; type: 'success' | 'error' | 'info' }[]

  // Init
  init:           (address: string) => Promise<void>
  reset:          () => void

  // Game loop
  tick:           () => void
  startLoop:      () => () => void

  // Buildings
  placeBuildingLocal:   (type: BuildingType, txHash: string) => void
  upgradeBuildingLocal: (uid: string, celoCost: string, resourceCost: Record<string, number>, txHash: string) => void

  // Events
  setActiveEvent:  (event: GameEvent | null) => void
  respondEvent:    () => void

  // UI
  addToast:        (msg: string, type?: 'success' | 'error' | 'info') => void
  removeToast:     (id: string) => void
  setPendingRewards: (val: string) => void

  // Sync
  syncToFirebase:  () => Promise<void>
}

export const useGameStore = create<Store>()(
  subscribeWithSelector((set, get) => ({
    ...INITIAL_STATE,
    walletAddress:  null,
    pendingRewards: '0',
    toasts:         [],

    // ── Init ──────────────────────────────────────────────────────────────────
    init: async (address) => {
      set({ isLoading: true, walletAddress: address })
      try {
        await upsertPlayer(address)
        const saved = await loadColony(address)
        if (saved) {
          // Calc offline progress
          const mockState: GameState = {
            ...INITIAL_STATE,
            ...saved,
            colony:    saved.colony    ?? INITIAL_STATE.colony,
            resources: saved.resources ?? INITIAL_STATE.resources,
            buildings: saved.buildings ?? [],
          }
          const { resources, ticks } = calcOfflineProgress(mockState)
          if (ticks > 0) {
            get().addToast(
              `Welcome back! Colony earned income for ${ticks} ticks while you were away.`,
              'info',
            )
          }
          set({ ...mockState, resources, lastSaved: (saved as GameState).lastSaved ?? 0 })
        }

        // Subscribe to feed & leaderboard
        subscribeFeed((feed) => set({ feed }))
        subscribeLeaderboard((leaderboard) => set({ leaderboard }))
      } finally {
        set({ isLoading: false })
      }
    },

    reset: () => set({ ...INITIAL_STATE, walletAddress: null }),

    // ── Tick ──────────────────────────────────────────────────────────────────
    tick: () => {
      const state = get()
      const evtMult  = getEventMultiplier(state.activeEvent)
      const income   = calcTickIncome(state.buildings, state.resources.happiness, evtMult)
      const resources = applyIncome(state.resources, income)
      const colony    = {
        ...state.colony,
        lastTick: Date.now(),
        stats: {
          ...state.colony.stats,
          peakPop: Math.max(state.colony.stats.peakPop, resources.population),
        },
      }
      set({ resources, colony })

      // Clear expired event
      if (state.activeEvent && Date.now() > state.activeEvent.endsAt) {
        set((s) => ({
          activeEvent:  null,
          eventHistory: [state.activeEvent!, ...s.eventHistory].slice(0, 50),
        }))
      }
    },

    // ── Game loop ─────────────────────────────────────────────────────────────
    startLoop: () => {
      const tickId = setInterval(() => get().tick(), TICK_MS)
      const saveId = setInterval(() => get().syncToFirebase(), SAVE_MS)
      return () => { clearInterval(tickId); clearInterval(saveId) }
    },

    // ── Build ─────────────────────────────────────────────────────────────────
    placeBuildingLocal: (type, txHash) => {
      const state   = get()
      const slotIdx = nextAvailableSlot(state.buildings)
      if (slotIdx < 0) { get().addToast('No available grid slots!', 'error'); return }

      const next = buildBuilding(state, type, slotIdx, txHash)
      set(next)
      get().addToast(`${type.replace(/_/g, ' ')} constructed!`, 'success')

      // Feed entry
      if (state.walletAddress) {
        addFeedEntry(state.walletAddress, 'build', `built a ${type.replace(/_/g, ' ')}`)
        get().syncToFirebase()
      }
    },

    // ── Upgrade ───────────────────────────────────────────────────────────────
    upgradeBuildingLocal: (uid, celoCost, resourceCost, txHash) => {
      const state = get()
      const next  = upgradeB(state, uid, celoCost, resourceCost, txHash)
      set(next)
      const bld   = next.buildings.find((b) => b.uid === uid)
      get().addToast(`Building upgraded to Level ${bld?.level}!`, 'success')

      if (state.walletAddress) {
        addFeedEntry(state.walletAddress, 'upgrade', `upgraded a building to Lv.${bld?.level}`)
        get().syncToFirebase()
      }
    },

    // ── Events ────────────────────────────────────────────────────────────────
    setActiveEvent: (event) => set({ activeEvent: event }),

    respondEvent: () => {
      const { activeEvent } = get()
      if (!activeEvent) return
      const { event, reward } = respondToEvent(activeEvent)
      const resources = applyIncome(get().resources, reward as Partial<Resources>)
      set((s) => ({
        activeEvent:  event,
        resources,
        colony: {
          ...s.colony,
          stats: { ...s.colony.stats, eventsHandled: s.colony.stats.eventsHandled + 1 },
        },
      }))
      get().addToast('Event response successful! Rewards collected.', 'success')
    },

    // ── Firebase sync ─────────────────────────────────────────────────────────
    syncToFirebase: async () => {
      const { walletAddress, isSyncing } = get()
      if (!walletAddress || isSyncing) return
      set({ isSyncing: true })
      try {
        const state = get()
        await saveColony(walletAddress, state)
        await updateLeaderboard(walletAddress, state)
        set({ lastSaved: Date.now() })
      } finally {
        set({ isSyncing: false })
      }
    },

    // ── Toasts ────────────────────────────────────────────────────────────────
    addToast: (msg, type = 'info') => {
      const id = `toast_${Date.now()}`
      set((s) => ({ toasts: [{ id, msg, type }, ...s.toasts].slice(0, 4) }))
      setTimeout(() => get().removeToast(id), 4000)
    },
    removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    setPendingRewards: (val) => set({ pendingRewards: val }),
  })),
)
