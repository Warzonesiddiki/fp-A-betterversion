/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { ensureSchema } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');

// FINPLAN_DB_PATH override: test suites point this at a disposable file so
// each test file starts from a clean, real-SQLite database.
const DB_PATH = process.env.FINPLAN_DB_PATH ?? path.join(DATA_DIR, 'finplan.db');

if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

/**
 * Decide whether the in-memory mock DB fallback is permitted.
 *
 * SECURITY/DATA-INTEGRITY FIX (2026-08-09 completion audit):
 * Previously the mock fallback was taken silently in EVERY environment
 * whenever loading better-sqlite3 threw — including production, where it
 * meant all "persisted" data lived in a process-local Map and was silently
 * lost on every restart. The fallback is now:
 *   - ALLOWED in development/test (keeps sandbox/CI runs working);
 *   - FORBIDDEN in production unless FINPLAN_ALLOW_MOCK_DB=true is set
 *     explicitly (ephemeral storage knowingly accepted).
 */
export function mockDbFallbackAllowed(
  nodeEnv: string | undefined,
  allowFlag: string | undefined
): boolean {
  if (allowFlag === 'true' || allowFlag === '1') return true;
  return (nodeEnv ?? 'development') !== 'production';
}

let db: any;
let usingMockDb = false;
try {
  // This package is ESM ("type": "module"); a bare `require()` call here is a
  // ReferenceError at runtime and was being silently swallowed by the catch
  // below, forcing the mock DB even when native bindings were installed.
  // createRequire restores CJS loading for the native addon correctly.
  const requireModule = createRequire(import.meta.url);
  const Database = requireModule('better-sqlite3');
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
} catch (err) {
  usingMockDb = true;
  if (!mockDbFallbackAllowed(process.env.NODE_ENV, process.env.FINPLAN_ALLOW_MOCK_DB)) {
    console.error(
      '[db] FATAL: better-sqlite3 is unavailable in production ' +
        `(reason: ${err instanceof Error ? err.message : String(err)}). ` +
        'Refusing to start with the in-memory mock database — that would silently ' +
        'lose all data on restart. Fix the native module (e.g. `npm rebuild better-sqlite3`), ' +
        'or set FINPLAN_ALLOW_MOCK_DB=true ONLY if ephemeral, non-persisted storage is acceptable.'
    );
    process.exit(1);
  }
  console.warn(
    '[db] better-sqlite3 native bindings unavailable, using in-memory mock DB fallback for tests/sandbox. ' +
      'DATA WILL NOT PERSIST. Never run this mode in production.'
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
          } else if (tableName === 'period_close_audit') {
            // Named columns so the close-audit trail is assertable in tests
            // (GAP-4). Positional-only rows made every audit assertion vacuous.
            rowObj.id = params[0];
            rowObj.period_id = params[1];
            rowObj.from_state = params[2];
            rowObj.to_state = params[3];
            rowObj.actor_id = params[4];
            rowObj.reason = params[5] ?? null;
            rowObj.approval_id = params[6] ?? null;
            rowObj.created_at = new Date().toISOString();
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
          // The GL period-lock query is
          //   WHERE is_closed = 1 AND ? BETWEEN start_date AND end_date
          // so the DATE RANGE must be honoured. Ignoring it made any single
          // closed period anywhere block posting to every other period, and
          // made "posting is allowed after reopen" impossible to assert.
          const postDate = lower.includes('between') ? params[0] : undefined;
          const found = rows.find((r: any) => {
            if (r === null) return false;
            if (!(Number(r.is_closed) === 1 || Number(r[7]) === 1)) return false;
            if (postDate === undefined) return true;
            const start = r.start_date ?? r[4];
            const end = r.end_date ?? r[5];
            if (start === undefined || end === undefined) return true;
            return String(postDate) >= String(start) && String(postDate) <= String(end);
          });
          return found || null;
        }
        const matchId = params[0];
        const found = rows.find((r: any) => r.id === matchId || r[0] === matchId);
        // A lookup BY ID that misses must return null, not "some other row".
        // Falling back to the last row made every not-found path untestable:
        // `GET /periods/no-such-id` answered 200 with an unrelated period.
        const looksUpById = /where[\s\S]*\bid\s*=\s*\?/i.test(this.sql);
        const result = found || (looksUpById ? null : (rows[rows.length - 1] ?? null));
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
          // An explicit id lookup that misses is a genuine "not found".
          if (/where[\s\S]*\bid\s*=\s*\?/i.test(this.sql)) return null;
        }
        return rows[rows.length - 1] || null;
      }
      return null;
    }
    all(...params: unknown[]): unknown[] {
      const lower = this.sql.trim().toLowerCase();
      const match = lower.match(/from\s+(\w+)/);
      if (!match) return [];
      const tableName = match[1]!;
      let rows = tables.get(tableName) || [];

      // Honour simple `WHERE <col> = ?` / `AND <col> = ?` equality filters.
      // Previously all() ignored WHERE entirely and returned the whole table,
      // which silently made scoped queries (and the assertions built on them)
      // meaningless — a period's audit trail returned EVERY period's rows.
      const eqFilters = [...this.sql.matchAll(/(?:where|and)\s+(\w+)\s*=\s*\?/gi)].map((m) =>
        m[1]!.toLowerCase()
      );
      if (eqFilters.length && params.length) {
        eqFilters.forEach((col, i) => {
          if (i >= params.length) return;
          const expected = params[i];
          rows = rows.filter((r: any) => {
            // Unknown columns are not filterable in the mock; do not silently
            // drop the row on a column we never recorded.
            if (!(col in r)) return true;
            return String(r[col]) === String(expected);
          });
        });
      }
      return rows;
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

// ---------------------------------------------------------------------------
// Schema guarantee (real DB only)
// ---------------------------------------------------------------------------
// Migrations must exist BEFORE any module-level prepared statement executes
// (e.g., `accountLockout.ts` prepares INSERT/UPDATE statements at import
// time). Previously migrations only ran at server start — after module
// evaluation — so a fresh real-SQLite database crashed at import with
// "no such table". Running the idempotent schema here, immediately after the
// real DB is created, closes that ordering gap for both the app and the test
// suites. The mock fallback needs no DDL.
if (!usingMockDb) {
  ensureSchema(db);
}

export { db };
