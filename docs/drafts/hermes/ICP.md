<!-- DRAFT v0.1 — awaiting review — Hermes 2026-06-13 -->

# FinPlan Pro — Ideal Customer Profile (ICP)

> **Frame for the cycle:** This ICP is the foundation for every GTM surface that follows — the marketing-site home, the sales deck, the cold outbound, the launch email, the analyst-relations brief, the beta program. Strategos owns *which battlefield* (PRODUCT_VISION.md §1); I own *who's standing on it* and *what they say back to their CFO in 30 seconds*. Every persona below carries three witnesses — (a) the buyer, (b) the alternative they're fleeing, (c) the price/pain anchor that closes the deal.

> **Cross-references:**
> - **Strategos / PRODUCT_VISION.md §1** — "Mid-market FP&A, offline-first desktop, 17 sectors, $0-$500/user/mo"
> - **Strategos / PRODUCT_VISION.md §2** — 100× framework (100× faster, 100× cheaper, 100× more verticals)
> - **FPA_COMPETITIVE_MATRIX.md** — 20 competitors priced $0-$500K/yr, 5/20 have AI, 2/20 are fully offline
> - **Mnemosyne / ONBOARDING.md** (in progress) — 30-min first-day path that ICP-2 expects
> - **Iris / persona.md** — customer-research findings (live)

---

## 1. ICP-1: "The Growing Mid-market CFO"

### 1.1 The buyer

**Persona:** "Sandra" — VP Finance / CFO at a 50–500-employee SaaS, e-commerce, or professional-services firm. Reports to the CEO. Manages 1–2 FP&A analysts (and sometimes a controller who is also the analyst). Carries P&L, board pack, fundraising narrative, and scenario planning on her back. Sits in QuickBooks or NetSuite 4 hours/day, Excel the other 4.

**Why this persona:** PRODUCT_VISION.md §1 names 50–500 employees as the wedge. FPA_COMPETITIVE_MATRIX.md §1 shows the 50–500-emp band is the **most under-served** segment in the market — Anaplan/Planful/Workday Adaptive sell "up" to 5,000+ emp, Cube/Pigment/Sage sell "down" to startups, and **nobody is winning the middle**. This is the 100× wedge.

### 1.2 The three witnesses (Hermes verification rule)

| Witness | Detail |
|---|---|
| **(a) Buyer persona** | CFO/VP Finance at 50–500 emp SaaS / e-commerce / professional services. Reports to CEO, board-pack owner, fundraise-facing. |
| **(b) Competitive alternative** | **Anaplan** ($100K-$500K/yr, 6-month rollout, 5 consultants, cloud-only); **Planful** ($50K-$200K/yr, 3-month POC, 700+ integrations the buyer uses 5 of); **Workday Adaptive** (forced bundling with Workday HCM, 12-month sale); **Excel + 3-week scenario marathons** (the silent incumbent). |
| **(c) Price-or-pain anchor** | Today: **10–15 day close**, **3-week scenario cycle**, **2 analysts** burning out. Tomorrow: **3-day close**, **30-second scenario runs**, **0 analysts** (the FP&A lead does it herself). The pain is **time-to-answer for the CEO/board**, not "missing a feature." |

### 1.3 Demographics (firmographic)

- **Company size:** 50–500 FTE, $10M-$100M ARR
- **Industry:** B2B SaaS (60% of pipeline), e-commerce DTC (20%), professional services / agencies (15%), other data-rich recurring revenue (5%)
- **HQ geography:** US (initial focus: CA, NY, TX, MA, WA, IL), Canada, UK, AU/NZ secondary
- **Tech stack today:** QuickBooks Online (50%) / NetSuite (35%) / Sage Intacct (15%) for GL; Stripe / Chargebee / Maxio for billing; Excel + Google Sheets for FP&A; Notion / Coda / Asana for ops; HubSpot / Salesforce for CRM
- **Data residency:** 40% of pipeline has a soft data-residency requirement (EU customers, US-regulated industries like fintech/healthtech, public-sector-adjacent)

### 1.4 Budget & buying process

- **Budget range:** $20K-$100K/yr for FP&A software
- **Decision makers:** CFO (economic buyer), VP Finance (champion), sometimes CEO (final sign-off), occasionally a board advisor (for $50K+ ACV)
- **Sales cycle:** **60–90 days** from first demo to signed contract (CFO 2–3 calls, security review 2 weeks, procurement 2–3 weeks)
- **Trigger events that create the deal:
  - **Fundraise** (Series B / C close) — need board-pack scenarios 30 sec, not 3 weeks
  - **First missed forecast** (board asked "why" and the answer was a 3-day Excel rebuild)
  - **New CFO hire** (the new CFO's first 90 days = clean the FP&A stack)
  - **NetSuite-to-Intacct migration** (mid-fiscal-year, opportunity to add the FP&A layer at the same time)
  - **Acquisition** (multi-entity consolidation suddenly urgent)

### 1.5 Why FinPlan Pro wins ICP-1

1. **Offline-first / no data leaves the laptop** — competitive **kryptonite** vs. Anaplan/Planful/Adaptive. Regulatory win for fintech / healthtech / EU-deal. STRATEGIC GOLDMINE for the cold outbound subject line.
2. **100+ engines out of the box** — Scenario, Monte Carlo, 3-statement, consolidation, AI Copilot, sector-tuned. **Anaplan sells you 4 of these as $200K/yr modules; we ship them in the binary.**
3. **30-second scenario runs vs. 3-week Excel marathons** — the one-line promise that lands the CFO demo. Product-side claim, must be defensible in the first 5 minutes of the call.
4. **No consultants** — Anaplan's 5-consultant line item is the buyer's #1 hidden-cost complaint. We don't have a consultant line. (Counter-claim: "do you offer implementation help?" — yes, 30-min ONBOARDING.md, and an optional paid implementation sprint.)
5. **AI Copilot at the SMB tier** — only 5/20 competitors have AI; we ship it at $0 OSS and $99/user/mo Pro. The "ask the model" demo moment is the close.

### 1.6 Anti-ICP-1 signals (walk away)

- **< $10M ARR** — the budget isn't there; route to ICP-2.
- **> $500M ARR** — they want Workday/SAP/Anaplan integrations we don't have; route to Strategic Accounts.
- **Pure retail / restaurant / construction** — not in our 17 sectors.
- **"We just need better Excel"** — feature scope is too small; route to Cube.
- **Multi-currency consolidation across 30+ entities** — we can do it, but Anaplan does it better. Be honest.

---

## 2. ICP-2: "The Scrappy SaaS Controller"

### 2.1 The buyer

**Persona:** "Carlos" — Controller (sometimes "Head of Finance", sometimes "the one person who does finance") at a 10–50-employee B2B SaaS startup. Often the **only finance hire**. Has Series A in the bank, 2–3 years of runway, and a CEO breathing down his neck every Monday for a "burn / runway / what if we hire 2 more engineers" update. Lives in QuickBooks + Stripe + Excel. Wears 3 hats: controller, FP&A, AR/AP. **Has never bought FP&A software** — the only tool he pays for is QuickBooks ($80/mo) and Notion ($10/mo).

**Why this persona:** This is the **land-and-expand** engine. Carlos doesn't write a $50K check today, but he evangelizes within 18 months, becomes the buyer at $50M ARR (and re-buys at ICP-1 prices), and is the **review-site / community / word-of-mouth engine** that no marketing dollar can buy. PRODUCT_VISION.md §2 calls this "100× more verticals" — we are the default tool of the next 10,000 SaaS controllers.

### 2.2 The three witnesses

| Witness | Detail |
|---|---|
| **(a) Buyer persona** | Controller / first-finance-hire at 10–50 emp B2B SaaS, $1M-$10M ARR, Series A or pre-Series-B. Wears 3+ hats. Self-serve buyer. Often a former auditor or senior accountant, **not** a finance leader by training. |
| **(b) Competitive alternative** | **Excel + 1 Google Sheet shared with the CEO** (the silent incumbent for 80% of this persona); **QuickBooks built-in reports** (insufficient); **Fathom / Spotlight Reporting** ($50-$200/mo, basic); **Cube** ($0 free tier exists, paid is per-seat). Carlos is **not** evaluating Anaplan or Pigment — he has **never heard of them**, and would reject them on price if he had. |
| **(c) Price-or-pain anchor** | Today: **2-hour Monday morning burn/runway rebuild** + **3-day quarterly board pack** + **0 documentation** of "what we assumed." Tomorrow: **5-minute Monday morning** + **30-minute board pack** + **audit trail of every assumption**. The pain is **Sunday-night anxiety**, not "missing an integration." |

### 2.3 Demographics

- **Company size:** 10–50 FTE, $1M-$10M ARR
- **Industry:** **B2B SaaS only** (vertical narrowness is intentional — Carlos's mental model is SaaS-metrics-shaped: MRR, churn, runway, CAC, LTV, magic number)
- **HQ geography:** US (CA, NY), Canada, UK, AU/NZ, Israel — strong overlap with the SaaS-funder belt
- **Tech stack today:** QuickBooks Online (90%) / Xero (10%) for GL; Stripe (95%) / Chargebee / Maxio for billing; **Google Sheets** for everything finance; Notion / Linear / Asana for ops; HubSpot / Pipedrive for CRM
- **Tooling maturity:** **Low**. Carlos has never used a data warehouse (no Snowflake, no BigQuery), has never written a SQL query, has never paid for BI (no Tableau, no Looker). Anything that requires a Snowflake connection is a non-starter.

### 2.4 Budget & buying process

- **Budget range:** $500-$5K/yr (Carlos's finance-tools line item is currently <$2K/yr)
- **Decision maker:** **Carlos is the only decision maker.** No procurement, no security review, no legal review for the first year. The CEO rubber-stamps.
- **Sales cycle:** **14–30 days**, self-serve preferred. Carlos **will not** book a sales call. He will click "Download" and try the app. If the app doesn't open in 5 minutes or asks for a credit card, he's gone.
- **Discovery channels:** Hacker News, r/Accounting, r/StartupFounder, Indie Hackers, Twitter/X finance-Twitter, peer Slack communities (OnDeck, Hampton, etc.), **YouTube tutorials** by SaaS-finance creators (David Chen, Bri Nyren, etc.)

### 2.5 Why FinPlan Pro wins ICP-2

1. **Free / open-source tier** — $0 to start. Eliminates the CFO's "is this worth a credit card?" friction. Aligns with Carlos's "I'll try anything once" behavior.
2. **30-min ONBOARDING.md** — Mnemosyne is writing this as a P0. If the first 30 minutes work, Carlos evangelizes; if not, he ghost-installs and never returns.
3. **No data leaves the laptop** — Carlos is paranoid about customer-billing data on third-party servers. The .fpa file format + Tauri desktop is a **trust signal**, not a feature.
4. **Sector-tuned SaaS metrics out of the box** — MRR, ARR, NRR, churn cohorts, runway waterfall, CAC payback, magic number. Cube has some of these; Fathom has none. The first time Carlos sees "MRR waterfall by cohort" in our app, the deal is done.
5. **AI Copilot at $0** — "ask the model what happens to runway if I hire 3 engineers" in plain English, with 100 free queries/day at Pro. Nobody else ships this at this price.

### 2.6 Anti-ICP-2 signals (walk away)

- **Non-SaaS** (e-commerce, services, hardware) — wrong sector preset; route to a future vertical.
- **> 50 FTE** — Carlos has hired a real FP&A person; persona shifts to ICP-1.
- **Has Snowflake / BigQuery / Tableau** — they want a real BI tool, not us.
- **"I'll wait until my friend recommends it"** — Carlos's friend **is** our funnel; nurture the community channel.
- **Asks for SOC 2 / SSO on day 1** — Carlos is too small to need it. Route to ICP-1 with a 6-month nurture.

---

## 3. ICP comparison (one-glance)

| Attribute | ICP-1: Growing Mid-market CFO | ICP-2: Scrappy SaaS Controller |
|---|---|---|
| Company size | 50–500 FTE | 10–50 FTE |
| ARR | $10M-$100M | $1M-$10M |
| Industry | SaaS, e-commerce, professional services | B2B SaaS only |
| Tech stack today | NetSuite / QuickBooks + Excel + 5+ tools | QuickBooks + Stripe + Google Sheets |
| Pain | 10–15 day close, 3-week scenarios, 2 burned-out analysts | 2-hour Monday burn, 0 documentation, Sunday-night anxiety |
| Budget | $20K-$100K/yr | $500-$5K/yr |
| Decision makers | CFO + VP Finance + CEO | Controller (sole) |
| Sales cycle | 60–90 days | 14–30 days, self-serve |
| Why we win | Offline-first, 100+ engines, no consultants, 30-sec scenarios | Free OSS, 30-min onboarding, SaaS-tuned metrics, AI at $0 |
| Tier alignment | Business / Enterprise | Open Source / Pro |
| Land motion | Outbound + partner channel + AE-led demo | Inbound (HN, YouTube, Twitter, OSS community) |
| Expand motion | Add Pro users, add AI tier, consolidate entities | Upgrade to Pro ($99) at 10 users or post-Series-A |

---

## 4. ICP-3 (reserved — Iris is researching)

Iris is the customer-research Muse and may surface a third persona (likely **"the Fortune-1000 finance transformation lead"** or **"the fractional CFO serving 5 SaaS startups"**). I will fold it in once Iris publishes. **Do not** assume ICP-3 exists yet — keep this document to ICP-1 and ICP-2 until Iris signals otherwise.

---

## 5. What this ICP is NOT (anti-persona for the marketing site)

To keep the launch message crisp, the public ICP narrative names only ICP-1 (CFO) and ICP-2 (Controller). We do **not** call out:
- "We're for anyone who does finance" — that signals "we're for no one"
- "We're for enterprise" — invites the Workday / SAP comparison we lose
- "We're a Pigment alternative" — too narrow, alienates ICP-2
- "We're for Excel-haters" — alienates Carlos, who is the silent incumbent

---

## 6. Verification (the three-witness test)

Every GTM surface that follows (landing page, sales deck, cold email, launch tweet, analyst brief) must:
- **Name the buyer by title and company size** (not "finance teams" — they don't exist)
- **Name the alternative by product and price** (not "legacy tools" — they don't exist)
- **Name the pain in the buyer's words** (not "inefficiency" — they don't say that)

A claim that fails any of the three is rewritten or cut.

---

_τὸν ἀγοραστὴν γινώσκω — know the buyer, know the close. Strategos has the battlefield, Iris has the research, Apollo has the binary, I have the message. — Hermes_
