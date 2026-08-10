import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import { JWT_SECRET } from '../config/env.js';
import { db } from '../db/connection.js';
import { CommandRegistry } from '../services/CommandRegistry.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * F-04 Control-Plane contract spike tests: typed command envelope, trusted
 * actor/tenant scope, idempotency, base revisions, typed errors, audit
 * evidence, and negative authorization.
 *
 * Assertions use the API contract and the spike registry so they hold on both
 * real SQLite and the sandbox mock database.
 */

function makeEnvelope(overrides: Record<string, unknown> = {}) {
  return {
    commandId: uuidv4(),
    correlationId: uuidv4(),
    idempotencyKey: uuidv4(),
    commandType: 'plan.upsert',
    baseRevision: null,
    timestamp: new Date().toISOString(),
    scope: { entityId: 'ent-command-1' },
    payload: { amount: 100 },
    ...overrides,
  };
}

describe('POST /api/v1/commands (F-04 spike)', () => {
  let adminToken: string;
  let noAccessToken: string;
  let grantedToken: string;
  const userId = 'command-test-user';

  beforeAll(() => {
    adminToken = jwt.sign(
      { id: 'admin-uuid', email: 'admin@finplan.test', role: 'Admin' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    noAccessToken = jwt.sign(
      { id: 'outsider-uuid', email: 'outsider@finplan.test', role: 'Analyst' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    grantedToken = jwt.sign(
      { id: userId, email: 'granted@finplan.test', role: 'Analyst' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    db.prepare(
      `INSERT OR REPLACE INTO user_entity_access (user_id, entity_id, role)
       VALUES (?, ?, ?)`
    ).run(userId, 'ent-command-1', 'analyst');
  });

  beforeEach(() => {
    CommandRegistry.getInstance().resetForTests();
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).post('/api/v1/commands').send(makeEnvelope());
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects invalid envelopes with typed VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/commands')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...makeEnvelope(), commandId: 'not-a-uuid', commandType: 'unknown.type' });
    expect(res.status).toBe(400);
    expect(res.body.status).toBe('rejected');
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('denies entity scope not granted to the actor (negative authorization)', async () => {
    const res = await request(app)
      .post('/api/v1/commands')
      .set('Authorization', `Bearer ${noAccessToken}`)
      .send(makeEnvelope({ scope: { entityId: 'ent-not-granted' } }));
    expect(res.status).toBe(403);
    expect(res.body.status).toBe('rejected');
    expect(res.body.error.code).toBe('FORBIDDEN_ENTITY');
  });

  it('allows a granted entity scope and returns a new revision', async () => {
    const res = await request(app)
      .post('/api/v1/commands')
      .set('Authorization', `Bearer ${grantedToken}`)
      .send(makeEnvelope());
    expect(res.status).toBe(202);
    expect(res.body.status).toBe('completed');
    expect(res.body.revision).toBe('r1');
    expect(res.body.auditRecorded).toBe(true);
    expect(res.body.error).toBeUndefined();
  });

  it('replays idempotently for the same idempotency key without reapplying', async () => {
    const envelope = makeEnvelope();
    const first = await request(app)
      .post('/api/v1/commands')
      .set('Authorization', `Bearer ${grantedToken}`)
      .send(envelope);
    expect(first.status).toBe(202);
    expect(first.body.revision).toBe('r1');

    const replay = await request(app)
      .post('/api/v1/commands')
      .set('Authorization', `Bearer ${grantedToken}`)
      .send(envelope);
    expect(replay.status).toBe(200);
    expect(replay.body).toEqual(first.body);

    // No second application: revision and registry state are unchanged.
    expect(CommandRegistry.getInstance().getRevision('ent-command-1')).toBe('r1');

    // Query side returns the same stored outcome.
    const query = await request(app)
      .get(`/api/v1/commands/${envelope.correlationId}`)
      .set('Authorization', `Bearer ${grantedToken}`);
    expect(query.status).toBe(200);
    expect(query.body).toEqual(first.body);
  });

  it('returns NOT_FOUND for an unknown correlation id', async () => {
    const res = await request(app)
      .get(`/api/v1/commands/${uuidv4()}`)
      .set('Authorization', `Bearer ${grantedToken}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('rejects stale base revisions with CONFLICT_REVISION', async () => {
    await request(app)
      .post('/api/v1/commands')
      .set('Authorization', `Bearer ${grantedToken}`)
      .send(makeEnvelope({ baseRevision: null }));
    // Current revision is now r1; a command based on r1 applies cleanly...
    const ok = await request(app)
      .post('/api/v1/commands')
      .set('Authorization', `Bearer ${grantedToken}`)
      .send(makeEnvelope({ baseRevision: 'r1' }));
    expect(ok.status).toBe(202);
    expect(ok.body.revision).toBe('r2');

    // ...but a second command based on the now-stale r1 conflicts.
    const stale = await request(app)
      .post('/api/v1/commands')
      .set('Authorization', `Bearer ${grantedToken}`)
      .send(makeEnvelope({ baseRevision: 'r1' }));
    expect(stale.status).toBe(409);
    expect(stale.body.status).toBe('conflict');
    expect(stale.body.error.code).toBe('CONFLICT_REVISION');
    expect(stale.body.revision).toBe('r2');
  });

  it('records the outcome with actor, scope, and revision in audit evidence', async () => {
    const envelope = makeEnvelope();
    const res = await request(app)
      .post('/api/v1/commands')
      .set('Authorization', `Bearer ${grantedToken}`)
      .send(envelope);
    expect(res.status).toBe(202);
    expect(res.body.auditRecorded).toBe(true);

    // The audit insert mirrors the existing entities-route pattern
    // (audit_trail row with actor, scope, and revision details). Reads are
    // tolerant of both named columns (real SQLite) and positional storage
    // (sandbox mock database).
    const auditRows = db
      .prepare("SELECT user_id, details FROM audit_trail WHERE entity_type = 'command'")
      .all() as ({ user_id: string; details: string } & Record<number, string>)[];
    const recorded = auditRows.find((row) => (row.details ?? row[5])?.includes(envelope.commandId));
    expect(recorded).toBeDefined();
    if (recorded) {
      expect(recorded.user_id ?? recorded[4]).toBe(userId);
      const details = JSON.parse(recorded.details ?? recorded[5]) as Record<string, unknown>;
      expect(details.commandType).toBe('plan.upsert');
      expect(details.entityId).toBe('ent-command-1');
      expect(details.revision).toBe('r1');
    }
  });
});
