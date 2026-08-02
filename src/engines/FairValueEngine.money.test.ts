/**
 * GAP-1 (F-0006) known-answer tests for FairValueEngine's money migration.
 *
 * Fair-value measurements, hierarchy totals and DCF valuations (ASC 820 /
 * IFRS 13) drive the FairValuePage. Each case is a FIXED input -> EXACT
 * expected decimal asserted with `toBe` (Object.is); the pre-migration float
 * literal is recorded inline where it differed.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { FairValueEngine } from './FairValueEngine';

describe('FairValueEngine — money known answers (GAP-1 / F-0006)', () => {
  beforeEach(() => {
    FairValueEngine.reset();
  });

  it('sums hierarchy totals exactly (float gave 0.30000000000000004)', () => {
    FairValueEngine.measure({
      assetId: 'asset1',
      assetName: 'Test',
      value: 0.1,
      level: 1,
      approach: 'market',
      inputs: {},
      confidence: 0.9,
      date: '2026-01-01',
    });
    FairValueEngine.measure({
      assetId: 'asset1',
      assetName: 'Test',
      value: 0.2,
      level: 1,
      approach: 'market',
      inputs: {},
      confidence: 0.9,
      date: '2026-01-01',
    });
    expect(FairValueEngine.getHierarchy('asset1').total).toBe(0.3);
  });

  it('computes DCF with a zero discount rate as the exact cash flow sum', () => {
    expect(FairValueEngine.calculateDCF([100, 200, 300], 0)).toBe(600);
  });

  it('discounts fractional cash flows to exact cents (float gave 0.256198347107438...)', () => {
    // 0.1/1.1 + 0.2/1.21 rounds to cents
    expect(FairValueEngine.calculateDCF([0.1, 0.2], 0.1)).toBe(0.26);
  });

  it('adds a terminal value in exact decimals (float gave 3798.11097992916)', () => {
    const dcf = FairValueEngine.calculateDCF([100, 200, 300], 0.1, 0.03);
    expect(dcf).toBe(3798.11);
  });

  it('throws loudly instead of returning Infinity when r equals g', () => {
    // Old float: (lastCF * (1+g)) / (r - g) = division by zero -> Infinity.
    expect(() => FairValueEngine.calculateDCF([100], 0.03, 0.03)).toThrow();
  });
});
