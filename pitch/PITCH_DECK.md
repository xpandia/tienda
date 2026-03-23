# TIENDA — Pitch Deck

### Tu tienda. Tu cadena. Tu futuro.

**INITIATE: The Initia Hackathon Season 1**

---

## Slide 1: The Opening

> *"300 million people are shopping on their phones right now across Latin America.*
> *And not a single one of them is using a blockchain."*

Let that sink in.

**TIENDA**
*Commerce, unchained.*

---

## Slide 2: The World Has Changed

The largest consumer revolution in history is happening in Latin America.

- **300M+** digitally connected consumers
- **$120B+** e-commerce market, growing 25% YoY
- **87%** of transactions happen on mobile
- A generation of entrepreneurs building businesses from their phones

The infrastructure is ready. The people are ready.

But the tools? The tools are stuck in 2015.

---

## Slide 3: The Problem

**Web2 platforms are taxing Latin American merchants into poverty.**

| Platform | Take Rate | Settlement | Control |
|----------|-----------|------------|---------|
| MercadoLibre | 16-30% | 14-21 days | Their rules |
| Rappi | 20-35% | 7-14 days | Their algorithm |
| Instagram Shops | 5% + ad spend | 3-5 days | Their reach |

A merchant in Bogota selling handmade bags keeps as little as **65 cents of every dollar**.

The rest? Platform fees. Payment processing. Currency conversion. Chargebacks.

And the alternative -- Web3 -- asks them to understand rollups, seed phrases, and gas fees just to get started.

**That is not a solution. That is an insult.**

---

## Slide 4: The Insight

Here is what everyone in crypto gets wrong about commerce:

> *"Merchants don't want to be on the blockchain.*
> *They want to be in business."*

They don't care about consensus mechanisms.
They care about getting paid.
They care about owning their customer relationships.
They care about not giving 30% to a platform that treats them like inventory.

So we asked one simple question:

**What if a merchant could have their own chain -- and never know it?**

---

## Slide 5: The Solution

**TIENDA**
*The Shopify of Web3 for Latin America.*

An app-specific commerce chain built on Initia that gives every merchant a sovereign, scalable storefront on the blockchain.

No wallets to explain.
No gas fees to apologize for.
No bridges to cross.

Three steps. That is it.

---

## Slide 6: How It Works

### Step 1 — Abre tu tienda
Sign up with your phone number. Name your store. Done.
*Under the hood: a sovereign storefront contract deploys on the Tienda rollup. Account abstraction handles wallet creation silently.*

### Step 2 — Agrega productos
Take a photo. Set a price. Tap publish.
*Under the hood: product metadata lives on-chain with IPFS-pinned media. Move modules handle inventory with atomic consistency.*

### Step 3 — Vende y cobra
Share your store link. Buyers pay. You get paid -- instantly.
*Under the hood: Initia's enshrined liquidity handles cross-chain settlement. Funds arrive in the merchant's preferred currency via IBC.*

**Time from download to first sale: under 5 minutes.**

---

## Slide 7: The Architecture

```
┌─────────────────────────────────────────────────┐
│                 TIENDA ROLLUP                   │
│            (Initia App-Specific Chain)          │
│                                                 │
│  ┌───────────┐  ┌───────────┐  ┌─────────────┐ │
│  │   Move    │  │ CosmWasm  │  │  Enshrined   │ │
│  │  Modules  │  │ Contracts │  │  Liquidity   │ │
│  │           │  │           │  │    (IBC)     │ │
│  │ Inventory │  │ Storefront│  │  Settlement  │ │
│  │  Pricing  │  │  Orders   │  │  Multi-token │ │
│  │  Loyalty  │  │  Reviews  │  │   Payouts    │ │
│  └───────────┘  └───────────┘  └─────────────┘ │
├─────────────────────────────────────────────────┤
│             INITIA L1 (Settlement)              │
└─────────────────────────────────────────────────┘
```

**Why this matters:**
- Move for financial precision (inventory, pricing, loyalty)
- CosmWasm for flexible storefront logic (orders, reviews)
- Enshrined liquidity for instant, bridgeless settlement
- All on one chain. No bridges. No fragmentation.

---

## Slide 8: Why Initia

This product is **impossible** without Initia. Here is why:

| Initia Capability | What It Unlocks for Tienda |
|-------------------|---------------------------|
| **App-Specific Rollup** | A chain purpose-built for commerce -- not shared with DEXes, NFT mints, or memecoins |
| **Enshrined Liquidity** | No bootstrapping liquidity pools. Instant multi-currency settlement from day one |
| **Multi-VM (Move + CosmWasm)** | Financial-grade precision AND flexible contract logic on the same chain |
| **Native IBC** | A buyer on any Initia rollup can purchase from any Tienda merchant. Zero bridges |
| **Sub-second Finality** | No merchant waits 12 seconds to confirm a $3 sale |

Initia is not our infrastructure choice.
**Initia is our unfair advantage.**

---

## Slide 9: The Market

### TAM: $120B
LATAM e-commerce (growing 25% YoY)

### SAM: $18B
SMB merchants underserved by current platforms (street vendors, artisans, micro-brands, social sellers)

### SOM: $600M (Year 3)
50,000 merchants in Colombia, Mexico, and Argentina

**The merchants we are targeting are not on Shopify.**
They are on WhatsApp and Instagram, doing commerce with screenshots and bank transfers.
They are ready for something better. They just need it to be simple.

---

## Slide 10: Business Model

Two revenue streams. Both grow with the merchant.

### 1. SaaS Subscriptions
| Tier | Price | For |
|------|-------|-----|
| **Gratis** | $0/mo | First 50 products, basic storefront |
| **Crece** | $9/mo | Unlimited products, analytics, custom domain |
| **Escala** | $29/mo | Multi-store, API access, loyalty programs, priority support |

### 2. Transaction Fees
- **1.5%** per transaction (vs. 16-30% on Web2 platforms)
- Merchants save 10-20x on platform fees
- At scale: 10K merchants x $5K avg monthly GMV x 1.5% = **$9M ARR from tx fees alone**

**Combined Year 3 target: $12.6M ARR**

The beauty: every merchant we onboard makes the chain more valuable. Network effects compound.

---

## Slide 11: Traction & Roadmap

### Built During This Hackathon
- Tienda rollup deployed on Initia testnet
- Move modules: inventory management, dynamic pricing, loyalty tokens
- CosmWasm contracts: storefront deployment, order lifecycle, on-chain reviews
- React Native mobile app (merchant + buyer flows)
- Landing page with live demo
- Account abstraction: phone-number onboarding, zero gas UX

### Roadmap
| Quarter | Milestone |
|---------|-----------|
| **Q2 2026** | Closed beta -- 100 merchants in Bogota |
| **Q3 2026** | Public launch Colombia. Fiat on/off ramp integration |
| **Q4 2026** | Expand to Mexico City & Buenos Aires |
| **Q1 2027** | 10,000 merchants. Series Seed raise |
| **2027+** | Marketplace discovery layer. Cross-rollup commerce protocol |

---

## Slide 12: The Close

> *"Every few decades, a technology comes along that changes how commerce works.*
>
> *The printing press gave us catalogs.*
> *The internet gave us e-commerce.*
> *The smartphone gave us mobile payments.*
>
> *The app-chain gives us something we have never had before:*
> ***a store that no one can take away from you.***
>
> *Tienda is that store.*
> *Built on Initia.*
> *Built for Latin America.*
> *Built for the 300 million people who deserve better than a 30% platform tax."*

**Tu tienda. Tu cadena. Tu futuro.**

---

*One more thing.*

Every Tienda merchant -- from the woman selling arepas in Medellin to the designer in Mexico City -- will own their storefront, their data, their customer relationships, and their revenue.

Not rent them. **Own them.**

That is not a feature.
That is a revolution.

---

**TIENDA**
*Commerce, unchained.*

INITIATE: The Initia Hackathon Season 1
