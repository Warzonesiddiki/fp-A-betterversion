/**
 * GAP-1 (F-0006) known-answer tests for SaaSMetricsEngine's money migration.
 *
 * MRR/ARR figures are reported revenue. Every case is a FIXED input -> EXACT
 * expected decimal asserted with `toBe` (Object.is); the pre-migration float
 * literal is recorded inline where it differed.
 *
 * The documented Infinity contract (zero churn => infinite LTV, zero S&M spend
 * => infinite magic number) is deliberately preserved and re-asserted here so
 * the migration cannot silently change it.
 */
import { describe, it, expect } from 'vitest';
import { SaaSMetricsEngine } from './SaaSMetricsEngine';

describe('SaaSMetricsEngine — money primitive known answers (GAP-1 / F-0006)', () => {
  describe('calculateARR', () => {
    it('annualises MRR exactly (float gave 1201.1999999999998)', () => {
      expect(SaaSMetricsEngine.calculateARR(100.1)).toBe(1201.2);
    });

    it('handles a zero MRR', () => {
      expect(SaaSMetricsEngine.calculateARR(0)).toBe(0);
    });
  });

  describe('calculateNRR', () => {
    it('computes net revenue retention from exact decimals', () => {
      // (1000.10 + 50.05 - 25.02 - 10.01) / 1000.10 * 100
      // float gave 101.5018498150185
      expect(SaaSMetricsEngine.calculateNRR(1000.1, 50.05, 25.02, 10.01)).toBe(101.501849815);
    });

    it('returns exactly 100% when expansion offsets churn', () => {
      // Float: 1000.10 + 10.01 - 0 - 10.01 === 1000.1000000000001 -> 100.00000000000009%
      expect(SaaSMetricsEngine.calculateNRR(1000.1, 10.01, 0, 10.01)).toBe(100);
    });

    it('returns 0 for a zero opening MRR', () => {
      expect(SaaSMetricsEngine.calculateNRR(0, 100, 0, 0)).toBe(0);
    });

    it('throws on a negative opening MRR rather than returning a wrong number', () => {
      expect(() => SaaSMetricsEngine.calculateNRR(-1, 0, 0, 0)).toThrow(
        'Opening MRR cannot be negative'
      );
    });
  });

  describe('calculateChurnRate', () => {
    it('computes a repeating churn rate at fixed precision', () => {
      // (1 / 3) * 100 — float gave 33.33333333333333
      expect(SaaSMetricsEngine.calculateChurnRate(1, 3)).toBe(33.3333333333);
    });

    it('preserves the documented Infinity contract for a zero starting base', () => {
      expect(SaaSMetricsEngine.calculateChurnRate(5, 0)).toBe(Infinity);
      expect(SaaSMetricsEngine.calculateChurnRate(0, 0)).toBe(0);
    });
  });

  describe('calculateLTVtoCAC', () => {
    it('computes the LTV:CAC ratio from exact decimals', () => {
      // (100.10 * 0.60) / 0.05 / 1000 — float gave 1.2011999999999998
      expect(SaaSMetricsEngine.calculateLTVtoCAC(100.1, 60, 5, 1000)).toBe(1.2012);
    });

    it('preserves the documented Infinity contract for zero churn and zero CAC', () => {
      expect(SaaSMetricsEngine.calculateLTVtoCAC(1000, 80, 0, 500)).toBe(Infinity);
      expect(SaaSMetricsEngine.calculateLTVtoCAC(1000, 80, 5, 0)).toBe(Infinity);
    });

    it('rejects an out-of-range gross margin', () => {
      expect(() => SaaSMetricsEngine.calculateLTVtoCAC(1000, 101, 5, 500)).toThrow(
        'Gross margin must be between 0 and 100'
      );
    });
  });

  describe('buildCohortTable', () => {
    it('computes average revenue per customer at cent precision', () => {
      const [row] = SaaSMetricsEngine.buildCohortTable([
        {
          period: '2026-01',
          openingMRR: 1000.1,
          newMRR: 0,
          expansionMRR: 0,
          contractionMRR: 0,
          churnMRR: 0,
          closingMRR: 1000.1,
          customerCount: 3,
        },
      ]);
      // 1000.10 / 3 = 333.3666... -> 333.37 at cent precision
      expect(row!.averageRevenuePerCustomer).toBe(333.37);
    });

    it('returns 0 revenue per customer rather than Infinity for an empty cohort', () => {
      const [row] = SaaSMetricsEngine.buildCohortTable([
        {
          period: '2026-01',
          openingMRR: 0,
          newMRR: 0,
          expansionMRR: 0,
          contractionMRR: 0,
          churnMRR: 0,
          closingMRR: 500,
          customerCount: 0,
        },
      ]);
      expect(row!.averageRevenuePerCustomer).toBe(0);
    });
  });

  describe('calculateMagicNumber', () => {
    it('computes the magic number from exact decimals', () => {
      // 1201.20 / 1000.10 — float gave 1.201079892010799
      expect(SaaSMetricsEngine.calculateMagicNumber(1201.2, 1000.1)).toBe(1.201079892);
    });

    it('preserves the documented Infinity contract for zero S&M spend', () => {
      expect(SaaSMetricsEngine.calculateMagicNumber(500000, 0)).toBe(Infinity);
      expect(SaaSMetricsEngine.calculateMagicNumber(0, 0)).toBe(0);
    });
  });

  describe('calculateQuickRatio', () => {
    it('computes the quick ratio from exact decimals', () => {
      // (10.10 + 20.20) / (5.05 + 5.05) = 3
      expect(SaaSMetricsEngine.calculateQuickRatio(10.1, 20.2, 5.05, 5.05)).toBe(3);
    });

    it('preserves the documented Infinity contract for zero churn', () => {
      expect(SaaSMetricsEngine.calculateQuickRatio(1000, 500, 0, 0)).toBe(Infinity);
      expect(SaaSMetricsEngine.calculateQuickRatio(0, 0, 0, 0)).toBe(0);
    });

    it('rejects negative churn inputs rather than returning a wrong ratio', () => {
      expect(() => SaaSMetricsEngine.calculateQuickRatio(100, 0, -1, 0)).toThrow(
        'Churn/Contraction MRR cannot be negative'
      );
    });
  });
});
