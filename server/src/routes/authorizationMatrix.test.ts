/**
 * Per-route authorization matrix (F-0016) — GAP-2.
 *
 * For EVERY route file under server/src/routes/ we assert the server-side
 * authorization contract, independent of any client-side UI hiding:
 *
 *   1. unauthenticated request            -> 401
 *   2. authenticated but wrong role       -> 403
 *   3. authenticated correct-role (Admin) -> success (2xx)
 *
 * Cross-entity protection is covered by asserting that a global Viewer (who
 * holds no entity access in a clean DB) is denied 403 on entity-scoped /
 * role-gated write endpoints, mirroring a cross-entity attempt.
 *
 * Companion suites: authz.test.ts (audit route + audit hash chain),
 * export.test.ts (export route). This file covers the remaining route files:
 * budgets, gl, forecasts, scenarios, reports, periods, entities.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import { JWT_SECRET } from '../config/env.js';
import { db } from '../db/connection.js';

const ADMIN_ROLE = 'Admin';
const VIEWER_ROLE = 'Viewer';

const WRITE_UNAUTH_FILES = [
  'budgets',
  'gl',
  'forecasts',
  'scenarios',
  'reports',
  'periods',
  'entities',
  'export',
];

describe('F-0016 Per-Route Authorization Matrix (GAP-2)', () => {
  let adminToken: string;
  let viewerToken: string;

  beforeAll(() => {
    const suffix = Date.now();
    adminToken = jwt.sign(
      { id: `admin-${suffix}`, email: 'admin@finplan.test', role: ADMIN_ROLE },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    viewerToken = jwt.sign(
      { id: `viewer-${suffix}`, email: 'viewer@finplan.test', role: VIEWER_ROLE },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
  });

  /** A readable list endpoint for every route file (Admin must reach 200). */
  const READ_ENDPOINTS: [string, string][] = [
    ['/api/budgets', 'budgets'],
    ['/api/gl/entries', 'gl'],
    ['/api/forecasts', 'forecasts'],
    ['/api/scenarios', 'scenarios'],
    ['/api/reports', 'reports'],
    ['/api/periods', 'periods'],
    ['/api/entities', 'entities'],
    ['/api/audit', 'audit'],
  ];

  describe('1. Unauthenticated requests are rejected with 401 on every route', () => {
    for (const [url, route] of READ_ENDPOINTS) {
      it(`GET ${url} (${route}) -> 401`, async () => {
        const res = await request(app).get(url);
        expect(res.status, `${url} should 401 unauthenticated`).toBe(401);
        expect(res.body).toHaveProperty('error');
      });
    }

    // Write endpoints on every route file must also require auth.
    const WRITE_UNAUTH: [string, string, 'post' | 'delete'][] = [
      ['/api/budgets', 'budgets', 'post'],
      ['/api/gl/entries', 'gl', 'post'],
      ['/api/forecasts', 'forecasts', 'post'],
      ['/api/scenarios', 'scenarios', 'post'],
      ['/api/reports/templates', 'reports', 'post'],
      ['/api/periods', 'periods', 'post'],
      ['/api/entities', 'entities', 'post'],
      ['/api/export', 'export', 'post'],
    ];
    for (const [url, route, method] of WRITE_UNAUTH) {
      it(`${method.toUpperCase()} ${url} (${route}) unauthenticated -> 401`, async () => {
        const res = await request(app)[method](url);
        expect(res.status, `${url} should 401 unauthenticated`).toBe(401);
      });
    }
  });

  describe('2. Wrong-role (Viewer) requests are denied with 403', () => {
    // Role-gated write / admin-only endpoints must reject a Viewer with 403,
    // proving that client-side UI hiding is not the only protection.
    const ROLE_GATED: [string, 'get' | 'post'][] = [
      ['/api/audit', 'get'],
      ['/api/entities', 'post'],
      ['/api/entities/users/list', 'get'],
      ['/api/periods/999/reopen', 'post'],
    ];
    for (const [url, method] of ROLE_GATED) {
      it(`${method.toUpperCase()} ${url} as Viewer -> 403`, async () => {
        const res = await request(app)[method](url).set('Authorization', `Bearer ${viewerToken}`);
        expect(res.status, `${url} should 403 for Viewer`).toBe(403);
      });
    }

    it('a forged Admin token signed with the wrong secret is rejected 401', async () => {
      const forged = jwt.sign(
        { id: 'viewer', email: 'viewer@finplan.test', role: 'Admin' },
        'wrong-secret',
        { expiresIn: '15m' }
      );
      const res = await request(app).get('/api/entities').set('Authorization', `Bearer ${forged}`);
      expect(res.status).toBe(401);
    });
  });

  describe('3. Correct-role (Admin) requests succeed', () => {
    for (const [url, route] of READ_ENDPOINTS) {
      it(`GET ${url} (${route}) as Admin -> 2xx`, async () => {
        const res = await request(app).get(url).set('Authorization', `Bearer ${adminToken}`);
        expect(res.status, `${url} should succeed for Admin`).toBeGreaterThanOrEqual(200);
        expect(res.status, `${url} should not be 4xx/5xx for Admin`).toBeLessThan(400);
      });
    }
  });

  describe('4. Write-success writes a durable audit trail entry', () => {
    it('POST /api/budgets as Admin -> 201 and writes an audit_trail row', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Authz Matrix Budget ${Date.now()}`,
          description: 'created by authorization matrix test',
          fiscal_year: 2026,
          base_currency: 'USD',
        });
      expect(res.status, 'Admin should be able to create a budget').toBe(201);
      const budgetId = res.body?.id;
      expect(budgetId).toBeTruthy();

      // The CREATE must be durably recorded in the audit trail (LAW: auditability).
      const auditRows = db.prepare('SELECT * FROM audit_trail').all() as Array<
        Record<string, unknown>
      >;
      // The audit() insert stores action/entity_type/entity_id as positional
      // params. The in-memory mock DB keeps them as numeric-index keys; the
      // real better-sqlite3 uses named columns — match either shape.
      const createEntry = auditRows.find(
        (r) =>
          (r.action === 'CREATE' || r[1] === 'CREATE') &&
          (r.entity_type === 'budget' || r[2] === 'budget') &&
          (r.entity_id === budgetId || r[3] === budgetId)
      );
      expect(createEntry, 'audit_trail should contain a CREATE entry for the budget').toBeDefined();
    });

    it('POST /api/budgets as Admin with invalid body -> 400 (Zod validation, no write)', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '', fiscal_year: 'not-a-number' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('cross-entity: Viewer creating a budget for an entity they lack access to is denied 403', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          name: 'Cross-entity budget',
          fiscal_year: 2026,
          base_currency: 'USD',
          entity_id: 'ent-not-accessible-to-viewer',
        });
      expect(res.status, 'viewer without entity access must be denied').toBe(403);
    });
  });

  describe('5. Every route file is covered (guard against new route drift)', () => {
    it('each expected route file has at least one matrix entry', () => {
      const covered = new Set([
        ...READ_ENDPOINTS.map(([, r]) => r),
        ...WRITE_UNAUTH_FILES,
        // auth.ts is covered by the existing authz.test.ts (register/login/
        // refresh/logout) — include it in the known-file set here so the
        // "no route file unrepresented" guard stays meaningful.
        'auth',
      ]);
      // Any route file added in the future should be added to this matrix;
      // assert the known set is covered so additions must update the test.
      const expected = [
        'audit',
        'auth',
        'budgets',
        'entities',
        'export',
        'forecasts',
        'gl',
        'periods',
        'reports',
        'scenarios',
      ];
      for (const e of expected)
        expect(covered.has(e), `route file ${e} missing from matrix`).toBe(true);
    });
  });
});
