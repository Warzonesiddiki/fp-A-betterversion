/**
 * Balance-sheet derivation from General Ledger entries.
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0):
 *
 * 1. **Closing equity includes current-period earnings.** This is the defect
 *    this module exists to fix. The previous in-page `computeBalanceSheet`
 *    rolled up prefix 1 / 2 / 3 only and then asserted
 *    `Assets = Liabilities + Equity`. In double entry the sum of debits equals
 *    the sum of credits, so
 *
 *        Assets − Liabilities − PostedEquity ≡ Revenue − Expenses ≡ NetIncome
 *
 *    Any ledger with P&L activity therefore reported "Off by <net income>" on
 *    perfectly balanced books, and the figure it called "Total Equity" was
 *    contributed capital plus *prior* retained earnings only. Profit sits in
 *    the open P&L accounts until it is closed out, so closing equity is
 *    `postedEquity + currentPeriodEarnings`. `src/pages/reports/threeStatementData.ts`
 *    already derives equity this way; the two surfaces now agree.
 *
 * 2. **Natural balance, never `Math.abs` on an entry.** Assets are debit-normal
 *    (`debit − credit`); liabilities, equity and revenue are credit-normal
 *    (`credit − debit`); COGS/OpEx/interest/tax are debit-normal. A contra
 *    posting must reduce the balance it offsets.
 *
 * 3. **All arithmetic is decimal.js via `@/utils/money`.** Rounding happens
 *    once, on emission. The imbalance is rounded once, from the unrounded
 *    difference, rather than differencing two independently rounded sides.
 *
 * 4. **No tolerance window.** The old check was `Math.abs(diff) < 0.01`, which
 *    silently passes books that are out by up to a cent in either direction.
 *    Balanced means the cent-rounded difference is exactly zero.
 *
 * 5. **Nothing is silently dropped.** Entries whose account code carries no
 *    known class prefix (1–8) used to vanish from every total while still
 *    affecting the ledger, so the sheet could not balance and the page could
 *    not say why. They are counted and reported.
 *
 * Account-code prefixes are the app-wide convention:
 *   1 Asset · 2 Liability · 3 Equity · 4 Revenue · 5 COGS · 6 OpEx
 *   7 Interest · 8 Income tax
 * The GL carries no jurisdiction, D&A or cash-flow-activity dimension; none is
 * inferred here.
 */

import Decimal from 'decimal.js';
import { roundTo, sumMoney, toDecimal, type MoneyInput } from '@/utils/money';

/** Minimal shape this module needs from a posted GL entry. */
export interface BalanceSheetGLEntry {
  readonly accountCode?: string;
  readonly debit?: MoneyInput | null;
  readonly credit?: MoneyInput | null;
  readonly date?: string;
}

export interface BalanceSheetReport {
  /** Prefix 1, debit-normal. */
  readonly totalAssets: number;
  /** Prefix 2, credit-normal. */
  readonly totalLiabilities: number;
  /** Prefix 3, credit-normal: contributed capital and prior retained earnings. */
  readonly postedEquity: number;
  /** Revenue (4) − COGS (5) − OpEx (6) − Interest (7) − Tax (8). */
  readonly currentPeriodEarnings: number;
  /** `postedEquity + currentPeriodEarnings` — the closing equity of the identity. */
  readonly totalEquity: number;
  /** `totalLiabilities + totalEquity`, derived once so the view never re-adds it. */
  readonly totalLiabilitiesAndEquity: number;
  /** `totalAssets − (totalLiabilities + totalEquity)`, rounded once, to the cent. */
  readonly diff: number;
  /** True only when `diff` is exactly zero. No tolerance window. */
  readonly isBalanced: boolean;
  /** Entries included after the as-of cutoff. */
  readonly entryCount: number;
  /** Entries whose account code has no class prefix in 1–8. */
  readonly unclassifiedCount: number;
  /** Debit-normal movement of those entries, so the gap can be explained. */
  readonly unclassifiedMovement: number;
}

const ZERO = new Decimal(0);
const CLASS_PREFIXES = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

function money(value: MoneyInput | null | undefined): Decimal {
  if (value === null || value === undefined) return ZERO;
  return toDecimal(value);
}

function codeOf(entry: BalanceSheetGLEntry): string {
  return entry.accountCode ?? '';
}

/**
 * Calendar day of an entry.
 *
 * Entry dates are compared as `YYYY-MM-DD` strings. Some importers write a
 * full ISO timestamp, and `'2026-06-30T09:15:00Z' <= '2026-06-30'` is false, so
 * a same-day entry was dropped from an as-of report that should include it.
 */
function dayOf(entry: BalanceSheetGLEntry): string {
  return (entry.date ?? '').slice(0, 10);
}

function withPrefix(
  entries: readonly BalanceSheetGLEntry[],
  prefix: string
): readonly BalanceSheetGLEntry[] {
  return entries.filter((e) => codeOf(e).startsWith(prefix));
}

/** Debit-normal movement: debit − credit (assets, expenses). */
function debitNormal(entries: readonly BalanceSheetGLEntry[]): Decimal {
  return sumMoney(entries.map((e) => money(e.debit).minus(money(e.credit))));
}

/** Credit-normal movement: credit − debit (liabilities, equity, revenue). */
function creditNormal(entries: readonly BalanceSheetGLEntry[]): Decimal {
  return sumMoney(entries.map((e) => money(e.credit).minus(money(e.debit))));
}

/**
 * Roll up the balance sheet for every entry dated on or before `asOfDate`
 * (inclusive, `YYYY-MM-DD`). Omit `asOfDate` to include the whole ledger.
 */
export function computeBalanceSheet(
  entries: readonly BalanceSheetGLEntry[],
  asOfDate?: string
): BalanceSheetReport {
  const filtered = asOfDate ? entries.filter((e) => dayOf(e) <= asOfDate) : entries;

  const assets = debitNormal(withPrefix(filtered, '1'));
  const liabilities = creditNormal(withPrefix(filtered, '2'));
  const postedEquity = creditNormal(withPrefix(filtered, '3'));

  // Current-period earnings from the still-open P&L accounts. Revenue is
  // credit-normal; every expense class is debit-normal and reduces earnings.
  const revenue = creditNormal(withPrefix(filtered, '4'));
  const cogs = debitNormal(withPrefix(filtered, '5'));
  const opex = debitNormal(withPrefix(filtered, '6'));
  const interest = debitNormal(withPrefix(filtered, '7'));
  const tax = debitNormal(withPrefix(filtered, '8'));
  const currentPeriodEarnings = revenue.minus(cogs).minus(opex).minus(interest).minus(tax);

  const totalEquity = postedEquity.plus(currentPeriodEarnings);
  const totalLiabilitiesAndEquity = liabilities.plus(totalEquity);

  const unclassified = filtered.filter(
    (e) => !CLASS_PREFIXES.some((p) => codeOf(e).startsWith(p))
  );

  // One rounding, applied to the unrounded difference: differencing two sides
  // that were each rounded first manufactures a phantom cent.
  const diff = roundTo(assets.minus(totalLiabilitiesAndEquity), 2);

  return {
    totalAssets: roundTo(assets, 2),
    totalLiabilities: roundTo(liabilities, 2),
    postedEquity: roundTo(postedEquity, 2),
    currentPeriodEarnings: roundTo(currentPeriodEarnings, 2),
    totalEquity: roundTo(totalEquity, 2),
    totalLiabilitiesAndEquity: roundTo(totalLiabilitiesAndEquity, 2),
    diff,
    isBalanced: diff === 0,
    entryCount: filtered.length,
    unclassifiedCount: unclassified.length,
    unclassifiedMovement: roundTo(debitNormal(unclassified), 2),
  };
}
