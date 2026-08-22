import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import { JWT_SECRET } from '../config/env.js';
import { db } from '../db/connection.js';
import {
  assertThreeStatementsPass,
  checkAssetsEqualsLiabilitiesPlusEquity,
  checkCashFlowTiesToBalanceSheetCash,
  checkNetIncomeToRetainedEarnings,
  computeEntityLedgerTotals,
  evaluateThreeStatements,
  ThreeStatementGateError,
} from './threeStatementGate.js';

/**
 * W0.3 dedicated gate tests.
 *
 * Covers:
 *  - TS1/TS2/TS3 pure checks (known answers incl. exact-zero control)
 *  - evaluateThreeStatements aggregating ALL violations
 *  - ThreeStatementGateError structured payload naming identity + delta
 *  - Runtime enforcement on POST /api/gl/entries: a violating single-sided
 *    write is blocked with 422 / FP-0300 AND rolled back (row not persisted),
 *    while a balanced write succeeds.
 */

const TENANT = 'tenant-gate-a';
const ENTITY_ID = '20000000-0000-0000-0000-00000000f001';
const ASSET_ID = '10000000-0000-0000-0000-00000000f001';
const EQUITY_ID = '10000000-0000-0000-0000-00000000f002';

function tokenFor(id: string): string {
  return jwt.sign(
    { id, email: `${id}@finplan.test`, role: 'Admin', tenantId: TENANT },
    JWT_SECRET,
    {
      expiresIn: '15m',
    }
  );
}

describe('pure three-statement checks', () => {
  it('TS3 passes when Assets = Liabilities + Equity', () => {
    expect(
      checkAssetsEqualsLiabilitiesPlusEquity({ assets: 500, liabilities: 300, equity: 200 })
    ).toBeNull();
  });

  it('TS3 reports identity + delta when the balance sheet breaks', () => {
    const v = checkAssetsEqualsLiabilitiesPlusEquity({
      assets: 500,
      liabilities: 300,
      equity: 100,
    });
    expect(v).not.toBeNull();
    expect(v?.errorCode).toBe('FP-0300');
    expect(v?.identity).toBe('Assets = Liabilities + Equity');
    expect(v?.delta).toBe(100);
    expect(v?.httpStatus).toBe(422);
  });

  it('TS1 passes when closing RE = opening RE + NI − dividends', () => {
    expect(
      checkNetIncomeToRetainedEarnings({
        netIncome: 80,
        openingRetainedEarnings: 100,
        closingRetainedEarnings: 170,
        dividends: 10,
      })
    ).toBeNull();
  });

  it('TS1 reports a broken NI->RE link with delta', () => {
    const v = checkNetIncomeToRetainedEarnings({
      netIncome: 80,
      openingRetainedEarnings: 100,
      closingRetainedEarnings: 150,
      dividends: 10,
    });
    expect(v?.check).toBe('TS1');
    expect(v?.errorCode).toBe('FP-0302');
    expect(v?.identity).toContain('retained earnings');
    expect(v?.delta).toBe(-20);
  });

  it('TS2 ties cash-flow ending cash to balance-sheet cash', () => {
    expect(
      checkCashFlowTiesToBalanceSheetCash({ cashFlowEndingCash: 42.5, balanceSheetCash: 42.5 })
    ).toBeNull();
    const v = checkCashFlowTiesToBalanceSheetCash({
      cashFlowEndingCash: 42.5,
      balanceSheetCash: 40,
    });
    expect(v?.check).toBe('TS2');
    expect(v?.errorCode).toBe('FP-0301');
    expect(v?.delta).toBeCloseTo(2.5, 6);
  });

  it('evaluateThreeStatements collects ALL violations, not first-only', () => {
    const result = evaluateThreeStatements({
      balanceSheet: { assets: 10, liabilities: 0, equity: 0 },
      cashTie: { cashFlowEndingCash: 5, balanceSheetCash: 1 },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.map((v) => v.check).sort()).toEqual(['TS2', 'TS3']);
    }
  });

  it('evaluateThreeStatements passes an empty snapshot (nothing to check)', () => {
    expect(evaluateThreeStatements({}).ok).toBe(true);
  });

  it('assertThreeStatementsPass throws a structured gate error', () => {
    try {
      assertThreeStatementsPass({ balanceSheet: { assets: 9, liabilities: 4, equity: 4 } });
      expect.unreachable('gate must throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ThreeStatementGateError);
      const payload = (err as ThreeStatementGateError).toPayload()[0] as {
        error: Record<string, unknown>;
      };
      expect(payload.error.code).toBe('FP-0300');
      expect(payload.error.identity).toBe('Assets = Liabilities + Equity');
      expect(payload.error.delta).toBe(1);
    }
  });
});

describe('computeEntityLedgerTotals', () => {
  it('maps the full closed account-type vocabulary onto the open-ledger sides', () => {
    // Integer cents in (the SQL layer sums ROUND(x*100) AS INTEGER); natural-
    // side currency out. The fixture IS balanced under the open-ledger
    // identity: Assets + Expenses (700 + 500) = Liabilities + Equity + Revenue
    // (250 + 800 + 150) = 1200, covering all seven schema types.
    const totals = computeEntityLedgerTotals([
      { type: 'Asset', net_cents: 60000 },
      { type: 'CapEx', net_cents: 10000 },
      { type: 'COGS', net_cents: 20000 },
      { type: 'OpEx', net_cents: 30000 },
      { type: 'Liability', net_cents: -25000 },
      { type: 'Equity', net_cents: -80000 },
      { type: 'Revenue', net_cents: -15000 },
    ]);
    expect(totals).toEqual({
      assets: 700,
      liabilities: 250,
      equity: 800,
      revenue: 150,
      expenses: 500,
    });
  });

  it('fails closed on a type outside the closed vocabulary (no silent drop)', () => {
    try {
      computeEntityLedgerTotals([{ type: 'Contraption', net_cents: 12345 }]);
      expect.unreachable('unmapped account type must fail closed');
    } catch (err) {
      expect(err).toBeInstanceOf(ThreeStatementGateError);
      const payload = (err as ThreeStatementGateError).toPayload()[0] as {
        error: { code: string; details: { unmappedType: string } };
      };
      expect(payload.error.code).toBe('FP-0303');
      expect(payload.error.details.unmappedType).toBe('Contraption');
    }
  });

  it('returns zeros for an empty ledger (exact zero control)', () => {
    const totals = computeEntityLedgerTotals([]);
    expect(totals.assets).toBe(0);
    expect(totals.liabilities).toBe(0);
    expect(totals.equity).toBe(0);
    expect(totals.revenue).toBe(0);
    expect(totals.expenses).toBe(0);
  });
});

describe('runtime gate on GL writes (violation-blocking case)', () => {
  let token: string;

  beforeAll(() => {
    db.prepare(
      `INSERT OR REPLACE INTO users (id, email, password_hash, first_name, last_name, role, is_active)
       VALUES ('gate-user', 'gate-user@finplan.test', 'not-a-real-hash', 'Gate', 'Probe', 'Admin', 1)`
    ).run();
    db.prepare(
      `INSERT OR REPLACE INTO accounts (id, name, code, type, is_active) VALUES (?, 'Gate Asset', 'GATE-A', 'Asset', 1)`
    ).run(ASSET_ID);
    db.prepare(
      `INSERT OR REPLACE INTO accounts (id, name, code, type, is_active) VALUES (?, 'Gate Equity', 'GATE-E', 'Equity', 1)`
    ).run(EQUITY_ID);
    db.prepare(
      `INSERT OR REPLACE INTO entities (id, name, code, is_active) VALUES (?, 'Gate Entity', 'GATE-ENT', 1)`
    ).run(ENTITY_ID);
    token = tokenFor('gate-user');
  });

  const entryBody = (overrides: Record<string, unknown>) => ({
    account_id: EQUITY_ID,
    entity_id: ENTITY_ID,
    post_date: '2026-03-01',
    amount: 100,
    ...overrides,
  });

  it('BLOCKS a single-sided write with 422 / FP-0300 naming identity + delta, and rolls it back', async () => {
    const res = await request(app)
      .post('/api/gl/entries')
      .set('Authorization', `Bearer ${token}`)
      .send(entryBody({ account_id: ASSET_ID, debit: 100, credit: 0 }));

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('Three-statement gate violation');
    expect(res.body.code).toBe('FP-0300');
    const violation = res.body.violations[0].error;
    expect(violation.identity).toContain('Assets = Liabilities + Equity');
    expect(violation.delta).toBe(100);

    // Blocking means blocking: the candidate row must not exist.
    const persisted = db
      .prepare('SELECT COUNT(*) AS n FROM gl_entries WHERE entity_id = ?')
      .get(ENTITY_ID) as {
      n: number;
    };
    expect(persisted.n).toBe(0);
  });

  it('ACCEPTS a balanced Dr/Cr write that keeps the books intact', async () => {
    const res = await request(app)
      .post('/api/gl/entries/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({
        entries: [
          {
            account_id: ASSET_ID,
            entity_id: ENTITY_ID,
            post_date: '2026-03-02',
            amount: 250,
            debit: 250,
            credit: 0,
          },
          {
            account_id: EQUITY_ID,
            entity_id: ENTITY_ID,
            post_date: '2026-03-02',
            amount: 250,
            debit: 0,
            credit: 250,
          },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.ids).toHaveLength(2);
  });

  it('ACCEPTS a balanced write carrying revenue AND expense activity (open-ledger identity)', async () => {
    // A + Exp = L + E + Rev: 100 + 50 = 0 + 0 + 150. Regression lock for the
    // W0.3-fix S0: under the previous `A − Exp` formulation this balanced
    // batch was falsely rejected with delta = −2·Exp = −100.
    const entityId = '20000000-0000-0000-0000-00000000f003';
    const revenueId = '10000000-0000-0000-0000-00000000f003';
    const expenseId = '10000000-0000-0000-0000-00000000f004';
    db.prepare(
      `INSERT OR REPLACE INTO entities (id, name, code, is_active) VALUES (?, 'Gate Entity P&L', 'GATE-ENT3', 1)`
    ).run(entityId);
    db.prepare(
      `INSERT OR REPLACE INTO accounts (id, name, code, type, is_active) VALUES (?, 'Gate Revenue', 'GATE-R', 'Revenue', 1)`
    ).run(revenueId);
    db.prepare(
      `INSERT OR REPLACE INTO accounts (id, name, code, type, is_active) VALUES (?, 'Gate Expense', 'GATE-X', 'OpEx', 1)`
    ).run(expenseId);

    const res = await request(app)
      .post('/api/gl/entries/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({
        entries: [
          {
            account_id: ASSET_ID,
            entity_id: entityId,
            post_date: '2026-03-06',
            amount: 100,
            debit: 100,
            credit: 0,
          },
          {
            account_id: revenueId,
            entity_id: entityId,
            post_date: '2026-03-06',
            amount: 150,
            debit: 0,
            credit: 150,
          },
          {
            account_id: expenseId,
            entity_id: entityId,
            post_date: '2026-03-06',
            amount: 50,
            debit: 50,
            credit: 0,
          },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.ids).toHaveLength(3);
  });

  it('BLOCKS an unbalanced bulk batch atomically (no partial persistence)', async () => {
    const res = await request(app)
      .post('/api/gl/entries/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({
        entries: [
          {
            account_id: ASSET_ID,
            entity_id: ENTITY_ID,
            post_date: '2026-03-03',
            amount: 60,
            debit: 60,
            credit: 0,
          },
          {
            account_id: EQUITY_ID,
            entity_id: ENTITY_ID,
            post_date: '2026-03-03',
            amount: 25,
            debit: 0,
            credit: 25,
          },
        ],
      });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('FP-0300');

    // The previously-balanced state (250/250) must be untouched — the whole
    // batch rolled back.
    const rows = db
      .prepare(
        `SELECT account_id, SUM(debit) AS d, SUM(credit) AS c FROM gl_entries
         WHERE entity_id = ? GROUP BY account_id ORDER BY account_id`
      )
      .all(ENTITY_ID) as Array<{ account_id: string; d: number; c: number }>;
    expect(rows).toHaveLength(2);
    const asset = rows.find((r) => r.account_id === ASSET_ID);
    const equity = rows.find((r) => r.account_id === EQUITY_ID);
    expect(asset?.d ?? 0).toBeCloseTo(250, 2);
    expect(equity?.c ?? 0).toBeCloseTo(250, 2);
  });

  it('replays the original commit for a repeated Idempotency-Key and conflicts on payload change', async () => {
    // K13/K27: a retried journal commit must never double-post.
    const entityId = '20000000-0000-0000-0000-00000000f004';
    db.prepare(
      `INSERT OR REPLACE INTO entities (id, name, code, is_active) VALUES (?, 'Gate Entity Idem', 'GATE-ENT4', 1)`
    ).run(entityId);

    const body = {
      entries: [
        {
          account_id: ASSET_ID,
          entity_id: entityId,
          post_date: '2026-03-09',
          amount: 70,
          debit: 70,
          credit: 0,
        },
        {
          account_id: EQUITY_ID,
          entity_id: entityId,
          post_date: '2026-03-09',
          amount: 70,
          debit: 0,
          credit: 70,
        },
      ],
    };
    const headers = { Authorization: `Bearer ${token}`, 'Idempotency-Key': 'idem-test-key-1' };

    const first = await request(app).post('/api/gl/entries/bulk').set(headers).send(body);
    expect(first.status).toBe(201);
    expect(first.body.replayed).toBe(false);
    const originalIds = first.body.ids as string[];

    const retry = await request(app).post('/api/gl/entries/bulk').set(headers).send(body);
    expect(retry.status).toBe(200);
    expect(retry.body.replayed).toBe(true);
    expect(retry.body.ids).toEqual(originalIds);

    // Same key, different payload -> the caller's bug surfaces as FP-0401
    // and NOTHING is posted for it.
    const conflict = await request(app)
      .post('/api/gl/entries/bulk')
      .set({ Authorization: `Bearer ${token}`, 'Idempotency-Key': 'idem-test-key-1' })
      .send({
        entries: [
          {
            account_id: ASSET_ID,
            entity_id: entityId,
            post_date: '2026-03-10',
            amount: 5,
            debit: 5,
            credit: 0,
          },
          {
            account_id: EQUITY_ID,
            entity_id: entityId,
            post_date: '2026-03-10',
            amount: 5,
            debit: 0,
            credit: 5,
          },
        ],
      });
    expect(conflict.status).toBe(409);
    expect(conflict.body.code).toBe('FP-0401');

    const count = db
      .prepare('SELECT COUNT(*) AS n FROM gl_entries WHERE entity_id = ?')
      .get(entityId) as { n: number };
    expect(count.n).toBe(2); // exactly the original pair — retries posted nothing
  });

  it('is non-disableable: no configuration path exists in the module surface', async () => {
    // Structural guard: the gate module exports no flag/toggle of any kind.
    const gateModule = await import('./threeStatementGate.js');
    const flagLike = Object.keys(gateModule).filter((k) =>
      /^(disable|enabled|skip|bypass|allow)/i.test(k)
    );
    expect(flagLike).toEqual([]);
  });
});

describe('runtime gate on GL DELETE (W0.3-fix HIGH regression)', () => {
  const ENTITY2_ID = '20000000-0000-0000-0000-00000000f002';
  let token: string;

  beforeAll(() => {
    db.prepare(
      `INSERT OR REPLACE INTO users (id, email, password_hash, first_name, last_name, role, is_active)
       VALUES ('gate-user', 'gate-user@finplan.test', 'not-a-real-hash', 'Gate', 'Probe', 'Admin', 1)`
    ).run();
    db.prepare(
      `INSERT OR REPLACE INTO entities (id, name, code, is_active) VALUES (?, 'Gate Entity 2', 'GATE-ENT2', 1)`
    ).run(ENTITY2_ID);
    token = tokenFor('gate-user');
  });

  async function postBalancedPair(amount: number): Promise<[string, string]> {
    const res = await request(app)
      .post('/api/gl/entries/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({
        entries: [
          {
            account_id: ASSET_ID,
            entity_id: ENTITY2_ID,
            post_date: '2026-03-04',
            amount,
            debit: amount,
            credit: 0,
          },
          {
            account_id: EQUITY_ID,
            entity_id: ENTITY2_ID,
            post_date: '2026-03-04',
            amount,
            debit: 0,
            credit: amount,
          },
        ],
      });
    expect(res.status).toBe(201);
    return (res.body as { ids: string[] }).ids as [string, string];
  }

  it('BLOCKS deleting one leg of a balanced pair (422 / FP-0300) and the pair survives', async () => {
    const [assetLeg, equityLeg] = await postBalancedPair(300);

    const del = await request(app)
      .delete(`/api/gl/entries/${assetLeg}`)
      .set('Authorization', `Bearer ${token}`);

    expect(del.status).toBe(422);
    expect(del.body.code).toBe('FP-0300');
    expect(del.body.violations[0].error.identity).toContain('Assets = Liabilities + Equity');
    expect(del.body.violations[0].error.delta).toBeCloseTo(-300, 2);

    // Rollback means BOTH legs are still there.
    const remaining = db
      .prepare('SELECT COUNT(*) AS n FROM gl_entries WHERE id IN (?, ?)')
      .get(assetLeg, equityLeg) as { n: number };
    expect(remaining.n).toBe(2);
  });

  it('ALLOWS a delete when the removal keeps the books balanced (self-offsetting entry)', async () => {
    // debit = credit on one entry contributes net zero to its account, so
    // removing it cannot break the identity.
    const res = await request(app)
      .post('/api/gl/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        account_id: ASSET_ID,
        entity_id: ENTITY2_ID,
        post_date: '2026-03-05',
        amount: 100,
        debit: 100,
        credit: 100,
      });
    expect(res.status).toBe(201);
    const neutralId = (res.body as { id: string }).id;

    const del = await request(app)
      .delete(`/api/gl/entries/${neutralId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(204);

    // W0.8.6 (K25): deletion is a TOMBSTONE — the row survives with
    // deleted_at set and an bumped version, so SOX 7-year retention holds.
    const tombstone = db
      .prepare('SELECT deleted_at, version FROM gl_entries WHERE id = ?')
      .get(neutralId) as { deleted_at: string | null; version: number } | undefined;
    expect(tombstone).toBeDefined();
    expect(tombstone!.deleted_at).not.toBeNull();
    expect(tombstone!.version).toBeGreaterThan(1);
  });

  it('returns 404 when re-deleting an already-tombstoned entry (no re-gate, no re-audit)', async () => {
    // A self-offsetting entry (debit = credit) can be removed without
    // disturbing the identity, so its tombstone is reachable in one step.
    const res = await request(app)
      .post('/api/gl/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        account_id: ASSET_ID,
        entity_id: ENTITY2_ID,
        post_date: '2026-03-07',
        amount: 40,
        debit: 40,
        credit: 40,
      });
    expect(res.status).toBe(201);
    const id = (res.body as { id: string }).id;

    const first = await request(app)
      .delete(`/api/gl/entries/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(first.status).toBe(204);

    const again = await request(app)
      .delete(`/api/gl/entries/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(again.status).toBe(404);
  });

  it('excludes tombstoned rows from trial-balance aggregates', async () => {
    // A self-offsetting entry inflates BOTH gross columns by its amount
    // while leaving its net balance at zero — so after tombstoning it, the
    // balance cannot detect the exclusion but Total Debit must drop by
    // exactly the entry's debit. That is the observable proof that the
    // aggregate skips deleted rows instead of silently keeping them.
    const res = await request(app)
      .post('/api/gl/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        account_id: ASSET_ID,
        entity_id: ENTITY2_ID,
        post_date: '2026-03-08',
        amount: 90,
        debit: 90,
        credit: 90,
      });
    expect(res.status).toBe(201);
    const id = (res.body as { id: string }).id;

    const posted = await request(app)
      .get('/api/gl/trial-balance')
      .set('Authorization', `Bearer ${token}`);
    const debitWithEntry = (
      posted.body.accounts as { account_id: string; total_debit: number }[]
    ).find((r) => r.account_id === ASSET_ID)!.total_debit;

    const del = await request(app)
      .delete(`/api/gl/entries/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(204);

    const after = await request(app)
      .get('/api/gl/trial-balance')
      .set('Authorization', `Bearer ${token}`);
    const debitAfterTombstone = (
      after.body.accounts as { account_id: string; total_debit: number }[]
    ).find((r) => r.account_id === ASSET_ID)!.total_debit;

    expect(debitWithEntry - debitAfterTombstone).toBeCloseTo(90, 2);
  });

  it('still returns 404 for an unknown or cross-tenant id before any gating', async () => {
    const res = await request(app)
      .delete('/api/gl/entries/00000000-0000-4000-8000-00000000f999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
