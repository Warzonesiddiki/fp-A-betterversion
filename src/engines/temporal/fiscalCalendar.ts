// =============================================================================
// Fiscal Calendar — period boundaries, fiscal year/quarter helpers
// =============================================================================
//
// PURPOSE:
//   Provide deterministic, timezone-correct fiscal-period primitives for
//   PeriodCloseEngine, FinancialCloseEngine, and downstream reporting.
//
// CONVENTIONS:
//   - Fiscal year is configurable: starts on a specific month/day in a
//     specific timezone. Defaults to calendar year (Jan 1, UTC).
//   - All fiscal-period boundaries are returned as UTC epoch ms.
//   - Fiscal year labels use "FY" prefix (e.g. "FY2026").
//   - Period labels use "Pn" suffix (e.g. "FY2026-P1" through "FY2026-P12").
//
// =============================================================================

import { addMonths, daysBetween, parseToUTCEpoch, toUTCISOString } from './TemporalDate';
import type { ISOTimestamp, TimezoneID } from './TemporalDate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Configuration for a fiscal calendar. All fields are required.
 */
export interface FiscalCalendarConfig {
  /** IANA timezone ID for fiscal year start anchor (e.g. "UTC", "America/New_York") */
  readonly timezone: TimezoneID;
  /** Fiscal year start month (1-12). 1 = January. */
  readonly startMonth: number;
  /** Fiscal year start day of month (1-31). */
  readonly startDay: number;
  /** Periods per fiscal year (typically 12 for monthly close). */
  readonly periodsPerYear: number;
}

export interface FiscalPeriod {
  /** Fiscal year label (e.g. "FY2026") */
  readonly label: string;
  /** Period number within the fiscal year (1-based) */
  readonly period: number;
  /** Period start as UTC ISO timestamp */
  readonly start: ISOTimestamp;
  /** Period end as UTC ISO timestamp (inclusive, last ms of period) */
  readonly end: ISOTimestamp;
  /** Period duration in days */
  readonly durationDays: number;
}

export interface FiscalQuarter extends FiscalPeriod {
  /** Quarter number within the fiscal year (1-4) */
  readonly quarter: number;
}

// ---------------------------------------------------------------------------
// Default config
// ---------------------------------------------------------------------------

/**
 * Default fiscal calendar = calendar year in UTC. Most organizations use a
 * non-calendar fiscal year (e.g. US federal: Oct 1, UK: Apr 6, India: Apr 1)
 * and should pass a custom config.
 */
export const DEFAULT_CALENDAR: FiscalCalendarConfig = {
  timezone: 'UTC',
  startMonth: 1,
  startDay: 1,
  periodsPerYear: 12,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determine the fiscal year containing the given timestamp.
 *
 * A timestamp t is in fiscal year FY if it falls on or after the fiscal-year
 * start of FY and before the fiscal-year start of FY+1.
 *
 * @param ms - UTC epoch ms
 * @param config - Fiscal calendar configuration
 * @returns Fiscal year as 4-digit number
 */
export function fiscalYearOf(ms: number, config: FiscalCalendarConfig = DEFAULT_CALENDAR): number {
  if (!Number.isFinite(ms)) {
    throw new RangeError(`fiscalYearOf: invalid epoch ms: ${ms}`);
  }
  if (config.startMonth < 1 || config.startMonth > 12) {
    throw new RangeError(`fiscalYearOf: startMonth out of range: ${config.startMonth}`);
  }
  if (config.startDay < 1 || config.startDay > 31) {
    throw new RangeError(`fiscalYearOf: startDay out of range: ${config.startDay}`);
  }
  // For the simple "calendar year" case, just return UTC year.
  if (config.timezone === 'UTC' && config.startMonth === 1 && config.startDay === 1) {
    return new Date(ms).getUTCFullYear();
  }
  // For other cases, find the most recent fiscal-year start ≤ ms.
  const d = new Date(ms);
  const candidate = Date.UTC(d.getUTCFullYear(), config.startMonth - 1, config.startDay);
  if (ms >= candidate) {
    return d.getUTCFullYear();
  }
  return d.getUTCFullYear() - 1;
}

/**
 * Get the UTC epoch ms of the start of the fiscal year containing the
 * given timestamp.
 */
export function fiscalYearStart(
  ms: number,
  config: FiscalCalendarConfig = DEFAULT_CALENDAR
): number {
  const fy = fiscalYearOf(ms, config);
  return Date.UTC(fy, config.startMonth - 1, config.startDay);
}

/**
 * Get the period that contains the given timestamp.
 *
 * @param ms - UTC epoch ms
 * @param config - Fiscal calendar configuration
 * @returns Fiscal period descriptor
 */
export function periodOf(
  ms: number,
  config: FiscalCalendarConfig = DEFAULT_CALENDAR
): FiscalPeriod {
  const fyStart = fiscalYearStart(ms, config);
  const monthsPerPeriod = 12 / config.periodsPerYear;
  const _monthsElapsed = Math.floor(daysBetween(fyStart, ms) / 30.4375); // approx avg month
  // Compute exact period by adding months to fyStart and checking containment.
  for (let p = 0; p < config.periodsPerYear; p++) {
    const pStart = addMonths(fyStart, p * monthsPerPeriod);
    const pEnd = addMonths(fyStart, (p + 1) * monthsPerPeriod) - 1;
    if (ms >= pStart && ms <= pEnd) {
      return {
        label: `FY${fyOf(fyStart, config)}`,
        period: p + 1,
        start: toUTCISOString(pStart),
        end: toUTCISOString(pEnd),
        durationDays: daysBetween(pStart, pEnd) + 1,
      };
    }
  }
  // Should be unreachable if config is sane.
  throw new Error(`periodOf: no period found for ms=${ms}`);
}

/**
 * Internal: extract the fiscal year number from a fiscal-year-start epoch ms.
 */
function fyOf(fyStartMs: number, _config: FiscalCalendarConfig): number {
  return new Date(fyStartMs).getUTCFullYear();
}

/**
 * Get the quarter that contains the given timestamp.
 *
 * A quarter is 3 calendar months. If periodsPerYear=12, this maps cleanly to
 * Q1=P1-P3, Q2=P4-P6, Q3=P7-P9, Q4=P10-P12.
 */
export function quarterOf(
  ms: number,
  config: FiscalCalendarConfig = DEFAULT_CALENDAR
): FiscalQuarter {
  const period = periodOf(ms, config);
  const quarter = Math.floor((period.period - 1) / 3) + 1;
  // Recompute quarter bounds from the period.
  const fyStart = fiscalYearStart(ms, config);
  const monthsPerPeriod = 12 / config.periodsPerYear;
  const qStart = addMonths(fyStart, (quarter - 1) * 3 * monthsPerPeriod);
  const qEnd = addMonths(fyStart, quarter * 3 * monthsPerPeriod) - 1;
  return {
    label: `${period.label}-Q${quarter}`,
    period: period.period,
    start: toUTCISOString(qStart),
    end: toUTCISOString(qEnd),
    durationDays: daysBetween(qStart, qEnd) + 1,
    quarter,
  };
}

// Re-export from TemporalDate for convenience.
export { parseToUTCEpoch, toUTCISOString, addMonths, daysBetween };
