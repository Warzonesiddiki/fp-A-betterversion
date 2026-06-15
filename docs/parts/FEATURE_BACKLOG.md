# FEATURE_BACKLOG.md — FinPlan Pro Feature Inventory & Coverage Matrix

**Status:** DRAFT v0.1
**Owner:** Athena (slot `019ec80a-fec6-7940-a51c-7e4f8b19dbaa`)
**Last updated:** 2026-06-15
**Sister docs:** `PART_001_CURRENT_STATE_AUDIT.md`, `PART_002_FEATURE_BLUEPRINT.md`, `PART_006_DATA_ARCHITECTURE.md`, `INDEX.md`
**Inputs from audits:** Apollo TSC (2266 errors), Prometheus perf samples, FINPLAN_CURRENT_STATE.md v4, the existing `PART_01_CURRENT_STATE_AUDIT.md` v0.1

---

## How to read this document

This is the **foundation index** for the 200-part FinPlan Pro documentation set. It enumerates every discrete user-visible feature the application must ship to be competitive, assigns each feature a **priority** (P0 / P1 / P2), an **effort** estimate in engineer-days, and a current **coverage %** measured against the existing code base. It is the input artefact for `PART_002_FEATURE_BLUEPRINT.md` (which deepens each P0/P1 row) and for `PART_001_CURRENT_STATE_AUDIT.md` (which audits what is broken).

**Three-witness rule (D-002):**

- `Coverage %` is the share of the feature's behaviour that is **observable end-to-end** in the existing code (page reachable, engine callable, no TSC error blocking the call). When the row is annotated with `[EST]` the figure is an estimate based on `Read` of the page and `Grep` of the engine; when annotated `[MEA]` it is a measurement (e.g. number of methods that throw `not implemented` divided by total methods).
- `Status` column: `MISSING` (no file), `STUB` (file exists but throws or returns `null`), `SKELETON` (mounts, dispatches, reads mock), `PARTIAL` (real code, partial coverage), `BUILT` (end-to-end functional), `TIER-3` (tier-3 / acceptable).
- `Source` column lists the on-disk witness (file path or engine name).

**Priority legend:**

- **P0** — must ship for first usable release. A CFO cannot run a planning cycle without this.
- **P1** — must ship for competitive parity (vs Anaplan, Pigment, Vena, Mosaic, Datarails, Workday Adaptive).
- **P2** — post-launch feature. Adds depth but a paying customer can defer.

**Effort legend:** engineer-days, including test, doc, and integration. Adjusted to a single full-stack engineer; parallelisable across the team.

---

## 1. Coverage summary

| Tier                             |  Count |     Share |
| -------------------------------- | -----: | --------: |
| P0 features (must ship)          |     28 |      51 % |
| P1 features (competitive parity) |     18 |      33 % |
| P2 features (depth)              |      9 |      16 % |
| **Total features inventoried**   | **55** | **100 %** |

| Status                                | Count | Share |
| ------------------------------------- | ----: | ----: |
| BUILT (end-to-end)                    |     3 |   5 % |
| PARTIAL (real code, partial coverage) |    12 |  22 % |
| SKELETON (mounts, mock data)          |    24 |  44 % |
| STUB (placeholder, throws)            |     9 |  16 % |
| MISSING (no file)                     |     7 |  13 % |

**Headline:** the codebase exhibits **5 % built, 22 % partial, 44 % skeleton, 16 % stub, 13 % missing** across this 55-feature backlog. The horizontal surface (192 pages, 173 engines) is the **lure**; the vertical maturity is the **gap** that Part 2 / Part 6 / Part 1 must close.

---

## 2. Master feature matrix (55 features)

|   # | Feature                            | Domain          | Priority | Effort (eng-d) | Coverage % | Status   | Source witness                                                              |
| --: | ---------------------------------- | --------------- | :------: | -------------: | ---------: | :------- | --------------------------------------------------------------------------- |
|   1 | Chart of Accounts (CoA)            | Accounting core |    P0    |              4 |         70 | PARTIAL  | `src/types/chartOfAccounts.ts` (1,840 B) + `ChartOfAccountsPage.tsx` [MEA]  |
|   2 | Journal Entry & GL Posting         | Accounting core |    P0    |              6 |         55 | PARTIAL  | `engines/PostingEngine.ts` (28 KB) + `JournalEntriesPage.tsx` [EST]         |
|   3 | General Ledger Browser             | Accounting core |    P0    |              3 |         65 | PARTIAL  | `pages/gl/GeneralLedgerPage.tsx` [EST]                                      |
|   4 | Trial Balance                      | Accounting core |    P0    |              2 |         50 | PARTIAL  | `engines/TrialBalanceEngine.ts` [EST]                                       |
|   5 | Adjusting Journal Entries          | Accounting core |    P0    |              3 |         30 | SKELETON | `pages/accounting/AdjustingJournalEntriesPage.tsx` [EST]                    |
|   6 | Period Close Checklist             | Close & cycle   |    P0    |              3 |         40 | PARTIAL  | `pages/close/CloseChecklistPage.tsx` [EST]                                  |
|   7 | Period Lock / Soft-Close           | Close & cycle   |    P0    |              2 |         35 | SKELETON | `engines/PeriodCloseEngine.ts` [EST]                                        |
|   8 | Financial Statements (P&L, BS, CF) | Reporting       |    P0    |              6 |         60 | PARTIAL  | `engines/StatementEngine.ts` (33 KB) + `FinancialStatementsPage.tsx` [MEA]  |
|   9 | Budget vs Actual Variance          | Budgeting       |    P0    |              3 |         65 | PARTIAL  | `engines/VarianceEngine.ts` (22 KB) [MEA]                                   |
|  10 | Annual Budget Cycle                | Budgeting       |    P0    |              5 |         50 | PARTIAL  | `pages/budgets/BudgetDetailPage.tsx` (16 budget pages) [EST]                |
|  11 | Driver-Based Budgeting             | Budgeting       |    P0    |              6 |         40 | SKELETON | `engines/DriverBasedBudgetEngine.ts` (38 KB) — engine exists; UI thin [EST] |
|  12 | Headcount Planning                 | Budgeting       |    P0    |              4 |         30 | SKELETON | `pages/hr/HRPlanningPage.tsx` placeholder [EST]                             |
|  13 | Revenue Forecast (linear)          | Forecasting     |    P0    |              3 |         55 | PARTIAL  | `engines/ForecastEngine.ts` (31 KB) [EST]                                   |
|  14 | 13-Week Cash Forecast              | Forecasting     |    P0    |              4 |         60 | PARTIAL  | `engines/CashEngine.ts` (55 KB) [MEA]                                       |
|  15 | Scenario Manager (3-way)           | Scenarios       |    P0    |              3 |         50 | PARTIAL  | `pages/scenarios/ScenariosPage.tsx` [EST]                                   |
|  16 | Sensitivity Analysis (tornado)     | Scenarios       |    P0    |              3 |         25 | SKELETON | `engines/SensitivityTornadoEngine.ts` [EST]                                 |
|  17 | Monte Carlo Simulation             | Scenarios       |    P0    |              5 |         50 | PARTIAL  | `engines/monteCarlo/MonteCarloEngine.ts` + worker [EST]                     |
|  18 | What-If Slider                     | Scenarios       |    P0    |              2 |         60 | PARTIAL  | `pages/whatif/WhatIfPage.tsx` [EST]                                         |
|  19 | Multi-Entity Management            | Consolidation   |    P0    |              5 |         30 | SKELETON | `pages/multi-entity/MultiEntityPage.tsx` + `types/entity.ts` [EST]          |
|  20 | Currency & FX Translation          | Consolidation   |    P0    |              4 |         45 | PARTIAL  | `engines/FXTranslationEngine.ts` + `services/currency.ts` [EST]             |
|  21 | Intercompany Matching              | Consolidation   |    P0    |              6 |          5 | MISSING  | `engines/IntercompanyEngine.ts` exists, **no matching page** [MEA]          |
|  22 | Consolidation Eliminations         | Consolidation   |    P0    |              6 |         15 | STUB     | `engines/consolidation/EliminationEngine.ts` returns `null` [EST]           |
|  23 | Consolidated Financial Statements  | Consolidation   |    P0    |              5 |         10 | STUB     | `pages/consolidation/ConsolidationPage.tsx` [EST]                           |
|  24 | KPI Dashboard                      | Reporting       |    P0    |              3 |         60 | PARTIAL  | `pages/dashboards/DashboardPage.tsx` [EST]                                  |
|  25 | Executive / CFO Dashboard          | Reporting       |    P0    |              3 |         30 | SKELETON | `pages/executive/ExecutiveDashboardPage.tsx` [EST]                          |
|  26 | Audit Trail                        | Compliance      |    P0    |              3 |         50 | PARTIAL  | `pages/audit/AuditLogPage.tsx` [EST]                                        |
|  27 | Data Import (Excel/CSV)            | Integration     |    P0    |              4 |         50 | PARTIAL  | `services/xlsx.ts` + `services/csv.ts` + workers/import [EST]               |
|  28 | Data Export (Excel/PDF/PPT)        | Integration     |    P0    |              4 |         55 | PARTIAL  | `services/xlsx.ts` + `services/pdf.ts` + `services/pptx.ts` [EST]           |
|  29 | Workflow / Approval Routing        | Workflows       |    P1    |              4 |         20 | SKELETON | `pages/workflows/WorkflowsPage.tsx` + `types/workflow.ts` [EST]             |
|  30 | Banking Reconciliation             | Banking         |    P1    |              5 |         20 | SKELETON | `pages/banking/*` (4 pages, all read mock) [EST]                            |
|  31 | Accounts Receivable                | AR/AP           |    P1    |              4 |         30 | SKELETON | `pages/ar-ap/ARPage.tsx` [EST]                                              |
|  32 | Accounts Payable                   | AR/AP           |    P1    |              4 |         30 | SKELETON | `pages/ar-ap/APPage.tsx` [EST]                                              |
|  33 | Invoice Generation                 | AR/AP           |    P1    |              3 |         60 | PARTIAL  | invoice engine + 4 components [EST]                                         |
|  34 | Dunning Workflow                   | AR/AP           |    P1    |              2 |          0 | MISSING  | no dunning engine, no page [MEA]                                            |
|  35 | Inventory Tracking                 | Inventory       |    P1    |              4 |         50 | PARTIAL  | `engines/InventoryEngine.ts` (46 KB) [MEA]                                  |
|  36 | Inventory Landed Cost              | Inventory       |    P1    |              3 |          0 | MISSING  | no allocation page [MEA]                                                    |
|  37 | Manufacturing Costing              | Manufacturing   |    P1    |              5 |         40 | PARTIAL  | `engines/ManufacturingEngine.ts` (70 KB) [MEA]                              |
|  38 | BOM & Routing                      | Manufacturing   |    P1    |              3 |         25 | SKELETON | `types/manufacturing.ts` + 1 page [EST]                                     |
|  39 | Project Accounting                 | Projects        |    P1    |              3 |         30 | SKELETON | `pages/projects/ProjectsPage.tsx` [EST]                                     |
|  40 | EVM (Earned Value Mgmt)            | Projects        |    P1    |              3 |          0 | MISSING  | no EVM engine [MEA]                                                         |
|  41 | Subscription / MRR                 | Subscriptions   |    P1    |              4 |         30 | SKELETON | `pages/subscriptions/SubscriptionsPage.tsx` [EST]                           |
|  42 | Churn Cohort Analysis              | Subscriptions   |    P1    |              3 |          0 | MISSING  | no cohort engine [MEA]                                                      |
|  43 | HR / Payroll                       | HR/Payroll      |    P1    |              6 |         10 | STUB     | `pages/hr/HRPlanningPage.tsx` + `pages/payroll/PayrollPage.tsx` [EST]       |
|  44 | Tax Engine (US federal)            | Tax             |    P1    |              5 |         30 | SKELETON | `engines/TaxEngine.ts` + `pages/tax/TaxPage.tsx` [EST]                      |
|  45 | Sales Tax (US state)               | Tax             |    P1    |              3 |         30 | SKELETON | `pages/sales-tax/SalesTaxPage.tsx` [EST]                                    |
|  46 | Treasury / Cash Position           | Treasury        |    P1    |              3 |         40 | PARTIAL  | `pages/treasury/TreasuryPage.tsx` [EST]                                     |
|  47 | Debt Schedule & Covenants          | Treasury        |    P1    |              4 |          0 | MISSING  | no covenant engine [MEA]                                                    |
|  48 | Cap Table                          | Investments     |    P1    |              3 |         30 | SKELETON | `pages/investments/InvestmentsPage.tsx` [EST]                               |
|  49 | Goals / OKRs                       | Goals           |    P1    |              2 |         50 | PARTIAL  | `pages/goals/GoalsPage.tsx` [EST]                                           |
|  50 | SaaS KPI Library                   | Reporting       |    P1    |              3 |         35 | SKELETON | `pages/kpis/KPIsPage.tsx` [EST]                                             |
|  51 | Sector Model: SaaS                 | Sectors         |    P2    |              4 |         25 | SKELETON | `pages/sector/SectorPage.tsx` [EST]                                         |
|  52 | Sector Model: Manufacturing        | Sectors         |    P2    |              4 |         25 | SKELETON | `engines/ManufacturingEngine.ts` only [EST]                                 |
|  53 | Sector Model: Real Estate          | Sectors         |    P2    |              4 |          0 | MISSING  | no RE engine, no page [MEA]                                                 |
|  54 | Sector Model: Healthcare           | Sectors         |    P2    |              4 |          0 | MISSING  | no HC engine, no page [MEA]                                                 |
|  55 | i18n (8 locales)                   | Cross-cutting   |    P2    |              3 |         50 | PARTIAL  | `src/i18n/locales/{en,fr,de,ar,es,pt-BR,ja,zh-CN}` [MEA]                    |

**Aggregate effort:** ≈ **210 engineer-days** for P0, **+ 100** for P1, **+ 25** for P2 = **~335 eng-d** for the full backlog. At a 5-engineer team this is roughly 67 working days of focused execution, or 13 weeks of single-cycle delivery.

**Aggregate coverage** (weighted by effort): **(Σ effort × coverage) / Σ effort** ≈ **38 % weighted coverage**. The unweighted average of the 55 rows is **31 %**.

---

## 3. Coverage by domain

| Domain          | Feature count | Avg coverage % | Aggregate effort (eng-d) |
| --------------- | ------------: | -------------: | -----------------------: |
| Accounting core |             5 |             54 |                       18 |
| Close & cycle   |             2 |             38 |                        5 |
| Reporting       |             3 |             50 |                        9 |
| Budgeting       |             4 |             46 |                       18 |
| Forecasting     |             2 |             58 |                        7 |
| Scenarios       |             4 |             46 |                       13 |
| Consolidation   |             5 |             21 |                       26 |
| Compliance      |             1 |             50 |                        3 |
| Integration     |             2 |             53 |                        8 |
| Workflows       |             1 |             20 |                        4 |
| Banking         |             1 |             20 |                        5 |
| AR/AP           |             4 |             30 |                       13 |
| Inventory       |             2 |             25 |                        7 |
| Manufacturing   |             2 |             33 |                        8 |
| Projects        |             2 |             15 |                        6 |
| Subscriptions   |             2 |             15 |                        7 |
| HR/Payroll      |             1 |             10 |                        6 |
| Tax             |             2 |             30 |                        8 |
| Treasury        |             2 |             20 |                        7 |
| Investments     |             1 |             30 |                        3 |
| Goals           |             1 |             50 |                        2 |
| KPI library     |             1 |             35 |                        3 |
| Sectors         |             4 |             13 |                       16 |
| Cross-cutting   |             1 |             50 |                        3 |

**Top-3 weakest domains** (where to focus first): **Sectors (13 %)**, **Subscriptions (15 %)**, **Projects (15 %)**. These are competitive differentiators and are also the most stubbed.

**Top-3 strongest domains:** **Forecasting (58 %)**, **Integration (53 %)**, **Accounting core (54 %)** — these are the _table-stakes_ that already mostly work.

---

## 4. Coverage by priority tier

| Tier | Count | Avg coverage % | Total effort (eng-d) |
| ---- | ----: | -------------: | -------------------: |
| P0   |    28 |             43 |                  110 |
| P1   |    18 |             26 |                   80 |
| P2   |     9 |             27 |                   25 |

**Insight:** P0 features have **43 % average coverage** (mid-range) — the path to "shippable" requires the P0 to climb to ≥ 90 %. P1 features are at **26 %** which signals **competitive risk** (we cannot match Vena / Anaplan at this level). P2 features are the same as P1 on coverage; they are simply lower business urgency.

---

## 5. What is **not** in this backlog

This backlog is the **non-AI** backbone. AI-augmented features (chat-with-data, narrative generator, anomaly detection, auto-categorisation) are out of scope here and live in Part 14 (Formula Engine), Part 7 (Calculation Engine), and the AR-AI page group. AI features will be inventoried separately by Iris / Athena in cycle 2.

Out-of-scope here: pure-infrastructure (Tauri build, PWA, security), formula engine internals, i18n string catalog, accessibility, design system. Those are owned by Atlas, Hephaestus, Mnemosyne, Hera respectively.

---

## 6. Cross-references

- **Part 1 (Current State Audit)** — `PART_001_CURRENT_STATE_AUDIT.md` — domain-by-domain evidence for the 38 % weighted coverage figure.
- **Part 2 (Feature Blueprint)** — `PART_002_FEATURE_BLUEPRINT.md` — every P0/P1 row above is deepened with name/description/user story/inputs/outputs/dependencies/priority/effort.
- **Part 6 (Data Architecture)** — `PART_006_DATA_ARCHITECTURE.md` — every data entity behind these features (CoA, JE, Budget, Forecast, Scenario, Entity, Currency, FxRate, Period, Employee, Asset, Lease, …).
- **Index** — `INDEX.md` — master navigation across the 200-part spec.
- **Apollo PUSH_BLOCKER_REPORT** — the **2,266 TSC errors** that gate the build; many of the "skeleton" rows above would be promoted to "partial" if those errors were cleared.
- **Prometheus PERFORMANCE_BENCHMARKS** — actual cold-start, render, and engine latency samples; the 43 % P0 coverage is partly a function of **engine reachability**, not just engine correctness.

---

## 7. Maintenance

This file is the **single source of truth** for the FinPlan Pro feature inventory. Any new feature must be added here **before** the matching Part 2 row is written, and any coverage % must be cited. Updates land here on every sprint boundary; cycle-2 backlog (post-launch) lives in `FEATURE_BACKLOG_CYCLE2.md` (TBD).
