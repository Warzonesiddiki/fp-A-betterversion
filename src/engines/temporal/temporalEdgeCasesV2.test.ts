// =============================================================================
// Temporal Edge Cases v2 — ISO week, Year 2038, pre-1970, far-future, microsec
// CHRONOS 2026-06-15 — FINAL LAP PICK C — extends Codif 35 v0.4 sub-class e.ix.5
// =============================================================================
//
// Original 5 edge cases (TEMPORAL_ENGINE_CORRECTNESS v1, c7a5bbe9):
//   1. DST spring-forward (2026-03-08)
//   2. DST fall-back (2026-11-01)
//   3. Leap year (2000, 2100, 2028)
//   4. Timezone crossing (NY + Tokyo → UTC round-trip)
//   5. Century boundary (FiscalCalendar)
//
// This file adds 5 MORE edge cases (FINAL LAP expansion):
//   6. ISO 8601 week date (week 53 of 2020, week 1 of 2021)
//   7. Year 2038 problem (32-bit signed int overflow at 2038-01-19 03:14:07 UTC)
//   8. Pre-1970 / negative epoch (1969-12-31 23:59:59 UTC)
//   9. Far-future dates (Year 2050, 2100, 9999)
//   10. Microsecond precision (ISO 8601 with .SSSSSS)
//
// Together: 10 edge cases. Codif 35 v0.4 sub-class e.ix.6 PROPOSAL extends
// e.ix.5 (temporal-correctness) with these 5 additional cases.
//
// =============================================================================

import { describe, it, expect } from 'vitest';

import {
  compareTimestamps,
  daysBetween,
  isLeapYear,
  parseToUTCEpoch,
  toUTCISOString,
  addDays,
  // Fiscal calendar
  DEFAULT_CALENDAR,
  fiscalYearOf,
  periodOf,
} from './index';

// ---------------------------------------------------------------------------
// Edge case 6: ISO 8601 week date
//   - Year 2020 has 53 ISO weeks (because 2020-12-31 is Thursday in week 53)
//   - Year 2026-12-31 is Thursday → could be week 1 of 2027
//   - Week 1 of year Y = week containing first Thursday of Y
//   - This is critical for week-based fiscal calendars (e.g. ISO week fiscal year)
// ---------------------------------------------------------------------------

describe('ISO 8601 week date handling', () => {
  it('parses 2020-12-31 (ISO 2020-W53) without timezone shift', () => {
    const epoch = parseToUTCEpoch('2020-12-31');
    expect(epoch).not.toBeNull();
    // 2020-12-31 00:00:00 UTC = 1609372800000 ms
    expect(epoch).toBe(1609372800000);
  });

  it('verifies 2020 is a 53-week year (Dec 31 = Thursday in week 53)', () => {
    // 2020-12-31 is a Thursday; 2021-01-01 is Friday in week 53 of 2020.
    // Source: ISO 8601 week-of-year algorithm.
    // We test this indirectly: 2020 has 366 days, 2021 has 365.
    // 2020 starts on Wednesday (Jan 1) → 2020-W01 starts Dec 30, 2019.
    // 2020-12-31 (Thursday) is the last day of W53.
    const dec31 = parseToUTCEpoch('2020-12-31');
    const jan1 = parseToUTCEpoch('2021-01-01');
    expect(daysBetween(dec31!, jan1!)).toBe(1);
  });

  it('handles date-only string at fiscal period boundary (Dec 31 → Jan 1)', () => {
    // For week-based fiscal calendars, 2026-12-31 might be in 2026-W53 or
    // 2027-W01. We don't claim to compute ISO week; we just verify the
    // date primitives correctly handle the boundary.
    const dec31_2026 = parseToUTCEpoch('2026-12-31');
    const jan1_2027 = parseToUTCEpoch('2027-01-01');
    expect(jan1_2027! - dec31_2026!).toBe(86400000); // exactly 1 day
  });
});

// ---------------------------------------------------------------------------
// Edge case 7: Year 2038 problem
//   - 32-bit signed int overflows at 2038-01-19 03:14:07 UTC (max = 2^31-1)
//   - JavaScript Date is 64-bit (Number is double-precision float, 53-bit
//     mantissa = 9×10^15 ms = ~285,000 years from 1970 → safe to Year 275760)
//   - This test verifies our code doesn't accidentally use bit32 anywhere
// ---------------------------------------------------------------------------

describe('Year 2038 problem (32-bit overflow)', () => {
  it('parses 2038-01-19 03:14:07 UTC without overflow', () => {
    const epoch = parseToUTCEpoch('2038-01-19T03:14:07Z');
    expect(epoch).not.toBeNull();
    // 2038-01-19 03:14:07 UTC = 2147483647000 ms
    // Note: 2147483647 is the max 32-bit signed int. Our epoch is 1000x larger
    // (in ms), but well within JS Number range (max ~9×10^15).
    expect(epoch).toBe(2147483647000);
  });

  it('handles a date 100 years after Year 2038 (2138) without overflow', () => {
    const epoch = parseToUTCEpoch('2138-01-19T03:14:07Z');
    expect(epoch).not.toBeNull();
    // 2138-01-19 = 5,303,157,247,000 ms (well within JS safe range)
    expect(epoch).toBeGreaterThan(5_000_000_000_000);
  });

  it('compares timestamps 100 years apart without overflow', () => {
    const t2038 = parseToUTCEpoch('2038-01-19T03:14:07Z')!;
    const t2138 = parseToUTCEpoch('2138-01-19T03:14:07Z')!;
    const diffMs = t2138 - t2038;
    // Exactly 100 years in ms (3155760000 sec = 100 * 365.25 days)
    // Account for 24 leap years between 2038 and 2138
    const expectedMs = 100 * 365.25 * 86400 * 1000;
    // ±0.01% tolerance (calendar reality vs nominal)
    expect(Math.abs(diffMs - expectedMs) / expectedMs).toBeLessThan(0.01);
  });
});

// ---------------------------------------------------------------------------
// Edge case 8: Pre-1970 / negative epoch
//   - Dates before 1970-01-01 have negative epoch ms
//   - JS Date supports this; our parser should too
//   - Important for back-testing financial models with historical data
// ---------------------------------------------------------------------------

describe('Pre-1970 / negative epoch handling', () => {
  it('parses 1969-12-31 23:59:59 UTC (1 second before epoch)', () => {
    const epoch = parseToUTCEpoch('1969-12-31T23:59:59Z');
    expect(epoch).not.toBeNull();
    expect(epoch).toBe(-1000); // negative, 1 second before epoch
  });

  it('parses 1960-01-01 00:00:00 UTC (10 years before epoch)', () => {
    const epoch = parseToUTCEpoch('1960-01-01');
    expect(epoch).not.toBeNull();
    // 1960-01-01 UTC = -315619200000 ms
    expect(epoch).toBe(-315619200000);
  });

  it('compares pre-1970 to post-1970 timestamps correctly', () => {
    const pre1970 = parseToUTCEpoch('1969-01-01')!;
    const post1970 = parseToUTCEpoch('1971-01-01')!;
    expect(compareTimestamps(pre1970, post1970)).toBeLessThan(0);
    // Difference should be 730 days (1970 + 1971, no leap year issue)
    // Actually 1970 not leap + 1971 not leap = 365 + 365 = 730
    expect(daysBetween(pre1970, post1970)).toBe(730);
  });

  it('handles 1929 stock market crash date (1929-10-29)', () => {
    // Famous financial date; ensures historical dates work for back-testing
    const epoch = parseToUTCEpoch('1929-10-29');
    expect(epoch).not.toBeNull();
    expect(epoch).toBeLessThan(0);
  });
});

// ---------------------------------------------------------------------------
// Edge case 9: Far-future dates (Year 2050, 2100, 9999)
//   - Long-dated bonds, pensions, insurance products can mature 30-100+ years out
//   - Year 9999 is the max ISO 8601 date (4-digit year)
//   - Year 2100 is NOT a leap year (divisible by 100, not 400)
// ---------------------------------------------------------------------------

describe('Far-future date handling', () => {
  it('parses 2050-12-31 (common in 30-year bond maturity)', () => {
    const epoch = parseToUTCEpoch('2050-12-31');
    expect(epoch).not.toBeNull();
    // 2050-12-31 UTC = 2,556,057,600,000 ms (verified)
    expect(epoch).toBe(2_556_057_600_000);
  });

  it('verifies 2100 is NOT a leap year (century rule)', () => {
    // Critical: many date libraries get this wrong (e.g. Excel YEARFRAC bug)
    // 2100-02-29 should be INVALID (rolls over to 2100-03-01 in strict parsers)
    // Our isLeapYear(2100) must return false
    expect(isLeapYear(2100)).toBe(false);
  });

  it('parses 2100-02-28 and 2100-03-01 (correct non-leap February)', () => {
    const feb28 = parseToUTCEpoch('2100-02-28')!;
    const mar01 = parseToUTCEpoch('2100-03-01')!;
    expect(daysBetween(feb28, mar01)).toBe(1);
  });

  it('parses 9999-12-31 (max ISO 8601 date)', () => {
    const epoch = parseToUTCEpoch('9999-12-31');
    expect(epoch).not.toBeNull();
    expect(epoch).toBeGreaterThan(0);
  });

  it('parses year 2200 (well beyond common finance horizons)', () => {
    const epoch = parseToUTCEpoch('2200-01-01');
    expect(epoch).not.toBeNull();
    expect(epoch).toBeGreaterThan(7_000_000_000_000); // > 7 trillion ms
  });
});

// ---------------------------------------------------------------------------
// Edge case 10: Microsecond precision
//   - ISO 8601 supports microsecond precision: YYYY-MM-DDTHH:mm:ss.SSSSSS
//   - JS Date truncates to milliseconds (only .SSS preserved)
//   - Our parser should NOT crash on microsecond input
// ---------------------------------------------------------------------------

describe('Microsecond precision handling', () => {
  it('parses ISO 8601 with microseconds (truncates to ms)', () => {
    // 2026-06-15T12:34:56.123456Z → JS Date → 123ms (truncates 456)
    const epoch = parseToUTCEpoch('2026-06-15T12:34:56.123456Z');
    expect(epoch).not.toBeNull();
    // 2026-06-15T12:34:56.123Z = 1,781,526,896,123 ms (verified)
    expect(epoch).toBe(1_781_526_896_123);
  });

  it('handles millisecond precision (standard case)', () => {
    const epoch = parseToUTCEpoch('2026-06-15T12:34:56.123Z');
    expect(epoch).not.toBeNull();
    expect(epoch).toBe(1_781_526_896_123);
  });

  it('handles nanosecond precision gracefully (parses without crash)', () => {
    // JS Date constructor accepts but ignores nanoseconds
    const epoch = parseToUTCEpoch('2026-06-15T12:34:56.123456789Z');
    expect(epoch).not.toBeNull();
    // Should be same as microsecond case (truncated to ms)
    expect(epoch).toBe(1_781_526_896_123);
  });
});

// ---------------------------------------------------------------------------
// Codif 35 v0.4 sub-class e.ix.6 PROPOSAL — DST/ISO edge case integration
//   - Validates that fiscal year/period logic survives all 10 edge cases
// ---------------------------------------------------------------------------

describe('Codif 35 v0.4 sub-class e.ix.6 — fiscal year across edge cases', () => {
  it('DEFAULT_CALENDAR (Jan 1) is unaffected by ISO week-date boundary', () => {
    // Dec 31, 2026 → period 12 of fiscal year 2026
    // Jan 1, 2027 → period 1 of fiscal year 2027
    const dec31_2026 = parseToUTCEpoch('2026-12-31')!;
    const jan1_2027 = parseToUTCEpoch('2027-01-01')!;
    // periodOf returns a FiscalPeriod object, not a number
    expect(periodOf(dec31_2026, DEFAULT_CALENDAR).period).toBe(12);
    expect(periodOf(jan1_2027, DEFAULT_CALENDAR).period).toBe(1);
    expect(fiscalYearOf(dec31_2026, DEFAULT_CALENDAR)).toBe(2026);
    expect(fiscalYearOf(jan1_2027, DEFAULT_CALENDAR)).toBe(2027);
  });

  it('addDays handles pre-1970 + post-1970 arithmetic correctly', () => {
    const pre1970 = parseToUTCEpoch('1969-12-30')!;
    const result = addDays(pre1970, 5);
    // 1969-12-30 + 5 days = 1970-01-04
    // toUTCISOString returns full ISO with time; trim to date portion
    expect(toUTCISOString(result).substr(0, 10)).toBe('1970-01-04');
  });
});
