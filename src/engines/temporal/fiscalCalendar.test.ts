// =============================================================================
// FiscalCalendar unit tests
// =============================================================================
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CALENDAR,
  fiscalYearOf,
  fiscalYearStart,
  periodOf,
  quarterOf,
} from './fiscalCalendar';
import type { FiscalCalendarConfig } from './fiscalCalendar';

// US federal fiscal year: Oct 1 start.
const FEDERAL: FiscalCalendarConfig = {
  timezone: 'UTC',
  startMonth: 10,
  startDay: 1,
  periodsPerYear: 12,
};

describe('fiscalYearOf', () => {
  it('returns the UTC year for the default calendar-year config', () => {
    expect(fiscalYearOf(Date.UTC(2026, 5, 15))).toBe(2026);
    expect(fiscalYearOf(Date.UTC(2026, 0, 1))).toBe(2026);
    expect(fiscalYearOf(Date.UTC(2026, 11, 31))).toBe(2026);
    expect(fiscalYearOf(Date.UTC(2027, 0, 1))).toBe(2027);
  });

  it('assigns Jan 1 to the PRIOR fiscal year for an Oct-1 start', () => {
    expect(fiscalYearOf(Date.UTC(2026, 0, 1), FEDERAL)).toBe(2025);
  });

  it('assigns dates on or after Oct 1 to the matching fiscal year', () => {
    expect(fiscalYearOf(Date.UTC(2026, 9, 1), FEDERAL)).toBe(2026);
    expect(fiscalYearOf(Date.UTC(2026, 11, 31), FEDERAL)).toBe(2026);
    expect(fiscalYearOf(Date.UTC(2025, 9, 1), FEDERAL)).toBe(2025);
  });

  it('treats the default config object as its own fiscal year', () => {
    expect(fiscalYearOf(Date.UTC(2026, 0, 1), DEFAULT_CALENDAR)).toBe(2026);
  });

  it('throws RangeError on non-finite epoch ms', () => {
    expect(() => fiscalYearOf(Number.NaN)).toThrow(RangeError);
    expect(() => fiscalYearOf(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it('throws RangeError on out-of-range startMonth', () => {
    expect(() => fiscalYearOf(Date.UTC(2026, 0, 1), { ...FEDERAL, startMonth: 0 })).toThrow(
      RangeError
    );
    expect(() => fiscalYearOf(Date.UTC(2026, 0, 1), { ...FEDERAL, startMonth: 13 })).toThrow(
      RangeError
    );
  });

  it('throws RangeError on out-of-range startDay', () => {
    expect(() => fiscalYearOf(Date.UTC(2026, 0, 1), { ...FEDERAL, startDay: 0 })).toThrow(
      RangeError
    );
    expect(() => fiscalYearOf(Date.UTC(2026, 0, 1), { ...FEDERAL, startDay: 32 })).toThrow(
      RangeError
    );
  });
});

describe('fiscalYearStart', () => {
  it('returns Jan 1 for the default calendar config', () => {
    expect(fiscalYearStart(Date.UTC(2026, 5, 15))).toBe(Date.UTC(2026, 0, 1));
  });

  it('returns the fiscal-year anchor that CONTAINS the timestamp', () => {
    expect(fiscalYearStart(Date.UTC(2026, 0, 1), FEDERAL)).toBe(Date.UTC(2025, 9, 1));
    expect(fiscalYearStart(Date.UTC(2026, 9, 1), FEDERAL)).toBe(Date.UTC(2026, 9, 1));
  });
});

describe('periodOf', () => {
  it('returns the correct default-calendar period for a mid-year date', () => {
    const p = periodOf(Date.UTC(2026, 5, 15));
    expect(p.label).toBe('FY2026');
    expect(p.period).toBe(6);
    expect(p.start).toBe('2026-06-01T00:00:00.000Z');
    expect(p.end).toBe('2026-06-30T23:59:59.999Z');
    expect(p.durationDays).toBe(31);
  });

  it('returns period 1 for January', () => {
    const p = periodOf(Date.UTC(2026, 0, 15));
    expect(p.period).toBe(1);
    expect(p.start).toBe('2026-01-01T00:00:00.000Z');
    expect(p.end).toBe('2026-01-31T23:59:59.999Z');
    expect(p.durationDays).toBe(32);
  });

  it('returns the correct period for an Oct-1-start fiscal year', () => {
    const p = periodOf(Date.UTC(2026, 9, 15), FEDERAL);
    expect(p.label).toBe('FY2026');
    expect(p.period).toBe(1);
    expect(p.start).toBe('2026-10-01T00:00:00.000Z');
  });

  it('supports periodsPerYear = 4', () => {
    const config: FiscalCalendarConfig = {
      timezone: 'UTC',
      startMonth: 1,
      startDay: 1,
      periodsPerYear: 4,
    };
    const p = periodOf(Date.UTC(2026, 8, 1), config);
    expect(p.label).toBe('FY2026');
    expect(p.period).toBe(3);
    expect(p.start).toBe('2026-07-01T00:00:00.000Z');
    expect(p.end).toBe('2026-09-30T23:59:59.999Z');
  });

  it('supports periodsPerYear = 2 (semesters)', () => {
    const config: FiscalCalendarConfig = {
      timezone: 'UTC',
      startMonth: 1,
      startDay: 1,
      periodsPerYear: 2,
    };
    const p = periodOf(Date.UTC(2026, 6, 1), config);
    expect(p.period).toBe(2);
    expect(p.start).toBe('2026-07-01T00:00:00.000Z');
    expect(p.end).toBe('2026-12-31T23:59:59.999Z');
  });

  it('uses an inclusive end (last ms of the period)', () => {
    const atEnd = periodOf(Date.UTC(2026, 5, 30, 23, 59, 59, 999));
    expect(atEnd.period).toBe(6);
  });
});

describe('quarterOf', () => {
  it('maps Q1 = P1-P3 for the default calendar', () => {
    const q = quarterOf(Date.UTC(2026, 1, 15));
    expect(q.label).toBe('FY2026-Q1');
    expect(q.quarter).toBe(1);
    expect(q.period).toBe(2);
    expect(q.start).toBe('2026-01-01T00:00:00.000Z');
    expect(q.end).toBe('2026-03-31T23:59:59.999Z');
    expect(q.durationDays).toBe(91);
  });

  it('maps Q2 = P4-P6', () => {
    const q = quarterOf(Date.UTC(2026, 4, 15));
    expect(q.quarter).toBe(2);
    expect(q.label).toBe('FY2026-Q2');
    expect(q.start).toBe('2026-04-01T00:00:00.000Z');
    expect(q.end).toBe('2026-06-30T23:59:59.999Z');
  });

  it('maps Q4 for December', () => {
    const q = quarterOf(Date.UTC(2026, 11, 15));
    expect(q.quarter).toBe(4);
    expect(q.label).toBe('FY2026-Q4');
    expect(q.start).toBe('2026-10-01T00:00:00.000Z');
    expect(q.end).toBe('2026-12-31T23:59:59.999Z');
  });
});
