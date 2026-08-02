/**
 * GAP-1 (F-0006) known-answer tests for CreditRiskEngine's money migration.
 *
 * Expected loss and exposure at default are loan-loss PROVISIONS that post to
 * the P&L. Each case is a FIXED input -> EXACT expected decimal asserted with
 * `toBe` (Object.is); the pre-migration float literal is recorded inline where
 * it differed.
 */
import { describe, it, expect } from 'vitest';
import { CreditRiskEngine } from './CreditRiskEngine';

describe('CreditRiskEngine — money primitive known answers (GAP-1 / F-0006)', () => {
  describe('expectedLoss', () => {
    it('computes a provision exactly (float gave 9000.000000000002)', () => {
      // 2% PD x 45% LGD x 1,000,000 EAD = 9,000.00
      expect(CreditRiskEngine.expectedLoss(0.02, 0.45, 1_000_000)).toBe(9000);
    });

    it('does not accumulate drift on small rates', () => {
      // Float: 0.1 * 0.2 * 0.3 === 0.006000000000000001
      expect(CreditRiskEngine.expectedLoss(0.1, 0.2, 0.3)).toBe(0.01);
    });

    it('rounds a sub-cent provision half-up', () => {
      // 0.5 x 0.5 x 0.05 = 0.0125 -> 0.01 (banker-free ROUND_HALF_UP on 0.0125
      // at 2dp yields 0.01 because the digit dropped is 2|5 -> see money.ts)
      expect(CreditRiskEngine.expectedLoss(0.5, 0.5, 0.05)).toBe(0.01);
    });

    it('returns zero when any factor is zero', () => {
      expect(CreditRiskEngine.expectedLoss(0, 0.45, 1_000_000)).toBe(0);
      expect(CreditRiskEngine.expectedLoss(0.02, 0, 1_000_000)).toBe(0);
      expect(CreditRiskEngine.expectedLoss(0.02, 0.45, 0)).toBe(0);
    });
  });

  describe('exposureAtDefault', () => {
    it('adds the CCF-weighted undrawn commitment exactly', () => {
      // 500,000 drawn + (1,000,000 - 500,000) x 0.75 = 875,000
      expect(CreditRiskEngine.exposureAtDefault(1_000_000, 500_000, 0.75)).toBe(875_000);
    });

    it('computes a cent-level exposure exactly (float gave 175.17499999999998)', () => {
      // 100.10 + (200.20 - 100.10) x 0.75 = 175.175 -> 175.18 half-up
      expect(CreditRiskEngine.exposureAtDefault(200.2, 100.1, 0.75)).toBe(175.18);
    });

    it('equals the drawn amount when the facility is fully drawn', () => {
      expect(CreditRiskEngine.exposureAtDefault(100.1, 100.1, 0.75)).toBe(100.1);
    });

    it('equals the drawn amount when the CCF is zero', () => {
      expect(CreditRiskEngine.exposureAtDefault(1_000_000, 250_000.55, 0)).toBe(250_000.55);
    });

    it('equals the full commitment when the CCF is 1', () => {
      expect(CreditRiskEngine.exposureAtDefault(1_000_000.99, 250_000, 1)).toBe(1_000_000.99);
    });
  });

  describe('lossGivenDefault', () => {
    it('computes LGD from a partial recovery exactly', () => {
      // 1 - 60,000/100,000 = 0.4
      expect(CreditRiskEngine.lossGivenDefault(60_000, 100_000)).toBe(0.4);
    });

    it('computes a repeating LGD at fixed precision', () => {
      // 1 - 0.10/0.30 — float gave 0.6666666666666666
      expect(CreditRiskEngine.lossGivenDefault(0.1, 0.3)).toBe(0.6666666667);
    });

    it('returns 0 when collateral fully covers the exposure', () => {
      expect(CreditRiskEngine.lossGivenDefault(150_000, 100_000)).toBe(0);
      expect(CreditRiskEngine.lossGivenDefault(100_000, 100_000)).toBe(0);
    });

    it('returns 1 when there is no collateral', () => {
      expect(CreditRiskEngine.lossGivenDefault(0, 100_000)).toBe(1);
    });

    it('returns 0 for a non-positive exposure instead of dividing by zero', () => {
      expect(CreditRiskEngine.lossGivenDefault(50_000, 0)).toBe(0);
      expect(CreditRiskEngine.lossGivenDefault(50_000, -10)).toBe(0);
    });
  });

  describe('composition: EL = PD x LGD x EAD stays consistent end to end', () => {
    it('chains the three primitives without drift', () => {
      const ead = CreditRiskEngine.exposureAtDefault(1_000_000, 500_000, 0.75); // 875,000
      const lgd = CreditRiskEngine.lossGivenDefault(350_000, 875_000); // 0.6
      expect(ead).toBe(875_000);
      expect(lgd).toBe(0.6);
      // 0.02 x 0.6 x 875,000 = 10,500.00
      expect(CreditRiskEngine.expectedLoss(0.02, lgd, ead)).toBe(10_500);
    });
  });
});
