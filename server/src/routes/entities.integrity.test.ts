import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import { JWT_SECRET } from '../config/env.js';
import { db } from '../db/connection.js';

/**
 * W0.2c-hardening lane S10 (M-tier, lane B): entity-side integrity edges.
 *
 * Defect coverage:
 *   D2 — empty-entityFilter fallthrough on listing routes: absent/empty
 *        filters must mean "scoped to the caller's JWT-resolved permitted
 *        entities", never "all entities visible". Covered here for
 *        GET /api/entities/departments/list (previously trusted the query
 *        param alone with zero permission scoping) plus a regression guard
 *        documenting the intended semantic of GET /api/entities itself.
 */

const TENANT_A = 'tenant-s10e-a';
const TENANT_B = 'tenant-s10e-b';

const ENT_D1 = '22000000-0000-0000-0000-00000000d001';
const ENT_D2 = '22000000-0000-0000-0000-00000000d002';
const ENT_DB = '22000000-0000-0000-0000-00000000db01';

const DEP_D1 = '31000000-0000-0000-0000-00000000d001';
const DEP_D2 = '31000000-0000-0000-0000-00000000d002';
const DEP_DB = '31000000-0000-0000-0000-00000000b001';

function tokenFor(id: string, email: string, role: string, tenantId?: string): string {
  return jwt.sign({ id, email, role, ...(tenantId ? { tenantId } : {}) }, JWT_SECRET, {
    expiresIn: '15m',
  });
}

describe('W0.2c entity listing integrity edges (lane S10)', () => {
  let adminA: string;
  let adminB: string;
  let analystNoGrants: string;
  let viewerD1: string;

  beforeAll(() => {
    for (const [id, email, role] of [
      ['s10e-admin-a', 's10e-admin-a@finplan.test', 'Admin'],
      ['s10e-admin-b', 's10e-admin-b@finplan.test', 'Admin'],
      ['s10e-analyst', 's10e-analyst@finplan.test', 'Analyst'],
      ['s10e-viewer', 's10e-viewer@finplan.test', 'Viewer'],
    ] as const) {
      db.prepare(
        `INSERT OR REPLACE INTO users (id, email, password_hash, first_name, last_name, role, is_active)
         VALUES (?, ?, 'not-a-real-hash', 'Lane', 'S10E', ?, 1)`
      ).run(id, email, role);
    }

    db.prepare(
      `INSERT OR REPLACE INTO entities (id, tenant_id, name, code, is_active)
       VALUES (?, ?, 'S10E Entity One', 'S10E-ENT-A1', 1)`
    ).run(ENT_D1, TENANT_A);
    db.prepare(
      `INSERT OR REPLACE INTO entities (id, tenant_id, name, code, is_active)
       VALUES (?, ?, 'S10E Entity Two', 'S10E-ENT-A2', 1)`
    ).run(ENT_D2, TENANT_A);
    db.prepare(
      `INSERT OR REPLACE INTO entities (id, tenant_id, name, code, is_active)
       VALUES (?, ?, 'S10E Entity B', 'S10E-ENT-B1', 1)`
    ).run(ENT_DB, TENANT_B);

    for (const [id, tenant, code, entityId] of [
      [DEP_D1, TENANT_A, 'S10E-DEP-D1', ENT_D1],
      [DEP_D2, TENANT_A, 'S10E-DEP-D2', ENT_D2],
      [DEP_DB, TENANT_B, 'S10E-DEP-B1', ENT_DB],
    ] as const) {
      db.prepare(
        `INSERT OR REPLACE INTO departments (id, tenant_id, name, code, is_active, entity_id)
         VALUES (?, ?, ?, ?, 1, ?)`
      ).run(id, tenant, `S10E Department ${code}`, code, entityId);
    }

    // Single-entity grant for the E1 viewer; the analyst stays grant-free.
    db.prepare(
      `INSERT OR REPLACE INTO user_entity_access (id, user_id, entity_id, role)
       VALUES ('s10e-uea-1', 's10e-viewer', ?, 'viewer')`
    ).run(ENT_D1);

    adminA = tokenFor('s10e-admin-a', 's10e-admin-a@finplan.test', 'Admin', TENANT_A);
    adminB = tokenFor('s10e-admin-b', 's10e-admin-b@finplan.test', 'Admin', TENANT_B);
    analystNoGrants = tokenFor('s10e-analyst', 's10e-analyst@finplan.test', 'Analyst', TENANT_A);
    viewerD1 = tokenFor('s10e-viewer', 's10e-viewer@finplan.test', 'Viewer', TENANT_A);
  });

  describe('D2: GET /api/entities/departments/list scopes by permitted entities', () => {
    function codesOf(body: unknown): Set<string> {
      return new Set((body as { code: string }[]).map((row) => row.code));
    }

    it('unauthenticated request -> 401', async () => {
      const res = await request(app).get('/api/entities/departments/list');
      expect(res.status).toBe(401);
    });

    it('an authenticated user with zero permitted entities sees no departments (previously: whole tenant)', async () => {
      const res = await request(app)
        .get('/api/entities/departments/list')
        .set('Authorization', `Bearer ${analystNoGrants}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("a single-entity viewer sees only their entity's departments — never other entities or tenants", async () => {
      const res = await request(app)
        .get('/api/entities/departments/list')
        .set('Authorization', `Bearer ${viewerD1}`);
      expect(res.status).toBe(200);
      const codes = codesOf(res.body);
      expect(codes.has('S10E-DEP-D1')).toBe(true);
      expect(codes.has('S10E-DEP-D2')).toBe(false);
      expect(codes.has('S10E-DEP-B1')).toBe(false);
    });

    it('the entity_id query param may narrow but never widen the permitted scope', async () => {
      const widened = await request(app)
        .get('/api/entities/departments/list')
        .query({ entity_id: ENT_D2 })
        .set('Authorization', `Bearer ${viewerD1}`);
      expect(widened.status).toBe(200);
      expect(widened.body).toEqual([]);

      const narrowed = await request(app)
        .get('/api/entities/departments/list')
        .query({ entity_id: ENT_D1 })
        .set('Authorization', `Bearer ${viewerD1}`);
      expect(narrowed.status).toBe(200);
      const codes = codesOf(narrowed.body);
      expect(codes.has('S10E-DEP-D1')).toBe(true);
      expect(codes.has('S10E-DEP-D2')).toBe(false);
    });

    it('global Admin sees the whole tenant but never another tenant', async () => {
      const res = await request(app)
        .get('/api/entities/departments/list')
        .set('Authorization', `Bearer ${adminA}`);
      expect(res.status).toBe(200);
      const codes = codesOf(res.body);
      expect(codes.has('S10E-DEP-D1')).toBe(true);
      expect(codes.has('S10E-DEP-D2')).toBe(true);
      expect(codes.has('S10E-DEP-B1')).toBe(false);

      const other = await request(app)
        .get('/api/entities/departments/list')
        .set('Authorization', `Bearer ${adminB}`);
      expect(other.status).toBe(200);
      const otherCodes = codesOf(other.body);
      expect(otherCodes.has('S10E-DEP-B1')).toBe(true);
      expect(otherCodes.has('S10E-DEP-D1')).toBe(false);
      expect(otherCodes.has('S10E-DEP-D2')).toBe(false);
    });
  });

  describe('D2 regression guard: GET /api/entities intended scoping semantics', () => {
    it('a single-entity viewer lists exactly their permitted entity', async () => {
      const res = await request(app)
        .get('/api/entities')
        .set('Authorization', `Bearer ${viewerD1}`);
      expect(res.status).toBe(200);
      const ids = new Set((res.body as { id: string }[]).map((row) => row.id));
      expect(ids.has(ENT_D1)).toBe(true);
      expect(ids.has(ENT_D2)).toBe(false);
      expect(ids.has(ENT_DB)).toBe(false);
    });

    it('global Admin lists every entity of their own tenant only', async () => {
      const res = await request(app).get('/api/entities').set('Authorization', `Bearer ${adminA}`);
      expect(res.status).toBe(200);
      const ids = new Set((res.body as { id: string }[]).map((row) => row.id));
      expect(ids.has(ENT_D1)).toBe(true);
      expect(ids.has(ENT_D2)).toBe(true);
      expect(ids.has(ENT_DB)).toBe(false);
    });

    it('a zero-grant user gets an empty entity list, not the whole tenant directory', async () => {
      const res = await request(app)
        .get('/api/entities')
        .set('Authorization', `Bearer ${analystNoGrants}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });
});
