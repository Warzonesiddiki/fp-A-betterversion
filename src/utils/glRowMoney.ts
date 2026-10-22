/**
 * Ledger-row money reads that are EXACT and shape-agnostic.
 *
 * WHY THIS EXISTS
 * ---------------
 * Fourteen page models (dashboard, cash forecast, credit risk, sectors,
 * forecasts, scenarios, real estate, insurance, construction, analytics and the
 * executive summary) each carry their own copy of the same 8-line helper:
 *
 * ```ts
 * const debitN = debit == null ? 0 : Number(debit);
 * const creditN = credit == null ? 0 : Number(credit);
 * if (debitN === 0 && creditN === 0 && entry.amount != null && Number(entry.amount) !== 0) {
 *   return false; // fall back to the signed amount
 * }
 * ```
 *
 * It exists for a real import shape: some pipelines populate `amount` only, and
 * a row with `debit: 0, credit: 0, amount: -2500` must be read as the amount,
 * not as a zero.
 *
 * `Number(...)` works for `number`, numeric `string` and `Decimal`. It does NOT
 * work for a `Money`: `Number({ minor: 0 })` is `NaN`, and `NaN === 0` is FALSE.
 * So the moment `GLEntry` money fields become `Money` (Q5 stage 4), every one of
 * those fourteen helpers stops recognising a zero debit/credit and returns
 * "this row carries debit/credit", and an amount-only row is then valued at
 * `0 − 0 = 0`. The money silently disappears from the dashboard, the cash
 * forecast, the sector KPIs — and NOTHING in the compiler complains, because
 * `Number()` accepts anything.
 *
 * That is the same failure class as DEC-055's `toFiniteNumber` trap, in a wider
 * blast radius. The fix is one tested implementation instead of fourteen
 * copies, written against `unknown` so it is correct BEFORE and AFTER the type
 * change.
 */
import Decimal from 'decimal.js';
import { isMoneyValue, moneyToAmount } from './money';
import { parseFinancialAmount } from './parseFinancialAmount';

/**
 * Exact zero test for a ledger money field of unknown shape.
 *
 * Unreadable input returns `false` — "not zero" — which deliberately reproduces
 * the `NaN` semantics of the `Number(value) === 0` comparison this replaces
 * (`NaN === 0` is false). Only the `Money` case changes behaviour, and that is
 * the defect being fixed.
 */
export function isZeroAmount(value: unknown): boolean {
  if (isMoneyValue(value)) return value.minor === 0;
  if (typeof value === 'number') return Number.isFinite(value) && value === 0;
  if (value instanceof Decimal) return value.isFinite() && value.isZero();
  if (typeof value === 'string') {
    const parsed = parseFinancialAmount(value);
    return Number.isFinite(parsed) ? parsed === 0 : false;
  }
  return false;
}

/**
 * Signed whole-currency-unit value of an untyped amount, or `null` when the
 * value is absent or cannot be read as money.
 *
 * `null` rather than `0`, because "missing is not zero" (FR-006): a caller that
 * cannot tell the two apart will value an unreadable row at nothing.
 */
export function signedAmountOf(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (isMoneyValue(value)) return moneyToAmount(value);
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value instanceof Decimal) return value.isFinite() ? value.toNumber() : null;
  if (typeof value === 'string') {
    const parsed = parseFinancialAmount(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** The shape this module needs — every page model's local entry type fits. */
export interface MoneyBearingRow {
  readonly debit?: unknown;
  readonly credit?: unknown;
  readonly amount?: unknown;
}

/**
 * Does this row genuinely carry debit/credit, or only a signed `amount`?
 *
 * Absent both → no. Present but zero, with a non-zero signed `amount` → the
 * row is an amount-only row and the amount wins. Otherwise debit/credit win.
 */
export function rowCarriesDebitCredit(entry: MoneyBearingRow): boolean {
  const { debit, credit } = entry;
  if (debit == null && credit == null) return false;
  const debitZero = debit == null || isZeroAmount(debit);
  const creditZero = credit == null || isZeroAmount(credit);
  if (debitZero && creditZero && entry.amount != null && !isZeroAmount(entry.amount)) {
    return false;
  }
  return true;
}
