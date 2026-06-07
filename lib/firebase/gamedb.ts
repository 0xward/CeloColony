import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
  collection, query, orderBy, limit, getDocs, onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'
import type { GameState, LeaderboardEntry, FeedEntry } from '@/types/game'
import { calcScore } from '@/lib/game/engine'

// ─── Save colony to Firestore ─────────────────────────────────────────────────
export async function saveColony(address: string, state: GameState): Promise<void> {
  const ref = doc(db, 'colonies', address.toLowerCase())
  await setDoc(
    ref,
    {
      colony:       state.colony,
      resources:    state.resources,
      buildings:    state.buildings,
      activeEvent:  state.activeEvent,
      lastSaved:    serverTimestamp(),
      score:        calcScore(state),
    },
    { merge: true },
  )
}

// ─── Load colony from Firestore ───────────────────────────────────────────────
export async function loadColony(address: string): Promise<Partial<GameState> | null> {
  const ref  = doc(db, 'colonies', address.toLowerCase())
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    colony:      data.colony,
    resources:   data.resources,
    buildings:   data.buildings ?? [],
    activeEvent: data.activeEvent ?? null,
    lastSaved:   data.lastSaved?.toMillis?.() ?? Date.now(),
  }
}

// ─── Upsert player profile ────────────────────────────────────────────────────
export async function upsertPlayer(address: string, name?: string): Promise<void> {
  const ref = doc(db, 'players', address.toLowerCase())
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      address:    address.toLowerCase(),
      name:       name ?? `Commander_${address.slice(2, 6).toUpperCase()}`,
      joinedAt:   serverTimestamp(),
      lastActive: serverTimestamp(),
    })
  } else {
    await updateDoc(ref, { lastActive: serverTimestamp() })
  }
}

// ─── Get player name ──────────────────────────────────────────────────────────
export async function getPlayerName(address: string): Promise<string> {
  const ref  = doc(db, 'players', address.toLowerCase())
  const snap = await getDoc(ref)
  if (!snap.exists()) return `Commander_${address.slice(2, 6).toUpperCase()}`
  return snap.data().name ?? `Commander_${address.slice(2, 6).toUpperCase()}`
}

// ─── Update leaderboard entry ─────────────────────────────────────────────────
export async function updateLeaderboard(address: string, state: GameState): Promise<void> {
  const name = await getPlayerName(address)
  const ref  = doc(db, 'leaderboard', address.toLowerCase())
  const entry: LeaderboardEntry = {
    address:        address.toLowerCase(),
    name,
    level:          state.colony.level,
    population:     state.resources.population,
    totalBuildings: state.buildings.length,
    score:          calcScore(state),
    celoSpent:      state.colony.totalCeloSpent,
  }
  await setDoc(ref, entry, { merge: true })
}

// ─── Subscribe to leaderboard ─────────────────────────────────────────────────
export function subscribeLeaderboard(
  cb: (entries: LeaderboardEntry[]) => void,
): Unsubscribe {
  const q = query(collection(db, 'leaderboard'), orderBy('score', 'desc'), limit(20))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => d.data() as LeaderboardEntry))
  })
}

// ─── Add feed entry ───────────────────────────────────────────────────────────
export async function addFeedEntry(
  address: string,
  action: FeedEntry['action'],
  detail: string,
): Promise<void> {
  const name = await getPlayerName(address)
  const ref  = doc(collection(db, 'feed'))
  await setDoc(ref, {
    id:          ref.id,
    playerName:  name,
    playerAddr:  address.toLowerCase(),
    action,
    detail,
    timestamp:   Date.now(),
  })
}

// ─── Subscribe to live feed ───────────────────────────────────────────────────
export function subscribeFeed(cb: (entries: FeedEntry[]) => void): Unsubscribe {
  const q = query(collection(db, 'feed'), orderBy('timestamp', 'desc'), limit(30))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => d.data() as FeedEntry))
  })
}
