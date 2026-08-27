import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import { JWT_SECRET } from '../config/env.js';
import { db } from '../db/connection.js';

/**
 * W0.2 route-level cross-tenant leak test for the GL money path.
 *
 * Tenant identity is derived server-side from the JWT claim (never the
 * request body). Proves: writes are stamped with the caller's tenant,
 * reads/deletes/aggregates only touch that tenant's rows, and legacy tokens
 * without a claim fall back to DEFAULT_TENANT_ID rather than seeing others.
 */

const TENANT_A = 'tenant-gl-a';
const TENANT_B = 'tenant-gl-b';
const LEGACY = undefined; // token without a tenantId claim

const ACCOUNT_ID = '10000000-0000-0000-0000-00000000a001';
const EQUITY_ID = '10000000-0000-0000-0000-00000000a0e1';
const ENTITY_ID = '20000000-0000-0000-0000-00000000e001';

function tokenFor(id: string, email: string, tenantId?: string): string {
  return jwt.sign({ id, email, role: 'Admin', ...(tenantId ? { tenantId } : {}) }, JWT_SECRET, {
    expiresIn: '15m',
  });
}

describe('GL tenancy enforcement (W0.2)', () => {
  let tokenA: string;
  let tokenB: string;
  let tokenLegacy: string;

  beforeAll(() => {
    // Real-SQLite FK enforcement: audit_log.user_id references users.
    for (const [id, email] of [
      ['gl-ten-a', 'gl-ten-a@finplan.test'],
      ['gl-ten-b', 'gl-ten-b@finplan.test'],
      ['gl-ten-legacy', 'gl-ten-legacy@finplan.test'],
    ]) {
      db.prepare(
        `INSERT OR REPLACE INTO users (id, email, password_hash, first_name, last_name, role, is_active)
         VALUES (?, ?, 'not-a-real-hash', 'Tenancy', 'Probe', 'Admin', 1)`
      ).run(id, email);
    }

    db.prepare(
      `INSERT OR REPLACE INTO accounts (id, name, code, type, is_active)
       VALUES (?, 'Tenancy Probe Account', 'TACC-1', 'Asset', 1)`
    ).run(ACCOUNT_ID);
    // W0.3: the runtime three-statement gate blocks single-sided postings,
    // so probes book balanced Dr/Cr pairs against this equity account.
    db.prepare(
      `INSERT OR REPLACE INTO accounts (id, name, code, type, is_active)
       VALUES (?, 'Tenancy Probe Equity', 'TEQ-1', 'Equity', 1)`
    ).run(EQUITY_ID);
    db.prepare(
      `INSERT OR REPLACE INTO entities (id, name, code, is_active)
       VALUES (?, 'Tenancy Probe Entity', 'TENT-1', 1)`
    ).run(ENTITY_ID);

    tokenA = tokenFor('gl-ten-a', 'gl-ten-a@finplan.test', TENANT_A);
    tokenB = tokenFor('gl-ten-b', 'gl-ten-b@finplan.test', TENANT_B);
    tokenLegacy = tokenFor('gl-ten-legacy', 'gl-ten-legacy@finplan.test', LEGACY);
  });

  /** Post a balanced pair (Dr asset / Cr equity) — the gate rejects
   *  single-sided postings. Returns the primary entry id. */
  async function postEntry(token: string, amount: number): Promise<string> {
    const res = await request(app)
      .post('/api/gl/entries/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({
        entries: [
          {
            account_id: ACCOUNT_ID,
            entity_id: ENTITY_ID,
            post_date: '2026-02-10',
            amount,
            debit: amount,
            credit: 0,
          },
          {
            account_id: EQUITY_ID,
            entity_id: ENTITY_ID,
            post_date: '2026-02-10',
            amount,
            debit: 0,
            credit: amount,
          },
        ],
      });
    expect(res.status).toBe(201);
    return (res.body as { ids: string[] }).ids[0];
  }

  it('stamps writes with the caller tenant and hides them from other tenants', async () => {
    const idA = await postEntry(tokenA, 111);
    const idB = await postEntry(tokenB, 222);

    const stamp = db.prepare('SELECT tenant_id FROM gl_entries WHERE id = ?').get(idA) as {
      tenant_id: string;
    };
    expect(stamp.tenant_id).toBe(TENANT_A);

    const listA = await request(app)
      .get('/api/gl/entries')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(listA.status).toBe(200);
    const idsA = (listA.body.data as { id: string }[]).map((r) => r.id);
    expect(idsA).toContain(idA);
    expect(idsA).not.toContain(idB);

    const listB = await request(app)
      .get('/api/gl/entries')
      .set('Authorization', `Bearer ${tokenB}`);
    const idsB = (listB.body.data as { id: string }[]).map((r) => r.id);
    expect(idsB).toContain(idB);
    expect(idsB).not.toContain(idA);
  });

  it('scopes trial-balance aggregation to the caller tenant', async () => {
    // Tenant B books a CREDIT on the asset account, balanced by a debit on
    // equity (W0.3 gate requires balanced books), so its aggregate remains
    // distinguishable from A's (every other probe books debits on the asset).
    const resCredit = await request(app)
      .post('/api/gl/entries/bulk')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        entries: [
          {
            account_id: ACCOUNT_ID,
            entity_id: ENTITY_ID,
            post_date: '2026-02-12',
            amount: 500,
            debit: 0,
            credit: 500,
          },
          {
            account_id: EQUITY_ID,
            entity_id: ENTITY_ID,
            post_date: '2026-02-12',
            amount: 500,
            debit: 500,
            credit: 0,
          },
        ],
      });
    expect(resCredit.status).toBe(201);

    const tbB = await request(app)
      .get('/api/gl/trial-balance')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(tbB.status).toBe(200);
    const bAccount = (tbB.body.accounts as { account_id: string; total_credit: number }[]).find(
      (r) => r.account_id === ACCOUNT_ID
    );
    // Only tenant B's own postings may appear in its aggregate.
    expect(bAccount?.total_credit ?? 0).toBeCloseTo(500, 2);

    const tbA = await request(app)
      .get('/api/gl/trial-balance')
      .set('Authorization', `Bearer ${tokenA}`);
    const aAccount = (tbA.body.accounts as { account_id: string; total_credit: number }[]).find(
      (r) => r.account_id === ACCOUNT_ID
    );
    // A booked only debits; B's 500 credit must be invisible to A.
    expect(aAccount?.total_credit ?? 0).toBeCloseTo(0, 2);
  });

  it('refuses to delete another tenant entry', async () => {
    const idB = await postEntry(tokenB, 333);

    const del = await request(app)
      .delete(`/api/gl/entries/${idB}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(del.status).toBe(404);

    const stillThere = db.prepare('SELECT id FROM gl_entries WHERE id = ?').get(idB) as
      | { id: string }
      | undefined;
    expect(stillThere?.id).toBe(idB);
  });

  it('bulk writes inherit the caller tenant', async () => {
    const res = await request(app)
      .post('/api/gl/entries/bulk')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        entries: [
          {
            account_id: ACCOUNT_ID,
            entity_id: ENTITY_ID,
            post_date: '2026-02-11',
            amount: 10,
            debit: 10,
            credit: 0,
          },
          {
            account_id: ACCOUNT_ID,
            entity_id: ENTITY_ID,
            post_date: '2026-02-11',
            amount: 20,
            debit: 0,
            credit: 20,
          },
          {
            // Balancing leg so the batch passes the W0.3 three-statement gate
            // (net asset position −10 must be offset by equity).
            account_id: EQUITY_ID,
            entity_id: ENTITY_ID,
            post_date: '2026-02-11',
            amount: 10,
            debit: 10,
            credit: 0,
          },
        ],
      });
    expect(res.status).toBe(201);

    const ids = (res.body as { ids: string[] }).ids;
    const stamps = ids.map(
      (id) =>
        (
          db.prepare('SELECT tenant_id FROM gl_entries WHERE id = ?').get(id) as {
            tenant_id: string;
          }
        ).tenant_id
    );
    expect(new Set(stamps)).toEqual(new Set([TENANT_A]));
  });

  it('legacy tokens without a tenant claim fall back to the default tenant', async () => {
    const idLegacy = await postEntry(tokenLegacy, 444);

    const stamp = db.prepare('SELECT tenant_id FROM gl_entries WHERE id = ?').get(idLegacy) as {
      tenant_id: string;
    };
    expect(stamp.tenant_id).toBe('default');

    const listA = await request(app)
      .get('/api/gl/entries')
      .set('Authorization', `Bearer ${tokenA}`);
    const idsA = (listA.body.data as { id: string }[]).map((r) => r.id);
    expect(idsA).not.toContain(idLegacy);
  });
});
