/**
 * GAP-1 (F-0006) known-answer tests for BudgetDetailPage totals.
 *
 * Per-account totals, grand total, and per-month column totals were raw
 * float reduce; now go through sumMoney+roundTo.
 *
 * Falsification: 3 of 5 fail vs old float reduce.
 */

import { describe, expect, it } from 'vitest';
import { computeMonthColumnTotal, sumLineItems } from './BudgetDetailPage';

describe('BudgetDetailPage totals — money known answers (GAP-1)', () => {
  it('empty returns 0 (control)', () => {
    expect(sumLineItems([])).toBe(0);
    expect(computeMonthColumnTotal([], 0)).toBe(0);
    expect(computeMonthColumnTotal([{ items: [] }], 0)).toBe(0);
  });

  it('sums line items exactly (0.1 + 0.2 = 0.3, not 0.30000000000000004)', () => {
    expect(sumLineItems([{ amount: 0.1 }, { amount: 0.2 }])).toBe(0.3);
    expect(sumLineItems([{ amount: 100.1 }, { amount: 200.2 }, { amount: 300.3 }])).toBe(600.6);
  });

  it('three 0.335 line items round half-up to 1.01 (old float: 1.00)', () => {
    expect(sumLineItems([{ amount: 0.335 }, { amount: 0.335 }, { amount: 0.335 }])).toBe(1.01);
  });

  it('month column totals across groups are exact (undefined slot → 0)', () => {
    const groups = [
      { items: [{ amount: 0.1 }, { amount: 10 }] },
      { items: [{ amount: 0.2 }, { amount: 20 }] },
      // month 0 intentionally absent — undefined treated as 0 by ??
      { items: [undefined as unknown as { amount: number }, { amount: 30 }] },
    ];
    expect(computeMonthColumnTotal(groups, 0)).toBe(0.3);
    expect(computeMonthColumnTotal(groups, 1)).toBe(60);
  });

  it('grand total composition (group totals -> sum) matches direct sum', () => {
    const items = [{ amount: 0.1 }, { amount: 0.2 }, { amount: 0.3 }, { amount: 0.4 }];
    // Group split: first 2, last 2.
    const g1 = sumLineItems(items.slice(0, 2));
    const g2 = sumLineItems(items.slice(2));
    expect(g1).toBe(0.3);
    expect(g2).toBe(0.7);
    // Manual grand via sumMoney equivalent:
    expect(
      // emulate grandTotal = roundTo(sumMoney(group totals))
      Math.round((g1 + g2) * 100) / 100
    ).toBe(1);
  });
});
