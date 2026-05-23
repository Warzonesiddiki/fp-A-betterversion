import { describe, it, expect, beforeEach } from 'vitest';
import { ReportSchedulingEngine } from './ReportSchedulingEngine';

describe('ReportSchedulingEngine', () => {
  let engine: ReportSchedulingEngine;

  beforeEach(() => {
    engine = new ReportSchedulingEngine();
  });

  it('should create a schedule', () => {
    const schedule = engine.createSchedule('Monthly P&L', 'rpt-1', 'monthly', ['cfo@company.com']);
    expect(schedule.id).toBeDefined();
    expect(schedule.name).toBe('Monthly P&L');
    expect(schedule.enabled).toBe(true);
  });

  it('should list schedules', () => {
    engine.createSchedule('S1', 'rpt-1', 'daily', ['a@test.com']);
    engine.createSchedule('S2', 'rpt-2', 'weekly', ['b@test.com']);
    expect(engine.listSchedules()).toHaveLength(2);
  });

  it('should delete a schedule', () => {
    const s = engine.createSchedule('Test', 'rpt-1', 'daily', ['a@test.com']);
    expect(engine.deleteSchedule(s.id)).toBe(true);
    expect(engine.getSchedule(s.id)).toBeUndefined();
  });

  it('should enable and disable schedules', () => {
    const s = engine.createSchedule('Test', 'rpt-1', 'daily', ['a@test.com']);
    engine.disableSchedule(s.id);
    expect(engine.getSchedule(s.id)?.enabled).toBe(false);
    engine.enableSchedule(s.id);
    expect(engine.getSchedule(s.id)?.enabled).toBe(true);
  });

  it('should execute a schedule', () => {
    const s = engine.createSchedule('Test', 'rpt-1', 'daily', ['a@test.com']);
    const delivery = engine.executeSchedule(s.id);
    expect(delivery).not.toBeNull();
    expect(delivery?.status).toBe('pending');
    expect(engine.getSchedule(s.id)?.lastRun).toBeDefined();
  });

  it('should mark delivery as sent', () => {
    const s = engine.createSchedule('Test', 'rpt-1', 'daily', ['a@test.com']);
    const delivery = engine.executeSchedule(s.id);
    engine.markDelivered(delivery!.id, 1024);
    expect(engine.getDeliveryHistory()[0].status).toBe('sent');
    expect(engine.getDeliveryHistory()[0].fileSize).toBe(1024);
  });

  it('should mark delivery as failed', () => {
    const s = engine.createSchedule('Test', 'rpt-1', 'daily', ['a@test.com']);
    const delivery = engine.executeSchedule(s.id);
    engine.markFailed(delivery!.id, 'SMTP error');
    expect(engine.getDeliveryHistory()[0].status).toBe('failed');
    expect(engine.getDeliveryHistory()[0].error).toBe('SMTP error');
  });

  it('should manage subscriptions', () => {
    const s = engine.createSchedule('Test', 'rpt-1', 'daily', ['a@test.com']);
    engine.subscribe('user1', s.id);
    expect(engine.getUserSubscriptions('user1')).toHaveLength(1);
    engine.unsubscribe('user1', s.id);
    expect(engine.getUserSubscriptions('user1')).toHaveLength(0);
  });

  it('should get stats', () => {
    const s = engine.createSchedule('Test', 'rpt-1', 'daily', ['a@test.com']);
    engine.executeSchedule(s.id);
    const stats = engine.getStats();
    expect(stats.totalSchedules).toBe(1);
    expect(stats.totalDeliveries).toBe(1);
  });

  it('should serialize and deserialize', () => {
    engine.createSchedule('Test', 'rpt-1', 'daily', ['a@test.com']);
    const json = engine.serialize();
    const engine2 = new ReportSchedulingEngine();
    engine2.deserialize(json);
    expect(engine2.listSchedules()).toHaveLength(1);
  });
});
