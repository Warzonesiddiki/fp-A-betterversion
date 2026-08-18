---
id: MEMORY/SESSIONS/sess_021.md
status: active
last_verified: 2026-08-18
verified_by: arena-agent/session-021
confidence: high
---

# Session 021 — 2026-08-18

## Goal

T-021: money-AST `PromoAnalysisPage` (10) → 0 and fabrication `ForecastBuilderPage` (4) → 0.

## Read

`MEMORY/INDEX.md` → `STATE.json` → `TRUTH.md` → `TASKS/NOW.md`, then
`src/pages/retail/PromoAnalysisPage.tsx`, `src/store/retailStore.ts`,
`src/pages/forecasts/ForecastBuilderPage.tsx` and its money test.

## Changed (paths)

- `src/store/retailStore.ts` — new `promotions` collection, persist v1 → v2 (defaults empty).
- `src/pages/retail/promoAnalysisData.ts` + `.test.ts` (new), `PromoAnalysisPage.tsx` rewritten,
  `PromoAnalysisPage.money.test.tsx` (new probe).
- `src/pages/forecasts/forecastBuilderData.ts` + `.test.ts` (new), `ForecastBuilderPage.tsx`
  rewired (re-exports `computeForecastSeries` / `SEASONALITY_WEIGHTS` for existing callers),
  `ForecastBuilderPage.money.probe.test.tsx` (new probe), `ForecastBuilderPage.money.test.ts`
  (band assertions replaced).
- Both baselines; `.agent/*`; `MEMORY/*`.

## Facts added

- Money 443 → 430 (81.3%); fabrication 40 → 36 / 14 files; per-file diff confined.
- `_entries` — a store read and discarded — is a reliable tell for a fixture page.
- Promo "ROI" treated incremental revenue as profit.
- Four accuracy statistics, a fixed confidence band and a synthesised past forecast line were all
  literals on the forecast builder.
- Third green test found pinning a fabrication in five sessions.

## Assumptions added / killed

Promotions are user input, not ledger objects: added to `retailStore` rather than inferred from
revenue accounts. Seasonality presets remain declared assumptions and the backtest charges the
model for them.

## Errors + fixes

- Fourth consecutive sandbox rewind; documented drill.
- My probe assumed a flat series would backtest at 0% MAPE; with the default `standard`
  seasonality it does not. Fixed by cross-checking the page against the model's own output.
- Two eslint warnings (unused imports) after the rewrites.

## Next agent should

T-022: money-AST `src/engines/InsuranceEngine.ts` (9) — it invents net written as 0.85× gross and
policy count as premium/360; then `BenchmarkingPage` (8). Fabrication
`src/pages/healthcare/ClinicalTrialCostPage.tsx` (4).
