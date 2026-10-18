import { describe, it, expect } from 'vitest';
import { diffBudgetVersions } from './diffBudgetVersions';
import type { BudgetLineItem } from '@/types';

/**
 * Phase 7 gate: budget version diff tests. Two versions of a plan are
 * compared cell-by-cell (account x month); every change is classified
 * and money deltas are exact.
 */

function line(id: string, accountCode: string, month: number, amount: number): BudgetLineItem {
  return {
    id,
    budgetId: 'bgt-x',
    accountId: `a-${accountCode}`,
    accountName: accountCode,
    accountCode,
    accountType: 'Revenue',
    periodId: 'fy27',
    month,
    amount,
    formula: null,
    isCalculated: false,
    isLocked: false,
    isReadOnly: false,
    notes: null,
  } as BudgetLineItem;
}

describe('diffBudgetVersions', () => {
  it('classifies changed, added, and removed cells with exact deltas', () => {
    const v1 = [line('1', '4010', 1, 1000), line('2', '5010', 1, 400), line('3', '6010', 2, 250)];
    const v2 = [line('9', '4010', 1, 1250), line('10', '5010', 1, 400), line('11', '7010', 3, 90)];
    const diff = diffBudgetVersions(v1, v2);
    expect(diff.changed).toEqual([
      { accountCode: '4010', month: 1, from: 1000, to: 1250, delta: 250 },
    ]);
    expect(diff.added).toEqual([{ accountCode: '7010', month: 3, amount: 90 }]);
    expect(diff.removed).toEqual([{ accountCode: '6010', month: 2, amount: 250 }]);
    expect(diff.unchangedCount).toBe(1);
    expect(diff.totalFrom).toBe(1650);
    expect(diff.totalTo).toBe(1740);
    expect(diff.totalDelta).toBe(90);
  });

  it('identical versions diff to nothing', () => {
    const v = [line('1', '4010', 1, 1000)];
    const diff = diffBudgetVersions(
      v,
      v.map((l) => ({ ...l, id: 'other' }))
    );
    expect(diff.changed).toEqual([]);
    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual([]);
    expect(diff.totalDelta).toBe(0);
  });

  it('floating point noise does not invent changes (money rounding)', () => {
    const v1 = [line('1', '4010', 1, 0.1 + 0.2)];
    const v2 = [line('2', '4010', 1, 0.3)];
    const diff = diffBudgetVersions(v1, v2);
    expect(diff.changed).toEqual([]);
    expect(diff.unchangedCount).toBe(1);
  });
});
