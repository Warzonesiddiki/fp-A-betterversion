/**
 * GAP-1 (F-0006) known-answer tests for the server trial-balance money
 * migration.
 *
 * `computeTrialBalanceTotals` aggregates per-account debit/credit totals
 * (currency) that arrive from SQLite as IEEE-754 REAL values — previously
 * raw `+=` and `-` over doubles. Each imported per-account sum is
 * cent-rounded with declared ROUND_HALF_UP semantics, then aggregated at
 * exact decimal precision via decimal.js (the same canonical engine behind
 * `src/utils/money.ts`; the server package cannot import across the repo's
 * package boundary). The `balanced` tolerance threshold (0.01) is unchanged
 * policy. Each fixed input asserts the exact result with `toBe`; the
 * pre-migration IEEE-754 output is recorded inline.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import { JWT_SECRET } from '../config/env.js';
import { computeTrialBalanceTotals } from './gl.js';

function row(debit: number, credit: number): Record<string, unknown> {
  return { total_debit: debit, total_credit: credit };
}

describe('computeTrialBalanceTotals — money known answers (GAP-1 / F-0006)', () => {
  it('sums drifted per-account totals exactly (old float: 0.6000000000000001 / 0.5000000000000001)', () => {
    // SQLite SUM(0.1, 0.2) = 0.30000000000000004 per account; the JS side
    // previously accumulated those floats.
    const totals = computeTrialBalanceTotals([row(0.30000000000000004, 0.1), row(0.3, 0)]);

    expect(totals.debit).toBe(0.6);
    expect(totals.credit).toBe(0.1);
    expect(totals.difference).toBe(0.5);
    expect(totals.balanced).toBe(false);
  });

  it('reports an exact zero difference for offsetting books (old float: 5.551115123125783e-17)', () => {
    const totals = computeTrialBalanceTotals([row(0.30000000000000004, 0.3)]);

    expect(totals.difference).toBe(0);
    expect(totals.balanced).toBe(true);
  });

  it('rounds imported half-cent sums with declared half-up (old float: 1.005)', () => {
    const totals = computeTrialBalanceTotals([row(1.005, 0)]);

    expect(totals.debit).toBe(1.01);
  });

  it('sums multi-account decimals exactly (old float: 0.30000000000000004)', () => {
    const totals = computeTrialBalanceTotals([row(0.1, 0), row(0.2, 0)]);

    expect(totals.debit).toBe(0.3);
    expect(totals.difference).toBe(0.3);
    expect(totals.balanced).toBe(false);
  });

  it('returns exact zero totals for an empty row set (control)', () => {
    const totals = computeTrialBalanceTotals([]);

    expect(totals.debit).toBe(0);
    expect(totals.credit).toBe(0);
    expect(totals.difference).toBe(0);
    expect(totals.balanced).toBe(true);
  });
});

describe('GET /api/gl/trial-balance — totals contract (GAP-1 / F-0006)', () => {
  let viewerToken: string;

  beforeAll(() => {
    viewerToken = jwt.sign(
      { id: 'viewer-id', email: 'viewer@finplan.test', role: 'Viewer' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
  });

  it('returns the same totals shape on the no-visible-entities branch as the populated path', async () => {
    // A Viewer with no entity rows gets entityFilter = [] — the route's
    // early-return branch. It previously answered `debits/credits/balance`;
    // it must answer `debit/credit/difference/balanced` like the main path
    // (contract inconsistency flagged in GAP_LEDGER 2026-08-04, fixed).
    const res = await request(app)
      .get('/api/gl/trial-balance')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.accounts).toEqual([]);
    expect(res.body.totals).toEqual({
      debit: 0,
      credit: 0,
      difference: 0,
      balanced: true,
    });
  });
});
