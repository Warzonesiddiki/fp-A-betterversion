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
      if (match && !this.tables.has(match[1])) this.tables.set(match[1], new Map());
      const insertMatch = sql.match(/INSERT OR REPLACE INTO (\w+) \(id, value\) VALUES \(\?, \?\)/i);
      if (insertMatch) {
        const tbl = this.tables.get(insertMatch[1]);
        if (tbl && _params && _params.length >= 2) tbl.set(String(_params[0]), String(_params[1]));
      }
      const deleteMatch = sql.match(/DELETE FROM (\w+) WHERE id = \?/i);
      if (deleteMatch) {
        const tbl = this.tables.get(deleteMatch[1]);
        if (tbl && _params && _params.length >= 1) tbl.delete(String(_params[0]));
      }
    }
    exec(sql: string, _params?: unknown[]) {
      const selMatch = sql.match(/SELECT value FROM (\w+) WHERE id = \?/i);
      if (selMatch) {
        const tbl = this.tables.get(selMatch[1]);
        if (tbl && _params && _params.length >= 1) {
          const val = tbl.get(String(_params[0]));
          return val ? [{ columns: ['value'], values: [[val]] }] : [];
        }
      }
      return [];
    }
    export(): Uint8Array { return new Uint8Array(0); }
    close() {}
  }
  return {
    default: {
      Database: MockDatabase,
      initSqlJs: async () => ({ Database: MockDatabase }),
    },
  };
});

// Polyfill localStorage for Node.js v22+ where the experimental global
// may be undefined and shadows jsdom's implementation.
if (typeof globalThis.localStorage === 'undefined' || globalThis.localStorage === null) {
  const store = new Map<string, string>();
  globalThis.localStorage = {
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
}

// Automatically cleanup after each test
afterEach(() => {
  cleanup();
});
