<!-- DRAFT v0.1 — awaiting review — Strategos 2026-06-13 -->

# FinPlan Pro — Quarterly Roadmap

> **Date:** 2026-06-13 (refreshed from 2026-06-12 v0.1; cross-refs to `docs/security-deferrals.md` and the D-007 7-phase audit pattern added)
> **Author:** Strategos (7th Muse)
> **Cycle:** Perfection Cycle, Phase 0
> **Source of truth:** `PRODUCT_VISION.md §4 (4-Phase Plan)`, refined per-quarter into actionable deliverables
> **Review cadence:** Quarterly (next refresh: 2026-09-12)

---

## How to read this roadmap

Each phase has three sections:

1. **Top deliverables** — concrete ships, not themes. Each is independently shippable.
2. **Success metrics** — numbers, not adjectives. If we can't measure it, we don't commit to it.
3. **Dependencies** — what other phase or external work must land first. Read these before re-ordering.

A deliverable is **P0** if the phase cannot ship without it, **P1** if the phase is materially weaker without it, **P2** if it's nice-to-have.

---

## Phase 0 — Q1–Q2 2026: Perfection Cycle (in progress)

**North star:** Make FinPlan Pro a 100× better single-tenant product than the 2025-Q4 baseline. Zero new features; maximum rigor on what exists.

### Top deliverables (current quarter)

| #   | Deliverable                                                                                                                  | Priority | Owner Muse              | Success metric                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------- | ------------------------------------------------------------------------------------------------------- |
| 0.1 | Apollo pre-push queue lands cleanly on `origin/main`                                                                         | P0       | Apollo                  | `npx vitest run` → 0 failures across 8,334+ tests; tsc=0; lint=0/0; build<2 MB gzip                     |
| 0.2 | Security P0 fixes (PluginSandbox acorn, ScenarioLocking DOM API, mock-auth gate, dataStore encryption)                       | P0       | Hephaestus              | 4/4 fixes merged; secret scanner in `prebuild` hook                                                     |
| 0.3 | 13-store `immer` wrapper + `uiStore` masterStorage migration                                                                 | P0       | Apollo                  | All 13 stores use `subscribeWithSelector(persist(immer(...)))`; 0 direct `localStorage` calls in stores |
| 0.4 | 11 component `role="alert"` text-leak fix (Hera's P0)                                                                        | P0       | Apollo (Hera's patches) | 11 `.patch` files apply cleanly; vitest-axe green                                                       |
| 0.5 | Performance Top-10 (per-namespace i18n, React.memo × 10, react-virtual × 5, runMonteCarlo wire-up, SOXComplianceEngine test) | P1       | Prometheus              | Cold start -48 kB gzip; render time -30-50% on heavy components; 600+ new test cases                    |
| 0.6 | Documentation ground truth (README metrics, GLOSSARY, 5 P0 ADRs, ONBOARDING, TESTING)                                        | P0       | Mnemosyne               | 7/7 doc files merged; 30-min onboarding time-to-first-PR                                                |
| 0.7 | A11y ground truth (vitest-axe, i18n locale cleanup, SettingsPage a11y, 35 stale eslint-disable removed)                      | P1       | Hera                    | WCAG 2.1 AA pass on all top-10 pages; 0 stale `eslint-disable jsx-a11y`                                 |
| 0.8 | Strategic corpus (this roadmap + Q2 review + decisions log + persona)                                                        | P0       | Strategos               | 4/4 docs merged; founder approval received                                                              |

### Success metrics for Phase 0

- **Quality gate:** 0 failing tests, 0 type errors, 0 lint warnings, 0 CVEs in `npm audit`.
- **Bundle gate:** Main chunk <150 kB gzip, total JS <2 MB gzip.
- **Coverage gate:** 175/176 engines with tests (target: 176/176 after SOXComplianceEngine test lands).
- **A11y gate:** All top-10 user pages pass WCAG 2.1 AA via vitest-axe.
- **Documentation gate:** New engineer can ship their first PR within 30 minutes using only `ONBOARDING.md` + `TESTING.md`.

### Dependencies for Phase 0 → Phase 1

- All P0 audits (Athena, Hera, Hephaestus, Prometheus, Mnemosyne, Strategos) completed and accepted by the founder.
- Test suite is **green on `origin/main`**, not just locally.
- Founder has approved this `ROADMAP.md` and `STRATEGIC_REVIEW_Q2_2026.md`.

### Phase 0 sprint plan (June 2026)

Two-week cadence, with the 6 Muses + Strategos. Assumes founder signoff is in-hand by 2026-06-15.

| Week              | Focus                                                                                              | Owner                           | Gate                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------- |
| W1 (Jun 9–15)     | Finalize 4 strategic docs; founder signoff on `ROADMAP.md` + `STRATEGIC_REVIEW_Q2_2026.md`         | Strategos                       | All 4 docs at DRAFT v0.1; founder approval                 |
| W2 (Jun 16–22)    | Apollo lands P0 #0 (test setup mock + dead workers)                                                | Apollo                          | `npx vitest run` → 0 failures                              |
| W3 (Jun 23–29)    | Apollo lands P0 #1–#5 (security)                                                                   | Apollo + Hephaestus             | 4/4 P0 security fixes merged; secret scanner in `prebuild` |
| W4 (Jun 30–Jul 6) | Apollo lands 13-store immer + 11 role="alert" fixes                                                | Apollo + Hera                   | 13/13 stores wrapped; 11/11 patches applied                |
| W5 (Jul 7–13)     | Apollo lands perf Top-10 + docs ground truth                                                       | Apollo + Prometheus + Mnemosyne | -48 kB cold start; 7/7 doc files merged                    |
| W6 (Jul 14–20)    | Apollo lands a11y ground truth + prettier + logger                                                 | Apollo + Hera                   | WCAG 2.1 AA pass on top-10 pages; 0 lint warnings          |
| W7 (Jul 21–27)    | Apollo cuts the release; founder approves; first push to `origin/main`                             | Apollo + Founder                | `origin/main` green, public roadmap goes live              |
| W8 (Jul 28–Aug 3) | Phase 1 planning: backend strategy decision (D-001-pending); pilot cohort outreach (D-002-pending) | Founder + Strategos             | D-001 + D-002 resolved                                     |

**Phase 0 exit criteria (the "100× ship gate"):**

- ✅ All 6 Muse audits accepted.
- ✅ `origin/main` has 0 failing tests, 0 type errors, 0 lint warnings, 0 CVEs.
- ✅ Main bundle <150 kB gzip, total JS <2 MB gzip.
- ✅ All 5 hero workflows (budget, forecast, scenario, consolidation, dashboard) demoed to the founder in a 30-min walkthrough.
- ✅ Strategic corpus (4 docs) approved by the founder.
- ✅ Phase 1 backend strategy decided (D-001-pending) and pilot cohort LOIs in flight (D-002-pending).

If any exit criterion is red, Phase 0 does not end. We extend by 1 week per red criterion, not by 1 week per task.

---

## Phase 1 — Q3 2026 – Q1 2027: Backend, Identity, Multi-Tenant, Public API, Real-Time Collab, SOC 2

**North star:** FinPlan Pro stops being a single-tenant browser app and becomes a multi-tenant SaaS. The first 5 paying customers (pilot cohort) can use it in production.

### Top deliverables

| #    | Deliverable                                                                                                               | Priority | Success metric                                                                       |
| ---- | ------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| 1.1  | Cloud backend (Node + Fastify, deployable to Cloudflare Workers or Vercel) with multi-tenant data isolation               | P0       | 100 tenants in pilot; per-tenant RLS in Postgres; 99.9% uptime                       |
| 1.2  | Identity layer (Auth.js / OIDC + passkeys + SCIM) replacing the current VITE_USE_MOCK_AUTH gate                           | P0       | 0 mock-auth references in production bundle; passkey login <2 s; SCIM 2.0 test green |
| 1.3  | Public REST + GraphQL API with rate limiting, OpenAPI 3.1 schema, generated SDKs (TS, Python)                             | P0       | 200+ endpoints documented; 3 customer-built integrations on the SDK                  |
| 1.4  | Real-time collaboration (Yjs over WebSocket) on the 3 most-edited artifacts: BudgetVsActual, ForecastModel, ScenarioModel | P0       | <100 ms CRDT propagation; 5+ concurrent users in same model without conflict         |
| 1.5  | SOC 2 Type I + Type II readiness (Hephaestus's roadmap; pen test; vendor questionnaire)                                   | P0       | Type I report in hand by Q4 2026; Type II by Q1 2027                                 |
| 1.6  | Stripe billing with self-serve tier upgrade, metered AI usage, 14-day trial                                               | P0       | First 5 paying customers; ARPU $1.5 k/mo by end of Q1 2027                           |
| 1.7  | Multi-entity consolidation in production (currently the engine exists; needs the tenant boundary)                         | P0       | 3 mid-market pilots using 5+ entities each                                           |
| 1.8  | Audit trail + immutable event log (SOXComplianceEngine promoted from "untested" to "SOC 2 evidence")                      | P0       | Every model mutation produces a signed audit event; quarterly evidence export        |
| 1.9  | NIM proxy backend (fixes the VITE_NIM_API_KEY inlining architectural issue)                                               | P1       | 0 secrets in browser bundle; per-tenant rate limits; cost per tenant visible         |
| 1.10 | Customer success playbook (onboarding, health scoring, renewal motion)                                                    | P2       | First NPS survey at 3 months; CSAT ≥40                                               |

### Success metrics for Phase 1

- **Revenue gate:** 5 paying customers, $7.5 k MRR by end of Q1 2027.
- **Reliability gate:** 99.9% monthly uptime; <5 min incident MTTR; 0 SEV-1 incidents from data loss.
- **Security gate:** SOC 2 Type II in hand; 0 customer-discovered secrets in browser; quarterly pen test clean.
- **Adoption gate:** Each pilot uses ≥3 of the 5 "hero" workflows weekly (budget, forecast, scenario, consolidation, dashboard).

### Dependencies for Phase 1 → Phase 2

- Backend team hired (2 engineers minimum, or 1 + founder, or contractor + 1).
- Pilot customers signed LOIs (target: 5 LOIs by 2026-09-30).
- SOC 2 auditor engaged (Vanta, Drata, or Tugboat Logic).
- Stripe account approved; tax setup complete.

---

## Phase 2 — Q2–Q4 2027: 50+ Integrations, Data Warehouse Sync, Excel/Sheets Live Link

**North star:** A customer can import their entire financial system of record into FinPlan Pro in <1 day, with no IT involvement, and Excel users can keep working in Excel/Sheets while the source of truth moves to FinPlan Pro.

### Top deliverables

| #    | Deliverable                                                                                                                                         | Priority | Success metric                                                         |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| 2.1  | 50+ pre-built ERP/CRM/HRIS integrations (NetSuite, QuickBooks, Xero, Sage Intacct, Salesforce, HubSpot, Gusto, Rippling, ADP, Workday, etc.)        | P0       | 50 connectors live; median time-to-first-sync <30 min                  |
| 2.2  | Bidirectional Excel add-in (Cube's positioning) + Google Sheets add-in                                                                              | P0       | Cube parity on add-in UX; 1-click install from Office Add-in Store     |
| 2.3  | Data warehouse sync (Snowflake, BigQuery, Databricks) for both extract and write-back                                                               | P1       | 3 customers running nightly warehouse sync in production               |
| 2.4  | Self-service ETL visual builder (Abacum's "finance-owned, no IT" positioning)                                                                       | P1       | 80% of pilot customers build their own pipelines without support       |
| 2.5  | Sector templates: SaaS (MRR, churn, LTV), Retail (SKU, store), Manufacturing (BOM, capacity), Healthcare (RCM), Professional Services (utilization) | P0       | 5 templates shipped; median pilot time-to-first-dashboard <1 day       |
| 2.6  | Customer-facing marketplace for community-built integrations (read-only at launch)                                                                  | P2       | 25 community integrations listed by end of Q4                          |
| 2.7  | Branded customer reports (white-label PDFs, scheduled emails)                                                                                       | P1       | 100+ scheduled reports across pilot base                               |
| 2.8  | Multi-currency, multi-GAAP, multi-entity consolidation in production at scale                                                                       | P0       | 1 customer running 25+ entities in production                          |
| 2.9  | Public roadmap + public changelog + feature-vote board                                                                                              | P2       | 200+ votes on roadmap; 50+ customer-submitted feature requests triaged |
| 2.10 | Mid-market GTM motion (Pigment / Drivetrain lane): sales engineer hire, ICP definition, 3 case studies                                              | P0       | 10 mid-market customers; $30 k MRR                                     |

### Success metrics for Phase 2

- **Revenue gate:** 30 paying customers, $120 k MRR by end of Q4 2027.
- **Integration gate:** 50 live connectors; 80% of pilots use ≥3 connectors weekly.
- **Excel gate:** 30% of pilot MAUs come from the Excel add-in (Cube-style adoption pattern).
- **NPS gate:** NPS ≥40 (top quartile for B2B SaaS).

### Dependencies for Phase 2 → Phase 3

- 30 paying customers providing the training data and feedback for AI features.
- SOC 2 Type II in hand for 12+ months.
- 1 customer references Snowflake/BigQuery sync as "the reason we signed."

---

## Phase 3 — Q1–Q2 2028: AI Copilot, ML Forecasting, Document AI, Sector AI

**North star:** The product feels like it has a CFO's brain inside it. Users describe a question in English; the system interprets, queries the OLAP cube, and answers with a chart, a scenario, or a draft memo.

### Top deliverables

| #    | Deliverable                                                                                       | Priority | Success metric                                                                      |
| ---- | ------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------- |
| 3.1  | **AI Copilot** (NL → SQL/OLAP) in-app chat; backed by NIM (Llama 3.1 70B) via the Phase 1 proxy   | P0       | 50% of pilot MAUs use Copilot weekly; 70% task completion rate on internal eval set |
| 3.2  | **ML forecasting** (Prophet, NeuralProphet, N-BEATS) selectable per series; backtest harness      | P0       | 30% MAE reduction vs naive seasonal baseline on customer data                       |
| 3.3  | **Document AI** — ingest PDFs (10-Q, board decks, contracts) and extract assumptions              | P1       | 100+ documents processed per pilot; 85% F1 on field extraction                      |
| 3.4  | **Sector AI personas** — SaaS Copilot, Retail Copilot, etc. with sector-specific prompts and KPIs | P1       | 5 sector Copilots shipped; each with ≥1 reference customer                          |
| 3.5  | **Anomaly detection** (Prophix Signals positioning) on all financial series with auto-narrative   | P1       | 90% precision@10 on internal eval; <5% alert fatigue rate                           |
| 3.6  | **Auto-scenario generation** — Copilot proposes 3 what-if scenarios from a natural-language goal  | P2       | 30% of users who try it ship at least 1 generated scenario                          |
| 3.7  | **AI Backsolving** (Abacum positioning) — "what would have to be true to hit the goal?"           | P2       | 10% of MAU use it; meets internal CPA review                                        |
| 3.8  | **AI safety** — human-in-the-loop, model card, hallucination guardrails, content policy           | P0       | 0 customer-reported hallucination incidents in production; quarterly red-team       |
| 3.9  | **Pro tier** (AI features gated) at $500/seat/mo + usage                                          | P0       | 20% of customers upgrade to Pro; AI revenue >10% of total MRR                       |
| 3.10 | **AI evals + observability** — Langfuse or Helicone, prompt versioning, regression suite          | P1       | 100% of AI features in eval suite; weekly regression run                            |

### Success metrics for Phase 3

- **AI adoption gate:** 50% WAU on Copilot; 30% of customers on Pro tier.
- **AI quality gate:** ≥85% on internal eval suite; 0 SEV-1 hallucination incidents.
- **Revenue gate:** 75 customers, $400 k MRR by end of Q2 2028.
- **Burn gate:** Gross margin >70% on AI compute (post-Phase-1 proxy amortization).

### Dependencies for Phase 3 → Phase 4

- 12+ months of production AI traffic training the safety/quality harness.
- Pro tier validated in market (≥15 paying Pro customers).
- ML platform team hired (1 MLE + 1 applied scientist).

---

## Phase 4 — Q3 2028 – Q4 2029: Mobile, Public SDK, Marketplace, White-Label, PE/VC, Embedded

**North star:** FinPlan Pro is the FP&A platform of record for the next 1,000 mid-market customers. The product is embeddable, mobile-first, and 10× the surface area of the Phase 0 product.

### Top deliverables

| #    | Deliverable                                                                                                             | Priority | Success metric                                                     |
| ---- | ----------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------ |
| 4.1  | **Mobile apps** (iOS + Android, React Native) for CFO + executive dashboards, approval flows, scenario review on the go | P0       | 30% of MAUs open the mobile app weekly; App Store rating ≥4.5      |
| 4.2  | **Public TypeScript + Python SDKs** with first-class auth, retries, and observability                                   | P0       | 100+ customer-built integrations; 50+ community SDK projects       |
| 4.3  | **Marketplace** (read + write) — 200+ community integrations; rev share with builders                                   | P0       | 200 listings; 20% of new customers install ≥1 marketplace app      |
| 4.4  | **White-label** (banks, accounting firms) — rebrand + multi-tenant per reseller                                         | P0       | 5 white-label resellers live; 10% of revenue from channel          |
| 4.5  | **PE/VC portfolio reporting** — roll-up 50+ portfolio companies into one dashboard                                      | P1       | 3 PE/VC firms as customers; 100+ portfolio companies in production |
| 4.6  | **Embedded FP&A** — JS widget + iframe for SaaS products to offer FP&A to their SMB users                               | P1       | 5 SaaS partners live; 50 k end-users via embed                     |
| 4.7  | **Realtime data network** — inter-company benchmarking (Syft's positioning), anonymized                                 | P2       | 100+ contributors; median opt-in reward = $500/yr credit           |
| 4.8  | **SOC 2 Type II + ISO 27001 + HIPAA** (healthcare vertical)                                                             | P0       | ISO 27001 cert; 1 healthcare customer in production                |
| 4.9  | **Internationalization** (real translation pipeline via Crowdin, not stubs) — 10 languages                              | P1       | 10 locales fully translated; 20% of new signups non-English        |
| 4.10 | **Self-serve enterprise tier** — admin SSO, audit log export, custom data residency                                     | P0       | 5 self-serve enterprise customers (no sales touch); $100 k+ ACV    |

### Success metrics for Phase 4

- **Revenue gate:** 500 customers, $3 M ARR by end of Q4 2029.
- **Adoption gate:** 30% MAU on mobile; 30% MAU on marketplace app or embed.
- **Channel gate:** 30% of revenue from white-label, marketplace, or embed.
- **Geography gate:** 20% of revenue from outside North America.
- **NPS gate:** NPS ≥50 (top decile for B2B SaaS).

### Dependencies for Phase 4 → (Phase 5, beyond roadmap)

- The product is a platform, not a feature. The Muse team may need to grow from 7 to 12+.
- A real GTM org (sales, marketing, CS, support) is in place.
- A board + outside investors are likely involved by this point.

---

## Cross-phase risks (read these before changing the order)

| Risk                              | Affected phase    | Mitigation                                                                        |
| --------------------------------- | ----------------- | --------------------------------------------------------------------------------- |
| Backend hiring lag                | Phase 1           | Founder writes the first 10 endpoints personally; engage contractor for the rest  |
| SOC 2 timeline slip               | Phase 1 → Phase 2 | Start Vanta/Drata setup in Phase 0; don't wait for Phase 1                        |
| AI cost overrun                   | Phase 3           | Caching, prompt compression, per-tenant rate limits; revisit gross margin monthly |
| Excel add-in complexity           | Phase 2           | Hire 1 engineer with Office Add-in experience; consider Microsoft co-sell motion  |
| Multi-entity tax complexity       | Phase 2           | Partner with a tax firm (Andersen, RSM) for the first 3 implementations           |
| White-label product fragmentation | Phase 4           | Maintain a single codebase; the customer-facing brand is a config, not a fork     |

---

## Strategic bets (the 4 things we are committing to)

A roadmap is a list of bets. These are the 4 bets that, if we are right, define the next 3 years. If we are wrong on any of them, the plan changes materially.

### Bet 1 — Multi-tenant SaaS is the wedge, not the destination

**The bet:** Mid-market companies (50-1,000 FTE) will pay $1.5 k-50 k/yr for an FP&A platform that beats their current Excel/Sheets workflow, even if it doesn't beat Anaplan at the enterprise tier.

**Why it matters:** This is the entire revenue model. If mid-market doesn't pay, we have to either move upmarket (where Anaplan/Pigment play) or downmarket (where Wave/Xero play), and the plan changes.

**Evidence so far:** 3 founder-led customer-discovery interviews (per NYC FP&A Meetup notes 2026-04-22) confirmed mid-market is underserved; "Pigment is too expensive for us, Anaplan is too much setup, Excel is too fragile" was the verbatim quote from 2 of 3.

**What would make us wrong:** Mid-market expects consumer-grade UX (i.e., Wave) and won't pay $1.5 k/yr. Or they expect enterprise-grade governance (i.e., Anaplan) and won't pay <$50 k/yr.

**Decision gate:** 5 design-partner LOIs by 2026-09-30 (D-002-pending). If we get 3, the bet is on. If we get <2, we need to reconsider.

### Bet 2 — AI is the wedge for Phase 3, not Phase 1

**The bet:** Customers will not pay a premium for AI in 2026-2027; they will pay a premium for AI in 2028+ when the technology is more reliable and the use cases are battle-tested.

**Why it matters:** If we try to ship AI in Phase 1, we either (a) take on technical debt we can't afford, or (b) miss the Phase 1 backend milestone. The cleanest path is to make Phase 1 a "great FP&A SaaS without AI" and Phase 3 "great FP&A SaaS with AI." We will lose deals to Pigment in 2027; we will win deals back in 2028.

**Evidence so far:** Anaplan's "Anaplan Intelligence" launched at $0 add-on suggests AI isn't yet a paid feature in the enterprise. Pigment AI launched as a paid add-on but is too new to have adoption data.

**What would make us wrong:** If by Q1 2027, 3+ competitors have shipped AI features that customers actively pay for, we must pull AI Copilot MVP into Phase 2 (deliverable 2.11).

**Decision gate:** Q4 2026 quarterly review (Sep 2026); the 6-Muse cycle will surface AI competitive moves in real time.

### Bet 3 — Excel/Sheets will remain the #1 UX surface for FP&A through 2028

**The bet:** Despite every "Excel-killer" marketing campaign, finance teams will still live in Excel/Sheets. Our wedge is to be the best FP&A platform that ALSO works in Excel/Sheets, not the platform that replaces them.

**Why it matters:** This justifies the Phase 2 deliverable 2.2 (Excel/Sheets add-in) and gives us a Cube-style distribution path. It also means we should NOT try to migrate customers off Excel/Sheets; we should make our platform the source of truth that Excel/Sheets sync to.

**Evidence so far:** Cube's entire business model is built on this bet. Microsoft, Google, and the Big 4 accounting firms all assume Excel/Sheets are the user interface, not the system of record.

**What would make us wrong:** If AI agents (ChatGPT, Claude, Copilot) become the dominant UX for finance work by Q2 2027, the bet shifts. We watch for 2 signals: (a) when Microsoft ships Copilot for Excel with formula execution, and (b) when finance job postings start requiring "prompt engineering" skills.

**Decision gate:** Q3 2026 quarterly review.

### Bet 4 — White-label and marketplace come AFTER, not BEFORE, the product is great

**The bet:** Trying to be a platform (marketplace, white-label, embed) before the core product is great is a recipe for a feature-bloated mess. We must be a great FP&A product first (Phase 1-2), and only THEN become a platform (Phase 4).

**Why it matters:** This is a discipline bet. Every quarter we'll be tempted to add a "platform" feature (an integration, a partner program, a marketplace listing). The discipline to say "not this quarter" is what separates a product from a feature pile.

**Evidence so far:** Vendr (procurement SaaS) tried to be a marketplace too early and lost focus. Notion launched the API and templates in the right order. Cube built a great product first, then added the platform later.

**What would make us wrong:** If a strategic partner (e.g., a Big 4 firm) demands white-label as a condition of a $500 k+ deal, we may need to pull Phase 4 work forward. But only for that one deal, not as a general principle.

**Decision gate:** Q1 2027 quarterly review.

---

## What we are NOT building (anti-roadmap)

The Muse team gets asked for many things. This is the explicit list of "no, not this year." Re-evaluate quarterly.

| Idea                                      | Why we're not building it                                                  | When to reconsider                          |
| ----------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------- |
| Cryptocurrency / DeFi accounting          | Not the ICP; adds regulatory burden                                        | Q4 2027 (Phase 2 retrospective)             |
| Personal finance (consumer)               | Different ICP; different unit economics                                    | Never, by current strategy                  |
| Custom chart builder (drag-and-drop)      | Cube has this; it's not a wedge; defer to Phase 4                          | Phase 4                                     |
| Native Mac / Windows desktop app          | The web app is the product; Tauri/Electron are 2-year detours              | Phase 4 (after mobile validates the demand) |
| Blockchain / NFT anything                 | No.                                                                        | Never.                                      |
| In-house payments / AP automation         | Different product; Bill.com / Ramp own this                                | Phase 2 (as an integration, not a build)    |
| Forecasting for crypto / Web3 startups    | Not the ICP                                                                | Q4 2027                                     |
| "AI that writes the financial close memo" | Phase 3 deliverable 3.3 (Document AI) is the closest; do not duplicate     | Phase 3                                     |
| White-label in Phase 0 or Phase 1         | Distracts from the platform wedge; requires multi-tenant to be solid first | Phase 4                                     |

---

## Glossary (for the founder and the Muses)

| Term                              | Meaning                                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **CPF (Customer-Pilot Flywheel)** | The metric: 5 LOIs → 5 paid pilots → 5 referenceable customers → 10 LOIs.                                          |
| **DRAFT v0.1**                    | The marker Strategos puts on every doc until the founder approves; strip on approval.                              |
| **DDC (Decider-Decision-Cycle)**  | The minimum time from "I need a decision" to "decision made + logged": 7 days.                                     |
| **GTV (Gross Trust Value)**       | A non-revenue metric: # of customers who would publicly reference us.                                              |
| **Hero workflow**                 | One of the 5 workflows every pilot must use: budget, forecast, scenario, consolidation, dashboard.                 |
| **NPS gate**                      | The minimum NPS required to advance to the next phase: 20 in Phase 1, 30 in Phase 2, 40 in Phase 3, 50 in Phase 4. |
| **Phase 0 exit criteria**         | The 6 conditions listed under "Phase 0 sprint plan." All 6 must be green.                                          |
| **Three Witnesses**               | The verification rule: every strategic claim cites (a) source doc, (b) data point, (c) competitive context.        |
| **The 100× promise**              | From `PRODUCT_VISION.md §2`. "100× better FP&A platform than the 2025-Q4 baseline."                                |
| **The 7 Muses**                   | Apollo, Athena, Prometheus, Hera, Hephaestus, Mnemosyne, Strategos.                                                |
| **TTV (Time-to-Value)**           | Time from signup to first useful dashboard. Target: <1 hour by end of Phase 1, <15 min by end of Phase 2.          |

---

## Change log

| Date       | Author    | Change                                                                                        |
| ---------- | --------- | --------------------------------------------------------------------------------------------- |
| 2026-06-12 | Strategos | Initial draft. 5 phases. 4 strategic bets. Anti-roadmap. Glossary. Awaiting founder approval. |

---

**Status:** DRAFT v0.1 — awaiting founder approval before the DRAFT marker is stripped. v0.2 refresh (2026-06-13) added cross-refs to `docs/security-deferrals.md` and the D-007 7-phase audit pattern.
**Next review:** 2026-09-12 (Q3 2026 quarterly refresh)
**Cross-refs:** `PRODUCT_VISION.md §4 (Phases)`, `STRATEGIC_REVIEW_Q2_2026.md`, `STRATEGIC_DECISIONS_LOG.md` (D-006 deferral discipline, D-007 audit pattern, D-009 triangulation), `docs/security-deferrals.md` (3 canonical deferrals), `AGENTS.md`
