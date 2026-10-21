# Money Primitive Architecture

## Overview

FinPlan Pro enforces a zero-tolerance policy against floating-point rounding errors in financial computations. Raw JavaScript `number` (IEEE 754 float) is banned in financial _calculation_ paths.

One exception remains and is named below rather than glossed over: the persisted `GLEntry` money fields are still `number` (audit P1-11).

## The Money Primitive (`src/utils/money.ts`)

- Encapsulates monetary values as exact decimals (`Decimal.js`) at a documented currency scale, with `toCents` / `fromCents` for integer minor units.
- Prevents catastrophic float accumulation during multi-currency translation, consolidation, tax allocation, and compound interest calculations.
- Provides arithmetic operators (`addMoney`, `subtractMoney`, `multiplyMoney`, `divideMoney`, `sumMoney`, `allocateMoney`) with a single declared rounding mode: **ROUND_HALF_UP** at `DEFAULT_CURRENCY_PLACES` (2).
  (Corrected 2026-10-21: this page previously claimed "half-even / banker's rounding". The code has always used half-up — `1.005 → 1.01`, `2.675 → 2.68` — and `src/utils/money.test.ts` KAV-08 pins it. The doc was wrong, not the code.)
- Invalid input (NaN, ±Infinity, empty string, non-numeric string) throws `InvalidMoneyError`. Nothing silently returns 0.
- `allocateMoney` performs deterministic largest-remainder allocation in integer cents, so the parts always sum exactly to the parent.

## Ledger admission scale (P1-11 phase 1, 2026-10-21)

`LEDGER_SCALE` (= `DEFAULT_CURRENCY_PLACES`, 2) is the precision at which the ledger stores and reconciles money. Every write surface — `setEntries`, `addEntries`, `addEntry`, `importGLData` through `validateEntries`, and the server hydrate path — applies one rule:

> A ledger amount is a finite, non-negative (for `debit`/`credit`) number carrying at most `LEDGER_SCALE` decimal places.

Finer precision is **refused with a named reason**, never rounded on write. Money that cannot be represented exactly would be discarded, and FR-006 forbids silent discard. `decimalPlacesOf` and `hasSubUnitPrecision` expose the check in the primitive; the store decides how to report it.

### Why the rule exists (measured before it)

`netChange`, the aggregates the store derives, and the double-entry gate all worked in whole cents, while `debit`/`credit` were stored verbatim. Two precisions in one record produced three observable defects:

| Input                                            | Stored                          | Consequence                                                                                   |
| ------------------------------------------------ | ------------------------------- | --------------------------------------------------------------------------------------------- |
| `debit: 0.004, credit: 0`                        | `debit 0.004`, `netChange 0.00` | The row carried money its own net could not see.                                              |
| `debit: 0.1 + 0.2`                               | `0.30000000000000004`           | The analysis view printed `0.30`; a raw read showed the artefact.                             |
| `validateEntries([{ debit: 0.004, credit: 0 }])` | `isValid: true`, 0 errors       | `toCents(0.004) === toCents(0) === 0`, so the balance gate saw a balanced row carrying money. |

### Status — not yet a `Money` type

`GLEntry.debit/credit/amount/netChange` remain JS `number`. This phase makes every stored amount provably whole-cent and makes the accounting identity checkable in cents (`toCents(amount) === toCents(debit) − toCents(credit)`); it does not introduce a nominal type. The `Money` type and the 242-file adoption sweep are the remaining P1-11 work.

## Migration & Enforcement

- Adopter modules include `ConsolidationEngine`, `SmartImportMapper`, and `glStore`.
- ESLint rule `no-raw-float-money` prohibits raw float arithmetic in financial models (`npm run money:ast`).
- `npm run money:adoption` reports adoption percentage; it is a ratchet, not a pass/fail victory.
