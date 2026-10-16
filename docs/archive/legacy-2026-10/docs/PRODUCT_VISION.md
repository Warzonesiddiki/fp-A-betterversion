# 🏆 FinPlan Pro — Product Vision

> **The North Star:** _The all-in-one FP&A platform so complete that after using it, the user needs no other application in this domain._

> **Authoritative framing:** 2026-06-12 (Leader + Strategos, ratified by founder)
> **Status:** Living document — Strategos (the 7th Muse) maintains this and the strategic index.
> **Last verified against repo:** 2026-06-12

---

## 1. The Vision in One Sentence

FinPlan Pro is an **offline-first, desktop-native, AI-augmented, sector-tuned, all-in-one FP&A platform** that obsoletes every competitor in the Financial Planning & Analysis domain by combining the depth of Anaplan, the speed of Pigment, the AI of Drivetrain, the Excel-native UX of Cube, the vertical depth of 17 sector configurations, the openness of a plugin ecosystem, and the audit-grade explainability of OneStream — into a single application that runs on the user's machine, costs one-time instead of $50K+/year, and never sends their financial data to the cloud unless they explicitly choose to.

## 2. The "100× Better" Framework

A FP&A platform is "100× better" than the average competitor if it wins on **at least 8 of these 10 dimensions by an order of magnitude**:

| #   | Dimension                   | Today (best competitor)            | FinPlan Pro target                                                  |
| --- | --------------------------- | ---------------------------------- | ------------------------------------------------------------------- |
| 1   | **Time to first value**     | 2-6 weeks (Anaplan)                | **30 minutes** (P0 onboarding)                                      |
| 2   | **Cost**                    | $50K-$100K+/yr (Anaplan/OneStream) | **$0 self-host** or **$20-50/user/mo** cloud                        |
| 3   | **Vertical depth**          | 5 sectors (Anaplan)                | **17 sector-tuned** + AI models per sector                          |
| 4   | **Offline capability**      | None (cloud-only)                  | **Tauri desktop** with .fpa file format                             |
| 5   | **AI capability**           | Basic forecasting                  | **Conversational FP&A Copilot** with sector-tuned models            |
| 6   | **Real-time collaboration** | None (Anaplan)                     | **Figma-style multi-user editing**                                  |
| 7   | **Integration breadth**     | 200 (Anaplan)                      | **50 curated + unlimited via SDK**                                  |
| 8   | **Explainability**          | Black box                          | **Every cell traceable to source + assumption**                     |
| 9   | **Open & extensible**       | Closed                             | **Public SDK, plugin marketplace, MIT-style licensing for engines** |
| 10  | **Mobile**                  | None or read-only                  | **Full edit + AI on phone** (iOS/Android via Tauri)                 |

## 3. Strategic Pillars (How We Win)

### Pillar 1: **Depth** — 178+ engines covering every FP&A sub-domain

- Planning, budgeting, forecasting, scenario, sensitivity, Monte Carlo
- Consolidation, intercompany, currency translation, multi-entity
- Cash, treasury, debt, working capital, CapEx
- Tax, transfer pricing, ESG, audit, SOX
- 17 sector-specific engines (Banking NIM, SaaS metrics, healthcare rev cycle, construction costing, energy emissions, etc.)
- 245+ formula functions (Excel parity)
- 6 advanced chart types beyond competitors' basic 3

### Pillar 2: **Vertical Specialization** — 17 industries, not generic

Agriculture · Banking · Construction · Education · Energy · Government · Healthcare · Hospitality · Insurance · Logistics · Manufacturing · Real Estate · Retail · SaaS · Technology · Telecom (+ 1 catch-all Sector)

Each sector gets:

- A dedicated dashboard (`src/pages/sector/<name>/`)
- A template (`src/engines/templates/<Name>Planning.ts`)
- Sector-tuned chart defaults
- Industry-specific KPIs
- Compliance templates (e.g., SOX for public, HIPAA for healthcare, GDPR for EU, CSRD for ESG)

### Pillar 3: **Offline-First Desktop** — Tauri + .fpa single-file format

- One file contains the entire workspace (data, models, reports, formulas, charts, audit trail)
- AES-256 encryption optional
- Cross-platform: Windows + macOS + Linux desktop
- iOS/Android via Tauri mobile (Phase 4)
- Sync to cloud is opt-in, not required
- Competes with: nothing (every competitor is cloud-only)

### Pillar 4: **AI-Native FP&A** — Not bolt-on, built in from day one

- **NIM integration** for conversational AI (`src/services/nim.ts`)
- **NLQ engine** for "show Q3 revenue by region" (`NLQEngine.ts`)
- **Anomaly detection** with auto-explanation (`AnomalyDetectionEngine.ts`, `AnomalyExplainer.tsx`)
- **Auto-commentary** generating management-narrative text (`AutoCommentaryEngine.ts`)
- **Monte Carlo** simulation for uncertainty (`MonteCarloEngine.ts`)
- **Goal seek** for "what would it take" (`GoalSeekEngine.ts`)
- **AI Copilot** for conversational planning (`AICopilotEngine.ts`, `FinanceCopilotEngine.ts`)

### Pillar 5: **Open & Extensible** — Plugin ecosystem, not a walled garden

- Plugin registry (`src/plugins/registry.ts`)
- Plugin marketplace UI (`src/pages/plugins/PluginMarketplace.tsx`)
- Plugin sandbox with AST allowlist (`src/services/plugin/PluginSandbox.ts`)
- 245+ formula functions exposed for plugin authors
- Future: public npm SDK, third-party plugin marketplace

### Pillar 6: **Audit-Grade Explainability** — Every number traceable

- Audit trail (`src/pages/audit/AuditTrail.tsx`)
- Cell-level data lineage
- Assumption documentation
- SOX compliance engine (`SOXComplianceEngine.ts`)
- Fair value + impairment auditing
- Versioned snapshots for "what changed since Q2 close"

## 4. The 4-Phase Roadmap (4 years, end-to-end)

### Phase 0: Foundation (2026 Q1-Q2) — **CURRENT (perfection cycle)**

**Goal:** Code quality bedrock. TSC=0, lint=0, build OK, 8,334+ tests pass.
**Status:** IN PROGRESS. Pre-push queue active.
**Muses:** Apollo (ships), Athena (structure), Prometheus (perf), Hera (UX), Hephaestus (security), Mnemosyne (docs).

### Phase 1: Backend & Identity (2026 Q3 - 2027 Q1) — **NEXT**

**Goal:** Real backend, real auth, multi-tenant, public API.
**Key deliverables:**

- Node + Postgres + Redis + S3-compatible storage
- Auth0 OR self-hosted (OIDC + SAML + MFA)
- Multi-tenant data isolation (row-level security)
- Public REST API with OpenAPI 3.1 spec
- Webhook system
- Audit log server-side
- Real-time collaboration (Yjs / Liveblocks on Postgres)
- SOC 2 Type I → Type II
- ISO 27001
  **Muses:** Strategos (priorities) + Apollo (ships) + Hephaestus (security)

### Phase 2: Integrations & Data (2027 Q2-Q4)

**Goal:** 50+ data source connectors. ERP/CRM/HRIS/Banking/Data Warehouse.
**Key deliverables:**

- 20+ ERP: SAP, Oracle, NetSuite, Dynamics, Sage, Workday, etc.
- 5+ HRIS: Workday, BambooHR, Gusto, Rippling, ADP
- 5+ CRM: Salesforce, HubSpot, Pipedrive, Zoho
- 5+ Accounting: QBO, Xero, Sage, FreshBooks, Wave
- Banking: Plaid, TrueLayer
- Revenue: Stripe, PayPal, Square
- DW sync: Snowflake, BigQuery, Redshift
- Excel/Sheets two-way live link
- Fivetran/Airbyte-style custom connector SDK
  **Muses:** Strategos (priority order) + Hephaestus (credential security) + Athena (connector architecture)

### Phase 3: AI & Advanced Analytics (2028 Q1-Q2)

**Goal:** Industry-leading AI. Conversational FP&A Copilot as a category-killer.
**Key deliverables:**

- ML forecasting (Prophet, ARIMA, LSTM, transformer-based)
- Conversational AI Copilot (full FP&A workflows in natural language)
- Document AI (parse contracts, invoices, bank statements)
- Auto-commentary with finance-domain fine-tuning
- Anomaly root-cause explanation
- Smart categorization
- Industry-specific AI models (17 sector-tuned)
- Voice + mobile AI
  **Muses:** Prometheus (ML performance) + Hephaestus (data privacy) + Strategos (competitive)

### Phase 4: Ecosystem & Scale (2028 Q3 - 2029 Q4)

**Goal:** Public ecosystem, mobile, white-label, vertical depth.
**Key deliverables:**

- Mobile apps (iOS/Android via Tauri)
- Public SDK + npm package
- Plugin marketplace (public, with revenue share)
- Template marketplace (community)
- White-label / embedded mode (sell "FP&A inside your SaaS")
- Multi-language (top 10 languages)
- Public sector + non-profit verticals
- PE/VC module (fund accounting, IRR, J-curve, DPI)
- Embedded analytics SDK
- 1M+ cell capacity at sub-second response
  **Muses:** Strategos (ecosystem) + Apollo (scale) + Hera (mobile UX) + Prometheus (perf at scale)

## 5. The "All-In-One" Capability Matrix

The user must be able to do **every** of these in FinPlan Pro without leaving the app:

### Core FP&A (Phase 0-1) ✅ partially built

- [x] Annual/quarterly/monthly budgets (driver-based, ZBB, top-down, bottom-up)
- [x] Rolling forecasts
- [x] Multi-scenario planning (best/worst/most likely)
- [x] P&L / Balance Sheet / Cash Flow (3-statement)
- [x] Variance analysis + commentary
- [ ] Workforce planning (full)
- [ ] Zero-based budgeting
- [ ] Project-based P&L
- [x] CapEx planning + depreciation

### Reporting & Analysis (Phase 0-1) ✅ mostly built

- [x] P&L, BS, CF reports
- [x] Custom dashboards (DashboardBuilder)
- [x] Drill-down from summary to transaction
- [x] KPI tracking
- [x] Variance commentary
- [x] Board-ready reports (BoardPack)
- [ ] Investor reporting (IRR by fund, J-curve, DPI)
- [ ] Regulatory reporting (SEC 10-K, IFRS)
- [x] ESG reporting (CSRD report)
- [x] Segment reporting

### Consolidation (Phase 0-1) ✅ built

- [x] Multi-entity / multi-currency consolidation
- [x] Intercompany eliminations
- [x] Minority interest (NCI)
- [x] Currency translation (FXEngine)
- [x] Ownership tracking (OwnershipTree)
- [x] Multi-book (statutory + management)
- [ ] Group structure management UI

### Modeling (Phase 0-1) ✅ built

- [x] DCF / NPV / IRR / payback (CapExEngine)
- [x] Sensitivity analysis
- [x] Monte Carlo (MonteCarloEngine)
- [x] Goal seek
- [ ] Optimization (linear programming)
- [ ] Time series ML forecasting (Phase 3)

### Cash & Treasury (Phase 0-2)

- [x] Cash forecasting (CashEngine)
- [ ] 13-week cash forecast
- [x] Bank reconciliation (page)
- [ ] Banking integration (Plaid)
- [ ] Treasury management (debt covenants, investments)
- [x] Debt schedule (DebtScheduleEngine)

### SaaS Metrics (Phase 0-1)

- [x] ARR/MRR dashboard
- [x] Churn analysis
- [ ] Cohort analysis (page exists, no engine)
- [ ] LTV/CAC/NRR/GRR
- [ ] Rule of 40 / Burn multiple / Magic number
- [ ] Quick ratio / Current ratio

### AI/ML (Phase 0-1, expanded Phase 3)

- [x] Anomaly detection
- [x] Auto-commentary
- [x] NLQ (basic)
- [x] NIM integration
- [ ] Conversational Copilot
- [ ] Document AI
- [ ] ML forecasting
- [ ] Voice-driven NLQ

### Data (Phase 0-2)

- [x] Excel/CSV import
- [x] 2 ERP integrations (QuickBooks, Xero)
- [ ] 20+ ERP integrations (Phase 2)
- [ ] 5+ HRIS integrations
- [ ] 5+ CRM integrations
- [ ] Banking integration (Plaid)
- [ ] Data warehouse sync
- [ ] Excel/Sheets two-way live link

### Collaboration (Phase 1)

- [x] Multi-user stores (no backend)
- [ ] Real backend
- [ ] Real-time collaboration
- [x] Comments (CellCommentEngine)
- [x] Approval workflows (engine)
- [x] Audit trail
- [x] Notifications
- [ ] E-signature integration
- [ ] Calendar integration

### Visualization (Phase 0-1)

- [x] Custom dashboards
- [x] 30+ chart types
- [x] Reports
- [x] Sankey diagrams
- [x] Network diagrams
- [ ] Gantt charts
- [ ] Geospatial/treasury maps
- [ ] 3D charts (optional)

### Mobile (Phase 4)

- [ ] iOS app
- [ ] Android app
- [ ] Mobile-optimized dashboards
- [ ] Mobile approval workflow

### API/Extensibility (Phase 1-4)

- [ ] Public REST API
- [ ] GraphQL API
- [ ] Webhooks
- [x] Plugin registry
- [x] Formula engine (245+ functions)
- [x] Custom dimensions
- [ ] Public SDK + npm package
- [ ] Public plugin marketplace

### Industry Verticals (Phase 0-2, expanding Phase 4)

- [x] 17 sectors covered
- [ ] Public sector (full)
- [ ] Non-profit (grant accounting)
- [ ] PE/VC (fund accounting)
- [ ] Crypto/Web3
- [ ] Biotech (clinical trial costing)

## 6. Success Metrics

A quarterly business review asks: **"Did we get closer to 100× this quarter?"**

| Metric                   | 2026 Q2 (now)  | 2027 Q2 (target)  | 2028 Q2 (target)     | 2029 Q2 (target) |
| ------------------------ | -------------- | ----------------- | -------------------- | ---------------- |
| **Engines**              | 178            | 220               | 280                  | 350              |
| **Sectors**              | 17             | 17                | 20                   | 25               |
| **Templates**            | 14             | 30                | 60                   | 100              |
| **Integrations**         | 2 ERP          | 25                | 50                   | 100+             |
| **Tests**                | 8,334+         | 12,000            | 18,000               | 25,000           |
| **Lighthouse score**     | TBD            | 95+               | 95+                  | 95+              |
| **Bundle (main chunk)**  | 55.95 kB gzip  | <100 kB           | <120 kB              | <150 kB          |
| **Bundle (total JS)**    | 1.32 MB gzip   | <1.5 MB           | <1.8 MB              | <2 MB            |
| **Cold start (desktop)** | TBD            | <2s               | <1.5s                | <1s              |
| **Multi-user collab**    | None           | Yes (server)      | Yes (10+ users)      | Yes (50+ users)  |
| **WCAG**                 | 2.1 AA         | 2.1 AA            | 2.1 AA + partial AAA | 2.1 AAA          |
| **AI accuracy**          | N/A            | 70% on benchmarks | 85%                  | 95%              |
| **Time to first value**  | 4-7 days       | 1 day             | 30 minutes           | 5 minutes        |
| **Cost/user/month**      | $0 (self-host) | $20               | $30                  | $40              |
| **Customer NPS**         | N/A            | 40+               | 60+                  | 70+              |

## 7. How This Doc Stays Current

**Strategos** (the 7th Muse) owns this file. On every:

- New engine added → update §5 capability matrix
- New integration added → update §5
- New sector added → update §5 and §6 metrics
- New audit/competitive insight → update §3, §4, or §6
- Quarterly → refresh §6 success metrics

**The 6 other Muses** reference this file at the start of every new task: "Does this work move us closer to 100×?" If not, Strategos flags it for review.

## 8. Pointers to Canonical Strategic Docs

This file is the **executive summary**. For detail, read:

- **Architecture (current state):** `docs/ARCHITECTURE.md`, `docs/COMPLETE_PROJECT_SPEC.md`
- **Strategic synthesis (vision × engineering):** `docs/MERGED_MASTER_PLAN.md` (1,049 lines)
- **Competitive analysis (20 platforms):** `docs/FPA_COMPETITIVE_MATRIX.md` (817 lines)
- **1000× feature roadmap:** `docs/1000X_ADVANTAGE_ROADMAP.md` (144 lines), `docs/ADVANCED_FEATURES_ROADMAP.md` (168 lines), `docs/TIER1_FEATURES_PLAN.md` (135 lines)
- **Gap analysis (259 gaps):** `docs/MASTER_PLAN_259_GAPS.md` (320 lines), `docs/GAP_*` series
- **Desktop-first architecture:** `docs/DESKTOP_FIRST_ARCHITECTURE.md`
- **Doc navigation:** [`docs/GLOSSARY_INDEX.md`](./GLOSSARY_INDEX.md) + [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) (the 2026-08-07 docs triage consolidated the corpus; the previous STRATEGIC_INDEX index doc was archived)

**Total strategic corpus: 3,547+ lines across 8 key files, 50+ total docs.**

## 9. The 7 Muses of FinPlan Pro

The cycle runs on a multi-agent team:

| #   | Muse           | Domain                                      | Slot                                   |
| --- | -------------- | ------------------------------------------- | -------------------------------------- |
| 1   | **Apollo**     | Build & Ship (git ops)                      | `019ebcc3-0215-7080-a9a2-aae357f05dca` |
| 2   | **Athena**     | Code structure & quality                    | `019ebcc3-0224-7602-9425-7f2f067711de` |
| 3   | **Prometheus** | Performance & testing                       | `019ebcc7-adaa-7683-9d1c-965f4852cf07` |
| 4   | **Hera**       | UX, accessibility, design system            | `019ebcc7-ade6-7d70-9434-e26827f058c8` |
| 5   | **Hephaestus** | Security & data integrity                   | `019ebcd6-4372-7a52-ba61-778372c520a0` |
| 6   | **Mnemosyne**  | Documentation & architecture memory         | `019ebcd6-43a4-7ea0-bf4f-22382c665bed` |
| 7   | **Strategos**  | Product strategy & competitive intelligence | NEW (this task)                        |

Each Muse has a **persona, a domain, a memory file, and a clear "what does success look like" definition**. See `memory/` for persona details and per-muse audit reports.

---

_If the work doesn't move us toward "all-in-one, 100× better", don't do it. — Strategos_
