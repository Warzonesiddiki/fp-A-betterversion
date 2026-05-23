import { describe, it, expect } from 'vitest';
import { WorkforceEngine, type CompInput } from './WorkforceEngine';
import type { HeadcountInput } from '@/types/sector-types';

describe('WorkforceEngine', () => {
  describe('forecastHeadcount', () => {
    const input: HeadcountInput = {
      current: 100,
      hires: [
        { period: 'Period 1', count: 5 },
        { period: 'Period 2', count: 3 },
      ],
      attrition: 10,
      rampTime: 3,
    };

    it('should forecast headcount over multiple periods', () => {
      const result = WorkforceEngine.forecastHeadcount(input, 4);
      expect(result).toHaveLength(4);
      expect(result[0].startingHeadcount).toBe(100);
    });

    it('should apply attrition as percentage', () => {
      const result = WorkforceEngine.forecastHeadcount(input, 2);
      expect(result[0].departures).toBe(10);
    });

    it('should add hires in the correct period', () => {
      const result = WorkforceEngine.forecastHeadcount(input, 2);
      expect(result[0].hires).toBe(5);
      expect(result[1].hires).toBe(3);
    });

    it('should handle zero hires gracefully', () => {
      const noHires: HeadcountInput = { current: 50, hires: [], attrition: 5, rampTime: 1 };
      const result = WorkforceEngine.forecastHeadcount(noHires, 2);
      expect(result[0].hires).toBe(0);
      expect(result[0].endingHeadcount).toBe(47);
    });
  });

  describe('calculateCompCost', () => {
    const comp: CompInput = {
      salary: 100000,
      bonusPct: 10,
      equityValue: 15000,
      benefitsPct: 20,
      taxPct: 25,
    };

    it('should calculate total compensation cost', () => {
      const result = WorkforceEngine.calculateCompCost(comp);
      expect(result.salary).toBe(100000);
      expect(result.bonus).toBe(10000);
      expect(result.equity).toBe(15000);
      expect(result.benefits).toBe(20000);
      expect(result.taxes).toBe(27500);
      expect(result.totalCost).toBe(172500);
    });

    it('should handle zero bonus and equity', () => {
      const result = WorkforceEngine.calculateCompCost({ ...comp, bonusPct: 0, equityValue: 0 });
      expect(result.totalCost).toBe(145000);
    });
  });

  describe('calculateAttrition', () => {
    it('should calculate attrition percentage', () => {
      expect(WorkforceEngine.calculateAttrition(100, 10)).toBe(10);
    });

    it('should return 0 for zero headcount', () => {
      expect(WorkforceEngine.calculateAttrition(0, 10)).toBe(0);
    });
  });

  describe('modelHiring', () => {
    it('should model hiring ramp', () => {
      const result = WorkforceEngine.modelHiring(50, 100, 5);
      expect(result).toHaveLength(5);
      expect(result[4].total).toBeGreaterThanOrEqual(100);
    });

    it('should handle target below current', () => {
      const result = WorkforceEngine.modelHiring(100, 50, 3);
      expect(result.every((r) => r.hires <= 0)).toBe(true);
      expect(result[result.length - 1].total).toBeLessThan(100);
    });

    it('should report productive headcount separately', () => {
      const result = WorkforceEngine.modelHiring(0, 10, 2);
      expect(result[0].productive).toBe(0);
      expect(result[0].total).toBe(result[0].hires);
    });
  });
});
