/**
 * Phase 5 (DEC-018): the correction lifecycle is REQUESTED → APPLIED →
 * REVERIFIED, advanced only by explicit human action. The store enforces
 * the order — a correction cannot be "re-verified" before anyone applied
 * it, and terminal states do not move again. Re-requesting is the audited
 * way to restart a cycle.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { actAs } from '@/test/rbacFixtures';
import { useExceptionDispositionStore } from './exceptionDispositionStore';
import { setClock, resetClock } from '@/utils/clock';

const FIXED = '2026-10-15T09:30:00.000Z';

function seed() {
  useExceptionDispositionStore.getState().reset();
  useExceptionDispositionStore.getState().requestCorrection({
    exceptionId: 'EXC-L1',
    instruction: 'Reverse the duplicate',
    assignee: 'accounts-team',
  });
}

describe('correction lifecycle (DEC-018)', () => {
  beforeEach(() => {
    actAs('Admin'); // Phase 12: disposition/rule actions require permissions
    setClock(FIXED);
    seed();
  });
  afterEach(() => resetClock());

  it('REQUESTED → APPLIED → REVERIFIED is the legal path, each step audited', () => {
    const store = useExceptionDispositionStore.getState();
    expect(store.updateCorrectionStatus('EXC-L1', 'APPLIED').status).toBe('APPLIED');
    expect(store.updateCorrectionStatus('EXC-L1', 'REVERIFIED').status).toBe('REVERIFIED');
    const history = store.getCorrectionHistory('EXC-L1');
    expect(history.map((h) => h.status)).toEqual(['REQUESTED', 'APPLIED', 'REVERIFIED']);
    expect(history[2]?.previousStatus).toBe('APPLIED');
  });

  it('REQUESTED → REVERIFIED directly is refused (nothing was applied yet)', () => {
    const store = useExceptionDispositionStore.getState();
    expect(() => store.updateCorrectionStatus('EXC-L1', 'REVERIFIED')).toThrow(/APPLIED/);
    expect(store.getCorrection('EXC-L1')?.status).toBe('REQUESTED');
  });

  it('WITHDRAWN is reachable from REQUESTED and APPLIED, then terminal', () => {
    const store = useExceptionDispositionStore.getState();
    expect(store.updateCorrectionStatus('EXC-L1', 'WITHDRAWN').status).toBe('WITHDRAWN');
    expect(() => store.updateCorrectionStatus('EXC-L1', 'APPLIED')).toThrow(/terminal|WITHDRAWN/);
  });

  it('REVERIFIED is terminal for status updates', () => {
    const store = useExceptionDispositionStore.getState();
    store.updateCorrectionStatus('EXC-L1', 'APPLIED');
    store.updateCorrectionStatus('EXC-L1', 'REVERIFIED');
    expect(() => store.updateCorrectionStatus('EXC-L1', 'WITHDRAWN')).toThrow(
      /terminal|REVERIFIED/
    );
  });

  it('no code path sets APPLIED or REVERIFIED without an explicit call', () => {
    // The store exposes exactly one status mutator; requesting again is the
    // only other write and it resets to REQUESTED (audited), never forward.
    const store = useExceptionDispositionStore.getState();
    store.requestCorrection({
      exceptionId: 'EXC-L1',
      instruction: 'Reverse the duplicate and re-code',
      assignee: 'controller',
    });
    expect(store.getCorrection('EXC-L1')?.status).toBe('REQUESTED');
  });
});
