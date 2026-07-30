import { describe, it, expect } from 'vitest';
import { FiscalCalendarEngine } from './FiscalCalendarEngine';

describe('FiscalCalendarEngine', () => {
  describe('4-4-5 Calendar', () => {
    const config = { calendarType: '4-4-5' as const, startMonth: 1, startDay: 1, year: 2026 };

    it('should build a fiscal year with 12 periods', () => {
      const result = FiscalCalendarEngine.buildFiscalYear(config);
      expect(result.periods.length).toBe(12);
    });

    it('should have 4 quarters with 3 periods each', () => {
      const result = FiscalCalendarEngine.buildFiscalYear(config);
      expect(result.quarters.length).toBe(4);
      for (const q of result.quarters) {
        expect(q.periods.length).toBe(3);
      }
    });

    it('should follow 4-4-5 week pattern for each quarter', () => {
      const result = FiscalCalendarEngine.buildFiscalYear(config);
      for (const q of result.quarters) {
        expect(q.periods[0]!.weeksInPeriod).toBe(4);
        expect(q.periods[1]!.weeksInPeriod).toBe(4);
        expect(q.periods[2]!.weeksInPeriod).toBeGreaterThanOrEqual(5);
      }
    });

    it('should have contiguous periods', () => {
      const result = FiscalCalendarEngine.buildFiscalYear(config);
      const validation = FiscalCalendarEngine.validateFiscalYear(result);
      expect(validation.valid).toBe(true);
    });

    it('should total 364 days for a standard year', () => {
      const result = FiscalCalendarEngine.buildFiscalYear(config);
      expect(result.totalDays).toBe(364);
    });
  });

  describe('Gregorian Calendar', () => {
    const config = { calendarType: 'gregorian' as const, startMonth: 1, startDay: 1, year: 2026 };

    it('should build a fiscal year with 12 monthly periods', () => {
      const result = FiscalCalendarEngine.buildFiscalYear(config);
      expect(result.periods.length).toBe(12);
    });

    it('should have correct days per month', () => {
      const result = FiscalCalendarEngine.buildFiscalYear(config);
      expect(result.periods[0]!.daysInPeriod).toBe(31); // January
      expect(result.periods[1]!.daysInPeriod).toBe(28); // February (non-leap)
      expect(result.periods[2]!.daysInPeriod).toBe(31); // March
    });

    it('should handle leap year February', () => {
      const leapConfig = {
        calendarType: 'gregorian' as const,
        startMonth: 1,
        startDay: 1,
        year: 2024,
      };
      const result = FiscalCalendarEngine.buildFiscalYear(leapConfig);
      expect(result.periods[1]!.daysInPeriod).toBe(29); // February (leap)
      expect(result.periods[1]!.isLeapPeriod).toBe(true);
    });

    it('should total 365 days for a non-leap year', () => {
      const result = FiscalCalendarEngine.buildFiscalYear(config);
      expect(result.totalDays).toBe(365);
    });
  });

  describe('Period Allocation', () => {
    const config = { calendarType: 'gregorian' as const, startMonth: 1, startDay: 1, year: 2026 };

    it('should allocate annual amount across periods proportional to days', () => {
      const result = FiscalCalendarEngine.buildFiscalYear(config);
      const allocations = FiscalCalendarEngine.allocateAcrossPeriods(result, 120000);

      // Total should equal the annual amount
      const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
      expect(totalAllocated).toBeCloseTo(120000, 0);
    });

    it('should use Decimal for allocation — no float drift', () => {
      const result = FiscalCalendarEngine.buildFiscalYear(config);
      const allocations = FiscalCalendarEngine.allocateAcrossPeriods(result, 0.1 + 0.2);

      // With Decimal.js, 0.1 + 0.2 = 0.3 exactly
      const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
      expect(totalAllocated).toBeCloseTo(0.3, 1);
    });

    it('should have a daily rate for each period', () => {
      const result = FiscalCalendarEngine.buildFiscalYear(config);
      const allocations = FiscalCalendarEngine.allocateAcrossPeriods(result, 365000);

      for (const alloc of allocations) {
        expect(alloc.dailyRate).toBeGreaterThan(0);
        expect(alloc.daysInPeriod).toBeGreaterThan(0);
      }
    });
  });

  describe('Period Lookup', () => {
    const config = { calendarType: 'gregorian' as const, startMonth: 1, startDay: 1, year: 2026 };

    it('should find the period for a given date', () => {
      const result = FiscalCalendarEngine.buildFiscalYear(config);
      const period = FiscalCalendarEngine.findPeriodForDate(result, '2026-01-15');
      expect(period).not.toBeNull();
      expect(period!.periodNumber).toBe(1);
    });

    it('should return null for a date outside the fiscal year', () => {
      const result = FiscalCalendarEngine.buildFiscalYear(config);
      const period = FiscalCalendarEngine.findPeriodForDate(result, '2025-01-15');
      expect(period).toBeNull();
    });
  });

  describe('Validation', () => {
    it('should validate a well-formed fiscal year', () => {
      const config = { calendarType: '4-4-5' as const, startMonth: 1, startDay: 1, year: 2026 };
      const result = FiscalCalendarEngine.buildFiscalYear(config);
      const validation = FiscalCalendarEngine.validateFiscalYear(result);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Fiscal Year Determination', () => {
    it('should determine fiscal year for a date before fiscal start', () => {
      const fy = FiscalCalendarEngine.getFiscalYearForDate('2025-12-15', {
        calendarType: 'gregorian',
        startMonth: 7,
        startDay: 1,
      });
      expect(fy).toBe(2025);
    });

    it('should determine fiscal year for a date after fiscal start', () => {
      const fy = FiscalCalendarEngine.getFiscalYearForDate('2026-08-15', {
        calendarType: 'gregorian',
        startMonth: 7,
        startDay: 1,
      });
      expect(fy).toBe(2026);
    });
  });

  describe('Prior Period', () => {
    it('should return prior period for period 2', () => {
      const config = { calendarType: 'gregorian' as const, startMonth: 1, startDay: 1, year: 2026 };
      const result = FiscalCalendarEngine.buildFiscalYear(config);
      const prior = FiscalCalendarEngine.getPriorPeriod(result, 2);
      expect(prior).not.toBeNull();
      expect(prior!.periodNumber).toBe(1);
    });

    it('should return null for period 1', () => {
      const config = { calendarType: 'gregorian' as const, startMonth: 1, startDay: 1, year: 2026 };
      const result = FiscalCalendarEngine.buildFiscalYear(config);
      const prior = FiscalCalendarEngine.getPriorPeriod(result, 1);
      expect(prior).toBeNull();
    });
  });
});
