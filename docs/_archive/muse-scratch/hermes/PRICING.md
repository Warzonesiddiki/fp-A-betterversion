<!-- DRAFT v0.2 — ICP-numbering reconciled to canonical (Carla=ICP-1, Vera=ICP-2, Chris=ICP-3) per T-HER-009 — Hermes 2026-06-13. T-HER-010 Tier 2 broader drift sweep 2026-06-13 (Sandra→Carla, Carlos→Vera full sweep). -->

# FinPlan Pro — Pricing Tiers

> **Frame for the cycle:** Pricing is positioning. The four tiers below are the **commercial expression** of the two ICPs in `ICP.md` and the anti-positions in `POSITIONING.md`. The Open Source tier is not a "free trial" — it is the wedge into Anaplan's worst nightmare. The Business tier is the **target ACV** ($20K-$100K/yr ICP-1 deal). The Enterprise tier is the **moat** (regulated industries, Fortune 1000). Every tier must (a) name the buyer, (b) name the alternative it displaces, (c) name the price/pain anchor.

> **Cross-references:**
>
> - `docs/drafts/hermes/ICP.md` — ICP-1 (Carla, CFO) and ICP-2 (Vera, Controller) [canonical per `iris/PERSONAS.md` + T-ST-006 v0.2 ICP-numbering ratification]
> - `docs/drafts/hermes/POSITIONING.md` — three anti-positions
> - `docs/PRODUCT_VISION.md` — 5 phases (Personal → Team → Company → Ecosystem → Network); this pricing map layers 4 commercial tiers on top of those 5 product phases
> - `docs/FPA_COMPETITIVE_MATRIX.md` — competitor price benchmarks ($0 OSS to $500K/yr Anaplan)
> - **Strategos** — owns pricing-sensitivity modeling, will refine ARPU / LTV math

---

## 1. Tier matrix (one-glance)

| Tier            | Price                                                                      | Target ICP                                                                           | What you get                                                                                                                                                                                                                              | What you do NOT get (constraint)                                                                                               |
| --------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Open Source** | **$0** forever                                                             | ICP-2 (Vera, Scrappy SaaS Controller), individual contributors, students, evaluators | Single user, all 200+ engines, local .fpa file storage, 5-year data history, all 17 sector presets, 100 AI Copilot queries/day                                                                                                            | **No collaboration** (no multi-user, no sharing, no comments), **no cloud sync** (desktop / file only), no SSO, no audit trail |
| **Pro**         | **$99 / user / month** (annual: $83/user/mo, 2 months free)                | Vera (ICP-2) growing into Carla (ICP-1) lite; small teams of 5–10                    | Up to **10 users**, real-time collaboration, 10-year data history, **AI Copilot (100 queries/user/day)**, file-level encryption, Stripe/QuickBooks/Google Sheets sync, all 17 sectors                                                     | **Self-hosted only** (no managed cloud), no SSO/SAML, no RBAC, no audit trail, no SOC 2                                        |
| **Business**    | **$499 / user / month** (annual: $415/user/mo, 2 months free; min 5 users) | **ICP-1 (Growing Mid-market CFO)**, 50–500 FTE                                       | **Unlimited users**, audit trail, RBAC, **SOC 2 Type II (target Q3 2026)**, all integrations (NetSuite, Sage Intacct, Salesforce, Snowflake, BigQuery, etc.), cloud + on-prem, dedicated Slack channel, AI Copilot 1,000 queries/user/day | No white-label, no custom SLA, no on-prem-only deployment (cloud required)                                                     |
| **Enterprise**  | **Custom** (starting at $250K/yr ACV floor)                                | Fortune 1000, regulated industries (banking, defense, healthcare, public sector)     | **White-label**, SSO/SAML, dedicated CSM, **custom SLA** (99.9% uptime, 1-hr P1 response), **on-prem-only deployment** option, custom integrations, custom contracts, FedRAMP roadmap                                                     | Annual contract, procurement / legal review required                                                                           |

---

## 2. Per-tier detail

### 2.1 Open Source — $0

**Three witnesses:**

- **Buyer (a):** Vera (ICP-2), the 10–50-emp SaaS controller, the "I'll try anything once" persona (per `iris/PERSONAS.md`). Also: students, evaluators, individual contributors at Fortune 1000s ("I'll use it for my side-project startup before I propose it at work").
- **Alternative (b):** **Excel + Google Sheets + QuickBooks reports** — the silent incumbent for 80%+ of this segment. Cube's free tier is the closest paid alternative but Cube locks the file format.
- **Price/pain anchor (c):** $0 to start; $0 forever for single-user; the unspoken anchor is **"if I had to buy this for $99/mo I wouldn't, so $0 is the only price that gets the install."**

**Why this works:** The OSS tier is the **wedge into Anaplan's worst nightmare** — a free download that ships 200+ engines with no data leaving the laptop. Cube is the only other open-ish competitor, and they don't have the AI Copilot or the 17 sectors. The OSS tier is the funnel for the entire commercial flywheel: **Vera's startup grows, Vera evangelizes internally, the company hits 50 FTE, the company buys Pro for 5 users, the company hits 200 FTE, the company buys Business for 50 users.** LTV from a single $0 install can be 5–7 figures.

**Constraint rationale (why "no collaboration, no cloud sync"):** We are not running a free cloud for the world. The file lives on Vera's laptop. The day Vera needs to share a file with a colleague, that's the Pro upgrade trigger. **The constraint is the upgrade pull.** (This is the same model GitHub used: free repos for solo developers, paid for private teams.)

### 2.2 Pro — $99 / user / month

**Three witnesses:**

- **Buyer (a):** Vera at 30+ FTE who needs to share with the CEO; small finance teams of 5–10 at sub-ICP-1 companies; **Pro is also the first "real" tier for ICP-1 buyers** running a 3-person finance team at a 50-FTE startup.
- **Alternative (b):** **Cube** ($0 free / $0-$60/user/mo paid, weaker AI), **Fathom** ($53-$200/mo flat, weaker), **Spotlight Reporting** ($45-$200/mo flat, weaker), **Drivetrain** ($30K+/yr — out of band). Pro is the only tier with **AI Copilot + 17 sectors + 10-year history + real-time collab** at sub-$100/user/mo.
- **Price/pain anchor (c):** $99/user/mo = **$4,950/yr for a 5-user team**. Cheaper than one FTE's monthly coffee budget. The anchor is "what's a finance team worth?" — the answer is "more than $4,950/yr to a team that's already paying $80/mo for QuickBooks and $200/mo for Notion."

**Why this works:** Pro is the **upgrade trigger** from OSS. The "10 users, real-time collab, cloud sync" boundary is the moment Vera's startup has grown to the point where file-sharing matters. The 100 queries/day AI Cap is the **second upgrade trigger** — power users hit it within 2 months and upgrade to Business.

**Constraint rationale (why "self-hosted only"):** Managed cloud is a real infrastructure cost. Self-hosting = zero infra cost on our side, and ICP-2 customers **want** self-hosting (Vera is paranoid about third-party data servers). The constraint is **also the feature**.

### 2.3 Business — $499 / user / month (min 5 users)

**Three witnesses:**

- **Buyer (a):** Carla (ICP-1), CFO at 50–500 FTE. The economic buyer; the deal is 50–250 users; ACV $250K-$1.5M/yr.
- **Alternative (b):** **Anaplan** ($100K-$500K/yr, 6-month rollout, 5 consultants), **Pigment** ($50K+/yr, 14-week POC, no offline), **Planful** ($50K-$200K/yr, 700+ integrations the buyer uses 5 of), **Workday Adaptive** (forced Workday HCM bundle, 12-month sale cycle). At $250K/yr ACV we are 50–80% cheaper than Anaplan for equivalent scenario + 3-statement + consolidation scope.
- **Price/pain anchor (c):** $499 × 50 users × 12 months = **$299,400/yr**. The buyer's frame: "this is one senior analyst's fully-loaded cost ($150K/yr salary + benefits), and it replaces 2–3 weeks of scenario work per quarter." ROI in the first quarter, not the first year.

**Why this works:** Business is the **target ACV** for FinPlan Pro. It is where the unit economics work (5 users × $499 × 12 = $30K MRR; 100 customers = $36M ARR), it is where the **SOC 2 + RBAC + audit trail** checkboxes unblock regulated industries, and it is where **ICP-1 lives**. The "min 5 users" floor prevents one-person Pro-customer upgrades from gaming the system.

**Constraint rationale (why "no white-label, no custom SLA"):** White-label and custom SLA are real, expensive capabilities reserved for Enterprise. The Business customer can self-host or use cloud; both are supported. SOC 2 Type II is **target Q3 2026** — until then, ICP-1 buyers in regulated industries route to Enterprise.

### 2.4 Enterprise — Custom (starting $250K/yr ACV)

**Three witnesses:**

- **Buyer (a):** Fortune 1000 finance-transformation lead; CFO of a regulated-industry incumbent (banking, defense, healthcare, public sector). Annual contract, procurement, legal review. **Not** a self-serve motion.
- **Alternative (b):** **SAP BPC, Oracle EPM, Workday Adaptive, Anaplan Enterprise, OneStream.** The buyer has been on one of these for 5–10 years and is looking to **displace**, not adopt. Win rate is ~15–25% (we will not win every displacement; we will win the ones where offline-first + on-prem-only is the requirement).
- **Price/pain anchor (c):** $250K-$2M/yr ACV. The buyer's frame: "we are paying $5M/yr to Anaplan / SAP and the rollout failed; can you deliver the same scope in 6 months for half the cost?" The answer is **yes**, with the offline-first + on-prem + white-label triangle as the wedge.

**Why this works:** Enterprise is the **moat**. The revenue is concentrated, the sales cycles are long (6–12 months), but the LTV is 5–10 years and the **reference-ability** is enormous. One Fortune 500 logo unlocks 50 mid-market deals in the same industry. The on-prem-only deployment is the regulatory wedge that no SaaS-only competitor can match.

**Constraint rationale (why "annual contract, procurement required"):** Enterprise sales is a different motion. We staff it with Strategic AEs, dedicated CSMs, and solutions architects. The 1-hr P1 SLA is a real cost we are committing to. The price floor of $250K/yr ACV is the unit-economics guardrail.

---

## 3. Pricing rationale (the four constraints that shaped this)

1. **The OSS tier is the wedge, not the product.** It is a $0 product whose purpose is to generate the install base that 5%-10% of which becomes Pro/Business/Enterprise revenue. Without the OSS tier, the Vera (ICP-2) funnel doesn't exist.
2. **The Pro tier must be sub-$100/user/mo.** Above $100/user/mo, Vera's "I'll just use Google Sheets" voice wins. The $99 ceiling is the GTM hard line.
3. **The Business tier must be ≥ $25K ACV.** Below $25K ACV the unit economics on SOC 2 + RBAC + audit trail don't pencil out; the AE sales motion doesn't pay back; ICP-1 customers self-serve to Pro and never upgrade to Business.
4. **The Enterprise tier must require annual contracts.** Monthly Enterprise is operationally untenable (the legal/security/SLA overhead is the same regardless of term length). Annual contract with a $250K floor protects margin and signals seriousness.

---

## 4. Comparison table — what the buyer is escaping

| FinPlan Pro tier | Price        | What it replaces                          | What the buyer was paying (or accepting)                |
| ---------------- | ------------ | ----------------------------------------- | ------------------------------------------------------- |
| **OSS**          | $0           | Excel + Google Sheets                     | $0 (silent incumbent) + **2-hr/week** rebuild pain      |
| **Pro**          | $99/user/mo  | Cube / Fathom / Spotlight                 | $50-$200/mo flat + **3-day** quarterly close pain       |
| **Business**     | $499/user/mo | Anaplan / Pigment / Planful               | $50K-$500K/yr + **6-month rollout** + **5 consultants** |
| **Enterprise**   | $250K+/yr    | SAP BPC / Oracle EPM / Anaplan Enterprise | $1M-$5M/yr + **12-month sale** + **forced HCM bundle**  |

---

## 5. Pricing is positioning

The four tiers are **not four products** — they are **four messages** to four buyers:

- **OSS** says to Vera: _"You don't have to pay to start."_
- **Pro** says to Vera: _"You don't have to be a sysadmin to scale."_
- **Business** says to Carla: _"You don't have to be Anaplan to be enterprise."_
- **Enterprise** says to the Fortune 1000: _"You don't have to be cloud to be modern."_

The **"don't"** is the positioning. Every tier removes a constraint the buyer has been told is permanent.

---

## 6. Open questions for Strategos (post-launch)

1. **Should Pro have a per-tenant cap on data history (10 years) or a per-seat cap?** Currently per-tenant; could be a Pro → Business pull.
2. **Should Business have a usage-based AI Copilot overage (e.g., $0.50 per 1,000 queries beyond the 1,000/day cap)?** Margin-protective, customer-hostile — Strategos to model.
3. **Should Enterprise have a "FIPS 140-3 mode" upcharge?** This unblocks DoD / federal buyers; complex to scope.
4. **Should the OSS tier have a "powered by FinPlan Pro" watermark in exports?** Brand-awareness win vs. trust-signal loss.

These are flagged for Strategos's Q2 review.

---

_ἀγορὰ τιμῆς — the marketplace of price. Apollo ships the binary, Strategos models the unit economics, I name the price the buyer can defend to their CFO. — Hermes_
