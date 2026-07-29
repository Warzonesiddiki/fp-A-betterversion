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
      if (lower.includes('insert')) {
        const match = lower.match(/into\s+(\w+)/);
        if (match) {
          const tableName = match[1]!;
          if (!tables.has(tableName)) tables.set(tableName, []);
          const rowObj: Record<string, unknown> = {
            id: params[0] || 'mock-' + Math.random(),
            ...params,
          };
          if (tableName === 'fiscal_periods') {
            rowObj.id = params[0];
            rowObj.year = params[1];
            rowObj.period_number = params[2];
            rowObj.name = params[3];
            rowObj.start_date = params[4];
            rowObj.end_date = params[5];
            rowObj.period_type = params[6];
            rowObj.is_closed = params[7] ?? 0;
          }
          for (let i = 0; i < params.length; i++) {
            rowObj[i] = params[i];
          }
          const existingIdx = tables.get(tableName)!.findIndex((r: any) => r.id === rowObj.id || r[0] === rowObj.id);
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
          const id = params[params.length - 1];
          for (const r of rows) {
            if ((r as Record<string, unknown>).id === id || (r as any)[0] === id) {
              if (lower.includes('is_closed = 1')) {
                (r as Record<string, unknown>).is_closed = 1;
                (r as any)[7] = 1;
              } else if (lower.includes('is_closed = 0')) {
                (r as Record<string, unknown>).is_closed = 0;
                (r as any)[7] = 0;
              }
            }
          }
        }
      }
      return { changes: 1, lastInsertRowid: 1 };
    }
    get(...params: unknown[]): unknown {
      const lower = this.sql.trim().toLowerCase();
      if (lower.includes('from fiscal_periods') && (lower.includes('is_closed = 1') || lower.includes('between start_date and end_date'))) {
        const postDate = params[0];
        const rows = tables.get('fiscal_periods') || [];
        const found = rows.find(
          (r: unknown) =>
            r !== null &&
            typeof r === 'object' &&
            (Number((r as any).is_closed) === 1 || Number((r as any)[7]) === 1) &&
            typeof postDate === 'string' &&
            postDate >= String((r as any).start_date ?? (r as any)[4]) &&
            postDate <= String((r as any).end_date ?? (r as any)[5])
        );
        return found || null;
      }
      if (lower.includes('from audit_log') && (lower.includes('where id =') || lower.includes('select checksum'))) {
        const id = params[0];
        const rows = tables.get('audit_log') || [];
        const found = rows.find(
          (r: unknown) =>
            r !== null &&
            typeof r === 'object' &&
            (('id' in r && r.id === id) || (r as any)[0] === id || (r as any).id === params[0])
        );
        return found || null;
      }
      const match = lower.match(/from\s+(\w+)/);
      if (match) {
        const tableName = match[1]!;
        const rows = tables.get(tableName) || [];
        if (lower.includes('count(*)')) {
          return { count: rows.length };
        }
        if (lower.includes('where id =') || lower.includes('where (id =')) {
          const id = params[0];
          const found = rows.find(
            (r: unknown) =>
              r !== null &&
              typeof r === 'object' &&
              (('id' in r && r.id === id) || (r as any)[0] === id)
          );
          return found || null;
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
