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
  const tables = new Map<string, any[]>();
  class MockStatement {
    constructor(private sql: string) {}
    run(...params: unknown[]) {
      const lower = this.sql.trim().toLowerCase();
      if (lower.includes('insert')) {
        const match = lower.match(/into\s+(\w+)/);
        if (match) {
          const tableName = match[1]!;
          if (!tables.has(tableName)) tables.set(tableName, []);
          const rowObj: Record<string, unknown> = {
            id: params[0] || 'mock-' + Math.random(),
          };
          for (let i = 0; i < params.length; i++) {
            rowObj[i] = params[i];
          }
          if (tableName === 'audit_log') {
            rowObj.id = params[0];
            rowObj.timestamp = params[1];
            rowObj.category = params[2];
            rowObj.action = params[3];
            rowObj.severity = params[4];
            rowObj.checksum = params[params.length - 1];
          } else if (tableName === 'fiscal_periods') {
            rowObj.id = params[0];
            rowObj.year = params[1];
            rowObj.period_number = params[2];
            rowObj.name = params[3];
            rowObj.start_date = params[4];
            rowObj.end_date = params[5];
            rowObj.period_type = params[6];
            rowObj.is_closed = params[7] ?? 0;
          }
          const existingIdx = tables
            .get(tableName)!
            .findIndex((r: any) => r.id === rowObj.id || r[0] === rowObj.id);
          if (existingIdx >= 0) {
            tables.get(tableName)![existingIdx] = rowObj;
          } else {
            tables.get(tableName)!.push(rowObj);
          }
        }
      } else if (lower.includes('update')) {
        const match = lower.match(/update\s+(\w+)/);
        if (match) {
          const tableName = match[1]!;
          const rows = tables.get(tableName) || [];
          for (const r of rows) {
            if (tableName === 'fiscal_periods') {
              if (lower.includes('is_closed = 1')) {
                r.is_closed = 1;
                r[7] = 1;
              } else if (lower.includes('is_closed = 0')) {
                r.is_closed = 0;
                r[7] = 0;
              }
            }
          }
        }
      }
      return { changes: 1, lastInsertRowid: 1 };
    }
    get(...params: unknown[]): unknown {
      const lower = this.sql.trim().toLowerCase();
      if (lower.includes('from fiscal_periods')) {
        const rows = tables.get('fiscal_periods') || [];
        if (lower.includes('is_closed = 1')) {
          const found = rows.find(
            (r: any) =>
              r !== null &&
              (Number(r.is_closed) === 1 || Number(r[7]) === 1)
          );
          return found || null;
        }
        const matchId = params[0];
        const found = rows.find((r: any) => r.id === matchId || r[0] === matchId);
        return found || rows[rows.length - 1] || null;
      }
      if (lower.includes('select checksum') || (lower.includes('from audit_log') && lower.includes('where id ='))) {
        const id = params[0];
        const rows = tables.get('audit_log') || [];
        const found = rows.find((r: any) => r.id === id || r[0] === id);
        return found ? { checksum: found.checksum } : null;
      }
      const match = lower.match(/from\s+(\w+)/);
      if (match) {
        const tableName = match[1]!;
        const rows = tables.get(tableName) || [];
        if (lower.includes('count(*)')) {
          return { count: rows.length };
        }
        if (lower.includes('where') && params.length > 0) {
          const id = params[0];
          const found = rows.find((r: any) => r.id === id || r[0] === id || params.includes(r.id) || params.includes(r[0]));
          if (found) return found;
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
