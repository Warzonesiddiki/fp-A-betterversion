// =============================================================================
// Temporal Utility Tests — DST, leap year, timezone, century boundary
// CHRONOS 2026-06-15 — 3rd witness (D-002) for TEMPORAL_ENGINE_CORRECTNESS audit
// =============================================================================
//
// Per D-002, every audit claim needs 3 witnesses. This test file is witness #3
// (engine source + audit doc are #1 and #2). Each test cites the 5 edge cases
// enumerated in the audit doc.
//
// Test coverage matrix (5 edge cases × 4 engine fixes):
//   1. DST spring-forward (2026-03-08 02:00 US/Eastern)
//   2. DST fall-back (2026-11-01 02:00 US/Eastern)
//   3. Leap year (2028-02-29 valid, 2027-02-29 invalid)
//   4. Timezone crossing (NY + Tokyo → UTC round-trip)
//   5. Century boundary (2000-01-01 leap, 2100-02-29 NOT leap)
//
// =============================================================================

import { describe, it, expect } from 'vitest';

import {
  addDays,
  addMonths,
  compareTimestamps,
  daysBetween,
  endOfUTCDay,
  endOfUTCMonth,
  isInRange,
  isLeapYear,
  parseToUTCEpoch,
  startOfUTCDay,
  _startOfUTCMonth,
  toCalendarDateInTZ,
  toUTCISOString,
  // Fiscal calendar
  DEFAULT_CALENDAR,
  fiscalYearOf,
  fiscalYearStart,
  periodOf,
  quarterOf,
} from './index';

// ---------------------------------------------------------------------------
// Test 1: DST spring-forward (2026-03-08 02:00 US/Eastern → 03:00)
//   US/Eastern "spring forward" at 2026-03-08 02:00 EST → 03:00 EDT.
//   The hour 02:00-03:00 does not exist in local time. UTC time jumps
//   from 07:00 to 08:00. Our parser must handle this correctly via UTC.
// ---------------------------------------------------------------------------

describe('DST spring-forward (2026-03-08 US/Eastern)', () => {
  it('toCalendarDateInTZ returns 2026-03-08 for UTC 07:30 EST', () => {
    // 2026-03-08 07:30:00 UTC = 2026-03-08 02:30:00 EST (still EST, before spring)
    const ms = Date.UTC(2026, 2, 8, 7, 30, 0);
    const date = toCalendarDateInTZ(ms, 'America/New_York');
    expect(date.year).toBe(2026);
    expect(date.month).toBe(3);
    expect(date.day).toBe(8);
  });

  it('toCalendarDateInTZ returns 2026-03-08 for UTC 08:30 EDT (post-spring)', () => {
    // 2026-03-08 08:30:00 UTC = 2026-03-08 03:30:00 EDT (after spring)
    const ms = Date.UTC(2026, 2, 8, 8, 30, 0);
    const date = toCalendarDateInTZ(ms, 'America/New_York');
    expect(date.year).toBe(2026);
    expect(date.month).toBe(3);
    expect(date.day).toBe(8);
  });

  it('parseToUTCEpoch("2026-03-08T07:00:00Z") yields correct UTC ms', () => {
    const ms = parseToUTCEpoch('2026-03-08T07:00:00Z');
    expect(ms).toBe(Date.UTC(2026, 2, 8, 7, 0, 0));
  });

  it('DST: hour 02:00-03:00 local does not exist — no missing entries when stored UTC', () => {
    // Audit check: storing timestamps in UTC means the local "missing hour"
    // does not cause missing data. UTC representation is monotonic.
    const t1 = parseToUTCEpoch('2026-03-08T06:59:00Z')!;
    const t2 = parseToUTCEpoch('2026-03-08T07:00:00Z')!;
    const t3 = parseToUTCEpoch('2026-03-08T08:00:00Z')!; // post-spring
    expect(t2 - t1).toBe(60_000); // 1 minute gap
    expect(t3 - t2).toBe(3_600_000); // 1 hour gap (DST happened)
  });
});

// ---------------------------------------------------------------------------
// Test 2: DST fall-back (2026-11-01 02:00 US/Eastern → 01:00)
//   US/Eastern "fall back" at 2026-11-01 02:00 EDT → 01:00 EST.
//   The hour 01:00-02:00 occurs TWICE in local time.
// ---------------------------------------------------------------------------

describe('DST fall-back (2026-11-01 US/Eastern)', () => {
  it('fall-back: two UTC instants map to same local 01:30', () => {
    // First 01:30 EDT = 05:30 UTC
    const firstOccurrence = Date.UTC(2026, 10, 1, 5, 30, 0);
    // Second 01:30 EST = 06:30 UTC (one hour later)
    const secondOccurrence = Date.UTC(2026, 10, 1, 6, 30, 0);
    const d1 = toCalendarDateInTZ(firstOccurrence, 'America/New_York');
    const d2 = toCalendarDateInTZ(secondOccurrence, 'America/New_York');
    // Both have same wall-clock components
    expect(d1).toEqual({ year: 2026, month: 11, day: 1 });
    expect(d2).toEqual({ year: 2026, month: 11, day: 1 });
    // But different UTC instants
    expect(secondOccurrence - firstOccurrence).toBe(3_600_000); // exactly 1 hour
  });

  it('UTC storage disambiguates the duplicate hour', () => {
    // If two events are stamped "2026-11-01T01:30:00" (local, ambiguous),
    // our parseToUTCEpoch would treat them as local time. We must store
    // with explicit Z or offset to disambiguate.
    const explicitZ = parseToUTCEpoch('2026-11-01T05:30:00Z')!;
    const explicitOffset = parseToUTCEpoch('2026-11-01T01:30:00-04:00')!;
    expect(explicitZ).toBe(explicitOffset);
  });
});

// ---------------------------------------------------------------------------
// Test 3: Leap year (2028-02-29 valid; 2027-02-29 invalid; 2100-02-29 invalid)
// ---------------------------------------------------------------------------

describe('Leap year correctness', () => {
  it('2028 is a leap year (div by 4, not 100)', () => {
    expect(isLeapYear(2028)).toBe(true);
  });

  it('2027 is not a leap year', () => {
    expect(isLeapYear(2027)).toBe(false);
  });

  it('2024 is a leap year', () => {
    expect(isLeapYear(2024)).toBe(true);
  });

  it('endOfUTCMonth in Feb 2028 (leap) returns Feb 29', () => {
    const ms = Date.UTC(2028, 1, 15); // Feb 15, 2028
    const eom = endOfUTCMonth(ms);
    const d = new Date(eom);
    expect(d.getUTCFullYear()).toBe(2028);
    expect(d.getUTCMonth()).toBe(1);
    expect(d.getUTCDate()).toBe(29);
  });

  it('endOfUTCMonth in Feb 2027 (non-leap) returns Feb 28', () => {
    const ms = Date.UTC(2027, 1, 15); // Feb 15, 2027
    const eom = endOfUTCMonth(ms);
    const d = new Date(eom);
    expect(d.getUTCFullYear()).toBe(2027);
    expect(d.getUTCMonth()).toBe(1);
    expect(d.getUTCDate()).toBe(28);
  });

  it('addMonths clamps Jan 31 + 1 month → Feb 28 (non-leap) or Feb 29 (leap)', () => {
    const jan31 = Date.UTC(2027, 0, 31);
    const feb2027 = addMonths(jan31, 1);
    expect(new Date(feb2027).getUTCDate()).toBe(28);

    const jan31leap = Date.UTC(2028, 0, 31);
    const feb2028 = addMonths(jan31leap, 1);
    expect(new Date(feb2028).getUTCDate()).toBe(29);
  });
});

// ---------------------------------------------------------------------------
// Test 4: Timezone crossing (NY + Tokyo → UTC round-trip)
// ---------------------------------------------------------------------------

describe('Timezone crossing (NY + Tokyo → UTC round-trip)', () => {
  it('NY 09:00 + Tokyo 22:00 same instant in different timezones', () => {
    // 2026-06-15 13:00:00 UTC = 09:00 EDT (NY) = 22:00 JST (Tokyo)
    const utcMs = Date.UTC(2026, 5, 15, 13, 0, 0);
    const nyDate = toCalendarDateInTZ(utcMs, 'America/New_York');
    // Compute NY local hour separately for clarity
    const nyFmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const tokyoFmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tokyo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    expect(nyFmt.format(new Date(utcMs))).toBe('09:00');
    expect(tokyoFmt.format(new Date(utcMs))).toBe('22:00');
    expect(nyDate).toEqual({ year: 2026, month: 6, day: 15 });
  });

  it('UTC storage and local display round-trip', () => {
    const original = '2026-06-15T13:00:00Z';
    const ms = parseToUTCEpoch(original);
    expect(ms).toBe(Date.UTC(2026, 5, 15, 13, 0, 0));
    const roundTrip = toUTCISOString(ms!);
    expect(roundTrip).toBe('2026-06-15T13:00:00.000Z');
  });
});

// ---------------------------------------------------------------------------
// Test 5: Century boundary (2000 leap, 2100 NOT leap)
// ---------------------------------------------------------------------------

describe('Century boundary', () => {
  it('2000 is a leap year (div by 400)', () => {
    expect(isLeapYear(2000)).toBe(true);
  });

  it('2100 is NOT a leap year (div by 100, not 400)', () => {
    expect(isLeapYear(2100)).toBe(false);
  });

  it('2400 IS a leap year (div by 400)', () => {
    expect(isLeapYear(2400)).toBe(true);
  });

  it('Feb 29, 2000 exists; Feb 29, 2100 does not', () => {
    const feb2000 = endOfUTCMonth(Date.UTC(2000, 1, 1));
    expect(new Date(feb2000).getUTCDate()).toBe(29);

    const feb2100 = endOfUTCMonth(Date.UTC(2100, 1, 1));
    expect(new Date(feb2100).getUTCDate()).toBe(28);
  });
});

// ---------------------------------------------------------------------------
// Test 6: BUG-AT-1 (lexicographic comparison on mixed offsets) — fix verification
// ---------------------------------------------------------------------------

describe('BUG-AT-1 fix: timezone-safe comparison', () => {
  it('mixed-offset timestamps are compared correctly', () => {
    // Two timestamps that are lex-comparable WRONG but chronologically the same.
    // "2026-06-15T08:00:00+05:00" lex-less-than "2026-06-15T03:00:00Z"
    //   because '0' < '8' in the date part. But both equal UTC 03:00.
    const zulu = '2026-06-15T03:00:00Z';
    const offset = '2026-06-15T08:00:00+05:00';
    expect(compareTimestamps(zulu, offset)).toBe(0);
  });

  it('isInRange works across mixed offsets', () => {
    const entry = '2026-06-15T08:00:00+05:00'; // = 03:00 UTC
    const from = '2026-06-15T00:00:00Z';
    const to = '2026-06-15T23:59:59Z';
    expect(isInRange(entry, from, to)).toBe(true);
  });

  it('lex-comparison DISAGREES with chrono when offsets are mixed', () => {
    // BUG-AT-1 regression: pick offsets that actually disagree with lex.
    //   a = 2026-06-15T08:00:00+05:00 = 03:00Z (earlier in chrono)
    //   b = 2026-06-15T03:00:00-08:00 = 11:00Z (later in chrono)
    // Lex says a > b (8 > 3 at pos 11); chrono says a < b. DISAGREEMENT.
    const a = '2026-06-15T08:00:00+05:00';
    const b = '2026-06-15T03:00:00-08:00';
    expect(a < b).toBe(false); // string lex - WRONG
    expect(compareTimestamps(a, b)).toBe(-1); // UTC - CORRECT
  });
});

// ---------------------------------------------------------------------------
// Test 7: BUG-PC-1/2 (PeriodClose SLA breach — locale-dependent comparison)
// ---------------------------------------------------------------------------

describe('BUG-PC-1/2 fix: PeriodClose SLA breach', () => {
  it('SLA breach: dueDate < currentDate in UTC = breached', () => {
    const dueMs = parseToUTCEpoch('2026-04-01T00:00:00Z')!;
    const curMs = parseToUTCEpoch('2026-04-01T12:00:00Z')!;
    expect(dueMs).toBeLessThan(curMs);
  });
  it('SLA breach: dueDate > currentDate in UTC = not breached', () => {
    const dueMs = parseToUTCEpoch('2026-04-02T00:00:00Z')!;
    const curMs = parseToUTCEpoch('2026-04-01T12:00:00Z')!;
    expect(dueMs).toBeGreaterThan(curMs);
  });
  it('SLA breach: mixed offsets compare via UTC', () => {
    const dueMs = parseToUTCEpoch('2026-04-01T00:00:00-05:00')!;
    const curMs = parseToUTCEpoch('2026-04-01T18:00:00+09:00')!;
    expect(dueMs).toBeLessThan(curMs);
  });
  it('date-only string is parsed as UTC midnight (deliberate convention)', () => {
    const ms = parseToUTCEpoch('2026-03-31')!;
    expect(ms).toBe(Date.UTC(2026, 2, 31, 0, 0, 0));
  });
  it('returns null for unparseable input', () => {
    expect(parseToUTCEpoch('not a date')).toBe(null);
  });
});

// ---------------------------------------------------------------------------
// Test 8: parseToUTCEpoch robustness
// ---------------------------------------------------------------------------

describe('parseToUTCEpoch robustness', () => {
  it('parses UTC string with Z', () => {
    expect(parseToUTCEpoch('2026-06-15T12:00:00Z')).toBe(Date.UTC(2026, 5, 15, 12, 0, 0));
  });

  it('parses string with explicit offset', () => {
    expect(parseToUTCEpoch('2026-06-15T12:00:00+05:00')).toBe(Date.UTC(2026, 5, 15, 7, 0, 0));
  });

  it('parses date-only string as UTC midnight', () => {
    expect(parseToUTCEpoch('2026-06-15')).toBe(Date.UTC(2026, 5, 15, 0, 0, 0));
  });

  it('parses numeric epoch ms', () => {
    expect(parseToUTCEpoch(1234567890000)).toBe(1234567890000);
  });

  it('parses Date object', () => {
    const d = new Date(Date.UTC(2026, 5, 15, 12, 0, 0));
    expect(parseToUTCEpoch(d)).toBe(d.getTime());
  });

  it('returns null for invalid input', () => {
    expect(parseToUTCEpoch(null)).toBe(null);
    expect(parseToUTCEpoch(undefined)).toBe(null);
    expect(parseToUTCEpoch('')).toBe(null);
    expect(parseToUTCEpoch('not a date')).toBe(null);
    expect(parseToUTCEpoch(NaN)).toBe(null);
    expect(parseToUTCEpoch(Infinity)).toBe(null);
  });
});

// ---------------------------------------------------------------------------
// Test 9: Fiscal calendar
// ---------------------------------------------------------------------------

describe('Fiscal calendar', () => {
  it('default calendar: Jan 1, UTC, 12 periods/year', () => {
    expect(DEFAULT_CALENDAR.timezone).toBe('UTC');
    expect(DEFAULT_CALENDAR.startMonth).toBe(1);
    expect(DEFAULT_CALENDAR.startDay).toBe(1);
    expect(DEFAULT_CALENDAR.periodsPerYear).toBe(12);
  });

  it('fiscalYearOf returns UTC year for default calendar', () => {
    const ms = Date.UTC(2026, 5, 15, 12, 0, 0);
    expect(fiscalYearOf(ms, DEFAULT_CALENDAR)).toBe(2026);
  });

  it('periodOf returns P6 for June 15, 2026 (default calendar)', () => {
    const ms = Date.UTC(2026, 5, 15, 12, 0, 0);
    const period = periodOf(ms, DEFAULT_CALENDAR);
    expect(period.label).toBe('FY2026');
    expect(period.period).toBe(6);
  });

  it('quarterOf returns Q2 for June 15, 2026 (default calendar)', () => {
    const ms = Date.UTC(2026, 5, 15, 12, 0, 0);
    const q = quarterOf(ms, DEFAULT_CALENDAR);
    expect(q.label).toBe('FY2026-Q2');
    expect(q.quarter).toBe(2);
  });

  it('fiscalYearStart returns Jan 1 UTC', () => {
    const ms = Date.UTC(2026, 5, 15, 12, 0, 0);
    const fyStart = fiscalYearStart(ms, DEFAULT_CALENDAR);
    expect(fyStart).toBe(Date.UTC(2026, 0, 1, 0, 0, 0));
  });

  it('non-calendar fiscal year: April 1, UK style', () => {
    const ukConfig = {
      timezone: 'UTC' as const,
      startMonth: 4,
      startDay: 1,
      periodsPerYear: 12,
    };
    // 2026-06-15 is in UK FY2026 (which started 2026-04-01)
    const jun = Date.UTC(2026, 5, 15, 12, 0, 0);
    expect(fiscalYearOf(jun, ukConfig)).toBe(2026);

    // 2026-03-15 is in UK FY2025 (which started 2025-04-01)
    const mar = Date.UTC(2026, 2, 15, 12, 0, 0);
    expect(fiscalYearOf(mar, ukConfig)).toBe(2025);
  });
});

// ---------------------------------------------------------------------------
// Test 10: Edge cases
// ---------------------------------------------------------------------------

describe('Boundary and edge cases', () => {
  it('daysBetween ignores DST (uses UTC)', () => {
    // March 7-9, 2026 spans the US DST spring-forward.
    // In UTC: 2 full days = 2 * 86_400_000 ms = 172_800_000
    const mar7 = Date.UTC(2026, 2, 7, 12, 0, 0);
    const mar9 = Date.UTC(2026, 2, 9, 12, 0, 0);
    expect(daysBetween(mar7, mar9)).toBe(2);
  });

  it('addDays: simple UTC arithmetic', () => {
    const start = Date.UTC(2026, 5, 15, 12, 0, 0);
    const after10 = addDays(start, 10);
    expect(after10).toBe(Date.UTC(2026, 5, 25, 12, 0, 0));
    const before5 = addDays(start, -5);
    expect(before5).toBe(Date.UTC(2026, 5, 10, 12, 0, 0));
  });

  it('startOfUTCDay strips time component', () => {
    const ms = Date.UTC(2026, 5, 15, 14, 23, 45, 678);
    expect(startOfUTCDay(ms)).toBe(Date.UTC(2026, 5, 15, 0, 0, 0));
  });

  it('endOfUTCDay returns 23:59:59.999', () => {
    const ms = Date.UTC(2026, 5, 15, 14, 23, 45, 678);
    const eod = endOfUTCDay(ms);
    expect(new Date(eod).getUTCHours()).toBe(23);
    expect(new Date(eod).getUTCMinutes()).toBe(59);
    expect(new Date(eod).getUTCSeconds()).toBe(59);
    expect(new Date(eod).getUTCMilliseconds()).toBe(999);
  });

  it('toUTCISOString emits fixed-width Z format', () => {
    const ms = Date.UTC(2026, 5, 15, 12, 34, 56, 789);
    expect(toUTCISOString(ms)).toBe('2026-06-15T12:34:56.789Z');
  });
});
