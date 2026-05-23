/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ReportSchedulerEngine } from './ReportSchedulerEngine';

describe('ReportSchedulerEngine', () => {
  let engine: ReportSchedulerEngine;

  beforeEach(() => {
    engine = new ReportSchedulerEngine();
  });

  describe('addSchedule', () => {
    it('adds a report schedule', () => {
      const schedule = {
        reportId: 'rpt-1',
        frequency: 'daily' as const,
        time: '09:00',
        recipients: ['user@test.com'],
        format: 'pdf' as const,
      };
      const result = engine.addSchedule(schedule);
      expect(result.success).toBe(true);
      expect(result.scheduleId).toBeDefined();
    });
  });

  describe('removeSchedule', () => {
    it('removes a schedule', () => {
      const schedule = {
        reportId: 'rpt-1',
        frequency: 'daily' as const,
        time: '09:00',
        recipients: ['user@test.com'],
        format: 'pdf' as const,
      };
      const { scheduleId } = engine.addSchedule(schedule);
      const result = engine.deleteSchedule(scheduleId);
      expect(result.success).toBe(true);
    });
  });

  describe('listSchedules', () => {
    it('lists all schedules', () => {
      engine.addSchedule({
        reportId: 'rpt-1',
        frequency: 'daily',
        time: '09:00',
        recipients: ['a@b.com'],
        format: 'pdf',
      });
      engine.addSchedule({
        reportId: 'rpt-2',
        frequency: 'weekly',
        time: '10:00',
        recipients: ['c@d.com'],
        format: 'excel',
      });
      const list = engine.listSchedules();
      expect(list.length).toBe(2);
    });
  });
});
