/**
 * GL account aggregation for the ESG sector overview.
 * Exact decimal sums through @/utils/money primitives only.
 */
import type { GLEntry } from '@/types';
import { addMoney, roundTo } from '@/utils/money';

export interface AccountBreakdownRow {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  netChange: number;
  transactions: number;
}

export function aggregateAccounts(entries: readonly GLEntry[]): AccountBreakdownRow[] {
  const accountMap = new Map<
    string,
    { name: string; debit: number; credit: number; net: number; count: number }
  >();
  for (const e of entries) {
    const existing = accountMap.get(e.accountCode) ?? {
      name: e.accountName,
      debit: 0,
      credit: 0,
      net: 0,
      count: 0,
    };
    existing.debit = addMoney(existing.debit, e.debit ?? 0).toNumber();
    existing.credit = addMoney(existing.credit, e.credit ?? 0).toNumber();
    existing.net = addMoney(existing.net, e.netChange ?? 0).toNumber();
    existing.count += 1;
    accountMap.set(e.accountCode, existing);
  }
  return Array.from(accountMap.entries())
    .map(([code, data]) => ({
      accountCode: code,
      accountName: data.name,
      debit: roundTo(data.debit, 2),
      credit: roundTo(data.credit, 2),
      netChange: roundTo(data.net, 2),
      transactions: data.count,
    }))
    .sort((a, b) => Math.abs(b.credit) - Math.abs(a.credit));
}
