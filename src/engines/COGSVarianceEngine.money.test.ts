/**
 * GAP-1 (F-0006) known-answer tests for COGSVarianceEngine's money migration.
 *
 * Standard-costing variances post to the GL, so each figure is settleable
 * money. Every case is a FIXED input -> EXACT expected decimal asserted with
 * `toBe` (Object.is); the pre-migration float literal is recorded inline where
 * it differed.
 */
import { describe, it, expect } from 'vitest';
import { COGSVarianceEngine } from './COGSVarianceEngine';
import type { GLEntry } from '@/types';

function entry(accountCode: string, amount: number, id: string): GLEntry {
  return {
    id,
    accountId: `acct-${accountCode}`,
    accountCode,
    accountName: `Account ${accountCode}`,
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 0,
    credit: 0,
    netChange: 0,
    date: '2026-01-31',
    amount,
    description: 'known-answer fixture',
    reference: id,
  };
}

describe('COGSVarianceEngine — money primitive known answers (GAP-1 / F-0006)', () => {
  describe('computePurchasePriceVariance', () => {
    it('computes PPV exactly (float gave 3.149999999999997)', () => {
      // (10.10 - 9.05) * 3 = 3.15
      expect(COGSVarianceEngine.computePurchasePriceVariance(10.1, 9.05, 3)).toBe(3.15);
    });

    it('returns a negative variance when the actual price exceeds standard', () => {
      // (9.05 - 10.10) * 3 = -3.15
      expect(COGSVarianceEngine.computePurchasePriceVariance(9.05, 10.1, 3)).toBe(-3.15);
    });

    it('returns zero when standard and actual prices match', () => {
      expect(COGSVarianceEngine.computePurchasePriceVariance(10.1, 10.1, 999)).toBe(0);
    });
  });

  describe('computeUsageVariance', () => {
    it('computes usage variance exactly at cent precision', () => {
      // (10.10 - 9.05) * 3 = 3.15
      expect(COGSVarianceEngine.computeUsageVariance(10.1, 9.05, 3)).toBe(3.15);
    });

    it('rounds a sub-cent product half-up', () => {
      // (1.005 - 0) * 1 = 1.005 -> 1.01
      expect(COGSVarianceEngine.computeUsageVariance(1.005, 0, 1)).toBe(1.01);
    });
  });

  describe('computeEfficiencyVariance', () => {
    it('computes efficiency variance exactly', () => {
      // (100.10 - 99.05) * 3 = 3.15
      expect(COGSVarianceEngine.computeEfficiencyVariance(99.05, 100.1, 3)).toBe(3.15);
    });
  });

  describe('computeVolumeVariance', () => {
    it('computes volume variance exactly', () => {
      // (10.10 - 9.05) * 3 = 3.15
      expect(COGSVarianceEngine.computeVolumeVariance(10.1, 9.05, 3)).toBe(3.15);
    });
  });

  describe('computeTotalCOGSVariance', () => {
    it('reconciles components that sum exactly to the total', () => {
      const result = COGSVarianceEngine.computeTotalCOGSVariance({
        standardCost: 1000.1,
        actualCost: 900.05,
        priceVariance: 50.02,
        usageVariance: 25.01,
        efficiencyVariance: 15.01,
        volumeVariance: 10.01,
      });
      // 1000.10 - 900.05 = 100.05; components sum to 100.05 exactly
      expect(result.totalVariance).toBe(100.05);
      expect(result.unexplained).toBe(0);
      expect(result.accountedFor).toBe(true);
    });

    it('reports the unexplained residual exactly when components fall short', () => {
      const result = COGSVarianceEngine.computeTotalCOGSVariance({
        standardCost: 1000.1,
        actualCost: 900.05,
        priceVariance: 50.02,
        usageVariance: 25.01,
        efficiencyVariance: 15.01,
        volumeVariance: 0,
      });
      // Float chain: 100.05000000000007 - 90.04 leaves a drifted residual
      expect(result.unexplained).toBe(10.01);
      expect(result.accountedFor).toBe(false);
    });

    it('does not report a spurious residual from float noise', () => {
      // Three 0.10 components against a 0.30 total. In floats
      // 0.1 + 0.1 + 0.1 === 0.30000000000000004, leaving a phantom residual.
      const result = COGSVarianceEngine.computeTotalCOGSVariance({
        standardCost: 0.3,
        actualCost: 0,
        priceVariance: 0.1,
        usageVariance: 0.1,
        efficiencyVariance: 0.1,
        volumeVariance: 0,
      });
      expect(result.unexplained).toBe(0);
      expect(result.accountedFor).toBe(true);
    });
  });

  describe('calculateGLVariances', () => {
    // The GL carries no standard-cost layer. The pre-remediation engine
    // invented one (standardCOGS = actual × 0.95, decomposed as an invented
    // −2% / −1.5% / +0.5% with volume as the balancing figure); these pins
    // lock the honest contract instead: null unless standards are POSTED.

    it('returns null variance outputs when no standard cost is posted', () => {
      const result = COGSVarianceEngine.calculateGLVariances([entry('5000', -1000.1, 'c1')]);
      expect(result.actualCOGS).toBe(1000.1);
      expect(result.standardCOGS).toBeNull();
      expect(result.variance).toBeNull();
      expect(result.totalVariance).toBeNull();
      expect(result.variancePercent).toBeNull();
      expect(result.breakdown).toBeNull();
    });

    it('sums many small COGS postings without drift even without standards', () => {
      const result = COGSVarianceEngine.calculateGLVariances([
        entry('5000', -0.1, 'c1'),
        entry('5000', -0.1, 'c2'),
        entry('5000', -0.1, 'c3'),
      ]);
      // Float: 0.1 + 0.1 + 0.1 === 0.30000000000000004
      expect(result.actualCOGS).toBe(0.3);
    });

    it('settles exactly against a posted standard cost', () => {
      const result = COGSVarianceEngine.calculateGLVariances([entry('5000', -1000.1, 'c1')], {
        standardCost: 950,
      });
      expect(result.actualCOGS).toBe(1000.1);
      expect(result.standardCOGS).toBe(950);
      // 950 − 1000.10 = −50.10
      expect(result.variance).toBe(-50.1);
      expect(result.totalVariance).toBe(result.variance);
      // −50.10 ÷ 950 × 100 = −5.2736842105263… → 10 places
      expect(result.variancePercent).toBe(-5.2736842105);
    });

    it('keeps the decomposition null until every component variance is posted', () => {
      const partial = COGSVarianceEngine.calculateGLVariances([entry('5000', -1000.1, 'c1')], {
        standardCost: 950,
        priceVariance: -20,
      });
      expect(partial.breakdown).toBeNull();
    });

    it('passes posted components through at cent precision once all four exist', () => {
      const full = COGSVarianceEngine.calculateGLVariances([entry('5000', -1000.1, 'c1')], {
        standardCost: 950,
        priceVariance: -20.004,
        usageVariance: -15.0015,
        efficiencyVariance: 5,
        volumeVariance: -20.0945,
      });
      expect(full.breakdown).not.toBeNull();
      const byName = Object.fromEntries(full.breakdown!.map((b) => [b.name, b.value]));
      // ROUND_HALF_UP at cents; no balancing figure is derived.
      expect(byName.Price).toBe(-20);
      expect(byName.Usage).toBe(-15);
      expect(byName.Efficiency).toBe(5);
      expect(byName.Volume).toBe(-20.09);
    });

    it('returns a null percent rather than a fake zero for a non-positive posted standard', () => {
      const result = COGSVarianceEngine.calculateGLVariances([entry('5000', -100.5, 'c1')], {
        standardCost: 0,
      });
      expect(result.standardCOGS).toBe(0);
      // 0 − 100.50 = −100.50
      expect(result.variance).toBe(-100.5);
      expect(result.variancePercent).toBeNull();
    });

    it('handles an empty ledger coherently with and without standards', () => {
      const unposted = COGSVarianceEngine.calculateGLVariances([]);
      expect(unposted.actualCOGS).toBe(0);
      expect(unposted.variancePercent).toBeNull();
      expect(Number.isFinite(unposted.actualCOGS)).toBe(true);

      const posted = COGSVarianceEngine.calculateGLVariances([], { standardCost: 500 });
      expect(posted.variance).toBe(500);
      expect(posted.variancePercent).toBe(100);
    });
  });
});
