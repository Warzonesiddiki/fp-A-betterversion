import { describe, it, expect, beforeEach } from 'vitest';
import { actAs } from '@/test/rbacFixtures';
import { useExceptionDispositionStore } from './exceptionDispositionStore';
import { setClock, resetClock } from '@/utils/clock';
import type { DispositionStatus } from '@/types/exceptions';

describe('useExceptionDispositionStore', () => {
  beforeEach(() => {
    actAs('Admin'); // Phase 12: disposition/rule actions require permissions
    resetClock();
    useExceptionDispositionStore.getState().reset();
  });

  it('initializes with empty dispositions and audit trail', () => {
    const state = useExceptionDispositionStore.getState();
    expect(state.dispositions).toEqual([]);
    expect(state.getAuditTrail()).toEqual([]);
    expect(state.corrections).toEqual([]);
    expect(state.correctionAuditTrail).toEqual([]);
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

  describe('correction requests (FR-010)', () => {
    const DISPOSITIONED = {
      exceptionId: 'EXC-500',
      disposition: 'REVIEW' as DispositionStatus,
      rationale: 'Posting looks duplicated',
      recordedBy: 'analyst-1',
    };

    it('records what has to change, who fixes it and by when, pinned to the clock', () => {
      const fixedIso = '2026-10-18T09:15:00.000Z';
      setClock(new Date(fixedIso).getTime());

      const store = useExceptionDispositionStore.getState();
      const request = store.requestCorrection({
        exceptionId: 'EXC-500',
        ruleId: 'RULE-DUP',
        instruction: 'Reverse the duplicate invoice posting and re-bill under PO-4471',
        assignee: 'accounts-team',
        dueDate: '2026-10-25',
        source: 'batch-7 · row 214',
      });

      expect(request).toEqual({
        exceptionId: 'EXC-500',
        ruleId: 'RULE-DUP',
        instruction: 'Reverse the duplicate invoice posting and re-bill under PO-4471',
        assignee: 'accounts-team',
        dueDate: '2026-10-25',
        source: 'batch-7 · row 214',
        status: 'REQUESTED',
        requestedAt: fixedIso,
        requestedBy: 'user',
      });
      expect(useExceptionDispositionStore.getState().getCorrection('EXC-500')).toEqual(request);
      // A request is not a fix: nothing marks it applied on its own.
      expect(useExceptionDispositionStore.getState().getCorrection('EXC-500')?.status).toBe(
        'REQUESTED'
      );
    });

    it('keeps an unagreed due date as null, and never substitutes today', () => {
      setClock(new Date('2026-10-18T09:15:00.000Z').getTime());

      const request = useExceptionDispositionStore.getState().requestCorrection({
        exceptionId: 'EXC-501',
        instruction: 'Reclassify to the correct cost centre',
        assignee: 'accounts-team',
      });

      expect(request.dueDate).toBeNull();
      expect(request.source).toBeNull();
      expect(useExceptionDispositionStore.getState().getCorrection('EXC-501')?.dueDate).toBeNull();
    });

    it('canonicalises a supplied due date and refuses one that is not a real date', () => {
      const store = useExceptionDispositionStore.getState();

      const request = store.requestCorrection({
        exceptionId: 'EXC-502',
        instruction: 'Post the missing accrual',
        assignee: 'accounts-team',
        dueDate: '10/25/2026',
      });
      expect(request.dueDate).toBe('2026-10-25');

      expect(() =>
        store.requestCorrection({
          exceptionId: 'EXC-503',
          instruction: 'Post the missing accrual',
          assignee: 'accounts-team',
          dueDate: '2026-02-30',
        })
      ).toThrow(/not a valid calendar date/);
      expect(store.getCorrection('EXC-503')).toBeUndefined();
      expect(store.getCorrectionHistory('EXC-503')).toEqual([]);
    });

    it('refuses an instruction-less or unassigned request and writes nothing', () => {
      const store = useExceptionDispositionStore.getState();

      expect(() =>
        store.requestCorrection({ exceptionId: 'EXC-504', instruction: '   ', assignee: 'team' })
      ).toThrow(/instruction is required/);
      expect(() =>
        store.requestCorrection({ exceptionId: 'EXC-504', instruction: 'Fix it', assignee: '' })
      ).toThrow(/assignee is required/);
      expect(() =>
        store.requestCorrection({
          exceptionId: '   ',
          instruction: 'Fix it',
          assignee: 'team',
        })
      ).toThrow(/exceptionId is required/);

      const state = useExceptionDispositionStore.getState();
      expect(state.getCorrections()).toEqual([]);
      expect(state.correctionAuditTrail).toEqual([]);
    });

    it('keeps one active request per entry and an append-only trail', () => {
      const t1 = '2026-10-18T09:00:00.000Z';
      const t2 = '2026-10-18T10:00:00.000Z';
      const store = useExceptionDispositionStore.getState();

      setClock(new Date(t1).getTime());
      store.requestCorrection({
        exceptionId: 'EXC-600',
        instruction: 'Reverse the double posting',
        assignee: 'accounts-team',
      });

      setClock(new Date(t2).getTime());
      store.requestCorrection({
        exceptionId: 'EXC-600',
        instruction: 'Reverse the double posting and re-code to 6150',
        assignee: 'controller',
        dueDate: '2026-10-31',
      });

      const state = useExceptionDispositionStore.getState();
      const active = state.getCorrections().filter((c) => c.exceptionId === 'EXC-600');
      expect(active).toHaveLength(1);
      expect(active[0]?.assignee).toBe('controller');
      expect(active[0]?.status).toBe('REQUESTED');

      const history = state.getCorrectionHistory('EXC-600');
      expect(history).toHaveLength(2);
      expect(history[0]).toMatchObject({
        sequenceNumber: 1,
        instruction: 'Reverse the double posting',
        status: 'REQUESTED',
        previousStatus: undefined,
        requestedAt: t1,
      });
      expect(history[1]).toMatchObject({
        sequenceNumber: 2,
        assignee: 'controller',
        previousStatus: 'REQUESTED',
        requestedAt: t2,
      });
    });

    it('moves a request to APPLIED only on an explicit human action, audited', () => {
      const store = useExceptionDispositionStore.getState();
      store.requestCorrection({
        exceptionId: 'EXC-700',
        instruction: 'Reverse the duplicate',
        assignee: 'accounts-team',
        requestedBy: 'controller-1',
      });

      const applied = store.updateCorrectionStatus('EXC-700', 'APPLIED', { by: 'accounts-lead' });
      expect(applied.status).toBe('APPLIED');

      const history = useExceptionDispositionStore.getState().getCorrectionHistory('EXC-700');
      expect(history).toHaveLength(2);
      expect(history[1]).toMatchObject({
        sequenceNumber: 2,
        status: 'APPLIED',
        previousStatus: 'REQUESTED',
        requestedBy: 'accounts-lead',
        instruction: 'Reverse the duplicate',
      });

      expect(() => store.updateCorrectionStatus('EXC-NONE', 'APPLIED')).toThrow(
        /no correction request on file/
      );
    });

    it('filters the correction trail per entry', () => {
      const store = useExceptionDispositionStore.getState();
      store.requestCorrection({ exceptionId: 'C-1', instruction: 'Fix one', assignee: 'team' });
      store.requestCorrection({ exceptionId: 'C-2', instruction: 'Fix two', assignee: 'team' });
      store.updateCorrectionStatus('C-1', 'WITHDRAWN');

      const state = useExceptionDispositionStore.getState();
      expect(state.getCorrections()).toHaveLength(2);
      expect(state.getCorrectionHistory('C-1')).toHaveLength(2);
      expect(state.getCorrectionHistory('C-2')).toHaveLength(1);
      expect(state.getCorrectionHistory('C-MISSING')).toEqual([]);
      expect(state.getCorrection('C-1')?.status).toBe('WITHDRAWN');
    });

    it('clearCorrections clears only the hand-off work, reset clears both', () => {
      const store = useExceptionDispositionStore.getState();
      store.setDisposition(DISPOSITIONED);
      store.requestCorrection({
        exceptionId: 'EXC-500',
        instruction: 'Reverse the duplicate',
        assignee: 'accounts-team',
      });

      store.clearCorrections();
      expect(store.getCorrections()).toEqual([]);
      expect(store.getCorrectionHistory('EXC-500')).toEqual([]);
      expect(useExceptionDispositionStore.getState().getDisposition('EXC-500')).toBeDefined();

      store.requestCorrection({
        exceptionId: 'EXC-500',
        instruction: 'Reverse the duplicate',
        assignee: 'accounts-team',
      });
      store.reset();
      const cleared = useExceptionDispositionStore.getState();
      expect(cleared.getCorrections()).toEqual([]);
      expect(cleared.dispositions).toEqual([]);
    });
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

  it('persist contract: a v1 blob gains empty corrections and keeps its dispositions', () => {
    const options = useExceptionDispositionStore.persist.getOptions();
    expect(options.version).toBe(2);

    const migrated = options.migrate?.(
      {
        dispositions: [{ exceptionId: 'E-1', disposition: 'ACCEPT', rationale: 'ok' }],
        auditTrail: [{ exceptionId: 'E-1', sequenceNumber: 1 }],
      },
      1
    ) as Record<string, unknown>;

    expect(migrated.dispositions).toHaveLength(1);
    expect(migrated.auditTrail).toHaveLength(1);
    // A blob that never carried a correction does not acquire one on upgrade.
    expect(migrated.corrections).toEqual([]);
    expect(migrated.correctionAuditTrail).toEqual([]);

    const persisted = options.partialize?.(useExceptionDispositionStore.getState()) as Record<
      string,
      unknown
    >;
    expect(Object.keys(persisted).sort()).toEqual([
      'auditTrail',
      'correctionAuditTrail',
      'corrections',
      'dispositions',
    ]);
  });
});

describe('authorization (Phase 12)', () => {
  it('refuses dispositions while signed out and leaves state untouched', async () => {
    const { signOut, expectPermissionDenied } = await import('@/test/rbacFixtures');
    signOut();
    expectPermissionDenied(() =>
      useExceptionDispositionStore.getState().setDisposition({
        exceptionId: 'exc-1',
        disposition: 'confirmed-error',
        rationale: 'checked',
      })
    );
    expect(useExceptionDispositionStore.getState().dispositions).toEqual([]);
  });

  it('an Analyst (dispose, no configure) cannot wipe the audit trail', async () => {
    const { actAs, expectPermissionDenied } = await import('@/test/rbacFixtures');
    actAs('Analyst');
    useExceptionDispositionStore.getState().setDisposition({
      exceptionId: 'exc-1',
      disposition: 'confirmed-error',
      rationale: 'checked',
    });
    expectPermissionDenied(() => useExceptionDispositionStore.getState().reset());
    expect(useExceptionDispositionStore.getState().auditTrail.length).toBeGreaterThan(0);
  });
});
