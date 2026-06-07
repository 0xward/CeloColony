# 🌌 Celo Colony — Space City Tycoon

A fullstack, production-grade city tycoon game built on **Celo Mainnet**.
Build colonies, earn CELO, compete on the leaderboard.

---

## Tech Stack

| Layer       | Tech                                      |
|-------------|-------------------------------------------|
| Frontend    | Next.js 14 (App Router) · TypeScript      |
| Styling     | Tailwind CSS · Custom CSS variables       |
| Game engine | HTML5 Canvas 2D (optimized, RAF-based)    |
| State       | Zustand + subscribeWithSelector           |
| Backend DB  | Firebase Firestore + Realtime Database    |
| Auth        | wagmi v2 (wallet-based identity)          |
| Blockchain  | Celo Mainnet (chainId 42220) · viem       |
| Contracts   | Solidity 0.8.20 (Hardhat)                 |
| Deploy      | Vercel (frontend) + Firebase (data)       |

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Firebase setup
1. Go to [Firebase Console](https://console.firebase.google.com) → Create project
2. Enable **Firestore Database** (production mode)
3. Enable **Realtime Database**
4. Go to Project Settings → Add Web App → copy config
5. Set Firestore rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /colonies/{address} {
      allow read: if true;
      allow write: if request.auth == null || true; // Tighten for production
    }
    match /players/{address}  { allow read, write: if true; }
    match /leaderboard/{id}   { allow read: if true; allow write: if true; }
    match /feed/{id}          { allow read: if true; allow write: if true; }
  }
}
```

6. Set Realtime Database rules:
```json
{ "rules": { ".read": true, ".write": true } }
```

### 3. Deploy smart contract (Celo Mainnet)

Install Hardhat in a separate directory or use Remix:

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

`hardhat.config.ts`:
```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    celo: {
      url:      "https://forno.celo.org",
      accounts: [process.env.PRIVATE_KEY!],
      chainId:  42220,
    }
  },
  etherscan: {
    apiKey:    { celo: process.env.CELOSCAN_API_KEY! },
    customChains: [{
      network:   "celo",
      chainId:   42220,
      urls: {
        apiURL:     "https://api.celoscan.io/api",
        browserURL: "https://celoscan.io",
      }
    }]
  }
};
export default config;
```

Deploy:
```bash
npx hardhat run scripts/deploy.ts --network celo
# → Copy contract address to .env
```

Fund the reward pool (so players can claim rewards):
```bash
# Send CELO to contract address via your wallet
# Recommended: fund with at least 10 CELO to start
```

Verify on Celoscan:
```bash
npx hardhat verify --network celo <CONTRACT_ADDRESS>
```

### 4. Environment variables
```bash
cp .env.example .env.local
# Fill in all values
```

### 5. Run locally
```bash
npm run dev
# → http://localhost:3000
```

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel
# Add all NEXT_PUBLIC_* env vars in Vercel dashboard
```

Or connect your GitHub repo to Vercel for automatic deployments.

---

## Game Mechanics

### Resources
| Resource   | Description                          |
|------------|--------------------------------------|
| Gold       | Primary currency, earned by buildings |
| Energy     | Required for colony operation        |
| Materials  | Construction resource                |
| Population | Grows with housing/social buildings  |
| Happiness  | 0-100%, multiplies all income        |

### Buildings (8 types)
Each building costs **real CELO** on Celo Mainnet + virtual resources.
Every purchase is an on-chain transaction recorded on Celoscan.

| Building         | Cost (CELO) | Primary Income |
|-----------------|-------------|----------------|
| Power Reactor   | 0.020       | Energy         |
| MiniPay Station | 0.030       | Gold           |
| Mento Bank      | 0.060       | Gold           |
| Ubeswap Market  | 0.080       | Gold + All     |
| GoodDollar Hub  | 0.040       | Population     |
| Valora Terminal | 0.025       | Energy + Gold  |
| Opera Hub       | 0.070       | Happiness      |
| Research Lab    | 0.120       | Materials      |

### On-chain Economy
- **Spend CELO** → construct and upgrade buildings (real txns on Celo)
- **Earn back 10%** → every purchase adds 10% to your claimable reward pool
- **Claim CELO** → when rewards accumulate, claim directly from contract
- All purchases verified on [Celoscan](https://celoscan.io)

### Berkelanjutan (Continuous) Gameplay
- **Offline income** — buildings generate resources even when you're away (capped at 12h)
- **Synergy bonuses** — adjacent buildings boost each other (+8% per synergy pair)
- **Events system** — random global events every 5 minutes affecting income
- **Level progression** — unlock new building types as colony grows
- **Leaderboard** — compete with real CELO spent on-chain as proof
- **Live feed** — see what other commanders are building in real-time

---

## Project Structure

```
celo-colony/
├── app/
│   ├── page.tsx          # Landing page
│   ├── game/page.tsx     # Game screen
│   └── globals.css       # Global styles
├── components/
│   ├── game/
│   │   ├── GameCanvas.tsx    # Isometric renderer
│   │   ├── HUD.tsx           # Resource bar + wallet
│   │   ├── BuildModal.tsx    # Build + tx flow
│   │   ├── UpgradeModal.tsx  # Upgrade + tx flow
│   │   ├── EventBanner.tsx   # Active event display
│   │   ├── ColonyPanel.tsx   # Bottom sheet
│   │   └── BottomNav.tsx     # Navigation
│   └── landing/
│       └── StarCanvas.tsx    # Animated stars
├── lib/
│   ├── firebase/    # Firestore + Realtime DB
│   ├── celo/        # wagmi config + contract calls
│   └── game/        # Engine, constants, events
├── store/
│   └── gameStore.ts  # Zustand state
├── types/
│   └── game.ts       # All TypeScript types
└── contracts/
    └── CeloColony.sol  # Deploy to Celo Mainnet
```

---

## Roadmap

- [ ] Territory expansion (buy more grid space with CELO)
- [ ] Seasonal leaderboard with CELO prize pool
- [ ] Alliance system (shared colonies)
- [ ] PvP raids (attack rival colonies)
- [ ] NFT buildings (ERC-721 tradeable on secondary markets)
- [ ] Mobile app (via MiniPay browser)
- [ ] DAO governance for game parameters

---

Built on **Celo** · Powered by community
