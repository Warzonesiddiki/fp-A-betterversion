import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import { JWT_SECRET } from '../config/env.js';
import { db } from '../db/connection.js';

/**
 * W0.2b-fixes regression tests for the adversarial-review findings:
 *  - MEDIUM: audit_trail rows carry the caller's tenant_id stamp.
 *  - LOW-1:  forecast line-item rejects a period_id that does not belong
 *            to the same forecast/tenant.
 *  - LOW-2:  PUT cannot mass-assign `status` past the workflow gates.
 */

const TENANT_A = 'tenant-w02fx-a';
const TENANT_B = 'tenant-w02fx-b';

function tokenFor(id: string, email: string, tenantId?: string): string {
  return jwt.sign({ id, email, role: 'Admin', ...(tenantId ? { tenantId } : {}) }, JWT_SECRET, {
    expiresIn: '15m',
  });
}

describe('W0.2b-fixes regression', () => {
  let tokenA: string;

  beforeAll(() => {
    for (const [id, email] of [
      ['w02fx-a', 'w02fx-a@finplan.test'],
      ['w02fx-b', 'w02fx-b@finplan.test'],
    ]) {
      db.prepare(
        `INSERT OR REPLACE INTO users (id, email, password_hash, first_name, last_name, role, is_active)
         VALUES (?, ?, 'not-a-real-hash', 'Fixes', 'Probe', 'Admin', 1)`
      ).run(id, email);
    }
    tokenA = tokenFor('w02fx-a', 'w02fx-a@finplan.test', TENANT_A);
  });

  it('MEDIUM: budget writes stamp audit_trail with the caller tenant', async () => {
    const res = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'FixStamp Budget', fiscal_year: 2026, base_currency: 'USD' });
    expect(res.status).toBe(201);
    const budgetId = (res.body as { id: string }).id;

    const stamp = db
      .prepare(
        `SELECT tenant_id FROM audit_trail WHERE action = 'CREATE' AND entity_type = 'budget' AND entity_id = ?`
      )
      .get(budgetId) as { tenant_id: string };
    expect(stamp.tenant_id).toBe(TENANT_A);
  });

  it('MEDIUM: scenario + report + entity writes also stamp their audit rows', async () => {
    const scn = await request(app)
      .post('/api/scenarios')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'FixStamp Scenario' });
    expect(scn.status).toBe(201);

    const rep = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'FixStamp Report', report_type: 'custom' });
    expect(rep.status).toBe(201);

    const ent = await request(app)
      .post('/api/entities')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'FixStamp Entity', code: `FIX-${Date.now()}` });
    expect(ent.status).toBe(201);

    for (const [actionType, entityId] of [
      ['scenario', (scn.body as { id: string }).id],
      ['report', (rep.body as { id: string }).id],
      ['entity', (ent.body as { id: string }).id],
    ] as const) {
      const stamp = db
        .prepare(
          `SELECT tenant_id FROM audit_trail WHERE action = 'CREATE' AND entity_type = ? AND entity_id = ?`
        )
        .get(actionType, entityId) as { tenant_id: string };
      expect(stamp.tenant_id).toBe(TENANT_A);
    }
  });

  it('LOW-1: forecast line-item rejects a period from another tenant/forecast', async () => {
    // Tenant B builds its own forecast+period.
    const tokenB = tokenFor('w02fx-b', 'w02fx-b@finplan.test', TENANT_B);
    const fcB = await request(app)
      .post('/api/forecasts')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Fx Forecast B', fiscal_year: 2026 });
    expect(fcB.status).toBe(201);
    const fcBId = (fcB.body as { id: string }).id;

    const perB = await request(app)
      .post(`/api/forecasts/${fcBId}/periods`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ period_number: 1, start_date: '2026-01-01', end_date: '2026-01-31' });
    expect(perB.status).toBe(201);
    const foreignPeriodId = (perB.body as { id: string }).id;

    // Tenant A creates its own forecast and tries to attach B's period.
    const fcA = await request(app)
      .post('/api/forecasts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Fx Forecast A', fiscal_year: 2026 });
    expect(fcA.status).toBe(201);
    const fcAId = (fcA.body as { id: string }).id;

    const cross = await request(app)
      .post(`/api/forecasts/${fcAId}/items`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        account_id: '10000000-0000-0000-0000-00000000a002',
        period_id: foreignPeriodId,
        amount: 5,
      });
    expect(cross.status).toBe(404);

    // Dangling period id is equally rejected.
    const dangling = await request(app)
      .post(`/api/forecasts/${fcAId}/items`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        account_id: '10000000-0000-0000-0000-00000000a002',
        period_id: '00000000-0000-0000-0000-000000000000',
        amount: 5,
      });
    expect(dangling.status).toBe(404);
  });

  it('LOW-2: PUT cannot mass-assign status on budgets/scenarios/reports', async () => {
    const mk = async (
      url: string,
      body: Record<string, unknown>,
      token = tokenA
    ): Promise<string> => {
      const res = await request(app).post(url).set('Authorization', `Bearer ${token}`).send(body);
      expect(res.status).toBe(201);
      return (res.body as { id: string }).id;
    };

    const budgetId = await mk('/api/budgets', {
      name: 'Gate Budget',
      fiscal_year: 2026,
      base_currency: 'USD',
    });
    const scenarioId = await mk('/api/scenarios', { name: 'Gate Scenario' });
    const reportId = await mk('/api/reports', { name: 'Gate Report', report_type: 'custom' });

    const attempts: [string, Record<string, unknown>][] = [
      [`/api/budgets/${budgetId}`, { status: 'Approved' }],
      [`/api/scenarios/${scenarioId}`, { status: 'active' }],
      [`/api/reports/${reportId}`, { status: 'Published' }],
    ];
    for (const [url, body] of attempts) {
      const res = await request(app).put(url).set('Authorization', `Bearer ${tokenA}`).send(body);
      expect(res.status).toBe(400);
    }

    // The gated state was not applied.
    const budgetRow = db.prepare('SELECT status FROM budgets WHERE id = ?').get(budgetId) as {
      status: string;
    };
    expect(budgetRow.status).toBe('Draft');

    // Non-status updates still work.
    const okPut = await request(app)
      .put(`/api/budgets/${budgetId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Renamed Budget' });
    expect(okPut.status).toBe(200);
  });
});
