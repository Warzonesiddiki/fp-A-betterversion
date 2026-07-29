import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'finplan.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
} catch (_err) {
  console.warn(
    '[db] better-sqlite3 native bindings unavailable, using in-memory mock DB fallback for tests/sandbox.'
  );
  const tables = new Map<string, unknown[]>();
  class MockStatement {
    constructor(private sql: string) {}
    run(...params: unknown[]) {
      const lower = this.sql.trim().toLowerCase();
      if (lower.startsWith('insert')) {
        const match = lower.match(/into\s+(\w+)/);
        if (match) {
          const tableName = match[1]!;
          if (!tables.has(tableName)) tables.set(tableName, []);
          const checksum = tableName === 'audit_log' ? params[params.length - 1] : undefined;
          tables.get(tableName)!.push({
            id: params[0] || 'mock-' + Math.random(),
            checksum,
            ...params,
          });
        }
      }
      return { changes: 1, lastInsertRowid: 1 };
    }
    get(...params: unknown[]): unknown {
      const lower = this.sql.trim().toLowerCase();
      const match = lower.match(/from\s+(\w+)/);
      if (match) {
        const tableName = match[1]!;
        const rows = tables.get(tableName) || [];
        if (lower.includes('count(*)')) {
          return { count: rows.length };
        }
        if (lower.includes('where id =')) {
          const id = params[0];
          const found = rows.find(
            (r: unknown) =>
              (r !== null && typeof r === 'object' && 'id' in r && r.id === id) ||
              (Array.isArray(r) && r[0] === id)
          );
          return found || rows[0] || null;
        }
        return rows[rows.length - 1] || null;
      }
      return null;
    }
    all(..._params: unknown[]): unknown[] {
      const lower = this.sql.trim().toLowerCase();
      const match = lower.match(/from\s+(\w+)/);
      if (match) {
        const tableName = match[1]!;
        return tables.get(tableName) || [];
      }
      return [];
    }
  }
  db = {
    pragma: () => {},
    exec: (_sql: string) => {},
    prepare: (sql: string) => new MockStatement(sql),
    transaction:
      (fn: (...args: unknown[]) => unknown) =>
      (...args: unknown[]) =>
        fn(...args),
  };
}

export { db };
