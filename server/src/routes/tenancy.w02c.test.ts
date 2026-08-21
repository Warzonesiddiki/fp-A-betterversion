import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import { JWT_SECRET } from '../config/env.js';
import { db } from '../db/connection.js';

/**
 * W0.2c route-level cross-tenant leak tests for the remaining surfaces
 * surfaced by the proactive sweep: export (PDF report DB-fetch paths) and
 * audit_trail stamping on export/command writes.
 *
 * commands.ts is in-memory-registry only (entity-scoped by JWT identity,
 * no tenant-bearing tables) and audit.ts delegates every query to the
 * shared AuditService — both are inventoried in the W0.2c report rather
 * than patched here.
 */

const TENANT_A = 'tenant-w02c-a';
const TENANT_B = 'tenant-w02c-b';

const ACCOUNT_ID = '10000000-0000-0000-0000-00000000a003';
const ENTITY_ID = '20000000-0000-0000-0000-00000000e003';

function tokenFor(id: string, email: string, tenantId?: string): string {
  return jwt.sign({ id, email, role: 'Admin', ...(tenantId ? { tenantId } : {}) }, JWT_SECRET, {
    expiresIn: '15m',
  });
}

describe('W0.2c tenancy enforcement on export routes', () => {
  let tokenA: string;
  let tokenB: string;

  beforeAll(() => {
    for (const [id, email] of [
      ['w02c-a', 'w02c-a@finplan.test'],
      ['w02c-b', 'w02c-b@finplan.test'],
    ]) {
      db.prepare(
        `INSERT OR REPLACE INTO users (id, email, password_hash, first_name, last_name, role, is_active)
         VALUES (?, ?, 'not-a-real-hash', 'Tenancy', 'Sweep', 'Admin', 1)`
      ).run(id, email);
    }

    db.prepare(
      `INSERT OR REPLACE INTO entities (id, name, code, is_active)
       VALUES (?, 'W02c Probe Entity', 'W02C-ENT', 1)`
    ).run(ENTITY_ID);
    db.prepare(
      `INSERT OR REPLACE INTO accounts (id, name, code, type, is_active)
       VALUES (?, 'W02c Probe Account', 'W02C-ACC', 'Asset', 1)`
    ).run(ACCOUNT_ID);

    tokenA = tokenFor('w02c-a', 'w02c-a@finplan.test', TENANT_A);
    tokenB = tokenFor('w02c-b', 'w02c-b@finplan.test', TENANT_B);

    // Seed one GL posting per tenant on the SAME account so an unscoped
    // aggregate would leak both tenants' amounts into either export.
    for (const [tenant, amount] of [
      [TENANT_A, 100],
      [TENANT_B, 700],
    ] as const) {
      db.prepare(
        `INSERT OR REPLACE INTO gl_entries (id, tenant_id, account_id, entity_id, post_date, amount, debit, credit)
         VALUES (?, ?, ?, ?, '2026-03-01', ?, ?, 0)`
      ).run(`gl-w02c-${tenant}`, tenant, ACCOUNT_ID, ENTITY_ID, amount, amount);
    }

    db.prepare(
      `INSERT OR REPLACE INTO budgets (id, tenant_id, name, fiscal_year, base_currency, status)
       VALUES ('budget-w02c-b', ?, 'Budget B Secret', 2026, 'USD', 'Draft')`
    ).run(TENANT_B);
    db.prepare(
      `INSERT OR REPLACE INTO budget_line_items (id, tenant_id, budget_id, account_id, month, amount)
       VALUES ('bli-w02c-b', ?, 'budget-w02c-b', ?, 1, 999)`
    ).run(TENANT_B, ACCOUNT_ID);
  });

  it('trial-balance PDF export only aggregates the caller tenant postings', async () => {
    const res = await request(app)
      .post('/api/export/pdf')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ report_type: 'trial_balance' });
    expect(res.status).toBe(200);

    const html = String(res.text);
    const rowMatch = html.match(/W02c Probe Account[\s\S]*?<\/tr>/);
    expect(rowMatch).not.toBeNull();
    const row = rowMatch![0];
    // roundAmount emits plain integers (100), not fixed decimals.
    expect(row).toContain('>100<');
    expect(row).not.toContain('>700<');
    expect(row).not.toContain('>800<');

    const stamp = db
      .prepare(
        `SELECT tenant_id FROM audit_trail WHERE action = 'EXPORT_PDF' ORDER BY created_at DESC`
      )
      .get() as { tenant_id: string };
    expect(stamp.tenant_id).toBe(TENANT_A);
  });

  it('budget-vs-actual PDF export hides other tenants budgets entirely', async () => {
    const res = await request(app)
      .post('/api/export/pdf')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ report_type: 'budget_vs_actual', fiscal_year: 2026 });
    expect(res.status).toBe(200);

    const html = String(res.text);
    expect(html).not.toContain('Budget B Secret');
    expect(html).not.toContain('999');
  });

  it('csv/excel exports stamp audit_trail with the caller tenant', async () => {
    await request(app)
      .post('/api/export/csv')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ data: [{ a: 1 }] });

    const stamp = db
      .prepare(
        `SELECT tenant_id FROM audit_trail WHERE action = 'EXPORT_CSV' ORDER BY created_at DESC`
      )
      .get() as { tenant_id: string };
    expect(stamp.tenant_id).toBe(TENANT_B);
  });
});
