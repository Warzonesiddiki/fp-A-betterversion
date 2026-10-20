import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Database } from 'sql.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { persistedSqlJsRows, sqlitePort } = vi.hoisted(() => ({
  persistedSqlJsRows: new Map<string, unknown>(),
  sqlitePort: {
    current: null as null | {
      getItem: (key: string) => Promise<unknown>;
      setItem: (key: string, value: unknown) => Promise<void>;
      removeItem: (key: string) => Promise<void>;
    },
  },
}));

vi.mock('@/utils/sqlJsStorage', () => ({
  sqlJsStorage: {
    getItem: async (key: string) => {
      if (sqlitePort.current) return sqlitePort.current.getItem(key);
      const stored = persistedSqlJsRows.get(key);
      return typeof stored === 'string' ? JSON.parse(stored) : null;
    },
    setItem: async (key: string, value: unknown) => {
      if (sqlitePort.current) return sqlitePort.current.setItem(key, value);
      persistedSqlJsRows.set(key, typeof value === 'string' ? value : JSON.stringify(value));
    },
    removeItem: async (key: string) => {
      if (sqlitePort.current) return sqlitePort.current.removeItem(key);
      persistedSqlJsRows.delete(key);
    },
  },
}));

vi.mock('@/utils/tauriSqlStorage', () => ({
  tauriSqlStorage: {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
  },
  isTauri: async () => false,
}));

const STORE_KEY = 'cell-lineage-store';
const DEVICE_KEY = 'finplan.storage-key.v1';
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
      id: 'lineage-restart-user',
      email: 'lineage-restart@finplan.local',
      firstName: 'Lineage',
      lastName: 'Restart',
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

function sqlitePortFor(database: Database) {
  database.run('CREATE TABLE IF NOT EXISTS stores (id TEXT PRIMARY KEY, value TEXT)');
  return {
    getItem: async (key: string): Promise<unknown> => {
      const result = database.exec('SELECT value FROM stores WHERE id = ?', [key]);
      const stored = result[0]?.values[0]?.[0];
      return typeof stored === 'string' ? JSON.parse(stored) : null;
    },
    setItem: async (key: string, value: unknown): Promise<void> => {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      database.run('INSERT OR REPLACE INTO stores (id, value) VALUES (?, ?)', [key, serialized]);
    },
    removeItem: async (key: string): Promise<void> => {
      database.run('DELETE FROM stores WHERE id = ?', [key]);
    },
  };
}

describe('cellLineageStore encrypted masterStorage rehydration contract', () => {
  beforeEach(() => {
    persistedSqlJsRows.clear();
    sqlitePort.current = null;
    priorMasterStorageKey = process.env.MASTER_STORAGE_KEY;
    process.env.MASTER_STORAGE_KEY = 'cell-lineage-restart-contract-test-key';
    localStorage.removeItem(DEVICE_KEY);
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (priorMasterStorageKey === undefined) delete process.env.MASTER_STORAGE_KEY;
    else process.env.MASTER_STORAGE_KEY = priorMasterStorageKey;
    localStorage.removeItem(DEVICE_KEY);
    vi.resetModules();
  });

  it('restores a hashed Map chain through real masterStorage encryption into a fresh store module', async () => {
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

    const writer = useCellLineageStore.getState();
    await writer.recordChange(
      'cell-sensitive-17',
      snapshot(null),
      snapshot(12_345),
      {
        userId: 'lineage-restart-user',
        userName: 'Lineage Restart',
        engineId: null,
        engineVersion: null,
        actorType: 'user',
      },
      {
        category: 'manual-edit',
        description: 'sensitive-lineage-note',
        referenceId: null,
        referenceType: null,
      },
      'manual-override'
    );
    await Promise.all(persistenceWrites);
    setItemSpy.mockRestore();

    const encryptedAtRest = persistedSqlJsRows.get(STORE_KEY);
    expect(typeof encryptedAtRest).toBe('string');
    expect(encryptedAtRest).not.toContain('sensitive-lineage-note');
    expect(encryptedAtRest).not.toContain('cell-sensitive-17');

    // Reload the store and storage modules while preserving only the backend
    // bytes and configured key, analogous to a fresh application process.
    vi.resetModules();
    const [{ useCellLineageStore: restartedStore }, { useAuthStore: restartedAuth }] =
      await Promise.all([import('./cellLineageStore'), import('./authStore')]);
    authenticateLineageUser(restartedAuth);
    await restartedStore.persist.rehydrate();

    const restored = restartedStore.getState();
    expect(restored.chains).toBeInstanceOf(Map);
    expect(restored.chains.get('cell-sensitive-17')?.entries).toHaveLength(1);
    expect(restored.pendingEntries).toHaveLength(1);
    expect(restored.integrityVerified).toBe(false);
    expect(restored.lastIntegrityCheck).toBeNull();
    expect(restored.getCurrentValue('cell-sensitive-17')).toEqual(snapshot(12_345));
    expect(await restored.verifyIntegrity()).toBe(true);
    expect(restartedStore.getState().chains.get('cell-sensitive-17')?.integrityValid).toBe(true);
  });

  it('rehydrates after exporting and reopening a real SQL.js/WASM database image', async () => {
    const actualSqlJs = await vi.importActual<typeof import('sql.js')>('sql.js');
    const SQL = await actualSqlJs.default({
      wasmBinary: readFileSync(resolve('node_modules/sql.js/dist/sql-wasm.wasm')),
    });
    const writerDatabase = new SQL.Database();
    let reopenedDatabase: Database | null = null;

    try {
      sqlitePort.current = sqlitePortFor(writerDatabase);
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
        'sqlite-backed-lineage-cell',
        snapshot(null),
        snapshot(45_678),
        {
          userId: 'lineage-restart-user',
          userName: 'Lineage Restart',
          engineId: null,
          engineVersion: null,
          actorType: 'user',
        },
        {
          category: 'manual-edit',
          description: 'sqlite-backed-sensitive-lineage-note',
          referenceId: null,
          referenceType: null,
        },
        'manual-override'
      );
      await Promise.all(persistenceWrites);
      setItemSpy.mockRestore();

      const storedRows = writerDatabase.exec('SELECT value FROM stores WHERE id = ?', [STORE_KEY]);
      const encryptedSqlValue = storedRows[0]?.values[0]?.[0];
      expect(typeof encryptedSqlValue).toBe('string');
      expect(encryptedSqlValue).not.toContain('sqlite-backed-sensitive-lineage-note');
      expect(encryptedSqlValue).not.toContain('sqlite-backed-lineage-cell');

      // Export/reopen the actual SQLite/WASM database image, then discard the
      // writer store module graph while retaining only the reopened database.
      reopenedDatabase = new SQL.Database(writerDatabase.export());
      sqlitePort.current = sqlitePortFor(reopenedDatabase);
      vi.resetModules();

      const [{ useCellLineageStore: restartedStore }, { useAuthStore: restartedAuth }] =
        await Promise.all([import('./cellLineageStore'), import('./authStore')]);
      authenticateLineageUser(restartedAuth);
      await restartedStore.persist.rehydrate();

      const restored = restartedStore.getState();
      expect(restored.chains).toBeInstanceOf(Map);
      expect(restored.chains.get('sqlite-backed-lineage-cell')?.entries).toHaveLength(1);
      expect(restored.pendingEntries).toHaveLength(1);
      expect(restored.integrityVerified).toBe(false);
      expect(restored.getCurrentValue('sqlite-backed-lineage-cell')).toEqual(snapshot(45_678));
      expect(await restored.verifyIntegrity()).toBe(true);
      expect(
        restartedStore.getState().chains.get('sqlite-backed-lineage-cell')?.integrityValid
      ).toBe(true);
    } finally {
      sqlitePort.current = null;
      reopenedDatabase?.close();
      writerDatabase.close();
    }
  });
});
