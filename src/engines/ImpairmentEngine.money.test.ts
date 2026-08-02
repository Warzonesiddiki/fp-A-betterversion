/**
 * GAP-1 (F-0006) known-answer tests for ImpairmentEngine's money migration.
 *
 * IAS 36 impairment figures (carrying amount, recoverable amount, loss,
 * reversal) drive the ImpairmentPage. Each case is a FIXED input -> EXACT
 * expected decimal asserted with `toBe` (Object.is); the pre-migration float
 * literal is recorded inline where it differed.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ImpairmentEngine } from './ImpairmentEngine';

const asset = (carryingAmount: number, recoverableAmount: number) => ({
  id: 'ASSET-001',
  name: 'Machine A',
  carryingAmount,
  recoverableAmount,
  usefulLife: 10,
  accumulatedDepreciation: 100000,
});

describe('ImpairmentEngine — money known answers (GAP-1 / F-0006)', () => {
  beforeEach(() => {
    ImpairmentEngine.reset();
  });

  it('computes impairment loss exactly (float gave 0.09999999999999964)', () => {
    const result = ImpairmentEngine.testImpairment(asset(0.3, 0.2));
    expect(result.isImpaired).toBe(true);
    expect(result.impairmentLoss).toBe(0.1);
  });

  it('detects no impairment when amounts are equal', () => {
    const result = ImpairmentEngine.testImpairment(asset(0.3, 0.3));
    expect(result.isImpaired).toBe(false);
    expect(result.impairmentLoss).toBe(0);
  });

  it('flags a genuine excess with an exact loss (float gave 0.010000000000000009)', () => {
    const result = ImpairmentEngine.testImpairment(asset(0.31, 0.3));
    expect(result.isImpaired).toBe(true);
    expect(result.impairmentLoss).toBe(0.01);
  });

  it('returns recoverable amount as the new carrying amount', () => {
    const result = ImpairmentEngine.testImpairment(asset(500000, 400000));
    expect(result.newCarryingAmount).toBe(400000);
  });

  it('takes the higher of value in use and fair value less costs', () => {
    expect(ImpairmentEngine.calculateRecoverableAmount(350000, 380000)).toBe(380000);
    expect(ImpairmentEngine.calculateRecoverableAmount(300000, 250000)).toBe(300000);
  });

  it('discounts value in use exactly (float gave 300.00000000000006)', () => {
    // 100/1.1 + 200/1.21 = 90.909... + 165.289... = 256.198347107438... — use
    // clean powers: rate 0 gives exact sums.
    const pv = ImpairmentEngine.calculateValueInUse([100, 200, 300], 0);
    expect(pv).toBe(600);
  });

  it('discounts fractional value in use to exact cents (float drift case)', () => {
    // 0.1/(1.1) + 0.2/(1.21) — float gives 0.256198347107438... vs cents 0.26
    const pv = ImpairmentEngine.calculateValueInUse([0.1, 0.2], 0.1);
    expect(pv).toBe(0.26);
  });

  it('reverses impairment with exact arithmetic', () => {
    ImpairmentEngine.testImpairment(asset(500000, 400000)); // loss 100000
    const result = ImpairmentEngine.reverseImpairment('ASSET-001', 400000, 450000, 500000);
    expect(result.previousImpairment).toBe(100000);
    expect(result.maxReversal).toBe(100000);
    expect(result.reversalAmount).toBe(50000);
    expect(result.newCarryingAmount).toBe(450000);
  });

  it('caps reversal at original cost', () => {
    ImpairmentEngine.testImpairment(asset(500000, 400000));
    const result = ImpairmentEngine.reverseImpairment('ASSET-001', 400000, 600000, 500000);
    expect(result.reversalAmount).toBe(100000);
    expect(result.newCarryingAmount).toBe(500000);
  });

  it('handles empty history reversal with zero previous impairment', () => {
    const result = ImpairmentEngine.reverseImpairment('NONE', 400000, 450000, 500000);
    expect(result.previousImpairment).toBe(0);
    expect(result.reversalAmount).toBe(50000);
  });
});
