import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock sql.js to prevent WASM fetch failures in test env.
// sqlJsStorage tries to load https://sql.js.org/dist/sql-wasm.wasm which
// fails in jsdom/node. Instead, provide a minimal in-memory mock.
vi.mock('sql.js', () => {
  class MockDatabase {
    private tables = new Map<string, Map<string, string>>();
    run(sql: string, _params?: unknown[]) {
      const match = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
      if (match && !this.tables.has(match[1]!)) this.tables.set(match[1]!, new Map());
      const insertMatch = sql.match(
        /INSERT OR REPLACE INTO (\w+) \(id, value\) VALUES \(\?, \?\)/i
      );
      if (insertMatch) {
        const tbl = this.tables.get(insertMatch[1]!);
        if (tbl && _params && _params.length >= 2)
          tbl.set(String(_params[0]!), String(_params[1]!));
      }
      const deleteMatch = sql.match(/DELETE FROM (\w+) WHERE id = \?/i);
      if (deleteMatch) {
        const tbl = this.tables.get(deleteMatch[1]!);
        if (tbl && _params && _params.length >= 1) tbl.delete(String(_params[0]!));
      }
    }
    exec(sql: string, _params?: unknown[]) {
      const selMatch = sql.match(/SELECT value FROM (\w+) WHERE id = \?/i);
      if (selMatch) {
        const tbl = this.tables.get(selMatch[1]!);
        if (tbl && _params && _params.length >= 1) {
          const val = tbl.get(String(_params[0]!));
          return val ? [{ columns: ['value'], values: [[val]] }] : [];
        }
      }
      return [];
    }
    export(): Uint8Array {
      return new Uint8Array(0);
    }
    close() {}
  }
  return {
    default: async () => ({ Database: MockDatabase }),
    Database: MockDatabase,
  };
});

// Mock worker pool to avoid Web Worker creation in jsdom test environment.
// Web Workers don't work in jsdom, causing indefinite hangs.
vi.mock('../workers/worker-pool', () => {
  const CHUNK_SIZE = 1024 * 1024;
  const mockPool = {
    run: async <T>(request: { type: string; payload: any; chunkSize?: number }): Promise<T> => {
      if (request.type === 'stringify') {
        const json = JSON.stringify(request.payload);
        const chunkSize = request.chunkSize ?? CHUNK_SIZE;
        if (json.length <= chunkSize) {
          return { payload: json } as T;
        }
        const chunks: string[] = [];
        for (let i = 0; i < json.length; i += chunkSize) {
          chunks.push(json.slice(i, i + chunkSize));
        }
        return { chunks, totalSize: json.length } as T;
      }
      if (request.type === 'parse') {
        const json = Array.isArray(request.payload) ? request.payload.join('') : request.payload;
        return { payload: JSON.parse(json) } as T;
      }
      return {} as T;
    },
    terminate: () => {},
    get busyCount() {
      return 0;
    },
    get queuedCount() {
      return 0;
    },
    get workerCount() {
      return 0;
    },
  };
  return {
    createStoragePool: () => mockPool,
    createBatchCalcPool: () => mockPool,
    WorkerPool: class {},
  };
});

// Polyfill localStorage for Node.js v22+ where the experimental global
// may be undefined and shadows jsdom's implementation.
if (typeof localStorage === 'undefined' || localStorage === null) {
  const store = new Map<string, string>();
  const ls: Storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    get length() {
      return store.size;
    },
    key: (index: number) => [...store.keys()][index] ?? null,
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: ls,
    writable: false,
    configurable: true,
  });
}

// Automatically cleanup after each test
afterEach(() => {
  cleanup();
});
