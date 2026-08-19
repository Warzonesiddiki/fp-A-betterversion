/**
 * Board-pack figures from the GL. Same prefixes and closing-equity identity
 * as balanceSheetData / threeStatementData. No invented commentary or
 * line-item variances — the GL has no T&E / software / supplies split.
 */
import { computeBalanceSheet } from '@/pages/reports/balanceSheetData';
import { roundTo, sumMoney, subtractMoney, divideMoney, type MoneyInput } from '@/utils/money';
import type { GLEntry } from '@/types';

export interface BoardPackReport {
  revenue: number;
  /** COGS + OpEx + interest + tax (debit-normal). Not a gross-cost figure. */
  expenses: number;
  netIncome: number;
  assets: number;
  liabilities: number;
  /** Posted prefix-3 + current-period earnings. */
  equity: number;
  /** (Revenue − COGS) / Revenue. Null when revenue is zero or COGS is the only cost. */
  grossMargin: number | null;
  totalBudget: number;
  budgetCount: number;
  entryCount: number;
}

export function sumByAccountPrefix(
  entries: readonly GLEntry[],
  prefixes: readonly string[],
  mode: 'debit' | 'credit'
): number {
  const matched = entries.filter((e) => {
    const code = e.accountCode || '';
    return prefixes.some((p) => code.startsWith(p));
  });
  const values = matched.map((e) => {
    if (mode === 'credit') {
      return subtractMoney(e.credit, e.debit);
    }
    return subtractMoney(e.debit, e.credit);
  });
  return roundTo(sumMoney(values), 2);
}

export function computeBoardPackReport(
  entries: readonly GLEntry[],
  budgets: readonly { totalAmount?: MoneyInput }[]
): BoardPackReport | null {
  if (entries.length === 0) return null;

  const sheet = computeBalanceSheet(entries);
  const revenue = sumByAccountPrefix(entries, ['4'], 'credit');
  const cogs = sumByAccountPrefix(entries, ['5'], 'debit');
  const opex = sumByAccountPrefix(entries, ['6'], 'debit');
  const interest = sumByAccountPrefix(entries, ['7'], 'debit');
  const tax = sumByAccountPrefix(entries, ['8'], 'debit');
  const expenses = roundTo(sumMoney([cogs, opex, interest, tax]), 2);
  const netIncome = sheet.currentPeriodEarnings;
  const grossMargin =
    revenue === 0 ? null : roundTo(divideMoney(subtractMoney(revenue, cogs), revenue).times(100), 2);

  const totalBudget = roundTo(
    sumMoney(budgets.map((b) => b.totalAmount || 0)),
    2
  );

  return {
    revenue,
    expenses,
    netIncome,
    assets: sheet.totalAssets,
    liabilities: sheet.totalLiabilities,
    equity: sheet.totalEquity,
    grossMargin,
    totalBudget,
    budgetCount: budgets.length,
    entryCount: entries.length,
  };
}
