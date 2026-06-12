/* eslint-disable @typescript-eslint/no-unused-vars */
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

  function getLastError(): string | undefined {
    const errorMsg = postMessages.find((m) => m.type === 'error');
    return errorMsg?.error;
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

    it('returns untranslated when no FX rates provided', () => {
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
      const result = runConsolidation({
        entities: [parentEntity, foreignEntity],
        ownerships: [{ parentId: 'P', childId: 'F1', ownershipPct: 100, method: 'full' }],
        fxRates: [],
      });
      expect(result?.totalAssets).toBe(5000 + 1000);
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
});
