/**
 * Profit & Loss derivation from General Ledger entries.
 *
 * Money-primitive P&L statement totals (GAP-1 F-0006): the account-class
 * sums accumulate via decimal.js (through `@/utils/money`) to keep a
 * balanced ledger on the cent; grossProfit/netIncome are subtractions;
 * grossMargin is a percentage computed via divideMoney so 1/3 * 100 lands
 * on 33.33 exactly.
 *
 * Classification and signs follow the Phase 2 contract
 * (`docs/product/STATEMENT_SIGN_CONTRACT.md`, implemented once in
 * `@/utils/accountClassification`): account-master type beats code prefix,
 * amounts are signed in each class's natural direction and never
 * absolutised, total expenses include the interest and tax classes (so net
 * income articulates with the balance sheet's current-period earnings),
 * and entries no class claims are counted and reported, never dropped.
 */
import { sumMoney, subtractMoney, divideMoney, roundTo } from '@/utils/money';
import {
  entriesForClass,
  signedClassAmount,
  type AccountClass,
} from '@/utils/accountClassification';
import type { AccountType } from '@/types';

export interface ProfitLossReport {
  totalRevenue: number;
  totalCOGS: number;
  totalExpenses: number;
  grossProfit: number;
  netIncome: number;
  grossMargin: number;
  netMargin: number;
  entryCount: number;
  /** Entries no statement class claimed (Phase 2 honesty: reported, never dropped). */
  unclassifiedCount: number;
  /** Debit-normal signed movement of those entries, so the gap can be explained. */
  unclassifiedMovement: number;
}

export function computeProfitLoss(
  entries: readonly {
    accountCode?: string;
    accountType?: AccountType | 'Unknown' | null;
    debit: number;
    credit: number;
    period?: string;
    date: string;
  }[],
  period?: string
): ProfitLossReport {
  const filtered = period
    ? entries.filter((e) => (e.period || e.date.slice(0, 7)) <= period)
    : entries;
  // Phase 2 sign contract (docs/product/STATEMENT_SIGN_CONTRACT.md):
  // classification resolves through the one canonical resolver (account type
  // beats code prefix), amounts are signed in each class's natural direction
  // and never absolutised, and total expenses include the interest and tax
  // classes so net income articulates with the balance sheet's
  // current-period earnings on the same ledger.
  const classTotal = (cls: AccountClass): number =>
    roundTo(sumMoney(entriesForClass(filtered, cls).map((e) => signedClassAmount(e, cls))), 2);
  const totalRevenue = classTotal('revenue');
  const totalCOGS = classTotal('cogs');
  const totalExpenses = roundTo(
    sumMoney([classTotal('opex'), classTotal('interest'), classTotal('tax')]),
    2
  );
  const unclassified = entriesForClass(filtered, 'unclassified');
  const unclassifiedMovement = roundTo(
    sumMoney(unclassified.map((e) => signedClassAmount(e, 'unclassified'))),
    2
  );
  const grossProfit = roundTo(subtractMoney(totalRevenue, totalCOGS), 2);
  const netIncome = roundTo(subtractMoney(grossProfit, totalExpenses), 2);
  const grossMargin =
    totalRevenue > 0
      ? roundTo(divideMoney(grossProfit, totalRevenue).times(100), 2)
      : 0;
  const netMargin =
    totalRevenue > 0 ? roundTo(divideMoney(netIncome, totalRevenue).times(100), 2) : 0;
  return {
    totalRevenue,
    totalCOGS,
    totalExpenses,
    grossProfit,
    netIncome,
    grossMargin,
    netMargin,
    entryCount: filtered.length,
    unclassifiedCount: unclassified.length,
    unclassifiedMovement,
  };
}
