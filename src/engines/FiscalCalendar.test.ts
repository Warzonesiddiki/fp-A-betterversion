import { describe, it, expect } from 'vitest';
import { FiscalCalendar, type FiscalYearConfig } from './FiscalCalendar';

describe('FiscalCalendar', () => {
  describe('generatePeriods', () => {
    it('should generate 12 monthly periods for Standard calendar', () => {
      const config: FiscalYearConfig = {
        year: 2024,
        startMonth: 1,
        calendarType: 'Standard',
        adjustPeriod: false,
      };
      const periods = FiscalCalendar.generatePeriods(config);
      expect(periods).toHaveLength(12);
      expect(periods[0].name).toBe('P1');
      expect(periods[0].periodType).toBe('Monthly');
    });

    it('should generate 12 periods for 4-4-5 calendar', () => {
      const config: FiscalYearConfig = {
        year: 2024,
        startMonth: 1,
        calendarType: '4-4-5',
        adjustPeriod: false,
      };
      const periods = FiscalCalendar.generatePeriods(config);
      expect(periods).toHaveLength(12);
      expect(periods[0].name).toBe('Q1 P1');
    });

    it('should generate 12 periods for 4-5-4 calendar', () => {
      const config: FiscalYearConfig = {
        year: 2024,
        startMonth: 1,
        calendarType: '4-5-4',
        adjustPeriod: false,
      };
      const periods = FiscalCalendar.generatePeriods(config);
      expect(periods).toHaveLength(12);
    });

    it('should generate 13 periods for 13-Period calendar', () => {
      const config: FiscalYearConfig = {
        year: 2024,
        startMonth: 1,
        calendarType: '13-Period',
        adjustPeriod: false,
      };
      const periods = FiscalCalendar.generatePeriods(config);
      expect(periods).toHaveLength(13);
    });

    it('should add adjusting period when configured', () => {
      const config: FiscalYearConfig = {
        year: 2024,
        startMonth: 1,
        calendarType: 'Standard',
        adjustPeriod: true,
      };
      const periods = FiscalCalendar.generatePeriods(config);
      expect(periods).toHaveLength(13);
      expect(periods[12].periodType).toBe('Adjusting');
      expect(periods[12].isAdjustingPeriod).toBe(true);
    });

    it('should handle non-January start month', () => {
      const config: FiscalYearConfig = {
        year: 2024,
        startMonth: 7,
        calendarType: 'Standard',
        adjustPeriod: false,
      };
      const periods = FiscalCalendar.generatePeriods(config);
      expect(periods).toHaveLength(12);
      expect(periods[0].periodNumber).toBe(1);
    });
  });

  describe('getPeriodForDate', () => {
    it('should find period for a given date', () => {
      const periods = FiscalCalendar.generatePeriods({
        year: 2024,
        startMonth: 1,
        calendarType: 'Standard',
        adjustPeriod: false,
      });
      const result = FiscalCalendar.getPeriodForDate(new Date('2024-06-15'), periods);
      expect(result).not.toBeNull();
      expect(result?.periodNumber).toBe(6);
    });

    it('should return null for date outside fiscal year', () => {
      const periods = FiscalCalendar.generatePeriods({
        year: 2024,
        startMonth: 1,
        calendarType: 'Standard',
        adjustPeriod: false,
      });
      const result = FiscalCalendar.getPeriodForDate(new Date('2025-06-15'), periods);
      expect(result).toBeNull();
    });
  });

  describe('getYearToDate', () => {
    it('should return periods up to the given month', () => {
      const periods = FiscalCalendar.generatePeriods({
        year: 2024,
        startMonth: 1,
        calendarType: 'Standard',
        adjustPeriod: false,
      });
      const ytd = FiscalCalendar.getYearToDate(3, periods);
      expect(ytd).toHaveLength(3);
    });

    it('should return empty for throughMonth < 1', () => {
      const periods = FiscalCalendar.generatePeriods({
        year: 2024,
        startMonth: 1,
        calendarType: 'Standard',
        adjustPeriod: false,
      });
      expect(FiscalCalendar.getYearToDate(0, periods)).toEqual([]);
    });
  });

  describe('getQuarterPeriods', () => {
    it('should return periods for Q1', () => {
      const periods = FiscalCalendar.generatePeriods({
        year: 2024,
        startMonth: 1,
        calendarType: 'Standard',
        adjustPeriod: false,
      });
      const q1 = FiscalCalendar.getQuarterPeriods(1, periods);
      expect(q1).toHaveLength(3);
    });

    it('should return empty for invalid quarter', () => {
      const periods = FiscalCalendar.generatePeriods({
        year: 2024,
        startMonth: 1,
        calendarType: 'Standard',
        adjustPeriod: false,
      });
      expect(FiscalCalendar.getQuarterPeriods(0, periods)).toEqual([]);
      expect(FiscalCalendar.getQuarterPeriods(5, periods)).toEqual([]);
    });
  });
});
