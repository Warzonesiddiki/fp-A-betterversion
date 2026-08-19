/**
 * @fileoverview Insurance sector metrics from GL entries (loss ratio, combined ratio, earned premium)
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category insurance
 * @sector 11 (Insurance)
 * @since 1.0.0
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0), session 021+:
 *
 * 1. **Natural balance, never `Math.abs`.** Premium accounts are credit-normal
 *    and expense accounts debit-normal. Every figure here used to be
 *    `Math.abs(amount)`, so a premium refund or a claim recovery INCREASED the
 *    balance it should have reduced.
 * 2. **Net written premium requires posted cessions.** It was
 *    `grossWrittenPremium * 0.85` — an invented 15% reinsurance cession
 *    applied to every book. It is now gross less posted ceded premium (43xx),
 *    or `null` when no cession is posted.
 * 3. **Policy count is not derivable from a ledger.** It was
 *    `Math.round(grossWrittenPremium / 360)` with the comment "Industry
 *    average". A general ledger records amounts, not policies, so it is
 *    `null`.
 * 4. **A trend must come from the data.** `getCombinedRatioTrend` ignored its
 *    argument entirely and returned six months of
 *    `58 + sin(i * 9301 + 49297) * 8` loss ratios and `26 + … * 3` expense
 *    ratios — seeded noise presented as a ratio trend. It now buckets posted
 *    entries by period and emits a point only where earned premium exists.
 * 5. Ratios are `null` when their denominator is not positive; no zero
 *    stand-ins.
 * 6. All arithmetic is decimal.js via `@/utils/money`.
 *
 * Account-code conventions:
 * - 41xx written premium (credit-normal) · 42xx earned premium (credit-normal)
 * - 43xx reinsurance ceded (debit-normal) · 44xx investment income
 * - 51xx loss & LAE · 52xx commission · 53xx underwriting expense (debit-normal)
 */
import type { GLEntry } from '@/types';
import Decimal from 'decimal.js';
import { divideMoney, roundTo, sumMoney, toDecimal, type MoneyInput } from '../utils/money';

export interface InsuranceStats {
  grossWrittenPremium: number;
  /** Gross less posted cessions (43xx). `null` when no cession is posted. */
  netWrittenPremium: number | null;
  cededPremium: number | null;
  earnedPremium: number;
  lossExpense: number;
  expenseTotal: number;
  /** Percent. `null` when earned premium is not positive. */
  lossRatio: number | null;
  /** Percent. `null` when written premium is not positive. */
  expenseRatio: number | null;
  /** Percent. `null` unless BOTH components exist. */
  combinedRatio: number | null;
  /**
   * ALWAYS `null`. A ledger records amounts, not policies. This was
   * `gross / 360`; consumers must render the absence.
   */
  policyCount: null;
  underwritingIncome: number;
}

export interface PremiumByLine {
  name: string;
  written: number;
  earned: number;
  color: string;
}

export interface CombinedRatioTrend {
  month: string;
  lossRatio: number;
  /** `null` when no written premium is posted in the period. */
  expenseRatio: number | null;
  combined: number | null;
}

const LINE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];

const ZERO = new Decimal(0);
const CURRENCY_PLACES = 2;
const RATIO_PLACES = 2;

function money(value: MoneyInput | null | undefined): Decimal {
  if (value === null || value === undefined) return ZERO;
  return toDecimal(value);
}

function hasDebitCredit(entry: GLEntry): boolean {
  const debit = entry.debit;
  const credit = entry.credit;
  if (debit == null && credit == null) return false;
  if (debit === 0 && credit === 0 && entry.amount != null && entry.amount !== 0) return false;
  return true;
}

/** Expenses and ceded premium are debit-normal. */
function debitNormal(entry: GLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.debit).minus(money(entry.credit));
  return money(entry.amount);
}

/** Premium is credit-normal. */
function creditNormal(entry: GLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.credit).minus(money(entry.debit));
  return money(entry.amount);
}

function sumPrefix(
  entries: readonly GLEntry[],
  prefix: string,
  sign: (e: GLEntry) => Decimal
): Decimal {
  return sumMoney(entries.filter((e) => (e.accountCode ?? '').startsWith(prefix)).map(sign));
}

function hasPrefix(entries: readonly GLEntry[], prefix: string): boolean {
  return entries.some((e) => (e.accountCode ?? '').startsWith(prefix));
}

function cash(value: Decimal): number {
  return roundTo(value, CURRENCY_PLACES);
}

/** Percent, or `null` when the denominator is not positive. */
function percentOf(numer: Decimal, denom: Decimal): number | null {
  if (!denom.greaterThan(0)) return null;
  return roundTo(divideMoney(numer, denom).times(100), RATIO_PLACES);
}

export class InsuranceEngine {
  /**
   * Calculates insurance metrics from GL entries.
   * Account code conventions:
   * - 41xx: Written Premium (revenue)
   * - 42xx: Earned Premium (revenue)
   * - 51xx: Loss & LAE (expense)
   * - 52xx: Commission Expense
   * - 53xx: Underwriting Expense
   * - 44xx: Investment Income
   */
  static calculateStats(entries: GLEntry[]): InsuranceStats {
    const grossWrittenPremium = sumPrefix(entries, '41', creditNormal);
    const earnedPremium = sumPrefix(entries, '42', creditNormal);
    const hasCession = hasPrefix(entries, '43');
    const cededPremium = hasCession ? sumPrefix(entries, '43', debitNormal) : null;
    const lossExpense = sumPrefix(entries, '51', debitNormal);
    const commissionExpense = sumPrefix(entries, '52', debitNormal);
    const underwritingExpense = sumPrefix(entries, '53', debitNormal);
    const expenseTotal = commissionExpense.plus(underwritingExpense);

    const lossRatio = percentOf(lossExpense, earnedPremium);
    const expenseRatio = percentOf(expenseTotal, grossWrittenPremium);

    return {
      grossWrittenPremium: cash(grossWrittenPremium),
      netWrittenPremium:
        cededPremium === null ? null : cash(grossWrittenPremium.minus(cededPremium)),
      cededPremium: cededPremium === null ? null : cash(cededPremium),
      earnedPremium: cash(earnedPremium),
      lossExpense: cash(lossExpense),
      expenseTotal: cash(expenseTotal),
      lossRatio,
      expenseRatio,
      combinedRatio:
        lossRatio === null || expenseRatio === null
          ? null
          : roundTo(toDecimal(lossRatio).plus(expenseRatio), RATIO_PLACES),
      policyCount: null,
      underwritingIncome: cash(earnedPremium.minus(lossExpense).minus(expenseTotal)),
    };
  }

  /**
   * Breaks down premium by insurance line using last 2 digits of account code.
   */
  static getPremiumByLine(entries: GLEntry[]): PremiumByLine[] {
    const lines = [
      { suffix: '01', name: 'Auto' },
      { suffix: '02', name: 'Homeowners' },
      { suffix: '03', name: 'Life' },
      { suffix: '04', name: 'Commercial' },
      { suffix: '05', name: 'Health' },
    ];

    return lines
      .map((line, idx) => {
        const written = sumMoney(
          entries
            .filter((e) => e.accountCode.startsWith('41') && e.accountCode.endsWith(line.suffix))
            .map(creditNormal)
        );
        const earned = sumMoney(
          entries
            .filter((e) => e.accountCode.startsWith('42') && e.accountCode.endsWith(line.suffix))
            .map(creditNormal)
        );

        return {
          name: line.name,
          written: cash(written),
          earned: cash(earned),
          color: LINE_COLORS[idx % LINE_COLORS.length]!,
        };
      })
      .filter((l) => l.written !== 0 || l.earned !== 0);
  }

  /**
   * Builds combined ratio trend from monthly entries.
   */
  static getCombinedRatioTrend(entries: GLEntry[]): CombinedRatioTrend[] {
    const byPeriod = new Map<
      string,
      { earned: Decimal; written: Decimal; loss: Decimal; expense: Decimal }
    >();

    for (const entry of entries) {
      const month = entry.period || entry.date?.slice(0, 7);
      if (!month) continue;
      const code = entry.accountCode ?? '';
      const bucket = byPeriod.get(month) ?? {
        earned: ZERO,
        written: ZERO,
        loss: ZERO,
        expense: ZERO,
      };
      if (code.startsWith('41')) bucket.written = bucket.written.plus(creditNormal(entry));
      else if (code.startsWith('42')) bucket.earned = bucket.earned.plus(creditNormal(entry));
      else if (code.startsWith('51')) bucket.loss = bucket.loss.plus(debitNormal(entry));
      else if (code.startsWith('52') || code.startsWith('53'))
        bucket.expense = bucket.expense.plus(debitNormal(entry));
      else continue;
      byPeriod.set(month, bucket);
    }

    return [...byPeriod.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([month, b]) => {
        const lossRatio = percentOf(b.loss, b.earned);
        // No earned premium in the period means no loss ratio to plot; the
        // point is dropped rather than filled with noise.
        if (lossRatio === null) return [];
        const expenseRatio = percentOf(b.expense, b.written);
        return [
          {
            month,
            lossRatio,
            expenseRatio,
            combined:
              expenseRatio === null
                ? null
                : roundTo(toDecimal(lossRatio).plus(expenseRatio), RATIO_PLACES),
          },
        ];
      });
  }
}
