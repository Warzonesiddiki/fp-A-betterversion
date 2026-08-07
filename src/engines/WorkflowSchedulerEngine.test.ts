/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowSchedulerEngine } from './WorkflowSchedulerEngine';

describe('WorkflowSchedulerEngine', () => {
  let engine: WorkflowSchedulerEngine;

  beforeEach(() => {
    engine = new WorkflowSchedulerEngine();
  });

  describe('createSchedule and frequencies', () => {
    it('creates once, hourly, daily, weekly, monthly, quarterly, yearly, custom schedules', () => {
      const sOnce = engine.createSchedule('Once', 'desc', 'wf-1', 'once');
      const sHourly = engine.createSchedule('Hourly', 'desc', 'wf-1', 'hourly', { minute: 15 });
      const sDaily = engine.createSchedule('Daily', 'desc', 'wf-1', 'daily', {
        hour: 8,
        minute: 30,
        skipWeekends: true,
      });
      const sWeekly = engine.createSchedule('Weekly', 'desc', 'wf-1', 'weekly', {
        daysOfWeek: ['monday'],
      });
      const sMonthly = engine.createSchedule('Monthly', 'desc', 'wf-1', 'monthly', {
        dayOfMonth: 15,
        hour: 10,
      });
      const sQuarterly = engine.createSchedule('Quarterly', 'desc', 'wf-1', 'quarterly', {
        month: 1,
        dayOfMonth: 1,
      });
      const sYearly = engine.createSchedule('Yearly', 'desc', 'wf-1', 'yearly', {
        month: 11,
        dayOfMonth: 31,
      });
      const sCustom = engine.createSchedule('Custom', 'desc', 'wf-1', 'custom', {
        intervalMinutes: 45,
      });

      expect(sOnce.nextRunAt).toBeDefined();
      expect(sHourly.nextRunAt).toBeDefined();
      expect(sDaily.nextRunAt).toBeDefined();
      expect(sWeekly.nextRunAt).toBeDefined();
      expect(sMonthly.nextRunAt).toBeDefined();
      expect(sQuarterly.nextRunAt).toBeDefined();
      expect(sYearly.nextRunAt).toBeDefined();
      expect(sCustom.nextRunAt).toBeDefined();
    });
  });

  describe('getSchedule / listSchedules / listActiveSchedules', () => {
    it('retrieves and filters active schedules', () => {
      const s1 = engine.createSchedule('A', 'd', 'wf', 'daily');
      engine.createSchedule('B', 'd', 'wf', 'weekly');
      expect(engine.getSchedule(s1.id)).toBeDefined();
      expect(engine.getSchedule('nonexistent')).toBeUndefined();
      expect(engine.listSchedules()).toHaveLength(2);

      engine.pauseSchedule(s1.id);
      expect(engine.listActiveSchedules()).toHaveLength(1);
    });
  });

  describe('deleteSchedule, pauseSchedule, resumeSchedule, updateSchedule', () => {
    it('manages pause, resume, and updates on schedule properties', () => {
      const s = engine.createSchedule('Old Name', 'desc', 'wf', 'daily');
      expect(engine.pauseSchedule(s.id)).toBe(true);
      expect(engine.pauseSchedule(s.id)).toBe(false); // already paused

      expect(engine.resumeSchedule(s.id)).toBe(true);
      expect(engine.resumeSchedule(s.id)).toBe(false); // already active

      expect(
        engine.updateSchedule(s.id, {
          name: 'New Name',
          description: 'New Desc',
          frequency: 'monthly',
          config: { dayOfMonth: 1 },
          endDate: '2026-12-31',
          maxExecutions: 10,
        })
      ).toBe(true);
      expect(engine.getSchedule(s.id)?.name).toBe('New Name');
      expect(engine.updateSchedule('nonexistent', {})).toBe(false);

      expect(engine.deleteSchedule(s.id)).toBe(true);
      expect(engine.deleteSchedule('nonexistent')).toBe(false);
    });
  });

  describe('getDueSchedules and markExecuted', () => {
    it('finds due schedules and executes them respecting maxExecutions and retryOnFailure', () => {
      const s = engine.createSchedule('Due Test', 'd', 'wf', 'once');
      // Force nextRunAt into the past
      s.nextRunAt = new Date(Date.now() - 10000).toISOString();

      const due = engine.getDueSchedules();
      expect(due).toHaveLength(1);

      const exec = engine.markExecuted(s.id, true, { processed: 100 });
      expect(exec).not.toBeNull();
      expect(exec?.status).toBe('completed');
      expect(exec?.output?.processed).toBe(100);

      // Max execution check
      s.maxExecutions = 1;
      expect(engine.getDueSchedules()).toHaveLength(0);

      // Failure check with retryOnFailure
      const sFail = engine.createSchedule('Fail Test', 'd', 'wf', 'daily', {
        retryOnFailure: true,
      });
      const execFail = engine.markExecuted(sFail.id, false, undefined, 'Server error');
      expect(execFail?.status).toBe('failed');
      expect(sFail.status).toBe('active'); // retained active for retry
    });

    it('returns null when executing non-existent schedule', () => {
      expect(engine.markExecuted('nonexistent', true)).toBeNull();
    });
  });

  describe('calendar events and business day calculator', () => {
    it('adds, filters by date range, and removes calendar events', () => {
      const e1 = engine.addCalendarEvent('P&L Close', '2026-06-01', 'close', 'US01');
      engine.addCalendarEvent('Audit Prep', '2026-06-15', 'review', 'US01');
      engine.addCalendarEvent('Tax Filing', '2026-07-01', 'report', 'US01');

      const juneEvents = engine.getCalendarEvents('2026-06-01', '2026-06-30');
      expect(juneEvents).toHaveLength(2);

      expect(engine.removeCalendarEvent(e1.id)).toBe(true);
      expect(engine.removeCalendarEvent('nonexistent')).toBe(false);
      expect(engine.getCalendarEvents()).toHaveLength(2);
    });

    it('calculates business days skipping weekends and holiday lists', () => {
      const saturday = new Date('2026-08-08T12:00:00Z');
      const monday = new Date('2026-08-10T12:00:00Z');

      const config = {
        skipHolidays: true,
        holidays: ['2026-08-10'],
      };

      expect(engine.isBusinessDay(saturday, config)).toBe(false);
      expect(engine.isBusinessDay(monday, config)).toBe(false); // Holiday

      const nextBusi = engine.getNextBusinessDay(saturday, config);
      expect(nextBusi.getDay()).toBe(2); // Tuesday (Aug 11)
    });
  });

  describe('serialize / deserialize', () => {
    it('round-trips full scheduler state and returns false on malformed JSON', () => {
      const s = engine.createSchedule('Test', 'd', 'wf', 'daily');
      engine.addCalendarEvent('Evt', '2026-08-01', 'close');
      engine.markExecuted(s.id, true);

      const json = engine.serialize();
      const newEngine = new WorkflowSchedulerEngine();
      expect(newEngine.deserialize(json)).toBe(true);
      expect(newEngine.listSchedules()).toHaveLength(1);
      expect(newEngine.getCalendarEvents()).toHaveLength(1);
      expect(newEngine.getExecutions()).toHaveLength(1);

      expect(newEngine.deserialize('invalid json {')).toBe(false);
    });
  });
});
