import { parseEther, formatEther, type PublicClient, type WalletClient } from 'viem'
import { COLONY_ABI, COLONY_CONTRACT_ADDRESS }                           from './config'
import type { BuildingType }                                             from '@/types/game'
import { BUILDINGS }                                                     from '@/lib/game/constants'

// ─── Building type → uint8 index ─────────────────────────────────────────────
const BUILDING_INDEX: Record<BuildingType, number> = {
  power_reactor:    0,
  minipay_station:  1,
  mento_bank:       2,
  ubeswap_market:   3,
  gooddollar_hub:   4,
  valora_terminal:  5,
  opera_hub:        6,
  research_lab:     7,
}

// ─── Purchase a building (on-chain) ──────────────────────────────────────────
export async function purchaseBuildingOnChain(
  walletClient: WalletClient,
  publicClient: PublicClient,
  type: BuildingType,
): Promise<`0x${string}`> {
  const celoCost = BUILDINGS[type].cost.celo
  const value    = parseEther(celoCost)
  const account  = walletClient.account!

  const hash = await walletClient.writeContract({
    address:      COLONY_CONTRACT_ADDRESS,
    abi:          COLONY_ABI,
    functionName: 'purchaseBuilding',
    args:         [BUILDING_INDEX[type]],
    value,
    account,
    chain:        walletClient.chain,
  })

  // Wait for 1 confirmation
  await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 })
  return hash
}

// ─── Upgrade a building (on-chain) ───────────────────────────────────────────
export async function upgradeBuildingOnChain(
  walletClient: WalletClient,
  publicClient: PublicClient,
  slotIndex: number,
  newLevel: number,
  celoCost: string,
): Promise<`0x${string}`> {
  const value   = parseEther(celoCost)
  const account = walletClient.account!

  const hash = await walletClient.writeContract({
    address:      COLONY_CONTRACT_ADDRESS,
    abi:          COLONY_ABI,
    functionName: 'upgradeBuilding',
    args:         [slotIndex, newLevel],
    value,
    account,
    chain:        walletClient.chain,
  })

  await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 })
  return hash
}

// ─── Get CELO balance ─────────────────────────────────────────────────────────
export async function getCeloBalance(
  publicClient: PublicClient,
  address: `0x${string}`,
): Promise<string> {
  const bal = await publicClient.getBalance({ address })
  return parseFloat(formatEther(bal)).toFixed(4)
}

// ─── Get pending rewards ──────────────────────────────────────────────────────
export async function getPendingRewards(
  publicClient: PublicClient,
  address: `0x${string}`,
): Promise<string> {
  const raw = await publicClient.readContract({
    address:      COLONY_CONTRACT_ADDRESS,
    abi:          COLONY_ABI,
    functionName: 'pendingRewards',
    args:         [address],
  })
  return formatEther(raw as bigint)
}

// ─── Claim reward ─────────────────────────────────────────────────────────────
export async function claimReward(
  walletClient: WalletClient,
  publicClient: PublicClient,
): Promise<`0x${string}`> {
  const account = walletClient.account!
  const hash    = await walletClient.writeContract({
    address:      COLONY_CONTRACT_ADDRESS,
    abi:          COLONY_ABI,
    functionName: 'claimReward',
    args:         [],
    account,
    chain:        walletClient.chain,
  })
  await publicClient.waitForTransactionReceipt({ hash })
  return hash
}
