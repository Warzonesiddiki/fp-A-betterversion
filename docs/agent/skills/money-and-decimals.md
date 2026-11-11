---
name: money-and-decimals
description: >
  Use for any change that reads, computes, stores, sums, allocates or displays an
  amount. Money is integer minor units behind a branded type; never a float.
group: finance
---

# Money and decimals

**Use when** an amount appears anywhere: ledger rows, budgets, forecasts, FX,
variances, exports, mock data.

## The rules

1. In this repository, `Money` is `{ minor: number; currency?: string }` in
   `src/utils/money.ts`; the integer is minor units. `asMoney` rejects unsafe,
   sub-cent, non-finite, or unparseable input rather than silently rounding. This
   type flip is staged adoption; many boundaries and derived values remain
   major-unit numbers. Check `docs/architecture/money-type-migration.md`.
2. Use the helper appropriate to the actual input and output types: branded
   `Money` helpers (`moneyPlus`, `moneyMinus`, `moneySum`) or Decimal-oriented
   amount helpers (`addMoney`, `sumMoney`, `multiplyMoney`, `allocateMoney`,
   `percentOf`, `variancePct`). Never use raw floating-point arithmetic for
   monetary truth.
3. Display goes through `formatMoney` / `toFixedMoneyString`. A `toFixed` on an
   amount in `src/` is a ratchet failure (`npm run money:ast`).
4. Legacy readers that treat an object-shaped `Money` as a number can silently
   substitute a fallback (often zero). At explicit compatibility boundaries use
   `optionalAmountFrom` when absence must remain distinguishable; investigate an
   unexpected zero before trusting a total.
5. Missing is not zero. A missing amount is `undefined` (`optionalAmountFrom`)
   and must render as blank/"—", never as 0 and never as 0.00.
6. Rounding happens once, at the boundary you can name. Allocation remainder goes
   to a named line, not into the last row by accident.

## In this repo

- Ledger `GLEntry` adoption is staged. Do not generalize its persistence/hydration
  guarantees to all engines, stores, DTOs, or SQL columns; consult the migration
  ledger and current persistence boundary for the path being changed.
- `src/utils/moneyTrapCensus.test.ts` fails if the `typeof x === 'number' ? … : 0`
  shape returns to `src/engines` or `src/store`.
- Gates: `npm run money:ast`, `npm run money:adoption`, `npm run financial:oracles`.

## Red flags

- A new `Number(...)`, `parseFloat`, `* 1` or `+amount` on an amount.
- A chart axis label computed from a float total.
- A test asserting `toBe(0)` where the product should say "missing".

**Source:** `src/utils/money.ts`, `docs/architecture/money.md`, and DEC-048/051/055/056/057; verify current API and migration stage before applying.
