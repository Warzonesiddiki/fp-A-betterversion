/**
 * DataRetentionEngine.ext.test.ts — retention policy evaluation (MISSION D
 * wave 2, 2026-08-07). Uses fixed timestamps via vi.setSystemTime so the
 * age-vs-retentionDays logic is deterministic.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DataRetentionEngine,
  createFinancialDataRetention,
  type RetentionRule,
} from './DataRetentionEngine';

const NOW = new Date('2026-08-07T00:00:00Z');

const daysAgo = (days: number): string => new Date(NOW.getTime() - days * 86400000).toISOString();

describe('DataRetentionEngine — policy evaluation', () => {
  let engine: DataRetentionEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    engine = new DataRetentionEngine();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const rule = (over: Partial<RetentionRule> = {}): RetentionRule => ({
    id: 'r1',
    name: 'Test',
    description: '',
    dataSource: 'gl_entries',
    retentionDays: 90,
    action: 'delete',
    priority: 1,
    enabled: true,
    ...over,
  });

  it('evaluate flags records older than the retention period', () => {
    engine.addRule(rule({ action: 'archive', retentionDays: 30 }));
    const results = engine.evaluate(
      'gl_entries',
      [
        { id: 'new', createdAt: daysAgo(10) },
        { id: 'old', createdAt: daysAgo(60) },
        { id: 'exact', createdAt: daysAgo(30) }, // boundary: >= retentionDays
      ],
      'createdAt'
    );
    expect(results.map((r) => r.recordId).sort()).toEqual(['exact', 'old']);
    const old = results.find((r) => r.recordId === 'old')!;
    expect(old.action).toBe('archive');
    expect(old.archivedAt).toBe(NOW.toISOString());
    expect(old.originalData).toEqual({ id: 'old', createdAt: daysAgo(60) });
    expect(old.reason).toContain('exceeds retention period');
  });

  it('skips records without a date or with an invalid date', () => {
    engine.addRule(rule());
    const results = engine.evaluate(
      'gl_entries',
      [{ id: 'nodate' }, { id: 'bad', createdAt: 'not-a-date' }],
      'createdAt'
    );
    expect(results).toHaveLength(0);
  });

  it('only applies enabled rules for the matching data source', () => {
    engine.addRule(rule({ enabled: false }));
    engine.addRule(rule({ id: 'r2', dataSource: 'other', retentionDays: 0 }));
    const results = engine.evaluate(
      'gl_entries',
      [{ id: 'x', createdAt: daysAgo(999) }],
      'createdAt'
    );
    expect(results).toHaveLength(0);
  });

  it('honors a custom condition predicate', () => {
    engine.addRule(rule({ action: 'delete', condition: (rec) => rec.flag === 'purge' }));
    const results = engine.evaluate(
      'gl_entries',
      [
        { id: 'keep', createdAt: daysAgo(999), flag: 'keep' },
        { id: 'purge', createdAt: daysAgo(999), flag: 'purge' },
      ],
      'createdAt'
    );
    expect(results.map((r) => r.recordId)).toEqual(['purge']);
    expect(results[0]!.deletedAt).toBe(NOW.toISOString());
  });

  it('execute produces per-rule reports with counts', () => {
    engine.addRule(rule({ id: 'del', name: 'Delete Old', retentionDays: 30 }));
    engine.addRule(rule({ id: 'arc', name: 'Archive Old', retentionDays: 30, action: 'archive' }));
    const reports = engine.execute(
      'gl_entries',
      [
        { id: 'a', createdAt: daysAgo(100) },
        { id: 'b', createdAt: daysAgo(1) },
        { id: 'c', createdAt: 'bad' },
      ],
      'createdAt'
    );
    expect(reports).toHaveLength(2);
    expect(reports[0]!.recordsProcessed).toBe(3);
    expect(reports[0]!.recordsAffected).toBe(1);
    expect(reports[1]!.recordsAffected).toBe(1);
  });

  it('execute collects per-record errors', () => {
    engine.addRule(
      rule({
        condition: () => {
          throw new Error('boom');
        },
      })
    );
    const reports = engine.execute(
      'gl_entries',
      [{ id: 'a', createdAt: daysAgo(100) }],
      'createdAt'
    );
    expect(reports[0]!.errors.length).toBe(1);
    expect(reports[0]!.errors[0]).toContain('boom');
  });

  it('archive/delete record views and restore', () => {
    engine.addRule(rule({ id: 'a1', action: 'archive', retentionDays: 1 }));
    engine.addRule(rule({ id: 'd1', action: 'delete', retentionDays: 1, dataSource: 'temp' }));
    engine.evaluate('gl_entries', [{ id: 'g1', createdAt: daysAgo(9) }], 'createdAt');
    engine.evaluate('temp', [{ id: 't1', createdAt: daysAgo(9) }], 'createdAt');

    expect(engine.getArchivedRecords('gl_entries')).toHaveLength(1);
    expect(engine.getArchivedRecords('temp')).toHaveLength(0);
    expect(engine.getDeletedRecords('temp')).toHaveLength(1);
    expect(engine.getDeletedRecords('gl_entries')).toHaveLength(0);

    const archived = engine.getArchivedRecords()[0]!;
    const restored = engine.restore(archived.id);
    expect(restored).not.toBeNull();
    expect(restored!.archivedAt).toBeUndefined();
    expect(engine.restore('nope')).toBeNull();
    // delete-actions are not restorable
    const deleted = engine.getDeletedRecords()[0]!;
    expect(engine.restore(deleted.id)).toBeNull();
  });

  it('reports are newest-first and getStats aggregates', () => {
    engine.addRule(rule({ id: 'r', retentionDays: 1 }));
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    engine.execute('gl_entries', [{ id: 'a', createdAt: daysAgo(5) }], 'createdAt');
    vi.setSystemTime(new Date('2026-02-01T00:00:00Z'));
    engine.execute('gl_entries', [{ id: 'b', createdAt: daysAgo(5) }], 'createdAt');

    const reports = engine.getReports();
    expect(reports).toHaveLength(2);
    expect(reports[0]!.executedAt).toBe('2026-02-01T00:00:00.000Z');
    expect(engine.getReports(1)).toHaveLength(1);

    const stats = engine.getStats('gl_entries');
    expect(stats.totalRules).toBe(1);
    expect(stats.activeRules).toBe(1);
    expect(stats.lastExecuted).toBe('2026-02-01T00:00:00.000Z');
    expect(engine.getStats('nope').totalRules).toBe(0);
  });

  it('updateRule re-sorts by priority and removeRule handles miss', () => {
    engine.addRule(rule({ id: 'low', priority: 1 }));
    engine.addRule(rule({ id: 'high', priority: 10 }));
    expect(engine.getRules().map((r) => r.id)).toEqual(['high', 'low']);
    expect(engine.updateRule('low', { priority: 99 })).toBe(true);
    expect(engine.getRules().map((r) => r.id)).toEqual(['low', 'high']);
    expect(engine.updateRule('missing', {})).toBe(false);
    expect(engine.removeRule('low')).toBe(true);
    expect(engine.removeRule('low')).toBe(false);
  });

  it('getRulesBySource filters', () => {
    engine.addRule(rule({ id: 'a', dataSource: 'gl' }));
    engine.addRule(rule({ id: 'b', dataSource: 'budgets' }));
    expect(engine.getRulesBySource('gl')).toHaveLength(1);
  });

  it('serialize drops condition functions and round-trips counts', () => {
    engine.addRule(rule({ action: 'archive', retentionDays: 1, condition: () => true }));
    engine.evaluate('gl_entries', [{ id: 'x', createdAt: daysAgo(9) }], 'createdAt');
    const json = engine.serialize();
    expect(json).toContain('"rules"');
    expect(json).not.toContain('condition');
    const parsed = JSON.parse(json);
    expect(parsed.rules[0].id).toBe('r1');
    expect(parsed.records).toHaveLength(1);
  });
});

describe('createFinancialDataRetention presets', () => {
  it('provides the SOX-prescribed schedule', () => {
    const rules = createFinancialDataRetention();
    expect(rules).toHaveLength(5);
    const gl = rules.find((r) => r.id === 'gl-7year')!;
    expect(gl.retentionDays).toBe(2555); // 7 years
    expect(gl.action).toBe('archive');
    expect(rules.find((r) => r.id === 'audit-10year')!.retentionDays).toBe(3650);
    expect(rules.find((r) => r.id === 'temp-data-30day')!.action).toBe('delete');
    expect(rules.every((r) => r.enabled)).toBe(true);
  });
});
