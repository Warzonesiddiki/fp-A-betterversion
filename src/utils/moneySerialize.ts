/**
 * W0.8.2 money-safe serialization boundary.
 *
 * Persisted monetary values MUST round-trip as canonical decimal strings,
 * never as JS numbers. JSON.stringify of an IEEE-754 double is how
 * `0.1 + 0.2` becomes `0.30000000000000004` on disk (INV-009).
 *
 * Tagged form: `$d:<canonical>` where `<canonical>` is decimal.js `toFixed()`
 * (no exponent). On hydrate, tagged strings become numbers via Decimal so
 * existing Zustand stores (typed as `number`) keep compiling. The AT-REST
 * form is the string; that is what INV-009 measures.
 *
 * In-memory `number` is a compatibility concession, not a claim of IEEE-754
 * safety. Engines must still go through `@/utils/money`. This module only
 * stops JSON from being the place the float leaks.
 */
import { toDecimal, type MoneyInput } from './money';

export const MONEY_TAG = '$d:';

/**
 * Exact field names that, when numeric, are currency amounts.
 * Conservative: qualified money names only. Ambiguous generics (`value`,
 * `total`, `actual`, `rate`) are excluded — they are as often counts/ids.
 */
const MONEY_KEYS = new Set(
  [
    'amount',
    'debit',
    'credit',
    'balance',
    'netChange',
    'beginningBalance',
    'endingBalance',
    'openingBalance',
    'closingBalance',
    'totalDebit',
    'totalCredit',
    'totalAmount',
    'principal',
    'interestAmount',
    'payment',
    'revenue',
    'expense',
    'cogs',
    'opex',
    'capex',
    'netIncome',
    'grossProfit',
    'ebitda',
    'ebit',
    'assets',
    'liabilities',
    'equity',
    'cash',
    'budgeted',
    'forecasted',
    'varianceAmount',
    'bookValue',
    'fairValue',
    'notional',
    'premium',
    'claimAmount',
    'reserve',
    'provision',
    'dividend',
    'coupon',
    'principalRemaining',
    'writeOff',
    'impairment',
    'accrual',
    'depreciation',
    'amortization',
    'amortisation',
  ].map((k) => k.toLowerCase())
);

export function isMoneyKey(key: string): boolean {
  return MONEY_KEYS.has(key.replace(/[_-]/g, '').toLowerCase());
}

/** Canonical decimal string: no exponent, exact decimal.js representation. */
export function canonicalDecimalString(value: MoneyInput): string {
  const d = toDecimal(value);
  if (d.isZero()) return '0';
  return d.toFixed();
}

export function encodeMoneyValue(value: MoneyInput): string {
  return `${MONEY_TAG}${canonicalDecimalString(value)}`;
}

export function isEncodedMoney(value: unknown): boolean {
  return (
    typeof value === 'string' && value.startsWith(MONEY_TAG) && value.length > MONEY_TAG.length
  );
}

export function decodeMoneyValue(encoded: string): string {
  if (!isEncodedMoney(encoded)) {
    throw new Error(`Not an encoded money value: ${String(encoded)}`);
  }
  return canonicalDecimalString(encoded.slice(MONEY_TAG.length));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Only IEEE-754 numbers are rewritten. Canonical decimal *strings* are already
 * the safe persist form (INV-009) and must round-trip unchanged — tagging
 * `'150000.00'` and hydrating it as `150000` silently destroyed backup/restore
 * fixtures and any store that already persisted money as text.
 */
function isUnsafeMoneyNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Walk a JSON-like graph and replace numeric money fields with `$d:` tags.
 * Non-money numbers (counts, indexes, versions) are left as numbers.
 */
export function encodeMoneyGraph(value: unknown, key = ''): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => encodeMoneyGraph(item, key));
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = encodeMoneyGraph(v, k);
    }
    return out;
  }
  if (key && isMoneyKey(key) && isUnsafeMoneyNumber(value)) {
    return encodeMoneyValue(value);
  }
  return value;
}

export type MoneyDecodeAs = 'string' | 'number';

/**
 * Reverse `encodeMoneyGraph`. `as: 'string'` returns the canonical decimal
 * string (lossless). `as: 'number'` uses Decimal.toNumber() so existing
 * stores typed as `number` keep working — a compatibility concession.
 */
export function decodeMoneyGraph(value: unknown, options: { as?: MoneyDecodeAs } = {}): unknown {
  const as = options.as ?? 'number';
  if (Array.isArray(value)) {
    return value.map((item) => decodeMoneyGraph(item, options));
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = decodeMoneyGraph(v, options);
    }
    return out;
  }
  if (typeof value === 'string' && isEncodedMoney(value)) {
    const canonical = decodeMoneyValue(value);
    if (as === 'string') return canonical;
    return toDecimal(canonical).toNumber();
  }
  return value;
}

/**
 * True when a JSON-serialized graph still contains a JS number at a money key.
 * Used by INV-009: the persisted (pre-encryption) payload must not.
 */
export function jsonContainsNumericMoney(serialized: string): boolean {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch {
    return false;
  }
  let found = false;
  const walk = (node: unknown, key: string) => {
    if (found) return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item, key);
      return;
    }
    if (isPlainObject(node)) {
      for (const [k, v] of Object.entries(node)) walk(v, k);
      return;
    }
    if (key && isMoneyKey(key) && typeof node === 'number') {
      found = true;
    }
  };
  walk(parsed, '');
  return found;
}
