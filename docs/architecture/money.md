# Money Primitive Architecture

## Overview

The target is zero binary-floating-point authority for financial calculations. `npm run money:ast` currently reports zero unsafe expressions in its scanned financial paths, but the result is bounded by the detector's scope and explicit suppressions; it is not proof that every calculation or storage boundary is float-free.

Since DEC-057 (2026-10-22), in-memory `GLEntry.debit`, `credit`, `netChange`, and `amount` are `Money` values. Compatibility boundaries still use major-unit `number` values (including server wire DTOs and some derived/page models), and engine/service plus page/component adoption remains staged. The Tauri/server SQL schema also contains `REAL` amount columns; the active persistence authority and migration status must be distinguished from those schema declarations.

## The Money Primitive (`src/utils/money.ts`)

- Encapsulates monetary values as exact decimals (`Decimal.js`) at a documented currency scale, with `toCents` / `fromCents` for integer minor units.
- Prevents catastrophic float accumulation during multi-currency translation, consolidation, tax allocation, and compound interest calculations.
- Provides arithmetic operators (`addMoney`, `subtractMoney`, `multiplyMoney`, `divideMoney`, `sumMoney`, `allocateMoney`) with a single declared rounding mode: **ROUND_HALF_UP** at `DEFAULT_CURRENCY_PLACES` (2).
  (Corrected 2026-10-21: this page previously claimed "half-even / banker's rounding". The code has always used half-up — `1.005 → 1.01`, `2.675 → 2.68` — and `src/utils/money.test.ts` KAV-08 pins it. The doc was wrong, not the code.)
- Invalid input (NaN, ±Infinity, empty string, non-numeric string) throws `InvalidMoneyError`. Nothing silently returns 0.
- `allocateMoney` currently conserves integer-cent totals deterministically, but it is **not largest-remainder allocation**: the code floors proportional shares using JavaScript-number weights, then distributes residual cents by input index. The allocation policy and numerical treatment of weights need review; see the Stage 1 audit.

## Ledger admission scale (P1-11 phase 1, 2026-10-21)

`LEDGER_SCALE` (= `DEFAULT_CURRENCY_PLACES`, 2) is the precision at which the ledger stores and reconciles money. Every write surface — `setEntries`, `addEntries`, `addEntry`, `importGLData` through `validateEntries`, and the server hydrate path — applies one rule:

> At input/compatibility boundaries, a ledger amount must be finite, non-negative (for `debit`/`credit`), and representable at `LEDGER_SCALE`; the canonical in-memory `GLEntry` fields are `Money` minor units since DEC-057.

Finer precision is **refused with a named reason**, never rounded on write. Money that cannot be represented exactly would be discarded, and FR-006 forbids silent discard. `decimalPlacesOf` and `hasSubUnitPrecision` expose the check in the primitive; the store decides how to report it.

### Why the rule exists (measured before it)

`netChange`, the aggregates the store derives, and the double-entry gate all worked in whole cents, while `debit`/`credit` were stored verbatim. Two precisions in one record produced three observable defects:

| Input                                            | Stored                          | Consequence                                                                                   |
| ------------------------------------------------ | ------------------------------- | --------------------------------------------------------------------------------------------- |
| `debit: 0.004, credit: 0`                        | `debit 0.004`, `netChange 0.00` | The row carried money its own net could not see.                                              |
| `debit: 0.1 + 0.2`                               | `0.30000000000000004`           | The analysis view printed `0.30`; a raw read showed the artefact.                             |
| `validateEntries([{ debit: 0.004, credit: 0 }])` | `isValid: true`, 0 errors       | `toCents(0.004) === toCents(0) === 0`, so the balance gate saw a balanced row carrying money. |

### Status — ledger `Money` shipped; adoption remains staged (Q5, DEC-051–057)

`GLEntry.debit`, `credit`, `netChange`, and `amount` are typed as `Money` in `src/types/index.ts:743-755`. DEC-057 records the stage-4 type flip and hydration gate. `glStore` normalizes representable rows into integer minor units and quarantines unrepresentable legacy rows verbatim rather than rounding or dropping them.

`Money = { minor: number; currency?: string }` is exact integer minor units. The persist boundary preserves canonical `$d:<decimal>` bytes, so the in-memory type flip did not require a data rewrite. Stage 4 is **SHIPPED** for the canonical ledger type/store, not for the entire application. Stages 5–6 (remaining engines/services, pages/components, and a common display adapter) remain open; several derived DTOs and server/API wire contracts still use major-unit `number` values. See the current stage ledger in `docs/architecture/money-type-migration.md` and DEC-057.

A sub-cent, non-finite, or unparseable legacy row is quarantined with its value and reason; it is not silently made into `Money`. `masterStorage` retains compatibility decoding for other persisted stores. SQL `REAL` declarations and number-valued server contracts are separate persistence/wire surfaces and remain part of the fixed-precision architecture gap.

## Migration & Enforcement

- Adopter modules include `ConsolidationEngine`, `SmartImportMapper`, and `glStore`.
- ESLint rule `no-raw-float-money` prohibits raw float arithmetic in financial models (`npm run money:ast`).
- `npm run money:adoption` reports adoption percentage; it is a ratchet, not a pass/fail victory.
