/**
 * GAP-1 (F-0006) known-answer tests for the consolidation worker's money
 * migration.
 *
 * The worker performs ASC 810 consolidation math on currency-bearing GL
 * entries: FX translation (amount × rate), intercompany elimination sums,
 * minority interest, adjustment nets, category totals, and the balance
 * check — previously raw `*`, `+`, `-` over IEEE-754 doubles. Progress
 * percentages, elimination counts, and ownership percentages are not
 * money. Each fixed input asserts the exact result with `toBe`; the
 * pre-migration IEEE-754 output is recorded inline.
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import type { WorkerResponse, ConsolidationResponse, ConsolidationRequest } from './types';

function entry(id: string, entityId: string, accountCode: string, amount: number) {
  return {
    id,
    accountCode,
    accountName: `Account ${accountCode}`,
    amount,
    currency: 'USD',
    date: '2026-01-01',
    entityId,
  };
}

function entity(
  entityId: string,
  entries: ReturnType<typeof entry>[],
  currency = 'USD',
  isForeign = false
) {
  return { entityId, entityName: entityId, currency, isForeign, entries };
}

describe('consolidation.worker — money known answers (GAP-1 / F-0006)', () => {
  let postMessages: WorkerResponse[];

  beforeAll(async () => {
    postMessages = [];
    vi.spyOn(self, 'postMessage').mockImplementation((msg) => {
      postMessages.push(msg as WorkerResponse);
    });
    await import('./consolidation.worker');
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    postMessages = [];
  });

  function runConsolidation(req: ConsolidationRequest): ConsolidationResponse | undefined {
    self.onmessage?.(
      new MessageEvent('message', {
        data: { id: 'consolidation', type: 'compute', payload: req },
      })
    );
    return postMessages.find((m) => m.type === 'result')?.payload as
      | ConsolidationResponse
      | undefined;
  }

  it('translates foreign amounts with exact decimal products (old float: 0.11000000000000001)', () => {
    const result = runConsolidation({
      entities: [
        entity('F1', [entry('f1', 'F1', '1000', 0.1), entry('f2', 'F1', '4000', 0.2)], 'EUR', true),
      ],
      ownerships: [],
      fxRates: [
        { fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.1, rateType: 'spot', date: '2026-01-01' },
        {
          fromCurrency: 'EUR',
          toCurrency: 'USD',
          rate: 1.1,
          rateType: 'average',
          date: '2026-01-01',
        },
        {
          fromCurrency: 'EUR',
          toCurrency: 'USD',
          rate: 1.1,
          rateType: 'historical',
          date: '2026-01-01',
        },
      ],
    });

    // 0.1 × 1.1 = 0.11 exact; old float: 0.11000000000000001.
    expect(result?.totalAssets).toBe(0.11);
    expect(result?.totalRevenue).toBe(0.22);
  });

  it('eliminates intercompany balances with exact sums (old float: -0.20000000000000004)', () => {
    const result = runConsolidation({
      entities: [
        entity('A', [entry('a1', 'A', '9001', 0.1), entry('a2', 'A', '9001', 0.2)]),
        entity('B', [entry('b1', 'B', '9001', -0.3)]),
      ],
      ownerships: [{ parentId: 'A', childId: 'B', ownershipPct: 100, method: 'full' }],
      icPairs: [
        {
          fromEntityId: 'A',
          toEntityId: 'B',
          accountCode: '9001',
          amount: 0.3,
          type: 'receivable',
        },
      ],
    });

    // From-side sum 0.1 + 0.2 = 0.3 (old: 0.30000000000000004); elimination
    // adjustment −0.3 applied to entries 0.1 → −0.2 and 0.2 → −0.1 (old:
    // −0.20000000000000004, −0.1). The to-side entry −0.3 gets +0.3 and nets
    // to exactly 0, so it drops out of the consolidated entries.
    const amounts = result?.consolidatedEntries.map((e) => e.amount) ?? [];
    expect(amounts).toEqual([-0.2, -0.1]);
    expect(result?.eliminationCount).toBeGreaterThanOrEqual(1);
  });

  it('computes minority interest with exact products (old float: 0.04000000000000001)', () => {
    const result = runConsolidation({
      entities: [
        entity('P', [entry('p1', 'P', '1000', 0.1)]),
        entity('S1', [
          entry('s1', 'S1', '4000', 0.1),
          entry('s2', 'S1', '4000', 0.2),
          entry('s3', 'S1', '5000', -0.05),
          entry('s4', 'S1', '5000', -0.05),
        ]),
      ],
      ownerships: [{ parentId: 'P', childId: 'S1', ownershipPct: 80, method: 'full' }],
    });

    // Net income 0.3 − 0.1 = 0.2 (old: 0.20000000000000004); 20% share =
    // 0.04 (old: 0.04000000000000001).
    expect(result?.minorityInterest).toBe(0.04);
    expect(result?.netIncome).toBe(0.2);
  });

  it('nets manual adjustments exactly (old float: 0.19999999999999998 / 0.30000000000000004)', () => {
    const result = runConsolidation({
      entities: [entity('P', [entry('p1', 'P', '1000', 0.1)])],
      ownerships: [],
      adjustments: [
        {
          accountCode: '1000',
          accountName: 'Adjustment',
          entityId: 'P',
          debitAmount: 0.3,
          creditAmount: 0.1,
          description: 'Test adjustment',
          type: 'goodwill',
        },
      ],
    });

    // Adjustment net 0.3 − 0.1 = 0.2 (old: 0.19999999999999998); entry 0.1 +
    // 0.2 = 0.3 (old: 0.30000000000000004).
    expect(result?.totalAssets).toBe(0.3);
    expect(result?.consolidatedEntries[0]?.amount).toBe(0.3);
  });

  it('computes net income with exact totals (old float: 0.39999999999999997)', () => {
    const result = runConsolidation({
      entities: [entity('P', [entry('p1', 'P', '4000', 0.6), entry('p2', 'P', '5000', -0.2)])],
      ownerships: [],
    });

    expect(result?.totalRevenue).toBe(0.6);
    expect(result?.totalExpenses).toBe(-0.2);
    expect(result?.netIncome).toBe(0.4);
  });

  it('reports an exact zero imbalance for perfectly offsetting books (old float: 5.551115123125783e-17)', () => {
    const result = runConsolidation({
      entities: [
        entity('P', [
          entry('p1', 'P', '1000', 0.1),
          entry('p2', 'P', '1000', 0.2),
          entry('p3', 'P', '2000', -0.3),
        ]),
      ],
      ownerships: [],
    });

    // 0.1 + 0.2 − 0.3 sums to exactly 0 (old float left a 5.55e-17 phantom
    // imbalance); the books are balanced in both, but the reported imbalance
    // amount must be exactly 0.
    expect(result?.imbalanceAmount).toBe(0);
    expect(result?.isBalanced).toBe(true);
  });

  it('reports an exact non-zero imbalance when books do not balance (old float: 0.6000000000000001)', () => {
    const result = runConsolidation({
      entities: [
        entity('P', [
          entry('p1', 'P', '1000', 0.3),
          entry('p2', 'P', '2000', 0.1),
          entry('p3', 'P', '3000', 0.2),
        ]),
      ],
      ownerships: [],
    });

    expect(result?.imbalanceAmount).toBe(0.6);
    expect(result?.isBalanced).toBe(false);
  });

  it('returns exact zero aggregates for empty input (control)', () => {
    const result = runConsolidation({ entities: [], ownerships: [] });

    expect(result?.totalAssets).toBe(0);
    expect(result?.totalRevenue).toBe(0);
    expect(result?.netIncome).toBe(0);
    expect(result?.minorityInterest).toBe(0);
    expect(result?.imbalanceAmount).toBe(0);
    expect(result?.isBalanced).toBe(true);
    expect(result?.consolidatedEntries).toEqual([]);
  });
});
