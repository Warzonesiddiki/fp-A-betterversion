import type { SqliteDdl } from './schema.js';

/**
 * W0.2 — Tenancy foundation (Phase 0, BLUEPRINT M001).
 *
 * Every table that holds tenant data carries `tenant_id` from birth, and the
 * governed model/fact surfaces additionally carry `environment_id`
 * (Dev/UAT/Prod model promotion, BLUEPRINT 16.1 EN1–EN7).
 *
 * This module is the single source of truth for:
 *   - which tables are tenant-scoped (TENANT_SCOPED_TABLES),
 *   - which are deliberately exempt (TENANCY_EXEMPT_TABLES),
 *   - idempotent reconciliation that adds missing columns to existing
 *     databases and backfills them with DEFAULT_TENANT_ID.
 *
 * A ratchet test (`tenancy.test.ts`) fails the build when a table appears in
 * the schema without being registered here, so no future table can silently
 * skip tenancy. Route-level adoption scopes queries by `resolveTenantId`.
 */

export const DEFAULT_TENANT_ID = 'default';
export const DEFAULT_ENVIRONMENT_ID = 'dev';

/** Tables holding tenant data. `environmentScoped` tables also carry environment_id. */
export interface TenantScopedTable {
  readonly table: string;
  readonly primaryKey: string;
  readonly environmentScoped?: boolean;
}

export const TENANT_SCOPED_TABLES: readonly TenantScopedTable[] = [
  // -- src-tauri/migrations/001_initial_schema.sql --
  { table: 'entities', primaryKey: 'id' },
  { table: 'departments', primaryKey: 'id' },
  { table: 'accounts', primaryKey: 'id' },
  { table: 'gl_entries', primaryKey: 'id', environmentScoped: true },
  { table: 'budgets', primaryKey: 'id', environmentScoped: true },
  { table: 'budget_line_items', primaryKey: 'id', environmentScoped: true },
  { table: 'audit_trail', primaryKey: 'id' },
  { table: 'kv_store', primaryKey: 'key' },
  { table: 'scenarios', primaryKey: 'id', environmentScoped: true },
  { table: 'scenario_line_items', primaryKey: 'id', environmentScoped: true },
  { table: 'forecasts', primaryKey: 'id', environmentScoped: true },
  { table: 'forecast_periods', primaryKey: 'id', environmentScoped: true },
  { table: 'forecast_line_items', primaryKey: 'id', environmentScoped: true },
  { table: 'reports', primaryKey: 'id', environmentScoped: true },
  { table: 'report_templates', primaryKey: 'id' },
  { table: 'notifications', primaryKey: 'id' },
  { table: 'collaboration_comments', primaryKey: 'id' },
  { table: 'collaboration_tasks', primaryKey: 'id' },
  { table: 'documents', primaryKey: 'id' },
  { table: 'esg_data', primaryKey: 'id' },
  { table: 'custom_fields', primaryKey: 'id' },
  { table: 'custom_field_values', primaryKey: 'id' },
  { table: 'currency_rates', primaryKey: 'id' },
  { table: 'fiscal_periods', primaryKey: 'id' },
  { table: 'workflows', primaryKey: 'id' },
  { table: 'workflow_steps', primaryKey: 'id' },
  { table: 'user_preferences', primaryKey: 'id' },
  { table: 'recent_activity', primaryKey: 'id' },
  { table: 'stores', primaryKey: 'id' },
  // -- src-tauri/migrations/002_cube_schema.sql --
  { table: 'cube_cells', primaryKey: 'id', environmentScoped: true },
  { table: 'cube_dimensions', primaryKey: 'name' },
  { table: 'cube_cubes', primaryKey: 'name' },
  { table: 'cube_history', primaryKey: 'id', environmentScoped: true },
  { table: 'cube_snapshots', primaryKey: 'id', environmentScoped: true },
  { table: 'cube_snapshot_diffs', primaryKey: 'id', environmentScoped: true },
  // -- server in-code DDL --
  { table: 'users', primaryKey: 'id' },
  { table: 'refresh_tokens', primaryKey: 'id' },
  { table: 'user_entity_access', primaryKey: 'id' },
  { table: 'period_close_audit', primaryKey: 'id' },
  { table: 'audit_log', primaryKey: 'id' },
  { table: 'audit_permission_changes', primaryKey: 'id' },
  { table: 'audit_data_changes', primaryKey: 'id' },
];

/**
 * Deliberate exemptions — global security telemetry.
 * Lockout / brute-force detection MUST stay cross-tenant: an attacker cycling
 * tenant claims must not reset the failure counter per tenant.
 */
export const TENANCY_EXEMPT_TABLES: readonly string[] = ['login_attempts', 'audit_login_attempts'];

/** The tenant root itself is not tenant-scoped (its rows ARE tenants). */
export const TENANTS_TABLE = 'tenants';

/** High-volume fact/audit surfaces get an explicit tenant index. */
const TENANT_INDEX_TABLES: readonly string[] = [
  'gl_entries',
  'budget_line_items',
  'scenario_line_items',
  'forecast_line_items',
  'forecast_periods',
  'cube_cells',
  'cube_history',
  'audit_log',
  'audit_trail',
  'notifications',
];

function tableExists(db: SqliteDdl, table: string): boolean {
  const row = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = ?`)
    .get(table) as { name: string } | undefined;
  return row !== undefined;
}

function columnNames(db: SqliteDdl, table: string): Set<string> {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return new Set(cols.map((c) => c.name));
}

/**
 * Idempotent tenancy reconciliation.
 *
 * Fresh databases already carry the columns from their CREATE statements;
 * databases created before W0.2 are ALTERed in place and every existing row
 * is backfilled with DEFAULT_TENANT_ID / DEFAULT_ENVIRONMENT_ID (SQLite fills
 * NOT NULL DEFAULT on ADD COLUMN). Safe to run on every boot.
 */
export function ensureTenancy(db: SqliteDdl): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${TENANTS_TABLE} (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'suspended', 'closed')),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_tenants_slug ON ${TENANTS_TABLE}(slug);
  `);

  db.prepare(
    `INSERT OR IGNORE INTO ${TENANTS_TABLE} (id, name, slug, status)
     VALUES (?, ?, ?, 'active')`
  ).run(DEFAULT_TENANT_ID, 'Default Tenant', DEFAULT_TENANT_ID);

  for (const { table, environmentScoped } of TENANT_SCOPED_TABLES) {
    if (!tableExists(db, table)) continue;

    if (!columnNames(db, table).has('tenant_id')) {
      db.exec(
        `ALTER TABLE ${table} ADD COLUMN tenant_id TEXT NOT NULL DEFAULT '${DEFAULT_TENANT_ID}';`
      );
    }
    if (environmentScoped && !columnNames(db, table).has('environment_id')) {
      db.exec(
        `ALTER TABLE ${table} ADD COLUMN environment_id TEXT NOT NULL ` +
          `DEFAULT '${DEFAULT_ENVIRONMENT_ID}';`
      );
    }
  }

  for (const table of TENANT_INDEX_TABLES) {
    if (!tableExists(db, table)) continue;
    if (!columnNames(db, table).has('tenant_id')) continue;
    db.exec(`CREATE INDEX IF NOT EXISTS idx_${table}_tenant ON ${table}(tenant_id);`);
  }
}

/** Minimal identity shape the resolver needs (structural — no auth import). */
export interface TenantBearer {
  readonly tenantId?: string | null;
}

/**
 * Resolves the request's tenant from the authenticated principal.
 * Falls back to DEFAULT_TENANT_ID until tokens carry tenant claims
 * (single-tenant Phase 0 behaviour; never trusts a client-supplied value).
 */
export function resolveTenantId(user?: TenantBearer | null): string {
  return user?.tenantId ?? DEFAULT_TENANT_ID;
}

/** Sanctioned scoped accessor contract: only ever returns the caller's rows. */
export function selectAllForTenant(db: SqliteDdl, table: string, tenantId: string): unknown[] {
  return db.prepare(`SELECT * FROM ${table} WHERE tenant_id = ?`).all(tenantId);
}
