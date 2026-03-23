# TIENDA -- Investor Brief

**Confidential | March 2026**

---

## A. ONE-LINER (YC Style)

Tienda is the Shopify of Web3 for Latin America -- giving every merchant a sovereign, blockchain-powered storefront with zero crypto complexity.

---

## B. PROBLEM (With Data)

### Quantified Pain Point

- **300M+ digitally connected consumers** in Latin America, with a **$120B+ e-commerce market** growing 25% YoY (Statista, eMarketer, 2025).
- **87% of LATAM e-commerce transactions** happen on mobile (GSMA, 2025).
- Web2 platforms extract **16-35% in fees** from merchants:
  - MercadoLibre: 16-30% + 14-21 day settlement
  - Rappi: 20-35% + 7-14 day settlement
  - Instagram Shops: 5% + mandatory ad spend to get visibility
- A merchant in Bogota selling handmade bags keeps as little as **$0.65 of every dollar**.
- **Millions of micro-merchants** operate on WhatsApp and Instagram using screenshots and bank transfers -- no formal e-commerce infrastructure.
- Web3 commerce adoption in LATAM is near zero because existing blockchain tools require understanding rollups, seed phrases, and gas fees.

### Current Solutions and Why They Fail

| Solution | Failure Mode |
|----------|-------------|
| **MercadoLibre** | 16-30% take rate. 14-21 day settlement. Merchant is subordinate to platform algorithm. |
| **Shopify** | Designed for US/EU merchants. $39+/mo. English-first. Not mobile-native. |
| **Instagram/WhatsApp commerce** | No payment infrastructure. No inventory management. Screenshots as invoices. |
| **Existing Web3 marketplaces** (OpenSea, etc.) | NFT-focused, not general commerce. Require crypto literacy. |
| **Local POS/payment apps** (Clip, SumUp) | Payment only. No storefront. No online presence. No inventory management. |

The core insight: **merchants do not want to be on the blockchain. They want to be in business.** The blockchain should be invisible.

---

## C. SOLUTION

### How Tienda Is 10x Better

Tienda is an **app-specific rollup on Initia** purpose-built for LATAM commerce. It collapses the entire merchant experience into three steps:

1. **Abre tu tienda** -- Sign up with your phone number. Name your store. Done. (Under the hood: sovereign storefront contract deploys on Tienda rollup. Account abstraction handles wallet creation silently.)
2. **Agrega productos** -- Take a photo, set a price, tap publish. (Product metadata on-chain with IPFS-pinned media. Move modules handle inventory.)
3. **Vende y cobra** -- Share your store link. Buyers pay. You get paid instantly. (Initia's enshrined liquidity handles cross-chain settlement. Funds arrive in merchant's preferred currency via IBC.)

**10x improvements:**
- **Fees:** 1.5% vs. 16-35% on Web2 platforms (10-20x cheaper)
- **Settlement:** Instant vs. 7-21 days
- **Ownership:** Merchant owns storefront, data, and customer relationships permanently
- **Onboarding:** Under 5 minutes vs. days/weeks on traditional platforms
- **Zero crypto knowledge required** -- No wallets, gas fees, or seed phrases exposed to user

---

## D. WHY NOW

1. **Initia's multi-VM app-chain architecture.** For the first time, a commerce-specific blockchain can use Move for financial precision and CosmWasm for flexible storefront logic on the same chain, with enshrined liquidity for instant settlement. This infrastructure did not exist 12 months ago.
2. **LATAM mobile commerce explosion.** $120B+ and growing 25% YoY. 87% on mobile. The behavior is happening. The infrastructure is extractive.
3. **Account abstraction maturity.** Social login, sponsored transactions, and invisible wallet creation make blockchain-powered apps feel like Web2. The UX gap has closed.
4. **Stablecoin adoption in LATAM.** Merchants and consumers in Argentina, Colombia, and Mexico are already using USDt/USDC for commerce. The mental model of digital-dollar payments exists.
5. **Anti-platform sentiment.** MercadoLibre and Rappi fee increases in 2024-2025 have created merchant frustration. Timing is ripe for a low-fee alternative.

---

## E. MARKET SIZING

| Metric | Value | Source / Methodology |
|--------|-------|---------------------|
| **TAM** | **$120B** | LATAM e-commerce market (Statista, eMarketer 2025). Growing 25% YoY. |
| **SAM** | **$18B** | SMB merchants underserved by current platforms: street vendors, artisans, micro-brands, social sellers. ~5M merchants x $3,600 avg. annual GMV. |
| **SOM Year 1** | **$12M** | 2,000 merchants x $500/mo avg. GMV = $12M annual GMV. Tienda captures 1.5% = $180K revenue from tx fees + SaaS. |
| **SOM Year 3** | **$600M** | 50,000 merchants x $1,000/mo avg. GMV = $600M annual GMV. Tienda captures $9M+ in tx fees + $3M SaaS = $12M+ ARR. |

---

## F. UNIT ECONOMICS

### LTV Calculation

| Metric | Value | Assumption |
|--------|-------|-----------|
| SaaS subscription (Crece tier) | $9/mo | Core paid tier for active merchants |
| Transaction fee revenue per merchant | $7.50/mo | $500/mo GMV x 1.5% |
| **Monthly ARPU** | **$16.50** | Blended |
| Average retention | 30 months | Merchants depend on storefront for livelihood; high switching cost |
| **Merchant LTV** | **$495** | |

### CAC by Channel

| Channel | Est. CAC | Notes |
|---------|----------|-------|
| WhatsApp word-of-mouth / referral | $3-$8 | LATAM merchants cluster in physical markets; one merchant tells the next |
| Merchant association partnerships | $10-$20 | Co-branded onboarding events |
| Social media organic (Instagram/TikTok) | $8-$15 | Content showcasing merchant success stories |
| Field sales (market-by-market) | $15-$30 | On-the-ground sales reps in mercados centrales |
| Paid digital | $20-$40 | Meta/Google ads targeting LATAM SMBs |

### Key Ratios

| Metric | Value |
|--------|-------|
| **LTV:CAC** | **16-62x** (referral) / **12-25x** (field sales) |
| **Gross margin** | **72-78%** (infrastructure costs: Initia gas, IPFS storage, server) |
| **Burn multiple target** | **<2x** by Month 18 |
| **CAC payback period** | **<1 month** (referral) / **2-3 months** (field sales) |

---

## G. COMPETITIVE MOAT

### Primary Moat: Sovereign Ownership + Platform Economics

Tienda flips the e-commerce model: merchants own their storefronts (smart contracts they control), their data, and their customer relationships. This is structurally impossible on MercadoLibre or Shopify. Once a merchant has a sovereign storefront, migrating back to a platform that takes 30% is irrational.

### Competitive Landscape

| Capability | Tienda | MercadoLibre | Shopify | WhatsApp Commerce | Rappi |
|-----------|--------|-------------|---------|-------------------|-------|
| Take rate | 1.5% | 16-30% | 2.9% + $39/mo | 0% (no infra) | 20-35% |
| Settlement speed | Instant | 14-21 days | 3-5 days | Manual | 7-14 days |
| Merchant owns storefront | Yes (on-chain) | No | Partial | No | No |
| Merchant owns data | Yes | No | Partial | No | No |
| Mobile-native | Yes | Yes | No | Yes | Yes |
| Onboarding time | 5 min | 30+ min | Hours | N/A | Days |
| LATAM-first | Yes | Yes | No | Partial | Yes |
| Multi-currency instant | Yes (IBC) | Limited | Limited | No | No |

### Defensibility Assessment

1. **Structural moat** (strong) -- Sovereign storefront ownership is a category-defining feature. Competitors cannot offer this without rebuilding on blockchain infrastructure.
2. **Network effects** (strong) -- More merchants attract more buyers. More buyers attract more merchants. Cross-rollup commerce via IBC creates inter-chain network effects.
3. **Switching costs** (strong) -- Merchant's on-chain reputation, reviews, and loyalty programs are non-portable.
4. **Cost advantage** (strong) -- 1.5% vs. 16-30%. This is not a marginal improvement. It is a structural economic advantage.
5. **Cultural moat** (moderate) -- LATAM-first design, Spanish-first UX, mobile-first architecture. Global competitors cannot easily replicate cultural fit.

---

## H. GO-TO-MARKET

### Beachhead (First 1,000 Users)

1. **City:** Bogota, Colombia (crypto-friendly regulation, dense merchant ecosystems, team proximity).
2. **Segment:** Artisan markets and mercados centrales. Merchants selling handmade goods, food, clothing -- currently using WhatsApp and Instagram.
3. **Tactic:** In-person onboarding at 10 major markets. "Open your online store in 5 minutes, right now, on your phone." One-on-one demos.
4. **Proof point:** 100 merchants live within first month. Social proof drives organic adoption in tight-knit merchant communities.

### Channel Strategy

| Channel | Motion | Timeline |
|---------|--------|----------|
| Field sales (market-by-market) | On-the-ground reps in mercados centrales, co-working spaces, and SMB events | Month 1-6 |
| WhatsApp organic | Merchant success stories shared in WhatsApp business groups | Month 2+ |
| Instagram/TikTok content | Before/after merchant stories, "5-minute store setup" videos | Month 3+ |
| Merchant association partnerships | Co-branded workshops with local chambers of commerce | Month 4+ |
| Referral program | $5 credit per referred merchant who makes first sale | Month 1+ |

### Viral Coefficient

- **Target k-factor: 1.8+**
- LATAM merchants operate in dense physical clusters (market streets, shopping districts). Success is visible -- neighboring merchants see sales happening and ask "How?"
- Buyers discovering a Tienda storefront see "Powered by Tienda" branding with "Open your own store" CTA.
- Shareable store links on WhatsApp and Instagram drive organic buyer-to-merchant conversion.

### Partnership Strategy

- **Initia** -- Ecosystem grants, flagship app-chain case study, co-marketing
- **Rappi / MercadoLibre merchant communities** -- Target frustrated merchants seeking lower fees
- **Local payment providers** (PSE in Colombia, SPEI in Mexico) -- Fiat on/off ramp integration
- **Micro-lenders** -- Integrate with LATAM micro-lending platforms to offer merchant financing based on on-chain sales data

---

## I. BUSINESS MODEL

### Revenue Streams

| Stream | Pricing | Margin |
|--------|---------|--------|
| **Transaction fees** | 1.5% per transaction | ~85% |
| **SaaS -- Gratis** | $0/mo (50 products, basic storefront) | N/A (acquisition) |
| **SaaS -- Crece** | $9/mo (unlimited products, analytics, custom domain) | ~80% |
| **SaaS -- Escala** | $29/mo (multi-store, API, loyalty programs, priority support) | ~78% |
| **Merchant financing** (Year 2+) | Revenue share on loans underwritten by on-chain sales data | ~60% |
| **Promoted listings / discovery** (Year 3+) | CPM/CPC for marketplace discovery layer | ~90% |

### Unit Economics at Scale (Year 3)

- 50,000 active merchants
- $600M annual GMV
- Transaction fee revenue: $9M
- SaaS revenue: $3.6M (60% on paid tiers)
- **Total ARR: $12.6M**
- **Gross margin: 78%**

### Path to Profitability

- Break-even at ~$4M ARR (achievable Month 18-24)
- Transaction fees scale with GMV, not headcount
- SaaS provides recurring baseline revenue
- Cash flow positive by Q2 2027

---

## J. 3-YEAR FINANCIAL PROJECTIONS

| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| **Active Merchants** | 2,000 | 15,000 | 50,000 |
| **GMV** | $12M | $180M | $600M |
| **Active Buyers** | 20,000 | 300,000 | 1.5M |
| **ARR** | $360K | $4.5M | $12.6M |
| **MRR (end of year)** | $30K | $375K | $1.05M |
| **Gross Margin** | 68% | 74% | 78% |
| **Monthly Burn Rate** | $100K | $250K | $450K |
| **Team Size** | 10 | 25 | 50 |

---

## K. TEAM REQUIREMENTS

### Founding Team Composition

| Role | Priority | Profile |
|------|----------|---------|
| **CEO** | Critical | LATAM operator. Has built consumer/merchant products in the region. Spanish fluent. Understands ground-level merchant culture. |
| **CTO** | Critical | Move + CosmWasm expertise. Full-stack capable. Mobile-first product engineer. |
| **Head of Growth** | High | LATAM field sales and community-driven growth experience. Has scaled a marketplace or mobile app in the region. |

### First 10 Hires

1. Blockchain engineer (Move + CosmWasm)
2. Mobile engineer (React Native)
3. Backend engineer (Node.js, API, indexer)
4. Designer / UX researcher (LATAM-focused)
5. Field sales lead (Bogota)
6. Field sales lead (Mexico City)
7. Community manager (bilingual)
8. Data engineer (on-chain analytics, GMV tracking)
9. Payments / integrations engineer (fiat on/off ramp)
10. Customer success (merchant onboarding)

### Advisory Board

- Executive from MercadoLibre, Rappi, or Clip (LATAM commerce insight)
- Initia core team member
- Shopify or marketplace veteran (marketplace GTM expertise)
- LATAM fintech investor (local fundraising connections)

---

## L. FUNDING ASK

### Amount: $4M Seed Round

| Use of Funds | Allocation | % |
|-------------|-----------|---|
| Engineering (blockchain + mobile + backend) | $1.6M | 40% |
| LATAM go-to-market (field sales in 3 cities) | $1M | 25% |
| Product + design | $500K | 12.5% |
| Fiat on/off ramp integration | $400K | 10% |
| Operations + legal | $300K | 7.5% |
| Reserve | $200K | 5% |

### Milestones Per Tranche

| Tranche | Amount | Milestone |
|---------|--------|-----------|
| **Tranche 1** (close) | $2M | Closed beta: 500 merchants live in Bogota. Mobile app in App Store. Fiat on-ramp integrated. |
| **Tranche 2** (Month 8) | $2M | Public launch in Colombia + Mexico. 5,000 merchants. $50M+ annual GMV run rate. |

### Expected Valuation Range

- **$16M-$24M post-money** (Seed)
- Comparable: LATAM marketplace/commerce startups at seed (Merama $4M seed, Treinta $8M Series A, Addi $15M seed)

---

## M. RISKS AND MITIGATIONS

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | **Merchant adoption friction** -- Even "zero crypto complexity" may be too foreign for traditional merchants | High | In-person onboarding with field sales reps. 5-minute demo on merchant's own phone. Free tier eliminates financial risk. Social proof from neighboring merchants in the same market. |
| 2 | **Initia ecosystem maturity** -- Initia is a new chain; ecosystem may develop slowly | High | Architecture is portable (Move + CosmWasm can deploy on other app-chains). But near-term, Initia's enshrined liquidity and multi-VM support are unique. Bet on Initia ecosystem growing. |
| 3 | **Payment and regulatory complexity** -- Each LATAM country has different payment rails, regulations, and tax requirements | High | Start with Colombia (most favorable). Country-specific compliance modules. Partner with local payment processors for fiat on/off ramp in each market. |
| 4 | **MercadoLibre competitive response** -- Market leader could lower fees or copy features | Medium | MercadoLibre's business model depends on high take rates. Lowering fees would crater their revenue. Tienda's sovereign ownership model is architecturally impossible for a centralized platform to replicate. |
| 5 | **Buyer liquidity / chicken-and-egg problem** -- Merchants join but no buyers find them | High | Not building a marketplace initially -- merchants bring their own buyers via WhatsApp/Instagram links. Tienda is the storefront, not the traffic source. Marketplace discovery layer comes in Year 2-3 after merchant density is sufficient. |

---

## N. EXIT STRATEGY

### Potential Acquirers

| Acquirer | Strategic Rationale | Estimated Value |
|----------|-------------------|-----------------|
| **MercadoLibre** | Acquire the challenger before it scales. Web3 commerce layer for MELI ecosystem. | $300M-$1B |
| **Shopify** | LATAM market entry via blockchain-native, mobile-first platform | $200M-$500M |
| **Block (Square)** | LATAM SMB commerce infrastructure, complements Cash App | $300M-$800M |
| **Rappi** | Reduce merchant fee pressure by owning low-cost storefront infrastructure | $150M-$400M |
| **Initia** | Flagship app-chain becomes core commerce infrastructure | $100M-$250M |

### Comparable Exits

| Company | Event | Value | Year |
|---------|-------|-------|------|
| **Merama** | Raised $225M for LATAM commerce | $1.2B valuation | 2022 |
| **dLocal** | IPO (LATAM payments) | $9B market cap at peak | 2021 |
| **VTEX** | IPO (LATAM e-commerce platform) | $3.5B market cap | 2021 |
| **Addi** | Raised $75M (LATAM BNPL/commerce) | $700M valuation | 2022 |

### IPO Timeline

- Possible at $100M+ ARR (Year 4-5)
- LATAM commerce/payments companies have strong IPO precedent (VTEX, dLocal, StoneCo, PagSeguro)
- Most likely path: Series A at $50M+ (Year 2), Series B at $200M+ (Year 3), IPO or strategic acquisition at $1B+ (Year 5)
- Token launch possible for governance of the commerce chain protocol

---

*Prepared for investor due diligence. All projections are forward-looking estimates based on market research and comparable company analysis. Confidential -- do not distribute without permission.*
