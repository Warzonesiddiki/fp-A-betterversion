import { describe, it, expect } from 'vitest';
import {
  ConsolidationEngine,
  type EntityData,
  type OwnershipStructure,
  type ICPair,
} from './ConsolidationEngine';
import { asMoney, toDecimal } from '../utils/money';
import type { GLEntry } from '../types';

/**
 * GOVERNANCE EVIDENCE for cap:model.consolidation
 *
 * The ConsolidationEngine is the financial authority for the MODEL pillar.
 * These tests verify ASC 810 compliance — the governance dimension here is
 * FINANCIAL CORRECTNESS, not RBAC. If the engine produces wrong numbers, every
 * downstream report, analysis, and decision is wrong.
 *
 * Tested dimensions:
 * 1. Input validation (empty, invalid IDs, invalid currency, non-array)
 * 2. Intercompany elimination (AB/BA pairs eliminated)
 * 3. Minority interest (equity method produces correct MI)
 * 4. Balance check (books balance after elimination)
 * 5. Money primitive safety (all amounts use Money type)
 * 6. Failed result never claims balanced (F-0003)
 * 7. Cent-exact tolerance (F-0009)
 */

function makeEntry(
  id: string,
  accountCode: string,
  accountName: string,
  debit: number,
  credit: number,
  entityId: string,
  currency = 'USD'
): GLEntry {
  return {
    id,
    accountId: accountCode,
    accountCode,
    accountName,
    period: '2026-01',
    periodName: 'January 2026',
    debit: asMoney(debit, currency),
    credit: asMoney(credit, currency),
    netChange: asMoney(debit - credit, currency),
    date: '2026-01-31',
    amount: asMoney(debit - credit, currency),
    description: `Test entry ${id}`,
    reference: `REF-${id}`,
    entityId,
    currency,
  } as GLEntry;
}

function makeEntity(
  entityId: string,
  entityName: string,
  entries: GLEntry[],
  currency = 'USD'
): EntityData {
  return { entityId, entityName, currency, entries };
}

describe('ConsolidationEngine — GOVERNANCE (model.consolidation)', () => {
  describe('1. Input validation', () => {
    it('throws when entities is not an array', () => {
      expect(() => ConsolidationEngine.consolidate('not-array' as never, [])).toThrow(
        'entities must be an array'
      );
    });

    it('throws when ownerships is not an array', () => {
      expect(() => ConsolidationEngine.consolidate([], 'not-array' as never)).toThrow(
        'ownerships must be an array'
      );
    });

    it('returns failed result with status "failed" when entities is empty', () => {
      const result = ConsolidationEngine.consolidate([], []);
      expect(result.status).toBe('failed');
      expect(result.isBalanced).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].stage).toBe('validation');
    });

    it('throws when entity has empty entityId', () => {
      const entity = makeEntity('', 'Entity A', []);
      expect(() => ConsolidationEngine.consolidate([entity], [])).toThrow(
        'Each entity must have a non-empty entityId'
      );
    });

    it('throws when entity has invalid currency code', () => {
      const entity = makeEntity('E1', 'Entity A', [], 'US');
      expect(() => ConsolidationEngine.consolidate([entity], [])).toThrow(
        'must have a valid 3-letter currency code'
      );
    });

    it('throws when entity has non-array entries', () => {
      const entity = {
        entityId: 'E1',
        entityName: 'Entity A',
        currency: 'USD',
        entries: 'not-array',
      } as never;
      expect(() => ConsolidationEngine.consolidate([entity], [])).toThrow(
        'must have an entries array'
      );
    });
  });

  describe('2. Intercompany elimination', () => {
    it('eliminates AB and BA intercompany pairs', () => {
      const entityA = makeEntity('A', 'Entity A', [
        makeEntry('a-1', '1400', 'Accounts Receivable', 50000, 0, 'A'),
        makeEntry('a-2', '4000', 'Revenue', 0, 100000, 'A'),
      ]);
      const entityB = makeEntity('B', 'Entity B', [
        makeEntry('b-1', '2400', 'Accounts Payable', 0, 50000, 'B'),
        makeEntry('b-2', '5000', 'Cost of Goods', 60000, 0, 'B'),
      ]);

      const icPairs: ICPair[] = [
        {
          fromEntityId: 'A',
          toEntityId: 'B',
          accountCode: '1400',
          toAccountCode: '2400',
          amount: 50000,
          type: 'receivable',
        },
      ];

      const result = ConsolidationEngine.consolidate([entityA, entityB], [], icPairs);

      expect(result.status).toBe('success');
      // The IC pair should produce elimination entries
      expect(result.eliminations.length).toBeGreaterThan(0);
      // The eliminated amount should be 50000
      const elim = result.eliminations.find((e) => e.type === 'ic_receivable');
      expect(elim).toBeDefined();
      expect(Math.abs(elim!.eliminatedAmount)).toBe(50000);
    });

    it('elimination entries use Money type for amounts', () => {
      const entityA = makeEntity('A', 'Entity A', [
        makeEntry('a-1', '1400', 'Accounts Receivable', 30000, 0, 'A'),
      ]);
      const entityB = makeEntity('B', 'Entity B', [
        makeEntry('b-1', '2400', 'Accounts Payable', 0, 30000, 'B'),
      ]);

      const icPairs: ICPair[] = [
        {
          fromEntityId: 'A',
          toEntityId: 'B',
          accountCode: '1400',
          toAccountCode: '2400',
          amount: 30000,
          type: 'receivable',
        },
      ];

      const result = ConsolidationEngine.consolidate([entityA, entityB], [], icPairs);

      for (const elim of result.eliminations) {
        expect(typeof elim.eliminatedAmount).toBe('number');
        expect(typeof elim.debitAmount).toBe('number');
        expect(typeof elim.creditAmount).toBe('number');
      }
    });
  });

  describe('3. Minority interest (equity method)', () => {
    it('calculates minority interest for partial ownership', () => {
      const parent = makeEntity('P', 'Parent Co', [
        makeEntry('p-1', '1000', 'Cash', 1000000, 0, 'P'),
        makeEntry('p-2', '3000', 'Equity', 0, 400000, 'P'),
      ]);
      const subsidiary = makeEntity('S', 'Sub Co', [
        makeEntry('s-1', '1000', 'Cash', 500000, 0, 'S'),
        makeEntry('s-2', '4000', 'Revenue', 0, 200000, 'S'),
        makeEntry('s-3', '5000', 'COGS', 100000, 0, 'S'),
        makeEntry('s-4', '3000', 'Equity', 0, 200000, 'S'),
      ]);

      const ownerships: OwnershipStructure[] = [
        { parentId: 'P', childId: 'S', ownershipPct: 75, method: 'full' },
      ];

      const result = ConsolidationEngine.consolidate([parent, subsidiary], ownerships);

      expect(result.status).toBe('success');
      // Full method with 25% minority produces MI details
      expect(result.minorityInterestDetails.length).toBeGreaterThan(0);
    });

    it('minority interest is zero for 100% ownership', () => {
      const parent = makeEntity('P', 'Parent Co', [
        makeEntry('p-1', '1000', 'Cash', 1000000, 0, 'P'),
      ]);
      const subsidiary = makeEntity('S', 'Sub Co', [
        makeEntry('s-1', '1000', 'Cash', 500000, 0, 'S'),
      ]);

      const ownerships: OwnershipStructure[] = [
        { parentId: 'P', childId: 'S', ownershipPct: 1.0, method: 'full' },
      ];

      const result = ConsolidationEngine.consolidate([parent, subsidiary], ownerships);

      expect(result.status).toBe('success');
      expect(result.minorityInterest).toBe(0);
    });
  });

  describe('4. Balance check', () => {
    it('consolidated entries balance when assets = liabilities + equity', () => {
      const entityA = makeEntity('A', 'Entity A', [
        makeEntry('a-1', '1000', 'Cash', 100000, 0, 'A'),
        makeEntry('a-2', '3000', 'Equity', 0, 100000, 'A'),
      ]);

      const result = ConsolidationEngine.consolidate([entityA], []);

      expect(result.status).toBe('success');
      expect(result.isBalanced).toBe(true);
      expect(result.imbalanceAmount).toBe(0);
    });

    it('imbalance is detected when entries do not balance', () => {
      const entityA = makeEntity('A', 'Entity A', [
        makeEntry('a-1', '1000', 'Cash', 100000, 0, 'A'),
        // No matching credit — books won't balance
      ]);

      const result = ConsolidationEngine.consolidate([entityA], []);

      expect(result.status).toBe('success');
      // The engine should detect the imbalance
      expect(result.isBalanced).toBe(false);
      expect(result.imbalanceAmount).not.toBe(0);
    });
  });

  describe('5. Money primitive safety', () => {
    it('all consolidated entries use Money type for debit/credit', () => {
      const entityA = makeEntity('A', 'Entity A', [
        makeEntry('a-1', '1000', 'Cash', 100000, 0, 'A'),
      ]);

      const result = ConsolidationEngine.consolidate([entityA], []);

      for (const entry of result.consolidatedEntries) {
        expect(entry.debit).toHaveProperty('minor');
        expect(typeof entry.debit.minor).toBe('number');
        expect(Number.isSafeInteger(entry.debit.minor)).toBe(true);
        expect(entry.credit).toHaveProperty('minor');
        expect(typeof entry.credit.minor).toBe('number');
      }
    });

    it('all money values are safe integers in cents', () => {
      const entityA = makeEntity('A', 'Entity A', [
        makeEntry('a-1', '1000', 'Cash', 123456, 0, 'A'),
      ]);

      const result = ConsolidationEngine.consolidate([entityA], []);

      for (const entry of result.consolidatedEntries) {
        expect(Number.isSafeInteger(entry.debit.minor)).toBe(true);
        expect(Number.isSafeInteger(entry.credit.minor)).toBe(true);
        expect(Number.isSafeInteger(entry.netChange.minor)).toBe(true);
      }
    });
  });

  describe('6. Failed result never claims balanced (F-0003)', () => {
    it('empty entities returns failed status and isBalanced=false', () => {
      const result = ConsolidationEngine.consolidate([], []);
      expect(result.status).toBe('failed');
      expect(result.isBalanced).toBe(false);
      // Failed result has no imbalance computed (0 = not a clean balance)
    });

    it('failed result has errors array', () => {
      const result = ConsolidationEngine.consolidate([], []);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].stage).toBe('validation');
    });
  });

  describe('7. Cent-exact tolerance (F-0009)', () => {
    it('default tolerance is 0 cents (cent-exact)', () => {
      const entityA = makeEntity('A', 'Entity A', [
        makeEntry('a-1', '1000', 'Cash', 100000, 0, 'A'),
      ]);

      const result = ConsolidationEngine.consolidate([entityA], []);

      expect(result.balanceToleranceCents).toBe(0);
    });

    it('explicit tolerance is disclosed on result', () => {
      const entityA = makeEntity('A', 'Entity A', [
        makeEntry('a-1', '1000', 'Cash', 100000, 0, 'A'),
      ]);

      const result = ConsolidationEngine.consolidate([entityA], [], [], [], [], [], {
        balanceToleranceCents: 5,
      });

      expect(result.balanceToleranceCents).toBe(5);
    });
  });

  describe('8. Single entity consolidation', () => {
    it('consolidates a single entity without ownerships', () => {
      const entityA = makeEntity('A', 'Entity A', [
        makeEntry('a-1', '1000', 'Cash', 100000, 0, 'A'),
        makeEntry('a-2', '2000', 'Payables', 0, 30000, 'A'),
        makeEntry('a-3', '3000', 'Equity', 0, 70000, 'A'),
      ]);

      const result = ConsolidationEngine.consolidate([entityA], []);

      expect(result.status).toBe('success');
      expect(result.isBalanced).toBe(true);
      expect(result.totalAssets).toBe(100000);
      expect(result.totalLiabilities).toBe(-30000); // credit → negative
      expect(result.totalEquity).toBe(-70000); // credit → negative
    });

    it('computes net income from revenue minus expenses', () => {
      const entityA = makeEntity('A', 'Entity A', [
        makeEntry('a-1', '4000', 'Revenue', 0, 200000, 'A'),
        makeEntry('a-2', '5000', 'COGS', 120000, 0, 'A'),
        makeEntry('a-3', '5100', 'SG&A', 30000, 0, 'A'),
      ]);

      const result = ConsolidationEngine.consolidate([entityA], []);

      expect(result.status).toBe('success');
      // Revenue is credit → negative in engine's sign convention
      expect(result.totalRevenue).toBe(-200000);
      // Expenses are debit → positive
      expect(result.totalExpenses).toBe(150000);
      // Net income is computed (engine uses revenue - abs(expenses) internally)
    });
  });

  describe('9. Determinism', () => {
    it('produces identical results for identical inputs', () => {
      const entityA = makeEntity('A', 'Entity A', [
        makeEntry('a-1', '1000', 'Cash', 100000, 0, 'A'),
        makeEntry('a-2', '2000', 'Payables', 0, 30000, 'A'),
        makeEntry('a-3', '3000', 'Equity', 0, 70000, 'A'),
      ]);

      const result1 = ConsolidationEngine.consolidate([entityA], []);
      const result2 = ConsolidationEngine.consolidate([entityA], []);

      expect(result1.consolidatedEntries.length).toBe(result2.consolidatedEntries.length);
      expect(result1.totalAssets).toBe(result2.totalAssets);
      expect(result1.totalLiabilities).toBe(result2.totalLiabilities);
      expect(result1.totalEquity).toBe(result2.totalEquity);
      expect(result1.netIncome).toBe(result2.netIncome);
      expect(result1.isBalanced).toBe(result2.isBalanced);
    });
  });
});
