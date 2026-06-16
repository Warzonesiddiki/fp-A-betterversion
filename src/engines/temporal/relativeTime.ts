// =============================================================================
// Relative Time Formatting — locale-aware, DST-safe, maxDays-capped
// =============================================================================
//
// PURPOSE:
//   Provide a single canonical implementation of "X minutes ago" / "X days ago"
//   / calendar date display. Replaces 5 copy-paste duplicates across the
//   codebase (see audit: docs/engines/TEMPORAL_ENGINE_CORRECTNESS.md §BUG-CHR-D-1).
//
// EDGE-CASE COVERAGE:
//   - DST spring-forward / fall-back: minutes/hours/days are elapsed-time
//     (UTC ms), so the relative-time buckets are DST-immune.
//   - Timezone crossing: parseToUTCEpoch normalizes input to UTC ms before
//     computing the diff, so the elapsed time is correct regardless of
//     where the event was stamped.
//   - Future timestamps (clock skew): returns "just now" rather than
//     negative-time strings (e.g. "-5m ago").
//   - Malformed input: returns "unknown" rather than throwing.
//   - Locale: defaults to "en-US"; pass a locale string to override.
//
// USAGE:
//   import { formatRelativeTime } from '@/engines/temporal';
//   formatRelativeTime('2026-06-15T12:00:00Z'); // e.g. "5m ago"
//   formatRelativeTime('2026-01-01T00:00:00Z'); // e.g. "Jan 1, 2026"
//
// =============================================================================

import { parseToUTCEpoch } from './TemporalDate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FormatRelativeTimeOptions {
  /**
   * Maximum number of days to display as "Xd ago" before falling back to
   * a calendar date. Default 7. The AuditTrailPage uses a higher value
   * (e.g. 30 or 90) so SOX auditors see "15d ago" instead of a date.
   */
  readonly maxDays?: number;

  /**
   * IETF BCP 47 locale tag (e.g. "en-US", "fr-FR", "ja-JP"). Default "en-US".
   * Affects the calendar-date fallback formatting (month names, order).
   */
  readonly locale?: string;

  /**
   * Reference time for the diff calculation. Defaults to Date.now().
   * Useful for testing or for backfilled timestamps.
   */
  readonly now?: number;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Format an ISO 8601 timestamp (or epoch ms, or Date) as a human-readable
 * relative-time string.
 *
 * Buckets:
 *   - 0-59 seconds: "just now"
 *   - 1-59 minutes: "{n}m ago"
 *   - 1-23 hours:   "{n}h ago"
 *   - 1-{maxDays} days: "{n}d ago"
 *   - >{maxDays} days: locale-formatted calendar date (e.g. "Jun 15, 2026")
 *
 * Returns "unknown" for malformed input.
 */
export function formatRelativeTime(
  timestamp: string | number | Date | null | undefined,
  options: FormatRelativeTimeOptions = {}
): string {
  const { maxDays = 7, locale = 'en-US', now = Date.now() } = options;

  const thenMs = parseToUTCEpoch(timestamp);
  if (thenMs === null) return 'unknown';

  // Future timestamps (clock skew) → treat as "just now"
  const diffMs = Math.max(0, now - thenMs);

  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < maxDays) return `${days}d ago`;

  // Calendar-date fallback: locale-aware, year-aware.
  // Uses Intl.DateTimeFormat for correct localization.
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(thenMs));
}

// ---------------------------------------------------------------------------
// Backward-compat aliases (replicate the original 5 functions' default behavior)
// ---------------------------------------------------------------------------

/**
 * Backward-compat alias matching ActivityFeed.tsx / ForecastListPage.tsx /
 * AuditTrailPage.tsx default behavior: 7-day cap, "Just now" capitalization.
 * Kept for any callers that depend on the exact original string format.
 */
export function formatRelativeTimeLegacy(
  timestamp: string | number | Date | null | undefined,
  options: FormatRelativeTimeOptions = {}
): string {
  const result = formatRelativeTime(timestamp, { maxDays: 7, ...options });
  // Match legacy "Just now" capitalization (new canonical is lowercase)
  return result === 'just now' ? 'Just now' : result;
}

/**
 * Backward-compat alias matching BudgetListPage.tsx default: 30-day cap.
 * Accepts an optional options object to support `now` injection for deterministic tests.
 */
export function formatRelativeTimeBudget(
  timestamp: string | number | Date | null | undefined,
  options?: FormatRelativeTimeOptions
): string {
  return formatRelativeTime(timestamp, { maxDays: 30, ...options });
}
