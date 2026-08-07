/**
 * CellAuditTrailEngine.ext.test.ts — write/update/delete/bulk recording,
 * undo support, approval workflow, compliance reports, lineage, retention
 * (MISSION D wave 2, 2026-08-07).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CellAuditTrailEngine } from './CellAuditTrailEngine';

describe('CellAuditTrailEngine — recording', () => {
  let e: CellAuditTrailEngine;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-07T00:00:00Z'));
    e = new CellAuditTrailEngine();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('recordWrite captures full context', () => {
    const entry = e.recordWrite('B2', 42, 'u1', 'Alice', {
      oldValue: 41,
      reason: 'adjustment',
      dataType: 'forecast',
      source: 'driver-model',
      accountId: 'acct-1',
      accountName: 'Revenue',
      month: 3,
      metadata: { scenario: 'base' },
    });
    expect(entry.operation).toBe('write');
    expect(entry.cellId).toBe('B2');
    expect(entry.oldValue).toBe(41);
    expect(entry.newValue).toBe(42);
    expect(entry.source).toBe('driver-model');
    expect(entry.metadata).toEqual({ scenario: 'base' });
    expect(e.getEntryCount()).toBe(1);
    expect(e.getEntryById(entry.id)).toBe(entry);
  });

  it('recordUpdate and recordDelete', () => {
    e.recordUpdate('C3', 10, 20, 'u1', 'Alice', { reason: 'fix' });
    const del = e.recordDelete('C3', 20, 'u1', 'Alice');
    expect(del.operation).toBe('delete');
    expect(del.newValue).toBeNull();
    expect(e.getChangesByOperation('delete')).toHaveLength(1);
    expect(e.getChangesByOperation('update')).toHaveLength(1);
  });

  it('recordBulk shares a transaction id and timestamps', () => {
    const entries = e.recordBulk(
      [
        { cellId: 'A1', oldValue: 1, newValue: 2, source: 'import' },
        { cellId: 'A2', oldValue: 3, newValue: 4 },
      ],
      'u1',
      'Alice',
      'bulk import'
    );
    expect(entries).toHaveLength(2);
    expect(entries[0]!.transactionId).toBe(entries[1]!.transactionId);
    expect(entries[0]!.timestamp).toBe(entries[1]!.timestamp);
    expect(entries[0]!.operation).toBe('bulk');
    expect(e.getChangesByTransaction(entries[0]!.transactionId)).toHaveLength(2);
    expect(e.getUniqueTransactions()).toEqual([entries[0]!.transactionId]);
  });

  it('recordChange fills defaults and freezes entries', () => {
    const entry = e.recordChange({
      cellId: 'Z9',
      newValue: 7,
      userId: 'u',
      userName: 'U',
    } as never);
    expect(entry.operation).toBe('write');
    expect(entry.dataType).toBe('input');
    expect(Object.isFrozen(entry)).toBe(true);
  });

  it('getHistory sorts newest-first; latest/previous value accessors', () => {
    vi.setSystemTime(new Date('2026-08-07T00:00:01Z'));
    e.recordWrite('X1', 1, 'u1', 'A');
    vi.setSystemTime(new Date('2026-08-07T00:00:02Z'));
    e.recordWrite('X1', 2, 'u1', 'A');
    vi.setSystemTime(new Date('2026-08-07T00:00:03Z'));
    e.recordWrite('X1', 3, 'u1', 'A');
    expect(e.getHistory('X1').map((h) => h.newValue)).toEqual([3, 2, 1]);
    expect(e.getLatestValue('X1')).toBe(3);
    expect(e.getPreviousValue('X1')).toBe(2);
    expect(e.getPreviousValue('nope')).toBeNull();
    expect(e.getLatestValue('nope')).toBeNull();
    expect(e.getValueAtTime('X1', '2026-08-07T00:00:02Z')).toBe(2);
    expect(e.getValueAtTime('X1', '2020-01-01T00:00:00Z')).toBeNull();
  });

  it('revertToState records a system revert', () => {
    vi.setSystemTime(new Date('2026-08-07T00:00:01Z'));
    e.recordWrite('X1', 100, 'u1', 'A');
    vi.setSystemTime(new Date('2026-08-07T00:00:02Z'));
    e.recordWrite('X1', 200, 'u1', 'A');
    vi.setSystemTime(new Date('2026-08-07T00:00:03Z'));
    const revert = e.revertToState('X1', '2026-08-07T00:00:01Z');
    expect(revert).not.toBeNull();
    expect(revert!.newValue).toBe(100);
    expect(revert!.source).toBe('audit-revert');
    expect(revert!.userId).toBe('system');
    expect(e.getLatestValue('X1')).toBe(100);
    expect(e.revertToState('nope', '2026-01-01')).toBeNull();
  });
});

describe('CellAuditTrailEngine — queries, approvals, compliance', () => {
  let e: CellAuditTrailEngine;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-07T00:00:00Z'));
    e = new CellAuditTrailEngine();
    e.recordWrite('A1', 1, 'u1', 'Alice', { reason: 'manual_edit', dataType: 'input' });
    e.recordUpdate('A1', 1, 2, 'u2', 'Bob', { reason: 'manual_edit', dataType: 'input' });
    e.recordWrite('B1', 9, 'u1', 'Alice', {
      reason: 'import',
      dataType: 'forecast',
      source: 'api',
    });
  });
  afterEach(() => vi.useRealTimers());

  it('filter accessors', () => {
    expect(e.getChangesByUser('u1')).toHaveLength(2);
    expect(e.getChangesByDataType('forecast')).toHaveLength(1);
    expect(e.getChangesByReason('import')).toHaveLength(1);
    expect(e.getChangesByDateRange('2026-08-07T00:00:00Z', '2026-08-07T00:00:01Z')).toHaveLength(3);
    expect(e.getChangesByDateRange('2026-01-01T00:00:00Z', '2026-02-01T00:00:00Z')).toHaveLength(0);
    expect(e.getChangesByApprovalStatus('approved')).toHaveLength(0);
  });

  it('query composes filters', () => {
    const results = e.query({ userId: 'u1', dataType: 'input' });
    expect(results).toHaveLength(1);
    expect(e.query({ operation: 'update', reason: 'manual_edit' })).toHaveLength(1);
    expect(e.query({ startDate: '2026-08-07T00:00:00Z' })).toHaveLength(3);
    expect(e.query({ endDate: '2026-08-06T00:00:00Z' })).toHaveLength(0);
  });

  it('approval workflow transitions', () => {
    const first = e.getEntryById('audit-1')!;
    const pending = e.submitForApproval(first.id);
    expect(pending!.approvalStatus).toBe('pending');
    // already pending → stays pending
    expect(e.submitForApproval(first.id)!.approvalStatus).toBe('pending');
    const approved = e.approveEntry(first.id, 'manager');
    expect(approved!.approvalStatus).toBe('approved');
    expect(approved!.approvedBy).toBe('manager');
    expect(e.submitForApproval(first.id)!.approvalStatus).toBe('approved'); // approved is terminal
    const rejected = e.rejectEntry('audit-2', 'compliance');
    expect(rejected!.approvalStatus).toBe('rejected');
    expect(e.submitForApproval('nope')).toBeNull();
    expect(e.approveEntry('nope', 'x')).toBeNull();
    expect(e.rejectEntry('nope', 'x')).toBeNull();
    expect(e.getChangesByApprovalStatus('approved')).toHaveLength(1);
  });

  it('getAuditReport aggregates', () => {
    const report = e.getAuditReport();
    expect(report.totalChanges).toBe(3);
    expect(report.uniqueUsers).toEqual(['u1', 'u2']);
    expect(report.uniqueCells).toEqual(['A1', 'B1']);
    expect(report.changesByOperation).toEqual({ write: 2, update: 1, delete: 0, bulk: 0 });
    expect(report.changesByUser).toEqual({ u1: 2, u2: 1 });
    expect(report.dateRange.earliest).toBeTruthy();
  });

  it('generateComplianceReport filters by window and lineage', () => {
    const report = e.generateComplianceReport('2026-08-07T00:00:00Z', '2026-08-07T00:00:01Z');
    expect(report.totalChanges).toBe(3);
    expect(report.changesByUser).toHaveLength(2);
    expect(report.changesByCell).toHaveLength(2);
    expect(report.dataLineage).toHaveLength(1); // only the api-sourced entry
    expect(report.dataLineage[0]!.source).toBe('api');
    expect(e.generateComplianceReport('2020-01-01', '2020-02-01').totalChanges).toBe(0);
  });

  it('getDataLineage / getFullLineage with manual default', () => {
    const lineage = e.getDataLineage('A1');
    expect(lineage).toHaveLength(2);
    expect(lineage[0]!.source).toBe('manual');
    expect(e.getFullLineage('B1')[0]!.source).toBe('api');
  });
});

describe('CellAuditTrailEngine — export & retention', () => {
  let e: CellAuditTrailEngine;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-07T00:00:00Z'));
    e = new CellAuditTrailEngine();
  });
  afterEach(() => vi.useRealTimers());

  it('exportJSON / exportCSV', () => {
    e.recordWrite('A1', 5, 'u1', 'Alice', { reason: 'manual, with comma' });
    const json = e.exportJSON();
    expect(json).toContain('"cellId": "A1"');
    const csv = e.exportCSV();
    expect(csv).toContain('id,cellId,operation');
    expect(csv).toContain('"manual, with comma"');
    const empty = new CellAuditTrailEngine();
    expect(empty.exportCSV()).toBe('');
  });

  it('enforceRetention prunes by age and maxEntries', () => {
    vi.setSystemTime(new Date('2020-01-01T00:00:00Z'));
    e.recordWrite('A1', 1, 'u1', 'A');
    vi.setSystemTime(new Date('2026-08-07T00:00:00Z'));
    e.recordWrite('A1', 2, 'u1', 'A');
    // old entry is within default 2555 days? 2020-01-01 is ~2411 days back → kept
    expect(e.getEntryCount()).toBe(2);
    e.setRetentionConfig({ retentionDays: 100 });
    // recordWrite triggers enforceRetention → old entry pruned
    e.recordWrite('A1', 3, 'u1', 'A');
    expect(e.getEntryCount()).toBe(2);
    e.setRetentionConfig({ retentionDays: 2555, maxEntries: 2 });
    e.recordWrite('A1', 4, 'u1', 'A');
    expect(e.getEntryCount()).toBe(2);
    expect(e.getRetentionStatus().maxEntries).toBe(2);
    expect(e.getRetentionConfig()).toEqual({ retentionDays: 2555, maxEntries: 2 });
  });

  it('isImmutable + clear', () => {
    e.recordWrite('A1', 1, 'u1', 'A');
    expect(e.isImmutable()).toBe(true);
    e.clear();
    expect(e.getEntryCount()).toBe(0);
    expect(e.getUniqueTransactions()).toEqual([]);
  });
});
