# Tienda

**Every merchant deserves their own chain.**

---

## Vision

Tienda is the Shopify of Web3 for Latin America — an app-specific commerce chain built on Initia that gives every merchant a sovereign, scalable, and radically simple storefront on the blockchain.

No wallets to explain. No gas fees to apologize for. Just commerce, unchained.

---

## The Problem

Latin America has **300 million** digitally connected consumers and a merchant ecosystem exploding with creativity — yet blockchain commerce remains inaccessible:

- **Complexity kills adoption.** Merchants shouldn't need to understand rollups to sell empanadas.
- **Fees eat margins.** Small merchants in LATAM operate on razor-thin margins. L1 gas fees are a non-starter.
- **Trust is fragmented.** Buyers and sellers lack a shared, transparent settlement layer.
- **Existing platforms don't speak the language** — literally or culturally.

The result: Web3 commerce in LATAM is a ghost town, while Web2 platforms extract 15-30% in fees.

---

## The Solution

Tienda is an **app-specific rollup on Initia** purpose-built for LATAM commerce. It collapses the entire merchant experience into three steps:

### How It Works

| Step | Merchant Experience | What Happens Under the Hood |
|------|--------------------|-----------------------------|
| **1. Abre tu tienda** | Sign up with your wallet address. Name your store. Done. | Merchant profile is registered on-chain via the Tienda Move marketplace module. Backend broadcasts the transaction via `@initia/initia.js`. |
| **2. Agrega productos** | Set a name, description, price, and publish. | Product metadata is stored on-chain. Inventory state is managed by the Move module for atomic consistency. |
| **3. Vende y cobra** | Share your store link. Buyers pay. You get paid after delivery. | Funds are held in on-chain escrow. After buyer confirms delivery, escrow is released to the merchant minus a 1.5% platform fee. |

That's it. Three steps. Zero blockchain jargon.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  TIENDA ROLLUP                  │
│              (Initia App-Specific)              │
│                                                 │
│  ┌───────────────────────┐  ┌─────────────────┐ │
│  │     Move Module       │  │   Enshrined     │ │
│  │                       │  │   Liquidity     │ │
│  │  Marketplace          │  │     (IBC)       │ │
│  │  Escrow               │  │   Settlement    │ │
│  │  Loyalty              │  │   Multi-token   │ │
│  │  Reviews              │  │   Payouts       │ │
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

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **L1 Settlement** | Initia | Enshrined liquidity, native IBC, optimized for rollup ecosystems |
| **Rollup Runtime** | MoveVM | Move module for marketplace logic: escrow, inventory, pricing, loyalty, disputes, reviews |
| **Interchain** | IBC via Initia | Cross-chain payments and token transfers (roadmap) |
| **Backend** | Node.js + Express.js | REST API with `@initia/initia.js` SDK integration, Joi validation, rate limiting, structured logging |
| **Frontend** | HTML/CSS/JS | Handcrafted landing page with responsive design and animations |
| **Storage** | IPFS + Pinata | Decentralized product media storage (roadmap) |

---

## Key Features

- **On-Chain Marketplace** — Full marketplace logic in a single Move module: merchant registration, product listings, order lifecycle, escrow, disputes.
- **Escrow-Based Buyer Protection** — Funds are locked on order creation and released to the merchant only after delivery confirmation. 7-day timeout auto-release prevents funds from being locked forever.
- **Dispute Resolution** — Buyers can open disputes within 3 days of delivery. Admin resolves in favor of buyer (full refund + stock restore) or merchant (escrow release).
- **Loyalty Programs On-Chain** — Programmable rewards via Move modules. Buyers earn 100 points per TIENDA spent; points are redeemable as discounts on future orders.
- **Reputation System** — On-chain reviews (1-5 stars) tied to completed orders. One review per order, aggregated into merchant ratings.
- **1.5% Platform Fee** — Configurable via basis points. Lower than any major LATAM e-commerce platform.
- **Initia SDK Integration** — Backend uses `@initia/initia.js` to broadcast transactions to the Tienda Move module on Initia testnet.

---

## Project Structure

```
05-Tienda/
├── README.md
├── src/
│   ├── frontend/          # Landing page
│   │   └── index.html
│   ├── contracts/
│   │   └── marketplace.move  # Move module (marketplace, escrow, loyalty, reviews)
│   └── backend/
│       └── server.js      # Express.js API with @initia/initia.js integration
├── docs/                  # Technical documentation & audit report
├── pitch/                 # Pitch deck & demo materials
└── marketing/             # Brand assets
```

---

## Team

| Role | Responsibility |
|------|---------------|
| **Product Lead** | Vision, UX strategy, merchant research |
| **Blockchain Engineer** | Move modules, rollup config, on-chain integration |
| **Full-Stack Engineer** | Node.js backend, API design, Initia SDK integration |
| **Designer** | UI/UX, brand identity, landing page |

---

## Hackathon Submission Checklist

- [x] Project README with vision, architecture, and tech stack
- [x] Landing page (live demo)
- [x] Smart contract (Move module: marketplace with escrow, disputes, loyalty, reviews)
- [ ] Smart contract deployment on Initia testnet
- [x] Backend API (merchant onboarding, product CRUD, order flow, Initia SDK integration)
- [ ] Mobile app prototype (React Native) — planned for post-hackathon
- [x] Pitch deck
- [ ] Demo video (3 min max)
- [ ] DoraHacks BUIDL submission

---

## Why Initia?

Initia isn't just another L1 — it's the **app-chain thesis done right**. For Tienda, this means:

1. **Enshrined Liquidity** — We don't need to bootstrap our own liquidity. Initia's L1 provides it natively across all rollups.
2. **MoveVM** — Move's resource-oriented programming model provides the safety guarantees needed for financial logic: escrow, atomic inventory updates, and provable ownership.
3. **Native IBC** — Cross-chain payments work out of the box. A buyer on another Initia rollup can purchase from a Tienda merchant seamlessly.
4. **Optimistic Rollup Performance** — Sub-second finality for commerce. No merchant waits 12 seconds to confirm a sale.

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/your-org/tienda.git
cd tienda

# Install dependencies
npm install

# Start the development server
npm run dev

# Deploy contracts to Initia testnet
npm run deploy:testnet
```

---

## License

MIT

---

<p align="center">
  <strong>Built with conviction at INITIATE: The Initia Hackathon Season 1</strong><br>
  <em>Commerce without borders. Chains without complexity.</em>
</p>
