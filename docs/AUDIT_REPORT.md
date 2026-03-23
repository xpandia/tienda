# TIENDA -- Technical & Strategic Audit Report

**Auditor:** Senior Technical Auditor (Independent)
**Date:** 2026-03-23
**Project:** Tienda -- Commerce Chain for LATAM on Initia
**Hackathon:** INITIATE: The Initia Hackathon Season 1

---

## Executive Summary

Tienda is an ambitious hackathon project positioning itself as "the Shopify of Web3 for Latin America," built as an app-specific rollup on Initia. The project delivers a monolithic Move smart contract for marketplace logic, an Express.js backend API, a polished landing page, and extensive pitch/investor materials. The vision is compelling and the narrative is exceptionally well-crafted. However, the project has significant gaps between what is claimed and what is actually built, particularly around on-chain integration, mobile app delivery, and testnet deployment evidence.

---

## 1. CODE QUALITY -- 7/10

### Strengths
- **Consistent coding standards** across all files. Clean formatting, well-organized sections, and logical file structure.
- **Comprehensive documentation** within code. The Move contract has clear section headers, descriptive doc comments on every function, and well-named error codes (18 distinct error constants).
- **Validation-first approach** in the backend using Joi schemas for all endpoints. Input validation is thorough with proper constraints (min/max lengths, email formats, URI validation, price precision).
- **Proper error handling patterns**: async error wrapper in Express, structured error responses with detail arrays, appropriate HTTP status codes (201, 400, 403, 404, 409).
- **Logging infrastructure**: Winston logger with structured JSON output, request-level logging via Morgan.

### Weaknesses
- **No tests exist.** `package.json` declares `jest --coverage` as the test script, but no test files are present anywhere in the project. For a financial application handling escrow and payments, this is a serious omission.
- **No TypeScript.** The README claims "Node.js + TypeScript" in the tech stack, but `server.js` is plain JavaScript. This is a documentation-code mismatch.
- **No `.env.example` or environment documentation.** The backend uses `dotenv` but provides no guidance on required environment variables.
- **Single-file architecture** for both the contract (1,424 lines) and backend (1,423 lines). These should be modularized for maintainability.

---

## 2. LANDING PAGE -- 8.5/10

### Strengths
- **Exceptional visual design.** The CSS is handcrafted (no framework dependency), with a cohesive warm palette (cream/orange/brown) that feels distinctly LATAM-appropriate without being stereotypical.
- **Sophisticated animations**: scroll-reveal system with IntersectionObserver, floating elements, storefront animation with an awning, door, chain links -- all thematically relevant to the "tienda" (store) concept.
- **Responsive design**: `clamp()` for typography, media queries for layout breakpoints, mobile menu toggle. The hero switches from 2-column to stacked layout correctly.
- **Strong conversion structure**: Hero with dual CTAs, problem section with data, solution cards, 3-step "how it works," merchant features with mockup, buyer benefits, tech stack, and CTA footer.
- **Performance-conscious**: Preconnected Google Fonts, no external JS dependencies, CSS-only animations where possible.
- **Mockup browser window** showing a fictional merchant storefront ("Maria's Leather, Bogota") is a nice touch that makes the product tangible.

### Weaknesses
- **1,918 lines in a single HTML file.** All CSS is inline. No external stylesheet, no build process. For a hackathon this is acceptable, but it limits maintainability.
- **No actual functionality.** The landing page is purely presentational. The "Abre tu tienda" CTA links to `#` (nowhere). There is no connection to the backend API.
- **No favicon, no Open Graph meta tags** for social sharing. Missing `og:image`, `og:title`, `twitter:card` metadata.
- **Accessibility gaps**: No `aria-labels` on the mobile menu button, emoji-based icons lack `alt` text/`aria-hidden`, no skip-to-content link.

---

## 3. SMART CONTRACTS -- 8/10

### Strengths
- **Feature-complete marketplace logic**: The contract covers merchant registration, product CRUD, order lifecycle (create -> paid -> shipped -> delivered -> completed), escrow with timeout release, dispute resolution, loyalty points, and on-chain reviews. This is substantially more than a hackathon prototype.
- **Proper escrow design**: Funds are transferred to the marketplace on order creation, held with platform fee separation, and released on completion. Timeout auto-release (7 days) prevents funds from being locked forever.
- **Dispute system** with 3-day window post-delivery. Admin can resolve in favor of buyer (refund + stock restore) or merchant (release escrow). This is a thoughtful design.
- **Loyalty points** with earning (100 pts per TIENDA spent on order completion) and redemption (discount on future orders, capped at order total). Admin and merchant can mint bonus points.
- **View functions** with `#[view]` annotations for querying merchant profiles, products, orders, loyalty balances, and marketplace stats without gas costs.
- **Proper use of Initia Move primitives**: `initia_std::coin`, `initia_std::table`, `initia_std::event`, `initia_std::timestamp`, `initia_std::fungible_asset`. This is not generic Move code -- it targets Initia specifically.
- **Self-purchase prevention** (`E_SELF_PURCHASE`), zero-quantity guards, price validation, duplicate review prevention.

### Weaknesses
- **No unit tests or Move test functions.** A contract handling real money with escrow logic absolutely needs test coverage. No `#[test]` functions anywhere.
- **Centralized admin risk.** The admin address has unilateral power to resolve disputes (refund or release), mint unlimited loyalty points, and withdraw platform fees. There is no multi-sig, no timelock, and no governance mechanism. For a project preaching "merchant sovereignty," this is contradictory.
- **No actual coin transfer on escrow release.** The `complete_order` function updates accounting (`mp.platform_fees_collected`) but the comment explicitly says "In production, the marketplace account signer would be used." The escrow release and refund functions emit events but do not actually call `coin::transfer` to move funds back. This means the contract collects funds but cannot disburse them in its current form.
- **Missing `withdraw_platform_fees` implementation.** Referenced in the view function `get_marketplace_stats` but no entry function exists for the admin to actually withdraw collected fees.
- **Single module architecture.** A 1,424-line Move module should be split (e.g., `marketplace`, `escrow`, `loyalty`, `reviews`).
- **No CosmWasm contracts.** The architecture diagram and pitch materials prominently feature CosmWasm for "storefront contracts, orders, reviews," but the entire project only contains a single Move module. This is a significant gap between claims and delivery.
- **No evidence of testnet deployment.** No transaction hashes, no deployment scripts, no `Move.toml` configuration file.

---

## 4. BACKEND -- 7/10

### Strengths
- **Well-structured REST API** with proper resource-oriented routing: `/api/v1/merchants`, `/api/v1/products`, `/api/v1/orders`, `/api/v1/search`, `/api/v1/loyalty`, `/api/v1/categories`.
- **Security middleware**: Helmet (HTTP headers), CORS with configurable origin, rate limiting (200 req/15min), JSON body size limit (10MB).
- **Comprehensive search endpoint** with text search, category filter, country/city filter, price range, tag filter, and five sort modes (price asc/desc, newest, rating, popularity). Proper pagination throughout.
- **Full order lifecycle**: create -> ship (with tracking) -> deliver -> complete (with escrow release + loyalty points) -> or cancel/dispute. Mirrors the smart contract logic.
- **Analytics tracking**: `trackSale()` helper records daily sales with category breakdown per merchant. Merchant dashboard endpoint with revenue, views, conversion, and top products.
- **Proper merchant authentication** via `X-Merchant-Key` header mapped to wallet address. Auth middleware applied to write operations.

### Weaknesses
- **In-memory data store only.** All data lives in JavaScript `Map` objects. Server restart loses everything. No database, no persistence layer, no data migration strategy. The code says "replace with database in production" but for a hackathon demo, this means no demo can survive a restart.
- **No actual blockchain integration.** The `@initia/initia.js` dependency is declared in `package.json` but never imported or used in `server.js`. The `onChainTxHash` and `onChainStatus` fields are always `null`/`pending`. The backend is a pure Web2 CRUD API with no chain interaction.
- **Authentication is trivially bypassable.** The `X-Merchant-Key` header just checks if a wallet address exists in the merchant map. There is no signature verification, no JWT, no session management. Anyone who knows a wallet address can impersonate that merchant.
- **Missing buyer authentication entirely.** Order delivery confirmation and completion endpoints accept `buyerAddress` in the request body -- the caller self-identifies. No verification whatsoever.
- **Platform fee inconsistency.** The backend hardcodes 2.5% (`Math.floor(netAmount * 0.025)`), while the contract uses configurable basis points, and the pitch materials claim 1.5%.
- **No HTTPS enforcement.** No SSL/TLS configuration or redirect.

---

## 5. PITCH MATERIALS -- 9/10

### Strengths
- **Exceptional narrative quality.** The pitch deck reads like a professional Series A deck, not a hackathon submission. The opening hook ("300 million people shopping on phones, not one using blockchain") is immediately compelling.
- **Strong emotional storytelling.** The "Maria" persona thread runs consistently through the pitch deck, demo script, and video storyboard, making the abstract concrete.
- **Precise market data** with specific numbers: $120B LATAM e-commerce, 25% YoY growth, 87% mobile, 16-35% platform take rates with named competitors (MercadoLibre, Rappi, Instagram Shops).
- **Excellent competitive positioning.** The comparison table (Slide 8) clearly differentiates Tienda from Initia's capabilities. The "impossible without Initia" framing is strategically brilliant for a hackathon judged by the Initia team.
- **Demo script** is production-quality: precise timing (3-minute flow broken into 25-second acts), backup plan for live demo failure, pre-demo checklist.
- **Video storyboard** includes scene-by-scene breakdown with timing, visual direction, voiceover script, text overlays, and detailed production notes (music style, color grading, recording specs).
- **Pitch deck HTML** is a fully functional presentation with keyboard navigation, progress bar, slide transitions, and responsive design. This is a deliverable, not just documentation.
- **Bilingual branding** is well-executed: Spanish product names ("Abre tu tienda," "Crece," "Escala") with English explanations.

### Weaknesses
- **Over-promises relative to delivery.** The pitch claims: "React Native mobile app (merchant + buyer flows)," "Account abstraction: phone-number onboarding," "Tienda rollup deployed on Initia testnet." None of these exist in the codebase. The pitch deck says "Built this week" for features that were not built.
- **The video and demo require a working mobile app that does not exist.** The demo script describes tapping through a phone app, receiving SMS verification, taking photos, and getting push notifications. None of this functionality has been implemented.
- **Revenue projections are aggressive.** $12M ARR in Year 2 from a project that has no users, no mobile app, and no testnet deployment is aspirational fiction.

---

## 6. INVESTOR READINESS -- 8.5/10

### Strengths
- **Comprehensive investor brief** covering all standard sections: one-liner, problem, solution, why now, market sizing, unit economics, competitive moat, GTM, business model, 3-year financials, team requirements, funding ask, risks, and exit strategy.
- **Unit economics are well-modeled**: LTV of $495, CAC of $3-40 by channel, LTV:CAC ratios of 12-62x, CAC payback under 3 months. These numbers are plausible for a LATAM mobile-first product.
- **Honest risk assessment.** Five risks identified with severity ratings and specific mitigations. Acknowledges Initia ecosystem immaturity and chicken-and-egg problems.
- **Funding ask is specific and reasonable**: $4M seed, $16-24M post-money, split into two milestone-based tranches.
- **Exit strategy** names five specific acquirers with strategic rationale and valuation ranges. Comparable exits cited (Merama, dLocal, VTEX, Addi) are relevant.

### Weaknesses
- **No actual team.** The README lists roles ("Product Lead," "Blockchain Engineer") but no names. The investor brief lists "team requirements" rather than team members. For an investor, this is a major red flag.
- **Comparable company analysis is cherry-picked.** dLocal ($9B), VTEX ($3.5B), and Merama ($1.2B) are all post-product-market-fit companies. Using them as comps for a seed-stage project with no users is misleading.
- **No cap table, no existing investors, no legal entity.** The brief is structurally complete but has no concrete foundation.

---

## 7. HACKATHON FIT -- 7.5/10

### Strengths
- **Strong Initia alignment.** The project leverages Initia-specific features (enshrined liquidity, multi-VM, app-specific rollup, IBC) and articulates why each matters. This is not a generic dApp ported to Initia.
- **Real problem, real market.** LATAM e-commerce pain points are genuine. The merchant fee disparity is a real and documented problem.
- **Polished presentation layer.** The landing page, pitch deck HTML, and documentation are at a level that will stand out visually in a hackathon.
- **Scope ambition.** The contract alone covers merchant registration, products, orders, escrow, disputes, loyalty, and reviews -- more than most hackathon projects attempt.

### Weaknesses
- **Critical claim-vs-delivery gap.** The README checklist items are all unchecked (`- [ ]`). The project claims React Native mobile app, CosmWasm contracts, and testnet deployment, but delivers none of these.
- **No mobile app.** The `src/mobile/` directory is referenced in the project structure but does not exist. For a project whose entire thesis is "mobile-first for LATAM," this is a glaring absence.
- **No deployable demo.** The landing page has no backend connection. The backend has no chain connection. The contract has no deployment evidence. A judge cannot run this end-to-end.
- **Heavy on storytelling, light on shipping.** The pitch materials are ~3x the volume of the actual code. This imbalance suggests more time was spent on narrative than engineering.

---

## 8. CRITICAL ISSUES

### CRITICAL (Blocks Demo/Judging)

1. **No end-to-end demo path exists.** Landing page -> backend -> blockchain is fully disconnected. A judge clicking "Abre tu tienda" gets nowhere.

2. **No testnet deployment.** Zero evidence of any contract deployed on Initia testnet. No `Move.toml`, no deployment scripts, no transaction hashes. The pitch claims it is deployed.

3. **No mobile app.** The entire value proposition ("mobile-first," "phone-number onboarding," "take a photo and publish") requires a mobile app that does not exist.

4. **Escrow funds cannot be disbursed.** The Move contract accepts payments into escrow but the release functions do not call `coin::transfer` to send funds to merchants. Money goes in but cannot come out.

### HIGH

5. **No CosmWasm contracts.** Architecture claims dual-VM (Move + CosmWasm) but only Move code exists. Half the advertised technical architecture is missing.

6. **Backend has zero blockchain integration.** The `@initia/initia.js` SDK is a dependency but is never imported. All "on-chain" fields are permanently null.

7. **No authentication/authorization on buyer-side endpoints.** Anyone can confirm delivery, complete orders, or open disputes by supplying any wallet address in the request body.

8. **Fee discrepancy.** Pitch says 1.5%, backend hardcodes 2.5%, contract uses configurable basis points. These need to be consistent.

---

## 9. RECOMMENDATIONS

### P0 -- Must Fix Before Submission

| # | Action | Effort |
|---|--------|--------|
| 1 | **Connect landing page to backend.** Wire the "Abre tu tienda" CTA to a merchant registration form that calls `POST /api/v1/merchants`. Show a working store creation flow, even if simplified. | 4-6 hours |
| 2 | **Deploy contract to Initia testnet.** Create `Move.toml`, deploy the marketplace module, and document the contract address and deployment tx hash in the README. | 2-4 hours |
| 3 | **Fix escrow disbursement.** Add `coin::transfer` calls in `complete_order`, `resolve_dispute_refund`, `cancel_order`, and `timeout_release_escrow` to actually move funds. | 2-3 hours |
| 4 | **Align fee percentage.** Pick one number (1.5% as the pitch says) and make contract, backend, and pitch materials consistent. | 30 minutes |
| 5 | **Record a demo video** showing the actual working flow (even if limited to landing page + API calls via the browser), rather than relying on the script that requires a nonexistent mobile app. | 2-3 hours |

### P1 -- Should Fix for Competitive Submission

| # | Action | Effort |
|---|--------|--------|
| 6 | **Add backend-to-chain integration.** Import `@initia/initia.js`, create a service layer that broadcasts transactions to the deployed contract on merchant registration, product listing, and order creation. | 8-12 hours |
| 7 | **Write contract tests.** Add `#[test]` functions covering the happy path (register -> list product -> create order -> ship -> deliver -> complete) and edge cases (self-purchase, insufficient stock, double review). | 4-6 hours |
| 8 | **Add buyer-side auth.** Implement signature verification so buyers prove wallet ownership before confirming delivery or completing orders. | 3-4 hours |
| 9 | **Build a minimal web-based merchant flow.** Even without React Native, a web form for "create store -> add product -> view orders" connected to the backend would be a functional demo. | 6-8 hours |
| 10 | **Update README checklist.** Either check off completed items honestly or remove the checklist. Unchecked boxes signal incompleteness to judges. | 15 minutes |

### P2 -- Nice to Have

| # | Action | Effort |
|---|--------|--------|
| 11 | **Add a CosmWasm contract** for storefront deployment to validate the multi-VM claim. Even a minimal contract would prove the architecture. | 6-10 hours |
| 12 | **Add persistence layer.** Replace in-memory Maps with SQLite or a lightweight DB so the backend survives restarts during demos. | 3-4 hours |
| 13 | **Add OG meta tags and favicon** to the landing page for social sharing. | 30 minutes |
| 14 | **Convert backend to TypeScript** to match the README's claimed tech stack. | 4-6 hours |
| 15 | **Add API documentation** (Swagger/OpenAPI) for the 20+ endpoints. | 2-3 hours |

---

## 10. OVERALL SCORE

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Code Quality | 7.0 | 15% | 1.05 |
| Landing Page | 8.5 | 10% | 0.85 |
| Smart Contracts | 8.0 | 20% | 1.60 |
| Backend | 7.0 | 15% | 1.05 |
| Pitch Materials | 9.0 | 15% | 1.35 |
| Investor Readiness | 8.5 | 5% | 0.43 |
| Hackathon Fit | 7.5 | 20% | 1.50 |
| **OVERALL** | | **100%** | **7.83/10** |

---

## Verdict

**Tienda is a 9/10 idea with 9/10 storytelling and 6/10 execution.**

The narrative, market positioning, and pitch materials are genuinely exceptional -- among the best I have seen in hackathon submissions. The vision of invisible blockchain commerce for LATAM merchants is compelling, timely, and well-articulated. The Initia integration thesis is thoughtful and strategically aligned with the hackathon's sponsor interests.

The smart contract is substantial and demonstrates real understanding of marketplace mechanics (escrow, disputes, loyalty). The backend API is well-structured with proper validation and security middleware.

However, the project suffers from a fundamental credibility gap: the pitch promises a mobile app, testnet deployment, account abstraction, and dual-VM architecture, but none of these exist. The three layers (frontend, backend, contract) are completely disconnected -- there is no working end-to-end flow. The contract can accept funds but cannot disburse them. The backend declares a blockchain SDK dependency but never uses it.

For a hackathon, the critical question is: **can a judge experience the product?** Right now, the answer is no. The landing page is beautiful but leads nowhere. Fixing this should be the absolute top priority.

**If the P0 recommendations are addressed**, this project jumps to a strong 8.5+ and becomes a serious contender. The foundation is there. The story is there. The contract logic is there. What is missing is the connective tissue that turns these components into a demonstrable product.

**Bottom line:** Ship less, but ship it connected.

---

*This audit was conducted by reviewing all source code, documentation, pitch materials, and project configuration files. No external tools, deployments, or runtime testing were performed. All assessments are based on static analysis of the delivered artifacts.*
