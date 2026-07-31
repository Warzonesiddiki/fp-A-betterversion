/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { DepreciationEngine } from './DepreciationEngine';

describe('DepreciationEngine', () => {
  describe('straightLine', () => {
    it('calculates straight-line depreciation', () => {
      const result = DepreciationEngine.straightLine(10000, 1000, 5);
      expect(result).toBeCloseTo(1800, 0);
    });

    it('handles zero salvage', () => {
      const result = DepreciationEngine.straightLine(10000, 0, 10);
      expect(result).toBeCloseTo(1000, 0);
    });
  });

  describe('macrs', () => {
    it('calculates MACRS depreciation for year 1', () => {
      const result = DepreciationEngine.macrs(10000, 5, 1);
      expect(result).toBeGreaterThan(0);
    });

    it('calculates MACRS depreciation for year 2', () => {
      const result = DepreciationEngine.macrs(10000, 5, 2);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('unitsOfProduction', () => {
    it('calculates units of production depreciation', () => {
      const result = DepreciationEngine.unitsOfProduction(10000, 1000, 100000, 25000);
      expect(result).toBeCloseTo(2250, 0);
    });
  });

  describe('sumOfYearsDigits', () => {
    it('calculates sum of years digits depreciation', () => {
      const result = DepreciationEngine.sumOfYearsDigits(10000, 1000, 5, 1);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('impairmentTest', () => {
    it('detects impairment when carrying > recoverable', () => {
      const result = DepreciationEngine.impairmentTest(100000, 80000);
      expect(result.isImpaired).toBe(true);
      expect(result.impairmentLoss).toBe(20000);
    });

    it('detects no impairment when carrying < recoverable', () => {
      const result = DepreciationEngine.impairmentTest(80000, 100000);
      expect(result.isImpaired).toBe(false);
      expect(result.impairmentLoss).toBe(0);
    });
  });

  describe('assetDisposal', () => {
    it('calculates gain on disposal', () => {
      const result = DepreciationEngine.assetDisposal(100000, 60000, 50000);
      expect(result.gainLoss).toBe(10000);
      expect(result.isGain).toBe(true);
    });

    it('calculates loss on disposal', () => {
      const result = DepreciationEngine.assetDisposal(100000, 60000, 30000);
      expect(result.gainLoss).toBe(-10000);
      expect(result.isGain).toBe(false);
    });
  });

  describe('depreciation sum-preservation (Omega §1 invariants DEP-1/DEP-2)', () => {
    it('straight-line schedule depreciates exactly cost-salvage and lands on salvage', () => {
      // cost=1000, salvage=0, life=3: raw (1000/3)*3 drifts to 999.99999, so the
      // ending value is ~0.0001 not 0. Decimal split lands on exactly 0.
      const sched = DepreciationEngine.generateSchedule('straightLine', 1000, 0, 3);
      const total = sched.reduce((s, e) => s + e.depreciation, 0);
      expect(sched[sched.length - 1]!.endingValue).toBe(0);
      expect(total).toBeCloseTo(1000, 2);
    });

    it('sum-of-years-digits schedule depreciates exactly cost-salvage', () => {
      // life=7 yields repeating-decimal weights (÷28) — raw float drifts; the
      // largest-remainder allocation reconciles exactly to the depreciable base.
      const sched = DepreciationEngine.sumOfYearsDigitsSchedule(1000, 0, 7);
      const total = sched.reduce((s, e) => s + e.depreciation, 0);
      expect(sched[sched.length - 1]!.endingValue).toBe(0);
      expect(total).toBeCloseTo(1000, 2);
    });

    it('straight-line respects salvage value', () => {
      const sched = DepreciationEngine.generateSchedule('straightLine', 10000, 1000, 5);
      expect(sched[sched.length - 1]!.endingValue).toBe(1000); // never below salvage
    });
  });
});
