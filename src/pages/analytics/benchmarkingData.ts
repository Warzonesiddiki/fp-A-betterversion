/**
 * Benchmark ratios derivable from the posted General Ledger.
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0):
 *
 * 1. All money arithmetic is decimal.js via `@/utils/money`. No IEEE-754
 *    `+ - * /` on a currency value anywhere in this module.
 * 2. Natural balance decides the sign, never `Math.abs`:
 *      debit-normal  (assets 1·, cost 5· 6· 7· 8·)      = debit − credit
 *      credit-normal (liabilities 2·, equity 3·, revenue 4·) = credit − debit
 *    `Math.abs` per entry (or per group) turns a contra posting — an
 *    accumulated-depreciation credit, a revenue reversal — into a LARGER
 *    balance. Netting is the whole point of a ledger.
 * 3. A ratio is emitted ONLY when its denominator is genuinely positive on
 *    the posted GL; otherwise `null`. Never a `|| 1` stand-in: dividing by a
 *    fabricated $1 denominator manufactures a ratio that the data cannot
 *    support.
 * 4. The quick ratio is NOT derivable from this chart of accounts: inventory
 *    has no dedicated account-code prefix, so `(current assets − inventory)`
 *    cannot be isolated. It is always `null` and the page discloses why.
 * 5. Net income = revenue − (COGS + OpEx + interest + income tax), i.e.
 *    prefixes 4 − (5 + 6 + 7 + 8), consistent with `dashboardModel`
 *    (session 017 DECISION). The prior implementation stopped at prefix 6,
 *    so interest and tax never reduced its "net income".
 */

import Decimal from 'decimal.js';
import { divideMoney, sumMoney, toDecimal, type MoneyInput } from '@/utils/money';

export interface BenchmarkGLEntry {
  readonly accountCode?: string | null;
  readonly debit?: number | string | Decimal | null;
  readonly credit?: number | string | Decimal | null;
}

export interface BenchmarkBasis {
  readonly revenue: number;
  readonly cogs: number;
  readonly opex: number;
  readonly interest: number;
  readonly incomeTax: number;
  /** revenue − (cogs + opex + interest + incomeTax). */
  readonly netIncome: number;
  readonly totalAssets: number;
  readonly totalLiabilities: number;
  readonly totalEquity: number;
  readonly currentAssets: number;
  readonly currentLiabilities: number;
}

export interface BenchmarkRatioSet {
  /** Current assets / current liabilities. `null` unless CL > 0. */
  readonly current: number | null;
  /**
   * Never derivable here — inventory has no dedicated account prefix, so
   * `(current assets − inventory) / current liabilities` cannot be computed.
   * Always `null`; the page discloses the reason.
   */
  readonly quick: null;
  /** Total liabilities / total equity. `null` unless equity > 0. */
  readonly debtToEquity: number | null;
  /** Percent. `null` unless posted revenue > 0. */
  readonly grossMargin: number | null;
  /** Percent. `null` unless posted revenue > 0. */
  readonly netMargin: number | null;
  /** Percent. `null` unless total assets > 0. */
  readonly roa: number | null;
  /** Percent. `null` unless total equity > 0. */
  readonly roe: number | null;
  /** Revenue / total assets. `null` unless total assets > 0. */
  readonly assetTurnover: number | null;
}

export interface BenchmarkDerivation {
  readonly basis: BenchmarkBasis;
  readonly ratios: BenchmarkRatioSet;
}

const ZERO = new Decimal(0);
const CURRENCY_PLACES = 2;
const RATIO_PLACES = 4;
const PERCENT_PLACES = 2;

function money(value: MoneyInput | null | undefined): Decimal {
  if (value === null || value === undefined) return ZERO;
  return toDecimal(value);
}

function code(entry: BenchmarkGLEntry): string {
  return entry.accountCode ?? '';
}

/** Debit-normal balance for one entry: debit − credit. */
export function debitNormal(entry: BenchmarkGLEntry): Decimal {
  return money(entry.debit).minus(money(entry.credit));
}

/** Credit-normal balance for one entry: credit − debit. */
export function creditNormal(entry: BenchmarkGLEntry): Decimal {
  return money(entry.credit).minus(money(entry.debit));
}

function sumPrefix(
  entries: readonly BenchmarkGLEntry[],
  prefix: string,
  balance: (e: BenchmarkGLEntry) => Decimal
): Decimal {
  return sumMoney(entries.filter((e) => code(e).startsWith(prefix)).map((e) => balance(e)));
}

/** Ratio, or `null` when the denominator is not genuinely positive. */
function ratioOf(numer: Decimal, denom: Decimal, places: number): number | null {
  if (!denom.greaterThan(ZERO)) return null;
  return divideMoney(numer, denom).toDecimalPlaces(places).toNumber();
}

/** Percent, or `null` when the denominator is not genuinely positive. */
function percentOf(numer: Decimal, denom: Decimal): number | null {
  if (!denom.greaterThan(ZERO)) return null;
  return divideMoney(numer, denom).times(100).toDecimalPlaces(PERCENT_PLACES).toNumber();
}

function cash(value: Decimal): number {
  return value.toDecimalPlaces(CURRENCY_PLACES).toNumber();
}

/**
 * Derive the eight benchmark ratios from posted entries.
 *
 * Returns `null` when there are no posted entries — the page must
 * empty-state rather than present ratios computed from nothing.
 */
export function deriveBenchmarkRatios(
  entries: readonly BenchmarkGLEntry[]
): BenchmarkDerivation | null {
  if (entries.length === 0) return null;

  const revenue = sumPrefix(entries, '4', creditNormal);
  const cogs = sumPrefix(entries, '5', debitNormal);
  const opex = sumPrefix(entries, '6', debitNormal);
  const interest = sumPrefix(entries, '7', debitNormal);
  const incomeTax = sumPrefix(entries, '8', debitNormal);
  const netIncome = revenue.minus(cogs).minus(opex).minus(interest).minus(incomeTax);

  const totalAssets = sumPrefix(entries, '1', debitNormal);
  const totalLiabilities = sumPrefix(entries, '2', creditNormal);
  const totalEquity = sumPrefix(entries, '3', creditNormal);
  const currentAssets = sumPrefix(entries, '11', debitNormal);
  const currentLiabilities = sumPrefix(entries, '21', creditNormal);

  const grossProfit = revenue.minus(cogs);

  return {
    basis: {
      revenue: cash(revenue),
      cogs: cash(cogs),
      opex: cash(opex),
      interest: cash(interest),
      incomeTax: cash(incomeTax),
      netIncome: cash(netIncome),
      totalAssets: cash(totalAssets),
      totalLiabilities: cash(totalLiabilities),
      totalEquity: cash(totalEquity),
      currentAssets: cash(currentAssets),
      currentLiabilities: cash(currentLiabilities),
    },
    ratios: {
      current: ratioOf(currentAssets, currentLiabilities, RATIO_PLACES),
      quick: null,
      debtToEquity: ratioOf(totalLiabilities, totalEquity, RATIO_PLACES),
      grossMargin: percentOf(grossProfit, revenue),
      netMargin: percentOf(netIncome, revenue),
      roa: percentOf(netIncome, totalAssets),
      roe: percentOf(netIncome, totalEquity),
      assetTurnover: ratioOf(revenue, totalAssets, RATIO_PLACES),
    },
  };
}
