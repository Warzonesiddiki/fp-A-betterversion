import { describe, it, expect } from 'vitest';
import { SaaSMetricsEngine, type MRRData } from './SaaSMetricsEngine';

describe('SaaSMetricsEngine', () => {
  describe('calculateARR', () => {
    it('should convert monthly MRR to ARR', () => {
      expect(SaaSMetricsEngine.calculateARR(50000)).toBe(600000);
    });

    it('should handle zero MRR', () => {
      expect(SaaSMetricsEngine.calculateARR(0)).toBe(0);
    });
  });

  describe('calculateNRR', () => {
    it('should calculate net revenue retention', () => {
      const nrr = SaaSMetricsEngine.calculateNRR(100000, 10000, 5000, 3000);
      expect(nrr).toBeCloseTo(102, 0);
    });

    it('should return 0 for zero opening MRR', () => {
      expect(SaaSMetricsEngine.calculateNRR(0, 1000, 500, 200)).toBe(0);
    });

    it('should throw for negative opening MRR', () => {
      expect(() => SaaSMetricsEngine.calculateNRR(-100, 0, 0, 0)).toThrow(
        'Opening MRR cannot be negative'
      );
    });

    it('should handle negative NRR', () => {
      const nrr = SaaSMetricsEngine.calculateNRR(100000, 0, 0, 120000);
      expect(nrr).toBeLessThan(0);
    });
  });

  describe('calculateChurnRate', () => {
    it('should calculate churn rate percentage', () => {
      expect(SaaSMetricsEngine.calculateChurnRate(5, 100)).toBe(5);
    });

    it('should return 0 for zero total customers and zero lost', () => {
      expect(SaaSMetricsEngine.calculateChurnRate(0, 0)).toBe(0);
    });

    it('should return Infinity for zero total customers and >0 lost', () => {
      expect(SaaSMetricsEngine.calculateChurnRate(5, 0)).toBe(Infinity);
    });

    it('should throw for negative total customers', () => {
      expect(() => SaaSMetricsEngine.calculateChurnRate(5, -1)).toThrow(
        'Total customers at start cannot be negative'
      );
    });
  });

  describe('calculateLTVtoCAC', () => {
    it('should calculate LTV:CAC ratio', () => {
      const ratio = SaaSMetricsEngine.calculateLTVtoCAC(1000, 80, 5, 500);
      expect(ratio).toBe(32);
    });

    it('should return Infinity for zero churn (infinite LTV)', () => {
      expect(SaaSMetricsEngine.calculateLTVtoCAC(1000, 80, 0, 500)).toBe(Infinity);
    });

    it('should return Infinity for zero CAC and >0 revenue', () => {
      expect(SaaSMetricsEngine.calculateLTVtoCAC(1000, 80, 5, 0)).toBe(Infinity);
    });

    it('should throw for negative CAC', () => {
      expect(() => SaaSMetricsEngine.calculateLTVtoCAC(1000, 80, 5, -100)).toThrow(
        'CAC cannot be negative'
      );
    });

    it('should throw for invalid gross margin', () => {
      expect(() => SaaSMetricsEngine.calculateLTVtoCAC(1000, 110, 5, 500)).toThrow(
        'Gross margin must be between 0 and 100'
      );
    });
  });

  describe('buildCohortTable', () => {
    it('should build cohort table from MRR data', () => {
      const data: MRRData[] = [
        {
          period: '2024-Q1',
          openingMRR: 100000,
          newMRR: 5000,
          expansionMRR: 2000,
          contractionMRR: 1000,
          churnMRR: 2000,
          closingMRR: 104000,
          customerCount: 50,
        },
      ];
      const result = SaaSMetricsEngine.buildCohortTable(data);
      expect(result).toHaveLength(1);
      expect(result[0].averageRevenuePerCustomer).toBe(2080);
    });

    it('should handle empty data', () => {
      expect(SaaSMetricsEngine.buildCohortTable([])).toEqual([]);
    });
  });

  describe('calculateMagicNumber', () => {
    it('should calculate magic number', () => {
      expect(SaaSMetricsEngine.calculateMagicNumber(500000, 250000)).toBe(2);
    });

    it('should return Infinity for zero S&M spend and positive net new ARR', () => {
      expect(SaaSMetricsEngine.calculateMagicNumber(500000, 0)).toBe(Infinity);
    });

    it('should throw for negative S&M spend', () => {
      expect(() => SaaSMetricsEngine.calculateMagicNumber(500000, -1)).toThrow(
        'Sales and Marketing spend cannot be negative'
      );
    });
  });

  describe('calculateQuickRatio', () => {
    it('should calculate quick ratio', () => {
      expect(SaaSMetricsEngine.calculateQuickRatio(5000, 2000, 1000, 500)).toBeCloseTo(4.67, 1);
    });

    it('should return Infinity when no contraction or churn but has growth', () => {
      expect(SaaSMetricsEngine.calculateQuickRatio(1000, 500, 0, 0)).toBe(Infinity);
    });

    it('should handle all zeros', () => {
      expect(SaaSMetricsEngine.calculateQuickRatio(0, 0, 0, 0)).toBe(0);
    });
  });
});
