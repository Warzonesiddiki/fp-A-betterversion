import { describe, it, expect } from 'vitest';
import { RealEstateEngine } from './RealEstateEngine';
import type { GLEntry } from '@/types';

const entries: GLEntry[] = [
  { id: '1', accountCode: '1501', amount: 12000000, entityId: 'P1' },
  { id: '2', accountCode: '1601', amount: 18500000, entityId: 'P1' },
  { id: '3', accountCode: '2501', amount: 7500000, entityId: 'P1' },
  { id: '4', accountCode: '4001', amount: 2400000, entityId: 'P1' },
  { id: '5', accountCode: '5001', amount: 920000, entityId: 'P1' },
];

describe('RealEstateEngine (money migration)', () => {
  it('calculatePortfolioStats returns exact cents', () => {
    const stats = RealEstateEngine.calculatePortfolioStats(entries);
    expect(stats.costBasis).toBe(12000000.00);
    expect(stats.marketValue).toBe(18500000.00);
    expect(stats.unrealizedGain).toBe(6500000.00);
    expect(stats.ltv).toBe(40.5405405405);
  });

  it('calculateREITStats returns exact cents on FFO/AFFO', () => {
    const stats = RealEstateEngine.calculateREITStats(entries);
    expect(stats.ffo).toBe(1480000.00);
    expect(stats.affo).toBe(1240000.00);
  });
});