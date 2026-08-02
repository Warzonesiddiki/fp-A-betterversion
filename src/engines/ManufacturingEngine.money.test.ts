/**
 * GAP-1 (F-0006) known-answer tests for ManufacturingEngine's money migration.
 *
 * Manufacturing revenue, COGS, material/labor/overhead cost and gross margin
 * are money figures on the manufacturing dashboards. Each case is a FIXED
 * input -> EXACT expected decimal asserted with `toBe` (Object.is); the
 * pre-migration float literal is recorded inline where it differed.
 */
import { describe, it, expect } from 'vitest';
import { ManufacturingEngine } from './ManufacturingEngine';
import type { GLEntry } from '@/types';

function entry(accountCode: string, amount: number, id: string): GLEntry {
  return {
    id,
    accountId: `acct-${accountCode}`,
    accountCode,
    accountName: `Account ${accountCode}`,
    period: '2026-01',
    periodName: '2026-01',
    debit: amount,
    credit: 0,
    netChange: amount,
    date: '2026-01-15',
    amount,
    description: 'known-answer fixture',
    reference: id,
    entityId: 'entity-1',
    currency: 'USD',
  };
}

describe('ManufacturingEngine — money known answers (GAP-1 / F-0006)', () => {
  it('sums revenue exactly (float gave 0.30000000000000004)', () => {
    const stats = ManufacturingEngine.calculateStats([
      entry('4701', 0.1, 'r1'),
      entry('4702', 0.2, 'r2'),
    ]);
    expect(stats.revenue).toBe(0.3);
  });

  it('sums COGS exactly (float gave 0.6000000000000001)', () => {
    const stats = ManufacturingEngine.calculateStats([
      entry('6001', 0.1, 'c1'),
      entry('6002', 0.2, 'c2'),
      entry('6003', 0.3, 'c3'),
    ]);
    expect(stats.cogs).toBe(0.6);
  });

  it('falls back to material + labor + overhead for COGS exactly', () => {
    const stats = ManufacturingEngine.calculateStats([
      entry('5701', 0.1, 'm1'),
      entry('5801', 0.2, 'l1'),
      entry('5901', 0.3, 'o1'),
    ]);
    expect(stats.materialCost).toBe(0.1);
    expect(stats.laborCost).toBe(0.2);
    expect(stats.overheadCost).toBe(0.3);
    expect(stats.cogs).toBe(0.6);
  });

  it('computes gross margin from exact decimals (float gave 66.66666666666667)', () => {
    // revenue 0.3, cogs 0.1 -> (0.2 / 0.3) * 100 = 66.6666666667 at 10 places
    const stats = ManufacturingEngine.calculateStats([
      entry('4701', 0.3, 'r1'),
      entry('6001', 0.1, 'c1'),
    ]);
    expect(stats.grossMargin).toBe(66.6666666667);
  });

  it('returns zero margin for zero revenue', () => {
    const stats = ManufacturingEngine.calculateStats([entry('6001', 100, 'c1')]);
    expect(stats.revenue).toBe(0);
    expect(stats.grossMargin).toBe(0);
  });

  it('keeps whole-dollar known answers intact', () => {
    const stats = ManufacturingEngine.calculateStats([
      entry('4701', 800000, 'r1'),
      entry('4702', 900000, 'r2'),
      entry('6001', 220000, 'c1'),
      entry('6002', 160000, 'c2'),
      entry('6003', 110000, 'c3'),
    ]);
    expect(stats.revenue).toBe(1700000);
    expect(stats.cogs).toBe(490000);
    expect(stats.revenue - stats.cogs).toBe(1210000);
  });
});
