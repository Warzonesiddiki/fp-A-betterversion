/**
 * GAP-1 (F-0006) known-answer tests for BondPricingEngine's money migration.
 *
 * Bond prices, accrued interest and dirty prices are money figures displayed
 * on BondPortfolioPage. Each case is a FIXED input -> EXACT expected decimal
 * asserted with `toBe` (Object.is); the pre-migration float literal is
 * recorded inline where it differed.
 */
import { describe, it, expect } from 'vitest';
import { BondPricingEngine } from './BondPricingEngine';

describe('BondPricingEngine — money known answers (GAP-1 / F-0006)', () => {
  it('prices a discount bond to exact cents (float gave 1077.2173492918482)', () => {
    expect(BondPricingEngine.price(1000, 0.06, 0.05, 10)).toBe(1077.22);
  });

  it('prices a premium bond to exact cents (float gave 922.7826507081518)', () => {
    expect(BondPricingEngine.price(1000, 0.04, 0.05, 10)).toBe(922.78);
  });

  it('prices a par bond at exactly 1000', () => {
    expect(BondPricingEngine.price(1000, 0.05, 0.05, 10)).toBe(1000);
  });

  it('handles zero YTM with exact coupon accumulation', () => {
    expect(BondPricingEngine.price(1000, 0.05, 0, 10)).toBe(1500);
  });

  it('rounds accrued interest to cents (float gave 4.166666666666666)', () => {
    expect(BondPricingEngine.accruedInterest(1000, 0.05, 30, 360)).toBe(4.17);
  });

  it('returns exact accrued interest for whole fractions', () => {
    expect(BondPricingEngine.accruedInterest(1000, 0.06, 120, 360)).toBe(20);
  });

  it('computes dirty price to exact cents (float gave 1004.1666666666666)', () => {
    expect(BondPricingEngine.dirtyPrice(1000, 1000, 0.05, 30, 360)).toBe(1004.17);
  });

  it('recovers YTM for a par bond', () => {
    expect(BondPricingEngine.yieldToMaturity(1000, 1000, 0.05, 10)).toBeCloseTo(0.05, 10);
  });

  it('returns finite duration metrics (money intermediates, metric outputs)', () => {
    const dur = BondPricingEngine.duration(1000, 0.05, 0.05, 10);
    expect(Number.isFinite(dur.macaulay)).toBe(true);
    expect(Number.isFinite(dur.modified)).toBe(true);
    expect(Number.isFinite(dur.convexity)).toBe(true);
    expect(dur.modified).toBeLessThanOrEqual(dur.macaulay);
    expect(dur.convexity).toBeGreaterThan(0);
  });
});
