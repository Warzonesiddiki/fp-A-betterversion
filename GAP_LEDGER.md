# GAP_LEDGER.md — FinPlan Pro

**Persistent memory ledger.** Seeded exclusively from confirmed findings in
[DISCOVERY_REPORT.md](./DISCOVERY_REPORT.md) — never from assumption. Each entry is atomic and
testable. Evidence = literal command output with date.

- **Date of latest re-verification:** 2026-08-04 (UTC)
- **Current continuation branch:** `arena/019fcc6c-fp-a-betterversion` (post-PR-#29 session)
- **Current base:** `d1f22de` (PR #29 merge commit on `main`)

---

## PR #29 — MERGED (2026-08-04, merge commit `d1f22de` on `main`)

PR #29 ("fix: migrate remaining currency math to the money primitive; extend ratchet to
workers and server") is MERGED. Six commits, 34 files, +2,317/−246:

1. `02c9d2f` — `QuickBooksConnector` invoice subtotal `reduce +` → `roundTo(sumMoney(...))`;
   8 tests (falsified 5/8).
2. `325a164` — `glAnalysis.ts` + `glStore` (`generateTrialBalance`, `analyzeAccount` — drift
   INSIDE an already-adopted module) + `SpreadEngine` annual budget spreading incl.
   `roundToTotal` (negative halves now half-up, not `Math.round`); 19 tests (falsified 16/19).
3. `9923ed8` — `src/workers/consolidation.worker.ts` (ASC 810: FX translation, IC
   eliminations, minority interest, adjustments, category totals, balance check — raw float
   AND entirely outside the old ratchet scan) + server `gl.ts` trial-balance totals via
   decimal.js; **ratchet `FINANCIAL_DIRS` now includes `src/workers`**; 13 tests
   (falsified 6/8 worker + 5/5 server).
4. `a053f97` — server `export.ts` + `gl.ts` contract fix: trial-balance `Balance` and
   budget-vs-actual `Actual Amount`/`Variance` moved out of SQL float into exact decimal
   (`buildTrialBalanceReportRows`, `buildBudgetVsActualReportRows`); the no-visible-entities
   branch of `GET /api/gl/trial-balance` now returns the same totals shape as the populated
   path (`debit/credit/difference/balanced` — was `debits/credits/balance`); 5 tests
   (falsified 5/5) + 1 integration test.
5. `962064d` — **ratchet guard extended to `server/src`** (server adoption = modules
   importing `decimal.js`; the server package cannot import `src/utils/money.ts` across the
   package boundary); guard self-tested both directions (toFixed bump → exit 1,
   adoption-drop baseline → exit 1).
6. `8dbfadd` — drift-inside-adopters sweep (8 files): `FXEngine` (translateForConsolidation,
   calculateCTA), `LoanAmortizationEngine` (withPrepayment, balloonPayment, totalInterest),
   `RevRecEngine.handleContractModification` (ASC 606), `DepreciationEngine` (impairment,
   disposal, revaluation, declining-balance wrapper), `DebtScheduleEngine` (consolidate,
   refinance), `BreakEvenEngine.multiProduct`, `ConsolidationEngine` (equity + minority
   interest), `glStore` (normalizeGLEntry netChange, checkDuplicates fallback key); 25 tests
   (falsified 20/35).

**Real defects found and fixed (not just rounding):**
`DepreciationEngine.assetRevaluation` `Math.round(0.05 × 1.5)` → **0** in IEEE-754
(0.075 stored as 0.074999…), wiping revaluation accumulated depreciation (declared half-up
now yields 0.08) · `glStore.checkDuplicates` stored `0.2` vs re-imported `0.3 − 0.1` produced
fallback dedupe keys `0.19999999999999998` ≠ `0.2` → duplicate journal entries went
UNDETECTED · `consolidation.worker` reported a `5.551115123125783e-17` phantom imbalance on
perfectly offsetting books · `BreakEvenEngine.multiProduct` break-even revenue
`1.6721311475409835` vs exact `1.7`.

**Landed state:** ratchet baseline **95/367 (25.89%)** + server **2/23**, **0** `toFixed`
sites (`scripts/money-adoption-baseline.json`, re-recorded at each commit, never raised) ·
full suite 972 files / 11,540 tests · server suite 107/107 · `tsc --noEmit`, ESLint,
Prettier, `vite build`, `bundle-check` (warning only), `docs:verify` all green on the merge
base. CI: all required checks green; the `Build & Bundle Check` failure is the pre-existing
legacy **2048KB workflow cap** (see "CI note" below) — not caused by the PR, not a required
check, and `.github/workflows/**` stays untouched (reserved for GAP-7).

**Ledger drift note (repaired 2026-08-04, post-merge session):** the merged ledger carried
the session entries above but still pointed at base `cb42a65` (PR #28), had no merged-status
section, and its "Next Action" still nominated `QuickBooksConnector.mapInvoice` — already
shipped in commit `02c9d2f`. All three repaired in the post-PR-#29 session; see the session-6
continuation entry below.

---

## Brutal Honesty Scorecard (2026-08-03 session)

| Gap / Phase                    | Claimed Status (handover)                | Actual Verified Status (after re-check)                                                             | Evidence Quality                                                        | Corrective Action Taken                                                                                                                   |
| ------------------------------ | ---------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Baseline gates on `main`**   | "Verified green"                         | **FALSE — `main` was RED.** `tsc --noEmit` exit 2 with **79 errors** (78 in                         | Literal (tsc exit 2, eslint exit 1 on a clean checkout of `aa98b72`)    | Restored the dropped money import in `FinancialInstrumentsEngine`, fixed a stray                                                          |
|                                |                                          | `FinancialInstrumentsEngine` — arithmetic migrated but the import line deleted; 1 in                |                                                                         | `.toNumber()` on a number in `ForecastReconciliationEngine`; removed unused imports                                                       |
|                                |                                          | `ForecastReconciliationEngine`); `eslint src --max-warnings 0` exit 1 (21 prettier errors           |                                                                         | and re-ran prettier on 7 PR#24 files. After: tsc exit 0, eslint exit 0.                                                                   |
|                                |                                          | + 4 unused-import warnings across 7 files)                                                          |                                                                         |                                                                                                                                           |
| **GAP-1** (money)              | IN_PROGRESS — 13 engines migrated        | **CONFIRMED OPEN.** 20 reachable engines plus the Sage GL integration service now use the           | Literal (`money:adoption` 16.67% → 24.72%, 59 → 89 modules; 0 `toFixed` | ReportLayout and SageConnector were newly migrated and falsified. The PR #26 baseline also had broken                                     |
|                                |                                          | primitive; current full suite is 965 files / 11,491 tests passing (see continuation evidence below) | sites; full Vitest exit 0)                                              | money tests, a SaaS churn defect, directional IC double-elimination and lint drift; all repaired and re-verified.                         |
|                                |                                          |                                                                                                     |                                                                         | `ExportTemplateEngine`, `WhatIfSandboxEngine`, `YieldCurveEngine`, `ESGEngine`, `DriverCascadeEngine`, and `SolverEngine` remain rejected |
|                                |                                          |                                                                                                     |                                                                         | as non-money after strict screening.                                                                                                      |
| **GAP-4** (period close)       | IN_PROGRESS — "product decision pending" | **DECISION MADE + ALIGNED.** Soft-close **permits adjusting entries** (its accounting               | Literal (server suite 96 tests exit 0; decision test renamed)           | `isClosedState()` now returns true only for hard-close/locked; legacy `/close`                                                            |
|                                |                                          | purpose); `canPost`/`is_closed`/GL route now agree. The pinned inconsistency test is now            |                                                                         | honours it; the pinned DOCUMENTED-INCONSISTENCY test became the SOFT-CLOSE POLICY                                                         |
|                                |                                          | the SOFT-CLOSE POLICY test.                                                                         |                                                                         | test (post succeeds) + a new hard-close 403 test. The frontend state machine already                                                      |
|                                |                                          |                                                                                                     |                                                                         | implemented this policy — server now matches it.                                                                                          |
| **Phase 2** (GLEntry fixture   | "known adjacent risk, ~37 files"         | **CLOSED.** 20 fixture files fixed (25 `amount` fields added + 3 manual); `sector-pages`            | Literal (tsc exit 0; 83 tests in 17 page-test files; 4-test regression  | New regression test `gleEntryAmountInvariant.test.ts` pins LAW-3: undefined `amount`                                                      |
| debt)                          |                                          | entries typed `GLEntry[]` so the compiler rejects any future omission.                              | suite)                                                                  | now throws `InvalidMoneyError` instead of rendering `$NaN`.                                                                               |
| **Phase 4** (DebtSchedulePage) | "follow-up"                              | **DONE.** Real validated form + debtStore wiring (LeaseForm pattern), 10 integration tests +        | Literal (31 tests pass: 18 form + 10 integration + 3 smoke)             | `DebtForm` (blocking validation, exact 6.25% → 0.0625, round-trip real-date check),                                                       |
|                                |                                          | 18 form unit tests.                                                                                 |                                                                         | add/edit/delete through the persisted RBAC-gated store, reachable empty state.                                                            |
| **GAP-2** (server auth)        | VERIFIED_DONE                            | **RE-VERIFIED** — 96 tests exit 0 (was 95; +1 new hard-close blocking test).                        | Literal (server suite exit 0)                                           | none needed                                                                                                                               |
| **GAP-5** (suite)              | VERIFIED_DONE                            | **RE-VERIFIED** — full suite 945 files / 11332 tests, exit 0 (was 913 files at last session).       | Literal (full `npm run test`)                                           | none needed                                                                                                                               |

> The most important line above is the first: the handover's baseline claims did not survive a
> clean re-check — `main` after PR #24 did not even typecheck. This session opened by restoring
> the gates, then migrated 14 more engines, closed the fixture debt, made the GAP-4 product
> decision and shipped the debt data-entry path. Same discipline as last session: re-run the
> evidence, never trust the ledger.

---

## Brutal Honesty Scorecard (2026-08-02 session)

| Gap ID                     | Claimed Status (start of session)          | Actual Verified Status (after re-check)                                                     | Evidence Quality                                       | Corrective Action Taken                                                                                              |
| -------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **GAP-7** (CI SHA-pinning) | **VERIFIED_DONE**                          | **FALSE — was NOT on `main`.** `architecture:guardrails` exited **1** with 52 unpinned refs | Literal (guardrails exit 1 on a clean checkout)        | Re-pinned via new reproducible script; **still unpushable** (see Blocker #1). Status honestly downgraded to BLOCKED. |
| **GAP-3** (orphan engines) | IN_PROGRESS — "105/183 engines orphaned"   | **PREMISE WAS WRONG — 0 real orphans.** 103 of 105 reachable via the routed engine catalog  | Literal (corrected classifier + pre-existing suite)    | Fixed the measuring script, added 7 regression tests, closed the gap                                                 |
| **GAP-1** (money)          | IN_PROGRESS — 13.06%, ~145 files remaining | **CONFIRMED OPEN** — genuine, now 16.39%                                                    | Literal (`money:adoption`, 214 new known-answer tests) | 12 more reachable engines migrated; every migration proven against the old float code                                |
| **GAP-4** (period close)   | IN_PROGRESS — "E2E chain unproven"         | **CONFIRMED, now CLOSED** — and the mock DB was hiding weak assertions                      | Literal (24 new lifecycle tests, server 71→95)         | Full-lifecycle test + 4 mock-DB fidelity fixes that make existing tests STRICTER                                     |
| **GAP-NEW-A** (lease)      | PARTIAL — data-entry form remaining        | **CONFIRMED, now CLOSED**                                                                   | Literal (29 new tests incl. 9 UI→store→dashboard)      | Real form + validation; page rewired to the store                                                                    |
| **GAP-2** (server auth)    | VERIFIED_DONE                              | **RE-VERIFIED** — still green, and now stricter                                             | Literal (server suite 95 tests, exit 0)                | Mock-DB fixes removed vacuous WHERE-less assertions underneath it                                                    |
| **GAP-5** (suite)          | VERIFIED_DONE                              | **RE-VERIFIED with a caveat** — one real regression appeared and was fixed                  | Literal (2 full runs)                                  | Fixed a `$NaN`-rendering fixture defect the money migration exposed                                                  |

> **The two most important lines above are the first two.** A gap marked
> `VERIFIED_DONE` was not done at all, and a gap sized at 105 tasks was
> actually 0. Both were found by re-running the evidence instead of trusting
> the ledger. "Confident and wrong" is worse than "slow and honest."

---

## Active Backlog (dependency-ordered)

### GAP-1 — Repo-wide money migration (F-0006)

- **status:** IN_PROGRESS (genuine, long-tail)
- **acceptance_criteria:**
  - No raw `+ - * /` on currency-bearing values in engines/stores/services.
  - Every migrated function has a known-answer unit test (fixed inputs → exact decimals).
  - `npm run money:adoption` ratchet never regresses.
- **current measurement (2026-08-04, session 6):** frontend **97/377** financial modules on
  the money primitive (scanned dirs: `src/{engines,store,utils,services,workers}` +
  `src/components/ai`), **0** raw `toFixed(n)` sites; server **2/23** on `decimal.js`.
  Scanned dirs are at the adoption ceiling; the remaining genuine surface is the UI-layer
  backlog in `src/components`/`src/pages` (~80 files, session-6 entry) — unscreened in
  detail, deliberately outside the ratchet until screened.
- **progress this session (2026-08-03):** adoption **16.67% → 22.78%** (59 → 82 modules); raw
  `toFixed` sites remain **0**. Baseline lowered (ratcheted down, never up). **20 more reachable
  engines migrated** (incl. this commit), every one falsified against the old float code first — **126 drift cases
  caught** (83 in the table below + 24 in `formula-functions/financial.ts` + 3 in
  `RollingForecastEngine` + 7 in `NLQEngine` + 5 in `AggregateTableEngine` + 2 in `MultiBookEngine` + 4 in `CascadeCalculationEngine`; see the two follow-up entries).
- **engines migrated this session (2026-08-03)** (all REACHABLE — direct page imports unless
  noted):

  | Engine                      | Falsification (new test vs old float) | After migration  | Surface                                                                            |
  | --------------------------- | ------------------------------------- | ---------------- | ---------------------------------------------------------------------------------- |
  | `HealthcareEngine`          | 5 failed / 6 ✓                        | **27/27 ✓**      | HealthcareDashboard, PatientRevenuePage                                            |
  | `BondPricingEngine`         | 4 failed / 5 ✓                        | **21/21 ✓**      | BondPortfolioPage (prices/AI/dirty = money;                                        |
  |                             |                                       |                  | YTM/duration stay metrics)                                                         |
  | `ImpairmentEngine`          | 7 failed / 8 ✓ (combined)             | **31/31 ✓**      | ImpairmentPage (IAS 36)                                                            |
  | `FairValueEngine`           | (same run)                            | (same run)       | FairValuePage (ASC 820; r===g now throws instead                                   |
  |                             |                                       |                  | of Infinity)                                                                       |
  | `SegmentReportingEngine`    | 3 failed / 3 ✓                        | **15/15 ✓**      | SegmentReportingPage                                                               |
  | `RatioAnalysisEngine`       | 5 failed / 10 ✓ (combined)            | **35/35 ✓**      | ratio analysis dashboards (ratios via exact                                        |
  | `WaterfallBridgeEngine`     | (same run)                            | (same run)       | Decimal division; FCF cent-rounded)                                                |
  | `TaxEngine`                 | 5 failed / 9 ✓ (combined)             | **45/45 ✓**      | tax provisioning (ASC 740 / IAS 12)                                                |
  | `EnergyEngine`              | (same run)                            | (same run)       | energy dashboards                                                                  |
  | `VarianceAttributionEngine` | 7 failed / 3 ✓                        | **32/32 ✓**      | ASC 280 segment variance attribution                                               |
  | `ManufacturingEngine`       | 8 failed / 4 ✓ (combined)             | **20/20 ✓**      | manufacturing dashboards (OEE stays a metric)                                      |
  | `AllocationRuleEngine`      | (same run)                            | (same run)       | rule-based cost allocation                                                         |
  | `AssumptionEngine`          | 5 failed / 3 ✓ (combined)             | **24/24 ✓**      | currency-unit impact analysis (percent/count stay                                  |
  | `BudgetCollectionEngine`    | (same run)                            | (same run)       | float — not money)                                                                 |
  | `NLQEngine`                 | 7 failed / 3 ✓                        | **10/10 ✓**      | NLQChat / ChatPanel KPI + grouped aggregates                                       |
  | `AggregateTableEngine`      | 5 failed / 1 ✓                        | **6/6 ✓**        | Pre-aggregate GL debit/credit/net buckets                                          |
  | `MultiBookEngine`           | 2 failed / 2 ✓                        | **3/3 ✓**        | Multi-GAAP book debit/credit/netAmount/consolidate                                 |
  | `CascadeCalculationEngine`  | 4 failed / 8 ✓                        | **12/12 ✓**      | ASC 810/830 IC elim, NCI, FX, cum-ownership cascade                                |
  | `ConsolidationEngine`       | 5 failed / 7 ✓ (sim + existing)       | **~15+ ✓**       | ASC 810 elims, minority interest, goodwill, FX translation, category sums, balance |
  | **total (this session)**    | **106 drift cases caught**            | **331+ passing** |                                                                                    |

  All of the above were previously listed in the handover as already-migrated — they were NOT.
  Their money headers said "migrated" but the files had no money import (the same class of
  documentation drift found in `FinancialInstrumentsEngine`).

- **follow-up migrations (later same session):**
  - `formula-functions/financial.ts` — the spreadsheet formula engine's financial functions
    (registered via `FormulaFunctionRegistry`, consumed by `FormulaEngine`): P&L lines,
    NPV/PV/FV/PMT/XNPV/IPMT/PPMT/CUMIPMT/CUMPRINC, depreciation (SLN/DB/SYD/DDB/VDB/AMOR*),
    YTD/QTD/MTD/ITD/PERIOD_TO_DATE/CUMULATIVE, WEIGHTED_AVERAGE/ROLLING, currency functions
    (CONVERT_CURRENCY/TRANSLATE/ELIMINATE/FX_GAIN_LOSS/HYPERINFLATION_ADJUST), bond money
    functions (ACCRINT/PRICE/PRICEDISC/RECEIVED/TBILLPRICE/PRICEMAT/ODD*PRICE/DOLLAR\*).
    Allocation functions keep FULL Decimal precision (the registry's `toEqual([1000/6, ...])`
    contract). Metrics (IRR/XIRR/RATE/CAGR/YIELD/DURATION/day-counts/PERCENTILE/TREND) keep
    float. Falsified: **21 of 28** new known-answer tests failed on the old code (e.g.
    PV -10000.002291262748 vs -10000, PMT -536.8216230121398 vs -536.82,
    CUMIPMT 303.9049202497849 vs 303.89); 123 formula tests + 268 FormulaEngine tests pass.
  - `RollingForecastEngine` — weighted blends, trend adjustments and driver-based forecast
    generation are money (cent-rounded); the old float code also cent-rounded, but its error
    crossed cent boundaries in 3 pinned cases (0.5 vs 0.51 blend; 0.31 vs 0.3 and 0.61 vs 0.6
    driver forecasts). 24/24 tests pass.
  - **screened and REJECTED (not currency):** `AuditLogEngine` (audit bookkeeping),
    `ImportEngine` (CSV/Excel parsing), `ReportBookEngine` (report assembly; currency is a
    display string), `FinancialCloseEngine` (task lists), `PeriodLockEngine` (date locks),
    `RegulatoryReportingEngine` (rule-based report validation), `templates/*` (static driver
    config), `formula-functions/{statistical,math}.ts` (generic measure-agnostic math).

- **engines migrated this session** (all REACHABLE — i.e. wired into real pages, so the drift was
  user-visible):

  | Engine                        | Sites | Surface                                          |
  | ----------------------------- | ----- | ------------------------------------------------ |
  | `ScenarioEngine`              | 29    | WhatIfSandbox                                    |
  | `BankingEngine`               | 28    | Banking dashboards (Basel III capital adequacy)  |
  | `SaaSMetricsEngine`           | 8     | ARRDashboard, ChurnAnalysisPage                  |
  | `VarianceDecompositionEngine` | 9     | VarianceDashboardPage, BudgetVsActualPage        |
  | `COGSVarianceEngine`          | 7     | COGSVariancePage                                 |
  | `InventoryEngine`             | 7     | InventoryDashboard, InventoryPlanningPage        |
  | `CreditRiskEngine`            | 5     | credit-risk provisioning                         |
  | `LeaseEngine`                 | 10    | ASC 842 / IFRS 16 — backs the GAP-NEW-A lease UI |
  | `ICMatchingEngine`            | 16    | intercompany reconciliation / elimination        |
  | `MultiCurrencyEngine`         | 10    | ASC 830 FX translation + remeasurement           |
  | `RealEstateEngine`            | 19    | REIT metrics — NOI, cap rate, FFO/AFFO, NAV, LTV |
  | `RetailEngine`                | 17    | store-level P&L, rankings, margin reporting      |
  | `FinancialInstrumentsEngine`  | 22    | Bond/loan pricing, DCF, expected loss            |

- **evidence — every migration was falsified against the OLD code before being accepted.** Each
  new `*.money.test.ts` was run against the pre-migration implementation and had to FAIL:

  | Test file                                     | vs old float code | after migration |
  | --------------------------------------------- | ----------------- | --------------- |
  | `ScenarioEngine.money.test.ts`                | 13 failed / 10 ✓  | **23/23 ✓**     |
  | `BankingEngine.money.test.ts`                 | 12 failed / 7 ✓   | **19/19 ✓**     |
  | `COGSVarianceEngine` + `InventoryEngine`      | 19 failed / 10 ✓  | **29/29 ✓**     |
  | `SaaSMetricsEngine` + `VarianceDecomposition` | 14 failed / 14 ✓  | **28/28 ✓**     |
  | `CreditRiskEngine.money.test.ts`              | 5 failed / 10 ✓   | **15/15 ✓**     |
  | `LeaseEngine.money.test.ts`                   | 10 failed / 13 ✓  | **23/23 ✓**     |
  | `ICMatchingEngine` + `MultiCurrencyEngine`    | 17 failed / 14 ✓  | **31/31 ✓**     |
  | `RealEstateEngine.money.test.ts`              | 8 failed / 9 ✓    | **17/17 ✓**     |
  | `RetailEngine.money.test.ts`                  | 7 failed / 7 ✓    | **14/14 ✓**     |
  | **total**                                     | **105 caught**    | **214 passing** |

- **real defects found and fixed (not just rounding):**
  - `ScenarioEngine.sensitivityAnalysis` emitted **`Infinity`** as a financial figure when a
    sensitivity ratio was 0 (no divide guard). Now returns 0, pinned by a test.
  - `COGSVarianceEngine` reported a **phantom unexplained variance of `-5.55e-17`** and flipped
    `accountedFor` to `false` — a spurious "unreconciled COGS" alarm caused purely by binary
    representation.
  - **Intercompany balances that reconciled perfectly reported a residual difference.** In floats
    `0.10 + 0.20` against `-0.30` left `5.551115123125783e-17`, so a clean IC position was flagged
    out of balance — and an exactly offsetting match pair could be downgraded from `matched` to
    `partial`.
  - **A fully amortized lease did not close at zero.** Straight-line ROU depreciation left
    `2.7e-12` on the final period, so a fully depreciated asset reported a non-zero balance.
    `LeaseEngine` also now guarantees `payment = interest + reduction` on the REPORTED cents —
    rounding both components independently breaks it (238.095 → 238.10 and 4761.905 → 4761.91 sum
    to 5000.01 against a 5000.00 payment), so reduction is derived as the balancing figure.
  - `InventoryDashboard` rendered **`$NaN`** to users because its GLEntry test fixtures omitted the
    required `amount` field; the old float code summed `undefined` silently and every assertion
    passed anyway. The money primitive turned it into a loud `InvalidMoneyError` (LAW-3), which is
    how it was found.
- **representative drift caught:** Tier-1 capital `300.29999999999995`, NPL coverage ratio
  `299.99999999999994` (should be exactly 300%), ARR `1201.1999999999998`, expected-loss provision
  `9000.000000000002`, weighted runway `19.799999999999997`.
- **next_action:** continue engine-by-engine on the remaining reachable engines with raw currency
  arithmetic. Remaining candidates: `AuditLogEngine`, `CellAuditTrailEngine`, `ImportEngine`,
  `ReportBookEngine`, `ExportTemplateEngine`, `WhatIfSandboxEngine`, `SolverEngine`,
  `DriverCascadeEngine`, `RollingForecastEngine`, `FinancialCloseEngine`,
  `RegulatoryReportingEngine`, `PeriodLockEngine`, `GoalSeekEngine`, `SpreadEngine`, `XBRLEngine`,
  `templates/*`, `formula-functions/financial.ts`. (NLQEngine completed 2026-08-03.)
  **WorkforceEngine migration (2026-08-03):** genuine (compensation salary/bonus/equity/benefits/taxes/totalCost/costPerFTE are currency; headcount/attrition stay float). Reachable via manifest. Raw +/\* on salary/bonus screened (no money import).
  Falsified 3/4 money tests vs old float (drifts e.g. 0.30000000000000004, 0.28400000000000003, 0.15000000000000002). Post: 4/4 exact toBe; money header + import; all currency paths use addMoney/multiplyMoney/sumMoney/roundTo. Adoption +1 to 87/360 (24.17%). Falsify (stash → OLD FAILs on exact toBe → pop → PASS). `money:adoption --update` ratchet holds. Commit follows.
  Screen each first — several are measure-agnostic cell math or unit conversions rather than currency.
  Screened and REJECTED this session as non-money: `ExportTemplateEngine` (PDF page geometry),
  `WhatIfSandboxEngine` (measure-agnostic cell deltas), `YieldCurveEngine` (pure rates),
  `ESGEngine` (carbon/energy physical units), `DriverCascadeEngine`/`SolverEngine` (generic DAG/solver math),
  `MultiBookEngine`, `XBRLEngine` (taxonomy/value mapping, not currency).
  **NLQEngine migration (2026-08-03):** genuine money (GL netChange aggregations into revenue/expenses/profit
  KPIs for NLQ surfaces). Falsified: 7/10 tests failed on old float (drift 0.30000000000000004, 300.29999999999995 etc).
  Post: 10/10 exact. Adoption +1 module (21.94%), commit d376685.
  **CascadeCalculationEngine migration (2026-08-03):** genuine (ASC 810/830 IC eliminations, NCI, FX impact, cumulative ownership chains, cascade sums).
  Falsified 4/12 money tests vs old float (drifts: 45.30002265 vs 45.3, 0.0333333 vs 0.03, 0.0999999 vs 0.1, 0.30000000000000004 vs 0.3 on sums + elim/NCI).
  Post: 12/12 PASS (exact toBe). Existing 15 tests remain green. Adoption +1 module (22.78%).
  `npm run money:adoption -- --update` ratchet: 81 → 82 modules. Commit to follow.
  **ConsolidationEngine migration (2026-08-03):** genuine (ASC 810 eliminations IC+auto, minority interest calc (effective + simple), goodwill (ASC 805), FX translation (ASC 830), category sums, balance checks, effective ownership chains).
  Falsified ~5-7 cases vs old float (drifts e.g. 0.30000000000000004 on IC sums, 199.99999999999994 on minority, 4200 vs exact on net, 400 exact on goodwill after fix).
  Post: money paths use add/sub/mult/div/sum/roundTo; .money.test.ts (12 tests) + existing suite (large) green. Adoption +1 (22.78%). Ratchet holds. Commit follows.
  **ForecastMethodEngine migration (2026-08-03):** genuine (forecast values are currency amounts; SMA/WMA/exponential/holt-winters/linear-regression/seasonal/ensemble/mean/sums/products on forecast series in financial context). Reachable via manifest. 68+ raw arith sites screened (reduce + , \* , sums).
  Falsified 3/8 money tests vs old float (drifts: 0.10000000000000002, 23.333333333333332, 0.09999999999999999 on SMA/WMA/ensemble).
  Post: 8/8 PASS exact toBe; existing test 11/11 green. Money header + import; all forecast arrays use add/sub/mul/div/sum/roundTo (cents). Metrics/alphas/periods stay float. Adoption +1 (23.06%). `npm run money:adoption -- --update` ratchet 82→83. Commit 39b938b.
- **Phase 2 (fixture debt) — RESOLVED 2026-08-03:** 20 test files were building GL entry fixtures
  without the required `amount` field (the `$NaN` class of defect). All fixed:
  - `sector-pages.test.tsx` mock entries typed `GLEntry[]` (compiler now rejects omissions);
  - 19 more page/store-mock files gained `amount` (= `netChange`, matching the `glStore`
    convention) on every GL fixture;
  - new regression suite `src/engines/__tests__/gleEntryAmountInvariant.test.ts` (4 tests): an
    undefined `amount` throws `InvalidMoneyError` (LAW-3) instead of silently producing NaN, and
    the same entries yield exact figures once `amount` is present.
    Evidence: `tsc --noEmit` exit 0; 17 affected page-test files → 83 tests passed; regression
    suite 4/4.

#### GAP-1 continuation — 2026-08-03 (current branch `arena/019fc804-fp-a-betterversion`)

- **Fresh evidence before work:** `node scripts/money-adoption.mjs` reported **87/360 (24.17%)**
  modules on the primitive and **0** raw `toFixed(n)` sites; `node scripts/engine-reachability.mjs`
  reported **180/180 reachable** (77 direct, 103 lazy, 0 orphans). The post-work ratchet is
  **88/360 (24.44%)**, still **0** `toFixed(n)` sites.
- **Strict store screening — rejected, no migration:** `budgetStore`, `forecastStore`, `debtStore`,
  `leaseStore`, `glUploadStore`, `cubeStore`, `constructionStore`, and `analyticsStore` are
  persistence/CRUD, undo/cache, generic OLAP, or string-display paths with no amount arithmetic.
  `esgStore` calculates a compliance-score percentage from physical ESG metrics, not currency.
  `IterativeCalculationEngine` was also rejected: its values/tolerance are measure-agnostic
  spreadsheet convergence inputs, despite debt being mentioned in a comment. These are not
  candidates under the currency-only rule.
- **`ReportLayoutEngine` — MIGRATED (genuine, reachable through the lazy engine manifest):** P&L
  revenue/COGS/operating expense/profit plus balance-sheet asset/liability/equity totals were raw
  `+`/`-` over actual financial-report values. Added the money header/import and replaced both
  aggregators with `sumMoney`, `subtractMoney`, and cent `roundTo`; display geometry remains
  non-money. New `ReportLayoutEngine.money.test.ts` has **7 exact `toBe`** answers. Its old code
  failed **7/7** (`0.30000000000000004`, `0.10000000000000003`, and unrounded `0.202` among the
  received values); restored code passes **7/7**, and the existing layout suite passes **8/8**.
  Adoption increased **87 → 88**.
- **`SageConnector.aggregateGLBalance` — MIGRATED (genuine financial integration service):**
  imported Sage Intacct `DEBITAMOUNT`, `CREDITAMOUNT`, totals, and `netChange` were raw
  `Math.round`/`+`/`-` currency arithmetic. Added the money header/import and now rounds each
  imported GL row with `roundTo`, aggregates with `sumMoney`, and calculates net with
  `subtractMoney`. New `SageConnector.money.test.ts` has **4 exact `toBe`** answers. Its old
  `Math.round` path failed **2/4**, returning **1.00** where decimal half-up requires **1.01** for
  imported `1.005`; restored code passes **4/4**, and the existing Sage suite passes **16/16**.
  Adoption increased **88 → 89 (24.72%)** with **0** raw `toFixed(n)` sites. Implementation commit:
  `d25ce0d` (`fix: use decimal money math for Sage GL balances`), with staged ESLint, TypeScript,
  Prettier, and secret-scan pre-commit gates passing.
- **PR #26 verification repair (do not repeat the handover's unsupported “green” claim):** the
  first specified phase-gate run stopped at global ESLint with **12 errors + 1 warning** in inherited
  money-migration files. Targeted Prettier-only repairs and removal of an unused import made
  `npx eslint src --max-warnings 0` exit 0. The next full-suite attempt exposed inherited invalid
  money tests: a missing `beforeEach` import in `DriverLibrary.money.test.ts`; invalid linked-item
  and cent-rounding expectations in that file; invalid one-sided IC fixtures/stale
  `totalMinorityInterest` access in `ConsolidationEngine.money.test.ts`; and a stale Workforce
  expectation of `0.284` despite documented cent rounding to `0.28`. Tests were corrected to pin
  real contracts rather than weaken behavior.
- **`OperationalDriverEngine` repair (genuine financial behavior):** the documented SaaS formula
  was `customers × ARPU × (1 - churn)`, but the engine multiplied raw churn. Added typed optional
  per-driver `valueTransforms`, rendered the formula as `(1 - [churn])`, and applied the transform
  with Decimal/precise arithmetic in both evaluation paths. Pre-fix the known-answer path returned
  **60,025** instead of **1,140,475**; stash falsification failed **1/4** (old formula lacked the
  complement), restored code passes **4/4** exact checks plus both existing OperationalDriver suites
  (**9/9**). Sensitivity assertions now correctly test `PreciseAmount` BigInt values.
- **`ConsolidationEngine` repair (genuine financial behavior):** manually declared IC pairs and
  auto-detection used directional dedupe keys, so the same S1↔P account was eliminated twice when
  input order differed. Keys are now direction-independent. Stash falsification on the full
  financial worksheet failed with **2 eliminations vs exact 1**; restored code passes **6/6** money,
  **75/75** unit, and **19/19** integration tests. The repaired fixture also proves exact `0.1 +
0.2 → 0.3` IC matching and a cent-balanced full worksheet.
- **Current verified gate evidence:** `npx tsc --noEmit` exit 0; `npx eslint src --max-warnings 0`
  exit 0; `npm run test` exit 0 (**965 files passed, 1 skipped; 11,491 tests passed, 8 skipped**);
  `npm run build` exit 0; `npm run bundle-check` exit 0 (2,036.85KB gzip / 2,248KB limit, warning
  only); `npm run audit:prod` exit 0; financial oracles **25/25**; export verifier clean; server
  suite **96/96**; manifest and reachability both clean. `check-readme-claims` initially caught the
  stale 71-adopter claim; README now records **81 engine/store importers** and **89/360** all-path
  adoption, and all **11** README checks pass.
- **Only current Phase-5 failure:** `npm run architecture:guardrails` exits 1 solely because **52
  GitHub Actions refs are unpinned**. This is the known GAP-7 blocker. No `.github/workflows/**`
  file was touched.
- **Continuation implementation commit:** `407fd78` (`fix: migrate report layout money totals and
repair financial gates`), created after the staged ESLint, TypeScript, Prettier, and secret-scan
  pre-commit gates all passed.
- **Remote delivery status (2026-08-03):** an earlier push attempt completed its local quality
  gates but failed at GitHub transport because terminal credentials were unavailable. This checkout
  later verified `gh auth status` with the Arena bot token; delivery is retried after the security
  repair below. No credential was requested or stored.
- **Pre-push security repair (2026-08-03):** the retried pre-push gate surfaced newly disclosed
  high-severity GHSA-rgw5-rvv9-x895 in production `brace-expansion@5.0.8`, despite an earlier clean
  audit. The scoped `minimatch@10.2.6` and `archiver-utils` overrides now require `^5.0.9`, with
  the lockfile resolved to `5.0.9`. A clean `npm ci` followed by `node scripts/check-dependency-audit.mjs` reports
  critical=0, high=0, moderate=0, low=0; no risk was allowlisted.
- **Next genuine GAP-1 candidates from the fresh scan:** `DynamicsConnector.aggregateDynamicsRevenue`
  and `SalesforceConnector.aggregateForecast` aggregate real imported revenue amounts and require
  their own strict screen → migration → exact-test → stash-falsification protocol. Do not migrate
  the screened stores or generic engines above merely to raise a count.
- **`DynamicsConnector` — MIGRATED (genuine financial integration service):** screened strictly —
  `aggregateDynamicsRevenue` aggregates real Dataverse opportunity revenue (open pipeline,
  probability/stage-weighted forecast, closed revenue, per-currency breakdown) with raw `+`/`*`,
  and `mapInvoice` computes `subtotal = totalamount - totaltax` with raw `-`. Both are currency.
  Rejected as non-money: `closeprobability`/`OPPORTUNITY_STAGE_WEIGHT` (probability ratios),
  pagination skip/counts, token expiry timestamps. Added the money header/import
  (`percentOf`, `multiplyMoney`, `roundTo`, `subtractMoney`, `sumMoney`); external values are
  `roundTo`'d on import (declared half-up), buckets and the currency breakdown use `sumMoney`,
  subtotal uses `subtractMoney`, weighted contributions are exact decimal products
  (`percentOf(value, probPct)` or `multiplyMoney(value, stageWeight)`) summed at full precision
  and cent-rounded once. New `DynamicsConnector.money.test.ts` has **8 exact `toBe`** answers.
  Its old code failed **7/8** (`0.30000000000000004`, `1.005` vs `1.01`, `0.15000000000000002`,
  `0.030000000000000006`, `0.5025` vs `0.51`, `0.6000000000000001`, `0.19999999999999998` —
  only the empty-list case passed); restored code passes **8/8**, existing suite **19/19**.
- **`SalesforceConnector.aggregateForecast` — MIGRATED (genuine financial integration service):**
  screened strictly — pipeline/bestCase/commit/closed/omitted/total and the probability-weighted
  forecast operate on real `Opportunity.Amount` currency with raw `+`/`*`. Rejected as non-money:
  `Probability` percentages, rate-limit counts, timestamps. Added the money header/import
  (`percentOf`, `roundTo`, `sumMoney`); each imported amount is `roundTo`'d on import, buckets and
  total use `sumMoney`, weighted contributions are `percentOf(amount, probability)` at full decimal
  precision, cent-rounded once. New `SalesforceConnector.money.test.ts` has **6 exact `toBe`**
  answers. Its old code failed **5/6** (`0.30000000000000004`, `1.005` vs `1.01`,
  `0.15000000000000002`, `0.375` vs `0.38` half-up cents, `0.6000000000000001`); restored code
  passes **6/6**, existing suite **13/13**.
- **Stash falsification (both connectors, literal):** with the two migrated sources stashed the new
  suites fail **12/14**; after `git stash pop` they pass **14/14**. Adoption ratcheted **89 → 91
  modules (24.72% → 25.28%)** with **0** raw `toFixed(n)` sites; `npm run money:adoption -- --update`
  re-recorded the floor at 91. Full `src/services/api-integration` directory: **13 files / 202
  tests pass**; `npx tsc --noEmit` exit 0; staged ESLint (`--max-warnings 0`) and Prettier pass.
- **Next candidates (screened from the fresh scan):** `QuickBooksConnector.mapInvoice` computes
  `subtotal: lineItems.reduce((sum, li) => sum + li.amount, 0)` over real invoice line-item amounts —
  genuine currency, requires the same protocol. `NetSuiteConnector` and `XeroConnector` were
  scanned and show no raw currency arithmetic (OAuth/HMAC/base64 and passthrough only); re-screen
  if their data contracts change.
- **`QuickBooksConnector.mapInvoice` — MIGRATED (genuine financial integration service):**
  screened strictly — `mapInvoice` computes `subtotal` with a raw `+` reduce over real QuickBooks
  line-item `Amount` values (currency). Rejected as non-money: `mapAccount`'s `CurrentBalance`
  and transaction `Amount` passthroughs (no arithmetic applied), the `Balance >= 0` debit/credit
  sign comparison, `getBudgets`' `parseFloat` report-cell parsing (measure-agnostic string
  parsing, same class as `ExcelImportEngine.parseNumeric`), token-expiry timestamps, pagination
  offsets, record counts, and rate-limit values. Added the money header/import (`roundTo`,
  `sumMoney`); subtotal is now `roundTo(sumMoney(lineItem amounts))` — exact decimal summation,
  half-up to cents. Line amounts, unit prices, `TotalAmt`, and `Balance` stay unrounded
  passthroughs (no arithmetic on them), consistent with DynamicsConnector's `tax`/`total`
  passthroughs. New `QuickBooksConnector.money.test.ts` has **8 exact `toBe`** answers. Its old
  code failed **5/8** (`0.30000000000000004`, `0.6000000000000001`, `0.7000000000000001`,
  `1234.6299999999999`, and `1.005` vs `1.01` half-up cents — the control, empty-list, and
  passthrough-contract cases passed); restored code passes **8/8**, existing suite **9/9**. Full
  `src/services/api-integration` directory: **14 files / 210 tests pass**; `npx tsc --noEmit`
  exit 0; `npx eslint src --max-warnings 0` exit 0; full suite **968 files / 11,513 tests, exit
  0**. Adoption ratcheted **91 → 92 modules (25.28% → 25.56%)** with **0** raw `toFixed(n)`
  sites; `npm run money:adoption -- --update` re-recorded the floor at 92. README updated to
  **92/360**; while in the README, also repaired a **pre-existing** stale claim found on clean
  `main` at `cb42a65`: "Store Architecture (38 Stores)" vs measured 41 top-level store modules —
  `npm run docs:verify` failed before this change (verified via `git stash`) and passes after
  (`41 Stores`).

#### GAP-1 continuation — 2026-08-04 (current branch `arena/019fc970-fp-a-betterversion`)

- **Fresh evidence before work:** ratchet at **92/360 (25.56%)**, **0** `toFixed(n)` sites;
  full suite 968 files / 11,513 tests. A fresh scan of all 360 financial-path modules (regex +
  manual screen) confirmed the handover's `NetSuiteConnector`/`XeroConnector` screening: their
  only `total +=` sites count **records synced** (`items.length`), not currency. Re-screened and
  REJECTED as non-money: `competitiveGaps.ts`/`TemplateEngine.ts` (measure-agnostic SUM/AVG over
  cells), `WorkflowEngine` (hours), `MasterDataEngine` (record counters), `mockData/*` (fixture
  synthesis, not financial truth), `SmartImportMapper`/`StreamImportEngine` (parsing patterns,
  row counters), `SpreadEngine`'s weights/driver values (unitless ratios/counts — see below),
  `glStore`'s validation cent-integers (exact integer cents via `toCents`/`fromCents`), and
  `precisionMath.ts` (measure-agnostic bigint quantization; its `toFixed(FINANCIAL_SCALE)` uses a
  variable, escaping the ratchet counter — noted, not currency).
- **`glAnalysis.ts` — MIGRATED (genuine utility, user-visible via `GLAccountAnalysisPage`):**
  `computeMonthlyTrend` (`debit +=`, `credit +=`, `net: debit − credit`), `computeRunningBalance`
  (`runningBalance +=`), and `getAccountSummary` (`reduce +`, `totalDebit − totalCredit`,
  `(totalDebit − totalCredit) / months`) aggregate real GL debit/credit amounts. Now accumulates
  at full decimal precision (`addMoney`/`sumMoney`), nets with `subtractMoney`, averages with
  `divideMoney`, and cent-rounds once at the output boundary (`roundTo`). New
  `glAnalysis.money.test.ts` has **6 exact `toBe`** answers; old code failed **5/6**
  (`0.30000000000000004`, `0.19999999999999998`, `0.6000000000000001`,
  `0.6000000000000001`/`0.5000000000000001`/`0.25000000000000006`, `1.005` vs `1.01`); restored
  code passes **6/6**, existing suite **5/5**.
- **`glStore` `generateTrialBalance` + `analyzeAccount` — MIGRATED (drift found INSIDE an
  already-adopted module):** glStore imports money primitives (toCents/fromCents/formatMoney) but
  its trial-balance aggregation (`debit − credit`, `+=`, `beginningBalance + netChange`) and
  account analysis (monthly `+=`, `reduce +`, `(totalDebit − totalCredit) / months`) still used
  raw float arithmetic — a second, parallel GL aggregation path with identical drift. Both now
  accumulate Decimals (`addMoney`/`subtractMoney`/`sumMoney`/`divideMoney`, defensive
  `toFiniteNumber` retained) and cent-round at the output boundary. New `glStore.money.test.ts`
  has **5 exact `toBe`** answers; old code failed **4/5** (`0.30000000000000004`,
  `0.09999999999999998`, `0.6000000000000001`/`0.5000000000000001`/`0.25000000000000006`,
  `1.005` vs `1.01`); restored code passes **5/5**, existing glStore suites (unit/smoke/cube)
  pass **57/57**, GL page tests **11/11**.
- **`SpreadEngine` — MIGRATED (genuine engine, reachable via manifest):** annual budget amounts
  spread across periods were raw `*`, `/`, `+`, and `Math.round(a*100)/100` (in `roundToTotal`).
  Now: `divideMoney` for even spreads, `multiplyMoney` for loaded/weighted methods,
  `divideMoney(multiplyMoney(annual, share), total)` for seasonal/driver/custom — and the
  weight/driver/percentage totals are summed with `sumMoney` because a float reduce leaks drift
  into the currency share (0.3+0.3+0.3 → 0.89999…). `applyToLineItem.total` = `roundTo(sumMoney)`;
  `roundToTotal` cent-rounds via `roundTo` and resolves the residual with
  `addMoney`/`subtractMoney` — negative halves now round half-up (away from zero) per the
  declared mode, where `Math.round` rounded half toward +∞ (pinned by test). New
  `SpreadEngine.money.test.ts` has **8 exact `toBe`** answers; old code failed **7/8**
  (`0.30000000000000004`, `0.049999999999999996`/`0.09999999999999999`/`0.14999999999999997`,
  `0.034999999999999996`/`0.022000000000000002`, `0.010000000000000002`/`0.020000000000000004`/
  `0.04000000000000001`, `0.9000000000000001`, `[33.33, 33.33, 33.339999999999996]`,
  `[-0.05, -0.060000000000000005]` — even the positive "control" failed on the old float
  residual); restored code passes **8/8**, existing suite **15/15**.
- **Stash falsification (all three, literal):** with the three migrated sources stashed, the new
  suites fail **16/19**; after `git stash pop` they pass **19/19**. Adoption ratcheted **92 → 94
  modules (25.56% → 26.11%)** with **0** raw `toFixed(n)` sites; `npm run money:adoption
-- --update` re-recorded the floor at 94 (glStore was already an adopter — its count does not
  move, but two drift sites inside it are now on the primitive). `npx tsc --noEmit` exit 0;
  `npx eslint src --max-warnings 0` exit 0; Prettier clean; full suite **971 files / 11,532
  tests, exit 0** (was 968 / 11,513). README updated to **94/360**.
- **Remaining GAP-1 candidates after this pass:** the long-tail screen list is now: audit/
  bookkeeping and measure-agnostic engines (`AuditLogEngine`, `CellAuditTrailEngine`,
  `ImportEngine`, `ReportBookEngine`, `XBRLEngine`, `ExportTemplateEngine`,
  `WhatIfSandboxEngine`, `DriverCascadeEngine`, `SolverEngine`, `FinancialCloseEngine`,
  `RegulatoryReportingEngine`, `PeriodLockEngine`, `formula-functions/*`), `templates/*`
  (static driver config), `mockData/*` (fixture synthesis), and `precisionMath.ts` (generic
  quantization). None show raw currency arithmetic under strict re-screen; re-screen if their
  data contracts change. The remaining reachable money surface is the `IterativeCalculationEngine`
  (rejected: measure-agnostic convergence inputs) and any new code added after this commit.

#### GAP-1 continuation — 2026-08-04 (session 2, branch `arena/019fc970-fp-a-betterversion`)

- **Sandbox recovery note (literal):** the environment re-clone lost the local git objects for
  `02c9d2f`/`325a164` (fresh clone at `cb42a65`, working tree preserved). Verified `git diff
FETCH_HEAD` matched every tracked file byte-for-byte and the four new test files matched
  `git show FETCH_HEAD:<path>`; `git reset --hard FETCH_HEAD` restored the branch to `325a164`
  exactly, clean tree. Remote was the source of truth throughout.
- **`src/workers/consolidation.worker.ts` — MIGRATED (genuine, and OUTSIDE the ratchet's old
  coverage):** the ASC 810 consolidation worker ran raw float math on currency everywhere —
  FX translation (`entry.amount * rate`), intercompany elimination (`reduce +`,
  `Math.min(Math.abs(...))`, `totalEliminated +=`), minority interest (`revenue + expenses`,
  `minorityPct * netIncome`), adjustment nets (`debitAmount - creditAmount`,
  `entry.amount + adj`), category totals (`reduce +`), and the balance check
  (`assets + liab + equity + MI`, `Math.abs(...) < 0.01`). All currency paths now use
  `addMoney`/`subtractMoney`/`multiplyMoney`/`sumMoney`/`percentOf`/`compareMoney` with
  cent-rounding at the output boundary (translated and adjusted entry amounts are `roundTo`'d —
  imported-value convention); ownership percentages, elimination counts, and the progress
  percentage stay non-money. New `consolidation.worker.money.test.ts` has **8 exact `toBe`**
  answers; old code failed **6/8** (`0.11000000000000001`, `[-0.20000000000000004, …]`,
  `0.04000000000000001`, `0.39999999999999997`, `5.551115123125783e-17` phantom imbalance,
  `0.6000000000000001`); restored code passes **8/8**, existing worker suites **82/82** (all
  10 worker test files / 90 tests green).
- **Ratchet guard extension (this is the headline):** the worker drift existed precisely
  because `scripts/money-adoption.mjs` scanned only engines/stores/utils/services. Financial
  **workers are first-class financial paths** — `FINANCIAL_DIRS` now includes `src/workers`, so
  the guard covers the class of drift it missed. Baseline re-recorded: **360 → 367 modules,
  94 → 95 adopters (25.89%)**, still **0** raw `toFixed(n)` sites.
- **`server/src/routes/gl.ts` trial-balance totals — MIGRATED (genuine, separate package):**
  `totalDebit += Number(row.total_debit)` / `difference = totalDebit - totalCredit` /
  `Math.abs(...) < 0.01` over currency were raw float. Per-account SQLite sums are treated as
  imported values — cent-rounded with declared ROUND_HALF_UP — then aggregated at exact
  decimal precision. Package boundary: the server cannot import `src/utils/money.ts` (its
  tsconfig `rootDir` is `server/src`), so it uses `decimal.js` directly — the same canonical
  engine behind the wrapper — with identical semantics, documented in the file. `decimal.js`
  added to `server/package.json` + lock. The aggregation was extracted to an exported pure
  function `computeTrialBalanceTotals(rows)` (the mock-DB fallback cannot aggregate SQL SUM,
  so the money behavior is pinned at the function level). New `server/src/routes/gl.money.test.ts`
  has **5 exact `toBe`** answers (old inline code produced `0.6000000000000001`,
  `5.551115123125783e-17`, `1.005` vs `1.01`, `0.30000000000000004`); restored code passes
  **5/5**, server suite **101/101** (was 96), `server` tsc exit 0. Also **observed, not fixed**
  (out of GAP-1 scope): the empty-filter branch of the endpoint returns keys
  `debits/credits/balance` while the main branch returns `debit/credit/difference/balanced` —
  flagged for a future contract pass.
- **Flaky note (honesty):** the first full-suite run after these changes reported **1 failed
  test / 1 file**; two consecutive full re-runs then passed **972 files / 11,540 tests, 0
  failures** (11,540 passed / 8 skipped). The transient did not reproduce and is not attributed
  to this change.
- **Gates:** root `tsc --noEmit` exit 0; `eslint src --max-warnings 0` exit 0 (server files
  lint clean under the root flat config); Prettier clean; `vite build` exit 0 (worker bundles
  with `@/utils/money`); `bundle-check` exit 0 (warning only); README updated to **95/367**.

#### GAP-1 continuation — 2026-08-04 (session 3, branch `arena/019fc970-fp-a-betterversion`)

- **Sandbox recovery note (second occurrence, literal):** the environment re-cloned again,
  dropping local git objects; recovered exactly as before — `git fetch origin
arena/019fc970-fp-a-betterversion`, `git reset --hard FETCH_HEAD` → `9923ed8`, clean tree,
  remote as source of truth. Reinstalled root + server deps (`npm ci`).
- **`server/src/routes/export.ts` report arithmetic — MIGRATED (genuine, SQL-side currency):**
  the PDF report builder computed currency inside SQL on IEEE-754 REALs: trial-balance
  `COALESCE(SUM(ge.debit),0) - COALESCE(SUM(ge.credit),0) AS "Balance"` and budget-vs-actual
  `COALESCE(SUM(ge.debit - ge.credit),0) AS "Actual Amount"` plus
  `SUM(bli.amount) - COALESCE(...) AS "Variance"`. The queries now return raw component sums
  (`Total Debit`/`Total Credit`, `Budget Amount`/`Actual Debit`/`Actual Credit`) and the
  derived figures are computed in JS at exact decimal precision via decimal.js (canonical
  engine; server package boundary — documented in-file), cent-rounded ROUND_HALF_UP at the
  output boundary. Extracted pure functions `buildTrialBalanceReportRows` and
  `buildBudgetVsActualReportRows` (the mock-DB fallback cannot aggregate SQL SUM, so the money
  behavior is pinned at the function level). New `server/src/routes/export.money.test.ts` has
  **5 exact `toBe`** answers (old SQL path produced `0.20000000000000004`,
  `1.005` vs `1.01`, `0.39999999999999997`, `0.49999999999999994`); stash falsification: old
  code failed **5/5** (functions absent — the drift was inline and untestable), restored code
  passes **5/5**. Report headers/row shape unchanged — the exported PDF contract is identical.
- **`server/src/routes/gl.ts` contract fix (flagged last session, now closed):** the
  no-visible-entities branch of `GET /api/gl/trial-balance` returned `totals:
{ debits, credits, balance }` while the populated path returns
  `{ debit, credit, difference, balanced }`. Both branches now share
  `computeTrialBalanceTotals([])` — same shape, exact zeros. Pinned by a new supertest case in
  `gl.money.test.ts` (Viewer token → entityFilter `[]` → 200 with the unified shape).
- **Re-screened and REJECTED this session (documented for the record):** `MonteCarloEngine`/
  `monte-carlo.worker` (statistical distribution sampling and mean/variance/skewness/kurtosis/
  percentiles — measure-agnostic statistics, same class as `formula-functions/statistical.ts`;
  `probabilityOfProfit` is a ratio), `SensitivityEngine` (`(value − base)/base × 100` is a
  percentage metric), `batch-calc.worker`/`storage.worker` (cell graph + serialization),
  `server/src/routes/budgets.ts`/`forecasts.ts` (CRUD + error strings only), `AuditService`
  (`totalPruned += changes` is a record count). None show raw currency arithmetic.
- **Gates:** server suite **107/107** (9 files; was 101), server `tsc --noEmit` exit 0, root
  ESLint clean on the changed files, Prettier clean. Root suite untouched this session (no
  `src/` changes) — previous full-suite evidence (972 files / 11,540 tests) stands. README
  unchanged (ratchet still **95/367, 0 toFixed**).

#### GAP-1 continuation — 2026-08-04 (session 4, branch `arena/019fc970-fp-a-betterversion`)

- **Money-surface sweep complete:** re-screened the last unexamined files — `ComplianceEngine`,
  `MigrationEngine`, `PeriodCloseEngine`, `ProfessionalExportEngine`,
  `RegulatoryReportingEngine` (all clean of currency arithmetic), `templates/*` (hits are
  template id strings like `bank-net-interest-income`, not math), `esgStore`
  (`(value/target) × 100` averaged is a physical-metric compliance score, not currency),
  `WorkflowEngine` (`totalHours` — hours), `auditTrailStore`/`tokenRotation` (timestamps),
  `RestApiClient` (token expiry/backoff). All remain REJECTED as non-money, consistent with
  the ledger. **No genuine currency surface remains un-migrated in `src/`** — the adoption
  ceiling for the current file set is reached; future adopters come from new code.
- **Ratchet hardened to cover the server (this session's change):** the server has done money
  math via decimal.js since session 3 (`gl.ts`, `export.ts`) but the guard scanned only
  `src/{engines,store,utils,services,workers}` — the same class of blind spot that let the
  consolidation worker drift. `scripts/money-adoption.mjs` now also scans **`server/src`**
  (23 financial modules): server adoption = modules importing `decimal.js` (the canonical
  engine; the server package cannot import `src/utils/money.ts` across the package boundary —
  documented in the migrated routes), and the same raw value-producing `toFixed(n)` counter
  applies. Baseline re-recorded with `serverFinancialModules: 23`,
  `serverModulesUsingMoneyPrimitive: 2` (`export.ts`, `gl.ts`), `serverRawToFixedSites: 0`.
- **Guard self-tested both directions (literal):** injecting `serverRawToFixedSites: 1` in the
  baseline made check mode exit 1 ("raw toFixed() sites in server financial paths INCREASED");
  raising the baseline to 3 server adopters made check mode exit 1 ("decimal.js adoption in
  server DECREASED: 3 -> 2 modules"). Restored baseline → `✓ Ratchet holds (baseline: 95
modules, 0 toFixed sites; server: 2 modules, 0 toFixed sites)`. (First drop-test attempt set
  the baseline BELOW measured — 2 < 1 is false — which is correct guard semantics; retested
  properly with baseline above measured.)
- **README** updated: the money paragraph now records the server coverage ("2 of 23 financial
  modules use decimal.js ... 0 raw toFixed(n) sites"). Root `tsc`, ESLint, Prettier, and the
  full root suite are untouched by this session's change (scripts/README/ledger/baseline only);
  server tsc + 107/107 server tests verified in session 3 remain standing.

#### GAP-1 continuation — 2026-08-04 (session 5, branch `arena/019fc970-fp-a-betterversion`)

- **Drift-inside-adopters sweep (the glStore class of bug, done systematically):** scanned every
  one of the 95 modules already on the money primitive for raw currency arithmetic remaining
  outside the migrated paths. Found and MIGRATED **8 files**; every migration falsified against
  the old code first (stash → new tests fail → pop → pass):
  - **`FXEngine`** — `translateForConsolidation` (`amount * rate`) and `calculateCTA` (ASC 830:
    `amount * (current − historical)`) were raw float products. Now `roundTo(multiplyMoney(...))`
    with `subtractMoney` on the rate spread. Falsified: 3/4 (`0.11000000000000001`,
    `0.030000000000000027`, and even the clean control `1000 × (1.2 − 1.1)` returned
    `99.99999999999987`).
  - **`LoanAmortizationEngine`** — `withPrepayment` (interest on the prepaid balance via
    `balance * (row.interest / row.balance)`), `balloonPayment` (`balance * r`, `pmt − interest`,
    `balance + interest`, `+=` total interest), `totalInterest` (raw reduce). Now exact decimal
    with cent-rounding per row and `sumMoney` totals; zero-balance source rows explicitly imply
    no accrual (mirrors the old `|| 0` guard without hiding divide-by-zero). Falsified: 3/4
    (`4.594650000000001`, `2.799374513190423`, `0.6000000000000001`).
  - **`RevRecEngine.handleContractModification`** (ASC 606) — `totalValue + mod.value` / `+=`
    with `Math.max(0, …)` clamp. Now `addMoney` + `roundTo` + `Decimal.max(0, …)`. Falsified:
    4/4 (`0.30000000000000004`, `0.09999999999999998`, …).
  - **`DepreciationEngine`** — `impairmentTest` (`carrying − recoverable`), `assetDisposal`
    (`cost − accumulatedDep`, `salePrice − bookValue`), `assetRevaluation` (surplus + **raw
    `Math.round(accumulatedDep × ratio)` — a REAL DEFECT: ratio 1.5 × 0.05 = 0.075 rounds to
    **0** in IEEE-754, wiping accumulated depreciation entirely; declared half-up gives 0.08**),
    and the declining-balance schedule wrapper (accumulated reduce, `cost − acc`). All now exact
    decimal. Falsified: 4/4 including the 0 → 0.08 defect.
  - **`DebtScheduleEngine`** — `consolidate` (monthly-payment reduce, total-interest reduce,
    `annualDebtService = monthly × 12`) and `refinance` (savings `-` chains). Now `sumMoney`/
    `multiplyMoney`/`subtractMoney`. Falsified: 2/2 (`0.30000000000000004`,
    `3.6000000000000005`, `0.04000000000000001`, `0.01999999999999999`).
  - **`BreakEvenEngine.multiProduct`** — contribution margins, weighted CM, price-weighted sum,
    break-even revenue, per-product revenue all raw float. Now exact decimal (mixes/units stay
    metrics). Falsified: 2/2 (`0.19999999999999996`, `1.6721311475409835` vs exact 1.7).
  - **`ConsolidationEngine`** — `totalEquity + totalMinorityInterest` in the worksheet and the
    returned `totalEquity` (cent-rounded values summed in float drift). Now
    `roundTo(addMoney(...))`. Falsified via a new minority-interest case: `−0.1 + 0.02` →
    `−0.08000000000000002` old vs exact `−0.08`.
  - **`glStore`** — `normalizeGLEntry`'s `netChange = debit − credit` (the stored amount feeding
    every downstream GL aggregation) and `checkDuplicates`' fallback key `amount ?? debit −
credit`. Both now exact decimal. **Real defect found:** a stored entry with amount 0.2 vs a
    re-imported entry with no amount (0.3 − 0.1) had fallback keys `0.19999999999999998` ≠ `0.2`
    → the duplicate went **UNDETECTED**; falsified as `expected +0 to be 1`. Now both keys are
    exactly `0.2` and the duplicate is caught.
- **Evidence:** 35 new/extended tests, **20 failed** against the old code (7/8 files), all pass
  after migration; existing suites (FXEngine, LoanAmortization, RevRec, Depreciation,
  DebtSchedule, BreakEven, Consolidation, glStore unit/smoke/cube) all green — **267 tests
  across 18 files**. `tsc --noEmit` exit 0; `eslint src --max-warnings 0` exit 0; ratchet holds
  (95 modules — these are all inside already-adopted files, so the count does not move; the
  drift was inside the guarded set all along). README unchanged.
- **Remaining known float sites in adopters (documented, not currency):** `AutoCommentaryEngine`
  (narrative `totalActual − totalBudget` on display text — variance narration, same class as
  mock data), `AnomalyDetectionEngine`/`AnomalyExplainer` (z-scores, fences, residual ratios —
  statistics), `AdvancedPDFEngine`/`ConstructionEngine`/`FinanceCopilotEngine`/
  `SensitivityTableEngine`/`report-builder-export` (display formatting `value * 100` for % or
  `value / 1000` for K/M — display-only, formatMoney'd at the boundary), `ICMatchingEngine`/
  `IntercompanyMatchingEngine` (match scores/tolerances — ratios), `ManufacturingEngine` (OEE
  derivation), `RollingForecastEngine` (growth-rate averages), `SafeMathParser` (formula
  functions — measure-agnostic, consistent with the `formula-functions/*` rejection),
  `CreditRiskEngine` (score caps), `InsuranceEngine` (underwriting approximations),
  `SOXComplianceEngine` (test counts), `retailStore` (ranking sort), `decimalUtils` (generic
  rounding helpers — measure-agnostic, no production importers beyond its own test),
  `nim-prompts` (prompt text), `DynamicsConnector`/`QuickBooksConnector`/`SageConnector`/
  `SalesforceConnector` (`total += items.length` record counts). Each is either non-currency or
  display/formatting-only.

#### GAP-1 continuation — 2026-08-04 (session 6, post-PR-#29, branch `arena/019fcc6c-fp-a-betterversion`)

- **Baseline re-verified on clean `main` @ `d1f22de` (literal evidence, this session):**
  `npm run money:adoption` → 95/367 (25.89%), **0** raw `toFixed(n)` sites, server 2/23,
  `✓ Ratchet holds` · `npx tsc --noEmit` exit 0 · `npx eslint src --max-warnings 0` exit 0 ·
  `npm run docs:verify` ✓ (stores measured 41) · server suite **107/107** (9 files) ·
  full `src/components/ai` suite green. The handover's ceiling claim — every genuine currency
  surface INSIDE the ratchet's scanned dirs (`src/{engines,store,utils,services,workers}` +
  `server/src`) screened and migrated — **CONFIRMS for those dirs**.
- **NEW BLIND SPOT FOUND (the worker class, again):** the ratchet's `FINANCIAL_DIRS` never
  covered `src/components` or `src/pages`. A fresh repo-wide grep found **~80 files there with
  raw float `reduce +` over currency fields** (`amount`/`debit`/`credit`/`budget`/`cost`/…),
  plus literal `.toFixed(n)` on money in several. The handover's "no remaining genuine
  currency surface in the current file set" holds only for the scanned dirs; the UI layer was
  never screened in sessions 1–5 (the ledger's exclusions cover engines/stores/services/utils/
  workers/server only). Documented, not assumed.
- **MIGRATED this session: the AI copilot alert layer (logic-level currency math, reachable
  from every page via `CopilotSidebar`):**
  - `CopilotTypes.generateAlerts` — GL revenue/expense totals (`reduce +` over `credit`/
    `debit`) drive alert LOGIC: the expense-exceeds comparison, the large-entries threshold
    filter (`amount > totalRevenue * threshold`), severity, and the `value:` payload consumed
    downstream. Now `sumMoney` + `compareMoney` + `multiplyMoney` + `subtractMoney`, with
    `roundTo` only at the output boundary (comparisons stay unrounded for exact old-vs-new
    decision semantics). The `threshold * 100` message label stays float (a percentage metric,
    documented display class).
  - `CopilotAlertsTab` quick stats — Revenue/Expenses "$Nk" figures now
    `compactThousandsMoney(sumMoney(...))` (new display helper in `CopilotTypes`: exact
    `divideMoney(total, 1000)` + half-up round at the boundary).
  - **Falsified (stash → old code → run):** `CopilotTypes.money.test.ts` has **8 exact
    `toBe`/known-answer assertions**; with the migrated sources stashed, **6 FAIL** against
    the old float code, restored **8/8 pass**. Defects proven: 1. cent-equal books fired a false "Expenses exceed revenue" alert (revenue `0.1 + 0.2 =
0.30000000000000004 > 0.3`); 2. expenses sitting EXACTLY on the threshold were mis-flagged as exceeding it when the
    float product undershot (`1.15 × 0.1 = 0.11499999999999999`, so `0.115 > limit` fired;
    also `0.57 × 0.1 = 0.056999999999999995` vs `0.057`); 3. the −$500 net-loss detail rendered **"Net: $-0K"** (`Math.round`-style half toward +∞);
       half-up away from zero gives "$-1K".
- **Ratchet extended to `src/components/ai` (narrow, deliberate):** same class of blind spot
  that session 3 fixed for `src/workers` ("financial workers are first-class financial
  paths") — the copilot alert layer is first-class financial LOGIC. `FINANCIAL_DIRS` now
  includes `src/components/ai` (10 non-test modules scanned; 2 adopters: `CopilotTypes`,
  `CopilotAlertsTab`; the other 8 files screened clean of currency arithmetic: chat/insights/
  formula/NLQ UI, prompt strings, no money math). Baseline re-recorded **95 → 97 modules**,
  367 → **377 financial modules (25.73%)**, **0** `toFixed` sites, server unchanged 2/23 —
  the adoption floor went UP (never lowered); the percent dip is denominator growth from
  extending the scan, exactly as in sessions 3–4. The remaining `src/components` / `src/pages`
  surface is NOT scanned yet (see backlog below) — extending further would sweep hundreds of
  display-only `.toFixed` sites into the counter and needs its own screening pass first.
- **README repairs (docs drift found on clean `main` @ `d1f22de`, same class as the
  session-2 "38 Stores" repair):** the money paragraph still claimed "**82 of 226**
  engine/store modules" — stale since before PR #29 (measured now: **84 of 256** in
  `src/engines` + `src/store`); the financial-paths sentence now records **97 of 377** incl.
  `src/components/ai`. Project Statistics table: "Total Stores **39**" → **41** (matches
  `docs:verify` measurement and the "Store Architecture (41 Stores)" claim repaired in
  PR #29) and "Financial Engines … (**105/181 unreferenced**)" → "**183 shipped, 7
  orphaned**" (the GAP-3 correction from 2026-08-02 had never reached this row).
  `docs:verify` green before and after.
- **Ledger/handover repairs:** header updated (base `d1f22de`, this branch); missing
  "PR #29 — MERGED" section added; stale "Next Action" (nominated the already-shipped
  `QuickBooksConnector.mapInvoice`) rewritten — see the Next Action section below.
- **GAP-1 UI-layer backlog (new, documented, unscreened in detail):** ~80 files in
  `src/components` + `src/pages` with raw float sums over currency fields. Strict screening
  has NOT been applied file-by-file yet; a pattern-level triage says most are display totals
  (chart tooltips, table footer totals via `formatCurrency(reduce …)`, "/1000 → K" labels —
  the documented display-only class), but at least the following subclasses need full
  screening before any ratchet extension: GL debit/credit table totals (`DrillTables`,
  `BankReconciliation`, `BankStatements`, `BudgetApproval`), IC reconciliation totals
  (`ICReconciliation`, `ICReconciliationReport`), multi-currency translation sums
  (`MultiCurrencyReporting`), variance drill totals (`VarianceDrillModal`), budget/capex/
  depreciation page totals. Protocol: strict-screen → migrate → exact known-answer tests →
  stash-falsify → extend `FINANCIAL_DIRS` per screened area → re-record baseline (floor only
  ever up).

### GAP-3 — Orphan engines (F-0028)

- **status:** **VERIFIED_DONE — the gap's premise was a measurement defect**
- **what was believed:** "105 of 183 engines have no import references", treated as ~105 wiring
  tasks.
- **what is true:** the engines were reachable; `scripts/engine-reachability.mjs` could not see it.
  It counted only DIRECT static imports from `src/{pages,store,services,components,hooks}` and so
  missed:
  1. **Lazy reachability** — `engineManifest.generated.ts` maps every engine to
     `() => import('./Engine')`, `EngineRegistry` consumes it, and `EngineCatalogPage` (**routed at
     `/admin/engines`** in `App.tsx`) lists and loads every entry.
  2. **Transitive reachability** — `report-builder-types` is imported by 3 manifest engines and was
     still reported as an orphan.
  3. **Type-only modules** — `ReportBuilderTypes` / `report-builder-types` have no runtime export
     and are deliberately excluded by the manifest generator. Counting them as unreachable
     _engines_ is a category error.
- **the contradiction that should have been caught earlier:** `engineReachability.test.ts` already
  dynamically imported EVERY manifest engine and asserted real runtime exports — and was passing
  the whole time. Two sources of truth disagreed and the pessimistic one was believed unchecked.
- **evidence:** `node scripts/engine-reachability.mjs` → before `total 183, reachable 78, orphan
105`; after **`total 180, reachable 180 (77 direct + 103 lazy), orphan 0`, exit 0**.
  `npm run engines:verify` → manifest current (180 engines).
- **guard added:** the classifier now exits 1 if its type-only exclusion list drifts from the
  manifest generator's (verified by injecting drift → exit 1), plus
  `src/engines/__tests__/engineReachabilityScript.test.ts` (7 tests) pinning zero orphans, lazy
  counting on, direct counting on, and lists in sync. A genuinely unreachable engine still fails
  loudly and is named.
- **next_action:** none.

### GAP-4 — Period close integration (F-0013)

- **status:** **VERIFIED_DONE**
- **acceptance_criteria:** period lock traceable UI→store→server→durable state→approval→audit, with
  an integration test covering rejected/unauthorized transitions.
- **evidence:** new `server/src/routes/periodCloseLifecycle.test.ts` — **24 tests**, real HTTP via
  Supertest, asserting the **durable DB row** after every hop (not the response body):
  - happy path `open → soft-close → hard-close → locked`, each state persisted, each role boundary
    exercised (Manager / FP&A_Manager / Admin)
  - exactly one immutable audit row per **accepted** transition, in order, with actor + reason; and
    **zero** rows for rejected ones
  - every illegal jump refused (`open→hard-close`, `open→locked`, `soft-close→locked`), period left
    untouched
  - unauthorized: 401 unauthenticated, 401 forged token, 403 Viewer, 403 Manager attempting
    hard-close, 403 FP&A_Manager attempting lock
  - reopen: Zod-required reason, Admin-only, force-reopen of a LOCKED period refused without an
    `approvalId` and permitted with one (approval durably linked in the audit row)
  - GL posting honours the lock, and posting works again after reopen
  - Server suite: **71 → 95 tests, 7 files, exit 0.**
- **mock-DB fidelity fixes (these make EXISTING tests stricter, not looser):** the sandbox
  fallback in `server/src/db/connection.ts` had four defects that were quietly weakening every
  server assertion —
  1. `all()` ignored `WHERE` entirely and returned the whole table, so a period's audit query
     returned _every_ period's rows and any "contains exactly N rows" assertion was vacuous;
  2. `get()` fell back to "the last row" on a missed id lookup, so `GET /periods/no-such-id`
     answered **200** with an unrelated period and no 404 path was testable;
  3. the GL lock query ignored `? BETWEEN start_date AND end_date`, so one closed period anywhere
     blocked posting everywhere;
  4. `period_close_audit` inserts stored positional keys only, so `from_state`/`to_state`/
     `actor_id`/`reason`/`approval_id` could not be asserted at all.
- **PRODUCT DECISION (2026-08-03) — soft-close PERMITS adjusting entries:** a soft close exists
  to allow authorized adjusting entries until the hard close. `canPost()` was correct; the
  binary `is_closed` gate was the outlier. Aligned:
  - `isClosedState()` now returns `true` ONLY for `hard-close`/`locked`; documented invariant
    `canPost(state) === !isClosedState(state)`.
  - The legacy `/close` endpoint sets `is_closed`/`closed_at`/`closed_by` via `isClosedState`
    instead of unconditionally 1.
  - The pinned `DOCUMENTED INCONSISTENCY` test became the `SOFT-CLOSE POLICY` test: soft-close
    reports `canPost=true` and `isClosed=false`, and a GL adjusting entry **succeeds**; a new
    `hard-close still blocks GL posting` test keeps the 403 path pinned.
  - The frontend `PeriodCloseStateMachine` already implemented exactly this policy
    (`canPost(soft-close) = allowed`, balance required only for hard-close/lock), so the server
    now matches the shipped client engine.
    Evidence: server suite **96 tests exit 0** (was 95; +1 hard-close test); `periods.test.ts`
    close test now walks soft-close (is_closed 0) → hard-close (is_closed 1).
- **next_action:** none — decision recorded, code + tests aligned on both sides.

### GAP-NEW-A — Lease pages had no real data-entry path

- **status:** **VERIFIED_DONE**
- **what remained:** the dashboard read `leaseStore`, but `LeaseDetailPage` still owned a
  **separate hardcoded `LEASE_INPUTS` with a different schema**
  (`lessee`/`endDate`/`interestRatePct` vs the store's
  `commencementDate`/`leaseTerm`/`discountRate`), and "Add Lease" merely navigated there. Nothing a
  user typed could persist.
- **what shipped:**
  - `src/components/lease/LeaseForm.tsx` — the real data-entry path. Blocking validation (required
    id/property, positive payment, whole-number term ≤ 1200, ISO + real date, discount rate in
    `[0,100)`), duplicate-id rejection on create, per-field error messages. Nothing is silently
    coerced. `validateLeaseForm` is exported so the rules are testable without a DOM.
    Percent→rate conversion happens in integer space so 6.25% is exactly `0.0625`.
  - `LeaseDetailPage` now reads `leaseStore` as its single source of truth and wires
    add/edit/delete through it. `endDate`, ROU asset, liability and status are **derived**
    (LeaseEngine PV), never entered. Reachable empty state for the delete-everything case. Hooks
    all run before the early return (Rules of Hooks).
- **evidence:** `src/pages/lease/__tests__/leaseDataEntry.integration.test.tsx` (**9 tests**) types
  into the form → submits → asserts **store contents** → renders the **dashboard fresh** and finds
  the lease with a real LeaseEngine-computed liability. **No store stubbing and no faked
  permissions** — the real `enforce()` RBAC wrappers run, and the denial path asserts an
  unauthenticated write **throws** and leaves the store empty. Plus
  `src/components/lease/LeaseForm.test.tsx` (**20 tests**) covering every rejection path.
  **60 lease-surface tests pass** (store + form + both pages + smoke).
- **next_action:** none. The same treatment for `DebtSchedulePage` data entry was delivered
  **2026-08-03 (Phase 4)** — see the Phase 4 entry below.

### GAP-7 — CI/workflow SHA-pinning (F-0024)

- **status:** **BLOCKED — code + tooling ready, workflow edits cannot be pushed by this agent**
- **honest correction:** this was recorded as `VERIFIED_DONE` but the change **never reached
  `main`**. On a clean checkout of `f52131d`, `npm run architecture:guardrails` exits **1** with
  **52 unpinned action refs**. The prior ledger entry described work that existed only in an
  orphaned local branch.
- **evidence of the blocker (reproduced 2026-08-02):**
  ```
  ! [remote rejected] arena/019fc250-fp-a-betterversion (refusing to allow a GitHub App to
    create or update workflow `.github/workflows/build.yml` without `workflows` permission)
  ```
  Critically, a commit touching `.github/workflows/**` **poisons the whole branch** — every
  subsequent push is rejected, not just that commit. The workflow edits are therefore deliberately
  kept OUT of branch history.
- **what shipped instead (all pushable):**
  - `scripts/pin-workflow-actions.mjs` — idempotent pinner with a `--check` mode usable as a CI
    assertion. Holds the canonical pin map for 12 actions, each SHA resolved from the **live GitHub
    API** on 2026-08-02 with annotated tags dereferenced to their commit.
  - `ci-patches/0003-gap7-sha-pin-workflows.patch` — the surgical SHA-pin-only diff. (The
    pre-existing `0002` patch also contains these pins but bundles unrelated CI restructuring; its
    SHAs were independently re-verified and do match.)
  - `ci-patches/GAP-7-SHA-PINNING.md` — blocker evidence, one-command apply, full pin table.
- **verified locally:** applying the patch takes `npm run architecture:guardrails` from
  `❌ ... 52 unpinned, exit 1` to `✅ All architecture guardrails passed, exit 0`.
- **unblock:** grant the GitHub App the **`workflows`** permission on this repo, then run
  `node scripts/pin-workflow-actions.mjs && git commit`.

### Phase 4 — DebtSchedulePage data entry (2026-08-03)

- **status:** **DONE** — same treatment as GAP-NEW-A leases, applied to debt.
- **what was missing:** `DebtSchedulePage` read `useDebtStore` and had a reachable empty state,
  but there was **no data-entry form at all** — nothing a user typed could persist; the portfolio
  was whatever the seed array contained.
- **what shipped:**
  - `src/components/debt/DebtForm.tsx` — real validated form. Blocking validation (required
    id/name/lender/type-label, positive principal, rate in `[0,100)`, whole-number term ≤ 1200,
    ISO + **real** date via a round-trip check that rejects `2026-02-31` instead of rolling
    over), duplicate-id rejection on create, per-field error messages, exported `validateDebtForm`
    for DOM-free testing. Percent→rate conversion in integer space so 6.25% is exactly `0.0625`.
  - `DebtSchedulePage` wires add/edit/delete through the persisted, RBAC-gated `debtStore`
    (`addInstrument`/`updateInstrument`/`removeInstrument` via `enforce()`): Add Debt button,
    per-instrument Edit/Delete in a Manage list, reachable empty state that offers Add Debt. All
    hooks run before the early return (Rules of Hooks). KPIs/charts/exports/schedules still come
    from the real `DebtScheduleEngine` over the store.
- **evidence:** `debtDataEntry.integration.test.tsx` (**10 tests**) — type → submit → store
  mutation → **fresh** dashboard render with an engine-computed schedule; no store stubbing, real
  `enforce()` RBAC; unauthenticated add **and** delete throw `PermissionError` and leave the
  store unchanged; duplicate-id, invalid-input and blank-form rejections leave the store empty.
  `DebtForm.test.tsx` (**18 tests**) covers every rejection path. Existing smoke test extended
  (lucide mock) and still green. **31 tests pass across the three files.** `tsc --noEmit` exit 0,
  `eslint --max-warnings 0` exit 0.
- **next_action:** none.

### GAP-2 — Server-side authorization (F-0016)

- **status:** VERIFIED_DONE (re-verified 2026-08-02, and now resting on stricter foundations)
- **evidence:** `cd server && npm run test` → **95 tests / 7 files passed, exit 0**.
  `authorizationMatrix.test.ts` (33 tests) covers every route file. The mock-DB fidelity fixes
  under GAP-4 removed the WHERE-less query behaviour that previously made some scoped assertions
  weaker than they read.
- **next_action:** none — re-verify if routes change.

### GAP-5 — Full suite confidence (F-0025)

- **status:** VERIFIED_DONE (re-verified 2026-08-03)
- **evidence:** full `npm run test` on this branch: **945 files passed / 1 skipped (11332 tests),
  exit 0**. Server suite **96 tests exit 0**. `tsc --noEmit` exit 0; `eslint src --max-warnings 0`
  exit 0; `money:adoption` exit 0; `financial:oracles`, `engines:verify`, `export:verify`,
  `check-readme-claims` all pass. `architecture:guardrails` remains exit 1 on the known GAP-7
  blocker (52 unpinned refs — unchanged from `main`, cannot be pushed by this agent).
- **next_action:** none.

---

## RESOLVED 2026-08-03 session (VERIFIED with literal evidence)

| ID     | Title                                                                       | Evidence                                                                                     | Date       |
| ------ | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------- |
| FIX-13 | `main` after PR #24 did not typecheck (79 tsc errors — money import dropped | before `tsc --noEmit` exit 2 / 79 errors, `eslint` exit 1 / 21 errors; after exit 0 / exit 0 | 2026-08-03 |
|        | in `FinancialInstrumentsEngine`, `.toNumber()` on number in                 |                                                                                              |            |
|        | `ForecastReconciliationEngine`, prettier drift in 7 files)                  |                                                                                              |            |
| FIX-14 | Handover claimed 13 engines "migrated" that had NO money import             | `grep` on each file: 0 money imports; now imported + tested (285 tests)                      | 2026-08-03 |
| FIX-15 | `FairValueEngine` DCF returned `Infinity` when r === g                      | new test `throws loudly instead of returning Infinity` fails on old code, passes now         | 2026-08-03 |
| FIX-16 | GAP-4 soft-close advertised `canPost=true` but GL blocked with 403          | pinned inconsistency test → now the SOFT-CLOSE POLICY test; server suite 96 exit 0           | 2026-08-03 |
| FIX-17 | 20 test files still built GL fixtures without `amount` (FIX-8 class)        | `tsc` exit 0 with typed fixtures; 83 page tests + 4-test regression suite pass               | 2026-08-03 |
| FIX-18 | `DebtSchedulePage` had no data-entry path                                   | 10 integration + 18 form tests pass; store write → fresh render with engine schedule         | 2026-08-03 |

---

## RESOLVED 2026-08-02 session (VERIFIED with literal evidence)

| ID     | Title                                                                     | Evidence                                                                           | Date       |
| ------ | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------- |
| FIX-5  | `architecture:guardrails` red on `main` (GAP-7 never landed)              | before exit 1 / 52 unpinned → after `✅ All architecture guardrails passed` exit 0 | 2026-08-02 |
| FIX-6  | `ScenarioEngine.sensitivityAnalysis` emitted `Infinity` as a money figure | known-answer test `expected Infinity to be +0` fails on old code, passes now       | 2026-08-02 |
| FIX-7  | `COGSVarianceEngine` phantom unexplained variance `-5.55e-17`             | known-answer test fails on old code, passes now                                    | 2026-08-02 |
| FIX-8  | `InventoryDashboard` rendered `$NaN` (GLEntry fixtures missing `amount`)  | `npx vitest run .../InventoryDashboard.test.tsx` → **7 passed**                    | 2026-08-02 |
| FIX-9  | engine-reachability classifier blind to lazy + transitive imports         | `node scripts/engine-reachability.mjs` → **180/180 reachable, orphan 0**, exit 0   | 2026-08-02 |
| FIX-10 | mock DB `all()` ignored `WHERE` (made audit assertions vacuous)           | server suite **95 passed**, lifecycle audit-count assertions now meaningful        | 2026-08-02 |
| FIX-11 | mock DB `get()` returned a wrong row on a missed id lookup (no 404 path)  | `404s on a period that does not exist` test passes                                 | 2026-08-02 |
| FIX-12 | mock DB GL lock ignored the period date range                             | `allows a GL post once the period is reopened` test passes                         | 2026-08-02 |

---

## CI note — bundle gate has zero headroom (surfaced 2026-08-03, PR #25)

`ci.yml` gates **Total JS ≤ 2048KB gzip** over `dist/assets/*.js`. Measured on clean builds:

- `main` @ `aa98b72`: 2,097,893 bytes → **2048KB** (integer division) — headroom **~740 bytes**.
  The check was SKIPPED on `main` (the build itself fails there: tsc 79 errors), so the gate was
  never actually green-verified on `main`.
- this branch: 2,101,985 bytes → **2052KB** — **4KB over**. The delta is this session's shipped
  work (14 engine migrations + DebtForm/page + Phase 2 fixture fields); the chunk list is
  byte-for-byte the same shape (DataGrid/excel/pdf vendors unchanged), and tests never enter the
  bundle. There is no duplication to remove.

This is a **workflow-limit condition, not a code regression**: the gate needs ~16KB of headroom
(`TOTAL_JS_LIMIT: 2048 → 2064` in `ci.yml`), which is a `.github/workflows/**` edit — blocked by
the never-touch rule and by GAP-7 (a workflow commit poisons the branch). Evidence: literal build
measurements above (reproducible with `gzip -c dist/assets/*.js | wc -c`). Unblock: raise
`TOTAL_JS_LIMIT` once the App has `workflows` permission, or shrink a vendor chunk.

### CI note update — 2026-08-03 continuation

The historical 2,048KB build-limit paragraph above describes an earlier checkout. On the current
PR #26 base, without touching any workflow, `npm run build && npm run bundle-check` measured
**2,036.85KB gzip against a 2,248KB limit** and exited **0** (one 90%-threshold warning). Bundle
size is therefore **not** a current blocker; the workflow SHA-pinning guardrail below remains the
only Phase-5 gate failure.

## True Blockers (valid escalation only)

1. **`workflows` GitHub App permission — blocks GAP-7 from landing.** Reproduced 2026-08-02; see
   the GAP-7 entry for the literal rejection message. A commit touching `.github/workflows/**`
   blocks **all** pushes from the branch, so the change is delivered as tooling + a patch instead.
   **Unblock:** grant the App the `workflows` permission.
2. **Native `better-sqlite3` build — blocks `test:native-db` in this sandbox.** Downloading Node
   headers from `nodejs.org` is blocked, so the native binding cannot compile. Not a code defect.
   All other suites run on the mock-DB fallback, which is now materially more faithful (see GAP-4).

---

## Next Action

(Updated 2026-08-04, session 6, post-PR-#29 — supersedes the stale text that nominated the
already-shipped `QuickBooksConnector.mapInvoice`.)

1. **Scanned dirs are at the adoption ceiling.** Every genuine currency surface inside
   `src/{engines,store,utils,services,workers}`, `src/components/ai`, and `server/src` has
   been screened and migrated (ratchet: **97/377**, server 2/23, **0** `toFixed`). Only NEW
   code can move the numerator; the ratchet catches regressions either way. Rejections in
   sessions 1–6 stand unless a module's data contract changes
   (`NetSuiteConnector`/`XeroConnector` re-screen only on contract change).
2. **Highest-priority genuine path now visible: the GAP-1 UI-layer backlog.** ~80 files in
   `src/components` + `src/pages` still do raw float `reduce +` over currency fields (see the
   session-6 entry for the triage). Start with logic-feeding totals (GL drill/bank/budget
   tables, IC reconciliation, `MultiCurrencyReporting`), applying the full
   screen → migrate → exact known-answer → stash-falsify protocol, then extend
   `FINANCIAL_DIRS` per screened area (baseline floor only ever goes UP; display-only
   `.toFixed` sites must be screened out or migrated before each area joins the scan).
3. **Standard migration protocol** (any future candidate): strict screen with decisions in
   this ledger → migrate via `@/utils/money` (frontend) / `decimal.js` (server package) →
   `*.money.test.ts` with exact `toBe` answers and inline old-float records → stash-falsify
   (old code must fail, new must pass) → `npm run money:adoption -- --update` (never raise
   the baseline) → all local gates (tsc, eslint, prettier, targeted + full suites,
   docs:verify) → ledger entry with literal evidence.
4. **Other backlog:** GAP-7 (the legacy 2048KB CI bundle cap — the only red check;
   `.github/workflows/**` is reserved for it and must stay untouched until the `workflows`
   App permission blocker is resolved).
