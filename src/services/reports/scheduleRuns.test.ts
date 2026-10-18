import { describe, it, expect } from 'vitest';
import { findDueSchedules, advanceNextRun, markScheduleRun } from './scheduleRuns';
import type { ScheduledReport } from '@/types';

/**
 * Phase 9 report governance: schedules were dead CRUD records — a
 * nextRun date nothing consumed, under copy claiming automatic
 * distribution. The governed contract: due schedules are detected,
 * a human runs them, the run is recorded, and nextRun advances past
 * the run time. Distribution stays manual (disclosed) until a real
 * connector exists (extension E2).
 */

const NOW = '2026-10-18T09:00:00.000Z';

function schedule(over: Partial<ScheduledReport>): ScheduledReport {
  return {
    id: 's1',
    reportId: 'r1',
    frequency: 'monthly',
    recipients: ['cfo@example.com'],
    nextRun: '2026-10-01T09:00:00.000Z',
    isActive: true,
    ...over,
  };
}

describe('findDueSchedules', () => {
  it('returns active schedules whose nextRun has passed', () => {
    const due = findDueSchedules(
      [
        schedule({ id: 'a' }),
        schedule({ id: 'b', nextRun: '2026-11-01T09:00:00.000Z' }),
        schedule({ id: 'c', isActive: false }),
      ],
      NOW
    );
    expect(due.map((s) => s.id)).toEqual(['a']);
  });
});

describe('advanceNextRun', () => {
  it('advances each frequency in UTC', () => {
    expect(advanceNextRun('daily', '2026-10-18T09:00:00.000Z')).toBe('2026-10-19T09:00:00.000Z');
    expect(advanceNextRun('weekly', '2026-10-18T09:00:00.000Z')).toBe('2026-10-25T09:00:00.000Z');
    expect(advanceNextRun('monthly', '2026-10-18T09:00:00.000Z')).toBe('2026-11-18T09:00:00.000Z');
    expect(advanceNextRun('quarterly', '2026-10-18T09:00:00.000Z')).toBe('2027-01-18T09:00:00.000Z');
    expect(advanceNextRun('yearly', '2026-10-18T09:00:00.000Z')).toBe('2027-10-18T09:00:00.000Z');
  });
  it('clamps month-end (Jan 31 monthly -> Feb 28)', () => {
    expect(advanceNextRun('monthly', '2026-01-31T09:00:00.000Z')).toBe('2026-02-28T09:00:00.000Z');
  });
  it('refuses frequencies it cannot advance honestly', () => {
    expect(() => advanceNextRun('custom', NOW)).toThrow(/custom/);
  });
});

describe('markScheduleRun', () => {
  it('records the run and advances nextRun strictly past the run time', () => {
    const updated = markScheduleRun(
      schedule({ nextRun: '2026-08-01T09:00:00.000Z' }),
      NOW,
      'opened-for-generation'
    );
    expect(updated.lastRunAt).toBe(NOW);
    expect(updated.lastRunStatus).toBe('opened-for-generation');
    // Monthly from Aug 1 must skip past Oct 18: Nov 1.
    expect(updated.nextRun).toBe('2026-11-01T09:00:00.000Z');
  });
});
