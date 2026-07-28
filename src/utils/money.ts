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

export type MoneyInput = number | string | Decimal;

/** Decimal-literal coercion with strict validation. */
export function toDecimal(value: MoneyInput, field = 'value'): Decimal {
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
