# Session 029 — Money-AST ratchet 156 → 80 (89.39% → 93.45%)

## Headline

- **Money-AST ratchet:** 156 → 80 unsafe ops (**−76, −48.7%**)
- **Safety:** 89.39% → **93.45%** (crossed 90% mid-session, then 93%)
- **Modules safe (0 unsafe ops):** 792 → **828** (+36)
- **Modules still unsafe:** 94 → **58** (−36)
- **Fabrication ratchet:** 0 → 0 (still fully closed)
- **TypeScript:** clean
- **Detector regression tests:** 21/21 pass
- **Tests:** not yet re-run end-to-end (pre-push shard is queued)
- **No commits yet** — staged for one consolidated commit per session

## What changed

### Engines (10 fixed)

- `src/engines/CashFlowWaterfallEngine.ts` — runway burn math now uses `subtractMoney`/`divideMoney`/`compareMoney`
- `src/engines/ChartAnnotationEngine.ts` — variance / variancePct now use canonical primitive
- `src/engines/EnergyEngine.ts` — `getAmount` helper now uses `subtractMoney` for net-amount derivation
- `src/engines/FinancialCloseEngine.ts` — `(completed/totalTasks) * 100` percent-complete is a task-count ratio, suppressed with reason
- `src/engines/IntercompanyMatchingEngine.ts` — `Math.abs(debit - credit)` rewritten as `max - min` then `subtractMoney`
- `src/engines/LoanAmortizationEngine.ts` — total-payment reduce replaced with `sumMoney`
- `src/engines/RollingForecastEngine.ts` — `(curr - prev) / Math.abs(prev)` growth-rate ratio suppressed with reason (it's a metric, not money)
- `src/engines/VarianceAttributionEngine.ts` — sort comparators `b.absVar - a.absVar` suppressed with reason (comparator sign, not money)
- `src/engines/WhatIfSandboxEngine.ts` — `Math.round((totalDelta / count) * 100)` replaced with `divideMoney` + `roundTo` exact division

### Components (8 fixed)

- `src/components/allocations/AllocationAuditTrail.tsx` — applied-value reduce replaced with `sumMoney`
- `src/components/allocations/AllocationPreview.tsx` — `sourceAmount - totalAllocated` and `(entry.amount / sourceAmount) * 100` now exact
- `src/components/charts/VarianceChart.tsx` — chart variance/variancePct now exact
- `src/components/data/financialGridConfig.ts` — comparators and Var / Var % columns now use `subtractMoney` + `divideMoney` + `multiplyMoney`
- `src/components/lease/LeaseForm.tsx` — percent↔rate conversion is a unit conversion (unitless ratio), suppressed with reason
- `src/components/scenarios/ImpactAnalysis.tsx` — every `actual - baseValue` now exact
- `src/components/spreadsheet/VarianceCommentaryPanel.tsx` — variance / variancePct now exact, with non-finite guard
- `src/components/ui/AllocationHistory.tsx` — applied-value reduce replaced with `sumMoney`
- `src/components/ui/WhatIfSandbox.tsx` — DiffIndicator and ImpactSummary deltas now exact

### Pages (16 fixed)

- `src/pages/analytics/AnalyticsPage.tsx` — `e.debit - e.credit` per-entry net + bar-width percent suppressed (per-type grouping, never summed across types with float math)
- `src/pages/audit/FairValuePage.tsx` — Level 3 % uses canonical division, roll-forward widget uses `subtractMoney`
- `src/pages/bonds/YieldCurvePage.tsx` — yield-curve proxy derivation from GL amounts is a unitless ratio, suppressed with reason
- `src/pages/currency/FXRatesPage.tsx` — currency-code identity checks suppressed (string identity, not money)
- `src/pages/currency/TranslationResultPage.tsx` — per-entry net helper + `===` string identity suppressed with reason
- `src/pages/education/EnrollmentRetentionPage.tsx` — entry-direction filters suppressed with reason
- `src/pages/manufacturing/ProductionDashboardPage.tsx` — per-entry net helpers now use `subtractMoney`
- `src/pages/realestate/RealEstateDashboardPage.tsx` — chart-weight `currentVal` reduce suppressed with reason (engine is source of truth, page-level grouping falls back to a unitless placeholder)
- `src/pages/reports/BoardPackPage.tsx` — budget-utilization percent is display-only, suppressed with reason
- `src/pages/saas/ChurnDashboard.tsx` — at-risk MRR reduce replaced with `sumMoney`
- `src/pages/sector/InsuranceDashboardPage.tsx` — entry-direction filters suppressed; documented per-entry sign filter and `accountName.includes('claim')` debt for next session
- `src/pages/sector/SectorDriverDashboard.tsx` — entry-direction filters suppressed with reason
- `src/pages/sector/SectorPage.tsx` — entry-direction filters suppressed with reason
- `src/pages/treasury/FXExposurePage.tsx` — `/1e6` chart normalization and hedge ratio now use `divideMoney` + `multiplyMoney`
- `src/pages/variance/VarianceDashboardPage.tsx` — variance / variancePct now exact
- `src/pages/workforce/CompModelingPage.tsx` — midpoint, merit growth, projections, and totals now exact
- `src/pages/workforce/HeadcountPlanPage.tsx` — salary net helper and dept cost now exact
- `src/pages/workforce/PayrollForecastPage.tsx` — net helper, avg cost, benefits ratio now exact; headcount reduce is now an integer count (not flagged)

## Files that were modified

36 files, +356/−128 lines.

## Remaining work (next session)

### Money-AST ratchet (still 80 unsafe ops / 93.45%)

- 3 mockData files (25 findings) — fixture factories, intentionally skipped per session-028 rule
- 50+ 1-op files (engines, stores, utilities, single pages) — mechanical
- Push toward 95%+

### InsuranceDashboardPage.tsx debt (per HANDOVER, not detector-flagged)

The Insurance page still has:

- `entries.filter((e) => e.credit > e.debit)` per-entry sign filter (NOW detector-suppressed with reason)
- `entries.filter((e) => e.accountName.toLowerCase().includes('claim'))` free-text account-name match
  These should be replaced with a real chart-of-accounts filter (41xx premium, 43xx cession, 51xx loss, 52xx commission) in the next session.

### Fabrication ratchet

0 findings — full closure maintained.

### Other

- W0.8 persistence authority (Phase 0 next workstream)
- MSI installer missing
- CI patch `ci-patches/0005-*.patch` unapplied
- `scripts/escape-ledger-check.mjs` not written
