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
});
