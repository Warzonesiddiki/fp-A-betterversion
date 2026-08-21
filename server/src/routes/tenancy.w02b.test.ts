import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import app from '../index.js';
import { JWT_SECRET } from '../config/env.js';
import { db } from '../db/connection.js';

/**
 * W0.2b route-level cross-tenant leak tests for the remaining governed
 * surfaces (budgets / scenarios / forecasts / reports / entities / periods).
 *
 * Same contract as gl.tenancy.test.ts: tenant identity comes only from the
 * JWT claim; writes are stamped with the caller's tenant and reads, updates
 * and deletes never touch another tenant's rows.
 */

const TENANT_A = 'tenant-w02b-a';
const TENANT_B = 'tenant-w02b-b';

const ENTITY_ID = '20000000-0000-0000-0000-00000000e002';
const ACCOUNT_ID = '10000000-0000-0000-0000-00000000a002';

function tokenFor(id: string, email: string, tenantId?: string): string {
  return jwt.sign({ id, email, role: 'Admin', ...(tenantId ? { tenantId } : {}) }, JWT_SECRET, {
    expiresIn: '15m',
  });
}

async function listIds(url: string, token: string): Promise<string[]> {
  const res = await request(app).get(url).set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(200);
  const body = res.body as { data?: { id: string }[] } | { id: string }[];
  const rows = Array.isArray(body) ? body : (body.data ?? []);
  return rows.map((r) => r.id);
}

describe('W0.2b tenancy enforcement across remaining routes', () => {
  let tokenA: string;
  let tokenB: string;

  beforeAll(() => {
    // Real-SQLite FK enforcement: audit_log.user_id references users.
    for (const [id, email] of [
      ['w02b-a', 'w02b-a@finplan.test'],
      ['w02b-b', 'w02b-b@finplan.test'],
    ]) {
      db.prepare(
        `INSERT OR REPLACE INTO users (id, email, password_hash, first_name, last_name, role, is_active)
         VALUES (?, ?, 'not-a-real-hash', 'Tenancy', 'Probe', 'Admin', 1)`
      ).run(id, email);
    }

    db.prepare(
      `INSERT OR REPLACE INTO entities (id, name, code, is_active)
       VALUES (?, 'W02b Probe Entity', 'W02B-ENT', 1)`
    ).run(ENTITY_ID);
    db.prepare(
      `INSERT OR REPLACE INTO accounts (id, name, code, type, is_active)
       VALUES (?, 'W02b Probe Account', 'W02B-ACC', 'Asset', 1)`
    ).run(ACCOUNT_ID);

    tokenA = tokenFor('w02b-a', 'w02b-a@finplan.test', TENANT_A);
    tokenB = tokenFor('w02b-b', 'w02b-b@finplan.test', TENANT_B);
  });

  it('issues login tokens carrying the tenantId claim', async () => {
    const email = 'w02b-claim@finplan.test';
    const hash = await bcrypt.hash('password123', 10);
    db.prepare(
      `INSERT OR REPLACE INTO users (id, email, password_hash, first_name, last_name, role, is_active, tenant_id)
       VALUES ('w02b-claim', ?, ?, 'Claim', 'Probe', 'Viewer', 1, ?)`
    ).run(email, hash, TENANT_A);

    const res = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
    expect(res.status).toBe(200);
    const decoded = jwt.verify((res.body as { accessToken: string }).accessToken, JWT_SECRET) as {
      tenantId?: string;
    };
    expect(decoded.tenantId).toBe(TENANT_A);
  });

  it('scopes budgets: writes stamped, lists and deletes tenant-isolated', async () => {
    const mkBudget = async (token: string, name: string): Promise<string> => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send({ name, fiscal_year: 2026, base_currency: 'USD' });
      expect(res.status).toBe(201);
      return (res.body as { id: string }).id;
    };

    const idA = await mkBudget(tokenA, 'Budget A');
    const idB = await mkBudget(tokenB, 'Budget B');

    const stamp = db.prepare('SELECT tenant_id FROM budgets WHERE id = ?').get(idA) as {
      tenant_id: string;
    };
    expect(stamp.tenant_id).toBe(TENANT_A);

    const idsA = await listIds('/api/budgets', tokenA);
    expect(idsA).toContain(idA);
    expect(idsA).not.toContain(idB);

    const getCross = await request(app)
      .get(`/api/budgets/${idB}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(getCross.status).toBe(404);

    const delCross = await request(app)
      .delete(`/api/budgets/${idB}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(delCross.status).toBe(404);

    const stillThere = db.prepare('SELECT id FROM budgets WHERE id = ?').get(idB) as
      | { id: string }
      | undefined;
    expect(stillThere?.id).toBe(idB);
  });

  it('scopes scenarios: cross-tenant read/update/delete are 404s', async () => {
    const mkScenario = async (token: string, name: string): Promise<string> => {
      const res = await request(app)
        .post('/api/scenarios')
        .set('Authorization', `Bearer ${token}`)
        .send({ name });
      expect(res.status).toBe(201);
      return (res.body as { id: string }).id;
    };

    const idA = await mkScenario(tokenA, 'Scenario A');
    const idB = await mkScenario(tokenB, 'Scenario B');

    const idsA = await listIds('/api/scenarios', tokenA);
    expect(idsA).toContain(idA);
    expect(idsA).not.toContain(idB);

    const updCross = await request(app)
      .put(`/api/scenarios/${idB}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'hijacked' });
    expect(updCross.status).toBe(404);

    const delCross = await request(app)
      .delete(`/api/scenarios/${idB}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(delCross.status).toBe(404);

    const stillThere = db.prepare('SELECT id FROM scenarios WHERE id = ?').get(idB) as
      | { id: string }
      | undefined;
    expect(stillThere?.id).toBe(idB);
  });

  it('scopes forecasts and forecast periods', async () => {
    const mkForecast = async (token: string, name: string): Promise<string> => {
      const res = await request(app)
        .post('/api/forecasts')
        .set('Authorization', `Bearer ${token}`)
        .send({ name, fiscal_year: 2026 });
      expect(res.status).toBe(201);
      return (res.body as { id: string }).id;
    };

    const idA = await mkForecast(tokenA, 'Forecast A');
    const idB = await mkForecast(tokenB, 'Forecast B');

    const idsA = await listIds('/api/forecasts', tokenA);
    expect(idsA).toContain(idA);
    expect(idsA).not.toContain(idB);

    // Tenant B can add a period to its own forecast...
    const addPeriod = await request(app)
      .post(`/api/forecasts/${idB}/periods`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ period_number: 1, start_date: '2026-01-01', end_date: '2026-01-31' });
    expect(addPeriod.status).toBe(201);
    const periodStamp = db
      .prepare('SELECT tenant_id FROM forecast_periods WHERE id = ?')
      .get((addPeriod.body as { id: string }).id) as { tenant_id: string };
    expect(periodStamp.tenant_id).toBe(TENANT_B);

    // ...but A cannot even see B's forecast to attach a period.
    const crossPeriod = await request(app)
      .post(`/api/forecasts/${idB}/periods`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ period_number: 2, start_date: '2026-02-01', end_date: '2026-02-28' });
    expect(crossPeriod.status).toBe(404);
  });

  it('scopes reports and report templates', async () => {
    const mkReport = async (token: string, name: string): Promise<string> => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${token}`)
        .send({ name, report_type: 'custom' });
      expect(res.status).toBe(201);
      return (res.body as { id: string }).id;
    };

    const idA = await mkReport(tokenA, 'Report A');
    const idB = await mkReport(tokenB, 'Report B');

    const stamp = db.prepare('SELECT tenant_id FROM reports WHERE id = ?').get(idA) as {
      tenant_id: string;
    };
    expect(stamp.tenant_id).toBe(TENANT_A);

    const idsA = await listIds('/api/reports', tokenA);
    expect(idsA).toContain(idA);
    expect(idsA).not.toContain(idB);

    const delCross = await request(app)
      .delete(`/api/reports/${idB}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(delCross.status).toBe(404);

    const stillThere = db.prepare('SELECT id FROM reports WHERE id = ?').get(idB) as
      | { id: string }
      | undefined;
    expect(stillThere?.id).toBe(idB);

    const tplRes = await request(app)
      .post('/api/reports/templates')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Tpl A', report_type: 'custom', template_config: {} });
    expect(tplRes.status).toBe(201);
    const tplStamp = db
      .prepare('SELECT tenant_id FROM report_templates WHERE id = ?')
      .get((tplRes.body as { id: string }).id) as { tenant_id: string };
    expect(tplStamp.tenant_id).toBe(TENANT_A);
  });

  it('scopes entity listing and creation', async () => {
    const resA = await request(app)
      .post('/api/entities')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Entity A', code: `ENTA-${Date.now()}` });
    expect(resA.status).toBe(201);
    const idA = (resA.body as { id: string }).id;
    const stamp = db.prepare('SELECT tenant_id FROM entities WHERE id = ?').get(idA) as {
      tenant_id: string;
    };
    expect(stamp.tenant_id).toBe(TENANT_A);

    const resB = await request(app)
      .post('/api/entities')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Entity B', code: `ENTB-${Date.now()}` });
    expect(resB.status).toBe(201);
    const idB = (resB.body as { id: string }).id;

    const idsA = await listIds('/api/entities', tokenA);
    expect(idsA).toContain(idA);
    expect(idsA).not.toContain(idB);

    const getCross = await request(app)
      .get(`/api/entities/${idB}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(getCross.status).toBe(404);
  });

  it('scopes fiscal periods and their close state machine', async () => {
    const mkPeriod = (tenant: string): string => {
      const id = `period-w02b-${tenant}`;
      db.prepare(
        `INSERT OR REPLACE INTO fiscal_periods (id, year, period_number, name, start_date, end_date, period_type, is_closed, close_state, tenant_id)
         VALUES (?, 2026, 1, '2026-01', '2026-01-01', '2026-01-31', 'Monthly', 0, 'open', ?)`
      ).run(id, tenant);
      return id;
    };
    const periodA = mkPeriod(TENANT_A);
    const periodB = mkPeriod(TENANT_B);

    const listA = (await request(app).get('/api/periods').set('Authorization', `Bearer ${tokenA}`))
      .body as { id: string }[];
    expect(listA.map((p) => p.id)).toContain(periodA);
    expect(listA.map((p) => p.id)).not.toContain(periodB);

    const stateCross = await request(app)
      .get(`/api/periods/${periodB}/state`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(stateCross.status).toBe(404);

    const transitionCross = await request(app)
      .post(`/api/periods/${periodB}/transition`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ targetState: 'soft-close', reason: 'tenant escape attempt' });
    expect(transitionCross.status).toBe(404);

    // Own-tenant transition still works and stamps the audit row.
    const transitionOwn = await request(app)
      .post(`/api/periods/${periodA}/transition`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ targetState: 'soft-close', reason: 'own-tenant close' });
    expect(transitionOwn.status).toBe(200);

    const auditRows = db
      .prepare('SELECT tenant_id FROM period_close_audit WHERE period_id = ?')
      .all(periodA) as { tenant_id: string }[];
    expect(auditRows.length).toBeGreaterThan(0);
    expect(new Set(auditRows.map((r) => r.tenant_id))).toEqual(new Set([TENANT_A]));
  });
});
