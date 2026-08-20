# SESSION 028 — Wave W0.1.1 continuation + fabrication

**Date:** 2026-08-20
**Branch:** `arena/01a01caf-fp-a-betterversion`
**Session id:** sess_028

## Goal

Continue Phase 0 / Wave W0.1.1 — raise AST money safety toward ≥90% and drive
fabrication findings to zero. Highest leverage targets identified from the
prior session's worklist.

## Target hits (in order)

1. **Grouping-idiom class fix (16 files).** Replace
   `existing.debit += e.debit` (and credit/net/count siblings) with
   `existing.debit = addMoney(existing.debit, e.debit).toNumber()` in
   every sector page and dashboard. Single class-wide fix moves multiple
   AST counts at once. Files (16):
   - src/pages/charts/ChartOfAccountsPage.tsx
   - src/pages/collaboration/ActivityFeed.tsx
   - src/pages/collaboration/SharedReports.tsx
   - src/pages/collaboration/TeamWorkspace.tsx
   - src/pages/consolidation/ConsolidationPage.tsx
   - src/pages/education/EducationPage.tsx
   - src/pages/energy/EnergySectorPage.tsx
   - src/pages/esg/ESGPage.tsx
   - src/pages/government/GovernmentPage.tsx
   - src/pages/healthcare/HealthcarePage.tsx
   - src/pages/insurance/InsurancePage.tsx
   - src/pages/lease/LeaseAccountingPage.tsx
   - src/pages/logistics/LogisticsPage.tsx
   - src/pages/manufacturing/ManufacturingPage.tsx
   - src/pages/saas/SaaSPage.tsx
   - src/pages/telecom/TelecomPage.tsx
2. **HealthcareDashboardPage (6 ops).** Includes Math.floor on revenue and
   a /1e6 unit conversion. Mix of fabrication (sparkline scaling) and money
   arithmetic. Check store + page for hand-typed values.
3. **Fabrication worklist (10 findings / 6 files).** Worst first:
   - src/pages/energy/EmissionsTradingPage.tsx (2)
   - src/pages/energy/EnergyDashboardPage.tsx (2)
   - src/pages/insurance/ClaimsAnalyticsPage.tsx (2)
   - src/pages/realestate/FacilityManagementPage.tsx (2)
   - src/pages/energy/RenewableEnergyPage.tsx (1)
   - src/components/ui/ICReconciliationReport.tsx (1)
4. **SankeyChart (6 ops).** Confirmed: layout-geometry (`/ totalValue *
VIEW_HEIGHT`). Should be a detector false positive — flag for detector
   precision fix, not a money refactor.

## Ratchet targets (going in)

- money 376 → ≤300 (16 files at ~3 each + HealthcareDashboard -6 ≈ -54)
- fabrication 10 → 0
- expect safety ≥85% after this session

## Process rules (from prior sessions)

- `npx prettier --write` on every JSON/MD you write before `git add`.
- Run FULL vitest suite before opening a PR.
- Verify each fix has teeth (revert + confirm new test fails).
- Source guards on every derivation, paired with DOM assertions using real
  engine.
- Use the FULL test path. Don't rely on the P0 shard.
- No money helpers in geometry. `SankeyChart` is layout — leave arithmetic,
  tighten the detector.
- All fabrication work: replace literal with derived value from real store
  / engine. If the GL is empty, disclose it — do not ship a number.
