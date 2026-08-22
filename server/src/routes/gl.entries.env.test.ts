import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import { JWT_SECRET } from '../config/env.js';
import { db } from '../db/connection.js';

/**
 * W0.2 environment scoping on GET /api/gl/entries (wave-3 lane R11).
 *
 * The listing previously filtered by tenant_id only and ignored
 * environment_id, so same-tenant Dev/UAT rows cross-appeared in every
 * client hydration. Semantics pinned here:
 *
 *   - environment_id provided  -> EXACT match (ge.environment_id = ?).
 *     No DEFAULT-coalescing: a row stamped 'dev' — explicitly or via the
 *     column's NOT NULL DEFAULT 'dev' that bulk/single INSERTs rely on —
 *     must satisfy ONLY a 'dev' request, never 'uat'/'prod'.
 *   - environment_id absent    -> tenant-wide across environments.
 *     tenant_id stays the W0.2 security boundary; environment_id is the
 *     promotion dimension, so callers not passing the param keep their
 *     current superset view instead of failing closed to an empty ledger.
 */

const TENANT_A = 'tenant-gl-env-a';
const TENANT_B = 'tenant-gl-env-b';

const ACCOUNT_ID = '10000000-0000-0000-0000-00000000e001';
const EQUITY_ID = '10000000-0000-0000-0000-00000000e0e1';
const ENTITY_ID = '20000000-0000-0000-0000-00000000ee01';

// One id per seeded posting so list assertions are exact-set comparisons.
const ID_DEV_1 = '41000000-0000-0000-0000-00000000d001';
const ID_DEV_2 = '41000000-0000-0000-0000-00000000d002';
const ID_DEFAULT_DEV = '41000000-0000-0000-0000-00000000d0df'; // relies on column DEFAULT 'dev'
const ID_UAT_1 = '41000000-0000-0000-0000-00000000u001';
const ID_UAT_2 = '41000000-0000-0000-0000-00000000u002';
const ID_TENANT_B_UAT = '41000000-0000-0000-0000-00000000b001';

function tokenFor(id: string, email: string, tenantId?: string): string {
  return jwt.sign({ id, email, role: 'Admin', ...(tenantId ? { tenantId } : {}) }, JWT_SECRET, {
    expiresIn: '15m',
  });
}

describe('GL entries environment_id filtering (W0.2 wave-3 R11)', () => {
  let tokenA: string;
  let tokenB: string;

  beforeAll(() => {
    // Real-SQLite FK enforcement: audit_log.user_id references users.
    for (const [id, email] of [
      ['gl-env-a', 'gl-env-a@finplan.test'],
      ['gl-env-b', 'gl-env-b@finplan.test'],
    ]) {
      db.prepare(
        `INSERT OR REPLACE INTO users (id, email, password_hash, first_name, last_name, role, is_active)
         VALUES (?, ?, 'not-a-real-hash', 'Env', 'Probe', 'Admin', 1)`
      ).run(id, email);
    }

    db.prepare(
      `INSERT OR REPLACE INTO accounts (id, name, code, type, is_active)
       VALUES (?, 'Env Probe Account', 'EACC-1', 'Asset', 1)`
    ).run(ACCOUNT_ID);
    db.prepare(
      `INSERT OR REPLACE INTO accounts (id, name, code, type, is_active)
       VALUES (?, 'Env Probe Equity', 'EEQ-1', 'Equity', 1)`
    ).run(EQUITY_ID);
    db.prepare(
      `INSERT OR REPLACE INTO entities (id, name, code, is_active)
       VALUES (?, 'Env Probe Entity', 'EENT-1', 1)`
    ).run(ENTITY_ID);

    // Direct seeds (the API write paths cannot set environment_id yet): two
    // environments inside tenant A plus a default-stamped row and a foreign-
    // tenant row sharing A's requested environment.
    const seedEntry = (
      id: string,
      tenantId: string,
      environmentId: string | null,
      amount: number
    ): void => {
      if (environmentId === null) {
        // Omits the column so SQLite fills NOT NULL DEFAULT 'dev' — exactly
        // what a bulk INSERT produces today.
        db.prepare(
          `INSERT OR REPLACE INTO gl_entries (id, tenant_id, account_id, entity_id, post_date, amount, debit, credit)
           VALUES (?, ?, ?, ?, '2026-04-01', ?, ?, 0)`
        ).run(id, tenantId, ACCOUNT_ID, ENTITY_ID, amount, amount);
      } else {
        db.prepare(
          `INSERT OR REPLACE INTO gl_entries (id, tenant_id, environment_id, account_id, entity_id, post_date, amount, debit, credit)
           VALUES (?, ?, ?, ?, ?, '2026-04-01', ?, ?, 0)`
        ).run(id, tenantId, environmentId, ACCOUNT_ID, ENTITY_ID, amount, amount);
      }
    };

    seedEntry(ID_DEV_1, TENANT_A, 'dev', 110);
    seedEntry(ID_DEV_2, TENANT_A, 'dev', 120);
    seedEntry(ID_DEFAULT_DEV, TENANT_A, null, 130);
    seedEntry(ID_UAT_1, TENANT_A, 'uat', 210);
    seedEntry(ID_UAT_2, TENANT_A, 'uat', 220);
    seedEntry(ID_TENANT_B_UAT, TENANT_B, 'uat', 990);

    tokenA = tokenFor('gl-env-a', 'gl-env-a@finplan.test', TENANT_A);
    tokenB = tokenFor('gl-env-b', 'gl-env-b@finplan.test', TENANT_B);
  });

  function idsOf(body: unknown): Set<string> {
    return new Set((body as { data: { id: string }[] }).data.map((row) => row.id));
  }

  it("environment_id='dev' lists only dev rows — explicit and default-stamped alike, never uat", async () => {
    const res = await request(app)
      .get('/api/gl/entries')
      .query({ environment_id: 'dev' })
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    const ids = idsOf(res.body);
    expect(ids.has(ID_DEV_1)).toBe(true);
    expect(ids.has(ID_DEV_2)).toBe(true);
    expect(ids.has(ID_DEFAULT_DEV)).toBe(true); // stored value IS 'dev'
    expect(ids.has(ID_UAT_1)).toBe(false);
    expect(ids.has(ID_UAT_2)).toBe(false);
    expect((res.body as { total: number }).total).toBe(3);
  });

  it("environment_id='uat' never leaks dev/default-stamped rows (no DEFAULT coalescing)", async () => {
    const res = await request(app)
      .get('/api/gl/entries')
      .query({ environment_id: 'uat' })
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    const ids = idsOf(res.body);
    expect(ids.has(ID_UAT_1)).toBe(true);
    expect(ids.has(ID_UAT_2)).toBe(true);
    expect(ids.has(ID_DEV_1)).toBe(false);
    expect(ids.has(ID_DEV_2)).toBe(false);
    expect(ids.has(ID_DEFAULT_DEV)).toBe(false);
    expect((res.body as { total: number }).total).toBe(2);
  });

  it('an unknown environment yields an exact-match empty page, not a fallback to everything', async () => {
    const res = await request(app)
      .get('/api/gl/entries')
      .query({ environment_id: 'prod' })
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect((res.body as { total: number }).total).toBe(0);
  });

  it('PINNED semantics: absent environment_id stays tenant-wide across environments (not fail-closed-empty)', async () => {
    const res = await request(app)
      .get('/api/gl/entries')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    const ids = idsOf(res.body);
    for (const expected of [ID_DEV_1, ID_DEV_2, ID_DEFAULT_DEV, ID_UAT_1, ID_UAT_2]) {
      expect(ids.has(expected)).toBe(true);
    }
    // Tenant remains the hard boundary even without an env param.
    expect(ids.has(ID_TENANT_B_UAT)).toBe(false);
  });

  it('a matching environment never crosses the tenant boundary', async () => {
    const listA = await request(app)
      .get('/api/gl/entries')
      .query({ environment_id: 'uat' })
      .set('Authorization', `Bearer ${tokenA}`);
    expect(idsOf(listA.body).has(ID_TENANT_B_UAT)).toBe(false);

    const listB = await request(app)
      .get('/api/gl/entries')
      .query({ environment_id: 'uat' })
      .set('Authorization', `Bearer ${tokenB}`);
    expect(listB.status).toBe(200);
    const idsB = idsOf(listB.body);
    expect(idsB.has(ID_TENANT_B_UAT)).toBe(true);
    expect(idsB.has(ID_UAT_1)).toBe(false);
    expect(idsB.has(ID_UAT_2)).toBe(false);
  });

  it('keeps the response shape identical ({data,total,limit,offset}) with filtering applied', async () => {
    const filtered = await request(app)
      .get('/api/gl/entries')
      .query({ environment_id: 'uat', limit: '1', offset: '0' })
      .set('Authorization', `Bearer ${tokenA}`);
    expect(filtered.status).toBe(200);
    expect(Object.keys(filtered.body as object).sort()).toEqual(['data', 'limit', 'offset', 'total']);
    expect((filtered.body as { limit: number }).limit).toBe(1);
    // Total still counts ALL matching rows beyond the page size.
    expect((filtered.body as { total: number }).total).toBe(2);
    expect((filtered.body as { data: unknown[] }).data).toHaveLength(1);
  });
});
