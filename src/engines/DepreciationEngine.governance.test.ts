import { describe, it, expect } from 'vitest';
import { DepreciationEngine } from './DepreciationEngine';

/**
 * GOVERNANCE EVIDENCE for cap:fixed-assets.depreciation
 *
 * The DepreciationEngine computes fixed asset depreciation using multiple
 * methods (straight-line, declining balance, MACRS, units-of-production,
 * sum-of-years-digits) plus impairment testing, disposal, and revaluation.
 * The governance dimension here is CALCULATION ACCURACY — depreciation
 * feeds the income statement (expense) and balance sheet (accumulated
 * depreciation, net book value). All amounts use the decimal.js money
 * primitive. Errors in depreciation propagate to every downstream statement.
 *
 * Tested dimensions:
 * 1. Straight-line depreciation
 * 2. Declining balance depreciation
 * 3. MACRS depreciation
 * 4. Sum-of-years-digits depreciation
 * 5. Units-of-production depreciation
 * 6. Asset disposal
 * 7. Money primitive safety
 * 8. Determinism
 */

describe('DepreciationEngine — GOVERNANCE (fixed-assets.depreciation)', () => {

  describe('1. Straight-line depreciation', () => {

    it('straightLine computes annual depreciation', () => {
      const dep = DepreciationEngine.straightLine(100000, 10000, 10);
      expect(dep).toBeCloseTo(9000, 2);
    });

    it('straightLine handles zero salvage', () => {
      const dep = DepreciationEngine.straightLine(100000, 0, 10);
      expect(dep).toBeCloseTo(10000, 2);
    });

    it('straightLine handles zero useful life', () => {
      const dep = DepreciationEngine.straightLine(100000, 10000, 0);
      expect(dep).toBe(0);
    });
  });

  describe('2. Declining balance depreciation', () => {

    it('decliningBalance produces array of annual depreciation', () => {
      const schedule = DepreciationEngine.decliningBalance(100000, 10000, 5, 2.0);
      expect(schedule).toBeInstanceOf(Array);
      expect(schedule.length).toBeGreaterThan(0);
    });

    it('decliningBalance total depreciation does not exceed cost minus salvage', () => {
      const schedule = DepreciationEngine.decliningBalance(100000, 10000, 5, 2.0);
      const total = schedule.reduce((sum, d) => sum + d, 0);
      expect(total).toBeLessThanOrEqual(90000);
    });
  });

  describe('3. MACRS depreciation', () => {

    it('macrs computes depreciation for a specific year', () => {
      const dep = DepreciationEngine.macrs(100000, 5, 1);
      expect(dep).toBeGreaterThan(0);
    });

    it('macrs returns 0 for invalid year', () => {
      const dep = DepreciationEngine.macrs(100000, 5, 0);
      expect(dep).toBe(0);
    });

    it('macrsSchedule produces full schedule', () => {
      const schedule = DepreciationEngine.macrsSchedule(100000, 5);
      expect(schedule).toBeInstanceOf(Array);
      expect(schedule.length).toBeGreaterThan(0);
    });

    it('macrsSchedule total equals cost', () => {
      const schedule = DepreciationEngine.macrsSchedule(100000, 5);
      const total = schedule.reduce((sum, e) => sum + e.depreciation, 0);
      expect(total).toBeCloseTo(100000, 2);
    });
  });

  describe('4. Sum-of-years-digits depreciation', () => {

    it('sumOfYearsDigits computes depreciation for a specific year', () => {
      const dep = DepreciationEngine.sumOfYearsDigits(100000, 10000, 10, 1);
      expect(dep).toBeGreaterThan(0);
    });

    it('sumOfYearsDigits returns 0 for invalid year', () => {
      const dep = DepreciationEngine.sumOfYearsDigits(100000, 10000, 10, 0);
      expect(dep).toBe(0);
    });

    it('sumOfYearsDigits returns 0 for year exceeding life', () => {
      const dep = DepreciationEngine.sumOfYearsDigits(100000, 10000, 10, 11);
      expect(dep).toBe(0);
    });

    it('sumOfYearsDigitsSchedule produces full schedule', () => {
      const schedule = DepreciationEngine.sumOfYearsDigitsSchedule(100000, 10000, 10);
      expect(schedule).toBeInstanceOf(Array);
      expect(schedule.length).toBe(10);
    });

    it('sumOfYearsDigitsSchedule total equals cost minus salvage', () => {
      const schedule = DepreciationEngine.sumOfYearsDigitsSchedule(100000, 10000, 10);
      const total = schedule.reduce((sum, e) => sum + e.depreciation, 0);
      expect(total).toBeCloseTo(90000, 2);
    });
  });

  describe('5. Units-of-production depreciation', () => {

    it('unitsOfProduction computes depreciation proportional to usage', () => {
      const dep = DepreciationEngine.unitsOfProduction(100000, 10000, 1000, 200);
      expect(dep).toBeCloseTo(18000, 2);
    });

    it('unitsOfProduction returns 0 for zero total units', () => {
      const dep = DepreciationEngine.unitsOfProduction(100000, 10000, 0, 100);
      expect(dep).toBe(0);
    });

    it('unitsOfProduction returns 0 for zero current units', () => {
      const dep = DepreciationEngine.unitsOfProduction(100000, 10000, 1000, 0);
      expect(dep).toBeCloseTo(0, 2);
    });
  });

  describe('6. Asset disposal', () => {

    it('assetDisposal computes gain/loss correctly', () => {
      const result = DepreciationEngine.assetDisposal(100000, 40000, 70000);
      expect(result.bookValue).toBeCloseTo(60000, 2);
      expect(result.gainLoss).toBeCloseTo(10000, 2);
      expect(result.isGain).toBe(true);
    });

    it('assetDisposal detects loss when sale price below book value', () => {
      const result = DepreciationEngine.assetDisposal(100000, 40000, 50000);
      expect(result.bookValue).toBeCloseTo(60000, 2);
      expect(result.gainLoss).toBeCloseTo(-10000, 2);
      expect(result.isGain).toBe(false);
    });
  });

  describe('7. Money primitive safety', () => {

    it('straightLine uses decimal arithmetic for large amounts', () => {
      const dep = DepreciationEngine.straightLine(999999999999.99, 0, 10);
      expect(dep).toBeCloseTo(99999999999.999, 2);
    });

    it('straightLine handles small amounts', () => {
      const dep = DepreciationEngine.straightLine(0.01, 0, 1);
      expect(dep).toBeCloseTo(0.01, 2);
    });
  });

  describe('8. Determinism', () => {

    it('straightLine is deterministic', () => {
      const r1 = DepreciationEngine.straightLine(100000, 10000, 10);
      const r2 = DepreciationEngine.straightLine(100000, 10000, 10);
      expect(r1).toBe(r2);
    });

    it('macrsSchedule is deterministic', () => {
      const r1 = DepreciationEngine.macrsSchedule(100000, 5);
      const r2 = DepreciationEngine.macrsSchedule(100000, 5);
      expect(r1).toEqual(r2);
    });

    it('assetDisposal is deterministic', () => {
      const r1 = DepreciationEngine.assetDisposal(100000, 40000, 70000);
      const r2 = DepreciationEngine.assetDisposal(100000, 40000, 70000);
      expect(r1).toEqual(r2);
    });
  });
});
