import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCellLineageStore, cellLineageSelectors } from './cellLineageStore';
import { useAuthStore } from './authStore';
import { PermissionError } from '@/utils/rbacEnforcer';
import { actAs, actAsRoleWithout, expectPermissionDenied } from '@/test/rbacFixtures';

vi.mock('@/utils/cryptoId', () => ({
  randomId: (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`,
}));
vi.mock('@/utils/masterStorage', () => ({
  masterStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  },
}));

// W6-P0-14: recordChange appends to the immutable provenance chain — requires
// audit:create. Reads (getChain/rewindTo/verifyIntegrity) stay open.
function authenticateLineageUser() {
  useAuthStore.setState({
    user: {
      id: 'lineage-test-user',
      email: 'lineage-test@finplan.local',
      firstName: 'Lineage',
      lastName: 'Tester',
      avatarUrl: null,
      role: 'Admin',
      departmentId: 'finance',
      departmentName: 'Finance',
      entityId: 'entity-001',
      status: 'Active',
      lastLoginAt: new Date().toISOString(),
      mfaEnabled: false,
      permissions: ['audit:create', 'audit:read'],
    },
    isAuthenticated: true,
  });
}

describe('cellLineageStore', () => {
  beforeEach(() => {
    authenticateLineageUser();
    useCellLineageStore.setState({
      chains: new Map(),
      pendingEntries: [],
      integrityVerified: false,
      lastIntegrityCheck: null,
    });
  });

  const snapshot = (v: unknown) => ({
    value: v,
    dataType: 'number' as const,
    preciseValue: null,
    formula: null,
    dependencies: null,
  });
  const actor = {
    userId: 'u1',
    userName: 'Test',
    engineId: null,
    engineVersion: null,
    actorType: 'user' as const,
  };
  const reason = {
    category: 'manual-edit' as const,
    description: 'test edit',
    referenceId: null,
    referenceType: null,
  };
  const origin = 'manual-override' as const;

  it('records a change and creates a chain', async () => {
    const id = await useCellLineageStore
      .getState()
      .recordChange('c1', snapshot(null), snapshot(1), actor, reason, origin);
    expect(id).toMatch(/^lin-/);
    const chain = useCellLineageStore.getState().getChain('c1');
    expect(chain).not.toBeNull();
    expect(chain!.entries).toHaveLength(1);
    expect(chain!.changeCount).toBe(1);
    expect(useCellLineageStore.getState().getCurrentValue('c1')).toEqual(snapshot(1));
  });

  it('appends entries for subsequent changes to same cell', async () => {
    const s = useCellLineageStore.getState();
    await s.recordChange('c1', snapshot(null), snapshot(1), actor, reason, origin);
    await s.recordChange('c1', snapshot(1), snapshot(2), actor, reason, origin);
    const chain = s.getChain('c1');
    expect(chain!.entries).toHaveLength(2);
    expect(s.getCurrentValue('c1')).toEqual(snapshot(2));
  });

  it('returns null for missing cell queries', () => {
    const s = useCellLineageStore.getState();
    expect(s.getChain('missing')).toBeNull();
    expect(s.getCurrentValue('missing')).toBeNull();
    expect(s.getValueAtTime('missing', new Date().toISOString())).toBeNull();
    expect(s.rewindTo('missing', 'x')).toBeNull();
  });

  it('rewindTo returns the entry value for known entries', async () => {
    const s = useCellLineageStore.getState();
    await s.recordChange('c1', snapshot(null), snapshot(1), actor, reason, origin);
    const chain = s.getChain('c1')!;
    const entryId = chain.entries[0]!.id;
    await s.recordChange('c1', snapshot(1), snapshot(2), actor, reason, origin);
    const rv = s.rewindTo('c1', entryId);
    expect(rv).toEqual(snapshot(1));
    expect(s.rewindTo('c1', 'bogus')).toBeNull();
  });

  it('getValueAtTime returns latest prior value', async () => {
    const s = useCellLineageStore.getState();
    await s.recordChange('c1', snapshot(null), snapshot(1), actor, reason, origin);
    const afterFirst = new Date().toISOString();
    await new Promise((r) => setTimeout(r, 10));
    await s.recordChange('c1', snapshot(1), snapshot(2), actor, reason, origin);
    const v = s.getValueAtTime('c1', afterFirst);
    expect(v).toEqual(snapshot(1));
  });

  it('verifyIntegrity verifies an intact chain and records the result', async () => {
    await useCellLineageStore
      .getState()
      .recordChange('c1', snapshot(null), snapshot(1), actor, reason, origin);

    const ok = await useCellLineageStore.getState().verifyIntegrity();
    expect(ok).toBe(true);
    const after = useCellLineageStore.getState();
    expect(after.lastIntegrityCheck).toBeTruthy();
    expect(after.integrityVerified).toBe(true);
    expect(after.chains.get('c1')?.integrityValid).toBe(true);
  });

  it('verifyIntegrity rejects a payload whose stored entry hash no longer matches', async () => {
    await useCellLineageStore
      .getState()
      .recordChange('c1', snapshot(null), snapshot(1), actor, reason, origin);
    const state = useCellLineageStore.getState();
    const original = state.chains.get('c1')!;
    const forged = { ...original.entries[0]!, newValue: snapshot(999) };
    const chains = new Map(state.chains);
    chains.set('c1', { ...original, entries: [forged], currentValue: forged.newValue });
    useCellLineageStore.setState({ chains });

    expect(await useCellLineageStore.getState().verifyIntegrity()).toBe(false);
    expect(useCellLineageStore.getState().chains.get('c1')?.integrityValid).toBe(false);
  });

  it.each([
    ['currentValue', { currentValue: snapshot(999) }],
    ['createdAt', { createdAt: '2026-10-01T00:00:00.000Z' }],
    ['changeCount', { changeCount: 2 }],
    ['uniqueActors', { uniqueActors: 2 }],
  ] as const)(
    'verifyIntegrity rejects inconsistent derived chain field %s',
    async (_field, patch) => {
      await useCellLineageStore
        .getState()
        .recordChange('c1', snapshot(null), snapshot(1), actor, reason, origin);
      const state = useCellLineageStore.getState();
      const original = state.chains.get('c1')!;
      const chains = new Map(state.chains);
      chains.set('c1', { ...original, ...patch });
      useCellLineageStore.setState({ chains });

      expect(await useCellLineageStore.getState().verifyIntegrity()).toBe(false);
      expect(useCellLineageStore.getState().chains.get('c1')?.integrityValid).toBe(false);
      expect(useCellLineageStore.getState().getCurrentValue('c1')).toEqual(snapshot(1));
    }
  );

  it('verifyIntegrity rejects a pending-entry mirror that omits a chained entry', async () => {
    await useCellLineageStore
      .getState()
      .recordChange('c1', snapshot(null), snapshot(1), actor, reason, origin);
    useCellLineageStore.setState({ pendingEntries: [] });

    expect(await useCellLineageStore.getState().verifyIntegrity()).toBe(false);
    expect(useCellLineageStore.getState().integrityVerified).toBe(false);
    expect(useCellLineageStore.getState().chains.get('c1')?.integrityValid).toBe(false);
  });

  it('verifyIntegrity rejects pending-entry data that disagrees with its hashed chain entry', async () => {
    await useCellLineageStore
      .getState()
      .recordChange('c1', snapshot(null), snapshot(1), actor, reason, origin);
    const entry = useCellLineageStore.getState().chains.get('c1')!.entries[0]!;
    useCellLineageStore.setState({ pendingEntries: [{ ...entry, newValue: snapshot(999) }] });

    expect(await useCellLineageStore.getState().verifyIntegrity()).toBe(false);
    expect(useCellLineageStore.getState().integrityVerified).toBe(false);
    expect(useCellLineageStore.getState().chains.get('c1')?.integrityValid).toBe(false);
  });

  it('queryEntries returns entries sorted by timestamp desc', async () => {
    const s = useCellLineageStore.getState();
    await s.recordChange('c1', snapshot(null), snapshot(1), actor, reason, origin);
    await new Promise((r) => setTimeout(r, 5));
    await s.recordChange('c2', snapshot(null), snapshot(10), actor, reason, origin);
    await new Promise((r) => setTimeout(r, 5));
    await s.recordChange('c1', snapshot(1), snapshot(2), actor, reason, origin);
    const results = s.queryEntries(['c1', 'c2']);
    expect(results).toHaveLength(3);
    expect(new Date(results[0]!.timestamp).getTime()).toBeGreaterThanOrEqual(
      new Date(results[2]!.timestamp).getTime()
    );
    // unknown cells are ignored
    expect(s.queryEntries(['missing'])).toHaveLength(0);
  });

  it('selectors report chain and entry counts', async () => {
    const s = useCellLineageStore.getState();
    expect(cellLineageSelectors.chainCount(s)).toBe(0);
    expect(cellLineageSelectors.totalEntries(s)).toBe(0);
    await s.recordChange('c1', snapshot(null), snapshot(1), actor, reason, origin);
    await s.recordChange('c2', snapshot(null), snapshot(9), actor, reason, origin);
    const s2 = useCellLineageStore.getState();
    expect(cellLineageSelectors.chainCount(s2)).toBe(2);
    expect(cellLineageSelectors.totalEntries(s2)).toBe(2);
    const status = cellLineageSelectors.integrityStatus(s2);
    expect(status.verified).toBe(false);
  });

  it('round-trips Map-backed chains and migrates v1 blobs whose Map serialized as empty', async () => {
    const store = useCellLineageStore.getState();
    await store.recordChange('c1', snapshot(null), snapshot(1), actor, reason, origin);

    const options = useCellLineageStore.persist.getOptions();
    expect(options.version).toBe(2);
    const partial = options.partialize!(useCellLineageStore.getState());
    const persisted = JSON.parse(JSON.stringify(partial)) as Record<string, unknown>;
    const current = useCellLineageStore.getInitialState();
    const merge = options.merge!;
    const restored = merge(persisted, current);

    expect(restored.chains).toBeInstanceOf(Map);
    expect(restored.chains.get('c1')?.entries).toHaveLength(1);

    const legacyV1 = JSON.parse(
      JSON.stringify({
        chains: {},
        pendingEntries: useCellLineageStore.getState().pendingEntries,
        integrityVerified: true,
        lastIntegrityCheck: '2026-01-01T00:00:00.000Z',
      })
    ) as Record<string, unknown>;
    const migrated = options.migrate!(legacyV1, 1);
    const restoredV1 = merge(migrated, current);
    expect(restoredV1.chains).toBeInstanceOf(Map);
    expect(restoredV1.chains.get('c1')?.entries).toHaveLength(1);
    expect(restoredV1.integrityVerified).toBe(false);
    expect(restoredV1.lastIntegrityCheck).toBeNull();

    useCellLineageStore.setState(restoredV1);
    expect(await useCellLineageStore.getState().verifyIntegrity()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// W6-P0-14 — negative RBAC on the provenance chain.
// ---------------------------------------------------------------------------

describe('cellLineageStore RBAC (W6-P0-14)', () => {
  const snapshot = (v: unknown) => ({
    value: v,
    dataType: 'number' as const,
    preciseValue: null,
    formula: null,
    dependencies: null,
  });
  const actor = {
    userId: 'u1',
    userName: 'Test',
    engineId: null,
    engineVersion: null,
    actorType: 'user' as const,
  };
  const reason = {
    category: 'manual-edit' as const,
    description: 'test edit',
    referenceId: null,
    referenceType: null,
  };
  const origin = 'manual-override' as const;

  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    useCellLineageStore.setState({
      chains: new Map(),
      pendingEntries: [],
      integrityVerified: false,
      lastIntegrityCheck: null,
    });
  });

  it('recordChange without a user throws PermissionError and appends nothing', () => {
    // enforce() throws synchronously before the async body starts, so the
    // call itself (not a rejected promise) carries the PermissionError.
    expect(() =>
      useCellLineageStore
        .getState()
        .recordChange('c1', snapshot(null), snapshot(1), actor, reason, origin)
    ).toThrow(PermissionError);
    expect(useCellLineageStore.getState().chains.size).toBe(0);
  });

  it('recordChange denies an authenticated Viewer without mutating the chain', () => {
    actAs('Viewer');
    const denied = expectPermissionDenied(() =>
      useCellLineageStore
        .getState()
        .recordChange('c1', snapshot(null), snapshot(1), actor, reason, origin)
    );
    expect(denied.message).toContain('audit:create');
    expect(useCellLineageStore.getState().chains.size).toBe(0);
  });

  it('recordChange denies Admin when audit:create is withheld', () => {
    actAsRoleWithout('Admin', 'audit:create');
    const denied = expectPermissionDenied(() =>
      useCellLineageStore
        .getState()
        .recordChange('c1', snapshot(null), snapshot(1), actor, reason, origin)
    );
    expect(denied.message).toContain('audit:create');
    expect(useCellLineageStore.getState().chains.size).toBe(0);
  });

  it('reads stay open to unauthenticated callers (rewindTo / getChain)', async () => {
    expect(useCellLineageStore.getState().getChain('missing')).toBeNull();
    expect(useCellLineageStore.getState().rewindTo('missing', 'entry-missing')).toBeNull();
  });
});
