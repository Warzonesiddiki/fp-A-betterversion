import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import app from '../index.js';
import { JWT_SECRET } from '../config/env.js';
import { AUDIT_HMAC_SECRET } from '../config/env.js';
import { db } from '../db/connection.js';

/**
 * R43 — POST /api/audit/batch client ingestion into the server audit_log
 * (the PERSISTENCE_MAP official trail for auditTrailStore).
 *
 * Contract pinned here:
 *   - JWT-scoped: actor + tenant always derive from the token, never the body.
 *   - zod gate: batchId required; 1..500 entries; action/entityType/entityId
 *     required strings; ts must be ISO-8601 (offset forms canonicalized to UTC).
 *   - Hash-chain column semantics PRESERVED: every row carries a checksum
 *     computed exactly like AuditService.computeChecksum (HMAC-SHA256 over
 *     sorted-key fields, 16-hex slice). No new columns anywhere.
 *   - Idempotency: deterministic-PK commit marker (audit-batch-{tenant}-
 *     {batchId}) claimed inside the insert transaction — duplicate batches
 *     replay 200 with no double-insert; identical batchIds in DIFFERENT
 *     tenants stay independent.
 *   - GET routes untouched; read-back isolation proven through GET /api/audit.
 */

const TENANT_A = 'tenant-audit-a';
const TENANT_B = 'tenant-audit-b';

function tokenFor(id: string, email: string, role: string, tenantId?: string): string {
  return jwt.sign({ id, email, role, ...(tenantId ? { tenantId } : {}) }, JWT_SECRET, {
    expiresIn: '15m',
  });
}

function batchPayload(batchId: string, overrides: Record<string, unknown> = {}): object {
  return {
    batchId,
    entries: [
      {
        action: 'budget.save',
        entityType: 'budget',
        entityId: 'budget-r43-1',
        ts: '2026-08-20T10:00:00.000Z',
        details: { scenario: 'base', months: 12 },
        ...overrides,
      },
      {
        action: 'forecast.approve',
        entityType: 'forecast',
        entityId: 'forecast-r43-1',
        ts: '2026-08-20T11:30:00+05:30',
      },
    ],
  };
}

describe('R43 POST /api/audit/batch ingestion', () => {
  let adminA: string;
  let adminB: string;
  let viewer: string;

  beforeAll(() => {
    // Real-SQLite FK enforcement: audit_log.user_id references users.
    for (const [id, email, role] of [
      ['r43-admin-a', 'r43-admin-a@finplan.test', 'Admin'],
      ['r43-admin-b', 'r43-admin-b@finplan.test', 'Admin'],
      ['r43-viewer', 'r43-viewer@finplan.test', 'Viewer'],
    ] as const) {
      db.prepare(
        `INSERT OR REPLACE INTO users (id, email, password_hash, first_name, last_name, role, is_active)
         VALUES (?, ?, 'not-a-real-hash', 'Lane', 'R43', ?, 1)`
      ).run(id, email, role);
    }
    adminA = tokenFor('r43-admin-a', 'r43-admin-a@finplan.test', 'Admin', TENANT_A);
    adminB = tokenFor('r43-admin-b', 'r43-admin-b@finplan.test', 'Admin', TENANT_B);
    viewer = tokenFor('r43-viewer', 'r43-viewer@finplan.test', 'Viewer');
  });

  it('rejects unauthenticated ingestion with 401', async () => {
    const res = await request(app).post('/api/audit/batch').send(batchPayload('r43-noauth'));
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects insufficient roles with 403 (router-wide Admin/Manager gate)', async () => {
    const res = await request(app)
      .post('/api/audit/batch')
      .set('Authorization', `Bearer ${viewer}`)
      .send(batchPayload('r43-viewer'));
    expect(res.status).toBe(403);
  });

  it('rejects invalid batches with 400 (missing batchId, empty/oversized batch, non-ISO ts)', async () => {
    const auth = { Authorization: `Bearer ${adminA}` };

    const noBatchId = await request(app)
      .post('/api/audit/batch')
      .set(auth)
      .send({ entries: [{ action: 'a', entityType: 'b', entityId: 'c', ts: '2026-08-20T10:00:00Z' }] });
    expect(noBatchId.status).toBe(400);

    const emptyBatch = await request(app)
      .post('/api/audit/batch')
      .set(auth)
      .send({ batchId: 'r43-empty', entries: [] });
    expect(emptyBatch.status).toBe(400);

    const oversized = await request(app)
      .post('/api/audit/batch')
      .set(auth)
      .send({
        batchId: 'r43-big',
        entries: Array.from({ length: 501 }, (_, i) => ({
          action: `a${i}`,
          entityType: 'probe',
          entityId: `e${i}`,
          ts: '2026-08-20T10:00:00Z',
        })),
      });
    expect(oversized.status).toBe(400);

    const badTs = await request(app)
      .post('/api/audit/batch')
      .set(auth)
      .send({
        batchId: 'r43-badts',
        entries: [{ action: 'a', entityType: 'b', entityId: 'c', ts: 'not-a-date' }],
      });
    expect(badTs.status).toBe(400);

    // Nothing from the failed probes may have been written.
    const written = db
      .prepare(
        `SELECT COUNT(*) AS count FROM audit_log WHERE metadata LIKE '%client-batch%' AND (user_id = 'r43-admin-a' OR user_id = 'r43-admin-b')`
      )
      .get() as { count: number };
    expect(written.count).toBe(0);
  });

  it('happy path: inserts tenant-stamped rows with AuditService-grade checksums and canonical UTC timestamps', async () => {
    const batchId = `r43-happy-${Date.now()}`;
    const res = await request(app)
      .post('/api/audit/batch')
      .set('Authorization', `Bearer ${adminA}`)
      .send(batchPayload(batchId));
    expect(res.status).toBe(201);
    expect((res.body as { inserted: number }).inserted).toBe(2);
    expect((res.body as { replayed: boolean }).replayed).toBe(false);
    const ids = (res.body as { ids: string[] }).ids;
    expect(ids).toHaveLength(2);

    const first = db
      .prepare('SELECT * FROM audit_log WHERE id = ?')
      .get(ids[0]) as Record<string, unknown>;

    // Tenant + actor stamps come from the JWT.
    expect(first.tenant_id).toBe(TENANT_A);
    expect(first.user_id).toBe('r43-admin-a');

    // Offset ts ('...T11:30:00+05:30') is canonicalized on the SECOND entry;
    // assert on the first (already-UTC) row's exact storage format.
    expect(first.timestamp).toBe('2026-08-20T10:00:00.000Z');

    // Checksum matches the shared hash-chain computation (no invented columns).
    const expectedChecksum = crypto
      .createHmac('sha256', AUDIT_HMAC_SECRET)
      .update(
        JSON.stringify(
          {
            id: first.id,
            timestamp: first.timestamp,
            category: 'user_action',
            action: 'budget.save',
            userId: 'r43-admin-a',
            resourceId: 'budget-r43-1',
            oldValue: null,
            newValue: null,
          },
          ['action', 'category', 'id', 'newValue', 'oldValue', 'resourceId', 'timestamp', 'userId'].sort()
        )
      )
      .digest('hex')
      .slice(0, 16);
    expect(first.checksum).toBe(expectedChecksum);

    // Canonicalization of the offset form on entry #2.
    const second = db
      .prepare('SELECT timestamp FROM audit_log WHERE id = ?')
      .get(ids[1]) as { timestamp: string };
    expect(second.timestamp).toBe(new Date('2026-08-20T11:30:00+05:30').toISOString());

    // Read-back through the UNTOUCHED list route (same tenant).
    const list = await request(app).get('/api/audit').set('Authorization', `Bearer ${adminA}`);
    expect(list.status).toBe(200);
    const listedIds = new Set((list.body as { entries: { id: string }[] }).entries.map((e) => e.id));
    expect(listedIds.has(String(ids[0]))).toBe(true);
    expect(listedIds.has(String(ids[1]))).toBe(true);
  });

  it('duplicate batchId replays 200 with zero double-inserts', async () => {
    const batchId = `r43-replay-${Date.now()}`;

    const first = await request(app)
      .post('/api/audit/batch')
      .set('Authorization', `Bearer ${adminA}`)
      .send(batchPayload(batchId));
    expect(first.status).toBe(201);

    const countOf = (): number =>
      (
        db
          .prepare(
            `SELECT COUNT(*) AS count FROM audit_log WHERE metadata LIKE ? AND tenant_id = ?`
          )
          .get(`%${batchId}%`, TENANT_A) as { count: number }
      ).count;

    const afterFirst = countOf(); // 2 entries + 1 commit marker
    expect(afterFirst).toBe(3);

    const replay = await request(app)
      .post('/api/audit/batch')
      .set('Authorization', `Bearer ${adminA}`)
      .send(batchPayload(batchId));
    expect(replay.status).toBe(200);
    expect((replay.body as { replayed: boolean }).replayed).toBe(true);
    expect(countOf()).toBe(3); // unchanged — no double-insert

    // A DIFFERENT payload under an already-consumed key is also treated as a
    // replay (key identity, not payload identity — mirrors FP-0401 semantics
    // being out of scope here; the marker simply holds the claim).
    const mutated = await request(app)
      .post('/api/audit/batch')
      .set('Authorization', `Bearer ${adminA}`)
      .send(batchPayload(batchId, { action: 'tampered.action' }));
    expect(mutated.status).toBe(200);
    expect(countOf()).toBe(3);
  });

  it('identical client-supplied batchIds stay independent across tenants', async () => {
    const sharedBatchId = 'shared-client-batch-id';

    const resA = await request(app)
      .post('/api/audit/batch')
      .set('Authorization', `Bearer ${adminA}`)
      .send(batchPayload(sharedBatchId));
    expect(resA.status).toBe(201);

    // Same key, other tenant: fresh commit, not a replay.
    const resB = await request(app)
      .post('/api/audit/batch')
      .set('Authorization', `Bearer ${adminB}`)
      .send(batchPayload(sharedBatchId));
    expect(resB.status).toBe(201);
    expect((resB.body as { replayed: boolean }).replayed).toBe(false);

    const markerA = db
      .prepare(`SELECT COUNT(*) AS count FROM audit_log WHERE id = ?`)
      .get(`audit-batch-${TENANT_A}-${sharedBatchId}`) as { count: number };
    const markerB = db
      .prepare(`SELECT COUNT(*) AS count FROM audit_log WHERE id = ?`)
      .get(`audit-batch-${TENANT_B}-${sharedBatchId}`) as { count: number };
    expect(markerA.count).toBe(1);
    expect(markerB.count).toBe(1);
  });

  it('tenant isolation on read-back: the existing list route never leaks the other tenant', async () => {
    const batchId = `r43-isolation-${Date.now()}`;
    await request(app)
      .post('/api/audit/batch')
      .set('Authorization', `Bearer ${adminA}`)
      .send(batchPayload(batchId));

    const listB = await request(app).get('/api/audit').set('Authorization', `Bearer ${adminB}`);
    expect(listB.status).toBe(200);
    const leaked = (listB.body as { entries: { metadata: unknown }[] }).entries.filter((e) =>
      JSON.stringify(e.metadata ?? {}).includes(batchId)
    );
    expect(leaked).toHaveLength(0);
  });
});
