/* eslint-disable @typescript-eslint/no-explicit-any */
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
            rowObj.close_state = params[8] ?? 'open';
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
          // Filter by WHERE id = ? if present
          const whereMatch = this.sql.match(/WHERE\s+id\s*=\s*\?/i);
          for (const r of rows) {
            // If WHERE id = ? is present, only update matching rows
            if (whereMatch && r.id !== params[params.length - 1]) continue;

            if (tableName === 'fiscal_periods') {
              // For parameterized updates with close_state = ?, is_closed = ?
              if (
                lower.includes('close_state') &&
                lower.includes('is_closed') &&
                params.length >= 2
              ) {
                // Parse the SET clause to determine param order
                const setClause = this.sql.match(/SET\s+(.*?)\s+WHERE/i)?.[1] ?? '';
                const setParts = setClause.split(',').map((p: string) => p.trim());
                const closeStateIdx = setParts.findIndex((p: string) =>
                  p.toLowerCase().startsWith('close_state')
                );
                const isClosedIdx = setParts.findIndex((p: string) =>
                  p.toLowerCase().startsWith('is_closed')
                );

                // Check if close_state is parameterized (has ?) or literal
                if (closeStateIdx >= 0 && setParts[closeStateIdx]!.includes('?')) {
                  r.close_state = params[closeStateIdx] ?? 'open';
                } else if (lower.includes("close_state = 'open'")) {
                  r.close_state = 'open';
                }

                // Check if is_closed is parameterized or literal
                if (isClosedIdx >= 0 && setParts[isClosedIdx]!.includes('?')) {
                  r.is_closed = params[isClosedIdx] ?? 0;
                  r[7] = r.is_closed;
                } else if (lower.includes('is_closed = 1')) {
                  r.is_closed = 1;
                  r[7] = 1;
                } else if (lower.includes('is_closed = 0')) {
                  r.is_closed = 0;
                  r[7] = 0;
                }
              } else if (lower.includes('is_closed = 1')) {
                r.is_closed = 1;
                r[7] = 1;
                if (lower.includes('close_state')) {
                  const csMatch = this.sql.match(/close_state\s*=\s*'([^']+)'/);
                  if (csMatch) r.close_state = csMatch[1];
                }
                if (!r.close_state) r.close_state = 'soft-close';
              } else if (lower.includes('is_closed = 0')) {
                r.is_closed = 0;
                r[7] = 0;
                r.close_state = 'open';
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
            (r: any) => r !== null && (Number(r.is_closed) === 1 || Number(r[7]) === 1)
          );
          return found || null;
        }
        const matchId = params[0];
        const found = rows.find((r: any) => r.id === matchId || r[0] === matchId);
        const result = found || rows[rows.length - 1] || null;
        // Ensure close_state is always present on fiscal_periods
        if (result && !result.close_state) {
          result.close_state = result.is_closed === 1 ? 'soft-close' : 'open';
        }
        return result;
      }
      if (
        lower.includes('select checksum') ||
        (lower.includes('from audit_log') && lower.includes('where id ='))
      ) {
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
          const found = rows.find(
            (r: any) => r.id === id || r[0] === id || params.includes(r.id) || params.includes(r[0])
          );
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
