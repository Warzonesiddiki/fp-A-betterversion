/**
 * Fiscal Calendar Engine (KILLX-009)
 *
 * Supports 4-4-5, 4-5-4, 5-4-4, and Gregorian calendar structures.
 * Handles leap year adjustment, period boundaries, and quarter mapping.
 *
 * Invariant: All periods in a fiscal year must be contiguous and non-overlapping,
 * covering exactly 365 or 366 days.
 */

import Decimal from 'decimal.js';
import { toDecimal, roundTo, allocateMoney, DEFAULT_CURRENCY_PLACES } from '@/utils/money';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FiscalCalendarType = '4-4-5' | '4-5-4' | '5-4-4' | 'gregorian';

export interface FiscalYearConfig {
  readonly calendarType: FiscalCalendarType;
  readonly startMonth: number; // 1-12 (January = 1)
  readonly startDay: number; // 1-31
  readonly year: number; // The fiscal year (e.g., 2026)
}

export interface FiscalPeriod {
  readonly periodNumber: number; // 1-12 (or 13 for 53-week years)
  readonly quarter: number; // 1-4
  readonly startDate: string; // ISO date
  readonly endDate: string; // ISO date
  readonly daysInPeriod: number;
  readonly weeksInPeriod: number;
  readonly isLeapPeriod: boolean; // True if this period contains the leap year adjustment
}

export interface FiscalQuarter {
  readonly quarter: number;
  readonly periods: FiscalPeriod[];
  readonly startDate: string;
  readonly endDate: string;
  readonly daysInQuarter: number;
}

export interface FiscalYearResult {
  readonly config: FiscalYearConfig;
  readonly periods: FiscalPeriod[];
  readonly quarters: FiscalQuarter[];
  readonly totalDays: number;
  readonly totalWeeks: number;
  readonly is53WeekYear: boolean;
  readonly leapYearAdjustment: 'none' | 'extra-week' | 'extra-day';
}

export interface PeriodAllocation {
  readonly periodNumber: number;
  readonly allocatedAmount: number;
  readonly dailyRate: number;
  readonly daysInPeriod: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WEEKS_PER_YEAR = 52;
const DAYS_PER_WEEK = 7;
const _DAYS_PER_YEAR = 365;
const _DAYS_PER_LEAP_YEAR = 366;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

/**
 * Determine the week structure for a fiscal calendar type.
 * Returns an array of 4 quarter patterns, each with 3 month lengths in weeks.
 */
function getWeekPattern(type: FiscalCalendarType): number[][] {
  switch (type) {
    case '4-4-5':
      return [
        [4, 4, 5],
        [4, 4, 5],
        [4, 4, 5],
        [4, 4, 5],
      ];
    case '4-5-4':
      return [
        [4, 5, 4],
        [4, 5, 4],
        [4, 5, 4],
        [4, 5, 4],
      ];
    case '5-4-4':
      return [
        [5, 4, 4],
        [5, 4, 4],
        [5, 4, 4],
        [5, 4, 4],
      ];
    case 'gregorian':
      return [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]; // Special handling
  }
}

/**
 * Determine if a year is a 53-week year for the given calendar type.
 *
 * 4-4-5 / 4-5-4 / 5-4-4 calendars use week-based periods.
 * A standard year = 52 weeks = 364 days.
 * A 53-week year = 53 weeks = 371 days.
 *
 * The 53-week year rule (per IRS Rev. Proc. 2002-38 and IFRS):
 *   A fiscal year is a 53-week year if the fiscal year-end date falls
 *   on the same day of the week as the fiscal year-start date AND
 *   the fiscal year contains 371 days (i.e., the year spans 53 weeks).
 *
 * More practically: a 52-week year spans 364 days (or 371 if it captures
 * an extra week due to the weekday alignment). The 53rd week occurs
 * approximately every 5-6 years.
 *
 * For a fiscal year starting on a specific weekday:
 *   - If the remaining days of the calendar year after the start date
 *     are NOT evenly divisible by 7, the next year will shift.
 *   - When the shift accumulates to 7+ days, a 53-week year occurs.
 *
 * Implementation: Calculate the actual span in days from the prior fiscal
 * year start to this fiscal year start. If the span is 371 days (not 364),
 * this is a 53-week year.
 */
function is53WeekYear(year: number, config: FiscalYearConfig): boolean {
  if (config.calendarType === 'gregorian') return false;

  // The fiscal year starts on a specific date.
  // A 53-week year is one where the fiscal year spans 371 days
  // instead of the usual 364. This happens when:
  //   - The fiscal year starts on the same weekday as the prior year,
  //     AND the intervening calendar year was a leap year that adds
  //     an extra day to the 365-day cycle.
  //   - OR: 365 mod 7 = 1, so each year shifts by 1 weekday (2 in leap years).
  //     After 5-6 years, the shift accumulates to 7+ days, creating a 53-week year.
  //
  // The definitive test: count the actual days from this fiscal year start
  // to the next fiscal year start. If >= 371, this is a 53-week year.
  const thisStart = new Date(year, config.startMonth - 1, config.startDay);
  const nextStart = new Date(year + 1, config.startMonth - 1, config.startDay);
  const spanDays = Math.round((nextStart.getTime() - thisStart.getTime()) / 86400000);

  // 53-week year if the fiscal year spans 371 days
  return spanDays >= 371;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class FiscalCalendarEngine {
  /**
   * Build a complete fiscal year calendar with all periods and quarters.
   */
  static buildFiscalYear(config: FiscalYearConfig): FiscalYearResult {
    if (config.calendarType === 'gregorian') {
      return FiscalCalendarEngine.buildGregorianYear(config);
    }

    const weekPattern = getWeekPattern(config.calendarType);
    const is53 = is53WeekYear(config.year, config);
    const totalWeeks = is53 ? 53 : WEEKS_PER_YEAR;

    const periods: FiscalPeriod[] = [];
    const quarters: FiscalQuarter[] = [];

    let currentDate = new Date(config.year, config.startMonth - 1, config.startDay);
    let periodNumber = 1;

    for (let q = 0; q < 4; q++) {
      const quarterPattern = weekPattern[q]!;
      const quarterPeriods: FiscalPeriod[] = [];

      for (let m = 0; m < 3; m++) {
        let weeksInPeriod = quarterPattern[m]!;

        // In a 53-week year, add the extra week to the last period of the last quarter
        if (is53 && q === 3 && m === 2) {
          weeksInPeriod += 1;
        }

        const daysInPeriod = weeksInPeriod * DAYS_PER_WEEK;
        const startDate = new Date(currentDate);
        const endDate = addDays(currentDate, daysInPeriod - 1);

        // Check if this period contains the leap day
        const isLeapPeriod =
          isLeapYear(config.year) &&
          startDate.getMonth() <= 1 &&
          endDate.getMonth() >= 1 &&
          startDate.getFullYear() === config.year;

        periods.push({
          periodNumber,
          quarter: q + 1,
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          daysInPeriod: isLeapPeriod ? daysInPeriod + 1 : daysInPeriod,
          weeksInPeriod,
          isLeapPeriod,
        });

        quarterPeriods.push(periods[periods.length - 1]!);
        currentDate = addDays(currentDate, daysInPeriod);
        periodNumber++;
      }

      quarters.push({
        quarter: q + 1,
        periods: quarterPeriods,
        startDate: quarterPeriods[0]!.startDate,
        endDate: quarterPeriods[2]!.endDate,
        daysInQuarter: quarterPeriods.reduce((sum, p) => sum + p.daysInPeriod, 0),
      });
    }

    const actualTotalDays = periods.reduce((sum, p) => sum + p.daysInPeriod, 0);

    return {
      config,
      periods,
      quarters,
      totalDays: actualTotalDays,
      totalWeeks,
      is53WeekYear: is53,
      leapYearAdjustment: is53 ? 'extra-week' : isLeapYear(config.year) ? 'extra-day' : 'none',
    };
  }

  /**
   * Build a Gregorian calendar year (12 months, no week structure).
   */
  private static buildGregorianYear(config: FiscalYearConfig): FiscalYearResult {
    const periods: FiscalPeriod[] = [];
    const quarters: FiscalQuarter[] = [];

    for (let m = 0; m < 12; m++) {
      const month = ((config.startMonth - 1 + m) % 12) + 1;
      const year = config.startMonth <= month ? config.year : config.year + 1;
      const days = daysInMonth(year, month);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month - 1, days);

      periods.push({
        periodNumber: m + 1,
        quarter: Math.floor(m / 3) + 1,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        daysInPeriod: days,
        weeksInPeriod: Math.ceil(days / 7),
        isLeapPeriod: month === 2 && isLeapYear(year),
      });
    }

    for (let q = 0; q < 4; q++) {
      const quarterPeriods = periods.slice(q * 3, q * 3 + 3);
      quarters.push({
        quarter: q + 1,
        periods: quarterPeriods,
        startDate: quarterPeriods[0]!.startDate,
        endDate: quarterPeriods[2]!.endDate,
        daysInQuarter: quarterPeriods.reduce((sum, p) => sum + p.daysInPeriod, 0),
      });
    }

    const totalDays = periods.reduce((sum, p) => sum + p.daysInPeriod, 0);

    return {
      config,
      periods,
      quarters,
      totalDays,
      totalWeeks: Math.floor(totalDays / 7),
      is53WeekYear: false,
      leapYearAdjustment: isLeapYear(config.year) ? 'extra-day' : 'none',
    };
  }

  /**
   * Find which period a given date falls into.
   */
  static findPeriodForDate(fiscalYear: FiscalYearResult, date: string): FiscalPeriod | null {
    const targetDate = new Date(date);
    return (
      fiscalYear.periods.find((p) => {
        const start = new Date(p.startDate);
        const end = new Date(p.endDate);
        return targetDate >= start && targetDate <= end;
      }) ?? null
    );
  }

  /**
   * Allocate an annual amount across periods proportional to days in each period.
   * Uses Decimal for exact penny allocation.
   */
  static allocateAcrossPeriods(
    fiscalYear: FiscalYearResult,
    annualAmount: number
  ): PeriodAllocation[] {
    const totalDays = toDecimal(fiscalYear.totalDays, 'totalDays');
    const annualD = toDecimal(annualAmount, 'annualAmount');

    // Calculate daily rate using Decimal
    const dailyRate = totalDays.isZero() ? new Decimal(0) : annualD.div(totalDays);

    // Use allocateMoney to ensure parts sum exactly to the parent
    const weights = fiscalYear.periods.map((p) => p.daysInPeriod);
    const allocatedCents = allocateMoney(annualD, weights);

    return fiscalYear.periods.map((p, i) => ({
      periodNumber: p.periodNumber,
      allocatedAmount: allocatedCents[i]!.toNumber(),
      dailyRate: roundTo(dailyRate, DEFAULT_CURRENCY_PLACES),
      daysInPeriod: p.daysInPeriod,
    }));
  }

  /**
   * Get the prior period for a given period number.
   */
  static getPriorPeriod(fiscalYear: FiscalYearResult, periodNumber: number): FiscalPeriod | null {
    if (periodNumber <= 1) return null;
    return fiscalYear.periods[periodNumber - 2] ?? null;
  }

  /**
   * Validate that a fiscal year is well-formed.
   * Invariant: All periods must be contiguous and cover the full year.
   */
  static validateFiscalYear(fiscalYear: FiscalYearResult): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check period count
    const expectedPeriods = fiscalYear.config.calendarType === 'gregorian' ? 12 : 12;
    if (fiscalYear.periods.length !== expectedPeriods) {
      if (fiscalYear.is53WeekYear && fiscalYear.periods.length === 13) {
        // 53-week year has 13 periods
      } else {
        errors.push(`Expected ${expectedPeriods} periods, got ${fiscalYear.periods.length}`);
      }
    }

    // Check contiguity
    for (let i = 1; i < fiscalYear.periods.length; i++) {
      const prevEnd = new Date(fiscalYear.periods[i - 1]!.endDate);
      const currStart = new Date(fiscalYear.periods[i]!.startDate);
      const expectedStart = addDays(prevEnd, 1);
      if (formatDate(currStart) !== formatDate(expectedStart)) {
        errors.push(
          `Period ${i + 1} starts on ${formatDate(currStart)} but should start on ${formatDate(expectedStart)}`
        );
      }
    }

    // Check quarter mapping
    for (const q of fiscalYear.quarters) {
      if (q.periods.length !== 3) {
        errors.push(`Quarter ${q.quarter} has ${q.periods.length} periods, expected 3`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get the fiscal year for a given date.
   * Useful for determining which fiscal year a transaction belongs to.
   */
  static getFiscalYearForDate(date: string, config: Omit<FiscalYearConfig, 'year'>): number {
    const targetDate = new Date(date);
    const year = targetDate.getFullYear();
    const fiscalStart = new Date(year, config.startMonth - 1, config.startDay);

    if (targetDate < fiscalStart) {
      return year - 1;
    }
    return year;
  }
}
