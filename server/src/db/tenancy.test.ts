import { beforeAll, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
// connection.js must be imported first: it owns the schema↔connection
// initialization order for this package (see ensureSchema call site).
import { db as sharedDb } from './connection.js';
import {
  DEFAULT_ENVIRONMENT_ID,
  DEFAULT_TENANT_ID,
  selectAllForTenant,
  TENANCY_EXEMPT_TABLES,
  TENANT_SCOPED_TABLES,
  TENANTS_TABLE,
  ensureTenancy,
  type TenantScopedTable,
} from './tenancy.js';
import { ensureSchema } from './schema.js';
import type { SqliteDdl } from './schema.js';

void sharedDb;

/**
 * W0.2 tenancy ratchet + cross-tenant leak suite.
 *
 * Runs against dedicated real-SQLite :memory: databases so the DDL under
 * test is exercised directly, independent of the shared test database.
 */

interface TestDb extends SqliteDdl {
  close(): void;
  pragma(source: string): unknown;
}

function createIsolationDb(): TestDb {
  const db = new Database(':memory:');
  // The isolation target is tenant scoping, not referential shape — fixtures
  // intentionally reference synthetic parents (better-sqlite3 enables FK
  // enforcement on open by default).
  db.pragma('foreign_keys = OFF');
  return db;
}

const requireModule = createRequire(import.meta.url);
const Database = requireModule('better-sqlite3') as new (path: string) => TestDb;

const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';

function listTables(db: SqliteDdl): string[] {
  const rows = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all() as { name: string }[];
  return rows.map((r) => r.name);
}

function columnsOf(db: SqliteDdl, table: string): string[] {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name);
}

describe('W0.2 tenancy schema', () => {
  let db: TestDb;

  beforeAll(() => {
    db = createIsolationDb();
    ensureSchema(db);
  });

  it('registers every table: none unregistered, none missing', () => {
    const known = new Set([
      ...TENANT_SCOPED_TABLES.map((t) => t.table),
      ...TENANCY_EXEMPT_TABLES,
      TENANTS_TABLE,
    ]);
    const actual = listTables(db);

    const unregistered = actual.filter((t) => !known.has(t));
    expect(
      unregistered,
      `tables added without a tenancy decision: ${unregistered.join(', ')}`
    ).toEqual([]);

    const absent = [...known].filter((t) => !actual.includes(t));
    expect(absent, `registered tables missing from the schema: ${absent.join(', ')}`).toEqual([]);
  });

  it('has tenant_id on every scoped table (and environment_id where governed)', () => {
    for (const { table, environmentScoped } of TENANT_SCOPED_TABLES) {
      const cols = columnsOf(db, table);
      expect(cols, `${table}.tenant_id missing`).toContain('tenant_id');
      if (environmentScoped) {
        expect(cols, `${table}.environment_id missing`).toContain('environment_id');
      }
    }
  });

  it('exempts exactly the global security telemetry tables', () => {
    expect([...TENANCY_EXEMPT_TABLES].sort()).toEqual(['audit_login_attempts', 'login_attempts']);
  });

  it('seeds the default tenant as active', () => {
    const row = db
      .prepare(`SELECT id, status FROM ${TENANTS_TABLE} WHERE id = ?`)
      .get(DEFAULT_TENANT_ID) as { id: string; status: string } | undefined;
    expect(row?.status).toBe('active');
  });

  it('is idempotent across repeated runs', () => {
    expect(() => {
      ensureTenancy(db);
      ensureTenancy(db);
    }).not.toThrow();
  });

  it('reconciles legacy databases: re-adds columns and backfills existing rows', () => {
    const legacy = new Database(':memory:');
    try {
      ensureSchema(legacy);

      legacy.exec('ALTER TABLE budgets DROP COLUMN tenant_id');
      legacy.exec('ALTER TABLE budgets DROP COLUMN environment_id');
      legacy
        .prepare(`INSERT INTO budgets (id, name, fiscal_year) VALUES ('legacy-1', 'Legacy', 2025)`)
        .run();

      ensureTenancy(legacy);

      const cols = columnsOf(legacy, 'budgets');
      expect(cols).toContain('tenant_id');
      expect(cols).toContain('environment_id');

      const row = legacy
        .prepare('SELECT tenant_id, environment_id FROM budgets WHERE id = ?')
        .get('legacy-1') as { tenant_id: string; environment_id: string };
      expect(row.tenant_id).toBe(DEFAULT_TENANT_ID);
      expect(row.environment_id).toBe(DEFAULT_ENVIRONMENT_ID);
    } finally {
      legacy.close();
    }
  });
});

/**
 * Minimal row fixtures satisfying each table's NOT NULL / CHECK constraints
 * ('#T#' is replaced with the tenant tag to keep UNIQUE columns distinct).
 * Foreign keys are OFF on this dedicated connection, so parent rows are not
 * required — the assertion target is tenant scoping, not referential shape.
 */
const FIXTURES: Record<string, Record<string, unknown>> = {
  entities: { name: 'E', code: '#T#' },
  departments: { name: 'D', code: '#T#' },
  accounts: { code: '#T#', name: 'A', type: 'Asset' },
  gl_entries: {
    account_id: 'acc-#T#',
    entity_id: 'ent-#T#',
    post_date: '2026-01-15',
    amount: 100,
  },
  budgets: { name: 'Budget', fiscal_year: 2026 },
  budget_line_items: { budget_id: 'b-#T#', account_id: 'ba-#T#' },
  audit_trail: { action: 'test' },
  kv_store: { value: 'v' },
  scenarios: { name: 'Scenario' },
  scenario_line_items: { scenario_id: 's-#T#', account_id: 'sa-#T#' },
  forecasts: { name: 'Forecast' },
  forecast_periods: { forecast_id: 'fp-#T#', period_id: 'per-#T#', period_name: 'P1' },
  forecast_line_items: { forecast_id: 'fl-#T#', account_id: 'fa-#T#', period_id: 'fpl-#T#' },
  reports: { name: 'Report' },
  report_templates: { name: 'Template', config: '{}', layout: '{}' },
  notifications: { user_id: 'u-#T#', title: 'T', message: 'M' },
  collaboration_comments: {
    resource_type: 'budget',
    resource_id: 'r-#T#',
    user_id: 'cu-#T#',
    content: 'c',
  },
  collaboration_tasks: { title: 'Task' },
  documents: {
    name: 'Doc',
    file_path: '/p/#T#',
    file_type: 'pdf',
    file_size: 1,
    uploaded_by: 'du-#T#',
  },
  esg_data: {
    metric_name: 'co2',
    metric_category: 'environmental',
    metric_type: 'scope1',
    value: 1,
    unit: 't',
    period: '2026-01',
  },
  custom_fields: { name: 'CF', field_type: 'text', resource_type: 'budget' },
  custom_field_values: { field_id: 'cf-#T#', resource_type: 'budget', resource_id: 'r2-#T#' },
  currency_rates: {
    base_currency: 'USD',
    target_currency: 'EUR',
    rate: 0.9,
    effective_date: '2026-01-01',
  },
  fiscal_periods: {
    year: 2026,
    period_number: 1,
    name: 'FP-#T#',
    start_date: '2026-01-01',
    end_date: '2026-01-31',
  },
  workflows: {
    name: 'Workflow',
    resource_type: 'budget',
    resource_id: 'w-#T#',
    total_steps: 1,
    initiated_by: 'wu-#T#',
  },
  workflow_steps: { workflow_id: 'ws-#T#', step_number: 1, step_name: 'S1' },
  user_preferences: { user_id: 'pu-#T#', preference_key: 'pk-#T#', preference_value: 'v' },
  recent_activity: { action: 'view', resource_type: 'budget', resource_id: 'ra-#T#' },
  stores: { value: 'v' },
  cube_cells: { cube: 'c', coords: '{}', measure: 'm', value: '0', data_type: 'input' },
  cube_dimensions: { type: 'user', hierarchies: '[]', attributes: '[]', members: '{}' },
  cube_cubes: { dimensions: '[]', measures: '[]', storage: 'sparse' },
  cube_history: { cell_id: 'cell-#T#', new_value: '1', data_type: 'input' },
  cube_snapshots: { name: 'Snap', cells: '{}' },
  cube_snapshot_diffs: { snapshot_a_id: 's1-#T#', snapshot_b_id: 's2-#T#', diff_data: '{}' },
  users: { email: 'u-#T#@tenancy.test', password_hash: 'h', first_name: 'F', last_name: 'L' },
  refresh_tokens: { user_id: 'rt-#T#', token: 'tok-#T#', expires_at: '2027-01-01' },
  user_entity_access: { user_id: 'uea-#T#', entity_id: 'e-#T#' },
  period_close_audit: {
    period_id: 'pcp-#T#',
    from_state: 'open',
    to_state: 'soft-close',
    actor_id: 'au-#T#',
  },
  audit_log: { category: 'system_event', action: 'test', checksum: 'ck-#T#' },
  audit_permission_changes: {
    changed_by_user_id: 'cb-#T#',
    target_user_id: 'tu-#T#',
    change_type: 'role_change',
  },
  audit_data_changes: {
    table_name: 'x',
    record_id: 'rec-#T#',
    field_name: 'f',
    change_type: 'insert',
  },
};

function primaryKeyOf(entry: TenantScopedTable): string {
  return entry.primaryKey;
}

function seedInto(db: SqliteDdl, entry: TenantScopedTable, tenant: string): void {
  const { table } = entry;
  const base: Record<string, unknown> = { ...(FIXTURES[table] ?? {}) };
  for (const [k, v] of Object.entries(base)) {
    if (typeof v === 'string') base[k] = v.replaceAll('#T#', tenant);
  }
  const row: Record<string, unknown> = {
    ...base,
    [primaryKeyOf(entry)]: `${table}-${tenant}`,
    tenant_id: tenant,
  };

  const cols = Object.keys(row);
  db.prepare(
    `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
  ).run(...cols.map((c) => row[c]));
}

describe('cross-tenant isolation (per-table)', () => {
  let db: TestDb;

  beforeAll(() => {
    db = createIsolationDb();
    ensureSchema(db);
    for (const entry of TENANT_SCOPED_TABLES) {
      seedInto(db, entry, TENANT_A);
      seedInto(db, entry, TENANT_B);
    }
  });

  it.each(TENANT_SCOPED_TABLES.map((t) => [t.table]))(
    '%s returns only the caller tenant rows',
    (table) => {
      const entry = TENANT_SCOPED_TABLES.find((t) => t.table === table)!;
      const pk = primaryKeyOf(entry);

      // Anti-vacuous guard: both seeds must actually be present unfiltered.
      const total = (
        db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number }
      ).count;
      expect(total, `seed failed for ${table} — isolation assertion would be vacuous`).toBe(2);

      const scopedRows = (tenant: string): string[] =>
        (selectAllForTenant(db, table, tenant) as Record<string, unknown>[]).map((r) =>
          String(r[pk])
        );

      expect(scopedRows(TENANT_A)).toEqual([`${table}-${TENANT_A}`]);
      expect(scopedRows(TENANT_B)).toEqual([`${table}-${TENANT_B}`]);
    }
  );
});
