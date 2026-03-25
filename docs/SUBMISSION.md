# Tienda -- INITIATE Hackathon Submission

**Track:** Commerce / DeFi
**Deadline:** April 16, 2026
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
- **Fees eat margins.** MercadoLibre charges up to 30% in commissions and fees. Rappi, iFood, and other delivery platforms take 20-35%. Small merchants in LATAM operate on razor-thin margins -- these fees are existential.
- **Trust is fragmented.** Buyers and sellers lack a shared, transparent settlement layer. Chargebacks and fraud cost merchants billions.
- **Existing platforms don't speak the language** -- literally or culturally.

**The math is simple:** A merchant selling COP $1,000,000/month on MercadoLibre loses COP $300,000 to fees. On Tienda, that same merchant pays COP $15,000. That is **1.5% vs 30%** -- a 20x reduction in platform costs. For a small coffee shop, that difference is rent.

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

1. **Enshrined Liquidity** -- No need to bootstrap our own liquidity. Initia L1 provides it natively across all rollups. Merchants get paid in any token.
2. **MoveVM** -- Resource-oriented programming gives safety guarantees for financial logic: escrow, atomic inventory updates, provable ownership. No reentrancy bugs.
3. **Native IBC** -- Cross-chain payments work out of the box. Buyers on any Initia rollup can purchase from Tienda merchants seamlessly.
4. **Optimistic Rollup Performance** -- Sub-second finality for commerce. No merchant waits 12 seconds to confirm a sale.

### InterwovenKit Integration

Tienda integrates InterwovenKit (`@initia/interwovenkit-react`) for:

- **Wallet Connection**: One-click wallet connect via `<ConnectButton />`. Supports Initia Wallet, Keplr, and other Cosmos wallets through a unified interface.
- **Auto-Signing Sessions**: Buyers approve once, then browse and buy without repeated wallet popups. Sessions are scoped to marketplace functions only -- cannot drain the wallet. Configurable spending limits and expiry (e.g., 30 minutes, max 100 INIT).
- **Interwoven Bridge**: Cross-rollup asset transfers enabling multi-chain payments. A buyer on another Initia rollup can pay a Tienda merchant without leaving their chain. Enshrined liquidity means no third-party bridge risk.
- **Initia Usernames (.init)**: Merchants claim human-readable names (e.g., `cafemaria.init`) during onboarding. Store URLs become `tienda.app/cafemaria.init`. Payments go to names, not hex addresses.
- **Transaction Signing**: All marketplace operations (order creation, delivery confirmation, reviews) use InterwovenKit's `useSignAndBroadcast` hook for type-safe transaction construction and broadcasting.

### Initia-Native Features Used

1. **App-Specific Rollup (Minitia)**: Tienda runs as its own sovereign chain -- the merchant owns the chain, the data, and the customer relationships. No shared blockspace congestion.
2. **MoveVM Smart Contracts**: Full marketplace logic (escrow, disputes, loyalty, reviews) in a single Move module with resource-oriented safety.
3. **Enshrined Liquidity via IBC**: Multi-token payments without liquidity fragmentation.
4. **InterwovenKit**: Wallet UX, auto-signing sessions, cross-chain bridge, and .init usernames.

---

## Key Features

- **On-Chain Marketplace** -- Full marketplace logic in a single Move module: merchant registration, product listings, order lifecycle, escrow, disputes.
- **Escrow-Based Buyer Protection** -- Funds locked on order creation, released to merchant only after delivery confirmation. 7-day timeout auto-release prevents lockups.
- **Dispute Resolution** -- Buyers can open disputes within 3 days of delivery. Admin resolves in favor of buyer (full refund + stock restore) or merchant (escrow release).
- **Loyalty Programs On-Chain** -- Programmable rewards via Move modules. Buyers earn 100 points per TIENDA spent; points redeemable as discounts.
- **Reputation System** -- On-chain reviews (1-5 stars) tied to completed orders. One review per order, aggregated into merchant ratings.
- **1.5% Platform Fee** -- Configurable via basis points. Compared to MercadoLibre (13-30%), Rappi (20-30%), or Amazon (8-15%), this is a radical reduction.
- **Merchant Analytics** -- Revenue tracking, top products, conversion rates, exportable order data.

---

## Architecture

```
+---------------------------------------------------+
|                  TIENDA ROLLUP                     |
|              (Initia App-Specific)                 |
|                                                    |
|  +-------------------------+  +-----------------+  |
|  |     Move Module         |  |   Enshrined     |  |
|  |  Marketplace            |  |   Liquidity     |  |
|  |  Escrow                 |  |   (IBC)         |  |
|  |  Loyalty                |  |   Settlement    |  |
|  |  Reviews                |  |   Multi-token   |  |
|  +-------------------------+  +-----------------+  |
+---------------------------------------------------+
|              INITIA L1 (Settlement)                |
+---------------------------------------------------+
          |                          |
    +-----+-----+            +------+------+
    |  Frontend  |            |   Node.js   |
    |  (React +  |            |   Backend   |
    | Interwoven |            | (Express +  |
    |    Kit)    |            | initia.js)  |
    +-----------+            +-------------+
```

## Tech Stack

| Layer              | Technology                                   |
|--------------------|----------------------------------------------|
| L1 Settlement      | Initia                                       |
| Rollup Runtime     | MoveVM (Minitia)                             |
| Interchain         | IBC via Initia + InterwovenKit               |
| Backend            | Node.js + Express.js + @initia/initia.js     |
| Frontend           | React + InterwovenKit                        |
| Smart Contracts    | Move (marketplace.move)                      |
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

## Demo: What Works Today

### Backend API (Fully Functional)

The Express.js backend is complete and demo-ready with:

- **Merchant onboarding**: Register store, update profile, list merchants
- **Product catalog**: Full CRUD with validation, categories, tags, shipping info
- **Order lifecycle**: Create order -> escrow lock -> ship -> deliver -> complete -> escrow release
- **Escrow flow**: Funds locked on order creation, released on completion, refunded on cancellation
- **Dispute resolution**: Buyer opens dispute on delivered orders
- **Loyalty program**: Points earned on completed orders (100 pts/INIT), redeemable as discounts
- **Search**: Full-text search across products with category, price, location filters and sorting
- **Reviews**: 1-5 star ratings tied to completed orders, aggregated into merchant scores
- **Analytics**: Revenue tracking, top products, daily sales, export

Seeded with "Cafe Maria" -- a Colombian coffee merchant with 5 products, 3 orders, and 3 reviews.

### Move Smart Contract (Complete)

`marketplace.move` implements the full marketplace logic:
- Merchant registration and profile management
- Product listing with atomic inventory
- Order creation with escrow
- Delivery confirmation and escrow release
- Dispute resolution (buyer refund or merchant release)
- Loyalty point minting and redemption
- Review system with aggregated ratings
- 1.5% platform fee (150 basis points)

### Deployment Status (Honest Assessment)

- **Move module**: Written, compiling, not yet deployed to testnet
- **Minitia rollup**: Configuration ready, not yet registered on Initia L1
- **InterwovenKit**: Integration code written, pending frontend build with React
- **Backend**: Fully functional, tested, running locally with seed data

We are actively working on testnet deployment. The core logic is complete and audited. What remains is infrastructure setup (Minitia registration, node operation) and frontend integration with InterwovenKit.

---

## API Endpoints

| Method | Endpoint                          | Description                         |
|--------|-----------------------------------|-------------------------------------|
| GET    | /health                           | Health check with stats             |
| POST   | /api/v1/merchants                 | Register a new merchant             |
| GET    | /api/v1/merchants                 | List/search merchants               |
| GET    | /api/v1/merchants/:id             | Get merchant profile                |
| PUT    | /api/v1/merchants/:id             | Update merchant profile             |
| POST   | /api/v1/products                  | Create a product listing            |
| GET    | /api/v1/products/:id              | Get product details                 |
| PUT    | /api/v1/products/:id              | Update a product                    |
| DELETE | /api/v1/products/:id              | Deactivate a product                |
| GET    | /api/v1/search                    | Search products with filters        |
| GET    | /api/v1/categories                | List categories with counts         |
| POST   | /api/v1/orders                    | Create order (escrow lock)          |
| GET    | /api/v1/orders/:id                | Get order details                   |
| PATCH  | /api/v1/orders/:id/ship           | Mark as shipped (merchant)          |
| PATCH  | /api/v1/orders/:id/deliver        | Confirm delivery (buyer)            |
| PATCH  | /api/v1/orders/:id/complete       | Complete order (release escrow)     |
| PATCH  | /api/v1/orders/:id/cancel         | Cancel order (refund escrow)        |
| PATCH  | /api/v1/orders/:id/dispute        | Open dispute (buyer)                |
| POST   | /api/v1/orders/:id/review         | Submit review                       |
| GET    | /api/v1/merchants/:id/reviews     | Get merchant reviews                |
| GET    | /api/v1/loyalty/:address          | Get loyalty balance                 |
| POST   | /api/v1/payments/estimate         | Estimate order cost                 |
| GET    | /api/v1/analytics/:id             | Merchant analytics dashboard        |

---

## Demo Video Script (3 minutes)

### [0:00 - 0:20] Hook
"In Latin America, 300 million consumers are online -- but the platforms they use take 30% of every sale. Introducing Tienda: a sovereign commerce chain where merchants pay 1.5%."

### [0:20 - 0:55] Problem
Show the fee comparison: MercadoLibre 30%, Rappi 25%, Amazon 15%. Show a small merchant losing money. "For a coffee shop making $1000/month, that is $300 gone. On Tienda, it is $15."

### [0:55 - 1:40] Solution Demo
Walk through the three-step merchant experience:
1. **Abre tu tienda** -- Connect wallet via InterwovenKit, name the store
2. **Agrega productos** -- Add coffee products with prices in INIT
3. **Vende y cobra** -- Buyer places order, escrow locks funds, delivery confirmed, merchant gets paid at 1.5%

### [1:40 - 2:15] Initia Integration
Show the architecture. Explain:
- "Tienda runs as its own Minitia on Initia -- the merchant owns the chain"
- "Move modules handle all logic: escrow, disputes, loyalty, reviews"
- "InterwovenKit gives us wallet connect, auto-signing sessions, and the bridge"
- "Enshrined liquidity means buyers can pay in any token"

### [2:15 - 2:40] Differentiators
- "1.5% vs 30% -- 20x cheaper"
- "The merchant owns their chain, their data, and their customer relationships"
- "On-chain escrow protects both parties"
- "Built for LATAM: Spanish-first, culturally native"

### [2:40 - 3:00] Close
"Tienda is the Shopify of Web3 for Latin America. Built on Initia. Powered by Move. Every merchant deserves their own chain. Abre tu tienda."

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/xpandia/tienda.git
cd tienda

# Start the backend
cd src/backend
npm install
npm start
# Server runs on http://localhost:3000

# Test the API
curl http://localhost:3000/health
curl http://localhost:3000/api/v1/search?q=cafe
curl http://localhost:3000/api/v1/merchants
```

---

## Links

- **GitHub:** https://github.com/xpandia/tienda
- **Live Demo:** [TBD after deployment]
- **DoraHacks BUIDL:** [TBD after submission]
- **Demo Video:** [TBD after recording]

---

## License

MIT
