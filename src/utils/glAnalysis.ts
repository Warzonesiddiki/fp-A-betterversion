import type { GLEntry } from '@/types';

export interface MonthlyNet {
  month: string;
  debit: number;
  credit: number;
  net: number;
}

export interface RunningBalancePoint extends MonthlyNet {
  runningBalance: number;
}

export function computeMonthlyTrend(entries: GLEntry[], accountId: string): MonthlyNet[] {
  const filtered = entries.filter((e) => e.accountId === accountId || e.accountCode === accountId);

  const monthMap = new Map<string, { debit: number; credit: number }>();

  for (const e of filtered) {
    const month = e.period || (e.date ? e.date.slice(0, 7) : 'unknown');
    const g = monthMap.get(month) || { debit: 0, credit: 0 };
    g.debit += e.debit || 0;
    g.credit += e.credit || 0;
    monthMap.set(month, g);
  }

  return Array.from(monthMap.entries())
    .map(([month, g]) => ({
      month,
      debit: g.debit,
      credit: g.credit,
      net: g.debit - g.credit,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function computeRunningBalance(
  entries: GLEntry[],
  accountId: string
): RunningBalancePoint[] {
  const monthly = computeMonthlyTrend(entries, accountId);
  let running = 0;

  return monthly.map((m) => {
    running += m.net;
    return {
      ...m,
      runningBalance: running,
    };
  });
}

export function getAccountSummary(entries: GLEntry[], accountId: string) {
  const filtered = entries.filter((e) => e.accountId === accountId || e.accountCode === accountId);

  const totalDebit = filtered.reduce((s, e) => s + (e.debit || 0), 0);
  const totalCredit = filtered.reduce((s, e) => s + (e.credit || 0), 0);

  return {
    totalDebit,
    totalCredit,
    netChange: totalDebit - totalCredit,
    transactionCount: filtered.length,
  };
}
