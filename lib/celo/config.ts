import { defineChain } from 'viem'

// ─── Celo Mainnet ─────────────────────────────────────────────────────────────
export const celoMainnet = defineChain({
  id:   42220,
  name: 'Celo',
  nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://forno.celo.org'] },
    public:  { http: ['https://forno.celo.org'] },
  },
  blockExplorers: {
    default: { name: 'Celoscan', url: 'https://celoscan.io' },
  },
})

export const COLONY_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_COLONY_CONTRACT_ADDRESS ?? '0x0000000000000000000000000000000000000000') as `0x${string}`

export const CELO_RPC = 'https://forno.celo.org'

// ─── ABI — CeloColony.sol ─────────────────────────────────────────────────────
export const COLONY_ABI = [
  {
    name: 'purchaseBuilding',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'buildingType', type: 'uint8' }],
    outputs: [],
  },
  {
    name: 'upgradeBuilding',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'buildingSlot', type: 'uint8' },
      { name: 'newLevel',     type: 'uint8' },
    ],
    outputs: [],
  },
  {
    name: 'claimReward',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'pendingRewards',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getPlayerStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [
      { name: 'level',     type: 'uint256' },
      { name: 'buildings', type: 'uint256' },
      { name: 'spent',     type: 'uint256' },
      { name: 'rewards',   type: 'uint256' },
    ],
  },
  // Events
  {
    name: 'BuildingPurchased',
    type: 'event',
    inputs: [
      { name: 'player',       type: 'address', indexed: true },
      { name: 'buildingType', type: 'uint8',   indexed: false },
      { name: 'celoAmount',   type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'BuildingUpgraded',
    type: 'event',
    inputs: [
      { name: 'player',     type: 'address', indexed: true },
      { name: 'slot',       type: 'uint8',   indexed: false },
      { name: 'newLevel',   type: 'uint8',   indexed: false },
      { name: 'celoAmount', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'RewardClaimed',
    type: 'event',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const
