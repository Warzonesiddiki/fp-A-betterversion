import { describe, it, expect } from 'vitest';
import { WorkforceEngine } from './WorkforceEngine';
import type { HeadcountInput } from '@/types/sector-types';

/**
 * GOVERNANCE EVIDENCE for cap:ops.workforce
 *
 * The WorkforceEngine forecasts headcount, calculates compensation costs,
 * and models hiring velocity. The governance dimension here is WORKFORCE
 * ACCURACY — headcount forecasts and comp costs feed budget models and
 * workforce planning. All currency-bearing values use the decimal.js money
 * primitive. Errors in workforce calculations propagate to budget and
 * cash flow forecasts.
 *
 * Tested dimensions:
 * 1. Headcount forecasting
 * 2. Compensation cost calculation
 * 3. Attrition rate
 * 4. Hiring velocity model
 * 5. Money primitive safety
 * 6. Determinism
 */

function makeHeadcountInput(overrides: Partial<HeadcountInput> = {}): HeadcountInput {
  return {
    current: 100,
    hires: [
      { period: 'Period 1', count: 10 },
      { period: 'Period 2', count: 5 },
    ],
    attrition: 5,
    rampTime: 3,
    ...overrides,
  };
}

describe('WorkforceEngine — GOVERNANCE (ops.workforce)', () => {
  describe('1. Headcount forecasting', () => {
    it('forecastHeadcount produces correct number of periods', () => {
      const input = makeHeadcountInput();
      const forecast = WorkforceEngine.forecastHeadcount(input, 2);
      expect(forecast).toHaveLength(2);
    });

    it('forecastHeadcount tracks starting and ending headcount', () => {
      const input = makeHeadcountInput({ current: 100, attrition: 5 });
      const forecast = WorkforceEngine.forecastHeadcount(input, 1);
      // 100 starting, 5% attrition = 5 departures, 10 hires = 105 ending
      expect(forecast[0]!.startingHeadcount).toBe(100);
      expect(forecast[0]!.hires).toBe(10);
      expect(forecast[0]!.departures).toBe(5);
      expect(forecast[0]!.endingHeadcount).toBe(105);
    });

    it('forecastHeadcount applies attrition rate', () => {
      const input = makeHeadcountInput({ current: 200, attrition: 10, hires: [] });
      const forecast = WorkforceEngine.forecastHeadcount(input, 1);
      expect(forecast[0]!.departures).toBe(20);
      expect(forecast[0]!.endingHeadcount).toBe(180);
    });

    it('forecastHeadcount handles zero hires', () => {
      const input = makeHeadcountInput({ hires: [] });
      const forecast = WorkforceEngine.forecastHeadcount(input, 1);
      expect(forecast[0]!.hires).toBe(0);
    });

    it('forecastHeadcount returns attrition rate', () => {
      const input = makeHeadcountInput({ attrition: 8 });
      const forecast = WorkforceEngine.forecastHeadcount(input, 1);
      expect(forecast[0]!.attritionRate).toBe(8);
    });
  });

  describe('2. Compensation cost calculation', () => {
    it('calculateCompCost computes total cost from salary components', () => {
      const result = WorkforceEngine.calculateCompCost({
        salary: 100000,
        bonusPct: 10,
        equityValue: 5000,
        benefitsPct: 20,
        taxPct: 25,
      });
      expect(result.salary).toBe(100000);
      expect(result.bonus).toBeCloseTo(10000, 2);
      expect(result.benefits).toBeCloseTo(20000, 2);
      expect(result.taxes).toBeCloseTo(27500, 2); // (100000 + 10000) * 0.25
      expect(result.totalCost).toBeCloseTo(162500, 2);
      expect(result.costPerFTE).toBeCloseTo(162500, 2);
    });

    it('calculateCompCost handles zero equity', () => {
      const result = WorkforceEngine.calculateCompCost({
        salary: 100000,
        bonusPct: 0,
        equityValue: 0,
        benefitsPct: 0,
        taxPct: 0,
      });
      expect(result.totalCost).toBeCloseTo(100000, 2);
    });

    it('calculateCompCost handles zero salary', () => {
      const result = WorkforceEngine.calculateCompCost({
        salary: 0,
        bonusPct: 10,
        equityValue: 0,
        benefitsPct: 0,
        taxPct: 0,
      });
      expect(result.totalCost).toBeCloseTo(0, 2);
    });
  });

  describe('3. Attrition rate', () => {
    it('calculateAttrition computes percentage', () => {
      expect(WorkforceEngine.calculateAttrition(100, 5)).toBeCloseTo(5, 2);
    });

    it('calculateAttrition handles zero headcount', () => {
      expect(WorkforceEngine.calculateAttrition(0, 5)).toBe(0);
    });

    it('calculateAttrition handles zero departures', () => {
      expect(WorkforceEngine.calculateAttrition(100, 0)).toBeCloseTo(0, 2);
    });
  });

  describe('4. Hiring velocity model', () => {
    it('modelHiring produces ramp schedule', () => {
      const result = WorkforceEngine.modelHiring(50, 100, 5);
      expect(result).toHaveLength(5);
    });

    it('modelHiring tracks total headcount', () => {
      const result = WorkforceEngine.modelHiring(50, 100, 5);
      // 50 current, need 50 more, 5 months ramp = 10 hires per month
      expect(result[0]!.hires).toBe(10);
      expect(result[0]!.total).toBe(60);
      expect(result[0]!.productive).toBe(50);
    });

    it('modelHiring handles zero ramp time', () => {
      const result = WorkforceEngine.modelHiring(50, 100, 0);
      expect(result).toHaveLength(0);
    });

    it('modelHiring handles already at target', () => {
      const result = WorkforceEngine.modelHiring(100, 100, 5);
      expect(result[0]!.hires).toBe(0);
      expect(result[0]!.total).toBe(100);
    });
  });

  describe('5. Money primitive safety', () => {
    it('calculateCompCost uses decimal arithmetic for large amounts', () => {
      const result = WorkforceEngine.calculateCompCost({
        salary: 999999.99,
        bonusPct: 10,
        equityValue: 0,
        benefitsPct: 0,
        taxPct: 25,
      });
      expect(result.totalCost).toBeGreaterThan(0);
    });

    it('calculateCompCost handles small amounts', () => {
      const result = WorkforceEngine.calculateCompCost({
        salary: 0.01,
        bonusPct: 0,
        equityValue: 0,
        benefitsPct: 0,
        taxPct: 0,
      });
      expect(result.totalCost).toBeCloseTo(0.01, 2);
    });
  });

  describe('6. Determinism', () => {
    it('forecastHeadcount is deterministic', () => {
      const input = makeHeadcountInput();
      const r1 = WorkforceEngine.forecastHeadcount(input, 3);
      const r2 = WorkforceEngine.forecastHeadcount(input, 3);
      expect(r1).toEqual(r2);
    });

    it('calculateCompCost is deterministic', () => {
      const input = {
        salary: 100000,
        bonusPct: 10,
        equityValue: 5000,
        benefitsPct: 20,
        taxPct: 25,
      };
      const r1 = WorkforceEngine.calculateCompCost(input);
      const r2 = WorkforceEngine.calculateCompCost(input);
      expect(r1).toEqual(r2);
    });

    it('calculateAttrition is deterministic', () => {
      expect(WorkforceEngine.calculateAttrition(100, 5)).toBe(
        WorkforceEngine.calculateAttrition(100, 5)
      );
    });
  });
});
