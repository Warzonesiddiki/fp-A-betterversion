/**
 * GAP-4 (F-0013) — full period-close lifecycle integration test.
 *
 * WHAT WAS ALREADY PROVEN
 * -----------------------
 * `periods.test.ts` covers individual endpoints: close, reopen, read state,
 * read audit, one invalid transition, one role denial.
 *
 * WHAT WAS NOT
 * ------------
 * The CHAIN. Nothing walked a single period through its whole life
 * (open -> soft-close -> hard-close -> locked -> reopen) asserting, at every
 * step, that (a) the durable DB state changed, (b) the state machine refused
 * every illegal jump, (c) each role boundary held, (d) the approval requirement
 * was enforced, and (e) an immutable audit row was written for every accepted
 * transition and NO row for any rejected one. An audit trail that records
 * rejected attempts as if they happened, or silently drops accepted ones, is
 * worse than none.
 *
 * This suite drives the real Express app over HTTP with Supertest against the
 * real DB layer, and asserts durable state after every hop.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import { JWT_SECRET } from '../config/env.js';
import { db } from '../db/connection.js';

interface CloseAuditRow {
  id: string;
  period_id: string;
  from_state: string;
  to_state: string;
  actor_id: string;
  reason: string | null;
  approval_id: string | null;
}

/** The GL create schema requires real UUIDs for account_id / entity_id. */
const ACCOUNT_UUID = '11111111-1111-4111-8111-111111111111';
const ENTITY_UUID = '22222222-2222-4222-8222-222222222222';

const glEntryPayload = (description: string, postDate: string) => ({
  account_id: ACCOUNT_UUID,
  entity_id: ENTITY_UUID,
  post_date: postDate,
  amount: 100,
  debit: 100,
  credit: 0,
  description,
});

/** Balanced Dr(asset)/Cr(equity) batch — the W0.3 gate rejects one-sided posts. */
const EQUITY_UUID = '11111111-1111-4111-8111-111111111112';
const balancedPairPayload = (description: string, postDate: string, amount = 100) => ({
  entries: [
    {
      account_id: ACCOUNT_UUID,
      entity_id: ENTITY_UUID,
      post_date: postDate,
      amount,
      debit: amount,
      credit: 0,
      description,
    },
    {
      account_id: EQUITY_UUID,
      entity_id: ENTITY_UUID,
      post_date: postDate,
      amount,
      debit: 0,
      credit: amount,
      description,
    },
  ],
});

const token = (role: string, id = `${role.toLowerCase()}-id`) =>
  jwt.sign({ id, email: `${id}@finplan.test`, role }, JWT_SECRET, { expiresIn: '15m' });

// Real-SQLite FK enforcement: audit_log.user_id references users, so every
// JWT actor used below must exist as a users row.
const SEED_ACTORS: ReadonlyArray<readonly [string, string, string]> = [
  ['admin-id', 'admin@finplan.test', 'Admin'],
  ['manager-id', 'manager@finplan.test', 'Manager'],
  ['fpa-id', 'fpa@finplan.test', 'FP&A_Manager'],
  ['viewer-id', 'viewer@finplan.test', 'Viewer'],
  ['compliance-id', 'compliance@finplan.test', 'Compliance'],
];
for (const [id, email, role] of SEED_ACTORS) {
  db.prepare(
    `INSERT OR REPLACE INTO users (id, email, password_hash, first_name, last_name, role, is_active)
     VALUES (?, ?, 'not-a-real-hash', 'Seed', 'User', ?, 1)`
  ).run(id, email, role);
}

// Real-SQLite FK enforcement: gl_entries.account_id/entity_id reference
// accounts/entities. The balanced-pair GL posts below need both legs seeded.
db.prepare(
  `INSERT OR REPLACE INTO accounts (id, name, code, type, is_active)
   VALUES (?, 'Close Lifecycle Asset', 'CL-ASSET', 'Asset', 1)`
).run(ACCOUNT_UUID);
db.prepare(
  `INSERT OR REPLACE INTO accounts (id, name, code, type, is_active)
   VALUES (?, 'Close Lifecycle Equity', 'CL-EQ', 'Equity', 1)`
).run(EQUITY_UUID);
db.prepare(
  `INSERT OR REPLACE INTO entities (id, name, code, is_active)
   VALUES (?, 'Close Lifecycle Entity', 'CL-ENT', 1)`
).run(ENTITY_UUID);

describe('GAP-4: period close full lifecycle (UI contract -> server -> durable state -> audit)', () => {
  let admin: string;
  let manager: string;
  let fpaManager: string;
  let viewer: string;
  let compliance: string;
  let periodId: string;
  /** Each test owns a DISTINCT date range so a period left closed by an earlier
   *  test cannot block a GL post in a later one. The GL lock matches on
   *  `post_date BETWEEN start_date AND end_date`, so shared ranges would make
   *  these assertions order-dependent. */
  let periodStart: string;
  let periodEnd: string;
  let postDate: string;
  let seq = 0;

  /** Read the durable row, not the response body — proves persistence. */
  const durableState = (id: string) =>
    (db.prepare('SELECT close_state, is_closed FROM fiscal_periods WHERE id = ?').get(id) as
      | { close_state: string; is_closed: number }
      | undefined) ?? { close_state: 'MISSING', is_closed: -1 };

  const closeAudit = (id: string): CloseAuditRow[] =>
    db
      .prepare('SELECT * FROM period_close_audit WHERE period_id = ? ORDER BY created_at ASC')
      .all(id) as CloseAuditRow[];

  const setState = (id: string, state: string) =>
    db
      .prepare('UPDATE fiscal_periods SET close_state = ?, is_closed = ? WHERE id = ?')
      .run(state, state === 'hard-close' || state === 'locked' ? 1 : 0, id);

  beforeAll(() => {
    admin = token('Admin');
    manager = token('Manager');
    fpaManager = token('FP&A_Manager', 'fpa-id');
    viewer = token('Viewer');
    compliance = token('Compliance');
  });

  beforeEach(() => {
    seq += 1;
    // A unique, non-overlapping day-window per test (2200-01-01 onward keeps it
    // clear of every other suite's fixtures).
    const day = String(seq).padStart(2, '0');
    periodStart = `2200-01-${day}`;
    periodEnd = `2200-01-${day}`;
    postDate = `2200-01-${day}`;
    periodId = `lifecycle-${seq}-${Date.now()}`;
    // All nine columns are bound positionally to match how the sandbox's
    // mock-DB fallback maps fiscal_periods inserts.
    db.prepare(
      `INSERT OR REPLACE INTO fiscal_periods
         (id, year, period_number, name, start_date, end_date, period_type, is_closed, close_state)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(periodId, 2200, seq, `2200-P${seq}`, periodStart, periodEnd, 'Monthly', 0, 'open');
  });

  describe('the happy path walks open -> soft-close -> hard-close -> locked', () => {
    it('advances through every state, persisting each one', async () => {
      expect(durableState(periodId).close_state).toBe('open');

      const soft = await request(app)
        .post(`/api/periods/${periodId}/transition`)
        .set('Authorization', `Bearer ${manager}`)
        .send({ targetState: 'soft-close', reason: 'Month-end soft close' });
      expect(soft.status).toBe(200);
      expect(durableState(periodId).close_state).toBe('soft-close');

      const hard = await request(app)
        .post(`/api/periods/${periodId}/transition`)
        .set('Authorization', `Bearer ${fpaManager}`)
        .send({ targetState: 'hard-close', reason: 'Books final' });
      expect(hard.status).toBe(200);
      expect(durableState(periodId).close_state).toBe('hard-close');

      const locked = await request(app)
        .post(`/api/periods/${periodId}/transition`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ targetState: 'locked', reason: 'Statutory lock' });
      expect(locked.status).toBe(200);
      expect(durableState(periodId).close_state).toBe('locked');
      expect(durableState(periodId).is_closed).toBe(1);
    });

    it('writes exactly one immutable audit row per accepted transition, in order', async () => {
      await request(app)
        .post(`/api/periods/${periodId}/transition`)
        .set('Authorization', `Bearer ${manager}`)
        .send({ targetState: 'soft-close', reason: 'Soft' });
      await request(app)
        .post(`/api/periods/${periodId}/transition`)
        .set('Authorization', `Bearer ${fpaManager}`)
        .send({ targetState: 'hard-close', reason: 'Hard' });

      const rows = closeAudit(periodId);
      expect(rows).toHaveLength(2);
      expect(rows.map((r) => [r.from_state, r.to_state])).toEqual([
        ['open', 'soft-close'],
        ['soft-close', 'hard-close'],
      ]);
      // The actor and the stated reason are recorded, not just the transition.
      expect(rows[0]!.actor_id).toBe('manager-id');
      expect(rows[0]!.reason).toBe('Soft');
      expect(rows[1]!.actor_id).toBe('fpa-id');
    });

    it('exposes the current state and its legal next steps over the API', async () => {
      setState(periodId, 'soft-close');
      const res = await request(app)
        .get(`/api/periods/${periodId}/state`)
        .set('Authorization', `Bearer ${admin}`);
      expect(res.status).toBe(200);
      expect(res.body.closeState).toBe('soft-close');
      // Product decision (GAP-4, 2026-08-03): soft-close permits adjusting
      // entries, so isClosed is false and canPost is true.
      expect(res.body.isClosed).toBe(false);
      expect(res.body.canPost).toBe(true);
      expect(res.body.validTransitions.sort()).toEqual(['hard-close', 'open']);
    });
  });

  describe('the state machine refuses illegal jumps', () => {
    it.each([
      ['open', 'hard-close'],
      ['open', 'locked'],
      ['soft-close', 'locked'],
    ])('rejects %s -> %s and leaves the period untouched', async (from, to) => {
      setState(periodId, from);
      const res = await request(app)
        .post(`/api/periods/${periodId}/transition`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ targetState: to, reason: 'Illegal jump attempt' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid transition/i);
      expect(durableState(periodId).close_state).toBe(from);
    });

    it('writes NO audit row for a rejected transition', async () => {
      setState(periodId, 'open');
      await request(app)
        .post(`/api/periods/${periodId}/transition`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ targetState: 'locked', reason: 'Illegal jump attempt' });

      // A rejected attempt must not appear in the close audit as if it happened.
      expect(closeAudit(periodId)).toHaveLength(0);
    });

    it('404s on a period that does not exist rather than inventing one', async () => {
      const res = await request(app)
        .post('/api/periods/no-such-period/transition')
        .set('Authorization', `Bearer ${admin}`)
        .send({ targetState: 'soft-close', reason: 'Ghost' });
      expect(res.status).toBe(404);
    });
  });

  describe('unauthorized transitions are refused', () => {
    it('rejects an unauthenticated transition with 401', async () => {
      const res = await request(app)
        .post(`/api/periods/${periodId}/transition`)
        .send({ targetState: 'soft-close', reason: 'No token' });
      expect(res.status).toBe(401);
      expect(durableState(periodId).close_state).toBe('open');
    });

    it('rejects a Viewer with 403 and no state change', async () => {
      const res = await request(app)
        .post(`/api/periods/${periodId}/transition`)
        .set('Authorization', `Bearer ${viewer}`)
        .send({ targetState: 'soft-close', reason: 'Viewer attempt' });
      expect(res.status).toBe(403);
      expect(durableState(periodId).close_state).toBe('open');
      expect(closeAudit(periodId)).toHaveLength(0);
    });

    it('rejects a Manager attempting a hard-close (FP&A_Manager or Admin only)', async () => {
      setState(periodId, 'soft-close');
      const res = await request(app)
        .post(`/api/periods/${periodId}/transition`)
        .set('Authorization', `Bearer ${manager}`)
        .send({ targetState: 'hard-close', reason: 'Over-reach' });
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Insufficient permissions/i);
      expect(durableState(periodId).close_state).toBe('soft-close');
    });

    it('rejects an FP&A_Manager attempting to lock (Admin only)', async () => {
      setState(periodId, 'hard-close');
      const res = await request(app)
        .post(`/api/periods/${periodId}/transition`)
        .set('Authorization', `Bearer ${fpaManager}`)
        .send({ targetState: 'locked', reason: 'Over-reach' });
      expect(res.status).toBe(403);
      expect(durableState(periodId).close_state).toBe('hard-close');
    });

    it('rejects a forged token with 401', async () => {
      const forged = jwt.sign({ id: 'x', email: 'x@y.z', role: 'Admin' }, 'not-the-real-secret', {
        expiresIn: '15m',
      });
      const res = await request(app)
        .post(`/api/periods/${periodId}/transition`)
        .set('Authorization', `Bearer ${forged}`)
        .send({ targetState: 'soft-close', reason: 'Forged' });
      expect(res.status).toBe(401);
      expect(durableState(periodId).close_state).toBe('open');
    });
  });

  describe('reopen requires justification and the right authority', () => {
    it('rejects a reopen with no reason (Zod)', async () => {
      setState(periodId, 'soft-close');
      const res = await request(app)
        .post(`/api/periods/${periodId}/reopen`)
        .set('Authorization', `Bearer ${admin}`)
        .send({});
      expect(res.status).toBe(400);
      expect(durableState(periodId).close_state).toBe('soft-close');
    });

    it('allows an Admin to reopen a hard-closed period and records it', async () => {
      setState(periodId, 'hard-close');
      const res = await request(app)
        .post(`/api/periods/${periodId}/reopen`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ reason: 'Late adjusting entry' });
      expect(res.status).toBe(200);
      expect(durableState(periodId).close_state).toBe('open');
      expect(durableState(periodId).is_closed).toBe(0);

      const rows = closeAudit(periodId);
      expect(rows.at(-1)).toMatchObject({ from_state: 'hard-close', to_state: 'open' });
      expect(rows.at(-1)!.reason).toBe('Late adjusting entry');
    });

    it('refuses to force-reopen a LOCKED period without an approvalId', async () => {
      setState(periodId, 'locked');
      const res = await request(app)
        .post(`/api/periods/${periodId}/reopen`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ reason: 'Restatement' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/approval/i);
      expect(durableState(periodId).close_state).toBe('locked');
      expect(closeAudit(periodId)).toHaveLength(0);
    });

    it('permits a force-reopen of a LOCKED period WITH an approvalId and records the approval', async () => {
      setState(periodId, 'locked');
      const res = await request(app)
        .post(`/api/periods/${periodId}/reopen`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ reason: 'Restatement', approvalId: 'APPROVAL-123' });
      expect(res.status).toBe(200);
      expect(durableState(periodId).close_state).toBe('open');

      const row = closeAudit(periodId).at(-1)!;
      expect(row.from_state).toBe('locked');
      expect(row.to_state).toBe('open');
      // The approving authority is durably linked to the reopen.
      expect(row.approval_id).toBe('APPROVAL-123');
    });

    it('rejects a non-Admin reopen through the reopen endpoint', async () => {
      setState(periodId, 'soft-close');
      for (const t of [viewer, manager, compliance]) {
        const res = await request(app)
          .post(`/api/periods/${periodId}/reopen`)
          .set('Authorization', `Bearer ${t}`)
          .send({ reason: 'Attempt' });
        expect(res.status).toBe(403);
      }
      expect(durableState(periodId).close_state).toBe('soft-close');
    });

    it('rejects reopening an already-open period', async () => {
      const res = await request(app)
        .post(`/api/periods/${periodId}/reopen`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ reason: 'Redundant' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/already open/i);
    });
  });

  describe('the close audit trail is queryable and complete', () => {
    it('returns the full transition history for the period', async () => {
      await request(app)
        .post(`/api/periods/${periodId}/transition`)
        .set('Authorization', `Bearer ${manager}`)
        .send({ targetState: 'soft-close', reason: 'Soft' });
      await request(app)
        .post(`/api/periods/${periodId}/reopen`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ reason: 'Reopen' });

      const res = await request(app)
        .get(`/api/periods/${periodId}/audit`)
        .set('Authorization', `Bearer ${admin}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      const pairs = (res.body as CloseAuditRow[]).map((r) => `${r.from_state}->${r.to_state}`);
      expect(pairs.sort()).toEqual(['open->soft-close', 'soft-close->open']);
    });

    it('requires authentication to read the close audit trail', async () => {
      const res = await request(app).get(`/api/periods/${periodId}/audit`);
      expect(res.status).toBe(401);
    });
  });

  describe('GL posting honours the period lock', () => {
    it('blocks a GL post to a hard-closed period', async () => {
      setState(periodId, 'hard-close');
      const res = await request(app)
        .post('/api/gl/entries')
        .set('Authorization', `Bearer ${admin}`)
        .send(glEntryPayload('Should be blocked', postDate));
      // 403 = blocked by the period lock (400 would mean the payload never
      // reached the lock check, which would make this assertion meaningless).
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Period closed/i);
    });

    it('SOFT-CLOSE POLICY (2026-08-03): soft-close permits adjusting entries', async () => {
      // Product decision, GAP-4: a soft close exists to allow authorized
      // adjusting entries until the hard close. So canPost() is true for
      // soft-close AND the GL route must accept the post. The old code set
      // is_closed = 1 for ANY non-open state, so the API advertised
      // canPost=true while GL refused with 403 — that inconsistency was
      // pinned here and is now resolved by the policy.
      setState(periodId, 'soft-close');

      const state = await request(app)
        .get(`/api/periods/${periodId}/state`)
        .set('Authorization', `Bearer ${admin}`);
      expect(state.body.closeState).toBe('soft-close');
      expect(state.body.canPost).toBe(true);
      expect(state.body.isClosed).toBe(false);

      // Adjusting entry to a soft-closed period is ALLOWED under the policy.
      // Balanced pair — the W0.3 three-statement gate rejects one-sided posts.
      const post = await request(app)
        .post('/api/gl/entries/bulk')
        .set('Authorization', `Bearer ${admin}`)
        .send(balancedPairPayload('Soft-close adjusting entry', postDate));
      expect(post.status).toBe(201);
    });

    it('hard-close still blocks GL posting (is_closed = 1)', async () => {
      setState(periodId, 'hard-close');
      const res = await request(app)
        .post('/api/gl/entries')
        .set('Authorization', `Bearer ${admin}`)
        .send(glEntryPayload('Should be blocked', postDate));
      // 403 = blocked by the period lock (400 would mean the payload never
      // reached the lock check, which would make this assertion meaningless).
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Period closed/i);
    });

    it('allows a GL post once the period is reopened', async () => {
      setState(periodId, 'hard-close');
      await request(app)
        .post(`/api/periods/${periodId}/reopen`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ reason: 'Adjusting entry needed' });

      const res = await request(app)
        .post('/api/gl/entries/bulk')
        .set('Authorization', `Bearer ${admin}`)
        .send(balancedPairPayload('Post-reopen entry', postDate));
      expect(res.status).toBe(201);
    });
  });
});
