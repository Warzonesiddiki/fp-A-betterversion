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

1. `Money` is `{ amount: number (integer minor units), currency }` from
   `src/utils/money.ts`. Construct with `asMoney`; it throws on sub-cent,
   non-finite or unparseable input rather than rounding silently.
2. Arithmetic goes through `moneyPlus`, `moneyMinus`, `moneySum`,
   `multiplyMoney`, `allocateMoney`, `splitMoneyEvenly`, `percentOf`,
   `variancePct`. Never `a + b` on an amount.
3. Display goes through `formatMoney` / `toFixedMoneyString`. A `toFixed` on an
   amount in `src/` is a ratchet failure (`npm run money:ast`).
4. A `Money` read as a `number` fails **silently as 0 or NaN**. If a total is 0
   and should not be, look for the type confusion before the formula.
5. Missing is not zero. A missing amount is `undefined` (`optionalAmountFrom`)
   and must render as blank/"—", never as 0 and never as 0.00.
6. Rounding happens once, at the boundary you can name. Allocation remainder goes
   to a named line, not into the last row by accident.

## In this repo

- Hydration is the one door: `persist.merge` re-encodes representable rows and
  quarantines the rest verbatim (`quarantinedEntries`). Anything unrepresentable
  is excluded from totals **and shown** — a total that is quietly short is the
  defect this design exists to prevent.
- `src/utils/moneyTrapCensus.test.ts` fails if the `typeof x === 'number' ? … : 0`
  shape returns to `src/engines` or `src/store`.
- Gates: `npm run money:ast`, `npm run money:adoption`, `npm run financial:oracles`.

## Red flags

- A new `Number(...)`, `parseFloat`, `* 1` or `+amount` on an amount.
- A chart axis label computed from a float total.
- A test asserting `toBe(0)` where the product should say "missing".

**Source:** original, from DEC-055/056/057 in `docs/discovery/decision-log.md`.
