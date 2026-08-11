import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { ensureCanonicalAuditTrail, ensureServerColumns } from './migrate.js';
import type { SqliteDdl } from './schema.js';

/**
 * Regression tests for the real-SQLite schema reconciliation (E-007).
 *
 * These run against real better-sqlite3 `:memory:` databases so the legacy →
 * canonical audit_trail migration and the server-column additions are proven
 * against actual SQLite semantics (PRAGMA, ALTER TABLE, FK-free migration).
 */

const ddl = (db: Database.Database): SqliteDdl => db as unknown as SqliteDdl;

function tableColumns(db: Database.Database, table: string): string[] {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name);
}

describe('ensureCanonicalAuditTrail (real SQLite)', () => {
  it('rebuilds a legacy-shape audit_trail into the canonical server shape, preserving rows', () => {
    const db = new Database(':memory:');
    db.exec(`
      CREATE TABLE audit_trail (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT NOT NULL,
        field_name TEXT,
        old_value TEXT,
        new_value TEXT,
        reason TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO audit_trail (user_id, action, resource_type, resource_id, reason)
        VALUES ('u1', 'create', 'budget', 'b-1', 'legacy row');
    `);

    ensureCanonicalAuditTrail(ddl(db));

    const columns = tableColumns(db, 'audit_trail');
    expect(columns).toEqual(
      expect.arrayContaining([
        'id',
        'user_id',
        'action',
        'entity_type',
        'entity_id',
        'details',
        'created_at',
      ])
    );
    // Legacy shape is gone.
    expect(columns).not.toContain('resource_type');
    expect(columns).not.toContain('resource_id');
    expect(columns).not.toContain('timestamp');

    // Rows survived the rebuild with mapped columns.
    const row = db
      .prepare('SELECT action, entity_type, entity_id, details FROM audit_trail')
      .get() as Record<string, unknown>;
    expect(row.action).toBe('create');
    expect(row.entity_type).toBe('budget');
    expect(row.entity_id).toBe('b-1');
    expect(row.details).toBe('legacy row');
  });

  it('is a no-op on an already-canonical audit_trail', () => {
    const db = new Database(':memory:');
    db.exec(`
      CREATE TABLE audit_trail (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id TEXT,
        details TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
      INSERT INTO audit_trail (id, user_id, action, entity_type, entity_id)
        VALUES ('a1', 'u1', 'create', 'budget', 'b-1');
    `);

    ensureCanonicalAuditTrail(ddl(db));

    // Same shape, same row, no table rebuild.
    const columns = tableColumns(db, 'audit_trail');
    expect(columns).toContain('entity_type');
    expect(columns).not.toContain('resource_type');
    const row = db.prepare('SELECT entity_id FROM audit_trail').get() as { entity_id: string };
    expect(row.entity_id).toBe('b-1');
  });
});

describe('ensureServerColumns (real SQLite)', () => {
  it('adds the route-expected columns to base-schema tables', () => {
    const db = new Database(':memory:');
    db.exec(`
      CREATE TABLE budgets (id TEXT PRIMARY KEY, name TEXT NOT NULL);
      CREATE TABLE forecasts (id TEXT PRIMARY KEY);
      CREATE TABLE reports (id TEXT PRIMARY KEY);
      CREATE TABLE scenarios (id TEXT PRIMARY KEY);
      CREATE TABLE gl_entries (id TEXT PRIMARY KEY);
    `);

    ensureServerColumns(ddl(db));

    expect(tableColumns(db, 'budgets')).toEqual(
      expect.arrayContaining(['entity_id', 'deleted_at'])
    );
    expect(tableColumns(db, 'forecasts')).toContain('entity_id');
    expect(tableColumns(db, 'reports')).toContain('entity_id');
    expect(tableColumns(db, 'scenarios')).toEqual(
      expect.arrayContaining(['entity_id', 'budget_id'])
    );
    expect(tableColumns(db, 'gl_entries')).toContain('created_by');
  });

  it('is idempotent (re-running does not duplicate or fail)', () => {
    const db = new Database(':memory:');
    db.exec('CREATE TABLE budgets (id TEXT PRIMARY KEY)');

    ensureServerColumns(ddl(db));
    ensureServerColumns(ddl(db));

    const columns = tableColumns(db, 'budgets');
    expect(columns.filter((c) => c === 'entity_id')).toHaveLength(1);
    expect(columns.filter((c) => c === 'deleted_at')).toHaveLength(1);
  });

  it('is a no-op when the columns already exist', () => {
    const db = new Database(':memory:');
    db.exec('CREATE TABLE budgets (id TEXT PRIMARY KEY, entity_id TEXT, deleted_at TEXT)');

    ensureServerColumns(ddl(db));

    expect(tableColumns(db, 'budgets')).toEqual(['id', 'entity_id', 'deleted_at']);
  });

  it('skips tables that are absent without throwing (partial/legacy databases)', () => {
    const db = new Database(':memory:');
    // Only budgets exists; forecasts/reports/scenarios/gl_entries do not.
    db.exec('CREATE TABLE budgets (id TEXT PRIMARY KEY)');

    expect(() => ensureServerColumns(ddl(db))).not.toThrow();

    expect(tableColumns(db, 'budgets')).toContain('entity_id');
  });
});
