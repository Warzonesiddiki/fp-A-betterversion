import { addMoney, divideMoney, roundTo, subtractMoney, sumMoney, toDecimal } from '@/utils/money';
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
  // GL debit/credit amounts are currency: accumulate at full decimal
  // precision, cent-round once at the output boundary (F-0006).
  const monthMap = new Map<
    string,
    {
      debit: ReturnType<typeof addMoney>;
      credit: ReturnType<typeof addMoney>;
      transactionCount: number;
      firstDate: string;
      lastDate: string;
    }
  >();

  for (const entry of getEntriesForAccount(entries, accountIdOrCode)) {
    const month = getEntryMonth(entry);
    const current = monthMap.get(month) ?? {
      debit: toDecimal(0),
      credit: toDecimal(0),
      transactionCount: 0,
      firstDate: entry.date,
      lastDate: entry.date,
    };

    current.debit = addMoney(current.debit, entry.debit);
    current.credit = addMoney(current.credit, entry.credit);
    current.transactionCount += 1;
    current.firstDate = minDate(current.firstDate, entry.date);
    current.lastDate = maxDate(current.lastDate, entry.date);
    monthMap.set(month, current);
  }

  return Array.from(monthMap.entries())
    .map(([month, group]) => ({
      month,
      debit: roundTo(group.debit),
      credit: roundTo(group.credit),
      net: roundTo(subtractMoney(group.debit, group.credit)),
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
  let runningBalance = toDecimal(0);

  return computeMonthlyTrend(entries, accountIdOrCode).map((month) => {
    runningBalance = addMoney(runningBalance, month.net);
    return {
      ...month,
      runningBalance: roundTo(runningBalance),
    };
  });
}

export function getAccountSummary(entries: GLEntry[], accountIdOrCode: string): AccountSummary {
  const filtered = getEntriesForAccount(entries, accountIdOrCode);
  const monthly = computeMonthlyTrend(entries, accountIdOrCode);
  const totalDebitDec = sumMoney(filtered.map((entry) => entry.debit));
  const totalCreditDec = sumMoney(filtered.map((entry) => entry.credit));
  const totalDebit = roundTo(totalDebitDec);
  const totalCredit = roundTo(totalCreditDec);
  const netChangeDec = subtractMoney(totalDebitDec, totalCreditDec);
  const dates = filtered
    .map((entry) => entry.date)
    .filter(Boolean)
    .sort();

  return {
    totalDebit,
    totalCredit,
    netChange: roundTo(netChangeDec),
    transactionCount: filtered.length,
    firstDate: dates[0] ?? null,
    lastDate: dates[dates.length - 1] ?? null,
    averageMonthlyNet: monthly.length > 0 ? roundTo(divideMoney(netChangeDec, monthly.length)) : 0,
  };
}
