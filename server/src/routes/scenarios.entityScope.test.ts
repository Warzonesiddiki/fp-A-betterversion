import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import { JWT_SECRET } from '../config/env.js';
import { db } from '../db/connection.js';

/**
 * W0.2c-hardening (lane S9) — scenario authorization edges.
 *
 * Defects covered (per the W0.2c audit):
 *   1. Entity-crossing on apply/read: a caller scoped to entity X could read
 *      or apply a scenario whose base/target belongs to entity Y they cannot
 *      access. Every scenario route now resolves entity scope from the
 *      authenticated context and rejects cross-entity payloads with
 *      403 / FP-0201 ("cross-tenant entity scope denied", stable registry
 *      code from server/src/types/errorCodes.ts).
 *   2. Allow-through: sub-resource routes let requests pass when the entity
 *      context was absent (NULL entity_id) or when the entity filter was
 *      missing entirely. Scenario surfaces now fail closed; Global Admin
 *      remains explicitly global-by-design.
 *
 * K25/K27 untouched: these gates sit strictly BEFORE the existing
 * server-authoritative writes — no monetary semantics are altered.
 */

const ENT_X = '20000000-0000-0000-0000-00000000e101';
const ENT_Y = '20000000-0000-0000-0000-00000000e102';
const ACCOUNT_ID = '10000000-0000-0000-0000-00000000a101';

const SCENARIO_X = '50000000-0000-0000-0000-000000005101';
const SCENARIO_Y = '50000000-0000-0000-0000-000000005102';
const SCENARIO_NULL = '50000000-0000-0000-0000-000000005103';

const BUDGET_X = '30000000-0000-0000-0000-00000000b101';
const BUDGET_Y = '30000000-0000-0000-0000-00000000b102';

const FORECAST_X = '40000000-0000-0000-0000-00000000f101';
const FORECAST_Y = '40000000-0000-0000-0000-00000000f102';
const PERIOD_X_1 = '45000000-0000-0000-0000-00000000p101';

function tokenFor(id: string, email: string, role: string): string {
  return jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '15m' });
}

/**
 * Asserts a 403 carrying the stable registry code FP-0201 from EITHER emitter
 * shape: route-level handlers nest it as `error.code` (AppError.toPayload),
 * while the shared entityAuth middleware exposes it additively at top level
 * (`code`) alongside its legacy fields.
 */
function expectForbidden(res: { status: number; body: unknown }, what: string): void {
  expect(res.status, `${what} must be 403`).toBe(403);
  const body = res.body as { error?: { code?: string }; code?: string };
  const typedCode = body.error?.code ?? body.code;
  expect(typedCode, `${what} must carry typed code FP-0201`).toBe('FP-0201');
}

interface ScenarioRow {
  id: string;
  entity_id: string | null;
}

describe('W0.2c-hardening: scenario authorization edges', () => {
  let adminToken: string;
  let analystXToken: string;
  let analystYToken: string;
  let noScopeToken: string;

  beforeAll(() => {
    // Actors. analyst-X/analyst-Y mirror a real multi-entity deployment:
    // users.entity_id plus an explicit user_entity_access grant each.
    db.prepare(
      `INSERT OR REPLACE INTO entities (id, name, code, is_active)
       VALUES (?, 'S9 Entity X', 'S9-ENT-X', 1)`
    ).run(ENT_X);
    db.prepare(
      `INSERT OR REPLACE INTO entities (id, name, code, is_active)
       VALUES (?, 'S9 Entity Y', 'S9-ENT-Y', 1)`
    ).run(ENT_Y);
    const users: [string, string, string, string | null][] = [
      ['u-sc9-admin', 'u-sc9-admin@finplan.test', 'Admin', null],
      ['u-sc9-x', 'u-sc9-x@finplan.test', 'Analyst', ENT_X],
      ['u-sc9-y', 'u-sc9-y@finplan.test', 'Analyst', ENT_Y],
      ['u-sc9-none', 'u-sc9-none@finplan.test', 'Analyst', null],
    ];
    for (const [id, email, role, entityId] of users) {
      db.prepare(
        `INSERT OR REPLACE INTO users (id, email, password_hash, first_name, last_name, role, entity_id, is_active)
         VALUES (?, ?, 'not-a-real-hash', 'S9', 'ScenarioScope', ?, ?, 1)`
      ).run(id, email, role, entityId);
    }
    db.prepare(
      `INSERT OR REPLACE INTO user_entity_access (id, user_id, entity_id, role)
       VALUES ('uea-sc9-x', 'u-sc9-x', ?, 'analyst')`
    ).run(ENT_X);
    db.prepare(
      `INSERT OR REPLACE INTO user_entity_access (id, user_id, entity_id, role)
       VALUES ('uea-sc9-y', 'u-sc9-y', ?, 'analyst')`
    ).run(ENT_Y);

    db.prepare(
      `INSERT OR REPLACE INTO accounts (id, name, code, type, is_active)
       VALUES (?, 'S9 Probe Account', 'S9-ACC', 'Asset', 1)`
    ).run(ACCOUNT_ID);

    // Scenarios across three entity contexts (same tenant — the ENTITY layer
    // is what this lane exercises; cross-TENANT is covered by W0.2/W0.2b).
    for (const [id, name, entityId] of [
      [SCENARIO_X, 'S9 Scenario X', ENT_X],
      [SCENARIO_Y, 'S9 Scenario Y', ENT_Y],
      [SCENARIO_NULL, 'S9 Scenario NullScope', null],
    ] as const) {
      db.prepare(
        `INSERT OR REPLACE INTO scenarios (id, tenant_id, name, type, status, entity_id)
         VALUES (?, 'default', ?, 'custom', 'draft', ?)`
      ).run(id, name, entityId);
    }

    // One line item per probed scenario so the apply route reaches its scope
    // checks past the "no line items" guard.
    for (const [id, scenarioId, month, adjusted] of [
      ['sli-sc9-x-1', SCENARIO_X, 1, 150],
      ['sli-sc9-y-1', SCENARIO_Y, 1, 250],
      ['sli-sc9-n-2', SCENARIO_NULL, 2, 75],
    ] as const) {
      db.prepare(
        `INSERT OR REPLACE INTO scenario_line_items
           (id, tenant_id, scenario_id, account_id, month, base_amount, adjusted_amount)
         VALUES (?, 'default', ?, ?, ?, 100, ?)`
      ).run(id, scenarioId, ACCOUNT_ID, month, adjusted);
    }

    // Targets: budgets on both entities (Draft), forecasts on both entities.
    for (const [id, name, entityId] of [
      [BUDGET_X, 'S9 Budget X', ENT_X],
      [BUDGET_Y, 'S9 Budget Y', ENT_Y],
    ] as const) {
      db.prepare(
        `INSERT OR REPLACE INTO budgets (id, tenant_id, name, fiscal_year, base_currency, status, entity_id)
         VALUES (?, 'default', ?, 2026, 'USD', 'Draft', ?)`
      ).run(id, name, entityId);
    }
    // Pre-existing budget line items so the green-path apply exercises the
    // UPDATE branch of the apply transaction (K27-safe deterministic path).
    for (const [id, budgetId, month] of [
      ['bli-sc9-x-m1', BUDGET_X, 1],
      ['bli-sc9-x-m2', BUDGET_X, 2],
    ] as const) {
      db.prepare(
        `INSERT OR REPLACE INTO budget_line_items (id, tenant_id, budget_id, account_id, month, amount)
         VALUES (?, 'default', ?, ?, ?, 0)`
      ).run(id, budgetId, ACCOUNT_ID, month);
    }
    for (const [id, name, entityId] of [
      [FORECAST_X, 'S9 Forecast X', ENT_X],
      [FORECAST_Y, 'S9 Forecast Y', ENT_Y],
    ] as const) {
      db.prepare(
        `INSERT OR REPLACE INTO forecasts (id, tenant_id, name, forecast_type, status, entity_id)
         VALUES (?, 'default', ?, 'Rolling', 'draft', ?)`
      ).run(id, name, entityId);
    }
    db.prepare(
      `INSERT OR REPLACE INTO forecast_periods
         (id, tenant_id, forecast_id, period_id, period_name, period_number)
       VALUES (?, 'default', ?, 'per-sc9-x-1', 'M1', 1)`
    ).run(PERIOD_X_1, FORECAST_X);

    adminToken = tokenFor('u-sc9-admin', 'u-sc9-admin@finplan.test', 'Admin');
    analystXToken = tokenFor('u-sc9-x', 'u-sc9-x@finplan.test', 'Analyst');
    analystYToken = tokenFor('u-sc9-y', 'u-sc9-y@finplan.test', 'Analyst');
    noScopeToken = tokenFor('u-sc9-none', 'u-sc9-none@finplan.test', 'Analyst');
  });

  it('sanity: seeded scopes resolve as intended', () => {
    const x = db.prepare('SELECT entity_id FROM scenarios WHERE id = ?').get(SCENARIO_X) as
      | Pick<ScenarioRow, 'entity_id'>
      | undefined;
    expect(x?.entity_id).toBe(ENT_X);
  });

  describe('allowed paths stay green (analyst scoped to entity X)', () => {
    it('reads its own scenario and line items', async () => {
      const res = await request(app)
        .get(`/api/scenarios/${SCENARIO_X}`)
        .set('Authorization', `Bearer ${analystXToken}`);
      expect(res.status).toBe(200);
      expect((res.body as Record<string, unknown>).entity_id).toBe(ENT_X);

      const items = await request(app)
        .get(`/api/scenarios/${SCENARIO_X}/items`)
        .set('Authorization', `Bearer ${analystXToken}`);
      expect(items.status).toBe(200);
      expect(Array.isArray(items.body)).toBe(true);
      expect((items.body as unknown[]).length).toBeGreaterThanOrEqual(1);
    });

    it('lists only in-scope scenarios (other entity and NULL-entity hidden)', async () => {
      const res = await request(app)
        .get('/api/scenarios')
        .set('Authorization', `Bearer ${analystXToken}`);
      expect(res.status).toBe(200);
      const rows = (res.body as { data: Array<{ id: string }> }).data;
      expect(rows.some((r) => r.id === SCENARIO_X)).toBe(true);
      expect(rows.some((r) => r.id === SCENARIO_Y)).toBe(false);
      expect(rows.some((r) => r.id === SCENARIO_NULL)).toBe(false);
    });

    it('adds a line item to its own scenario', async () => {
      const res = await request(app)
        .post(`/api/scenarios/${SCENARIO_X}/items`)
        .set('Authorization', `Bearer ${analystXToken}`)
        .send({ account_id: ACCOUNT_ID, month: 3, base_amount: 10, adjusted_amount: 12 });
      expect(res.status).toBe(201);
    });

    it('applies its own scenario to its own budget (server-authoritative write intact)', async () => {
      const res = await request(app)
        .post(`/api/scenarios/${SCENARIO_X}/apply`)
        .set('Authorization', `Bearer ${analystXToken}`)
        .send({ target: 'budget', target_id: BUDGET_X });
      expect(res.status).toBe(200);
      expect((res.body as { applied_count: number }).applied_count).toBeGreaterThanOrEqual(1);

      const row = db
        .prepare(
          'SELECT amount FROM budget_line_items WHERE budget_id = ? AND account_id = ? AND month = 1'
        )
        .get(BUDGET_X, ACCOUNT_ID) as { amount: number };
      expect(row.amount).toBe(150); // adjusted amount applied once (K25/K27 preserved)
    });

    it('applies its own scenario to its own forecast', async () => {
      const res = await request(app)
        .post(`/api/scenarios/${SCENARIO_X}/apply`)
        .set('Authorization', `Bearer ${analystXToken}`)
        .send({ target: 'forecast', target_id: FORECAST_X });
      expect(res.status).toBe(200);

      const row = db
        .prepare('SELECT amount FROM forecast_line_items WHERE forecast_id = ? AND account_id = ?')
        .get(FORECAST_X, ACCOUNT_ID) as { amount: number } | undefined;
      expect(row?.amount).toBe(150);
    });
  });

  describe('cross-entity payloads are rejected with 403 FP-0201', () => {
    it('denies reading another entity scenario', async () => {
      const res = await request(app)
        .get(`/api/scenarios/${SCENARIO_Y}`)
        .set('Authorization', `Bearer ${analystXToken}`);
      expectForbidden(res, 'GET other-entity scenario');
    });

    it('denies reading and writing another entity line items', async () => {
      const read = await request(app)
        .get(`/api/scenarios/${SCENARIO_Y}/items`)
        .set('Authorization', `Bearer ${analystXToken}`);
      expectForbidden(read, 'GET other-entity items');

      const write = await request(app)
        .post(`/api/scenarios/${SCENARIO_Y}/items`)
        .set('Authorization', `Bearer ${analystXToken}`)
        .send({ account_id: ACCOUNT_ID, month: 1, base_amount: 1, adjusted_amount: 2 });
      expectForbidden(write, 'POST other-entity items');
    });

    it('denies updating and deleting another entity scenario', async () => {
      const put = await request(app)
        .put(`/api/scenarios/${SCENARIO_Y}`)
        .set('Authorization', `Bearer ${analystXToken}`)
        .send({ name: 'Hijacked Name' });
      expectForbidden(put, 'PUT other-entity scenario');

      const del = await request(app)
        .delete(`/api/scenarios/${SCENARIO_Y}`)
        .set('Authorization', `Bearer ${analystXToken}`);
      expectForbidden(del, 'DELETE other-entity scenario');

      // Nothing was written by the rejected attempts.
      const row = db.prepare('SELECT name FROM scenarios WHERE id = ?').get(SCENARIO_Y) as {
        name: string;
      };
      expect(row.name).toBe('S9 Scenario Y');
    });

    it('denies applying a scenario into another entity budget (defect 1 core)', async () => {
      const res = await request(app)
        .post(`/api/scenarios/${SCENARIO_X}/apply`)
        .set('Authorization', `Bearer ${analystXToken}`)
        .send({ target: 'budget', target_id: BUDGET_Y });
      expectForbidden(res, 'APPLY into other-entity budget');

      const leaked = db
        .prepare('SELECT COUNT(*) AS count FROM budget_line_items WHERE budget_id = ?')
        .get(BUDGET_Y) as { count: number };
      expect(leaked.count).toBe(0);
    });

    it('denies applying a scenario into another entity forecast', async () => {
      const res = await request(app)
        .post(`/api/scenarios/${SCENARIO_X}/apply`)
        .set('Authorization', `Bearer ${analystXToken}`)
        .send({ target: 'forecast', target_id: FORECAST_Y });
      expectForbidden(res, 'APPLY into other-entity forecast');

      const leaked = db
        .prepare('SELECT COUNT(*) AS count FROM forecast_line_items WHERE forecast_id = ?')
        .get(FORECAST_Y) as { count: number };
      expect(leaked.count).toBe(0);
    });

    it('denies creating a scenario re-parented onto another entity budget', async () => {
      const res = await request(app)
        .post('/api/scenarios')
        .set('Authorization', `Bearer ${analystXToken}`)
        .send({ name: 'S9 Cross Create', budget_id: BUDGET_Y });
      expectForbidden(res, 'POST create with foreign budget_id');
    });

    it('denies re-pointing a scenario at another entity or budget via PUT', async () => {
      const repointEntity = await request(app)
        .put(`/api/scenarios/${SCENARIO_X}`)
        .set('Authorization', `Bearer ${analystXToken}`)
        .send({ entity_id: ENT_Y });
      expectForbidden(repointEntity, 'PUT entity_id out of scope');

      const repointBudget = await request(app)
        .put(`/api/scenarios/${SCENARIO_X}`)
        .set('Authorization', `Bearer ${analystXToken}`)
        .send({ budget_id: BUDGET_Y });
      expectForbidden(repointBudget, 'PUT budget_id out of scope');

      const row = db
        .prepare('SELECT entity_id, budget_id FROM scenarios WHERE id = ?')
        .get(SCENARIO_X) as { entity_id: string; budget_id: string | null };
      expect(row.entity_id).toBe(ENT_X);
      expect(row.budget_id).toBeNull();
    });

    it('is symmetric: analyst scoped to Y cannot touch X either', async () => {
      const res = await request(app)
        .get(`/api/scenarios/${SCENARIO_X}`)
        .set('Authorization', `Bearer ${analystYToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('fail closed when entity context is absent (allow-through defect 2)', () => {
    it('rejects reads/writes/applications on a NULL-entity scenario for scoped callers', async () => {
      const read = await request(app)
        .get(`/api/scenarios/${SCENARIO_NULL}`)
        .set('Authorization', `Bearer ${analystXToken}`);
      expectForbidden(read, 'GET NULL-entity scenario');

      const items = await request(app)
        .get(`/api/scenarios/${SCENARIO_NULL}/items`)
        .set('Authorization', `Bearer ${analystXToken}`);
      expectForbidden(items, 'GET NULL-entity items');

      const addItem = await request(app)
        .post(`/api/scenarios/${SCENARIO_NULL}/items`)
        .set('Authorization', `Bearer ${analystXToken}`)
        .send({ account_id: ACCOUNT_ID, month: 1, base_amount: 1, adjusted_amount: 1 });
      expectForbidden(addItem, 'POST NULL-entity items');

      const put = await request(app)
        .put(`/api/scenarios/${SCENARIO_NULL}`)
        .set('Authorization', `Bearer ${analystXToken}`)
        .send({ name: 'Should Not Rename' });
      expectForbidden(put, 'PUT NULL-entity scenario');

      const del = await request(app)
        .delete(`/api/scenarios/${SCENARIO_NULL}`)
        .set('Authorization', `Bearer ${analystXToken}`);
      expectForbidden(del, 'DELETE NULL-entity scenario');

      const apply = await request(app)
        .post(`/api/scenarios/${SCENARIO_NULL}/apply`)
        .set('Authorization', `Bearer ${analystXToken}`)
        .send({ target: 'budget', target_id: BUDGET_X });
      expectForbidden(apply, 'APPLY NULL-entity scenario');
    });

    it('returns an empty page for a caller whose entity filter is empty', async () => {
      const res = await request(app)
        .get('/api/scenarios')
        .set('Authorization', `Bearer ${noScopeToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ data: [], total: 0, limit: 50, offset: 0 });
    });
  });

  describe('Global Admin remains global-by-design (no over-tightening)', () => {
    it('sees every scenario including NULL-entity ones', async () => {
      const res = await request(app)
        .get('/api/scenarios')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      const ids = (res.body as { data: Array<{ id: string }> }).data.map((r) => r.id);
      expect(ids).toContain(SCENARIO_X);
      expect(ids).toContain(SCENARIO_Y);
      expect(ids).toContain(SCENARIO_NULL);
    });

    it('can still read and apply the NULL-entity scenario', async () => {
      const read = await request(app)
        .get(`/api/scenarios/${SCENARIO_NULL}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(read.status).toBe(200);

      const apply = await request(app)
        .post(`/api/scenarios/${SCENARIO_NULL}/apply`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ target: 'budget', target_id: BUDGET_X });
      expect(apply.status).toBe(200);
      expect((apply.body as { applied_count: number }).applied_count).toBeGreaterThanOrEqual(1);
    });
  });
});
