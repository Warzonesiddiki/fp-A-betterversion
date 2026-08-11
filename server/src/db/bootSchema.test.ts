import { describe, expect, it } from 'vitest';
import { db } from './connection.js';

describe('real SQLite boot schema (fresh DB via vitest.setup)', () => {
  it('has every table the route layer depends on', () => {
    const required = [
      'users',
      'refresh_tokens',
      'login_attempts',
      'user_entity_access',
      'audit_log',
      'audit_trail',
      'entities',
      'accounts',
      'gl_entries',
      'budgets',
      'budget_line_items',
      'forecasts',
      'forecast_line_items',
      'scenarios',
      'reports',
      'fiscal_periods',
      'period_close_audit',
    ];
    const rows = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as {
      name: string;
    }[];
    const names = new Set(rows.map((r) => r.name));
    for (const t of required) {
      expect(names.has(t), `missing table ${t}`).toBe(true);
    }
  });

  it('has the canonical audit_trail shape', () => {
    const cols = db.prepare('PRAGMA table_info(audit_trail)').all() as { name: string }[];
    const names = cols.map((c) => c.name);
    expect(names).toContain('entity_type');
    expect(names).toContain('entity_id');
    expect(names).toContain('details');
    expect(names).not.toContain('resource_type');
  });

  it('has the server-route columns', () => {
    const cols = (t: string) =>
      (db.prepare(`PRAGMA table_info(${t})`).all() as { name: string }[]).map((c) => c.name);
    expect(cols('budgets')).toEqual(expect.arrayContaining(['entity_id', 'deleted_at']));
    expect(cols('forecasts')).toContain('entity_id');
    expect(cols('reports')).toContain('entity_id');
    expect(cols('scenarios')).toEqual(expect.arrayContaining(['entity_id', 'budget_id']));
    expect(cols('gl_entries')).toContain('created_by');
  });
});
