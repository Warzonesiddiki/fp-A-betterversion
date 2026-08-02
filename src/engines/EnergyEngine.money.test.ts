/**
 * GAP-1 (F-0006) known-answer tests for EnergyEngine's money migration.
 *
 * Energy revenue, operating cost and net income are money figures on the
 * energy dashboards. productionVolume (MWh proxy), avgMarketPrice ($/MWh) and
 * carbonIntensity are unit/metric values, not currency. Each case is a FIXED
 * input -> EXACT expected decimal asserted with `toBe` (Object.is); the
 * pre-migration float literal is recorded inline where it differed.
 */
import { describe, it, expect } from 'vitest';
import { EnergyEngine } from './EnergyEngine';
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

describe('EnergyEngine — money known answers (GAP-1 / F-0006)', () => {
  it('sums revenue exactly (float gave 0.30000000000000004)', () => {
    const stats = EnergyEngine.calculateStats([entry('4310', 0.1, 'r1'), entry('4310', 0.2, 'r2')]);
    expect(stats.totalRevenue).toBe(0.3);
  });

  it('sums operating cost exactly (float gave 0.30000000000000004)', () => {
    const stats = EnergyEngine.calculateStats([entry('5410', 0.1, 'c1'), entry('5420', 0.2, 'c2')]);
    expect(stats.operatingCost).toBe(0.3);
  });

  it('computes net income exactly (float gave 0.19999999999999998)', () => {
    const stats = EnergyEngine.calculateStats([entry('4310', 0.3, 'r1'), entry('5410', 0.1, 'c1')]);
    expect(stats.netIncome).toBe(0.2);
  });

  it('computes the market price from exact decimals (float gave 170.00005000000002)', () => {
    // productionVolume = round(340000.1 / 170) = 2000; price = 340000.1 / 2000
    const stats = EnergyEngine.calculateStats([entry('4310', 340000.1, 'r1')]);
    expect(stats.productionVolume).toBe(2000);
    expect(stats.avgMarketPrice).toBe(170.00005);
  });

  it('returns zero volume and price for zero revenue', () => {
    const stats = EnergyEngine.calculateStats([]);
    expect(stats.totalRevenue).toBe(0);
    expect(stats.operatingCost).toBe(0);
    expect(stats.productionVolume).toBe(0);
    expect(stats.avgMarketPrice).toBe(0);
    expect(stats.netIncome).toBe(0);
  });

  it('converts source production to MWh proxies exactly', () => {
    const sources = EnergyEngine.getProductionBySource([
      entry('4310', 50000, 's1'),
      entry('4320', 30000, 'w1'),
    ]);
    expect(sources.find((s) => s.name === 'Solar')?.value).toBe(5);
    expect(sources.find((s) => s.name === 'Wind')?.value).toBe(3);
  });
});
