import { describe, it, expect } from 'vitest';
import {
  ConsolidationEngine,
  type EntityData,
  type OwnershipStructure,
  type ICPair,
  type EliminationEntry,
  type FXRate,
  type VIENotification,
} from './ConsolidationEngine';
import type { GLEntry } from '@/types';

// =============================================================================
// TEST HELPERS
// =============================================================================

function createEntry(
  id: string,
  accountCode: string,
  accountName: string,
  amount: number,
  entityId: string,
  currency = 'USD'
): GLEntry {
  return {
    id,
    accountId: id,
    accountCode,
    accountName,
    period: '2024-01',
    periodName: '2024-01',
    debit: amount,
    credit: 0,
    netChange: amount,
    date: '2024-01-01',
    amount,
    description: '',
    reference: id,
    entityId,
    currency,
  };
}

function createParent(entries: GLEntry[] = []): EntityData {
  return { entityId: 'parent', entityName: 'Parent Corp', currency: 'USD', entries };
}

function createSubsidiary(
  id: string,
  name: string,
  entries: GLEntry[] = [],
  isForeign = false,
  currency = 'USD'
): EntityData {
  return { entityId: id, entityName: name, currency, entries, isForeign };
}

function createOwnership(
  parentId: string,
  childId: string,
  ownershipPct: number,
  method: 'full' | 'equity' | 'cost' = 'full'
): OwnershipStructure {
  return { parentId, childId, ownershipPct, method };
}

function createICPair(
  from: string,
  to: string,
  accountCode: string,
  amount: number,
  type: ICPair['type'] = 'receivable'
): ICPair {
  return { fromEntityId: from, toEntityId: to, accountCode, amount, type };
}

// =============================================================================
// CONSOLIDATION ENGINE TESTS
// =============================================================================

describe('ConsolidationEngine', () => {
  // =========================================================================
  // BASIC CONSOLIDATION TESTS
  // =========================================================================

  describe('consolidate - basic', () => {
    it('should return a failed (never falsely balanced) result for empty entities', () => {
      // F-0003: the old assertion (isBalanced: true on an empty zero result)
      // certified the error-swallowing defect. Empty input is a blocking
      // failure with an explicit error list.
      const result = ConsolidationEngine.consolidate([], [], []);
      expect(result.consolidatedEntries).toHaveLength(0);
      expect(result.eliminations).toHaveLength(0);
      expect(result.minorityInterest).toBe(0);
      expect(result.totalEquity).toBe(0);
      expect(result.status).toBe('failed');
      expect(result.isBalanced).toBe(false);
    });

    it('should consolidate a single entity', () => {
      const entries = [
        createEntry('1', '1000', 'Cash', 10000, 'ent1'),
        createEntry('2', '4000', 'Revenue', 5000, 'ent1'),
        createEntry('3', '5000', 'Expense', -3000, 'ent1'),
      ];
      const entities = [createParent(entries)];
      const result = ConsolidationEngine.consolidate(entities, [], []);

      expect(result.consolidatedEntries).toHaveLength(3);
      expect(result.totalAssets).toBe(10000);
      expect(result.totalRevenue).toBe(5000);
      expect(result.totalExpenses).toBe(-3000);
      expect(result.netIncome).toBe(2000);
    });

    it('should consolidate parent + subsidiary', () => {
      const parentEntries = [
        createEntry('p1', '1000', 'Cash', 50000, 'parent'),
        createEntry('p2', '4000', 'Revenue', 100000, 'parent'),
        createEntry('p3', '5000', 'Expense', -60000, 'parent'),
      ];
      const subEntries = [
        createEntry('s1', '1000', 'Cash', 20000, 'sub'),
        createEntry('s2', '4000', 'Revenue', 40000, 'sub'),
        createEntry('s3', '5000', 'Expense', -25000, 'sub'),
      ];

      const entities = [
        createParent(parentEntries),
        createSubsidiary('sub', 'Sub Inc', subEntries),
      ];
      const ownerships = [createOwnership('parent', 'sub', 80)];

      const result = ConsolidationEngine.consolidate(entities, ownerships, []);

      expect(result.totalAssets).toBe(70000); // 50000 + 20000
      expect(result.totalRevenue).toBe(140000); // 100000 + 40000
      expect(result.totalExpenses).toBe(-85000); // -60000 + -25000
      expect(result.netIncome).toBe(55000);
      expect(result.minorityInterestDetails).toHaveLength(1);
    });

    it('should consolidate multiple subsidiaries', () => {
      const parentEntries = [createEntry('p1', '1000', 'Cash', 100000, 'parent')];
      const sub1Entries = [createEntry('s1', '1000', 'Cash', 30000, 'sub1')];
      const sub2Entries = [createEntry('s2', '1000', 'Cash', 40000, 'sub2')];

      const entities = [
        createParent(parentEntries),
        createSubsidiary('sub1', 'Sub 1', sub1Entries),
        createSubsidiary('sub2', 'Sub 2', sub2Entries),
      ];
      const ownerships = [
        createOwnership('parent', 'sub1', 80),
        createOwnership('parent', 'sub2', 60),
      ];

      const result = ConsolidationEngine.consolidate(entities, ownerships, []);

      expect(result.totalAssets).toBe(170000);
      expect(result.minorityInterestDetails).toHaveLength(2);
    });

    it('should handle entities with no entries', () => {
      const entities = [createParent([]), createSubsidiary('sub', 'Empty Sub', [])];
      const ownerships = [createOwnership('parent', 'sub', 100)];

      const result = ConsolidationEngine.consolidate(entities, ownerships, []);

      expect(result.consolidatedEntries).toHaveLength(0);
      expect(result.totalAssets).toBe(0);
      expect(result.isBalanced).toBe(true);
    });
  });

  // =========================================================================
  // ELIMINATION ENTRY TESTS
  // =========================================================================

  describe('eliminateIntercompany', () => {
    it('should eliminate IC receivables/payables', () => {
      const entries = [
        createEntry('a', '1100', 'IC Receivable', 500, 'parent'),
        createEntry('b', '1100', 'IC Payable', -500, 'sub'),
      ];
      const icPairs = [createICPair('parent', 'sub', '1100', 500, 'receivable')];

      const result = ConsolidationEngine.eliminateIntercompany(entries, icPairs);

      expect(result).toHaveLength(1);
      expect(result![0]!.eliminatedAmount).toBe(-500);
      expect(result![0]!.type).toBe('ic_receivable');
    });

    it('should eliminate IC revenue/expense', () => {
      const entries = [
        createEntry('a', '4100', 'IC Revenue', 1000, 'parent'),
        createEntry('b', '4100', 'IC Expense', -1000, 'sub'),
      ];
      const icPairs = [createICPair('parent', 'sub', '4100', 1000, 'revenue')];

      const result = ConsolidationEngine.eliminateIntercompany(entries, icPairs);

      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('should eliminate IC loans', () => {
      const entries = [
        createEntry('a', '1200', 'Loan Receivable', 5000, 'parent'),
        createEntry('b', '1200', 'Loan Payable', -5000, 'sub'),
      ];
      const icPairs = [createICPair('parent', 'sub', '1200', 5000, 'loan')];

      const result = ConsolidationEngine.eliminateIntercompany(entries, icPairs);

      expect(result).toHaveLength(1);
      expect(result![0]!.type).toBe('ic_loan');
    });

    it('should eliminate IC dividends', () => {
      const entries = [
        createEntry('a', '3200', 'Dividend Income', 500, 'parent'),
        createEntry('b', '3200', 'Dividend Declared', -500, 'sub'),
      ];
      const icPairs = [createICPair('parent', 'sub', '3200', 500, 'dividend')];

      const result = ConsolidationEngine.eliminateIntercompany(entries, icPairs);

      expect(result).toHaveLength(1);
      expect(result![0]!.type).toBe('ic_dividend');
    });

    it('should eliminate IC investment', () => {
      const entries = [
        createEntry('a', '1500', 'Investment in Sub', 80000, 'parent'),
        createEntry('b', '3000', 'Common Stock', -50000, 'sub'),
        createEntry('c', '3100', 'Retained Earnings', -30000, 'sub'),
      ];
      const icPairs = [createICPair('parent', 'sub', '1500', 80000, 'investment')];

      const result = ConsolidationEngine.eliminateIntercompany(entries, icPairs);

      expect(result).toHaveLength(1);
      expect(result![0]!.type).toBe('ic_investment');
    });

    it('should auto-detect IC accounts with 9 prefix', () => {
      const entries = [
        createEntry('a', '9000', 'IC Sales', 1000, 'parent'),
        createEntry('b', '9000', 'IC Purchases', -1000, 'sub'),
      ];

      const result = ConsolidationEngine.eliminateIntercompany(entries, []);

      expect(result).toHaveLength(1);
      expect(result![0]!.type).toBe('auto');
      expect(result![0]!.eliminatedAmount).toBe(-1000);
    });

    it('should handle multiple IC pairs', () => {
      const entries = [
        createEntry('a', '1100', 'IC Receivable', 300, 'parent'),
        createEntry('b', '1100', 'IC Payable', -300, 'sub'),
        createEntry('c', '1200', 'Loan Receivable', 1000, 'parent'),
        createEntry('d', '1200', 'Loan Payable', -1000, 'sub'),
      ];
      const icPairs = [
        createICPair('parent', 'sub', '1100', 300, 'receivable'),
        createICPair('parent', 'sub', '1200', 1000, 'loan'),
      ];

      const result = ConsolidationEngine.eliminateIntercompany(entries, icPairs);

      expect(result).toHaveLength(2);
    });

    it('should return empty when no IC matches', () => {
      const entries = [createEntry('a', '1100', 'AR', 500, 'entA')];
      const icPairs = [createICPair('entA', 'entB', '9999', 100, 'receivable')];

      const result = ConsolidationEngine.eliminateIntercompany(entries, icPairs);

      expect(result).toHaveLength(0);
    });

    it('should handle unbalanced IC pairs (partial elimination)', () => {
      const entries = [
        createEntry('a', '1100', 'IC Receivable', 500, 'parent'),
        createEntry('b', '1100', 'IC Payable', -300, 'sub'),
      ];
      const icPairs = [createICPair('parent', 'sub', '1100', 500, 'receivable')];

      const result = ConsolidationEngine.eliminateIntercompany(entries, icPairs);

      expect(result).toHaveLength(1);
      // Should eliminate the matched portion (300)
      expect(Math.abs(result![0]!.eliminatedAmount)).toBe(300);
    });

    it('should not double-eliminate via auto-detection after manual pairs', () => {
      const entries = [
        createEntry('a', '9000', 'IC Sales', 1000, 'parent'),
        createEntry('b', '9000', 'IC Purchases', -1000, 'sub'),
      ];
      const icPairs = [createICPair('parent', 'sub', '9000', 1000, 'revenue')];

      const result = ConsolidationEngine.eliminateIntercompany(entries, icPairs);

      // Should only have 1 elimination, not 2
      expect(result).toHaveLength(1);
    });
  });

  // =========================================================================
  // MINORITY INTEREST TESTS
  // =========================================================================

  describe('calculateMinorityInterestDetails', () => {
    it('should calculate minority interest for 80% ownership', () => {
      const subEntries = [
        createEntry('s1', '4000', 'Revenue', 10000, 'sub'),
        createEntry('s2', '5000', 'Expense', -4000, 'sub'),
      ];
      const entityMap = new Map([['sub', createSubsidiary('sub', 'Sub Inc', subEntries)]]);
      const ownerships = [createOwnership('parent', 'sub', 80)];

      const result = ConsolidationEngine.calculateMinorityInterestDetails(
        [createSubsidiary('sub', 'Sub Inc', subEntries)],
        ownerships,
        entityMap
      );

      expect(result).toHaveLength(1);
      expect(result![0]!.minorityPct).toBe(20);
      expect(result![0]!.netIncome).toBeCloseTo(1200, 2); // 20% of 6000
      expect(result![0]!.endingBalance).toBeCloseTo(1200, 2);
    });

    it('should return 0 minority interest for 100% ownership', () => {
      const subEntries = [createEntry('s1', '4000', 'Revenue', 10000, 'sub')];
      const entityMap = new Map([['sub', createSubsidiary('sub', 'Sub Inc', subEntries)]]);
      const ownerships = [createOwnership('parent', 'sub', 100)];

      const result = ConsolidationEngine.calculateMinorityInterestDetails(
        [createSubsidiary('sub', 'Sub Inc', subEntries)],
        ownerships,
        entityMap
      );

      expect(result).toHaveLength(0);
    });

    it('should calculate minority interest for 60% ownership', () => {
      const subEntries = [
        createEntry('s1', '4000', 'Revenue', 50000, 'sub'),
        createEntry('s2', '5000', 'Expense', -30000, 'sub'),
      ];
      const entityMap = new Map([['sub', createSubsidiary('sub', 'Sub Inc', subEntries)]]);
      const ownerships = [createOwnership('parent', 'sub', 60)];

      const result = ConsolidationEngine.calculateMinorityInterestDetails(
        [createSubsidiary('sub', 'Sub Inc', subEntries)],
        ownerships,
        entityMap
      );

      expect(result).toHaveLength(1);
      expect(result![0]!.minorityPct).toBe(40);
      expect(result![0]!.endingBalance).toBeCloseTo(8000, 2); // 40% of 20000
    });

    it('should handle negative net income (loss)', () => {
      const subEntries = [
        createEntry('s1', '4000', 'Revenue', 10000, 'sub'),
        createEntry('s2', '5000', 'Expense', -15000, 'sub'),
      ];
      const entityMap = new Map([['sub', createSubsidiary('sub', 'Sub Inc', subEntries)]]);
      const ownerships = [createOwnership('parent', 'sub', 70)];

      const result = ConsolidationEngine.calculateMinorityInterestDetails(
        [createSubsidiary('sub', 'Sub Inc', subEntries)],
        ownerships,
        entityMap
      );

      expect(result).toHaveLength(1);
      expect(result![0]!.endingBalance).toBeCloseTo(-1500, 2); // 30% of -5000
    });

    it('should handle multiple subsidiaries', () => {
      const sub1Entries = [createEntry('s1', '4000', 'Revenue', 10000, 'sub1')];
      const sub2Entries = [createEntry('s2', '4000', 'Revenue', 20000, 'sub2')];
      const entityMap = new Map([
        ['sub1', createSubsidiary('sub1', 'Sub 1', sub1Entries)],
        ['sub2', createSubsidiary('sub2', 'Sub 2', sub2Entries)],
      ]);
      const ownerships = [
        createOwnership('parent', 'sub1', 80),
        createOwnership('parent', 'sub2', 60),
      ];

      const result = ConsolidationEngine.calculateMinorityInterestDetails(
        [
          createSubsidiary('sub1', 'Sub 1', sub1Entries),
          createSubsidiary('sub2', 'Sub 2', sub2Entries),
        ],
        ownerships,
        entityMap
      );

      expect(result).toHaveLength(2);
      expect(result![0]!.minorityPct).toBe(20);
      expect(result![1]!.minorityPct).toBe(40);
    });

    it('should skip non-full consolidation methods', () => {
      const subEntries = [createEntry('s1', '4000', 'Revenue', 10000, 'sub')];
      const entityMap = new Map([['sub', createSubsidiary('sub', 'Sub Inc', subEntries)]]);
      const ownerships = [createOwnership('parent', 'sub', 30, 'equity')];

      const result = ConsolidationEngine.calculateMinorityInterestDetails(
        [createSubsidiary('sub', 'Sub Inc', subEntries)],
        ownerships,
        entityMap
      );

      expect(result).toHaveLength(0);
    });

    it('should handle dividends deduction', () => {
      const subEntries = [
        createEntry('s1', '4000', 'Revenue', 10000, 'sub'),
        createEntry('s2', '5000', 'Expense', -4000, 'sub'),
        createEntry('s3', '3200', 'Dividends Declared', -1000, 'sub'),
      ];
      const entityMap = new Map([['sub', createSubsidiary('sub', 'Sub Inc', subEntries)]]);
      const ownerships = [createOwnership('parent', 'sub', 80)];

      const result = ConsolidationEngine.calculateMinorityInterestDetails(
        [createSubsidiary('sub', 'Sub Inc', subEntries)],
        ownerships,
        entityMap
      );

      expect(result).toHaveLength(1);
      // Net income = 10000 - 4000 = 6000, dividends = 1000
      // Minority interest = 20% × (6000 - 1000) = 1000
      expect(result![0]!.endingBalance).toBeCloseTo(1000, 2);
    });
  });

  describe('calculateMinorityInterest (simple)', () => {
    it('should calculate minority interest for 80% ownership', () => {
      expect(ConsolidationEngine.calculateMinorityInterest(1000, 80)).toBeCloseTo(200, 10);
    });

    it('should return 0 for 100% ownership', () => {
      expect(ConsolidationEngine.calculateMinorityInterest(500, 100)).toBe(0);
    });

    it('should return full amount for 0% ownership', () => {
      expect(ConsolidationEngine.calculateMinorityInterest(300, 0)).toBe(300);
    });

    it('should clamp ownership above 100%', () => {
      expect(ConsolidationEngine.calculateMinorityInterest(1000, 120)).toBe(0);
    });

    it('should clamp ownership below 0%', () => {
      expect(ConsolidationEngine.calculateMinorityInterest(500, -10)).toBe(500);
    });

    it('should handle negative net income', () => {
      expect(ConsolidationEngine.calculateMinorityInterest(-1000, 70)).toBeCloseTo(-300, 10);
    });

    it('should handle zero net income', () => {
      expect(ConsolidationEngine.calculateMinorityInterest(0, 60)).toBe(0);
    });
  });

  // =========================================================================
  // GOODWILL CALCULATION TESTS
  // =========================================================================

  describe('calculateGoodwill', () => {
    it('should calculate goodwill for acquisition', () => {
      const entityMap = new Map([['sub', createSubsidiary('sub', 'Sub Inc')]]);
      const ownerships: OwnershipStructure[] = [
        {
          parentId: 'parent',
          childId: 'sub',
          ownershipPct: 80,
          method: 'full',
          acquisitionCost: 100000,
          bookValueAtAcquisition: 80000,
        },
      ];

      const result = ConsolidationEngine.calculateGoodwill(ownerships, entityMap);

      expect(result).toHaveLength(1);
      expect(result![0]!.goodwill).toBeGreaterThan(0);
      expect(result![0]!.acquisitionCost).toBe(100000);
      expect(result![0]!.bookValueAtAcquisition).toBe(80000);
    });

    it('should return empty for no acquisition data', () => {
      const entityMap = new Map([['sub', createSubsidiary('sub', 'Sub Inc')]]);
      const ownerships = [createOwnership('parent', 'sub', 80)];

      const result = ConsolidationEngine.calculateGoodwill(ownerships, entityMap);

      expect(result).toHaveLength(0);
    });

    it('should return empty for missing entity', () => {
      const entityMap = new Map();
      const ownerships: OwnershipStructure[] = [
        {
          parentId: 'parent',
          childId: 'sub',
          ownershipPct: 80,
          method: 'full',
          acquisitionCost: 100000,
          bookValueAtAcquisition: 80000,
        },
      ];

      const result = ConsolidationEngine.calculateGoodwill(ownerships, entityMap);

      expect(result).toHaveLength(0);
    });

    it('should handle bargain purchase (negative goodwill)', () => {
      const entityMap = new Map([['sub', createSubsidiary('sub', 'Sub Inc')]]);
      const ownerships: OwnershipStructure[] = [
        {
          parentId: 'parent',
          childId: 'sub',
          ownershipPct: 80,
          method: 'full',
          acquisitionCost: 50000, // Paid less than book value
          bookValueAtAcquisition: 80000,
        },
      ];

      const result = ConsolidationEngine.calculateGoodwill(ownerships, entityMap);

      expect(result).toHaveLength(1);
      expect(result![0]!.goodwill).toBeLessThan(0); // Negative goodwill (bargain purchase)
    });

    it('should calculate amortization', () => {
      const entityMap = new Map([['sub', createSubsidiary('sub', 'Sub Inc')]]);
      const ownerships: OwnershipStructure[] = [
        {
          parentId: 'parent',
          childId: 'sub',
          ownershipPct: 100,
          method: 'full',
          acquisitionCost: 120000,
          bookValueAtAcquisition: 100000,
        },
      ];

      const result = ConsolidationEngine.calculateGoodwill(ownerships, entityMap);

      expect(result).toHaveLength(1);
      expect(result![0]!.amortizationPerYear).toBeGreaterThan(0);
      expect(result![0]!.amortizationPerYear).toBeCloseTo(result![0]!.goodwill / 10, 2);
    });
  });

  // =========================================================================
  // CONSOLIDATION BALANCE TESTS
  // =========================================================================

  describe('consolidation balance', () => {
    it('should balance when assets = liabilities + equity', () => {
      const entries = [
        createEntry('1', '1000', 'Cash', 100000, 'parent'),
        createEntry('2', '2000', 'Accounts Payable', -40000, 'parent'),
        createEntry('3', '3000', 'Common Stock', -50000, 'parent'),
        createEntry('4', '3100', 'Retained Earnings', -10000, 'parent'),
      ];
      const entities = [createParent(entries)];

      const result = ConsolidationEngine.consolidate(entities, [], []);

      expect(result.isBalanced).toBe(true);
    });

    it('should detect imbalance', () => {
      const entries = [
        createEntry('1', '1000', 'Cash', 100000, 'parent'),
        createEntry('2', '2000', 'Accounts Payable', -40000, 'parent'),
        // Missing equity entry — creates imbalance
      ];
      const entities = [createParent(entries)];

      const result = ConsolidationEngine.consolidate(entities, [], []);

      expect(result.isBalanced).toBe(false);
      expect(result.imbalanceAmount).not.toBe(0);
    });

    it('should balance with eliminations', () => {
      const parentEntries = [
        createEntry('p1', '1000', 'Cash', 50000, 'parent'),
        createEntry('p2', '1100', 'IC Receivable', 10000, 'parent'),
        createEntry('p3', '3000', 'Common Stock', -60000, 'parent'),
      ];
      const subEntries = [
        createEntry('s1', '1000', 'Cash', 20000, 'sub'),
        createEntry('s2', '1100', 'IC Payable', -10000, 'sub'),
        createEntry('s3', '3000', 'Common Stock', -10000, 'sub'),
      ];

      const entities = [createParent(parentEntries), createSubsidiary('sub', 'Sub', subEntries)];
      const ownerships = [createOwnership('parent', 'sub', 100)];
      const icPairs = [createICPair('parent', 'sub', '1100', 10000, 'receivable')];

      const result = ConsolidationEngine.consolidate(entities, ownerships, icPairs);

      // After elimination, assets = 50000 + 20000 = 70000
      // Liabilities = 0 (IC payable eliminated)
      // Equity = -60000 + -10000 = -70000
      // Balance: 70000 + 0 + (-70000) = 0
      expect(result.totalAssets).toBe(70000);
    });
  });

  // =========================================================================
  // FX TRANSLATION TESTS
  // =========================================================================

  describe('translateForeignSubsidiaries', () => {
    it('should translate foreign subsidiary at closing rate', () => {
      const foreignEntries = [createEntry('f1', '1000', 'Cash', 10000, 'foreign', 'EUR')];
      const entities = [
        createParent([createEntry('p1', '1000', 'Cash', 50000, 'parent')]),
        {
          ...createSubsidiary('foreign', 'Foreign Sub', foreignEntries, true, 'EUR'),
          isForeign: true,
        },
      ];
      const fxRates: FXRate[] = [
        { fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.1, rateType: 'spot', date: '2024-01-01' },
      ];

      const result = ConsolidationEngine.translateForeignSubsidiaries(entities, fxRates);

      expect(result![1]!.entries[0]!.amount).toBeCloseTo(11000, 2); // 10000 * 1.1
      expect(result![1]!.entries[0]!.currency).toBe('USD');
    });

    it('should not translate USD entities', () => {
      const entities = [createParent([createEntry('p1', '1000', 'Cash', 50000, 'parent')])];
      const fxRates: FXRate[] = [
        { fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.1, rateType: 'spot', date: '2024-01-01' },
      ];

      const result = ConsolidationEngine.translateForeignSubsidiaries(entities, fxRates);

      expect(result![0]!.entries[0]!.amount).toBe(50000);
    });

    it('should return entities unchanged when no FX rates', () => {
      const entities = [
        {
          ...createSubsidiary(
            'foreign',
            'Foreign Sub',
            [createEntry('f1', '1000', 'Cash', 10000, 'foreign', 'EUR')],
            true,
            'EUR'
          ),
          isForeign: true,
        },
      ];

      // F-0001: no rates loaded + foreign entities → throws MissingFXRateError
      // instead of silently returning untranslated entities as-is.
      expect(() => ConsolidationEngine.translateForeignSubsidiaries(entities, [])).toThrow(
        MissingFXRateError
      );

      // With no foreign entities, an empty rate table is legitimate.
      const domesticOnly = [
        { entityId: 'dom', entityName: 'Domestic', currency: 'USD', entries: [] },
      ];
      expect(ConsolidationEngine.translateForeignSubsidiaries(domesticOnly, [])).toEqual(
        domesticOnly
      );
    });

    it('should use different rates for different account categories', () => {
      const foreignEntries = [
        createEntry('f1', '1000', 'Cash', 10000, 'foreign', 'EUR'), // asset
        createEntry('f2', '4000', 'Revenue', 5000, 'foreign', 'EUR'), // revenue
        createEntry('f3', '3000', 'Equity', 20000, 'foreign', 'EUR'), // equity
      ];
      const entities = [
        {
          ...createSubsidiary('foreign', 'Foreign Sub', foreignEntries, true, 'EUR'),
          isForeign: true,
        },
      ];
      const fxRates: FXRate[] = [
        { fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.1, rateType: 'spot', date: '2024-01-01' },
        {
          fromCurrency: 'EUR',
          toCurrency: 'USD',
          rate: 1.05,
          rateType: 'average',
          date: '2024-01-01',
        },
        {
          fromCurrency: 'EUR',
          toCurrency: 'USD',
          rate: 1.0,
          rateType: 'historical',
          date: '2024-01-01',
        },
      ];

      const result = ConsolidationEngine.translateForeignSubsidiaries(entities, fxRates);

      // Asset: closing rate 1.1
      expect(result![0]!.entries[0]!.amount).toBeCloseTo(11000, 2);
      // Revenue: average rate 1.05
      expect(result![0]!.entries[1]!.amount).toBeCloseTo(5250, 2);
      // Equity: historical rate 1.0
      expect(result![0]!.entries[2]!.amount).toBeCloseTo(20000, 2);
    });
  });

  // =========================================================================
  // VIE CONSOLIDATION TESTS
  // =========================================================================

  describe('processVIEConsolidation', () => {
    it('should consolidate VIE when primary beneficiary', () => {
      const parentEntries = [createEntry('p1', '1500', 'Investment in VIE', 50000, 'parent')];
      const entities = [
        createParent(parentEntries),
        { ...createSubsidiary('vie', 'VIE Entity', []), isVIE: true },
      ];
      const ownerships = [createOwnership('parent', 'vie', 0, 'full')];
      const vieNotifications: VIENotification[] = [
        {
          entityId: 'vie',
          isPrimaryBeneficiary: true,
          variableInterests: ['equity', 'debt'],
          power: 'Power to direct activities',
          economics: 'Expected residual returns',
        },
      ];
      const entityMap = new Map(entities.map((e) => [e.entityId, e]));

      const result = ConsolidationEngine.processVIEConsolidation(
        entities,
        ownerships,
        vieNotifications,
        entityMap
      );

      expect(result).toHaveLength(1);
      expect(result![0]!.type).toBe('ic_investment');
    });

    it('should not consolidate VIE when not primary beneficiary', () => {
      const entities = [
        createParent([]),
        { ...createSubsidiary('vie', 'VIE Entity', []), isVIE: true },
      ];
      const ownerships = [createOwnership('parent', 'vie', 0, 'full')];
      const vieNotifications: VIENotification[] = [
        {
          entityId: 'vie',
          isPrimaryBeneficiary: false,
          variableInterests: ['equity'],
          power: 'No power',
          economics: 'No economics',
        },
      ];
      const entityMap = new Map(entities.map((e) => [e.entityId, e]));

      const result = ConsolidationEngine.processVIEConsolidation(
        entities,
        ownerships,
        vieNotifications,
        entityMap
      );

      expect(result).toHaveLength(0);
    });

    it('should return empty when no VIE notifications', () => {
      const entities = [createParent([])];
      const entityMap = new Map(entities.map((e) => [e.entityId, e]));

      const result = ConsolidationEngine.processVIEConsolidation(entities, [], [], entityMap);

      expect(result).toHaveLength(0);
    });
  });

  // =========================================================================
  // WORKSHEET TESTS
  // =========================================================================

  describe('buildWorksheet', () => {
    it('should build complete worksheet', () => {
      const parentEntries = [
        createEntry('p1', '1000', 'Cash', 50000, 'parent'),
        createEntry('p2', '4000', 'Revenue', 100000, 'parent'),
      ];
      const subEntries = [
        createEntry('s1', '1000', 'Cash', 20000, 'sub'),
        createEntry('s2', '4000', 'Revenue', 40000, 'sub'),
      ];
      const parent = createParent(parentEntries);
      const sub = createSubsidiary('sub', 'Sub', subEntries);
      const allEntries = [...parentEntries, ...subEntries];

      const worksheet = ConsolidationEngine.buildWorksheet(
        parent,
        [sub],
        allEntries,
        [],
        [],
        allEntries,
        [],
        70000,
        0,
        -70000,
        140000,
        0,
        140000,
        true,
        0
      );

      expect(worksheet.parentEntries).toHaveLength(2);
      expect(worksheet.subsidiaryEntries).toHaveLength(2);
      expect(worksheet.combinedEntries).toHaveLength(4);
      expect(worksheet.totalAssets).toBe(70000);
      expect(worksheet.isBalanced).toBe(true);
    });

    it('should show eliminations in worksheet', () => {
      const eliminations: EliminationEntry[] = [
        {
          fromEntityId: 'parent',
          toEntityId: 'sub',
          accountCode: '1100',
          accountName: 'IC Receivable',
          eliminatedAmount: -5000,
          debitAmount: 0,
          creditAmount: 5000,
          description: 'Elimination of IC receivable',
          type: 'ic_receivable',
        },
      ];

      const worksheet = ConsolidationEngine.buildWorksheet(
        createParent(),
        [],
        [],
        eliminations,
        [],
        [],
        [],
        0,
        0,
        0,
        0,
        0,
        0,
        true,
        0
      );

      expect(worksheet.eliminations).toHaveLength(1);
      expect(worksheet!.eliminations[0]!.type).toBe('ic_receivable');
    });
  });

  // =========================================================================
  // IC BALANCE TESTS
  // =========================================================================

  describe('getICBalance', () => {
    it('should calculate IC balance between entities', () => {
      const entries = [
        createEntry('a', '1100', 'IC Receivable', 5000, 'parent'),
        createEntry('b', '1100', 'IC Payable', -5000, 'sub'),
      ];

      const result = ConsolidationEngine.getICBalance(entries, 'parent', 'sub', '1100');

      expect(result.fromBalance).toBe(5000);
      expect(result.toBalance).toBe(-5000);
      expect(result.netBalance).toBe(0);
    });

    it('should handle unbalanced IC', () => {
      const entries = [
        createEntry('a', '1100', 'IC Receivable', 5000, 'parent'),
        createEntry('b', '1100', 'IC Payable', -3000, 'sub'),
      ];

      const result = ConsolidationEngine.getICBalance(entries, 'parent', 'sub', '1100');

      expect(result.netBalance).toBe(2000); // 5000 + (-3000)
    });

    it('should return zero for no entries', () => {
      const result = ConsolidationEngine.getICBalance([], 'parent', 'sub', '1100');

      expect(result.fromBalance).toBe(0);
      expect(result.toBalance).toBe(0);
      expect(result.netBalance).toBe(0);
    });
  });

  // =========================================================================
  // VALIDATION TESTS
  // =========================================================================

  describe('validate', () => {
    it('should validate a balanced consolidation', () => {
      const result = ConsolidationEngine.consolidate(
        [
          createParent([
            createEntry('1', '1000', 'Cash', 100000, 'parent'),
            createEntry('2', '3000', 'Equity', -100000, 'parent'),
          ]),
        ],
        [],
        []
      );

      const validation = ConsolidationEngine.validate(result);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect imbalance', () => {
      const result = ConsolidationEngine.consolidate(
        [createParent([createEntry('1', '1000', 'Cash', 100000, 'parent')])],
        [],
        []
      );

      const validation = ConsolidationEngine.validate(result);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]!).toContain('does not balance');
    });
  });

  // =========================================================================
  // FULL CONSOLIDATION SCENARIO TESTS
  // =========================================================================

  describe('full consolidation scenarios', () => {
    it('should handle complete parent-subsidiary consolidation with eliminations', () => {
      // Parent has investment in sub, sub has equity
      const parentEntries = [
        createEntry('p1', '1000', 'Cash', 200000, 'parent'),
        createEntry('p2', '1500', 'Investment in Sub', 80000, 'parent'),
        createEntry('p3', '4000', 'Revenue', 150000, 'parent'),
        createEntry('p4', '5000', 'Expense', -90000, 'parent'),
        createEntry('p5', '3000', 'Common Stock', -100000, 'parent'),
        createEntry('p6', '3100', 'Retained Earnings', -130000, 'parent'),
      ];
      const subEntries = [
        createEntry('s1', '1000', 'Cash', 50000, 'sub'),
        createEntry('s2', '4000', 'Revenue', 60000, 'sub'),
        createEntry('s3', '5000', 'Expense', -35000, 'sub'),
        createEntry('s4', '3000', 'Common Stock', -30000, 'sub'),
        createEntry('s5', '3100', 'Retained Earnings', -45000, 'sub'),
      ];

      const entities = [
        createParent(parentEntries),
        createSubsidiary('sub', 'Sub Inc', subEntries),
      ];
      const ownerships: OwnershipStructure[] = [
        {
          parentId: 'parent',
          childId: 'sub',
          ownershipPct: 80,
          method: 'full',
          acquisitionCost: 80000,
          bookValueAtAcquisition: 75000,
        },
      ];
      const icPairs = [createICPair('parent', 'sub', '1500', 80000, 'investment')];

      const result = ConsolidationEngine.consolidate(entities, ownerships, icPairs);

      // Should have eliminations for investment
      expect(result.eliminations.length).toBeGreaterThan(0);

      // Should have minority interest (80% ownership = 20% minority)
      expect(result.minorityInterestDetails).toHaveLength(1);
      expect(result!.minorityInterestDetails[0]!.minorityPct).toBe(20);

      // Should have goodwill (acquisition cost > book value)
      expect(result.goodwill).toBeGreaterThan(0);

      // Should have worksheet
      expect(result.worksheet).toBeDefined();
      expect(result.worksheet.parentEntries.length).toBeGreaterThan(0);
      expect(result.worksheet.subsidiaryEntries.length).toBeGreaterThan(0);
    });

    it('should handle 100% ownership (no minority interest)', () => {
      const parentEntries = [
        createEntry('p1', '1000', 'Cash', 100000, 'parent'),
        createEntry('p2', '3000', 'Equity', -100000, 'parent'),
      ];
      const subEntries = [
        createEntry('s1', '1000', 'Cash', 50000, 'sub'),
        createEntry('s2', '3000', 'Equity', -50000, 'sub'),
      ];

      const entities = [createParent(parentEntries), createSubsidiary('sub', 'Sub', subEntries)];
      const ownerships = [createOwnership('parent', 'sub', 100)];

      const result = ConsolidationEngine.consolidate(entities, ownerships, []);

      expect(result.minorityInterest).toBe(0);
      expect(result.minorityInterestDetails).toHaveLength(0);
    });

    it('should handle minority ownership (no consolidation)', () => {
      const parentEntries = [
        createEntry('p1', '1000', 'Cash', 100000, 'parent'),
        createEntry('p2', '3000', 'Equity', -100000, 'parent'),
      ];
      const subEntries = [
        createEntry('s1', '1000', 'Cash', 50000, 'sub'),
        createEntry('s2', '3000', 'Equity', -50000, 'sub'),
      ];

      const entities = [createParent(parentEntries), createSubsidiary('sub', 'Sub', subEntries)];
      const ownerships = [createOwnership('parent', 'sub', 30, 'equity')];

      const result = ConsolidationEngine.consolidate(entities, ownerships, []);

      // Equity method — no minority interest calculation
      expect(result.minorityInterestDetails).toHaveLength(0);
    });

    it('should handle foreign subsidiary consolidation', () => {
      const parentEntries = [
        createEntry('p1', '1000', 'Cash', 100000, 'parent'),
        createEntry('p2', '3000', 'Equity', -100000, 'parent'),
      ];
      const foreignEntries = [
        createEntry('f1', '1000', 'Cash', 50000, 'foreign', 'EUR'),
        createEntry('f2', '3000', 'Equity', -50000, 'foreign', 'EUR'),
      ];

      const entities = [
        createParent(parentEntries),
        {
          ...createSubsidiary('foreign', 'Foreign Sub', foreignEntries, true, 'EUR'),
          isForeign: true,
          functionalCurrency: 'EUR',
        },
      ];
      const ownerships = [createOwnership('parent', 'foreign', 80)];
      const fxRates: FXRate[] = [
        { fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.1, rateType: 'spot', date: '2024-01-01' },
        {
          fromCurrency: 'EUR',
          toCurrency: 'USD',
          rate: 1.05,
          rateType: 'average',
          date: '2024-01-01',
        },
        {
          fromCurrency: 'EUR',
          toCurrency: 'USD',
          rate: 1.0,
          rateType: 'historical',
          date: '2024-01-01',
        },
      ];

      const result = ConsolidationEngine.consolidate(entities, ownerships, [], fxRates);

      // Foreign entries should be translated
      expect(result.totalAssets).toBeGreaterThan(100000); // Parent + translated foreign
    });

    it('should handle VIE consolidation', () => {
      const parentEntries = [
        createEntry('p1', '1000', 'Cash', 100000, 'parent'),
        createEntry('p2', '1500', 'Investment in VIE', 50000, 'parent'),
        createEntry('p3', '3000', 'Equity', -150000, 'parent'),
      ];
      const vieEntries = [
        createEntry('v1', '1000', 'Cash', 30000, 'vie'),
        createEntry('v2', '3000', 'Equity', -30000, 'vie'),
      ];

      const entities = [
        createParent(parentEntries),
        { ...createSubsidiary('vie', 'VIE Entity', vieEntries), isVIE: true },
      ];
      const ownerships = [createOwnership('parent', 'vie', 0, 'full')];
      const vieNotifications: VIENotification[] = [
        {
          entityId: 'vie',
          isPrimaryBeneficiary: true,
          variableInterests: ['equity', 'debt'],
          power: 'Power to direct activities',
          economics: 'Expected residual returns',
        },
      ];

      const result = ConsolidationEngine.consolidate(
        entities,
        ownerships,
        [],
        [],
        [],
        vieNotifications
      );

      expect(result.eliminations.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // EDGE CASE TESTS
  // =========================================================================

  describe('edge cases', () => {
    it('should handle zero amounts', () => {
      const entries = [
        createEntry('1', '1000', 'Cash', 0, 'parent'),
        createEntry('2', '3000', 'Equity', 0, 'parent'),
      ];
      const entities = [createParent(entries)];

      const result = ConsolidationEngine.consolidate(entities, [], []);

      expect(result.isBalanced).toBe(true);
    });

    it('should handle very large numbers', () => {
      const entries = [
        createEntry('1', '1000', 'Cash', 999999999999, 'parent'),
        createEntry('2', '3000', 'Equity', -999999999999, 'parent'),
      ];
      const entities = [createParent(entries)];

      const result = ConsolidationEngine.consolidate(entities, [], []);

      expect(result.totalAssets).toBe(999999999999);
      expect(result.isBalanced).toBe(true);
    });

    it('should handle very small numbers', () => {
      const entries = [
        createEntry('1', '1000', 'Cash', 0.01, 'parent'),
        createEntry('2', '3000', 'Equity', -0.01, 'parent'),
      ];
      const entities = [createParent(entries)];

      const result = ConsolidationEngine.consolidate(entities, [], []);

      expect(result.isBalanced).toBe(true);
    });

    it('should handle negative balances', () => {
      const entries = [
        createEntry('1', '1000', 'Cash', -5000, 'parent'), // Overdraft
        createEntry('2', '3000', 'Equity', 5000, 'parent'),
      ];
      const entities = [createParent(entries)];

      const result = ConsolidationEngine.consolidate(entities, [], []);

      expect(result.totalAssets).toBe(-5000);
    });

    it('should handle single entity with all account types', () => {
      const entries = [
        createEntry('1', '1000', 'Cash', 100000, 'ent'),
        createEntry('2', '1500', 'Equipment', 50000, 'ent'),
        createEntry('3', '2000', 'Accounts Payable', -30000, 'ent'),
        createEntry('4', '2500', 'Long-term Debt', -40000, 'ent'),
        createEntry('5', '3000', 'Common Stock', -50000, 'ent'),
        createEntry('6', '3100', 'Retained Earnings', -20000, 'ent'),
        createEntry('7', '4000', 'Revenue', 80000, 'ent'),
        createEntry('8', '5000', 'Expense', -40000, 'ent'),
      ];
      const entities = [createParent(entries)];

      const result = ConsolidationEngine.consolidate(entities, [], []);

      expect(result.totalAssets).toBe(150000);
      expect(result.totalLiabilities).toBe(-70000);
      expect(result.totalEquity).toBe(-70000);
      expect(result.totalRevenue).toBe(80000);
      expect(result.totalExpenses).toBe(-40000);
      expect(result.netIncome).toBe(40000);
    });

    it('should handle multiple eliminations on same account', () => {
      const entries = [
        createEntry('a', '9000', 'IC Sales', 500, 'parent'),
        createEntry('b', '9000', 'IC Sales', 300, 'sub1'),
        createEntry('c', '9000', 'IC Purchases', -800, 'sub2'),
      ];

      const result = ConsolidationEngine.eliminateIntercompany(entries, []);

      // Should have auto-eliminations
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty ownership list', () => {
      const entities = [
        createParent([createEntry('p1', '1000', 'Cash', 50000, 'parent')]),
        createSubsidiary('sub', 'Sub', [createEntry('s1', '1000', 'Cash', 20000, 'sub')]),
      ];

      const result = ConsolidationEngine.consolidate(entities, [], []);

      // No ownership = no minority interest
      expect(result.minorityInterestDetails).toHaveLength(0);
      expect(result.totalAssets).toBe(70000);
    });
  });
});

// =============================================================================
// F-0003: error swallowing — consolidation must never report balanced zeros
// after an exception. F-0009: disclosed, cent-exact balance tolerance.
// =============================================================================

import { ConsolidationFailedError } from './ConsolidationEngine';
import { MissingFXRateError } from './FXEngine';

describe('F-0003: consolidation failure propagation', () => {
  it('KAV-05: a foreign entity with no FX rates produces status failed, isBalanced false', () => {
    const entities = [
      createParent([createEntry('p1', '1000', 'Cash', 50000, 'parent')]),
      createSubsidiary(
        'sub-eur',
        'Euro Sub',
        [createEntry('s1', '1000', 'Cash', 20000, 'sub-eur', 'EUR')],
        true,
        'EUR'
      ),
    ];

    const result = ConsolidationEngine.consolidate(entities, [], []);

    expect(result.status).toBe('failed');
    expect(result.isBalanced).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]!.stage).toBe('fx-translation');
    expect(result.errors[0]!.message).toContain('EUR');
  });

  it('translateForeignSubsidiaries throws MissingFXRateError instead of using rate 1', () => {
    const entities = [
      createSubsidiary(
        'sub-eur',
        'Euro Sub',
        [createEntry('s1', '1000', 'Cash', 20000, 'sub-eur', 'EUR')],
        true,
        'EUR'
      ),
    ];
    expect(() => ConsolidationEngine.translateForeignSubsidiaries(entities, [])).toThrow(
      MissingFXRateError
    );
  });

  it('missing per-category rate (e.g. no average rate) fails with account context', () => {
    const entities = [
      createSubsidiary(
        'sub-eur',
        'Euro Sub',
        [createEntry('s1', '4000', 'Revenue', -5000, 'sub-eur', 'EUR')],
        true,
        'EUR'
      ),
    ];
    const fxRates: FXRate[] = [
      { fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.1, rateType: 'spot' },
    ];
    // spot exists but the revenue account needs the missing average rate.
    expect(() => ConsolidationEngine.translateForeignSubsidiaries(entities, fxRates)).toThrow(
      /average rate/
    );
    const result = ConsolidationEngine.consolidate(entities, [], [], fxRates);
    expect(result.status).toBe('failed');
    expect(result.isBalanced).toBe(false);
  });

  it('a neutral/empty consolidation never claims to be balanced', () => {
    const result = ConsolidationEngine.consolidate([], []);
    expect(result.status).toBe('failed');
    expect(result.isBalanced).toBe(false);
    expect(result.worksheet.isBalanced).toBe(false);
    expect(result.errors[0]!.stage).toBe('validation');
  });

  it('validate() rejects failed results even if numbers were zeroed', () => {
    const result = ConsolidationEngine.consolidate([], []);
    const validation = ConsolidationEngine.validate(result);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.includes('Consolidation failed'))).toBe(true);
  });

  it('successful consolidations report status success with an empty error list', () => {
    const entities = [
      createParent([
        createEntry('p1', '1000', 'Cash', 50000, 'parent'),
        createEntry('p2', '3000', 'Equity', -50000, 'parent'),
      ]),
    ];
    const result = ConsolidationEngine.consolidate(entities, []);
    expect(result.status).toBe('success');
    expect(result.errors).toEqual([]);
    expect(result.isBalanced).toBe(true);
  });

  it('consolidateOrThrow throws ConsolidationFailedError with stage/cause on failure', () => {
    const entities = [
      createParent([createEntry('p1', '1000', 'Cash', 50000, 'parent')]),
      createSubsidiary(
        'sub-eur',
        'Euro Sub',
        [createEntry('s1', '1000', 'Cash', 20000, 'sub-eur', 'EUR')],
        true,
        'EUR'
      ),
    ];
    try {
      ConsolidationEngine.consolidateOrThrow(entities, []);
      expect.unreachable('should have thrown');
    } catch (e) {
      const err = e as ConsolidationFailedError;
      expect(err).toBeInstanceOf(ConsolidationFailedError);
      expect(err.name).toBe('ConsolidationFailedError');
      expect(err.failures[0]!.stage).toBe('fx-translation');
      expect(err.failures[0]!.cause).toBe('MissingFXRateError');
    }
  });

  it('consolidateOrThrow throws when the consolidated balance sheet does not balance', () => {
    const entities = [
      createParent([createEntry('p1', '1000', 'Cash', 50000, 'parent')]), // no equity offset
    ];
    expect(() => ConsolidationEngine.consolidateOrThrow(entities, [])).toThrow(
      ConsolidationFailedError
    );
  });
});

describe('F-0009: balance tolerance', () => {
  it('is cent-exact by default: a one-cent imbalance fails', () => {
    const entities = [
      createParent([
        createEntry('p1', '1000', 'Cash', 50000.01, 'parent'),
        createEntry('p2', '3000', 'Equity', -50000, 'parent'),
      ]),
    ];
    const result = ConsolidationEngine.consolidate(entities, []);
    // imbalance = +0.01 → 1 cent → exceeds the default 0-cent tolerance
    expect(result.isBalanced).toBe(false);
    expect(result.balanceToleranceCents).toBe(0);
  });

  it('explicit tolerance is honored and disclosed', () => {
    const entities = [
      createParent([
        createEntry('p1', '1000', 'Cash', 50000.01, 'parent'),
        createEntry('p2', '3000', 'Equity', -50000, 'parent'),
      ]),
    ];
    const result = ConsolidationEngine.consolidate(entities, [], [], [], [], [], {
      balanceToleranceCents: 1,
    });
    expect(result.isBalanced).toBe(true);
    expect(result.balanceToleranceCents).toBe(1);
  });
});

describe('KAV-06: effective ownership math', () => {
  it('A owns 80% of B; B owns 50% of C → effective A→C ownership is 40%', () => {
    const ownerships = [createOwnership('A', 'B', 80), createOwnership('B', 'C', 50)];
    const map = ConsolidationEngine.calculateEffectiveOwnership('A', ownerships);
    expect(map.get('A')).toBe(100);
    expect(map.get('B')).toBe(80);
    expect(map.get('C')).toBeCloseTo(40, 10);
  });

  it('multiple paths accumulate effective ownership', () => {
    const ownerships = [
      createOwnership('A', 'B', 80),
      createOwnership('A', 'C', 10),
      createOwnership('B', 'C', 50),
    ];
    const map = ConsolidationEngine.calculateEffectiveOwnership('A', ownerships);
    // 10% direct + 80%*50% via B = 10 + 40 = 50
    expect(map.get('C')).toBeCloseTo(50, 10);
  });
});

describe('DEC-010 Step 2: asymmetric IC pairs, ASC 830 CTA, and exact-string consolidation', () => {
  it('eliminates asymmetric IC receivable (1290) vs IC payable (2190) across entities and keeps balance sheet balanced', () => {
    const parentEntries = [
      createEntry('p1', '1000', 'Cash', 90000, 'parent'),
      createEntry('p2', '1290', 'IC Receivable - Sub', 10000, 'parent'),
      createEntry('p3', '3000', 'Common Stock', -100000, 'parent'),
    ];
    const subEntries = [
      createEntry('s1', '1000', 'Cash', 35000, 'sub'),
      createEntry('s2', '2190', 'IC Payable - Parent', -10000, 'sub'),
      createEntry('s3', '3000', 'Common Stock', -25000, 'sub'),
    ];

    const entities = [createParent(parentEntries), createSubsidiary('sub', 'Sub', subEntries)];
    const ownerships = [createOwnership('parent', 'sub', 100)];
    const icPairs: ICPair[] = [
      {
        fromEntityId: 'parent',
        toEntityId: 'sub',
        accountCode: '1290',
        toAccountCode: '2190',
        amount: 10000,
        type: 'receivable',
      },
    ];

    const result = ConsolidationEngine.consolidate(entities, ownerships, icPairs);

    expect(result.status).toBe('success');
    expect(result.eliminations).toHaveLength(1);
    expect(result.eliminations[0]!.accountCode).toBe('1290');
    expect(result.eliminations[0]!.toAccountCode).toBe('2190');
    expect(result.totalAssets).toBe(125000);
    expect(result.totalLiabilities).toBe(0);
    expect(result.totalEquity).toBe(-125000);
    expect(result.isBalanced).toBe(true);
    expect(result.imbalanceAmount).toBe(0);
  });

  it('does not over-eliminate when an entity has multiple GL entries on the same IC account', () => {
    const parentEntries = [
      createEntry('p1', '1000', 'Cash', 90000, 'parent'),
      createEntry('p2a', '1100', 'IC Receivable Invoice 1', 6000, 'parent'),
      createEntry('p2b', '1100', 'IC Receivable Invoice 2', 4000, 'parent'),
      createEntry('p3', '3000', 'Common Stock', -100000, 'parent'),
    ];
    const subEntries = [
      createEntry('s1', '1000', 'Cash', 35000, 'sub'),
      createEntry('s2', '1100', 'IC Payable', -10000, 'sub'),
      createEntry('s3', '3000', 'Common Stock', -25000, 'sub'),
    ];

    const entities = [createParent(parentEntries), createSubsidiary('sub', 'Sub', subEntries)];
    const ownerships = [createOwnership('parent', 'sub', 100)];
    const icPairs: ICPair[] = [createICPair('parent', 'sub', '1100', 10000, 'receivable')];

    const result = ConsolidationEngine.consolidate(entities, ownerships, icPairs);

    expect(result.status).toBe('success');
    expect(result.totalAssets).toBe(125000);
    expect(result.totalLiabilities).toBe(0);
    expect(result.totalEquity).toBe(-125000);
    expect(result.isBalanced).toBe(true);
    expect(result.imbalanceAmount).toBe(0);
  });

  it('records ASC 830 Cumulative Translation Adjustment (3900) so a balanced EUR subsidiary consolidates in balance when spot !== historical', () => {
    const parentEntries = [
      createEntry('p1', '1000', 'Cash', 100000, 'parent'),
      createEntry('p2', '3000', 'Common Stock', -100000, 'parent'),
    ];
    const foreignEntries = [
      createEntry('f1', '1000', 'Cash', 50000, 'foreign', 'EUR'),
      createEntry('f2', '3000', 'Common Stock', -50000, 'foreign', 'EUR'),
    ];
    const entities = [
      createParent(parentEntries),
      {
        ...createSubsidiary('foreign', 'Foreign Sub', foreignEntries, true, 'EUR'),
        isForeign: true,
        functionalCurrency: 'EUR',
      },
    ];
    const ownerships = [createOwnership('parent', 'foreign', 100)];
    const fxRates: FXRate[] = [
      { fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.1, rateType: 'spot', date: '2026-03-31' },
      {
        fromCurrency: 'EUR',
        toCurrency: 'USD',
        rate: 1.05,
        rateType: 'average',
        date: '2026-03-31',
      },
      {
        fromCurrency: 'EUR',
        toCurrency: 'USD',
        rate: 1.0,
        rateType: 'historical',
        date: '2026-03-31',
      },
    ];

    const result = ConsolidationEngine.consolidate(entities, ownerships, [], fxRates);

    expect(result.status).toBe('success');
    expect(result.totalAssets).toBe(155000);
    // Parent equity (-100,000) + EUR sub historical equity (-50,000) + CTA (-5,000) = -155,000
    expect(result.totalEquity).toBe(-155000);
    expect(result.isBalanced).toBe(true);
    expect(result.imbalanceAmount).toBe(0);
    const ctaEntry = result.consolidatedEntries.find((e) => e.accountCode === '3900');
    expect(ctaEntry).toBeDefined();
    expect(ctaEntry!.amount).toBe(-5000);
  });

  it('consolidateExact translates promoted exact-decimal USD/EUR ledgers, derives exact ASC 830 CTA decomposition, and eliminates IC pairs without float coercion', () => {
    const exactResult = ConsolidationEngine.consolidateExact({
      reportingCurrency: 'USD',
      fxRates: [
        {
          fromCurrency: 'EUR',
          toCurrency: 'USD',
          spotRate: '1.10',
          averageRate: '1.05',
          historicalRate: '1.00',
        },
      ],
      entities: [
        {
          entityId: 'US01',
          entityName: 'US Parent Corp',
          functionalCurrency: 'USD',
          entries: [
            {
              accountCode: '1000',
              accountName: 'Cash',
              postDate: '2026-03-31',
              debit: '100000.00',
              credit: '0.00',
              entityId: 'US01',
              currency: 'USD',
            },
            {
              accountCode: '1290',
              accountName: 'IC Receivable - DE01',
              postDate: '2026-03-31',
              debit: '11000.00',
              credit: '0.00',
              entityId: 'US01',
              currency: 'USD',
            },
            {
              accountCode: '3000',
              accountName: 'Common Stock',
              postDate: '2026-03-31',
              debit: '0.00',
              credit: '80000.00',
              entityId: 'US01',
              currency: 'USD',
            },
            {
              accountCode: '4000',
              accountName: 'Product Revenue',
              postDate: '2026-03-31',
              debit: '0.00',
              credit: '50000.00',
              entityId: 'US01',
              currency: 'USD',
            },
            {
              accountCode: '4900',
              accountName: 'IC Management Fee Revenue',
              postDate: '2026-03-31',
              debit: '0.00',
              credit: '5250.00',
              entityId: 'US01',
              currency: 'USD',
            },
            {
              accountCode: '5000',
              accountName: 'Operating Expense',
              postDate: '2026-03-31',
              debit: '24250.00',
              credit: '0.00',
              entityId: 'US01',
              currency: 'USD',
            },
          ],
        },
        {
          entityId: 'DE01',
          entityName: 'Germany GmbH',
          functionalCurrency: 'EUR',
          entries: [
            {
              accountCode: '1000',
              accountName: 'Cash',
              postDate: '2026-03-31',
              debit: '60000.00',
              credit: '0.00',
              entityId: 'DE01',
              currency: 'EUR',
            },
            {
              accountCode: '2190',
              accountName: 'IC Payable - US01',
              postDate: '2026-03-31',
              debit: '0.00',
              credit: '10000.00',
              entityId: 'DE01',
              currency: 'EUR',
            },
            {
              accountCode: '3000',
              accountName: 'Subscribed Capital',
              postDate: '2026-03-31',
              debit: '0.00',
              credit: '40000.00',
              entityId: 'DE01',
              currency: 'EUR',
            },
            {
              accountCode: '4000',
              accountName: 'Product Revenue',
              postDate: '2026-03-31',
              debit: '0.00',
              credit: '25000.00',
              entityId: 'DE01',
              currency: 'EUR',
            },
            {
              accountCode: '5000',
              accountName: 'Operating Expense',
              postDate: '2026-03-31',
              debit: '10000.00',
              credit: '0.00',
              entityId: 'DE01',
              currency: 'EUR',
            },
            {
              accountCode: '5900',
              accountName: 'IC Management Fee Expense',
              postDate: '2026-03-31',
              debit: '5000.00',
              credit: '0.00',
              entityId: 'DE01',
              currency: 'EUR',
            },
          ],
        },
      ],
      icRules: [
        {
          fromEntityId: 'US01',
          fromAccountCode: '1290',
          toEntityId: 'DE01',
          toAccountCode: '2190',
          description: 'IC Receivable/Payable US01 <-> DE01',
        },
        {
          fromEntityId: 'US01',
          fromAccountCode: '4900',
          toEntityId: 'DE01',
          toAccountCode: '5900',
          description: 'IC Management Fee US01 <-> DE01',
        },
      ],
    });

    // DE01 in EUR:
    // Net Assets (Cash 60,000 - IC Payable 10,000) = +50,000 EUR @ 1.10 = +55,000.00 USD
    // Equity (-40,000 EUR @ 1.00) = -40,000.00 USD -> opening equity CTA = -4,000.00 USD
    // Net Income (-25,000 + 10,000 + 5,000 = -10,000 EUR credit @ 1.05 = -10,500.00 USD) -> NI CTA = -500.00 USD
    // Total DE01 CTA (signed debit-minus-credit) = -4,500.00 USD (credit to 3900 OCI)
    expect(exactResult.entityTranslations).toHaveLength(2);
    const deTranslation = exactResult.entityTranslations.find((t) => t.entityId === 'DE01')!;
    expect(deTranslation.openingEquityRateEffect).toBe('-4000.00');
    expect(deTranslation.netIncomeRateEffect).toBe('-500.00');
    expect(deTranslation.roundingResidual).toBe('0.00');
    expect(deTranslation.totalCTA).toBe('-4500.00');

    // IC eliminations:
    // 1) 1290 (+11,000.00 USD) vs 2190 (-10,000 EUR @ 1.10 = -11,000.00 USD) -> matched 11,000.00, diff 0.00
    // 2) 4900 (-5,250.00 USD) vs 5900 (+5,000 EUR @ 1.05 = +5,250.00 USD) -> matched 5,250.00, diff 0.00
    expect(exactResult.icReconciliation).toHaveLength(2);
    expect(exactResult.icReconciliation[0]!.status).toBe('matched');
    expect(exactResult.icReconciliation[0]!.eliminatedAmount).toBe('11000.00');
    expect(exactResult.icReconciliation[0]!.unmatchedDifference).toBe('0.00');
    expect(exactResult.icReconciliation[1]!.status).toBe('matched');
    expect(exactResult.icReconciliation[1]!.eliminatedAmount).toBe('5250.00');
    expect(exactResult.icReconciliation[1]!.unmatchedDifference).toBe('0.00');

    // Consolidated totals after IC elimination:
    // Assets: US01 Cash 100,000 + DE01 Cash 66,000 (1290 eliminated) = 166,000.00
    // Liabilities: DE01 2190 (-11,000) eliminated = 0.00
    // Equity: US01 (-80,000) + DE01 (-40,000) + CTA (-4,500) = -124,500.00
    // Revenue: US01 (-50,000) + DE01 (-26,250) (4900 eliminated) = -76,250.00 (credit: 76,250.00)
    // Expenses: US01 (+24,250) + DE01 (+10,500) (5900 eliminated) = 34,750.00
    // Net Income: 76,250.00 - 34,750.00 = 41,500.00
    // Accounting Equation: 166,000.00 + 0.00 + (-124,500.00) + (-76,250.00) + 34,750.00 = 0.00
    expect(exactResult.totalAssets).toBe('166000.00');
    expect(exactResult.totalLiabilities).toBe('0.00');
    expect(exactResult.totalEquity).toBe('-124500.00');
    expect(exactResult.totalCTA).toBe('-4500.00');
    expect(exactResult.totalRevenue).toBe('-76250.00');
    expect(exactResult.totalRevenueCredit).toBe('76250.00');
    expect(exactResult.totalExpenses).toBe('34750.00');
    expect(exactResult.netIncome).toBe('41500.00');
    expect(exactResult.accountingEquationImbalance).toBe('0.00');
    expect(exactResult.isBalanced).toBe(true);
  });

  it('consolidateExact surfaces unmatched IC differences without inventing plug accounts', () => {
    const exactResult = ConsolidationEngine.consolidateExact({
      reportingCurrency: 'USD',
      fxRates: [],
      entities: [
        {
          entityId: 'US01',
          entityName: 'US Parent',
          functionalCurrency: 'USD',
          entries: [
            {
              accountCode: '1290',
              accountName: 'IC Receivable',
              postDate: '2026-03-31',
              debit: '10000.00',
              credit: '0.00',
              entityId: 'US01',
              currency: 'USD',
            },
            {
              accountCode: '3000',
              accountName: 'Equity',
              postDate: '2026-03-31',
              debit: '0.00',
              credit: '10000.00',
              entityId: 'US01',
              currency: 'USD',
            },
          ],
        },
        {
          entityId: 'US02',
          entityName: 'US Sub',
          functionalCurrency: 'USD',
          entries: [
            {
              accountCode: '1000',
              accountName: 'Cash',
              postDate: '2026-03-31',
              debit: '9250.00',
              credit: '0.00',
              entityId: 'US02',
              currency: 'USD',
            },
            {
              accountCode: '2190',
              accountName: 'IC Payable',
              postDate: '2026-03-31',
              debit: '0.00',
              credit: '9250.00',
              entityId: 'US02',
              currency: 'USD',
            },
          ],
        },
      ],
      icRules: [
        {
          fromEntityId: 'US01',
          fromAccountCode: '1290',
          toEntityId: 'US02',
          toAccountCode: '2190',
        },
      ],
    });

    expect(exactResult.icReconciliation).toHaveLength(1);
    expect(exactResult.icReconciliation[0]!.status).toBe('unmatched_difference');
    expect(exactResult.icReconciliation[0]!.eliminatedAmount).toBe('9250.00');
    expect(exactResult.icReconciliation[0]!.unmatchedDifference).toBe('750.00');
    // Trial balance still balances (750.00 uneliminated IC Receivable remains on 1290),
    // and hasUnmatchedIC flags the IC discrepancy explicitly.
    expect(exactResult.accountingEquationImbalance).toBe('0.00');
    expect(exactResult.hasUnmatchedIC).toBe(true);
  });
});
