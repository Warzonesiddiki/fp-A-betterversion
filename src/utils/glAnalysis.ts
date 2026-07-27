import type { GLEntry } from '@/types';

export interface MonthlyNet {
  month: string;
  debit: number;
  credit: number;
  net: number;
  transactionCount: number;
  firstDate: string;
  lastDate: string;
}

export interface RunningBalancePoint extends MonthlyNet {
  runningBalance: number;
}

export interface AccountSummary {
  totalDebit: number;
  totalCredit: number;
  netChange: number;
  transactionCount: number;
  firstDate: string | null;
  lastDate: string | null;
  averageMonthlyNet: number;
}

function matchesAccount(entry: GLEntry, accountIdOrCode: string): boolean {
  return entry.accountId === accountIdOrCode || entry.accountCode === accountIdOrCode;
}

function getEntryMonth(entry: GLEntry): string {
  if (entry.period) return entry.period;
  if (entry.date) return entry.date.slice(0, 7);
  return 'unknown';
}

function minDate(a: string, b: string): string {
  if (!a) return b;
  if (!b) return a;
  return a <= b ? a : b;
}

function maxDate(a: string, b: string): string {
  if (!a) return b;
  if (!b) return a;
  return a >= b ? a : b;
}

export function getEntriesForAccount(entries: GLEntry[], accountIdOrCode: string): GLEntry[] {
  return entries.filter((entry) => matchesAccount(entry, accountIdOrCode));
}

export function computeMonthlyTrend(entries: GLEntry[], accountIdOrCode: string): MonthlyNet[] {
  const monthMap = new Map<
    string,
    { debit: number; credit: number; transactionCount: number; firstDate: string; lastDate: string }
  >();

  for (const entry of getEntriesForAccount(entries, accountIdOrCode)) {
    const month = getEntryMonth(entry);
    const current = monthMap.get(month) ?? {
      debit: 0,
      credit: 0,
      transactionCount: 0,
      firstDate: entry.date,
      lastDate: entry.date,
    };

    current.debit += entry.debit;
    current.credit += entry.credit;
    current.transactionCount += 1;
    current.firstDate = minDate(current.firstDate, entry.date);
    current.lastDate = maxDate(current.lastDate, entry.date);
    monthMap.set(month, current);
  }

  return Array.from(monthMap.entries())
    .map(([month, group]) => ({
      month,
      debit: group.debit,
      credit: group.credit,
      net: group.debit - group.credit,
      transactionCount: group.transactionCount,
      firstDate: group.firstDate,
      lastDate: group.lastDate,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function computeRunningBalance(
  entries: GLEntry[],
  accountIdOrCode: string
): RunningBalancePoint[] {
  let runningBalance = 0;

  return computeMonthlyTrend(entries, accountIdOrCode).map((month) => {
    runningBalance += month.net;
    return {
      ...month,
      runningBalance,
    };
  });
}

export function getAccountSummary(entries: GLEntry[], accountIdOrCode: string): AccountSummary {
  const filtered = getEntriesForAccount(entries, accountIdOrCode);
  const monthly = computeMonthlyTrend(entries, accountIdOrCode);
  const totalDebit = filtered.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredit = filtered.reduce((sum, entry) => sum + entry.credit, 0);
  const dates = filtered
    .map((entry) => entry.date)
    .filter(Boolean)
    .sort();

  return {
    totalDebit,
    totalCredit,
    netChange: totalDebit - totalCredit,
    transactionCount: filtered.length,
    firstDate: dates[0] ?? null,
    lastDate: dates[dates.length - 1] ?? null,
    averageMonthlyNet: monthly.length > 0 ? (totalDebit - totalCredit) / monthly.length : 0,
  };
}
