import { toDecimal, subtractMoney, roundTo } from '@/utils/money';
import type { BudgetLineItem } from '@/types';

/**
 * Phase 7 — budget version diff.
 *
 * Compares two versions of a plan cell-by-cell, keyed by
 * (accountCode, month) — the cell identity a planner recognises, not
 * the row id, which changes on every duplicate/regeneration. Amounts
 * are compared as money (cent-rounded), so float noise never invents
 * a change. Totals are exact decimal sums, not float accumulations.
 */

export interface ChangedCell {
  accountCode: string;
  month: number;
  from: number;
  to: number;
  delta: number;
}

export interface CellRef {
  accountCode: string;
  month: number;
  amount: number;
}

export interface BudgetVersionDiff {
  changed: ChangedCell[];
  added: CellRef[];
  removed: CellRef[];
  unchangedCount: number;
  totalFrom: number;
  totalTo: number;
  totalDelta: number;
}

function keyOf(item: BudgetLineItem): string {
  return `${item.accountCode}|${item.month}`;
}

function sumAmounts(items: readonly BudgetLineItem[]) {
  return items.reduce((acc, i) => acc.plus(toDecimal(i.amount)), toDecimal(0));
}

export function diffBudgetVersions(
  from: readonly BudgetLineItem[],
  to: readonly BudgetLineItem[]
): BudgetVersionDiff {
  const fromMap = new Map(from.map((i) => [keyOf(i), i]));
  const toMap = new Map(to.map((i) => [keyOf(i), i]));

  const changed: ChangedCell[] = [];
  const added: CellRef[] = [];
  const removed: CellRef[] = [];
  let unchangedCount = 0;

  for (const [key, toItem] of toMap) {
    const fromItem = fromMap.get(key);
    if (!fromItem) {
      added.push({
        accountCode: toItem.accountCode,
        month: toItem.month,
        amount: roundTo(toItem.amount, 2),
      });
      continue;
    }
    // Compare at cent precision: 0.1 + 0.2 vs 0.3 is float noise, not a change.
    const delta = subtractMoney(roundTo(toItem.amount, 2), roundTo(fromItem.amount, 2));
    if (delta.isZero()) {
      unchangedCount += 1;
    } else {
      changed.push({
        accountCode: toItem.accountCode,
        month: toItem.month,
        from: roundTo(fromItem.amount, 2),
        to: roundTo(toItem.amount, 2),
        delta: roundTo(delta, 2),
      });
    }
  }
  for (const [key, fromItem] of fromMap) {
    if (!toMap.has(key)) {
      removed.push({
        accountCode: fromItem.accountCode,
        month: fromItem.month,
        amount: roundTo(fromItem.amount, 2),
      });
    }
  }

  const byCell = (a: CellRef, b: CellRef) =>
    a.accountCode.localeCompare(b.accountCode) || a.month - b.month;
  changed.sort(byCell);
  added.sort(byCell);
  removed.sort(byCell);

  const totalFrom = sumAmounts(from);
  const totalTo = sumAmounts(to);
  return {
    changed,
    added,
    removed,
    unchangedCount,
    totalFrom: roundTo(totalFrom, 2),
    totalTo: roundTo(totalTo, 2),
    totalDelta: roundTo(totalTo.minus(totalFrom), 2),
  };
}
