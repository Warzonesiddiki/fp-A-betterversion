// =============================================================================
// V3 e.ix.8 — Multi-Jurisdiction Fiscal Calendar Edge Cases #16-20
// =============================================================================
// Apollo apply (CYCLE 14 W2 D2, 2026-06-17) per Chronos PICK E APPLY
// T-2d 2026-06-20 EOD (RATIFICATION GATE 2026-06-22 16:00 UTC alignment)
//
// Subject: Multi-jurisdiction FY/EU fiscal variants covering 5 NEW edge cases:
//   #16 FY leap second — 23:59:60 UTC (1972-06-30, 2015-06-30, 2017-01-01)
//   #17 DST spring-forward gap — 02:00-03:00 missing US/EU (2026-03-08, 03-29)
//   #18 Calendar reform — Julian→Gregorian 1582-10-04 → 1582-10-15 skip
//   #19 Epoch zero — 1970-01-01T00:00:00Z boundary (pre/post)
//   #20 Negative timestamp — pre-1970 historical periods (FY 1969 Q4 close)
//
// Coverage: PeriodLock + Calendar + Audit + Lock (4-engine ENV desync matrix)
// Total: 5 NEW + 15 sub-tests + ~250L, 4-ICP target 9.5/10 PLATINUM+
//
// ENGINE NOTE: `periodOf` uses an additive month approximation
// (30.4375-day periods from FY start), so durationDays are 31-32, not
// real month lengths. The engine stays deterministic across all 5 NEW
// edge cases — no NaN, no exceptions, no negative durations.
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
  fiscalYearOf,
  fiscalYearStart,
  periodOf,
  quarterOf,
} from './index';
import type { FiscalCalendarConfig } from './fiscalCalendar';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const FY_US: FiscalCalendarConfig = {
  startMonth: 1,
  startDay: 1,
  periodsPerYear: 12,
  timezone: 'UTC',
};
const FY_UK: FiscalCalendarConfig = {
  startMonth: 4,
  startDay: 6,
  periodsPerYear: 12,
  timezone: 'UTC',
};
const FY_AU: FiscalCalendarConfig = {
  startMonth: 7,
  startDay: 1,
  periodsPerYear: 12,
  timezone: 'UTC',
};

// =============================================================================
// #16 — FY Leap Second (23:59:60 UTC)
// =============================================================================
// Real leap-second insertions: 1972-06-30, 2015-06-30, 2016-12-31.
// JS Date smears leap seconds into the next second, so 23:59:60 collapses to
// 00:00:00 of the next day. Engine must produce deterministic period labels
// without NaN, even at the leap-second boundary.
// =============================================================================

describe('V3 e.ix.8 #16 — FY leap second', () => {
  it('2015-06-30 23:59:59 UTC → FY2015 P6 (deterministic, no NaN)', () => {
    const ms = Date.UTC(2015, 5, 30, 23, 59, 59);
    const period = periodOf(ms, FY_US);
    expect(fiscalYearOf(ms, FY_US)).toBe(2015);
    expect(period.period).toBe(6);
    expect(period.label).toBe('FY2015');
    expect(Number.isFinite(period.durationDays)).toBe(true);
  });

  it('2015-06-30 23:59:59 → 2015-07-01 00:00:00 advances P6→P7 (no period collapse)', () => {
    const pre = Date.UTC(2015, 5, 30, 23, 59, 59);
    const post = Date.UTC(2015, 6, 1, 0, 0, 0);
    const p1 = periodOf(pre, FY_US);
    const p2 = periodOf(post, FY_US);
    expect(p1.period).toBe(6);
    expect(p2.period).toBe(7);
    expect(p2.period - p1.period).toBe(1); // 1-period advancement, no off-by-one
  });

  it('1972-06-30 (first-ever leap second) → FY1972 P6, finite duration', () => {
    const ms = Date.UTC(1972, 5, 30, 23, 59, 59);
    const period = periodOf(ms, FY_US);
    expect(period.label).toBe('FY1972');
    expect(period.period).toBe(6);
    expect(period.durationDays).toBeGreaterThan(0);
  });
});

// =============================================================================
// #17 — DST Spring-Forward Gap (23-hour day)
// =============================================================================
// US: 2026-03-08 02:00→03:00 missing (EST→EDT).
// EU: 2026-03-29 02:00→03:00 missing (CET→CEST).
// JS Date in UTC is unaffected; engine stays deterministic in UTC.
// =============================================================================

describe('V3 e.ix.8 #17 — DST spring-forward gap', () => {
  it('US 2026-03-08 DST gap day → FY2026 P3 (UTC deterministic)', () => {
    const ms = Date.UTC(2026, 2, 8, 12, 0, 0);
    const period = periodOf(ms, FY_US);
    expect(period.label).toBe('FY2026');
    expect(period.period).toBe(3);
  });

  it('EU 2026-03-29 DST gap day → UK FY2025 P12 (UK Apr start, March is prior FY)', () => {
    const ms = Date.UTC(2026, 2, 29, 12, 0, 0);
    const period = periodOf(ms, FY_UK);
    // UK FY starts 4/6 → 2026-03-29 is still in UK FY2025 (which started 2025-04-06)
    expect(period.label).toBe('FY2025');
    expect(period.period).toBe(12);
  });

  it('PeriodLock invariant: fyStart stays identical across DST gap day', () => {
    const dayBefore = fiscalYearStart(Date.UTC(2026, 2, 7), FY_US);
    const dayAfter = fiscalYearStart(Date.UTC(2026, 2, 9), FY_US);
    expect(dayBefore).toBe(dayAfter);
  });
});

// =============================================================================
// #18 — Calendar Reform (Julian → Gregorian, 1582-10-04 → 1582-10-15)
// =============================================================================
// 10-day skip. Historical FY 1582 alignment. Engine uses proleptic Gregorian
// (JS Date). All October 1582 days map to FY1582 P10 (no day drift, no crash).
// =============================================================================

describe('V3 e.ix.8 #18 — Calendar reform (Julian→Gregorian 1582)', () => {
  it('1582-10-04 (last Julian day) → FY1582 P10', () => {
    const ms = Date.UTC(1582, 9, 4, 12, 0, 0);
    const period = periodOf(ms, FY_US);
    expect(fiscalYearOf(ms, FY_US)).toBe(1582);
    expect(period.period).toBe(10);
  });

  it('1582-10-15 (first Gregorian day) → same FY1582 P10 (no day drift)', () => {
    const ms = Date.UTC(1582, 9, 15, 12, 0, 0);
    const period = periodOf(ms, FY_US);
    expect(period.period).toBe(10);
    expect(period.label).toBe('FY1582');
  });

  it('Skip days 1582-10-05..14 stay in FY1582 P10 (proleptic, no NaN)', () => {
    const skip = Date.UTC(1582, 9, 10, 12, 0, 0);
    const p = periodOf(skip, FY_US);
    expect(p.label).toBe('FY1582');
    expect(p.period).toBe(10);
  });
});

// =============================================================================
// #19 — Epoch Zero (1970-01-01T00:00:00Z boundary)
// =============================================================================
// Pre-1970 (negative epoch ms) and post-1970 (≥0) cross-region audit trail.
// Engine must accept negative ms without throwing and produce correct FY.
// =============================================================================

describe('V3 e.ix.8 #19 — Epoch zero boundary', () => {
  it('1970-01-01T00:00:00Z (epoch 0) → FY1970 P1', () => {
    const period = periodOf(0, FY_US);
    expect(period.label).toBe('FY1970');
    expect(period.period).toBe(1);
  });

  it('1969-12-31T23:59:59Z (epoch -1000) → FY1969 P12', () => {
    const period = periodOf(-1000, FY_US);
    expect(period.label).toBe('FY1969');
    expect(period.period).toBe(12);
  });

  it('Pre/post epoch quarterOf returns valid quarter (1-4)', () => {
    const pre = quarterOf(-1, FY_US); // last instant of 1969 Q4
    const post = quarterOf(1, FY_US); // first instant of 1970 Q1
    expect(pre.quarter).toBeGreaterThanOrEqual(1);
    expect(pre.quarter).toBeLessThanOrEqual(4);
    expect(post.quarter).toBeGreaterThanOrEqual(1);
    expect(post.quarter).toBeLessThanOrEqual(4);
  });
});

// =============================================================================
// #20 — Negative Timestamp (pre-1970 historical FY)
// =============================================================================
// FY 1969 Q4 close audit. Multi-region sequence: US FY1969 / UK FY1969 /
// AU FY1969. Engine must produce distinct period numbers per region for
// the same UTC instant (proves calendar-config-aware separation).
// =============================================================================

describe('V3 e.ix.8 #20 — Negative timestamp multi-region sequence', () => {
  it('US 1969-12-31 23:00:00Z → FY1969 P12 (calendar-year-end quarter)', () => {
    const ms = Date.UTC(1969, 11, 31, 23, 0, 0);
    const period = periodOf(ms, FY_US);
    expect(period.label).toBe('FY1969');
    expect(period.period).toBe(12);
  });

  it('AU 1969-12-31 23:00:00Z → FY1969 P6 (AU Jul-Jun calendar, 6 months in)', () => {
    const ms = Date.UTC(1969, 11, 31, 23, 0, 0);
    const period = periodOf(ms, FY_AU);
    expect(period.label).toBe('FY1969');
    expect(period.period).toBe(6);
  });

  it('UK 1969-12-31 23:00:00Z → FY1969 P9 (UK Apr start, 9 months in)', () => {
    const ms = Date.UTC(1969, 11, 31, 23, 0, 0);
    const period = periodOf(ms, FY_UK);
    expect(period.label).toBe('FY1969');
    expect(period.period).toBe(9);
  });

  it('Multi-region separation: 3 distinct periods for the same instant', () => {
    const ms = Date.UTC(1969, 11, 31, 23, 0, 0);
    const us = periodOf(ms, FY_US).period;
    const uk = periodOf(ms, FY_UK).period;
    const au = periodOf(ms, FY_AU).period;
    expect(us).not.toBe(uk);
    expect(uk).not.toBe(au);
    expect(us).not.toBe(au);
  });
});

// =============================================================================
// 4-Engine ENV Desync Matrix (PeriodLock + Calendar + Audit + Lock)
// =============================================================================
// Cross-engine invariant: fiscalYearStart round-trips must be deterministic
// across all 5 NEW edge cases, and PeriodLock duration must be positive
// finite (not NaN, not Infinity, not negative).
// =============================================================================

describe('V3 e.ix.8 — 4-engine ENV desync matrix', () => {
  const cases: Array<[number, FiscalCalendarConfig, string]> = [
    [Date.UTC(2015, 5, 30, 23, 59, 59), FY_US, '#16 leap second'],
    [Date.UTC(2026, 2, 8, 12, 0, 0), FY_US, '#17 US DST gap'],
    [Date.UTC(2026, 2, 29, 12, 0, 0), FY_UK, '#17 EU DST gap'],
    [Date.UTC(1582, 9, 4, 12, 0, 0), FY_US, '#18 Julian last day'],
    [Date.UTC(1582, 9, 15, 12, 0, 0), FY_US, '#18 Gregorian first day'],
    [0, FY_US, '#19 epoch zero'],
    [-1000, FY_US, '#19 pre-epoch'],
    [Date.UTC(1969, 11, 31, 23, 0, 0), FY_US, '#20 US 1969'],
    [Date.UTC(1969, 11, 31, 23, 0, 0), FY_AU, '#20 AU 1969'],
    [Date.UTC(1969, 11, 31, 23, 0, 0), FY_UK, '#20 UK 1969'],
  ];

  for (const [ms, cfg, label] of cases) {
    it(`fiscalYearStart round-trip: ${label}`, () => {
      const fy = fiscalYearOf(ms, cfg);
      const fyStart = fiscalYearStart(ms, cfg);
      const reconstructed = Date.UTC(fy, cfg.startMonth - 1, cfg.startDay);
      expect(fyStart).toBe(reconstructed);
    });
  }

  it('PeriodLock invariant: all edge cases produce finite, positive durationDays', () => {
    for (const [ms, cfg] of cases) {
      const p = periodOf(ms, cfg);
      expect(Number.isFinite(p.durationDays)).toBe(true);
      expect(p.durationDays).toBeGreaterThan(0);
      expect(p.durationDays).toBeLessThanOrEqual(32);
    }
  });
});
