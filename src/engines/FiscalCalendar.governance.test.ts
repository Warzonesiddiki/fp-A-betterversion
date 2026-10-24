import { describe, it, expect } from 'vitest';
import { FiscalCalendar } from './FiscalCalendar';
import type { FiscalYearConfig } from './FiscalCalendar';

/**
 * GOVERNANCE EVIDENCE for cap:fiscal.calendar
 *
 * The FiscalCalendar generates fiscal periods for different calendar types
 * (Standard, 4-4-5, 4-5-4, 13-Period) and maps dates to periods. The
 * governance dimension here is CALENDAR ACCURACY — period boundaries must
 * be correct, dates must map to the right period, and YTD/quarter
 * calculations must be accurate. Errors in calendar generation propagate
 * to every downstream financial process.
 *
 * Tested dimensions:
 * 1. Period generation (Standard calendar)
 * 2. Period generation (4-4-5, 4-5-4, 13-Period)
 * 3. Date-to-period mapping
 * 4. Year-to-date calculation
 * 5. Quarter calculation
 * 6. Determinism
 */

describe('FiscalCalendar — GOVERNANCE (fiscal.calendar)', () => {
  describe('1. Period generation (Standard calendar)', () => {
    it('generatePeriods produces 12 monthly periods for Standard calendar', () => {
      const config: FiscalYearConfig = {
        year: 2026,
        startMonth: 1,
        calendarType: 'Standard',
        adjustPeriod: false,
      };
      const periods = FiscalCalendar.generatePeriods(config);
      expect(periods).toHaveLength(12);
    });

    it('each period has correct structure', () => {
      const config: FiscalYearConfig = {
        year: 2026,
        startMonth: 1,
        calendarType: 'Standard',
        adjustPeriod: false,
      };
      const periods = FiscalCalendar.generatePeriods(config);
      const p = periods[0]!;
      expect(p.year).toBe(2026);
      expect(p.periodNumber).toBe(1);
      expect(p.name).toBe('P1');
      expect(p.startDate).toBeDefined();
      expect(p.endDate).toBeDefined();
      expect(p.periodType).toBe('Monthly');
      expect(p.isAdjustingPeriod).toBe(false);
    });

    it('periods are chronologically ordered', () => {
      const config: FiscalYearConfig = {
        year: 2026,
        startMonth: 1,
        calendarType: 'Standard',
        adjustPeriod: false,
      };
      const periods = FiscalCalendar.generatePeriods(config);
      for (let i = 1; i < periods.length; i++) {
        expect(periods[i]!.startDate > periods[i - 1]!.startDate).toBe(true);
      }
    });

    it('period numbers are sequential', () => {
      const config: FiscalYearConfig = {
        year: 2026,
        startMonth: 1,
        calendarType: 'Standard',
        adjustPeriod: false,
      };
      const periods = FiscalCalendar.generatePeriods(config);
      for (let i = 0; i < periods.length; i++) {
        expect(periods[i]!.periodNumber).toBe(i + 1);
      }
    });
  });

  describe('2. Period generation (4-4-5, 4-5-4, 13-Period)', () => {
    it('4-4-5 calendar produces 12 periods', () => {
      const config: FiscalYearConfig = {
        year: 2026,
        startMonth: 1,
        calendarType: '4-4-5',
        adjustPeriod: false,
      };
      const periods = FiscalCalendar.generatePeriods(config);
      expect(periods).toHaveLength(12);
    });

    it('4-5-4 calendar produces 12 periods', () => {
      const config: FiscalYearConfig = {
        year: 2026,
        startMonth: 1,
        calendarType: '4-5-4',
        adjustPeriod: false,
      };
      const periods = FiscalCalendar.generatePeriods(config);
      expect(periods).toHaveLength(12);
    });

    it('13-Period calendar produces 13 periods', () => {
      const config: FiscalYearConfig = {
        year: 2026,
        startMonth: 1,
        calendarType: '13-Period',
        adjustPeriod: false,
      };
      const periods = FiscalCalendar.generatePeriods(config);
      expect(periods).toHaveLength(13);
    });

    it('13-Period calendar with adjustPeriod adds an extra ADJ period', () => {
      const config: FiscalYearConfig = {
        year: 2026,
        startMonth: 1,
        calendarType: '13-Period',
        adjustPeriod: true,
      };
      const periods = FiscalCalendar.generatePeriods(config);
      expect(periods).toHaveLength(14);
      expect(periods[13]!.isAdjustingPeriod).toBe(true);
      expect(periods[13]!.periodType).toBe('Adjusting');
    });
  });

  describe('3. Date-to-period mapping', () => {
    it('getPeriodForDate returns correct period for a date', () => {
      const config: FiscalYearConfig = {
        year: 2026,
        startMonth: 1,
        calendarType: 'Standard',
        adjustPeriod: false,
      };
      const periods = FiscalCalendar.generatePeriods(config);
      const period = FiscalCalendar.getPeriodForDate(new Date('2026-03-15'), periods);
      expect(period).not.toBeNull();
      expect(period!.periodNumber).toBe(3);
    });

    it('getPeriodForDate returns null for date outside range', () => {
      const config: FiscalYearConfig = {
        year: 2026,
        startMonth: 1,
        calendarType: 'Standard',
        adjustPeriod: false,
      };
      const periods = FiscalCalendar.generatePeriods(config);
      const period = FiscalCalendar.getPeriodForDate(new Date('2025-01-15'), periods);
      expect(period).toBeNull();
    });

    it('getPeriodForDate returns correct period for first day of month', () => {
      const config: FiscalYearConfig = {
        year: 2026,
        startMonth: 1,
        calendarType: 'Standard',
        adjustPeriod: false,
      };
      const periods = FiscalCalendar.generatePeriods(config);
      const period = FiscalCalendar.getPeriodForDate(new Date('2026-01-01'), periods);
      expect(period).not.toBeNull();
      expect(period!.periodNumber).toBe(1);
    });

    it('getPeriodForDate returns correct period for last day of month', () => {
      const config: FiscalYearConfig = {
        year: 2026,
        startMonth: 1,
        calendarType: 'Standard',
        adjustPeriod: false,
      };
      const periods = FiscalCalendar.generatePeriods(config);
      const period = FiscalCalendar.getPeriodForDate(new Date('2026-12-31'), periods);
      expect(period).not.toBeNull();
      expect(period!.periodNumber).toBe(12);
    });
  });

  describe('4. Year-to-date calculation', () => {
    it('getYearToDate returns periods through the given month', () => {
      const config: FiscalYearConfig = {
        year: 2026,
        startMonth: 1,
        calendarType: 'Standard',
        adjustPeriod: false,
      };
      const periods = FiscalCalendar.generatePeriods(config);
      const ytd = FiscalCalendar.getYearToDate(3, periods);
      expect(ytd).toHaveLength(3);
    });

    it('getYearToDate for month 1 returns first period only', () => {
      const config: FiscalYearConfig = {
        year: 2026,
        startMonth: 1,
        calendarType: 'Standard',
        adjustPeriod: false,
      };
      const periods = FiscalCalendar.generatePeriods(config);
      const ytd = FiscalCalendar.getYearToDate(1, periods);
      expect(ytd).toHaveLength(1);
    });

    it('getYearToDate for month 12 returns all periods', () => {
      const config: FiscalYearConfig = {
        year: 2026,
        startMonth: 1,
        calendarType: 'Standard',
        adjustPeriod: false,
      };
      const periods = FiscalCalendar.generatePeriods(config);
      const ytd = FiscalCalendar.getYearToDate(12, periods);
      expect(ytd).toHaveLength(12);
    });
  });

  describe('5. Quarter calculation', () => {
    it('getQuarterPeriods returns 3 periods for Q1', () => {
      const config: FiscalYearConfig = {
        year: 2026,
        startMonth: 1,
        calendarType: 'Standard',
        adjustPeriod: false,
      };
      const periods = FiscalCalendar.generatePeriods(config);
      const q1 = FiscalCalendar.getQuarterPeriods(1, periods);
      expect(q1).toHaveLength(3);
    });

    it('getQuarterPeriods returns 3 periods for Q2', () => {
      const config: FiscalYearConfig = {
        year: 2026,
        startMonth: 1,
        calendarType: 'Standard',
        adjustPeriod: false,
      };
      const periods = FiscalCalendar.generatePeriods(config);
      const q2 = FiscalCalendar.getQuarterPeriods(2, periods);
      expect(q2).toHaveLength(3);
      expect(q2[0]!.periodNumber).toBe(4);
    });
  });

  describe('6. Determinism', () => {
    it('generatePeriods is deterministic for same config', () => {
      const config: FiscalYearConfig = {
        year: 2026,
        startMonth: 1,
        calendarType: 'Standard',
        adjustPeriod: false,
      };
      const periods1 = FiscalCalendar.generatePeriods(config);
      const periods2 = FiscalCalendar.generatePeriods(config);
      expect(periods1).toEqual(periods2);
    });

    it('generatePeriods handles non-January start month', () => {
      const config: FiscalYearConfig = {
        year: 2026,
        startMonth: 7,
        calendarType: 'Standard',
        adjustPeriod: false,
      };
      const periods = FiscalCalendar.generatePeriods(config);
      expect(periods).toHaveLength(12);
      expect(periods[0]!.startDate.startsWith('2026-07')).toBe(true);
    });

    it('generatePeriods normalizes invalid start month', () => {
      const config: FiscalYearConfig = {
        year: 2026,
        startMonth: 0,
        calendarType: 'Standard',
        adjustPeriod: false,
      };
      const periods = FiscalCalendar.generatePeriods(config);
      expect(periods).toHaveLength(12);
    });
  });
});
