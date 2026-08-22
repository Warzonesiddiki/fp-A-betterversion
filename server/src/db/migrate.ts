import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './connection.js';
import { ensureEntityAccessTable } from '../middleware/entityAuth.js';
import { createAuditTables } from './auditSchema.js';
import { ensureTenancy } from './tenancy.js';
import type { SqliteDdl } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../src-tauri/migrations');

function runSqlFile(filePath: string): void {
  const sql = fs.readFileSync(filePath, 'utf-8');
  db.exec(sql);
}

/**
 * F-0004: Period close state machine.
 *
 * Creates the period_close_state table and adds a close_state column to
 * fiscal_periods if it doesn't exist. Existing is_closed=1 rows are migrated
 * to close_state='hard-close'; is_closed=0 rows become 'open'.
 */
export function createPeriodCloseStateTable(db: SqliteDdl): void {
  // Create period close audit events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS period_close_audit (
      id TEXT PRIMARY KEY,
      period_id TEXT NOT NULL,
      from_state TEXT NOT NULL,
      to_state TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      reason TEXT,
      approval_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (period_id) REFERENCES fiscal_periods(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_period_close_audit_period
      ON period_close_audit(period_id);
    CREATE INDEX IF NOT EXISTS idx_period_close_audit_actor
      ON period_close_audit(actor_id);
  `);

  // Add close_state column to fiscal_periods if it doesn't exist
  const columns = db.prepare('PRAGMA table_info(fiscal_periods)').all() as { name: string }[];
  const hasCloseState = columns.some((c) => c.name === 'close_state');

  if (!hasCloseState) {
    db.exec(`
      ALTER TABLE fiscal_periods ADD COLUMN close_state TEXT NOT NULL DEFAULT 'open'
        CHECK (close_state IN ('open', 'soft-close', 'hard-close', 'locked'));
    `);

    // Migrate existing is_closed values to close_state
    db.exec(`
      UPDATE fiscal_periods SET close_state = 'hard-close' WHERE is_closed = 1;
      UPDATE fiscal_periods SET close_state = 'open' WHERE is_closed = 0 OR is_closed IS NULL;
    `);

    console.log('[migrate] Migrated fiscal_periods.is_closed → close_state');
  }
}

export function createAuthTables(db: SqliteDdl): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL DEFAULT 'default',
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Viewer',
      entity_id TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_entity ON users(entity_id);

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL DEFAULT 'default',
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

    CREATE TABLE IF NOT EXISTS login_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      ip_address TEXT,
      success INTEGER NOT NULL DEFAULT 0,
      attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email, attempted_at);
  `);
}

/**
 * Reconciles `audit_trail` to the canonical shape used by every server route:
 *   (id TEXT PK, action, entity_type, entity_id, user_id, details, created_at)
 *
 * The original Tauri-era shape was (resource_type, resource_id, field_name,
 * old_value, new_value, reason, timestamp). Because SQLite `CREATE TABLE IF
 * NOT EXISTS` never alters an existing table, databases created before this
 * change keep the legacy shape and every server audit insert fails with
 * "no such column: entity_type". This migration detects the legacy shape via
 * PRAGMA and rebuilds the table, preserving rows where they map.
 */
export function ensureCanonicalAuditTrail(db: SqliteDdl): void {
  const columns = db.prepare('PRAGMA table_info(audit_trail)').all() as { name: string }[];
  if (columns.length === 0) {
    // Table absent — the SQL migration files create the canonical shape.
    return;
  }
  const names = columns.map((c) => c.name);
  if (names.includes('entity_type')) {
    // Already canonical.
    return;
  }

  db.exec(`
    ALTER TABLE audit_trail RENAME TO audit_trail_legacy;
    CREATE TABLE audit_trail (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL DEFAULT 'default',
      user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    INSERT INTO audit_trail (id, user_id, action, entity_type, entity_id, details, created_at)
      SELECT CAST(id AS TEXT), user_id, action, resource_type, resource_id, reason, timestamp
      FROM audit_trail_legacy;
    DROP TABLE audit_trail_legacy;
  `);
  console.log('[migrate] Rebuilt audit_trail to canonical server shape');
}

/**
 * Server columns expected by the route layer but missing from the Tauri-era
 * base schema (CREATE TABLE IF NOT EXISTS never alters existing tables).
 * Added idempotently via ALTER TABLE for existing databases; fresh
 * installations get them directly from 001_initial_schema.sql.
 *
 * NOTE: the list lives inside the function on purpose — module-level consts
 * in cycle members hit a vite-node SSR temporal-dead-zone bug during test
 * module evaluation.
 */
export function ensureServerColumns(db: SqliteDdl): void {
  const serverColumns: ReadonlyArray<readonly [string, string, string]> = [
    ['budgets', 'entity_id', 'TEXT'],
    ['budgets', 'deleted_at', 'TEXT'],
    ['forecasts', 'entity_id', 'TEXT'],
    // W0.2b: route/schema drift surfaced by the new tenancy leak tests —
    // these routes were already broken against real SQLite (INSERTs named
    // columns absent from 001_initial_schema.sql). Additive-only alignment;
    // the .sql files remain the table-creation authority.
    ['forecasts', 'budget_id', 'TEXT'],
    ['forecasts', 'method', 'TEXT'],
    ['reports', 'entity_id', 'TEXT'],
    // SEC-2: rotation keeps old refresh-token rows (revoked) instead of
    // deleting them, so a replayed token can be detected and all of the
    // user's sessions revoked. NULL = active; timestamp = revoked.
    ['refresh_tokens', 'revoked_at', 'TEXT'],
    ['reports', 'fiscal_year', 'INTEGER'],
    ['reports', 'period', 'TEXT'],
    ['report_templates', 'report_type', 'TEXT'],
    ['report_templates', 'template_config', 'TEXT'],
    ['report_templates', 'is_default', 'INTEGER'],
    ['entities', 'type', 'TEXT'],
    ['entities', 'base_currency', 'TEXT'],
    ['entities', 'fiscal_year_start', 'INTEGER'],
    ['entities', 'description', 'TEXT'],
    ['departments', 'entity_id', 'TEXT'],
    ['departments', 'parent_id', 'TEXT'],
    ['departments', 'manager_id', 'TEXT'],
    ['departments', 'description', 'TEXT'],
    // W0.2c (lane S10): the /gl/accounts routes write accounts.description
    // (CreateAccountSchema) but 001_initial_schema.sql never had that column,
    // so every POST/PUT carrying a description failed with SQLITE_ERROR.
    // Same additive route/schema-drift alignment as the W0.2b entries above;
    // the .sql files remain the table-creation authority.
    ['accounts', 'description', 'TEXT'],
    ['scenarios', 'entity_id', 'TEXT'],
    ['scenarios', 'budget_id', 'TEXT'],
    ['scenarios', 'type', 'TEXT'],
    ['scenario_line_items', 'base_amount', 'REAL'],
    ['scenario_line_items', 'adjusted_amount', 'REAL'],
    ['scenario_line_items', 'department_id', 'TEXT'],
    // W0.2c (lane S9): scenarios.apply and the budgets/forecasts line-item
    // writers name budget_line_items / forecast_line_items.department_id,
    // which 001_initial_schema.sql never carried — every such INSERT failed
    // against real SQLite ("no column named department_id"). Same additive
    // route/schema-drift alignment as the entries above; no index or
    // constraint changes, the .sql files remain the table-creation authority.
    ['budget_line_items', 'department_id', 'TEXT'],
    ['forecast_line_items', 'department_id', 'TEXT'],
    ['forecast_periods', 'period_number', 'INTEGER'],
    ['forecast_periods', 'start_date', 'TEXT'],
    ['forecast_periods', 'end_date', 'TEXT'],
    ['forecast_periods', 'label', 'TEXT'],
    ['gl_entries', 'created_by', 'TEXT'],
    // W0.8.6 server-authoritative commit protocol (K25/K27). Legacy
    // databases gain these via ALTER; pre-existing rows read version=1 and
    // deleted_at=NULL, which are exactly the alive-and-v1 semantics.
    ['gl_entries', 'journal_id', 'TEXT'],
    ['gl_entries', 'idempotency_key', 'TEXT'],
    ['gl_entries', 'idempotency_hash', 'TEXT'],
    ['gl_entries', 'version', 'INTEGER NOT NULL DEFAULT 1'],
    ['gl_entries', 'deleted_at', 'TEXT'],
  ];
  for (const [table, column, type] of serverColumns) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (columns.length === 0) {
      // Table absent (partial/legacy database). 001_initial_schema.sql is the
      // table-creation authority; reconciliation only aligns columns on
      // tables that actually exist.
      console.warn(`[migrate] Skipping ${table}.${column}: table not present`);
      continue;
    }
    if (!columns.some((c) => c.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
      console.log(`[migrate] Added ${table}.${column} ${type}`);
    }
  }
}

/**
 * W0.3-fix (MEDIUM): the three-statement gate aggregates gl_entries by
 * (tenant_id, entity_id) on EVERY write path. Without a covering composite
 * index each gate evaluation is a full-table scan, degrading linearly with
 * ledger size. Idempotent; safe for fresh and legacy databases alike.
 */
export function ensureGateIndexes(db: SqliteDdl): void {
  const columns = db.prepare('PRAGMA table_info(gl_entries)').all() as { name: string }[];
  if (columns.length === 0) {
    console.warn('[migrate] Skipping gl_entries composite index: table not present');
    return;
  }
  db.exec(
    'CREATE INDEX IF NOT EXISTS idx_gl_entries_tenant_entity ON gl_entries(tenant_id, entity_id)'
  );
  // W0.8.6: mirror of idx_gl_entries_tenant_idem in 001_initial_schema.sql
  // for legacy databases created before the column existed. Idempotent.
  // Batch-scoped claim uniqueness lives in the route transaction (see the
  // .sql header note for the Postgres S2 form).
  db.exec(
    'CREATE INDEX IF NOT EXISTS idx_gl_entries_tenant_idem ON gl_entries(tenant_id, idempotency_key)'
  );
}

export function runMigrations(): void {
  console.log('[migrate] Running database migrations...');

  // Run existing Tauri migration files if they exist
  const migrationFiles = ['001_initial_schema.sql', '002_cube_schema.sql'];

  for (const file of migrationFiles) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    if (fs.existsSync(filePath)) {
      console.log(`[migrate] Applying ${file}...`);
      runSqlFile(filePath);
    } else {
      console.warn(`[migrate] Migration file not found: ${file} (skipping)`);
    }
  }

  // Reconcile audit_trail to the canonical server-route shape.
  ensureCanonicalAuditTrail(db);

  // Add server-route columns missing from the base schema.
  ensureServerColumns(db);

  // W0.3-fix: gate-supporting indexes (idempotent).
  console.log('[migrate] Ensuring three-statement gate indexes...');
  ensureGateIndexes(db);

  // Create auth-specific tables
  console.log('[migrate] Creating auth tables...');
  createAuthTables(db);

  // Create entity access control table and seed existing relationships
  console.log('[migrate] Creating entity access tables...');
  ensureEntityAccessTable(db);

  // Create audit logging tables
  console.log('[migrate] Creating audit tables...');
  createAuditTables(db);

  // F-0004: Period close state machine — add close_state column
  // Migration: is_closed (boolean) → close_state (enum: open/soft-close/hard-close/locked)
  console.log('[migrate] Applying period close state machine migration...');
  createPeriodCloseStateTable(db);

  // W0.2: tenancy reconciliation — tenants table + tenant_id/environment_id
  console.log('[migrate] Applying tenancy reconciliation...');
  ensureTenancy(db);

  console.log('[migrate] All migrations complete.');
}
