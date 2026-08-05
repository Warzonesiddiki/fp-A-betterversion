/**
 * GAP-1 (F-0006) known-answer tests for VarianceDashboardPage money patterns.
 *
 * Verifies computeCategoryActual and computeCategoryBudget calculate
 * actual vs budget category subtotals using exact money primitives.
 */

import { describe, expect, it } from 'vitest';
import {
  computeCategoryActual,
  computeCategoryBudget,
} from '@/pages/variance/VarianceDashboardPage';
import type { GLEntry } from '@/types';

function makeEntry(code: string, debit: number, credit: number): GLEntry {
  return {
    id: `entry-${code}-${debit}-${credit}`,
    accountCode: code,
    accountName: `Account ${code}`,
    debit,
    credit,
    netChange: debit - credit,
  } as GLEntry;
}

describe('VarianceDashboardPage money patterns — known answers (GAP-1)', () => {
  it('computeCategoryActual returns 0 for empty entries', () => {
    expect(computeCategoryActual([], ['4'], 1)).toBe(0);
  });

  it('computeCategoryActual calculates revenue (credit - debit) with sign=1', () => {
    const entries = [makeEntry('4000', 0, 10000), makeEntry('4100', 500, 2500)];
    expect(computeCategoryActual(entries, ['4'], 1)).toBe(12000);
  });

  it('computeCategoryActual calculates costs (debit - credit) with sign=-1', () => {
    const entries = [makeEntry('5000', 4000, 0), makeEntry('5100', 1000, 200)];
    expect(computeCategoryActual(entries, ['5'], -1)).toBe(4800);
  });

  it('computeCategoryBudget returns 0 for empty line items', () => {
    expect(computeCategoryBudget([], ['4'])).toBe(0);
  });

  it('computeCategoryBudget sums matching line items accurately', () => {
    const items = [
      { accountCode: '4000', amount: 50000 },
      { accountCode: '4100', amount: 25000 },
    ];
    expect(computeCategoryBudget(items, ['4'])).toBe(75000);
  });

  it('computeCategoryActual filters accounts by matching prefixes', () => {
    const entries = [
      makeEntry('4000', 0, 1000),
      makeEntry('5000', 400, 0),
      makeEntry('6000', 200, 0),
    ];
    expect(computeCategoryActual(entries, ['5'], -1)).toBe(400);
  });

  it('computeCategoryBudget filters line items by matching prefixes', () => {
    const items = [
      { accountCode: '4000', amount: 10000 },
      { accountCode: '5000', amount: 4000 },
      { accountCode: '6000', amount: 2000 },
    ];
    expect(computeCategoryBudget(items, ['6', '7'])).toBe(2000);
  });

  it('avoids IEEE-754 precision drift on actual and budget sums', () => {
    const entries = [makeEntry('4000', 0, 0.1), makeEntry('4100', 0, 0.2)];
    const items = [
      { accountCode: '4000', amount: 0.1 },
      { accountCode: '4100', amount: 0.2 },
    ];
    expect(computeCategoryActual(entries, ['4'], 1)).toBe(0.3);
    expect(computeCategoryBudget(items, ['4'])).toBe(0.3);
  });
});
