# Tienda -- INITIATE Hackathon Submission

**Track:** Commerce / DeFi
**Deadline:** April 15, 2026
**Platform:** DoraHacks BUIDL
**Repo:** https://github.com/xpandia/tienda

---

## Project Name

Tienda

## Tagline

Every merchant deserves their own chain.

## One-Liner

Tienda is the Shopify of Web3 for Latin America -- an app-specific commerce rollup built on Initia that gives every merchant a sovereign, scalable, and radically simple storefront on the blockchain.

---

## Problem Statement

Latin America has 300 million digitally connected consumers and a merchant ecosystem exploding with creativity -- yet blockchain commerce remains inaccessible:

- **Complexity kills adoption.** Merchants should not need to understand rollups to sell empanadas.
- **Fees eat margins.** Small merchants in LATAM operate on razor-thin margins. L1 gas fees are a non-starter.
- **Trust is fragmented.** Buyers and sellers lack a shared, transparent settlement layer.
- **Existing platforms don't speak the language** -- literally or culturally.

Web2 platforms extract 15-30% in fees. Tienda charges 1.5%.

## Solution

Tienda is an app-specific rollup on Initia purpose-built for LATAM commerce. The entire merchant experience collapses into three steps:

| Step | Merchant Experience | Under the Hood |
|------|--------------------|--------------------------------------------|
| **1. Abre tu tienda** | Sign up with your wallet. Name your store. Done. | Merchant profile registered on-chain via Move module. |
| **2. Agrega productos** | Set name, description, price, publish. | Product metadata stored on-chain with atomic inventory management. |
| **3. Vende y cobra** | Share your store link. Buyers pay. You get paid after delivery. | Escrow holds funds; released after buyer confirms delivery. 1.5% fee. |

Three steps. Zero blockchain jargon.

---

## Why Initia?

1. **Enshrined Liquidity** -- No need to bootstrap our own liquidity. Initia L1 provides it natively across all rollups.
2. **MoveVM** -- Resource-oriented programming gives safety guarantees for financial logic: escrow, atomic inventory updates, provable ownership.
3. **Native IBC** -- Cross-chain payments work out of the box. Buyers on any Initia rollup can purchase from Tienda merchants seamlessly.
4. **Optimistic Rollup Performance** -- Sub-second finality for commerce. No merchant waits 12 seconds to confirm a sale.

### InterwovenKit Integration

Tienda leverages InterwovenKit for:
- Cross-rollup asset transfers enabling multi-chain payments
- Shared security model inherited from Initia L1
- Native IBC channels for interchain commerce between Tienda and other Initia ecosystem rollups

---

## Key Features

- **On-Chain Marketplace** -- Full marketplace logic in a single Move module: merchant registration, product listings, order lifecycle, escrow, disputes.
- **Escrow-Based Buyer Protection** -- Funds locked on order creation, released to merchant only after delivery confirmation. 7-day timeout auto-release prevents lockups.
- **Dispute Resolution** -- Buyers can open disputes within 3 days of delivery. Admin resolves in favor of buyer (full refund + stock restore) or merchant (escrow release).
- **Loyalty Programs On-Chain** -- Programmable rewards via Move modules. Buyers earn 100 points per TIENDA spent; points redeemable as discounts.
- **Reputation System** -- On-chain reviews (1-5 stars) tied to completed orders. One review per order, aggregated into merchant ratings.
- **1.5% Platform Fee** -- Configurable via basis points. Lower than any major LATAM e-commerce platform.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  TIENDA ROLLUP                  │
│              (Initia App-Specific)              │
│                                                 │
│  ┌───────────────────────┐  ┌─────────────────┐ │
│  │     Move Module       │  │   Enshrined     │ │
│  │  Marketplace          │  │   Liquidity     │ │
│  │  Escrow               │  │   (IBC)         │ │
│  │  Loyalty              │  │   Settlement    │ │
│  │  Reviews              │  │   Multi-token   │ │
│  └───────────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────┤
│              INITIA L1 (Settlement)             │
└─────────────────────────────────────────────────┘
          │                          │
    ┌─────┴─────┐            ┌──────┴──────┐
    │  Landing  │            │   Node.js   │
    │   Page    │            │   Backend   │
    │  (HTML)   │            │ (Express +  │
    │           │            │ initia.js)  │
    └───────────┘            └─────────────┘
```

## Tech Stack

| Layer              | Technology                                   |
|--------------------|----------------------------------------------|
| L1 Settlement      | Initia                                       |
| Rollup Runtime     | MoveVM                                       |
| Interchain         | IBC via Initia + InterwovenKit               |
| Backend            | Node.js + Express.js + @initia/initia.js     |
| Frontend           | HTML/CSS/JS                                  |
| Storage (roadmap)  | IPFS + Pinata                                |

---

## Team

| Role                   | Responsibility                                        |
|------------------------|-------------------------------------------------------|
| Product Lead           | Vision, UX strategy, merchant research                |
| Blockchain Engineer    | Move modules, rollup config, on-chain integration     |
| Full-Stack Engineer    | Node.js backend, API design, Initia SDK integration   |
| Designer               | UI/UX, brand identity, landing page                   |

---

## Demo Video Script (3 minutes)

### [0:00 - 0:20] Hook
"In Latin America, 300 million consumers are online -- but blockchain commerce is a ghost town. Why? Because Web3 platforms charge too much, explain too little, and don't speak the language. Introducing Tienda."

### [0:20 - 0:55] Problem
Show statistics: Web2 platform fees (15-30%), merchant pain points. Cut to a small merchant in LATAM trying to set up a blockchain storefront -- complexity, gas fees, wallet confusion. "This is broken. Tienda fixes it."

### [0:55 - 1:40] Solution Demo
Walk through the three-step merchant experience:
1. **Abre tu tienda** -- show merchant registration, name the store, instant on-chain registration
2. **Agrega productos** -- add a product with name, description, price. Show it appear on the storefront
3. **Vende y cobra** -- show a buyer placing an order. Show escrow locking funds. Show delivery confirmation releasing payment to merchant at 1.5% fee

### [1:40 - 2:15] Initia Integration
Show the architecture diagram. Explain:
- "Tienda runs as an app-specific rollup on Initia"
- "Move modules handle all marketplace logic: escrow, disputes, loyalty, reviews"
- "Enshrined liquidity means merchants get paid in any token"
- "InterwovenKit enables cross-rollup commerce"
- "IBC connects Tienda to the entire Cosmos ecosystem"

### [2:15 - 2:40] Differentiators
- "1.5% platform fee vs 15-30% on Web2"
- "On-chain escrow protects both buyers and sellers"
- "Loyalty rewards are programmable and on-chain"
- "Built for LATAM: culturally native, language-first"

### [2:40 - 3:00] Close
"Tienda is the Shopify of Web3 for Latin America. Built on Initia. Powered by Move. Commerce without borders, chains without complexity. Abre tu tienda."

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/xpandia/tienda.git
cd tienda

# Install dependencies
npm install

# Set environment variables
export INITIA_RPC="https://lcd.testnet.initia.xyz"
export INITIA_CHAIN_ID="initiation-2"
export MNEMONIC="your mnemonic phrase here"

# Start the development server
npm run dev

# Deploy Move module to Initia testnet
npm run deploy:testnet

# Open the frontend
open src/frontend/index.html
```

### API Endpoints

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| POST   | /api/merchants        | Register a new merchant        |
| POST   | /api/products         | Create a product listing       |
| GET    | /api/products         | List all products              |
| POST   | /api/orders           | Place an order (creates escrow)|
| POST   | /api/orders/:id/confirm | Confirm delivery (release escrow) |
| POST   | /api/orders/:id/dispute | Open a dispute               |

---

## Links

- **GitHub:** https://github.com/xpandia/tienda
- **Live Demo:** [TBD after deployment]
- **DoraHacks BUIDL:** [TBD after submission]
- **Demo Video:** [TBD after recording]

---

## License

MIT
