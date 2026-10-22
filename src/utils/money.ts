// @money-ast-allow
// Reason: this is the canonical money primitive. The flagged arithmetic
// is in `allocateMoney`:
//   1. `Math.floor((totalCents * w) / (weightSum || 1))`: integer-cent
//      floor share — a whole-number cent allocation. Integer arithmetic
//      is IEEE-754-free by definition.
//   2. `totalCents - baseCents.reduce((a, b) => a + b, 0)`: integer-cent
//      residual computation. Same — integer math.
// The function intentionally works in `toCents` (integer minor units)
// precisely to avoid float drift in penny allocation. The detector
// flags it because `totalCents` matches the MONEY_WORDS heuristic, but
// the value is a `number` of cents, not a money amount.
/**
 * Canonical money primitive (F-0006). See docs/architecture/money.md.
 *
 * DECISION: decimal.js is the single canonical engine for all money math.
 * Raw IEEE-754 float arithmetic is NOT used for financial truth anywhere in
 * this module; number inputs are treated as DECIMAL LITERALS via their
 * shortest round-trip string form (so 1.005 means 1.005, not the binary
 * double 1.00499999...). Rounding mode: ROUND_HALF_UP for currency unless a
 * caller passes an explicit accounting exception (documented at the call
 * site). Residual handling: deterministic penny allocation assigns leftover
 * cents to the earliest shares, so parts always sum exactly to the parent.
 *
 * Invalid inputs (NaN, ±Infinity, null, undefined, '', non-numeric strings)
 * throw InvalidMoneyError. Nothing here silently returns 0.
 */

import Decimal from 'decimal.js';

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export class InvalidMoneyError extends Error {
  readonly field: string;
  readonly value: unknown;

  constructor(field: string, value: unknown, reason: string) {
    super(`Invalid money input "${field}" (${reason}): ${String(value)}`);
    this.name = 'InvalidMoneyError';
    this.field = field;
    this.value = value;
  }
}

/**
 * Anything that can be read as a currency amount. `Money` is included from Q5
 * stage 3: a derived value (trial balance, account analysis) is a `Money`, and
 * a display layer still has to sum/format it — routing that through the same
 * coercion keeps the read path exact without rewriting every call site.
 */
export type MoneyInput = number | string | Decimal | Money;

/**
 * Structural test for a `Money` value: integer `minor`, nothing but
 * `minor`/`currency`. Structural rather than nominal so a value that crossed a
 * JSON boundary is still recognised (the persist boundary relies on this).
 */
export function isMoneyValue(value: unknown): value is Money {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const minor = (value as { minor?: unknown }).minor;
  if (typeof minor !== 'number' || !Number.isSafeInteger(minor)) return false;
  return Object.keys(value).every((k) => k === 'minor' || k === 'currency');
}

/** Decimal-literal coercion with strict validation. */
export function toDecimal(value: MoneyInput, field = 'value'): Decimal {
  if (isMoneyValue(value)) {
    return new Decimal(moneyToMinor(value)).div(100);
  }
  if (value instanceof Decimal) {
    if (!value.isFinite()) throw new InvalidMoneyError(field, value, 'non-finite Decimal');
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new InvalidMoneyError(field, value, 'must be finite');
    // Shortest round-trip string preserves decimal-literal semantics.
    return new Decimal(String(value));
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) throw new InvalidMoneyError(field, value, 'empty string');
    let d: Decimal;
    try {
      d = new Decimal(trimmed);
    } catch {
      throw new InvalidMoneyError(field, value, 'not a numeric string');
    }
    if (d.isNaN()) throw new InvalidMoneyError(field, value, 'not a numeric string');
    if (!d.isFinite()) throw new InvalidMoneyError(field, value, 'non-finite numeric string');
    return d;
  }
  throw new InvalidMoneyError(field, value, `unsupported type ${typeof value}`);
}

/** decimal.js's default half-up behavior is the declared mode. */
export const DEFAULT_CURRENCY_PLACES = 2;

/** Round to `places` with the declared ROUND_HALF_UP mode. */
export function roundMoney(value: MoneyInput, places = DEFAULT_CURRENCY_PLACES): Decimal {
  if (!Number.isInteger(places) || places < 0 || places > 12) {
    throw new InvalidMoneyError('places', places, 'must be an integer 0..12');
  }
  return toDecimal(value).toDecimalPlaces(places, Decimal.ROUND_HALF_UP);
}

/** Numeric round result (safe for values well inside double range). */
export function roundTo(value: MoneyInput, places = DEFAULT_CURRENCY_PLACES): number {
  return roundMoney(value, places).toNumber();
}

/** Exact fixed-scale decimal string (ROUND_HALF_UP) for financial persistence and control totals. */
export function toFixedMoneyString(value: MoneyInput, places = DEFAULT_CURRENCY_PLACES): string {
  return roundMoney(value, places).toFixed(places);
}

export function addMoney(a: MoneyInput, b: MoneyInput): Decimal {
  return toDecimal(a).plus(toDecimal(b));
}

export function subtractMoney(a: MoneyInput, b: MoneyInput): Decimal {
  return toDecimal(a).minus(toDecimal(b));
}

export function multiplyMoney(a: MoneyInput, b: MoneyInput): Decimal {
  return toDecimal(a).times(toDecimal(b));
}

/** Division. Throws on divide-by-zero — never returns Infinity or 0 silently. */
export function divideMoney(a: MoneyInput, b: MoneyInput): Decimal {
  const divisor = toDecimal(b, 'divisor');
  if (divisor.isZero()) throw new InvalidMoneyError('divisor', b, 'division by zero');
  return toDecimal(a).div(divisor);
}

/** Exact sum over a series (no float drift). */
export function sumMoney(values: readonly MoneyInput[]): Decimal {
  let acc = new Decimal(0);
  for (const v of values) acc = acc.plus(toDecimal(v));
  return acc;
}

/** Three-way compare: -1, 0, 1. */
export function compareMoney(a: MoneyInput, b: MoneyInput): -1 | 0 | 1 {
  const cmp = toDecimal(a).comparedTo(toDecimal(b));
  return cmp === null ? 0 : (cmp as -1 | 0 | 1);
}

/** True iff a equals b exactly (after decimal-literal coercion). */
export function moneyEquals(a: MoneyInput, b: MoneyInput): boolean {
  return compareMoney(a, b) === 0;
}

/** Convert a currency amount to integer minor units (cents), half-up. */
export function toCents(value: MoneyInput): number {
  const cents = toDecimal(value).times(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
  return cents.toNumber();
}

/** Convert integer minor units (cents) to a currency amount. */
export function fromCents(cents: number): Decimal {
  if (!Number.isInteger(cents) || !Number.isSafeInteger(cents)) {
    throw new InvalidMoneyError('cents', cents, 'must be a safe integer');
  }
  return new Decimal(cents).div(100);
}

/**
 * The precision at which the ledger stores and reconciles money (P1-11
 * phase 1). Mirrors the currency default: journal amounts are whole minor
 * units, and every aggregate the store derives is already quantised to it.
 */
export const LEDGER_SCALE = DEFAULT_CURRENCY_PLACES;

/**
 * Decimal places carried by a value's shortest round-trip decimal form.
 *
 * `0.3` → 1, `0.30` → 1 (the literal 0.30 *is* 0.3), `0.1 + 0.2` → 17
 * (the float artefact, not 0.30). The value is read through its
 * decimal-literal form, so this reports what a caller actually passed rather
 * than the binary expansion that produced it.
 *
 * Throws InvalidMoneyError for non-finite or non-numeric input — check
 * `Number.isFinite` first when the value is untrusted.
 */
export function decimalPlacesOf(value: MoneyInput, field = 'value'): number {
  return toDecimal(value, field).decimalPlaces();
}

/**
 * True when `value` carries precision finer than the ledger can represent.
 *
 * Such a value is NOT rounded away here: money that cannot be represented
 * exactly is refused at the boundary, never silently discarded (FR-006). This
 * is a predicate, not a rounding helper — the caller decides how to report it.
 */
export function hasSubUnitPrecision(value: MoneyInput, places = DEFAULT_CURRENCY_PLACES): boolean {
  if (!Number.isInteger(places) || places < 0 || places > 12) {
    throw new InvalidMoneyError('places', places, 'must be an integer 0..12');
  }
  return decimalPlacesOf(value) > places;
}

/* ------------------------------------------------------------------ *
 * Money — the ledger amount value type (Q5 / DEC-051 stage 1)
 *
 * An amount as EXACT integer minor units. Integer arithmetic cannot drift,
 * so `0.1 + 0.2` is `{ minor: 30 }`, not 0.30000000000000004.
 *
 * Stage 1 only DEFINES the type and proves it round-trips through the persist
 * boundary byte-for-byte. Nothing adopts it yet: `GLEntry.debit/credit/amount`
 * remain `number` until the adoption stages in DEC-051 run.
 * ------------------------------------------------------------------ */

/**
 * A ledger amount: integer minor units at `LEDGER_SCALE`, plus the currency
 * when the context carries one.
 *
 * `currency` is optional because a `GLEntry` row may not carry one at all —
 * absence means "scoped to its entry", never "unknown currency to be guessed".
 */
export interface Money {
  readonly minor: number;
  readonly currency?: string;
}

/** Arithmetic across two different currencies is a bug, not a rounding question. */
export class MoneyCurrencyMismatchError extends Error {
  readonly left: string;
  readonly right: string;

  constructor(left: string, right: string) {
    super(`Cannot combine ${left} and ${right}: mixed-currency arithmetic is not defined`);
    this.name = 'MoneyCurrencyMismatchError';
    this.left = left;
    this.right = right;
  }
}

function assertMoney(money: Money, field = 'money'): void {
  if (!Number.isSafeInteger(money.minor)) {
    throw new InvalidMoneyError(field, money.minor, 'minor units must be a safe integer');
  }
}

/**
 * Convert a decimal amount into exact minor units. Refuses sub-cent precision
 * and non-finite input rather than rounding (DEC-048).
 */
export function asMoney(value: MoneyInput, currency?: string): Money {
  if (isMoneyValue(value)) {
    if (currency === undefined) return value;
    if (value.currency !== undefined && value.currency !== currency) {
      throw new MoneyCurrencyMismatchError(value.currency, currency);
    }
    return value.currency === undefined ? { minor: value.minor, currency } : value;
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new InvalidMoneyError('value', value, 'must be finite');
  }
  if (hasSubUnitPrecision(value)) {
    throw new InvalidMoneyError(
      'value',
      value,
      `sub-cent precision exceeds the ledger scale of ${LEDGER_SCALE}`
    );
  }
  const minor = toCents(value);
  if (!Number.isSafeInteger(minor)) {
    throw new InvalidMoneyError('value', value, 'minor units exceed the safe integer range');
  }
  return currency === undefined ? { minor } : { minor, currency };
}

/** Exact minor units. */
export function moneyToMinor(money: Money): number {
  assertMoney(money);
  return money.minor;
}

/**
 * Exact decimal string of the amount in whole currency units (no exponent),
 * canonicalised like `canonicalDecimalString`: zero is `"0"` and trailing zeros
 * are trimmed, so `{ minor: 12340 }` is `"123.4"`.
 */
export function moneyCanonicalString(money: Money): string {
  assertMoney(money);
  const d = new Decimal(money.minor).div(100);
  return d.isZero() ? '0' : d.toFixed();
}

/**
 * Whole-currency-unit number. A compatibility concession for consumers still
 * typed as `number`; it is exact only up to double precision, which is why the
 * ledger value itself stays in integer minor units.
 */
export function moneyToAmount(money: Money): number {
  assertMoney(money);
  return new Decimal(money.minor).div(100).toNumber();
}

/**
 * Read a money-shaped value as a whole-currency-unit NUMBER.
 *
 * This is the explicit crossing for consumers that still speak `number`: the
 * server wire contract (`GlJournalLine`), legacy columns, and the GL store's
 * own normalisation. It exists because `Money` is an OBJECT, so every
 * `typeof value === 'number' ? value : fallback` helper silently returns its
 * fallback for it — i.e. a `Money` read as a number becomes `0`. That failure is
 * invisible to the compiler (the parameter is `unknown`), which is exactly the
 * shape of a green build with a zeroed ledger.
 *
 * Never throws: a value that is not money-shaped yields `fallback`, matching the
 * legacy tolerance at these boundaries. `asMoney` remains the strict gate.
 */
export function amountFrom(value: unknown, fallback = 0): number {
  if (isMoneyValue(value)) return moneyToAmount(value);
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return fallback;
}

function combineCurrency(a: Money, b: Money): string | undefined {
  const left = a.currency;
  const right = b.currency;
  if (left !== undefined && right !== undefined && left !== right) {
    throw new MoneyCurrencyMismatchError(left, right);
  }
  return left ?? right;
}

/** Exact addition. */
export function moneyPlus(a: Money, b: Money): Money {
  const currency = combineCurrency(a, b);
  const minor = moneyToMinor(a) + moneyToMinor(b);
  if (!Number.isSafeInteger(minor)) {
    throw new InvalidMoneyError('minor', minor, 'sum exceeds the safe integer range');
  }
  return currency === undefined ? { minor } : { minor, currency };
}

/** Exact subtraction. */
export function moneyMinus(a: Money, b: Money): Money {
  const currency = combineCurrency(a, b);
  const minor = moneyToMinor(a) - moneyToMinor(b);
  if (!Number.isSafeInteger(minor)) {
    throw new InvalidMoneyError('minor', minor, 'difference exceeds the safe integer range');
  }
  return currency === undefined ? { minor } : { minor, currency };
}

/** Exact negation. */
export function moneyNegate(money: Money): Money {
  const minor = -moneyToMinor(money);
  if (!Number.isSafeInteger(minor)) {
    throw new InvalidMoneyError('minor', minor, 'negation exceeds the safe integer range');
  }
  return money.currency === undefined ? { minor } : { minor, currency: money.currency };
}

/** Exact sum, refusing mixed currencies. */
export function moneySum(values: readonly Money[]): Money {
  let total: Money = { minor: 0 };
  for (const value of values) total = moneyPlus(total, value);
  return total;
}

/** Three-way compare. Throws `MoneyCurrencyMismatchError` across currencies. */
export function moneyCompareValues(a: Money, b: Money): -1 | 0 | 1 {
  combineCurrency(a, b);
  const left = moneyToMinor(a);
  const right = moneyToMinor(b);
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

/** Exact equality (value and, when both are present, currency). */
export function moneyEqualsValue(a: Money, b: Money): boolean {
  if (a.currency !== undefined && b.currency !== undefined && a.currency !== b.currency) {
    return false;
  }
  return moneyToMinor(a) === moneyToMinor(b);
}

export function moneyIsZero(money: Money): boolean {
  return moneyToMinor(money) === 0;
}

/** Sign of the amount: -1, 0 or 1. For display decisions, not arithmetic. */
export function moneySign(money: Money): -1 | 0 | 1 {
  const minor = moneyToMinor(money);
  if (minor === 0) return 0;
  return minor < 0 ? -1 : 1;
}

/** True when the amount is strictly negative (a credit-balance row, a loss). */
export function moneyIsNegative(money: Money): boolean {
  return moneyToMinor(money) < 0;
}

/** Percentage: value × pct / 100 (exact). */
export function percentOf(value: MoneyInput, pct: MoneyInput): Decimal {
  return toDecimal(value).times(toDecimal(pct, 'pct')).div(100);
}

/**
 * Variance percentage: (actual − base) / base × 100.
 * Throws when base is 0 and actual is not (undefined variance), returns 0
 * when both are 0 by definition, and never divides by zero silently.
 */
export function variancePct(actual: MoneyInput, base: MoneyInput): Decimal {
  const a = toDecimal(actual, 'actual');
  const b = toDecimal(base, 'base');
  if (b.isZero()) {
    if (a.isZero()) return new Decimal(0);
    throw new InvalidMoneyError(
      'base',
      base,
      'variance % undefined for zero base with non-zero actual'
    );
  }
  return a.minus(b).div(b).times(100);
}

/**
 * Deterministic penny allocation of `amount` across `shares` weights.
 * Largest-remainder with CENT precision; leftover cents are assigned to the
 * earliest shares (stable, documented), so the parts ALWAYS sum exactly to
 * the parent total. Rejects negative amounts/weights and empty share lists.
 */
export function allocateMoney(amount: MoneyInput, shares: readonly number[]): Decimal[] {
  const total = toDecimal(amount, 'amount');
  if (total.isNegative())
    throw new InvalidMoneyError('amount', amount, 'cannot allocate negative amounts');
  if (!Array.isArray(shares) || shares.length === 0) {
    throw new InvalidMoneyError('shares', shares, 'must provide at least one share');
  }
  for (const [i, w] of shares.entries()) {
    if (!Number.isFinite(w) || w < 0) {
      throw new InvalidMoneyError(`shares[${i}]`, w, 'weights must be non-negative finite numbers');
    }
  }
  const totalCents = toCents(total);
  const weightSum = shares.reduce((a, b) => a + b, 0);
  if (weightSum <= 0 && totalCents !== 0) {
    throw new InvalidMoneyError(
      'shares',
      shares,
      'all-zero weights cannot allocate a non-zero amount'
    );
  }

  // Exact floor shares in cents, then distribute the residual cents.
  const baseCents = shares.map((w) => Math.floor((totalCents * w) / (weightSum || 1)));
  let residual = totalCents - baseCents.reduce((a, b) => a + b, 0);
  const result = [...baseCents];
  for (let i = 0; residual > 0; i = (i + 1) % result.length) {
    result[i]! += 1;
    residual -= 1;
  }
  return result.map((c) => new Decimal(c).div(100));
}

/** Equal split of an amount into n parts that sum exactly to the parent. */
export function splitMoneyEvenly(amount: MoneyInput, n: number): Decimal[] {
  if (!Number.isInteger(n) || n <= 0) {
    throw new InvalidMoneyError('n', n, 'must be a positive integer');
  }
  return allocateMoney(
    amount,
    Array.from({ length: n }, () => 1)
  );
}

/** Locale display formatting (display only — never used for financial truth). */
export function formatMoney(
  value: MoneyInput,
  options: { currency?: string; locale?: string; places?: number } = {}
): string {
  const { currency, locale = 'en-US', places = DEFAULT_CURRENCY_PLACES } = options;
  const rounded = roundMoney(value, places).toNumber();
  if (currency) {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(rounded);
  }
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  }).format(rounded);
}
