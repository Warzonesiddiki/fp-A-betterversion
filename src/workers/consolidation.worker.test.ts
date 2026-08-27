import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import type { WorkerResponse, ConsolidationResponse, ConsolidationRequest } from './types';

describe('consolidation.worker', () => {
  let postMessages: WorkerResponse[];

  const parentEntity = {
    entityId: 'P',
    entityName: 'Parent',
    currency: 'USD',
    isForeign: false,
    entries: [
      {
        id: 'p1',
        accountCode: '1000',
        accountName: 'Cash',
        amount: 5000,
        currency: 'USD',
        date: '2026-01-01',
        entityId: 'P',
      },
      {
        id: 'p2',
        accountCode: '4000',
        accountName: 'Revenue',
        amount: 10000,
        currency: 'USD',
        date: '2026-01-01',
        entityId: 'P',
      },
      {
        id: 'p3',
        accountCode: '5000',
        accountName: 'Expenses',
        amount: -6000,
        currency: 'USD',
        date: '2026-01-01',
        entityId: 'P',
      },
    ],
  };

  const subEntity = {
    entityId: 'S1',
    entityName: 'Subsidiary',
    currency: 'USD',
    isForeign: false,
    entries: [
      {
        id: 's1',
        accountCode: '1000',
        accountName: 'Cash',
        amount: 2000,
        currency: 'USD',
        date: '2026-01-01',
        entityId: 'S1',
      },
      {
        id: 's2',
        accountCode: '4000',
        accountName: 'Revenue',
        amount: 5000,
        currency: 'USD',
        date: '2026-01-01',
        entityId: 'S1',
      },
      {
        id: 's3',
        accountCode: '5000',
        accountName: 'Expenses',
        amount: -3000,
        currency: 'USD',
        date: '2026-01-01',
        entityId: 'S1',
      },
    ],
  };

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
    const result = postMessages.find((m) => m.type === 'result');
    return result?.payload as ConsolidationResponse | undefined;
  }

  function dispatch(req: ConsolidationRequest): void {
    self.onmessage?.(
      new MessageEvent('message', {
        data: { id: 'consolidation', type: 'compute', payload: req },
      })
    );
  }

  function lastError(): string | undefined {
    return postMessages.find((m) => m.type === 'error')?.error;
  }

  describe('basic consolidation', () => {
    it('consolidates two entities', () => {
      const result = runConsolidation({
        entities: [parentEntity, subEntity],
        ownerships: [{ parentId: 'P', childId: 'S1', ownershipPct: 100, method: 'full' }],
      });
      expect(result?.totalRevenue).toBe(15000);
      expect(result?.totalExpenses).toBe(-9000);
      expect(result?.netIncome).toBe(6000);
      expect(result?.totalAssets).toBe(7000);
    });

    it('returns zero values for empty entities', () => {
      const result = runConsolidation({ entities: [], ownerships: [] });
      expect(result?.totalAssets).toBe(0);
      expect(result?.totalRevenue).toBe(0);
      expect(result?.netIncome).toBe(0);
      expect(result?.consolidatedEntries).toEqual([]);
      expect(result?.isBalanced).toBe(true);
    });
  });

  describe('intercompany elimination', () => {
    it('eliminates intercompany receivables/payables', () => {
      const result = runConsolidation({
        entities: [
          {
            entityId: 'A',
            entityName: 'A',
            currency: 'USD',
            isForeign: false,
            entries: [
              {
                id: 'a1',
                accountCode: '9001',
                accountName: 'IC Receivable',
                amount: 1000,
                currency: 'USD',
                date: '2026-01-01',
                entityId: 'A',
              },
            ],
          },
          {
            entityId: 'B',
            entityName: 'B',
            currency: 'USD',
            isForeign: false,
            entries: [
              {
                id: 'b1',
                accountCode: '9001',
                accountName: 'IC Payable',
                amount: -1000,
                currency: 'USD',
                date: '2026-01-01',
                entityId: 'B',
              },
            ],
          },
        ],
        ownerships: [{ parentId: 'A', childId: 'B', ownershipPct: 100, method: 'full' }],
        icPairs: [
          {
            fromEntityId: 'A',
            toEntityId: 'B',
            accountCode: '9001',
            amount: 1000,
            type: 'receivable',
          },
        ],
      });
      expect(result?.eliminationCount).toBeGreaterThanOrEqual(1);
    });
  });
  describe('W6-P1: counted eliminations must actually be applied', () => {
    function icEntry(id: string, entityId: string, amount: number, currency = 'USD') {
      return {
        id,
        accountCode: '9001',
        accountName: 'IC Balance',
        amount,
        currency,
        date: '2026-01-01',
        entityId,
      };
    }

    function amountsOn9001(result: ConsolidationResponse | undefined): number[] {
      return (result?.consolidatedEntries ?? [])
        .filter((e) => e.accountCode === '9001')
        .map((e) => e.amount)
        .sort((a, b) => a - b);
    }

    it('applies auto-detected 9-prefix eliminations exactly once without explicit icPairs', () => {
      const result = runConsolidation({
        entities: [
          {
            entityId: 'A',
            entityName: 'A',
            currency: 'USD',
            isForeign: false,
            entries: [icEntry('a9', 'A', 500)],
          },
          {
            entityId: 'B',
            entityName: 'B',
            currency: 'USD',
            isForeign: false,
            entries: [icEntry('b9', 'B', -300)],
          },
        ],
        ownerships: [],
      });
      expect(result?.eliminationCount).toBe(1);
      // Matched 300 (min(500,300)) removed from both legs; A keeps a +200
      // residual visible, B nets to 0 and drops out.
      expect(amountsOn9001(result)).toEqual([200]);
    });

    it('keeps an unmatched IC balance fully gross', () => {
      const result = runConsolidation({
        entities: [
          {
            entityId: 'A',
            entityName: 'A',
            currency: 'USD',
            isForeign: false,
            entries: [icEntry('a9', 'A', 400)],
          },
          { entityId: 'B', entityName: 'B', currency: 'USD', isForeign: false, entries: [] },
        ],
        ownerships: [],
      });
      expect(result?.eliminationCount).toBe(0);
      expect(amountsOn9001(result)).toEqual([400]);
    });

    it('eliminates an explicitly paired balanced IC position exactly once', () => {
      const result = runConsolidation({
        entities: [
          {
            entityId: 'A',
            entityName: 'A',
            currency: 'USD',
            isForeign: false,
            entries: [icEntry('a9', 'A', 1000)],
          },
          {
            entityId: 'B',
            entityName: 'B',
            currency: 'USD',
            isForeign: false,
            entries: [icEntry('b9', 'B', -1000)],
          },
        ],
        ownerships: [],
        icPairs: [
          {
            fromEntityId: 'A',
            toEntityId: 'B',
            accountCode: '9001',
            amount: 1000,
            type: 'receivable',
          },
        ],
      });
      expect(result?.eliminationCount).toBe(1);
      expect(amountsOn9001(result)).toEqual([]);
    });

    it('eliminates only the matched amount of a partial IC pair, leaving the residual gross', () => {
      const result = runConsolidation({
        entities: [
          {
            entityId: 'A',
            entityName: 'A',
            currency: 'USD',
            isForeign: false,
            entries: [icEntry('a9', 'A', 100)],
          },
          {
            entityId: 'B',
            entityName: 'B',
            currency: 'USD',
            isForeign: false,
            entries: [icEntry('b9', 'B', -60)],
          },
        ],
        ownerships: [],
        icPairs: [
          {
            fromEntityId: 'A',
            toEntityId: 'B',
            accountCode: '9001',
            amount: 60,
            type: 'receivable',
          },
        ],
      });
      expect(result?.eliminationCount).toBe(1);
      // Old behaviour subtracted both legs in full (nothing left); the fix
      // removes only the matched 60, keeping A's +40 excess visible.
      expect(amountsOn9001(result)).toEqual([40]);
    });

    it('matches auto-detected IC balances per currency only', () => {
      const result = runConsolidation({
        entities: [
          {
            entityId: 'A',
            entityName: 'A',
            currency: 'USD',
            isForeign: false,
            entries: [icEntry('a9u', 'A', 100), icEntry('a9e', 'A', 80, 'EUR')],
          },
          {
            entityId: 'B',
            entityName: 'B',
            currency: 'USD',
            isForeign: false,
            entries: [icEntry('b9u', 'B', -70)],
          },
        ],
        ownerships: [],
      });
      // Only the USD legs match (min(100,70)=70); the EUR leg has no EUR
      // counterparty and stays gross.
      expect(result?.eliminationCount).toBe(1);
      expect(amountsOn9001(result)).toEqual([30, 80]);
    });
  });

  describe('minority interest', () => {
    it('calculates minority interest for 80% ownership', () => {
      const result = runConsolidation({
        entities: [parentEntity, subEntity],
        ownerships: [{ parentId: 'P', childId: 'S1', ownershipPct: 80, method: 'full' }],
      });
      const minorityExpected = 0.2 * (5000 - 3000);
      expect(result?.minorityInterest).toBeCloseTo(minorityExpected, 1);
    });

    it('returns zero minority for 100% ownership', () => {
      const result = runConsolidation({
        entities: [parentEntity, subEntity],
        ownerships: [{ parentId: 'P', childId: 'S1', ownershipPct: 100, method: 'full' }],
      });
      expect(result?.minorityInterest).toBe(0);
    });
  });

  describe('FX translation', () => {
    it('translates foreign entity to USD', () => {
      const foreignEntity = {
        entityId: 'F1',
        entityName: 'Foreign Sub',
        currency: 'EUR',
        isForeign: true,
        entries: [
          {
            id: 'f1',
            accountCode: '1000',
            accountName: 'Cash',
            amount: 1000,
            currency: 'EUR',
            date: '2026-01-01',
            entityId: 'F1',
          },
          {
            id: 'f2',
            accountCode: '4000',
            accountName: 'Revenue',
            amount: 500,
            currency: 'EUR',
            date: '2026-01-01',
            entityId: 'F1',
          },
        ],
      };
      const result = runConsolidation({
        entities: [parentEntity, foreignEntity],
        ownerships: [{ parentId: 'P', childId: 'F1', ownershipPct: 100, method: 'full' }],
        fxRates: [
          {
            fromCurrency: 'EUR',
            toCurrency: 'USD',
            rate: 1.1,
            rateType: 'spot',
            date: '2026-01-01',
          },
          {
            fromCurrency: 'EUR',
            toCurrency: 'USD',
            rate: 1.08,
            rateType: 'average',
            date: '2026-01-01',
          },
          {
            fromCurrency: 'EUR',
            toCurrency: 'USD',
            rate: 1.05,
            rateType: 'historical',
            date: '2026-01-01',
          },
        ],
      });
      expect(result?.totalAssets).toBeGreaterThan(5000);
    });

    it('errors when a foreign entity has no FX rates at all', () => {
      const foreignEntity = {
        entityId: 'F1',
        entityName: 'Foreign Sub',
        currency: 'EUR',
        isForeign: true,
        entries: [
          {
            id: 'f1',
            accountCode: '1000',
            accountName: 'Cash',
            amount: 1000,
            currency: 'EUR',
            date: '2026-01-01',
            entityId: 'F1',
          },
        ],
      };
      dispatch({
        entities: [parentEntity, foreignEntity],
        ownerships: [{ parentId: 'P', childId: 'F1', ownershipPct: 100, method: 'full' }],
        fxRates: [],
      });
      // F-0001: no rates must never mean rate 1 — the worker replies with a
      // structured error instead of mixing untranslated EUR into USD totals.
      expect(postMessages.find((m) => m.type === 'result')).toBeUndefined();
      expect(lastError()).toBe('Missing FX rate for EUR\u2192USD (spot)');
    });

    it('errors instead of falling back to rate 1 when only some rate types exist', () => {
      const foreignEntity = {
        entityId: 'F1',
        entityName: 'Foreign Sub',
        currency: 'EUR',
        isForeign: true,
        entries: [
          {
            id: 'f1',
            accountCode: '1000',
            accountName: 'Cash',
            amount: 1000,
            currency: 'EUR',
            date: '2026-01-01',
            entityId: 'F1',
          },
          {
            id: 'f2',
            accountCode: '4000',
            accountName: 'Revenue',
            amount: 500,
            currency: 'EUR',
            date: '2026-01-01',
            entityId: 'F1',
          },
        ],
      };
      dispatch({
        entities: [parentEntity, foreignEntity],
        ownerships: [],
        fxRates: [
          {
            fromCurrency: 'EUR',
            toCurrency: 'USD',
            rate: 1.1,
            rateType: 'spot',
            date: '2026-01-01',
          },
        ],
      });
      // Spot covers assets, but revenue needs the average rate. Pre-fix this
      // silently translated revenue at 1.0.
      expect(postMessages.find((m) => m.type === 'result')).toBeUndefined();
      expect(lastError()).toBe('Missing FX rate for EUR\u2192USD (average)');
    });

    it('errors naming the historical type when equity lacks its rate', () => {
      const foreignEntity = {
        entityId: 'F1',
        entityName: 'Foreign Sub',
        currency: 'EUR',
        isForeign: true,
        entries: [
          {
            id: 'f1',
            accountCode: '3000',
            accountName: 'Common Stock',
            amount: 800,
            currency: 'EUR',
            date: '2026-01-01',
            entityId: 'F1',
          },
        ],
      };
      dispatch({
        entities: [parentEntity, foreignEntity],
        ownerships: [],
        fxRates: [
          {
            fromCurrency: 'EUR',
            toCurrency: 'USD',
            rate: 1.1,
            rateType: 'spot',
            date: '2026-01-01',
          },
          {
            fromCurrency: 'EUR',
            toCurrency: 'USD',
            rate: 1.08,
            rateType: 'average',
            date: '2026-01-01',
          },
        ],
      });
      expect(postMessages.find((m) => m.type === 'result')).toBeUndefined();
      expect(lastError()).toBe('Missing FX rate for EUR\u2192USD (historical)');
    });

    it('does not translate domestic entities and does not require FX rates for them', () => {
      const result = runConsolidation({
        entities: [parentEntity],
        ownerships: [],
        fxRates: [],
      });
      expect(result?.totalAssets).toBe(5000);
      expect(lastError()).toBeUndefined();
    });
  });

  describe('adjustments', () => {
    it('applies manual adjustments', () => {
      const result = runConsolidation({
        entities: [parentEntity],
        ownerships: [],
        adjustments: [
          {
            accountCode: '1000',
            accountName: 'Goodwill',
            entityId: 'P',
            debitAmount: 500,
            creditAmount: 0,
            description: 'Goodwill',
            type: 'goodwill',
          },
        ],
      });
      expect(result?.totalAssets).toBe(5500);
    });
  });

  describe('error handling', () => {
    it('handles missing payload gracefully', () => {
      self.onmessage?.(
        new MessageEvent('message', {
          data: { id: 'err', type: 'compute', payload: null },
        })
      );
      expect(postMessages.find((m) => m.type === 'error')).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // W7E / W6-P1: request validation before math
  // ---------------------------------------------------------------------------
  describe('W7E/W6-P1 request validation', () => {
    function singleEntityWith(amount: number): ConsolidationRequest {
      return {
        entities: [
          {
            entityId: 'A',
            entityName: 'A',
            currency: 'USD',
            isForeign: false,
            entries: [
              {
                id: 'a1',
                accountCode: '1000',
                accountName: 'Cash',
                amount,
                currency: 'USD',
                date: '2026-01-01',
                entityId: 'A',
              },
            ],
          },
        ],
        ownerships: [],
      };
    }

    function dispatch(req: unknown): void {
      self.onmessage?.(
        new MessageEvent('message', { data: { id: 'w7e', type: 'compute', payload: req } })
      );
    }

    it('rejects entity entries with NaN amounts instead of returning NaN totals', () => {
      // Pre-fix: NaN flowed into the Decimal money layer and poisoned every
      // total silently; the worker replied with a "successful" result.
      dispatch(singleEntityWith(Number.NaN));
      const error = postMessages.find((m) => m.type === 'error');
      expect(error?.error).toMatch(/amount/i);
    });

    it('rejects icPairs with non-finite amounts', () => {
      dispatch({
        ...singleEntityWith(100),
        icPairs: [
          {
            fromEntityId: 'A',
            toEntityId: 'A',
            accountCode: '9001',
            amount: Number.POSITIVE_INFINITY,
            type: 'receivable',
          },
        ],
      });
      const error = postMessages.find((m) => m.type === 'error');
      expect(error?.error).toMatch(/icPairs/i);
    });

    it('rejects fx rates that are not finite numbers', () => {
      dispatch({
        ...singleEntityWith(100),
        fxRates: [
          {
            fromCurrency: 'EUR',
            toCurrency: 'USD',
            rate: Number.NaN,
            rateType: 'spot',
            date: '2026-01-01',
          },
        ],
      });
      const error = postMessages.find((m) => m.type === 'error');
      expect(error?.error).toMatch(/fxRates/i);
    });

    it('null envelope data produces exactly one error reply, no crash', () => {
      expect(() => self.onmessage?.(new MessageEvent('message', { data: null }))).not.toThrow();
      const errors = postMessages.filter((m) => m.type === 'error');
      expect(errors.length).toBe(1);
    });
  });
});
