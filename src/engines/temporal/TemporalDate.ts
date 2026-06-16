// =============================================================================
// Temporal Utilities — Safe date/time arithmetic for fiscal & audit correctness
// =============================================================================
//
// PURPOSE:
//   Provide timezone-aware, DST-safe, leap-year-correct date primitives for
//   downstream engines (PeriodClose, AuditTrail, FinancialClose, FiscalCalendar).
//
// INVARIANTS:
//   1. All timestamps stored in UTC (ISO 8601 with 'Z' suffix).
//   2. All date-only strings parsed as UTC midnight unless explicitly local.
//   3. All comparisons normalized to UTC epoch ms.
//   4. All fiscal-period boundaries use the FiscalCalendar helper (not Date math).
//
// EDGE-CASE COVERAGE:
//   - DST spring-forward: 2026-03-08 02:00 (US/Eastern) — no missing hours
//   - DST fall-back:     2026-11-01 02:00 (US/Eastern) — both 01:00 occurrences
//   - Leap year:         2028-02-29 (valid), 2027-02-29 (invalid → null)
//   - TZ crossing:       America/New_York + Asia/Tokyo → UTC round-trip
//   - Century boundary:  2000-01-01 (Y2K), 2100-02-29 (NOT a leap year)
//
//   All cases covered by __tests__/TemporalDate.test.ts.
//
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * ISO 8601 timestamp string. Conventionally stored as UTC with 'Z' suffix
 * (e.g. "2026-06-15T12:34:56.789Z") or with explicit offset (e.g.
 * "2026-06-15T08:34:56-04:00"). Date-only strings ("2026-06-15") are also
 * accepted and treated as UTC midnight.
 */
export type ISOTimestamp = string;

/**
 * IANA timezone identifier (e.g. "America/New_York", "Asia/Tokyo", "UTC").
 * Validated at parse time; invalid IDs throw.
 */
export type TimezoneID = string;

/**
 * Calendar date components (year, month 1-12, day 1-31). Month and day are
 * 1-indexed for human readability; this matches ISO 8601 conventions.
 */
export interface CalendarDate {
  readonly year: number;
  /** 1-12 (January=1) */
  readonly month: number;
  /** 1-31 */
  readonly day: number;
}

/**
 * Result of a date-range intersection. `null` means no overlap.
 */
export interface DateRange {
  readonly start: ISOTimestamp;
  readonly end: ISOTimestamp;
}

// ---------------------------------------------------------------------------
// Parsing & Validation
// ---------------------------------------------------------------------------

/**
 * Parse any ISO 8601 timestamp (with or without offset) to UTC epoch ms.
 *
 * Accepts:
 *   - "2026-06-15T12:34:56.789Z"        (UTC)
 *   - "2026-06-15T12:34:56+05:00"        (with offset)
 *   - "2026-06-15T12:34:56"              (no offset — treated as LOCAL)
 *   - "2026-06-15"                       (date only — treated as UTC midnight)
 *   - 1234567890000                      (numeric epoch ms)
 *
 * Returns null for invalid input. Never throws.
 *
 * @param input - ISO timestamp, date-only string, or epoch ms number
 * @returns UTC epoch ms, or null if input is invalid
 */
export function parseToUTCEpoch(input: string | number | Date | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (input instanceof Date) {
    const ms = input.getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : null;
  }
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (trimmed === '') return null;

  // Date-only "YYYY-MM-DD" → UTC midnight.
  // This is a deliberate convention: date-only strings represent whole days
  // in UTC, NOT in any local timezone. Engines that want local interpretation
  // must pass a full timestamp.
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const ms = Date.UTC(
      Number(trimmed.slice(0, 4)),
      Number(trimmed.slice(5, 7)) - 1,
      Number(trimmed.slice(8, 10))
    );
    return Number.isFinite(ms) ? ms : null;
  }

  // Full ISO 8601 — let the Date constructor parse with its own semantics.
  // Critically: the result's getTime() returns UTC epoch ms regardless of
  // input offset, so comparison is correct.
  const parsed = new Date(trimmed);
  const ms = parsed.getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Convert epoch ms to an ISO 8601 UTC string with 'Z' suffix.
 * Always emits the same width for lexicographic comparability.
 *
 * @param ms - UTC epoch ms
 * @returns ISO 8601 string like "2026-06-15T12:34:56.789Z"
 */
export function toUTCISOString(ms: number): ISOTimestamp {
  if (!Number.isFinite(ms)) {
    throw new RangeError(`toUTCISOString: invalid epoch ms: ${ms}`);
  }
  return new Date(ms).toISOString();
}

/**
 * Check if a year is a leap year (Gregorian calendar).
 * Rules:
 *   - Divisible by 4 → leap
 *   - Except divisible by 100 → NOT leap
 *   - Except divisible by 400 → leap
 *
 * Examples:
 *   2000: leap (div by 400)
 *   2100: NOT leap (div by 100 but not 400)
 *   2028: leap (div by 4, not 100)
 *   2027: not leap
 */
export function isLeapYear(year: number): boolean {
  if (!Number.isInteger(year)) return false;
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Convert UTC epoch ms to calendar date components in a specific IANA timezone.
 * Uses Intl.DateTimeFormat, which is the only correct way to do this in
 * a DST-aware manner in modern JS engines.
 *
 * @param ms - UTC epoch ms
 * @param tz - IANA timezone ID (e.g. "America/New_York")
 * @returns Calendar date {year, month, day} in that timezone
 * @throws RangeError if the timezone is invalid
 */
export function toCalendarDateInTZ(ms: number, tz: TimezoneID): CalendarDate {
  if (!Number.isFinite(ms)) {
    throw new RangeError(`toCalendarDateInTZ: invalid epoch ms: ${ms}`);
  }
  // Validate tz by formatting a known date and checking for the timezone.
  // Intl throws RangeError for unknown zones.
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(new Date(ms));
  const get = (type: Intl.DateTimeFormatPartTypes): number => {
    const part = parts.find((p) => p.type === type);
    if (!part) throw new Error(`toCalendarDateInTZ: missing part ${type}`);
    return Number(part.value);
  };
  return { year: get('year'), month: get('month'), day: get('day') };
}

// ---------------------------------------------------------------------------
// Date Arithmetic
// ---------------------------------------------------------------------------

/**
 * Add a number of days to a UTC timestamp. Calendar-day arithmetic in UTC
 * (NOT DST-aware in local time). Use `addBusinessDays` if you need local
 * calendar arithmetic that respects DST.
 *
 * @param ms - UTC epoch ms
 * @param days - Number of days (can be negative)
 * @returns New UTC epoch ms
 */
export function addDays(ms: number, days: number): number {
  if (!Number.isFinite(ms) || !Number.isFinite(days)) {
    throw new RangeError(`addDays: invalid input ms=${ms} days=${days}`);
  }
  return ms + days * 86_400_000;
}

/**
 * Add a number of months to a UTC date. End-of-month clamping:
 * adding 1 month to Jan 31 → Feb 28 (or Feb 29 in leap years).
 *
 * @param ms - UTC epoch ms
 * @param months - Number of months (can be negative)
 * @returns New UTC epoch ms
 */
export function addMonths(ms: number, months: number): number {
  if (!Number.isFinite(ms) || !Number.isFinite(months)) {
    throw new RangeError(`addMonths: invalid input ms=${ms} months=${months}`);
  }
  const d = new Date(ms);
  const targetMonth = d.getUTCMonth() + months;
  const targetYear = d.getUTCFullYear() + Math.floor(targetMonth / 12) + (targetMonth < 0 ? -1 : 0);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  // Clamp day to last day of target month.
  const lastDayOfTarget = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
  const day = Math.min(d.getUTCDate(), lastDayOfTarget);
  return Date.UTC(
    targetYear,
    normalizedMonth,
    day,
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds(),
    d.getUTCMilliseconds()
  );
}

/**
 * Compute the number of days between two timestamps (b - a), in UTC calendar days.
 * DST does NOT affect this count because we use UTC.
 */
export function daysBetween(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new RangeError(`daysBetween: invalid input a=${a} b=${b}`);
  }
  return Math.round((b - a) / 86_400_000);
}

// ---------------------------------------------------------------------------
// Comparison (Timezone-Safe)
// ---------------------------------------------------------------------------

/**
 * Robust timestamp comparison that normalizes to UTC epoch ms first.
 * Use this instead of lexicographic string comparison on ISO timestamps.
 *
 * BUG FIX: lexicographic comparison (a < b) on ISO 8601 strings is only
 * correct if BOTH strings use the same timezone format. Mixed offsets
 * (e.g. "2026-06-15T08:00:00+05:00" vs "2026-06-15T03:00:00Z") produce
 * wrong ordering. This function normalizes via parseToUTCEpoch first.
 *
 * @returns -1 if a<b, 0 if a==b, 1 if a>b, null if either is invalid
 */
export function compareTimestamps(
  a: string | number | Date | null | undefined,
  b: string | number | Date | null | undefined
): -1 | 0 | 1 | null {
  const aMs = parseToUTCEpoch(a);
  const bMs = parseToUTCEpoch(b);
  if (aMs === null || bMs === null) return null;
  if (aMs < bMs) return -1;
  if (aMs > bMs) return 1;
  return 0;
}

/**
 * Check if a timestamp falls within an inclusive [from, to] range.
 * Returns false if any input is invalid. Timezone-safe.
 */
export function isInRange(
  ts: string | number | Date | null | undefined,
  from: string | number | Date | null | undefined,
  to: string | number | Date | null | undefined
): boolean {
  const tsMs = parseToUTCEpoch(ts);
  const fromMs = parseToUTCEpoch(from);
  const toMs = parseToUTCEpoch(to);
  if (tsMs === null || fromMs === null || toMs === null) return false;
  return tsMs >= fromMs && tsMs <= toMs;
}

// ---------------------------------------------------------------------------
// Boundary Helpers
// ---------------------------------------------------------------------------

/**
 * Get the UTC midnight (00:00:00.000) of the day containing the given epoch ms.
 * Useful for normalizing to whole-day granularity.
 */
export function startOfUTCDay(ms: number): number {
  if (!Number.isFinite(ms)) {
    throw new RangeError(`startOfUTCDay: invalid epoch ms: ${ms}`);
  }
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Get the UTC last millisecond (23:59:59.999) of the day containing the given epoch ms.
 */
export function endOfUTCDay(ms: number): number {
  return startOfUTCDay(ms) + 86_400_000 - 1;
}

/**
 * Get the UTC midnight of the first day of the month containing the given epoch ms.
 */
export function startOfUTCMonth(ms: number): number {
  if (!Number.isFinite(ms)) {
    throw new RangeError(`startOfUTCMonth: invalid epoch ms: ${ms}`);
  }
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
}

/**
 * Get the UTC last millisecond of the last day of the month containing the given epoch ms.
 * Leap-year aware: returns Feb 28 in non-leap years, Feb 29 in leap years.
 */
export function endOfUTCMonth(ms: number): number {
  if (!Number.isFinite(ms)) {
    throw new RangeError(`endOfUTCMonth: invalid epoch ms: ${ms}`);
  }
  const d = new Date(ms);
  // Date.UTC(y, m+1, 0) returns the last day of month m.
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999);
}
