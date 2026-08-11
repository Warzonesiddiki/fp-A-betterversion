import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './connection.js';
import { ensureEntityAccessTable } from '../middleware/entityAuth.js';
import { createAuditTables } from './auditSchema.js';
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
    ['reports', 'entity_id', 'TEXT'],
    ['scenarios', 'entity_id', 'TEXT'],
    ['scenarios', 'budget_id', 'TEXT'],
    ['gl_entries', 'created_by', 'TEXT'],
  ];
  for (const [table, column, type] of serverColumns) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!columns.some((c) => c.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
      console.log(`[migrate] Added ${table}.${column} ${type}`);
    }
  }
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

  console.log('[migrate] All migrations complete.');
}
