/**
 * Injectable clock.
 *
 * Financial calculations and period selection must be deterministic: the
 * same inputs must produce the same outputs regardless of when the code
 * runs. Reading `new Date()` / `Date.now()` directly inside pages, stores or
 * engines makes behaviour drift with the calendar (the PeriodClosePage test
 * suite rotted the day the hard-coded "current" month passed).
 *
 * Production code calls `now()` / `todayISO()`. Tests pin the clock with
 * `setClock()` and restore it with `resetClock()`. Nothing else in the app
 * should construct the current time directly.
 */

export type Clock = () => Date;

const systemClock: Clock = () => new Date();

let activeClock: Clock = systemClock;

/** Current instant from the active clock. */
export function now(): Date {
  return activeClock();
}

/** Current date as `YYYY-MM-DD` (UTC) from the active clock. */
export function todayISO(): string {
  return now().toISOString().slice(0, 10);
}

/**
 * Replace the active clock. Accepts a fixed instant (Date or ISO string) or
 * a function. Intended for tests and for replaying a run at a given date.
 */
export function setClock(fixed: Date | string | Clock): void {
  if (typeof fixed === 'function') {
    activeClock = fixed;
    return;
  }
  const instant = fixed instanceof Date ? new Date(fixed.getTime()) : new Date(fixed);
  if (Number.isNaN(instant.getTime())) {
    throw new Error(`setClock: invalid instant ${String(fixed)}`);
  }
  activeClock = () => new Date(instant.getTime());
}

/** Restore the real system clock. */
export function resetClock(): void {
  activeClock = systemClock;
}
