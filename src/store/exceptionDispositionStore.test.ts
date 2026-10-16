import { describe, it, expect, beforeEach } from 'vitest';
import { useExceptionDispositionStore } from './exceptionDispositionStore';
import { setClock, resetClock } from '@/utils/clock';
import type { DispositionStatus } from '@/types/exceptions';

describe('useExceptionDispositionStore', () => {
  beforeEach(() => {
    resetClock();
    useExceptionDispositionStore.getState().reset();
  });

  it('initializes with empty dispositions and audit trail', () => {
    const state = useExceptionDispositionStore.getState();
    expect(state.dispositions).toEqual([]);
    expect(state.getAuditTrail()).toEqual([]);
  });

  it('records a new disposition with deterministic clock timestamp', () => {
    const fixedIso = '2026-10-16T12:00:00.000Z';
    setClock(new Date(fixedIso).getTime());

    const store = useExceptionDispositionStore.getState();
    store.setDisposition({
      exceptionId: 'EXC-001',
      ruleId: 'RULE-DUP',
      disposition: 'ACCEPT',
      rationale: 'Verified legitimate recurring subscription',
      recordedBy: 'auditor-1',
    });

    const disposition = useExceptionDispositionStore.getState().getDisposition('EXC-001');
    expect(disposition).toBeDefined();
    expect(disposition).toEqual({
      exceptionId: 'EXC-001',
      ruleId: 'RULE-DUP',
      disposition: 'ACCEPT',
      rationale: 'Verified legitimate recurring subscription',
      recordedAt: fixedIso,
      recordedBy: 'auditor-1',
    });
  });

  it('defaults recordedBy to user and uses nowISO() when omitted', () => {
    const fixedIso = '2026-10-16T14:30:00.000Z';
    setClock(new Date(fixedIso).getTime());

    useExceptionDispositionStore.getState().setDisposition({
      exceptionId: 'EXC-002',
      disposition: 'REVIEW',
      rationale: 'Pending manager clarification',
    });

    const disposition = useExceptionDispositionStore.getState().getDisposition('EXC-002');
    expect(disposition?.recordedBy).toBe('user');
    expect(disposition?.recordedAt).toBe(fixedIso);
  });

  it('respects explicitly provided recordedAt timestamp', () => {
    const customTime = '2026-10-15T08:00:00.000Z';
    useExceptionDispositionStore.getState().setDisposition({
      exceptionId: 'EXC-003',
      disposition: 'ACCEPT',
      rationale: 'Historical disposition backfill',
      recordedAt: customTime,
      recordedBy: 'migration-script',
    });

    const disposition = useExceptionDispositionStore.getState().getDisposition('EXC-003');
    expect(disposition?.recordedAt).toBe(customTime);
    expect(disposition?.recordedBy).toBe('migration-script');
  });

  it('maintains append-only audit trail when disposition is updated', () => {
    const t1 = '2026-10-16T10:00:00.000Z';
    const t2 = '2026-10-16T11:00:00.000Z';
    const t3 = '2026-10-16T12:00:00.000Z';

    setClock(new Date(t1).getTime());
    useExceptionDispositionStore.getState().setDisposition({
      exceptionId: 'EXC-100',
      ruleId: 'RULE-OUTLIER',
      disposition: 'REVIEW',
      rationale: 'Needs investigation',
      recordedBy: 'analyst-1',
    });

    setClock(new Date(t2).getTime());
    useExceptionDispositionStore.getState().setDisposition({
      exceptionId: 'EXC-100',
      disposition: 'ESCALATE',
      rationale: 'Amount exceeds $50k threshold',
      recordedBy: 'manager-1',
    });

    setClock(new Date(t3).getTime());
    useExceptionDispositionStore.getState().setDisposition({
      exceptionId: 'EXC-100',
      disposition: 'REJECT',
      rationale: 'Duplicate invoice confirmed by vendor',
      recordedBy: 'controller-1',
    });

    const state = useExceptionDispositionStore.getState();

    // Latest active disposition should be REJECT
    const latest = state.getDisposition('EXC-100');
    expect(latest?.disposition).toBe('REJECT');
    expect(latest?.rationale).toBe('Duplicate invoice confirmed by vendor');
    expect(latest?.recordedAt).toBe(t3);

    // Active dispositions array contains only one entry per exceptionId
    const active = state.dispositions.filter((d) => d.exceptionId === 'EXC-100');
    expect(active).toHaveLength(1);

    // History contains full audit trail of 3 events in sequence
    const history = state.getHistory('EXC-100');
    expect(history).toHaveLength(3);
    expect(history[0]).toMatchObject({
      sequenceNumber: 1,
      disposition: 'REVIEW',
      previousDisposition: undefined,
      recordedAt: t1,
    });
    expect(history[1]).toMatchObject({
      sequenceNumber: 2,
      disposition: 'ESCALATE',
      previousDisposition: 'REVIEW',
      recordedAt: t2,
    });
    expect(history[2]).toMatchObject({
      sequenceNumber: 3,
      disposition: 'REJECT',
      previousDisposition: 'ESCALATE',
      recordedAt: t3,
    });
  });

  it('supports recordDisposition and updateDisposition convenience methods', () => {
    const fixedIso = '2026-10-16T15:00:00.000Z';
    setClock(new Date(fixedIso).getTime());

    const store = useExceptionDispositionStore.getState();

    store.recordDisposition('EXC-301', 'ACCEPT', 'Within operational variance', {
      ruleId: 'RULE-VAR',
      recordedBy: 'lead-analyst',
      action: 'NO_ACTION',
    });

    const record = store.getDisposition('EXC-301');
    expect(record?.disposition).toBe('ACCEPT');
    expect(record?.ruleId).toBe('RULE-VAR');
    expect(record?.action).toBe('NO_ACTION');
    expect(record?.recordedBy).toBe('lead-analyst');

    store.updateDisposition('EXC-301', 'REVIEW', 'Variance widened', 'RECHECK', 'lead-analyst');

    const updated = store.getDisposition('EXC-301');
    expect(updated?.disposition).toBe('REVIEW');
    expect(updated?.rationale).toBe('Variance widened');
    expect(updated?.action).toBe('RECHECK');

    const history = store.getHistory('EXC-301');
    expect(history).toHaveLength(2);
  });

  it('filters audit trail across multiple exceptions correctly', () => {
    const statuses: DispositionStatus[] = ['ACCEPT', 'REJECT', 'ESCALATE'];

    useExceptionDispositionStore.getState().recordDisposition('E-1', statuses[0], 'Note 1');
    useExceptionDispositionStore.getState().recordDisposition('E-2', statuses[1], 'Note 2');
    useExceptionDispositionStore.getState().recordDisposition('E-1', statuses[2], 'Note 1 revised');

    const state = useExceptionDispositionStore.getState();
    expect(state.dispositions).toHaveLength(2);
    expect(state.getAuditTrail()).toHaveLength(3);
    expect(state.getAuditTrail('E-1')).toHaveLength(2);
    expect(state.getAuditTrail('E-2')).toHaveLength(1);
    expect(state.getAuditTrail('E-NONEXISTENT')).toHaveLength(0);
  });

  it('clears state on reset and clearDispositions', () => {
    useExceptionDispositionStore.getState().recordDisposition('E-999', 'ACCEPT', 'All good');
    expect(useExceptionDispositionStore.getState().dispositions).toHaveLength(1);

    useExceptionDispositionStore.getState().clearDispositions();
    expect(useExceptionDispositionStore.getState().dispositions).toHaveLength(0);
    expect(useExceptionDispositionStore.getState().getAuditTrail()).toHaveLength(0);

    useExceptionDispositionStore.getState().recordDisposition('E-1000', 'REJECT', 'Blocked');
    expect(useExceptionDispositionStore.getState().dispositions).toHaveLength(1);

    useExceptionDispositionStore.getState().reset();
    expect(useExceptionDispositionStore.getState().dispositions).toHaveLength(0);
    expect(useExceptionDispositionStore.getState().getAuditTrail()).toHaveLength(0);
  });
});
