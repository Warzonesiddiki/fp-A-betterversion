---
id: MEMORY/SESSIONS/sess_027.md
status: active
last_verified: 2026-08-20
verified_by: arena-agent/session-027
confidence: high
---

# Session 027 — 2026-08-20

## Goal

T-027 wave pair on `arena/01a01b67-fp-a-betterversion` (branched from `main` @ `8ea4c2f`,
PR #67 already merged): money-AST `LeaseEngine` (7) + `LeaseDetailPage` (7) → 0, and
fabrication `BoardPackPage` (3) → 0.

## Read

Boot chain, HANDOVER, ANTI, detectors `--file` dumps, `LeaseEngine.ts` (already decimal for
PV/schedules), `LeaseDetailPage.tsx`, `leaseStore` seeds, `BoardPackPage.tsx` + money tests,
`balanceSheetData.ts` identity.

## Changed

- `src/engines/LeaseEngine.ts` — recoverability via `compareMoney`; period/index arithmetic
  renamed off money-shaped identifiers (`term`, `months`, `paymentCount`, `scheduleCount`).
- **NEW** `src/pages/lease/leaseDetailData.ts` (+ tests) — first-12 liability rows and annual
  ROU roll-forward without `Math.round` on money.
- `src/pages/lease/LeaseDetailPage.tsx` — consumes it; 7 → 0.
- **NEW** `src/pages/reports/boardPackData.ts` (+ tests) — P&L + closing equity via
  `computeBalanceSheet`; no `Math.abs`; gross margin is (rev − COGS)/rev.
- `src/pages/reports/BoardPackPage.tsx` — empty highlights/commentary; h1 empty state;
  fabrication 3 → 0.

## Facts

- 6 of 7 LeaseEngine flags were period/index math on `lease*` names, not money. The 7th
  (`undiscountedCF >= closingBalance`) is a real recoverability test now on decimals.
- LeaseDetail `Math.round` on engine cents discarded pennies on the amortisation table and
  `rouAsset - bookValue` was float.
- BoardPack shipped T&E `($12,400)`, software `($8,200)`, supplies `$3,500` and a `$4.5M /
  22% YoY` commentary on every tenant. Detector saw only the three currency strings.
- BoardPack equity omitted current-period earnings (same class as s026 BS). Expenses were
  `Math.abs` of prefixes 5+6 only; interest/tax ignored. Gross margin used all expenses.
- Full suite: **1257 files · 14,373 passed · 1 skipped · 0 failed**. tsc clean.
- Ratchets: money 390 → **376** / 156 modules / 82.39%; fabrication 13 → **10** / 6 files.
- Teeth: reverting the two pages to HEAD fails 3 new source-guard assertions.

## Next

Money: SankeyChart (6 — layout?) / WorkingCapital / grouping idiom. Fabrication: EmissionsTrading,
EnergyDashboard, ClaimsAnalytics, FacilityManagement (twos).
