import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createAuthTables,
  createPeriodCloseStateTable,
  ensureCanonicalAuditTrail,
  ensureServerColumns,
} from './migrate.js';
import { ensureTenancy } from './tenancy.js';
import { createAuditTables } from './auditSchema.js';
import { ensureEntityAccessTable } from '../middleware/entityAuth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../src-tauri/migrations');

/** Minimal structural shape of the database required by DDL helpers. */
export interface SqliteDdl {
  exec(sql: string): void;
  prepare(sql: string): {
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown;
    run(...params: unknown[]): unknown;
  };
}

function runSqlFile(db: SqliteDdl, filePath: string): void {
  const sql = fs.readFileSync(filePath, 'utf-8');
  db.exec(sql);
}

/**
 * Idempotent full-schema guarantee for the real database.
 *
 * Called by `connection.ts` immediately after the real SQLite database is
 * created — BEFORE any module-level prepared statement executes (e.g.,
 * `accountLockout.ts` prepares INSERT/UPDATE statements at import time).
 * Previously migrations only ran at server start (after module evaluation),
 * so a fresh real-SQLite database crashed at import with "no such table".
 *
 * Every DDL helper takes the database as a parameter (they never read the
 * `connection.ts` namespace at module scope), so this module can be imported
 * from `connection.ts` without mid-evaluation binding hazards.
 */
export function ensureSchema(db: SqliteDdl): void {
  for (const file of ['001_initial_schema.sql', '002_cube_schema.sql']) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    if (fs.existsSync(filePath)) {
      runSqlFile(db, filePath);
    }
  }
  createAuthTables(db);
  ensureEntityAccessTable(db);
  createAuditTables(db);
  createPeriodCloseStateTable(db);
  ensureCanonicalAuditTrail(db);
  ensureServerColumns(db);
  ensureTenancy(db);
}
