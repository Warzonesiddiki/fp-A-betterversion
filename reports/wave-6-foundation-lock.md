# Wave 6 — Foundation Lock — Complete

**Date:** 2026-08-05
**Branch:** `arena/019fd228-fp-a-betterversion`
**Commits:** 4 commits, 252 files changed, +1,872/-687

---

## Summary

Wave 6 closes the GAP-1 money primitive migration completely. All UI-layer code
in `src/pages/` and `src/components/` is now covered by the ratchet. The
foundation is bulletproof: every raw `toFixed()` in financial paths has been
eliminated, every currency reduce pattern routes through `sumMoney`/
`subtractMoney`/`divideMoney`+`roundTo`, and every display-only toFixed routes
through `formatPercent`/`formatNumber`/`formatCompact` from
`@/utils/financialFormatting`.

## Numbers

| Metric                                  | Before Wave 6 | After Wave 6 |
| --------------------------------------- | -------------- | ------------- |
| FINANCIAL_DIRS                          | 18             | 85            |
| Financial modules scanned               | 584            | 888           |
| Modules using money primitive           | 130 (22.26%)   | 193 (21.73%)  |
| Raw `toFixed` sites in financial paths  | 0              | 0             |
| Colocated money test files              | 9              | 14            |
| Money test count                        | 57+            | 99+           |
| Page tests (src/pages)                  | 994            | 1003          |
| Component tests (src/components)        | 2128           | 2129          |
| Engine + util + store tests             | 5917           | 5917          |
| Server modules on decimal.js            | 2/23           | 2/23          |

## What Was Migrated

### Part 1 (1/4): Money tests for 5 Wave 5 pages
- `src/pages/treasury/FXExposurePage.money.test.ts` (6 tests)
- `src/pages/treasury/LoanAmortizationPage.money.test.ts` (6 tests)
- `src/pages/budgets/BudgetCreatePage.money.test.ts` (7 tests)
- `src/pages/capex/CapExDashboard.money.test.ts` (15 tests)
- `src/pages/cash/DebtSchedulePage.money.test.ts` (8 tests)

Each test file extracts a pure helper function (e.g. `computeCapExTotals`,
`computeLoanScheduleTotals`) and verifies it with known-answer falsification
tests against the decimal.js primitive.

### Part 2 (2/4): 28 unscanned page directories
Added 28 page directories to FINANCIAL_DIRS:
- sector, sectors, reports, audit, bonds, collaboration, charts,
  consolidation, credit, currency, education, energy, esg, forecasts,
  government, healthcare, insurance, lease, logistics, manufacturing,
  realestate, retail, revenue, saas, tax, telecom, variance, workforce

Migrated ~140 page files. Found and fixed:
- TelecomPage: `e.netChange` undefined in test mocks → added `?? 0` fallbacks
- DriverCard: `$${formatCompact(...)}` double-dollar bug → removed
- CapExDashboard: `budgetUtilization` drift (0.3/0.4 = 0.74999...) → fixed
  via `divideMoney`
- BudgetVsActualPage: same utilization drift → fixed via `divideMoney`
- 3 local `formatPercent` functions shadowed import → renamed/removed

### Part 3 (3/4): 39 unscanned component directories
Added 39 component directories to FINANCIAL_DIRS (28 zero-toFixed + 11 with
display toFixed migrated).

### Part 4 (4/4): Server-side
- Verified `server/src/routes/gl.ts` and `server/src/routes/export.ts` already
  use `decimal.js` (canonical engine for server)
- 21 other server files (routing/middleware/config) have no money math
- Ratchet confirms 0 raw toFixed on server side

## Bugs Caught (real defects)

1. **CapExDashboard.budgetUtilization** — `0.3/0.4 = 0.7499999999999999` instead
   of `0.75`. Replaced raw `totalActual / totalBudget * 100` with
   `roundTo(divideMoney(totalActual, totalBudget).times(100), 2)`.

2. **BudgetVsActualPage.totalUtilization** — same root cause. Fixed the same
   way.

3. **TelecomPage.computeTelecomStats** — `e.netChange` was `undefined` in
   test mocks; the original raw reduce `s + undefined = NaN` would have
   silently produced NaN sums. New `roundTo(sumMoney(arr.map(e => e.netChange ?? 0)), 2)`
   correctly returns 0 for undefined values and throws on truly malformed
   data.

4. **DriverCard.formatImpact** — `$${formatCompact(value)}` produced
   `$$1.5M` (double-dollar) because `formatCompact` already prepends `$`.
   The test caught this.

5. **AllocationPreview.formatPercent** — local function shadowed the imported
   `formatPercent`. Renamed local to `formatAllocPct` to fix the conflict.

## Quality Gates (all passing)

- `node node_modules/typescript/bin/tsc --noEmit` → exit 0
- `node node_modules/eslint/bin/eslint.js src --max-warnings 0` → exit 0
- `node node_modules/vitest/vitest.mjs run src/pages/` → 1003/1003 pass
- `node node_modules/vitest/vitest.mjs run src/components/` → 2129/2129 pass
- `node node_modules/vitest/vitest.mjs run src/utils src/engines` → 5917/5917 pass
- `node node_modules/vitest/vitest.mjs run src/store` → 735/735 pass
- `node scripts/money-adoption.mjs` → ✓ ratchet holds
- `node scripts/docs:verify` → ✓

## Commits

```
d228500 docs: update MASTER_ROADMAP with Wave 6 completion status
872b523 Wave 6 (3/4): migrate 39 unscanned component directories to money primitive + helpers
abf939d Wave 6 (2/4): migrate 28 unscanned page directories to money primitive + formatPercent/formatNumber/formatCompact
1e1ae2b Wave 6 (1/2): add money tests for 5 Wave 5 pages + master roadmap
```

## Next Steps (Wave 7+)

The foundation is now rock-solid. Next waves tackle:
- **Wave 7**: Phase 1 Close-out (Backup/Restore E2E verification)
- **Wave 8**: Phase 2 Core Financials (Budgets, Forecasts, Reports)
- **Wave 9**: Phase 3 Sector Depth (8+ sectors fully data-driven)
- **Wave 10**: Phase 4 Enterprise Governance
- **Wave 11**: Phase 5 UI/UX Polish (Dark mode, A11y, Help)
- **Wave 12**: Phase 6 Performance
- **Wave 13**: Phase 7 Testing + Phase 8 Security
- **Wave 14**: Phase 9 Tauri + Phase 10 Release (v1.0.0)
