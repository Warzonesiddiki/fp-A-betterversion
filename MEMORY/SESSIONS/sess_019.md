---
id: MEMORY/SESSIONS/sess_019.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-019
confidence: high
---

# Session 019 — 2026-08-18

## Goal

T-019: money-AST `RollingForecastPage` (10) → 0 and fabrication
`GovernmentDashboardPage` (5) → 0, both with teeth.

## Read

`MEMORY/INDEX.md` → `STATE.json` → `MEMORY/TRUTH.md` → `MEMORY/TASKS/NOW.md`, then
`src/pages/forecasts/RollingForecastPage.tsx`,
`src/pages/sectors/GovernmentDashboardPage.tsx`, `src/store/governmentStore.ts`,
`src/pages/__tests__/sectors/GovernmentDashboardPage.test.tsx`.

## Changed (paths)

- `src/pages/forecasts/rollingForecastModel.ts` + `.test.ts` (new),
  `RollingForecastPage.tsx` rewired, `RollingForecastPage.money.test.tsx` (new probe).
- `src/utils/chartScale.ts` (new; layout-only percentages).
- `src/pages/sectors/governmentDashboardData.ts` + `.test.ts` (new),
  `GovernmentDashboardPage.tsx` rewired, `GovernmentDashboardPage.money.test.tsx` (new probe),
  `src/pages/__tests__/sectors/GovernmentDashboardPage.test.tsx` (rewritten).
- Both baselines; `.agent/*`; `MEMORY/*`.

## Facts added

- Money 464 → 453 (80.87%); fabrication 50 → 45 / 16 files; per-file diff confined to two files.
- 2 of the 13 money ops were layout geometry reclassified into `chartScale.ts` — measurement, not
  safety. Stated in the journal and handover.
- "Forecast Accuracy" measured volatility of actuals, never a forecast; on a steady 10% series the
  old rule scores 0% where the method is exact.
- A demo fallback on a routed page is a fabrication: every new tenant saw it.

## Assumptions added / killed

Projection needs ≥3 posted months with a positive base; backtest needs ≥4. Both stated in the
model and surfaced in the UI when unmet.

## Errors + fixes

- Sandbox restore (second consecutive session) — recovered with the documented drill.
- Two eslint warnings (unused `screen`, unused `Users` icon) after the rewrites.
- The legacy government smoke test failed once the demo fallback went; it was protecting the
  fabrication, so it was rewritten rather than restored.

## Next agent should

T-020: money-AST `src/pages/realestate/ValuationPage.tsx` (10); fabrication
`src/pages/sectors/LogisticsDashboardPage.tsx` (5). Consider a class-wide fix for the
`existing.debit += e.debit` grouping idiom — it recurs across at least six pages.
