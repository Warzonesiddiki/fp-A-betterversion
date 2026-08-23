/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Local fault-injectable sql.js mock. This overrides the global setup.ts mock
// FOR THIS FILE ONLY so error paths can be driven deterministically: the
// Database methods delegate to shared hoisted vi.fn()s whose default
// implementations replicate the global in-memory-table behaviour, and each
// test can flip individual methods into failure mode.
// ---------------------------------------------------------------------------
const dbState = vi.hoisted(() => {
  const tables = new Map<string, Map<string, string>>();
  const impl = {
    run: vi.fn(),
    exec: vi.fn(),
    export: vi.fn(),
  };
  return { tables, impl };
});

function defaultRun(sql: string, params?: unknown[]): void {
  const createMatch = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
  if (createMatch && !dbState.tables.has(createMatch[1]!)) {
    dbState.tables.set(createMatch[1]!, new Map());
  }
  const insertMatch = sql.match(/INSERT OR REPLACE INTO (\w+) \(id, value\) VALUES \(\?, \?\)/i);
  if (insertMatch && params && params.length >= 2) {
    let tbl = dbState.tables.get(insertMatch[1]!);
    if (!tbl) {
      tbl = new Map();
      dbState.tables.set(insertMatch[1]!, tbl);
    }
    tbl.set(String(params[0]!), String(params[1]!));
  }
  const deleteMatch = sql.match(/DELETE FROM (\w+) WHERE id = \?/i);
  if (deleteMatch && params && params.length >= 1) {
    dbState.tables.get(deleteMatch[1]!)?.delete(String(params[0]!));
  }
}

function defaultExec(sql: string, params?: unknown[]): unknown[] {
  const selMatch = sql.match(/SELECT value FROM (\w+) WHERE id = \?/i);
  if (selMatch && params && params.length >= 1) {
    const val = dbState.tables.get(selMatch[1]!)?.get(String(params[0]!));
    return val !== undefined ? [{ columns: ['value'], values: [[val]] }] : [];
  }
  return [];
}

vi.mock('sql.js', () => ({
  default: async () => ({
    Database: class MockDatabase {
      run = dbState.impl.run;
      exec = dbState.impl.exec;
      export = dbState.impl.export;
      close(): void {}
    },
  }),
}));

import { sqlJsStorage, isSqlJsAvailable } from './sqlJsStorage';
import { StorageBackendError } from './storageErrors';

describe('sqlJsStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    dbState.tables.clear();
    dbState.impl.run.mockImplementation(defaultRun);
    dbState.impl.exec.mockImplementation(defaultExec);
    dbState.impl.export.mockReturnValue(new Uint8Array(0));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return null for missing key', async () => {
    const result = await sqlJsStorage.getItem('nonexistent');
    expect(result).toBeNull();
  });

  it('should store and retrieve a value', async () => {
    const data = { state: { count: 42 }, version: 0 };
    await sqlJsStorage.setItem('test-store', data as any);

    const result = await sqlJsStorage.getItem('test-store');
    expect(result).toEqual(data);
  });

  it('should overwrite existing value', async () => {
    await sqlJsStorage.setItem('key', { state: { v: 1 } } as any);
    await sqlJsStorage.setItem('key', { state: { v: 2 } } as any);

    const result = await sqlJsStorage.getItem('key');
    expect(result).toEqual({ state: { v: 2 } });
  });

  it('should remove a value', async () => {
    await sqlJsStorage.setItem('to-delete', { state: true } as any);
    await sqlJsStorage.removeItem('to-delete');

    const result = await sqlJsStorage.getItem('to-delete');
    expect(result).toBeNull();
  });

  it('should handle removing non-existent key without error', async () => {
    await expect(sqlJsStorage.removeItem('ghost')).resolves.toBeUndefined();
  });

  it('should persist to localStorage via saveToLocalStorage', async () => {
    await sqlJsStorage.setItem('persist-test', { state: { x: 1 } } as any);

    // Mock DB.export() returns empty array, so stored is '' (btoa of empty binary)
    const stored = localStorage.getItem('finplan-sqljs-db');
    expect(stored).toBeDefined();
  });

  it('should handle string values', async () => {
    // The backend stores text raw and JSON.parses it on read, so strings must
    // be stored JSON-encoded to round-trip (this is how the chunked wrapper
    // above sqlJsStorage always delivers them: serializeForStorage
    // JSON.stringify's every payload, including strings).
    await sqlJsStorage.setItem('str-key', '"hello"' as any);
    const result = await sqlJsStorage.getItem('str-key');
    expect(result).toBe('hello');
  });

  it('should handle multiple keys independently', async () => {
    await sqlJsStorage.setItem('a', { state: 1 } as any);
    await sqlJsStorage.setItem('b', { state: 2 } as any);

    const a = await sqlJsStorage.getItem('a');
    const b = await sqlJsStorage.getItem('b');

    expect(a).not.toEqual(b);
  });
});

// ---------------------------------------------------------------------------
// W6-P0-04: raw-backend failures are TYPED and PROPAGATED. Swallowing them
// (log-and-return-null / log-and-return) made masterStorage's fail-closed
// read path, quota-exceeded handling, and corruption recovery dead code.
// ---------------------------------------------------------------------------
describe('sqlJsStorage error propagation (W6-P0-04)', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    dbState.tables.clear();
    dbState.impl.run.mockImplementation(defaultRun);
    dbState.impl.exec.mockImplementation(defaultExec);
    dbState.impl.export.mockReturnValue(new Uint8Array(0));
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('getItem rejects with StorageBackendError when the database query fails', async () => {
    const cause = new Error('statement failed');
    // sql.js exec()/run() are SYNCHRONOUS — fault injection must throw
    // synchronously (a rejected promise would be assigned un-awaited and
    // silently coerce to an empty result).
    dbState.impl.exec.mockImplementation(() => {
      throw cause;
    });

    const promise = sqlJsStorage.getItem('gl-store');
    await expect(promise).rejects.toBeInstanceOf(StorageBackendError);
    try {
      await promise;
    } catch (err) {
      const backendError = err as StorageBackendError;
      expect(backendError.operation).toBe('get');
      expect(backendError.storeKey).toBe('gl-store');
      expect(backendError.cause).toBe(cause);
      expect(backendError.name).toBe('StorageBackendError');
    }
  });

  it('getItem fails closed with StorageBackendError on corrupted JSON rows', async () => {
    dbState.tables.set('stores', new Map([['budget-store', '{corrupt json']]));

    await expect(sqlJsStorage.getItem('budget-store')).rejects.toBeInstanceOf(StorageBackendError);
  });

  it('setItem rejects with StorageBackendError when the write statement fails', async () => {
    const cause = new Error('SQLITE_FULL');
    dbState.impl.run.mockImplementation(() => {
      throw cause;
    });

    const promise = sqlJsStorage.setItem('gl-store', { state: {} } as any);
    await expect(promise).rejects.toBeInstanceOf(StorageBackendError);
    try {
      await promise;
    } catch (err) {
      const backendError = err as StorageBackendError;
      expect(backendError.operation).toBe('set');
      expect(backendError.storeKey).toBe('gl-store');
      expect(backendError.cause).toBe(cause);
    }
  });

  it('setItem rejects with StorageBackendError when the localStorage snapshot hits quota', async () => {
    const quotaError = Object.assign(new Error('exceeded storage quota'), {
      name: 'QuotaExceededError',
    });
    const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw quotaError;
    });

    try {
      const promise = sqlJsStorage.setItem('quota-key', { state: { big: true } } as any);
      await expect(promise).rejects.toBeInstanceOf(StorageBackendError);
      try {
        await promise;
      } catch (err) {
        const backendError = err as StorageBackendError;
        expect(backendError.operation).toBe('set');
        expect(backendError.storeKey).toBe('quota-key');
        expect((backendError.cause as Error)?.name).toBe('QuotaExceededError');
      }
    } finally {
      setItemSpy.mockRestore();
    }
  });

  it('removeItem rejects with StorageBackendError when the delete fails', async () => {
    const cause = new Error('delete failed');
    dbState.impl.run.mockImplementation(() => {
      throw cause;
    });

    const promise = sqlJsStorage.removeItem('old-store');
    await expect(promise).rejects.toBeInstanceOf(StorageBackendError);
    try {
      await promise;
    } catch (err) {
      const backendError = err as StorageBackendError;
      expect(backendError.operation).toBe('remove');
      expect(backendError.storeKey).toBe('old-store');
      expect(backendError.cause).toBe(cause);
    }
  });

  it('removeItem rejects with StorageBackendError when the post-delete snapshot hits quota', async () => {
    const quotaError = Object.assign(new Error('exceeded storage quota'), {
      name: 'QuotaExceededError',
    });
    const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw quotaError;
    });

    try {
      await expect(sqlJsStorage.removeItem('quota-key')).rejects.toBeInstanceOf(
        StorageBackendError
      );
    } finally {
      setItemSpy.mockRestore();
    }
  });

  it('absent keys still resolve to null — absence is not a failure', async () => {
    await expect(sqlJsStorage.getItem('never-written')).resolves.toBeNull();
  });
});

describe('isSqlJsAvailable', () => {
  beforeEach(() => {
    dbState.tables.clear();
    dbState.impl.run.mockImplementation(defaultRun);
    dbState.impl.exec.mockImplementation(defaultExec);
    dbState.impl.export.mockReturnValue(new Uint8Array(0));
  });

  it('should return true when sql.js initializes successfully', async () => {
    const result = await isSqlJsAvailable();
    expect(result).toBe(true);
  });
});
