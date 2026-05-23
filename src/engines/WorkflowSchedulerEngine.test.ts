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

  describe('createSchedule', () => {
    it('creates a daily schedule', () => {
      const schedule = engine.createSchedule(
        'Daily Close',
        'Run daily close process',
        'wf-1',
        'daily',
        { hour: 23, minute: 0 }
      );
      expect(schedule.id).toMatch(/^sch-/);
      expect(schedule.name).toBe('Daily Close');
      expect(schedule.frequency).toBe('daily');
      expect(schedule.status).toBe('active');
      expect(schedule.executionCount).toBe(0);
    });

    it('creates a monthly schedule', () => {
      const schedule = engine.createSchedule(
        'Monthly Report',
        'Generate monthly P&L',
        'wf-2',
        'monthly',
        { dayOfMonth: 1, hour: 9 }
      );
      expect(schedule.frequency).toBe('monthly');
    });

    it('creates a weekly schedule with days', () => {
      const schedule = engine.createSchedule(
        'Weekly Review',
        'Review variances',
        'wf-3',
        'weekly',
        { daysOfWeek: ['monday', 'friday'] }
      );
      expect(schedule.frequency).toBe('weekly');
    });
  });

  describe('getSchedule / listSchedules', () => {
    it('retrieves a schedule by id', () => {
      const s = engine.createSchedule('Test', 'desc', 'wf', 'daily');
      expect(engine.getSchedule(s.id)).toBeDefined();
    });

    it('returns undefined for missing id', () => {
      expect(engine.getSchedule('nonexistent')).toBeUndefined();
    });

    it('lists all schedules', () => {
      engine.createSchedule('A', 'd', 'wf', 'daily');
      engine.createSchedule('B', 'd', 'wf', 'weekly');
      expect(engine.listSchedules().length).toBe(2);
    });
  });

  describe('listActiveSchedules', () => {
    it('returns only active schedules', () => {
      const s1 = engine.createSchedule('A', 'd', 'wf', 'daily');
      engine.createSchedule('B', 'd', 'wf', 'weekly');
      engine.pauseSchedule(s1.id);
      expect(engine.listActiveSchedules().length).toBe(1);
    });
  });

  describe('deleteSchedule', () => {
    it('deletes a schedule', () => {
      const s = engine.createSchedule('Test', 'd', 'wf', 'daily');
      expect(engine.deleteSchedule(s.id)).toBe(true);
      expect(engine.getSchedule(s.id)).toBeUndefined();
    });

    it('returns false for missing id', () => {
      expect(engine.deleteSchedule('nonexistent')).toBe(false);
    });
  });

  describe('pauseSchedule / resumeSchedule', () => {
    it('pauses an active schedule', () => {
      const s = engine.createSchedule('Test', 'd', 'wf', 'daily');
      expect(engine.pauseSchedule(s.id)).toBe(true);
      expect(engine.getSchedule(s.id)?.status).toBe('paused');
    });

    it('resumes a paused schedule', () => {
      const s = engine.createSchedule('Test', 'd', 'wf', 'daily');
      engine.pauseSchedule(s.id);
      expect(engine.resumeSchedule(s.id)).toBe(true);
      expect(engine.getSchedule(s.id)?.status).toBe('active');
    });

    it('cannot pause non-active schedule', () => {
      const s = engine.createSchedule('Test', 'd', 'wf', 'daily');
      engine.pauseSchedule(s.id);
      expect(engine.pauseSchedule(s.id)).toBe(false);
    });

    it('cannot resume non-paused schedule', () => {
      const s = engine.createSchedule('Test', 'd', 'wf', 'daily');
      expect(engine.resumeSchedule(s.id)).toBe(false);
    });
  });

  describe('updateSchedule', () => {
    it('updates schedule name', () => {
      const s = engine.createSchedule('Old Name', 'd', 'wf', 'daily');
      expect(engine.updateSchedule(s.id, { name: 'New Name' })).toBe(true);
      expect(engine.getSchedule(s.id)?.name).toBe('New Name');
    });

    it('returns false for missing id', () => {
      expect(engine.updateSchedule('nonexistent', { name: 'X' })).toBe(false);
    });
  });

  describe('markExecuted', () => {
    it('records a successful execution', () => {
      const s = engine.createSchedule('Test', 'd', 'wf', 'daily');
      const exec = engine.markExecuted(s.id, true, { result: 'ok' });
      expect(exec).not.toBeNull();
      expect(exec?.status).toBe('completed');
      expect(engine.getSchedule(s.id)?.executionCount).toBe(1);
    });

    it('records a failed execution', () => {
      const s = engine.createSchedule('Test', 'd', 'wf', 'daily');
      const exec = engine.markExecuted(s.id, false, undefined, 'timeout');
      expect(exec?.status).toBe('failed');
      expect(exec?.error).toBe('timeout');
    });

    it('returns null for non-existent schedule', () => {
      expect(engine.markExecuted('nonexistent', true)).toBeNull();
    });
  });

  describe('getExecutions', () => {
    it('returns executions for a schedule', () => {
      const s = engine.createSchedule('Test', 'd', 'wf', 'daily');
      engine.markExecuted(s.id, true);
      engine.markExecuted(s.id, true);
      expect(engine.getExecutions(s.id).length).toBe(2);
    });

    it('returns all executions when no id', () => {
      const s1 = engine.createSchedule('A', 'd', 'wf', 'daily');
      const s2 = engine.createSchedule('B', 'd', 'wf', 'daily');
      engine.markExecuted(s1.id, true);
      engine.markExecuted(s2.id, true);
      expect(engine.getExecutions().length).toBe(2);
    });
  });

  describe('calendar', () => {
    it('adds a calendar event', () => {
      engine.addCalendarEvent('Board Meeting', '2026-06-01', 'review', 'US01');
      expect(engine.getCalendarEvents().length).toBe(1);
    });

    it('removes a calendar event', () => {
      engine.addCalendarEvent('X', '2026-06-01', 'custom');
      const events = engine.getCalendarEvents();
      expect(engine.removeCalendarEvent(events[0].id)).toBe(true);
      expect(engine.getCalendarEvents().length).toBe(0);
    });
  });

  describe('getDueSchedules', () => {
    it('returns empty when no schedules are due', () => {
      engine.createSchedule('Test', 'd', 'wf', 'daily', { hour: 23, minute: 59 });
      expect(engine.getDueSchedules().length).toBe(0);
    });
  });

  describe('serialize / deserialize', () => {
    it('round-trips schedules and executions', () => {
      const s = engine.createSchedule('Test', 'd', 'wf', 'daily');
      engine.markExecuted(s.id, true);
      const json = engine.serialize();
      const engine2 = new WorkflowSchedulerEngine();
      engine2.deserialize(json);
      expect(engine2.listSchedules().length).toBe(1);
      expect(engine2.getExecutions().length).toBe(1);
    });
  });
});
