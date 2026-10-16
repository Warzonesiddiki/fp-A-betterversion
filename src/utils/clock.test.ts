import { afterEach, describe, expect, it } from 'vitest';
import { now, nowISO, nowMs, todayISO, setClock, resetClock } from './clock';

describe('clock', () => {
  afterEach(() => {
    resetClock();
  });

  it('defaults to the system clock', () => {
    const before = Date.now();
    const t = now().getTime();
    const after = Date.now();
    expect(t).toBeGreaterThanOrEqual(before);
    expect(t).toBeLessThanOrEqual(after);
  });

  it('pins to a fixed ISO instant and derives todayISO in UTC', () => {
    setClock('2026-08-07T23:30:00Z');
    expect(now().toISOString()).toBe('2026-08-07T23:30:00.000Z');
    expect(todayISO()).toBe('2026-08-07');
  });

  it('pins to a Date without aliasing the caller’s object', () => {
    const d = new Date('2025-01-31T00:00:00Z');
    setClock(d);
    d.setUTCFullYear(1999);
    expect(todayISO()).toBe('2025-01-31');
    // Each call returns a fresh Date so callers cannot mutate the pin.
    now().setUTCFullYear(1999);
    expect(todayISO()).toBe('2025-01-31');
  });

  it('nowISO and nowMs read the active clock', () => {
    setClock('2026-10-15T09:30:00.250Z');
    expect(nowISO()).toBe('2026-10-15T09:30:00.250Z');
    expect(nowMs()).toBe(Date.UTC(2026, 9, 15, 9, 30, 0, 250));
  });

  it('accepts a function clock', () => {
    let tick = 0;
    setClock(() => new Date(Date.UTC(2026, 0, 1 + tick++)));
    expect(todayISO()).toBe('2026-01-01');
    expect(todayISO()).toBe('2026-01-02');
  });

  it('rejects an unparseable instant', () => {
    expect(() => setClock('not-a-date')).toThrow(/invalid instant/);
  });

  it('resetClock restores the system clock', () => {
    setClock('2000-01-01T00:00:00Z');
    resetClock();
    expect(now().getUTCFullYear()).toBeGreaterThan(2000);
  });
});
