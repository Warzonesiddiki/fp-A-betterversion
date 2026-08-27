import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import { JWT_SECRET } from '../config/env.js';
import { db } from '../db/connection.js';

/**
 * W0.2c-hardening lane S10 (M-tier, lane B): entity/account integrity edges.
 *
 * Defect coverage:
 *   D1 — entity_id reassignment: PUT /api/gl/accounts/:id must reject any
 *        attempt to re-bind an existing account row to another entity (the
 *        binding is immutable post-create; rebinding would move realized
 *        financial rows across entity boundaries retroactively).
 *   D2 — empty-entityFilter fallthrough: GET /api/gl/accounts scopes results
 *        to the caller's JWT-resolved permitted entities instead of trusting
 *        the (possibly absent) entity_id query param.
 *   D3 — global code-uniqueness alignment: account-code collisions surface as
 *        a typed 409 (FP-0402) on every path — including the DB-wide
 *        UNIQUE(accounts.code) constraint path that previously escaped as a
 *        raw 500 when the tenant-scoped pre-check could not see the clash.
 */

const TENANT_A = 'tenant-s10-a';
const TENANT_B = 'tenant-s10-b';

// Fixed UUID-shaped ids keep the fixtures stable across runs.
const ENT_A1 = '21000000-0000-0000-0000-00000000a001';
const ENT_A2 = '21000000-0000-0000-0000-00000000a002';
const ENT_B1 = '21000000-0000-0000-0000-00000000b001';

const ACC_E1 = '11000000-0000-0000-0000-00000000a001';
const ACC_E2 = '11000000-0000-0000-0000-00000000a002';
const ACC_UNBOUND = '11000000-0000-0000-0000-00000000a003';
const ACC_TENANT_B = '11000000-0000-0000-0000-00000000b001';

const CODE_E1 = 'S10-ACC-E1';
const CODE_E2 = 'S10-ACC-E2';
const CODE_FREE = 'S10-ACC-FREE';
const CODE_B = 'S10-ACC-B1';

function tokenFor(id: string, email: string, role: string, tenantId?: string): string {
  return jwt.sign({ id, email, role, ...(tenantId ? { tenantId } : {}) }, JWT_SECRET, {
    expiresIn: '15m',
  });
}

describe('W0.2c account integrity edges (lane S10)', () => {
  let adminA: string;
  let adminB: string;
  let analystNoGrants: string;
  let viewerE1: string;

  beforeAll(() => {
    // Users must exist: the request-audit middleware stamps audit_log.user_id
    // (FK to users) on every authenticated request.
    for (const [id, email, role] of [
      ['s10-admin-a', 's10-admin-a@finplan.test', 'Admin'],
      ['s10-admin-b', 's10-admin-b@finplan.test', 'Admin'],
      ['s10-analyst', 's10-analyst@finplan.test', 'Analyst'],
      ['s10-viewer', 's10-viewer@finplan.test', 'Viewer'],
    ] as const) {
      db.prepare(
        `INSERT OR REPLACE INTO users (id, email, password_hash, first_name, last_name, role, is_active)
         VALUES (?, ?, 'not-a-real-hash', 'Lane', 'S10', ?, 1)`
      ).run(id, email, role);
    }

    db.prepare(
      `INSERT OR REPLACE INTO entities (id, tenant_id, name, code, is_active)
       VALUES (?, ?, 'S10 Entity One', 'S10-ENT-A1', 1)`
    ).run(ENT_A1, TENANT_A);
    db.prepare(
      `INSERT OR REPLACE INTO entities (id, tenant_id, name, code, is_active)
       VALUES (?, ?, 'S10 Entity Two', 'S10-ENT-A2', 1)`
    ).run(ENT_A2, TENANT_A);
    db.prepare(
      `INSERT OR REPLACE INTO entities (id, tenant_id, name, code, is_active)
       VALUES (?, ?, 'S10 Entity B', 'S10-ENT-B1', 1)`
    ).run(ENT_B1, TENANT_B);

    for (const [id, tenant, code, entityId] of [
      [ACC_E1, TENANT_A, CODE_E1, ENT_A1],
      [ACC_E2, TENANT_A, CODE_E2, ENT_A2],
      [ACC_UNBOUND, TENANT_A, CODE_FREE, null],
      [ACC_TENANT_B, TENANT_B, CODE_B, ENT_B1],
    ] as const) {
      db.prepare(
        `INSERT OR REPLACE INTO accounts (id, tenant_id, code, name, type, is_active, entity_id)
         VALUES (?, ?, ?, ?, 'Asset', 1, ?)`
      ).run(id, tenant, code, `S10 Account ${code}`, entityId);
    }

    // Explicit single-entity grant: the E1 viewer may read entity A1 only.
    db.prepare(
      `INSERT OR REPLACE INTO user_entity_access (id, user_id, entity_id, role)
       VALUES ('s10-uea-1', 's10-viewer', ?, 'viewer')`
    ).run(ENT_A1);
    // The analyst gets NO user_entity_access rows and users.entity_id is NULL,
    // so its JWT-resolved permitted set is intentionally empty.

    adminA = tokenFor('s10-admin-a', 's10-admin-a@finplan.test', 'Admin', TENANT_A);
    adminB = tokenFor('s10-admin-b', 's10-admin-b@finplan.test', 'Admin', TENANT_B);
    analystNoGrants = tokenFor('s10-analyst', 's10-analyst@finplan.test', 'Analyst', TENANT_A);
    viewerE1 = tokenFor('s10-viewer', 's10-viewer@finplan.test', 'Viewer', TENANT_A);
  });

  // ---------------------------------------------------------------------
  // D3 — global code-uniqueness alignment (typed 409 FP-0402 everywhere)
  // ---------------------------------------------------------------------
  describe('D3: account-code uniqueness fails loudly (FP-0402)', () => {
    it('green path: creating an account with a fresh tenant-scoped code returns 201', async () => {
      const res = await request(app)
        .post('/api/gl/accounts')
        .set('Authorization', `Bearer ${adminA}`)
        .send({ code: 'S10-API-FRESH', name: 'Fresh COA row', type: 'Asset' });
      expect(res.status).toBe(201);
      expect((res.body as { code: string }).code).toBe('S10-API-FRESH');
    });

    it('rejection path: duplicate code within the same tenant -> 409 FP-0402', async () => {
      const res = await request(app)
        .post('/api/gl/accounts')
        .set('Authorization', `Bearer ${adminA}`)
        .send({ code: 'S10-API-FRESH', name: 'Duplicate sibling', type: 'Asset' });
      expect(res.status).toBe(409);
      expect((res.body.error as { code: string }).code).toBe('FP-0402');
    });

    it('rejection path: cross-tenant collision hits the schema UNIQUE and still surfaces 409 FP-0402 (never a raw 500)', async () => {
      const res = await request(app)
        .post('/api/gl/accounts')
        .set('Authorization', `Bearer ${adminB}`)
        .send({ code: 'S10-API-FRESH', name: 'Other tenant same code', type: 'Asset' });
      expect(res.status).toBe(409);
      expect((res.body.error as { code: string }).code).toBe('FP-0402');
    });

    it('rejection path: PUT renaming onto a sibling code in the same tenant -> 409 FP-0402', async () => {
      const res = await request(app)
        .put(`/api/gl/accounts/${ACC_E1}`)
        .set('Authorization', `Bearer ${adminA}`)
        .send({ code: CODE_E2 });
      expect(res.status).toBe(409);
      expect((res.body.error as { code: string }).code).toBe('FP-0402');
    });

    it('rejection path: PUT renaming onto a code held only by another tenant surfaces the constraint as 409 FP-0402', async () => {
      const res = await request(app)
        .put(`/api/gl/accounts/${ACC_E1}`)
        .set('Authorization', `Bearer ${adminA}`)
        .send({ code: CODE_B });
      expect(res.status).toBe(409);
      expect((res.body.error as { code: string }).code).toBe('FP-0402');

      // The failed rename must not have mutated the row.
      const row = db.prepare('SELECT code FROM accounts WHERE id = ?').get(ACC_E1) as {
        code: string;
      };
      expect(row.code).toBe(CODE_E1);
    });

    it('green path: PUT renaming to an unused code succeeds', async () => {
      // Dedicated throwaway row so the fixture accounts keep their codes for
      // the later scoping assertions.
      const created = await request(app)
        .post('/api/gl/accounts')
        .set('Authorization', `Bearer ${adminA}`)
        .send({ code: 'S10-API-RENAME', name: 'Rename me', type: 'Asset', entity_id: ENT_A1 });
      expect(created.status).toBe(201);
      const renameId = (created.body as { id: string }).id;

      const res = await request(app)
        .put(`/api/gl/accounts/${renameId}`)
        .set('Authorization', `Bearer ${adminA}`)
        .send({ code: 'S10-API-RENAMED' });
      expect(res.status).toBe(200);

      const row = db.prepare('SELECT code FROM accounts WHERE id = ?').get(renameId) as {
        code: string;
      };
      expect(row.code).toBe('S10-API-RENAMED');
    });
  });

  // ---------------------------------------------------------------------
  // D1 — entity binding immutable post-create (typed 409 FP-0410)
  // ---------------------------------------------------------------------
  describe('D1: entity_id reassignment rejected on update (FP-0410)', () => {
    it('rejection path: PUT with a different entity_id -> 409 FP-0410 and the row keeps its original binding', async () => {
      const res = await request(app)
        .put(`/api/gl/accounts/${ACC_E1}`)
        .set('Authorization', `Bearer ${adminA}`)
        .send({ name: 'Should Not Apply', entity_id: ENT_A2 });
      expect(res.status).toBe(409);
      expect((res.body.error as { code: string }).code).toBe('FP-0410');

      const row = db.prepare('SELECT entity_id, name FROM accounts WHERE id = ?').get(ACC_E1) as {
        entity_id: string;
        name: string;
      };
      expect(row.entity_id).toBe(ENT_A1);
      expect(row.name).not.toBe('Should Not Apply');
    });

    it('rejection path: PUT rejects entity_id presence even when re-sent unchanged', async () => {
      const res = await request(app)
        .put(`/api/gl/accounts/${ACC_E1}`)
        .set('Authorization', `Bearer ${adminA}`)
        .send({ entity_id: ENT_A1 });
      expect(res.status).toBe(409);
      expect((res.body.error as { code: string }).code).toBe('FP-0410');
    });

    it('green path: PUT without entity_id still updates mutable fields and preserves the binding', async () => {
      const res = await request(app)
        .put(`/api/gl/accounts/${ACC_E2}`)
        .set('Authorization', `Bearer ${adminA}`)
        .send({ name: 'S10 Renamed Account', description: 'mutable update' });
      expect(res.status).toBe(200);

      const row = db.prepare('SELECT name, entity_id FROM accounts WHERE id = ?').get(ACC_E2) as {
        name: string;
        entity_id: string;
      };
      expect(row.name).toBe('S10 Renamed Account');
      expect(row.entity_id).toBe(ENT_A2);
    });
  });

  // ---------------------------------------------------------------------
  // D2 — listing scoped by JWT-resolved permissions, not the query param
  // ---------------------------------------------------------------------
  describe('D2: GET /api/gl/accounts scopes by permitted entities (no empty-filter fallthrough)', () => {
    function codesOf(body: unknown): Set<string> {
      return new Set((body as { code: string }[]).map((row) => row.code));
    }

    it('an authenticated user with zero permitted entities sees an empty chart (previously: whole tenant COA)', async () => {
      const res = await request(app)
        .get('/api/gl/accounts')
        .set('Authorization', `Bearer ${analystNoGrants}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('a single-entity viewer sees their entity plus unbound rows — never other entities or tenants', async () => {
      const res = await request(app)
        .get('/api/gl/accounts')
        .set('Authorization', `Bearer ${viewerE1}`);
      expect(res.status).toBe(200);
      const codes = codesOf(res.body);
      expect(codes.has(CODE_E1)).toBe(true);
      expect(codes.has(CODE_FREE)).toBe(true); // unbound rows stay tenant-readable
      expect(codes.has(CODE_E2)).toBe(false);
      expect(codes.has(CODE_B)).toBe(false);
    });

    it('the entity_id query param may narrow but never widen the permitted scope', async () => {
      const widened = await request(app)
        .get('/api/gl/accounts')
        .query({ entity_id: ENT_A2 })
        .set('Authorization', `Bearer ${viewerE1}`);
      expect(widened.status).toBe(200);
      expect(widened.body).toEqual([]);

      const narrowed = await request(app)
        .get('/api/gl/accounts')
        .query({ entity_id: ENT_A1 })
        .set('Authorization', `Bearer ${viewerE1}`);
      expect(narrowed.status).toBe(200);
      const narrowedCodes = codesOf(narrowed.body);
      expect(narrowedCodes.has(CODE_E1)).toBe(true);
      expect(narrowedCodes.has(CODE_FREE)).toBe(false);
      expect(narrowedCodes.has(CODE_E2)).toBe(false);
    });

    it('global Admin still sees the whole tenant (all entities + unbound), but never another tenant', async () => {
      const res = await request(app)
        .get('/api/gl/accounts')
        .set('Authorization', `Bearer ${adminA}`);
      expect(res.status).toBe(200);
      const codes = codesOf(res.body);
      expect(codes.has(CODE_E1)).toBe(true);
      expect(codes.has(CODE_E2)).toBe(true);
      expect(codes.has(CODE_FREE)).toBe(true);
      expect(codes.has(CODE_B)).toBe(false);
    });
  });
});
