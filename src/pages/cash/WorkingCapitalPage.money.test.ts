/**
 * GAP-1 (F-0006) known-answer tests for WorkingCapitalPage totals.
 */

import { describe, expect, it } from 'vitest';
import { computeWorkingCapital, type WCEntry } from './WorkingCapitalPage';

// helper: net entry where net = debit - credit; convenience for 1-sided
function net(code: string, net: number): WCEntry {
  // encode net as debit if positive, credit if negative
  return net >= 0
    ? { accountCode: code, debit: net, credit: 0 }
    : { accountCode: code, debit: 0, credit: -net };
}

describe('WorkingCapitalPage totals — money known answers (GAP-1)', () => {
  it('empty entries → zeros and empty components (control)', () => {
    const s = computeWorkingCapital([]);
    expect(s.assets).toBe(0);
    expect(s.liabilities).toBe(0);
    expect(s.wc).toBe(0);
    expect(s.currentRatio).toBe(0);
    expect(s.quickRatio).toBe(0);
    expect(s.revenue).toBe(0);
    expect(s.cogs).toBe(0);
    expect(s.components).toHaveLength(7);
  });

  it('three 0.1 CA entries / one 0.3 CL net balance exactly (old: 0.30000000000000004)', () => {
    const s = computeWorkingCapital([
      net('110', 0.1),
      net('110', 0.1),
      net('110', 0.1),
      net('210', -0.3), // credit-balance: liability = 0.3
    ]);
    expect(s.assets).toBe(0.3);
    expect(s.liabilities).toBe(0.3);
    expect(s.wc).toBe(0);
    expect(s.currentRatio).toBe(1);
    expect(s.quickRatio).toBe(0.7);
  });

  it('assets 1000 / liab 500 → wc 500, ratios 2.0 and 1.4 exactly', () => {
    const s = computeWorkingCapital([net('110', 1000), net('210', -500)]);
    expect(s.assets).toBe(1000);
    expect(s.liabilities).toBe(500);
    expect(s.wc).toBe(500);
    expect(s.currentRatio).toBe(2);
    expect(s.quickRatio).toBe(1.4);
  });

  it('three 0.335 CA entries → assets 1.01 half-up (old: 1.00)', () => {
    const s = computeWorkingCapital([net('110', 0.335), net('110', 0.335), net('110', 0.335)]);
    expect(s.assets).toBe(1.01);
  });

  it('component allocations sum back to assets/liabilities to the cent', () => {
    const s = computeWorkingCapital([
      net('110', 500.1),
      net('120', 500.2), // assets = 1000.30
      net('210', -400.1),
      net('210', -199.9), // liabilities = 600.00
      net('400', 5000), // revenue
      net('500', -3000), // COGS
    ]);
    expect(s.assets).toBe(1000.3);
    expect(s.liabilities).toBe(600);
    expect(s.wc).toBe(400.3);
    expect(s.revenue).toBe(5000);
    expect(s.cogs).toBe(3000);
    const caSum = s.components
      .filter((c) => c.ratio === 'Current Asset')
      .reduce((a, c) => a + c.amount, 0);
    const clSum = s.components
      .filter((c) => c.ratio === 'Current Liability')
      .reduce((a, c) => a + c.amount, 0);
    expect(caSum).toBeCloseTo(s.assets, 10);
    expect(clSum).toBeCloseTo(s.liabilities, 10);
  });
});
