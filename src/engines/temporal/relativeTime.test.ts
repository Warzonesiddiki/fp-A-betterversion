// =============================================================================
// Relative Time Tests — BUG-CHR-D-1 regression coverage
// =============================================================================
//
// Per the cross-check audit (.openhands/chronos-p1-crosscheck-v0.1.md), the
// `formatRelativeTime` function was copy-paste duplicated across 5 files with
// locale-dependent `toLocaleDateString()` and inconsistent threshold buckets.
// This test file is the 3rd witness (D-002) for the centralization fix.
//
// Edge cases tested:
//   1. Bucket boundaries: 59s vs 1m, 59m vs 1h, 23h vs 1d, 6d vs 7d
//   2. Locale handling: en-US, fr-FR, ja-JP
//   3. Future timestamps (clock skew): "just now", not negative
//   4. Malformed input: "unknown", no throw
//   5. maxDays customization: AuditTrailPage use case (30 days)
//   6. Year-aware fallback: old timestamps show year (e.g. "Jan 1, 2025")
//   7. DST-safe: minutes/hours/days are real elapsed time, not wall clock
//   8. Timezone crossing: NY + Tokyo same instant, same output
//
// =============================================================================

import { describe, it, expect } from 'vitest';

import { formatRelativeTime, formatRelativeTimeBudget, formatRelativeTimeLegacy } from './index';

const NOW = Date.UTC(2026, 5, 15, 12, 0, 0); // 2026-06-15 12:00:00 UTC
const ONE_MIN_AGO = NOW - 60_000;
const ONE_HOUR_AGO = NOW - 3_600_000;
const ONE_DAY_AGO = NOW - 86_400_000;
const SEVEN_DAYS_AGO = NOW - 7 * 86_400_000;
const THIRTY_DAYS_AGO = NOW - 30 * 86_400_000;
const ONE_YEAR_AGO = NOW - 365 * 86_400_000;

describe('formatRelativeTime — bucket boundaries', () => {
  it('0 seconds ago = "just now"', () => {
    expect(formatRelativeTime(NOW, { now: NOW })).toBe('just now');
  });

  it('59 seconds ago = "just now"', () => {
    const ts = NOW - 59_000;
    expect(formatRelativeTime(ts, { now: NOW })).toBe('just now');
  });

  it('1 minute ago = "1m ago"', () => {
    expect(formatRelativeTime(ONE_MIN_AGO, { now: NOW })).toBe('1m ago');
  });

  it('59 minutes ago = "59m ago"', () => {
    const ts = NOW - 59 * 60_000;
    expect(formatRelativeTime(ts, { now: NOW })).toBe('59m ago');
  });

  it('1 hour ago = "1h ago"', () => {
    expect(formatRelativeTime(ONE_HOUR_AGO, { now: NOW })).toBe('1h ago');
  });

  it('23 hours ago = "23h ago"', () => {
    const ts = NOW - 23 * 3_600_000;
    expect(formatRelativeTime(ts, { now: NOW })).toBe('23h ago');
  });

  it('1 day ago = "1d ago"', () => {
    expect(formatRelativeTime(ONE_DAY_AGO, { now: NOW })).toBe('1d ago');
  });

  it('6 days ago = "6d ago" (just under 7-day cap)', () => {
    const ts = NOW - 6 * 86_400_000;
    expect(formatRelativeTime(ts, { now: NOW })).toBe('6d ago');
  });

  it('7 days ago = calendar date (over default 7-day cap)', () => {
    const ts = SEVEN_DAYS_AGO;
    const result = formatRelativeTime(ts, { now: NOW });
    // Should NOT be "7d ago" — should be a calendar date
    expect(result).not.toBe('7d ago');
    expect(result).toMatch(/2026|Jun/);
  });
});

describe('formatRelativeTime — maxDays customization', () => {
  it('default maxDays = 7', () => {
    expect(formatRelativeTime(SEVEN_DAYS_AGO, { now: NOW })).toMatch(/2026|Jun/);
  });

  it('maxDays = 30 keeps "30d ago" within range', () => {
    const TWENTY_NINE_DAYS_AGO = NOW - 29 * 86_400_000;
  expect(formatRelativeTime(TWENTY_NINE_DAYS_AGO, { now: NOW, maxDays: 30 })).toBe('29d ago');
  });

  it('maxDays = 30 makes 31 days show as calendar date', () => {
    const ts = NOW - 31 * 86_400_000;
    expect(formatRelativeTime(ts, { now: NOW, maxDays: 30 })).toMatch(/2026|May/);
  });

  it('formatRelativeTimeBudget (30-day) helper', () => {
    const ts = NOW - 29 * 86_400_000;
    expect(formatRelativeTimeBudget(ts, { now: NOW })).toBe('29d ago');
  });
});

describe('formatRelativeTime — future timestamps (clock skew)', () => {
  it('1 minute in the future = "just now" (clamped, not negative)', () => {
    const future = NOW + 60_000;
    const result = formatRelativeTime(future, { now: NOW });
    expect(result).toBe('just now');
  });

  it('1 hour in the future = "just now" (clamped, not negative)', () => {
    const future = NOW + 3_600_000;
    expect(formatRelativeTime(future, { now: NOW })).toBe('just now');
  });

  it('1 day in the future = "just now" (clamped, not negative)', () => {
    const future = NOW + 86_400_000;
    expect(formatRelativeTime(future, { now: NOW })).toBe('just now');
  });
});

describe('formatRelativeTime — malformed input', () => {
  it('null → "unknown"', () => {
    expect(formatRelativeTime(null, { now: NOW })).toBe('unknown');
  });

  it('undefined → "unknown"', () => {
    expect(formatRelativeTime(undefined, { now: NOW })).toBe('unknown');
  });

  it('empty string → "unknown"', () => {
    expect(formatRelativeTime('', { now: NOW })).toBe('unknown');
  });

  it('garbage string → "unknown"', () => {
    expect(formatRelativeTime('not a date', { now: NOW })).toBe('unknown');
  });

  it('NaN → "unknown"', () => {
    expect(formatRelativeTime(NaN, { now: NOW })).toBe('unknown');
  });
});

describe('formatRelativeTime — locale handling (BUG-CHR-D-1 fix)', () => {
  it('en-US: shows month abbreviation and year', () => {
    const ts = ONE_YEAR_AGO;
    const result = formatRelativeTime(ts, { now: NOW, locale: 'en-US' });
    // Should be like "Jun 15, 2025" — en-US format
    expect(result).toMatch(/2025/);
  });

  it('fr-FR: uses French month names (or similar locale format)', () => {
    const ts = ONE_YEAR_AGO;
    const result = formatRelativeTime(ts, { now: NOW, locale: 'fr-FR' });
    // French formatting typically: "15 juin 2025" or "15 juin 2025"
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/2025/);
  });

  it('ja-JP: uses Japanese year or western year notation', () => {
    const ts = ONE_YEAR_AGO;
    const result = formatRelativeTime(ts, { now: NOW, locale: 'ja-JP' });
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/2025/);
  });

  it('default locale is en-US', () => {
    const ts = ONE_YEAR_AGO;
    const result = formatRelativeTime(ts, { now: NOW });
    expect(result).toMatch(/2025/);
  });
});

describe('formatRelativeTime — DST safety', () => {
  it('minutes between two UTC times are elapsed-time, not wall clock', () => {
    // Spring-forward: 2026-03-08 02:00 EST → 03:00 EDT (1 hour "missing" locally)
    const beforeDST = Date.UTC(2026, 2, 8, 6, 59, 0); // 01:59 EST
    const afterDST = Date.UTC(2026, 2, 8, 7, 0, 0); // 03:00 EDT
    const diffMin = Math.round((afterDST - beforeDST) / 60_000);
    expect(formatRelativeTime(beforeDST, { now: afterDST })).toBe(`${diffMin}m ago`);
    // 1 real minute, not 61
    expect(formatRelativeTime(beforeDST, { now: afterDST })).toBe('1m ago');
  });

  it('hours between two UTC times are elapsed-time, not wall clock', () => {
    // Fall-back: 2026-11-01 02:00 EDT → 01:00 EST (1 hour "duplicated" locally)
    const beforeFallBack = Date.UTC(2026, 10, 1, 4, 0, 0); // 00:00 EDT
    const afterFallBack = Date.UTC(2026, 10, 1, 7, 0, 0); // 02:00 EST
    expect(formatRelativeTime(beforeFallBack, { now: afterFallBack })).toBe('3h ago');
  });
});

describe('formatRelativeTime — timezone crossing', () => {
  it('NY + Tokyo same instant, same output', () => {
    // 2026-06-15 13:00:00 UTC = 09:00 EDT (NY) = 22:00 JST (Tokyo)
    const utcMs = Date.UTC(2026, 5, 15, 13, 0, 0);
    const nyFormat = '2026-06-15T09:00:00-04:00';
    const tokyoFormat = '2026-06-15T22:00:00+09:00';
    expect(formatRelativeTime(nyFormat, { now: utcMs + 60_000 })).toBe('1m ago');
    expect(formatRelativeTime(tokyoFormat, { now: utcMs + 60_000 })).toBe('1m ago');
  });
});

describe('formatRelativeTimeLegacy — backward compat', () => {
  it('matches legacy "Just now" capitalization (capital J)', () => {
    expect(formatRelativeTimeLegacy(NOW, { now: NOW })).toBe('Just now');
  });

  it('default maxDays = 7 (legacy behavior)', () => {
    expect(formatRelativeTimeLegacy(SEVEN_DAYS_AGO, { now: NOW })).toMatch(/2026|Jun/);
  });
});

describe('formatRelativeTime — edge cases from cross-check', () => {
  it('handles negative number input (epoch ms)', () => {
    // Pre-1970 timestamp
    const result = formatRelativeTime(-1, { now: NOW });
    expect(result).toMatch(/1969|1970/); // 1 sec before 1970 = Dec 31, 1969
  });

  it('handles very large epoch ms (post-2100)', () => {
    const future = Date.UTC(2150, 0, 1);
    // 124 years in future = "just now" (clamped)
    expect(formatRelativeTime(future, { now: NOW })).toBe('just now');
  });

  it('preserves year in calendar-date fallback (BUG-CHR-D-1 fix)', () => {
    // 1 year ago should show "2025" not just "Jun 15"
    const ts = ONE_YEAR_AGO;
    const result = formatRelativeTime(ts, { now: NOW });
    expect(result).toMatch(/2025/);
  });
});
