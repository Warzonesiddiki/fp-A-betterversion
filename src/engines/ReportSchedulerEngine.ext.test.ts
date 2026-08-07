/**
 * ReportSchedulerEngine.ext.test.ts — schedule lifecycle, next-run math,
 * due detection, run recording (MISSION D wave 2, 2026-08-07).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportSchedulerEngine, type ScheduleConfig } from './ReportSchedulerEngine';

const NOW = new Date('2026-08-07T10:00:00Z');

describe('ReportSchedulerEngine', () => {
  let e: ReportSchedulerEngine;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    e = new ReportSchedulerEngine();
  });
  afterEach(() => vi.useRealTimers());

  it('createSchedule computes the next run for a daily schedule', () => {
    const s = e.createSchedule('r1', 'Daily Report', { frequency: 'daily', hour: 9, minute: 0 });
    expect(s.id).toMatch(/^sched-/);
    expect(s.enabled).toBe(true);
    expect(s.runCount).toBe(0);
    // 9:00 today already passed (now 10:00) → next run tomorrow 9:00
    expect(new Date(s.nextRun).getDate()).toBe(NOW.getDate() + 1);
    expect(new Date(s.nextRun).getUTCHours()).toBe(9);
  });

  it('weekly schedule lands on the configured day', () => {
    // 2026-08-07 is a Friday; dayOfWeek 1 = Monday
    const s = e.createSchedule('r1', 'W', {
      frequency: 'weekly',
      hour: 8,
      minute: 30,
      dayOfWeek: 1,
    });
    expect(new Date(s.nextRun).getUTCDay()).toBe(1);
    expect(new Date(s.nextRun).getUTCHours()).toBe(8);
    // Friday 2026-08-07 → next Monday is 2026-08-10
    expect(new Date(s.nextRun).getUTCDate()).toBe(10);
  });

  it('monthly / quarterly / yearly schedules', () => {
    const monthly = e.createSchedule('r1', 'M', {
      frequency: 'monthly',
      hour: 0,
      minute: 0,
      dayOfMonth: 1,
    });
    expect(new Date(monthly.nextRun).getUTCDate()).toBe(1);
    expect(new Date(monthly.nextRun).getUTCMonth()).toBe(8); // Sept 1 (day 1 of next month)
    const quarterly = e.createSchedule('r1', 'Q', { frequency: 'quarterly', hour: 0, minute: 0 });
    expect(new Date(quarterly.nextRun).getUTCMonth()).toBe(9); // Oct 1
    const yearly = e.createSchedule('r1', 'Y', { frequency: 'yearly', hour: 0, minute: 0 });
    expect(new Date(yearly.nextRun).getUTCMonth()).toBe(0);
    expect(new Date(yearly.nextRun).getUTCFullYear()).toBe(2027);
  });

  it('updateSchedule / pause / resume / delete', () => {
    const s = e.createSchedule('r1', 'R', { frequency: 'daily', hour: 9, minute: 0 });
    const updated = e.updateSchedule(s.id, { recipients: ['a@b.c'], enabled: false });
    expect(updated!.enabled).toBe(false);
    expect(updated!.recipients).toEqual(['a@b.c']);
    expect(e.updateSchedule('nope', {})).toBeNull();
    expect(e.pauseSchedule(s.id)).toBe(true);
    expect(e.pauseSchedule('nope')).toBe(false);
    expect(e.resumeSchedule(s.id)).toBe(true);
    expect(e.resumeSchedule('nope')).toBe(false);
    expect(e.deleteSchedule(s.id)).toBe(true);
    expect(e.deleteSchedule(s.id)).toBe(false);
    expect(e.listSchedules()).toHaveLength(0);
  });

  it('getDueSchedules returns only enabled, due entries', () => {
    const future = e.createSchedule('r1', 'Future', { frequency: 'daily', hour: 23, minute: 0 });
    expect(e.getDueSchedules()).toHaveLength(0);
    // restore a backup with an overdue nextRun → surfaces as due
    const overdue = e.createSchedule('r1', 'Overdue', { frequency: 'daily', hour: 1, minute: 0 });
    const restored = new ReportSchedulerEngine();
    restored.deserialize(
      JSON.stringify({
        schedules: [[overdue.id, { ...overdue, nextRun: '2026-08-01T00:00:00.000Z' }]],
        runs: [],
      })
    );
    expect(restored.getDueSchedules().map((s) => s.id)).toEqual([overdue.id]);
    restored.pauseSchedule(overdue.id);
    expect(restored.getDueSchedules()).toHaveLength(0);
    void future;
  });

  it('recordRun tracks completions and advances nextRun', () => {
    // schedule at 23:00 today (still in the future at 10:00) — a completed run
    // before that time must roll nextRun to tomorrow
    const s = e.createSchedule('r1', 'R', { frequency: 'daily', hour: 23, minute: 0 });
    const firstNext = s.nextRun;
    expect(new Date(firstNext).getUTCDate()).toBe(NOW.getUTCDate()); // today 23:00
    // run AFTER the scheduled time (23:30) → nextRun rolls to tomorrow 23:00
    vi.setSystemTime(new Date('2026-08-07T23:30:00Z'));
    const run = e.recordRun(s.id, 'completed');
    expect(run!.status).toBe('completed');
    expect(run!.completedAt).toBeDefined();
    expect(s.runCount).toBe(1);
    expect(s.lastRun).toBe(run!.startedAt);
    expect(new Date(s.nextRun).getUTCDate()).toBe(NOW.getUTCDate() + 1); // advanced
    // failed run records an error and does not advance
    const fail = e.recordRun(s.id, 'failed', 'boom');
    expect(fail!.error).toBe('boom');
    expect(fail!.completedAt).toBeDefined();
    expect(s.runCount).toBe(1);
    expect(e.recordRun('nope', 'completed')).toBeNull();
    expect(e.getRuns(s.id)).toHaveLength(2);
    expect(e.getRuns('nope')).toHaveLength(0);
  });

  it('serialize / deserialize round-trips', () => {
    const s = e.createSchedule('r1', 'R', { frequency: 'daily', hour: 9, minute: 0 });
    e.recordRun(s.id, 'completed');
    const json = e.serialize();
    const e2 = new ReportSchedulerEngine();
    e2.deserialize(json);
    expect(e2.listSchedules()).toHaveLength(1);
    expect(e2.getRuns(s.id)).toHaveLength(1);
    expect(e2.getSchedule(s.id)!.runCount).toBe(1);
  });
});

describe('ReportSchedulerEngine — custom frequency', () => {
  it('custom frequency behaves like daily', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const e = new ReportSchedulerEngine();
    const s = e.createSchedule('r1', 'C', { frequency: 'custom', hour: 9, minute: 0 });
    expect(new Date(s.nextRun).getDate()).toBe(NOW.getDate() + 1);
    vi.useRealTimers();
  });
});

describe('ReportSchedulerEngine — schedule config type', () => {
  it('accepts the full config shape', () => {
    const config: ScheduleConfig = { frequency: 'weekly', hour: 12, minute: 15, dayOfWeek: 5 };
    expect(config.dayOfWeek).toBe(5);
  });
});
