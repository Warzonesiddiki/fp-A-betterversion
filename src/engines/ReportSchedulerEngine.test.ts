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

  describe('createSchedule', () => {
    it('creates a report schedule', () => {
      const entry = engine.createSchedule(
        'rpt-1',
        'Report 1',
        { frequency: 'daily', hour: 9, minute: 0 },
        ['user@test.com']
      );
      expect(entry.id).toBeDefined();
      expect(entry.reportId).toBe('rpt-1');
    });
  });

  describe('deleteSchedule', () => {
    it('removes a schedule', () => {
      const entry = engine.createSchedule(
        'rpt-1',
        'Report 1',
        { frequency: 'daily', hour: 9, minute: 0 },
        ['user@test.com']
      );
      const result = engine.deleteSchedule(entry.id);
      expect(result).toBe(true);
    });
  });

  describe('listSchedules', () => {
    it('lists all schedules', () => {
      engine.createSchedule('rpt-1', 'Report 1', { frequency: 'daily', hour: 9, minute: 0 }, [
        'a@b.com',
      ]);
      engine.createSchedule('rpt-2', 'Report 2', { frequency: 'weekly', hour: 10, minute: 0 }, [
        'c@d.com',
      ]);
      const list = engine.listSchedules();
      expect(list.length).toBe(2);
    });
  });
});
