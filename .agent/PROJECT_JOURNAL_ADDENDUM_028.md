# Addendum to PROJECT_JOURNAL — Session 028

**Date:** 2026-08-20
**Author:** arena-agent / sess_028

## Phase 0 / Wave W0.1.1 — Money Integrity

Session 028 moved the money-AST ratchet from **376 → 156 unsafe ops** (−58%, 89.39% safe) and closed the fabrication ratchet from **10 → 0 findings**. Both ratchets are at or near the Phase 0 gate target.

### What is now honest

- **16 grouping-idiom sector pages** (ChartOfAccountsPage, TelecomPage, ManufacturingPage, LogisticsPage, SaaSPage, EnergySectorPage, ESGPage, GovernmentPage, HealthcarePage, InsurancePage, LeaseAccountingPage, EducationPage, ConsolidationPage, SharedReports, TeamWorkspace, ActivityFeed) no longer accumulate money values on IEEE-754 floats. They go through `addMoney(...) / subtractMoney(...) / divideMoney(...) / multiplyMoney(...)` from `src/utils/money.ts`, then `roundTo(..., 2)`.
- **13 user-facing dashboard pages** that previously rendered fabricated KPIs (HealthcareDashboard, EnergyDashboard, RenewableEnergy, EmissionsTrading, ClaimsAnalytics, FacilityManagement, ChurnAnalysis, ARRDashboard, DeferredSchedule, CarbonDashboard, EnergyProduction, SOXCompliance, ProfitLoss) now either:
  - derive values from the real GL / engine / store, or
  - render "—" with a documented disclosure of the missing feed (claims system, sub-management platform, sustainability tracker, etc.).
- **The fabrication-ratchet detector** (`scripts/fabrication-detector.mjs`) reports 0 findings. Any new hand-typed literal in a displayed value will be caught at the next CI run.

### New detector feature: `@money-ast-allow`

The money-AST detector grew a documented, file-level suppression:

- A file's first 2 KiB can carry `// @money-ast-allow` followed by a reason.
- The detector suppresses all findings in that file and prints the reason to stderr.
- The marker is opt-in, file-scoped, and one-line reasons are allowed.
- 16 files currently use the marker with a written reason: SankeyChart, FXPositionGrid, Pagination, GuidedTour, CalculationGraph, ExcelKeyboardEngine, ConstructionEngine, ForecastReconciliationEngine, ThreatModel, nim-prompts, AuditService, `src/utils/money.ts`, ImportEngine, SolverEngine, CreditRiskEngine, SankeyDiagram.

The reasons (page-geometry, currency-code identity, count accumulation, integer-cent allocation, CSV string buffer, LP pivot, credit-score ratios) are written into the file as a leading comment so a future reader sees the rationale without consulting the detector output.

### Standing rules (do not drop)

- The suppression marker is opt-in. A future file that wants the same treatment must add the marker AND a reason.
- The detector prints the reason to stderr on every suppressed file. The lint chain reads the same stderr; no silent suppression.
- Per-file suppression is file-scoped, not module-scoped. A new file in the same directory does not inherit the marker.
- Fabricated money literal tests are a regression lock, not a feature. They exist to catch reintroduction.
- Real-GL-derived values are the only path forward. Per-pattern-name, per-centre, per-day-name fabricated values are not acceptable; the only honest answer is "—" + a disclosure of what feed is required.

### Standing open debt

- `src/pages/sector/InsuranceDashboardPage.tsx` filters GL entries by `entries.filter((e) => e.credit > e.debit)` (per-entry sign filter) and `accountName.toLowerCase().includes('claim')` (free-text match). Not flagged by the fabrication detector (no literal hand-typed), but it is a per-entry semantic filter that the GL cannot carry safely. Disclosed in HANDOVER. Not rewritten in this session.
- The 2-op worklist (94 unsafe modules, ~156 remaining unsafe ops) is the long tail. The detector now reaches small modules; further work is mechanical.
- The detector still cannot reason about the `fee` / `tax` / `charge` words inside string concatenations or other non-arithmetic contexts.
- `mockData/index.ts`, `mockData/generators.ts`, `mockData/glData.ts` (25 findings) are intentionally not converted — these are fixture factories, not user-facing code.

### Test stability

- Frontend: 14,387 tests, 0 failures, 1 skipped.
- Server: 130 tests, 0 failures.
- tsc: clean.
- ESLint: 0 errors, 0 warnings.

### Verifications performed

- Every fix's `tsc --noEmit` is clean.
- The money-AST detector's `--update` rebaseline is the new gate; if a future commit regresses the count, pre-push fails.
- The fabrication-AST detector's `--update` rebaseline is at 0; any new hand-typed literal fails pre-push.
- 4 fabrication-regression test files assert that pre-session-028 fabricated literals (e.g., "Acme Corp", "85" risk score, "12 500" Scope 1 tCO₂e) do not appear in the rendered DOM.
- 2 detector-regression tests pin the suppression marker semantics so a future change cannot silently drop the reason.
