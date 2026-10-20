import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/tauriSqlStorage', () => ({
  tauriSqlStorage: {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
  },
  isTauri: async () => false,
}));

const STORE_KEY = 'cell-lineage-store';
const SQLJS_DATABASE_KEY = 'finplan-sqljs-db';
let priorMasterStorageKey: string | undefined;

function snapshot(value: unknown) {
  return {
    value,
    dataType: 'number' as const,
    preciseValue: null,
    formula: null,
    dependencies: null,
  };
}

function authenticateLineageUser(useAuthStore: {
  setState: (state: Record<string, unknown>) => void;
}) {
  useAuthStore.setState({
    user: {
      id: 'lineage-sqljs-restart-user',
      email: 'lineage-sqljs-restart@finplan.local',
      firstName: 'Lineage',
      lastName: 'SQL.js',
      avatarUrl: null,
      role: 'Admin',
      departmentId: 'finance',
      departmentName: 'Finance',
      entityId: 'entity-001',
      status: 'Active',
      lastLoginAt: '2026-10-20T09:00:00.000Z',
      mfaEnabled: false,
      permissions: ['audit:create', 'audit:read'],
    },
    isAuthenticated: true,
  });
}

describe('cellLineageStore through production sqlJsStorage and masterStorage', () => {
  beforeEach(() => {
    priorMasterStorageKey = process.env.MASTER_STORAGE_KEY;
    process.env.MASTER_STORAGE_KEY = 'cell-lineage-real-sqljs-test-key';
    localStorage.clear();
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (priorMasterStorageKey === undefined) delete process.env.MASTER_STORAGE_KEY;
    else process.env.MASTER_STORAGE_KEY = priorMasterStorageKey;
    localStorage.clear();
    vi.doUnmock('sql.js');
    vi.resetModules();
  });

  it('rehydrates lineage after a fresh module graph reopens the production SQL.js database image', async () => {
    const actualSqlJs = await vi.importActual<typeof import('sql.js')>('sql.js');
    const SQL = await actualSqlJs.default({
      wasmBinary: readFileSync(resolve('node_modules/sql.js/dist/sql-wasm.wasm')),
    });
    const loadInitializedSqlJs = async () => SQL;
    vi.doMock('sql.js', () => ({ default: loadInitializedSqlJs }));

    const [{ useCellLineageStore }, { useAuthStore }, { masterStorage }] = await Promise.all([
      import('./cellLineageStore'),
      import('./authStore'),
      import('@/utils/masterStorage'),
    ]);
    authenticateLineageUser(useAuthStore);
    await useCellLineageStore.persist.rehydrate();

    const actualSetItem = masterStorage.setItem.bind(masterStorage);
    const persistenceWrites: Promise<void>[] = [];
    const setItemSpy = vi
      .spyOn(masterStorage, 'setItem')
      .mockImplementation((name: string, value: unknown) => {
        const write = actualSetItem(name, value);
        persistenceWrites.push(write);
        return write;
      });

    await useCellLineageStore.getState().recordChange(
      'production-sqljs-lineage-cell',
      snapshot(null),
      snapshot(78_901),
      {
        userId: 'lineage-sqljs-restart-user',
        userName: 'Lineage SQL.js',
        engineId: null,
        engineVersion: null,
        actorType: 'user',
      },
      {
        category: 'manual-edit',
        description: 'production-sqljs-sensitive-note',
        referenceId: null,
        referenceType: null,
      },
      'manual-override'
    );
    await Promise.all(persistenceWrites);
    setItemSpy.mockRestore();

    const encodedDatabase = localStorage.getItem(SQLJS_DATABASE_KEY);
    expect(encodedDatabase).toBeTruthy();
    expect(encodedDatabase).not.toContain('production-sqljs-sensitive-note');
    expect(encodedDatabase).not.toContain('production-sqljs-lineage-cell');
    const databaseBytes = Uint8Array.from(atob(encodedDatabase ?? ''), (character) =>
      character.charCodeAt(0)
    );
    const inspectionDatabase = new SQL.Database(databaseBytes);
    const persistedStoreRows = inspectionDatabase.exec('SELECT value FROM stores WHERE id = ?', [
      STORE_KEY,
    ]);
    expect(persistedStoreRows[0]?.values).toHaveLength(1);
    expect(String(persistedStoreRows[0]?.values[0]?.[0])).not.toContain(
      'production-sqljs-sensitive-note'
    );
    inspectionDatabase.close();

    // The real sqlJsStorage implementation stores the exported SQLite image in
    // localStorage. A fresh module graph must reopen that image, decrypt the
    // row through masterStorage, revive the Map, and re-verify the chain.
    vi.resetModules();
    vi.doMock('sql.js', () => ({ default: loadInitializedSqlJs }));
    const [{ useCellLineageStore: restartedStore }, { useAuthStore: restartedAuth }] =
      await Promise.all([import('./cellLineageStore'), import('./authStore')]);
    authenticateLineageUser(restartedAuth);
    await restartedStore.persist.rehydrate();

    const restored = restartedStore.getState();
    expect(restored.chains).toBeInstanceOf(Map);
    expect(restored.chains.get('production-sqljs-lineage-cell')?.entries).toHaveLength(1);
    expect(restored.pendingEntries).toHaveLength(1);
    expect(restored.integrityVerified).toBe(false);
    expect(restored.getCurrentValue('production-sqljs-lineage-cell')).toEqual(snapshot(78_901));
    expect(await restored.verifyIntegrity()).toBe(true);
    expect(
      restartedStore.getState().chains.get('production-sqljs-lineage-cell')?.integrityValid
    ).toBe(true);
  });
});
