import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuditTrailStore, AUDIT_CHAIN_GENESIS_HASH } from './auditTrailStore';
import { useAuthStore } from './authStore';
import { actAs, actAsRoleWithout, expectPermissionDenied, signOut } from '@/test/rbacFixtures';
import { resetClock, setClock } from '@/utils/clock';

vi.mock('@/utils/masterStorage', () => ({
  masterStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  },
}));

let originalId: string;
beforeEach(() => {
  signOut();
  setClock('2026-10-01T09:00:00.000Z');
  useAuditTrailStore.setState({ entries: [], chainHead: AUDIT_CHAIN_GENESIS_HASH });
  originalId = useAuditTrailStore.getState().recordUpdate({
    cellId: {
      sectorId: 'generic',
      scenarioId: 'Actual',
      periodId: '2026-10',
      lineItemId: 'revenue',
    },
    userId: 'original-author',
    operation: 'update',
    dataType: 'number',
    previousValue: 100,
    newValue: 200,
  });
});
afterEach(() => {
  signOut();
  resetClock();
});

describe('N2/N3 audit reversion attribution', () => {
  it('attributes a new reversion record to the authenticated actor, not the historical author', () => {
    const original = useAuditTrailStore.getState().entries[0];
    const actor = actAs('Admin', { id: 'reviewer-performing-reversion' });
    setClock('2026-10-20T10:00:00.000Z');

    useAuditTrailStore.getState().revertToState(originalId);

    const state = useAuditTrailStore.getState();
    expect(state.entries).toHaveLength(2);
    expect(state.entries[0]).toMatchObject({
      userId: actor.id,
      timestamp: Date.parse('2026-10-20T10:00:00.000Z'),
      operation: 'update',
      previousValue: 200,
      newValue: 100,
      metadata: { revertedFrom: originalId, reason: 'Audit-trail revert-to-state' },
      prevHash: original?.hash,
    });
    expect(state.entries[1]).toEqual(original);
    expect(state.entries[1]?.userId).toBe('original-author');
    expect(state.chainHead).toBe(state.entries[0]?.hash);
    expect(state.verifyIntegrity().valid).toBe(true);
  });

  it('reads the current actor for each call instead of caching the first reviewer', () => {
    actAs('Admin', { id: 'first-reviewer' });
    useAuditTrailStore.getState().revertToState(originalId);
    actAs('Admin', { id: 'second-reviewer' });
    useAuditTrailStore.getState().revertToState(originalId);

    const state = useAuditTrailStore.getState();
    expect(state.entries.map((entry) => entry.userId)).toEqual([
      'second-reviewer',
      'first-reviewer',
      'original-author',
    ]);
    expect(state.verifyIntegrity().valid).toBe(true);
  });

  it.each(['signed-out', 'Viewer', 'missing-permission', 'stale-session'] as const)(
    'denies %s before changing either the trail or its pinned head',
    (session) => {
      if (session === 'Viewer') actAs('Viewer');
      if (session === 'missing-permission') actAsRoleWithout('Admin', 'audit:delete');
      if (session === 'stale-session') {
        actAs('Admin');
        useAuthStore.setState({ isAuthenticated: false });
      }
      const before = useAuditTrailStore.getState();
      const error = expectPermissionDenied(() => before.revertToState(originalId));
      expect(error.message).toContain('audit:delete');
      expect(useAuditTrailStore.getState().entries).toBe(before.entries);
      expect(useAuditTrailStore.getState().chainHead).toBe(before.chainHead);
    }
  );
});
