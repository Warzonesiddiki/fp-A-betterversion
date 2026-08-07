import { describe, it, expect, beforeEach } from 'vitest';
import {
  ConsolidationEngine,
  type EntityData,
  type OwnershipStructure,
  type ICPair,
  type FXRate,
} from './ConsolidationEngine';
import { CubeEngine } from './CubeEngine';
import type { GLEntry } from '@/types';

// =============================================================================
// INTEGRATION TEST HELPERS
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

function setupCubeEngine(): CubeEngine {
  const cube = new CubeEngine();
  cube.registerSystemDimensions();

  // Register Account dimension members
  cube.addMember('Account', {
    code: '1000',
    name: 'Cash',
    hierarchy: 'reporting',
    level: 0,
    isLeaf: true,
    isActive: true,
    attributes: {},
    sortOrder: 1,
  });
  cube.addMember('Account', {
    code: '1100',
    name: 'IC Receivable',
    hierarchy: 'reporting',
    level: 0,
    isLeaf: true,
    isActive: true,
    attributes: {},
    sortOrder: 2,
  });
  cube.addMember('Account', {
    code: '1500',
    name: 'Investment in Sub',
    hierarchy: 'reporting',
    level: 0,
    isLeaf: true,
    isActive: true,
    attributes: {},
    sortOrder: 3,
  });
  cube.addMember('Account', {
    code: '2000',
    name: 'Accounts Payable',
    hierarchy: 'reporting',
    level: 0,
    isLeaf: true,
    isActive: true,
    attributes: {},
    sortOrder: 4,
  });
  cube.addMember('Account', {
    code: '2100',
    name: 'IC Payable',
    hierarchy: 'reporting',
    level: 0,
    isLeaf: true,
    isActive: true,
    attributes: {},
    sortOrder: 5,
  });
  cube.addMember('Account', {
    code: '3000',
    name: 'Common Stock',
    hierarchy: 'reporting',
    level: 0,
    isLeaf: true,
    isActive: true,
    attributes: {},
    sortOrder: 6,
  });
  cube.addMember('Account', {
    code: '3100',
    name: 'Retained Earnings',
    hierarchy: 'reporting',
    level: 0,
    isLeaf: true,
    isActive: true,
    attributes: {},
    sortOrder: 7,
  });
  cube.addMember('Account', {
    code: '4000',
    name: 'Revenue',
    hierarchy: 'reporting',
    level: 0,
    isLeaf: true,
    isActive: true,
    attributes: {},
    sortOrder: 8,
  });
  cube.addMember('Account', {
    code: '5000',
    name: 'Expense',
    hierarchy: 'reporting',
    level: 0,
    isLeaf: true,
    isActive: true,
    attributes: {},
    sortOrder: 9,
  });

  // Register Entity dimension members
  cube.addMember('Entity', {
    code: 'parent',
    name: 'Parent Corp',
    hierarchy: 'legal',
    level: 0,
    isLeaf: true,
    isActive: true,
    attributes: {},
    sortOrder: 1,
  });
  cube.addMember('Entity', {
    code: 'sub',
    name: 'Sub Inc',
    hierarchy: 'legal',
    level: 1,
    isLeaf: true,
    isActive: true,
    attributes: {},
    parentId: 'parent',
    sortOrder: 2,
  });
  cube.addMember('Entity', {
    code: 'sub2',
    name: 'Sub 2 Inc',
    hierarchy: 'legal',
    level: 1,
    isLeaf: true,
    isActive: true,
    attributes: {},
    parentId: 'parent',
    sortOrder: 3,
  });

  // Register Scenario dimension members
  cube.addMember('Scenario', {
    code: 'actual',
    name: 'Actual',
    hierarchy: 'default',
    level: 0,
    isLeaf: true,
    isActive: true,
    attributes: {},
    sortOrder: 1,
  });
  cube.addMember('Scenario', {
    code: 'budget',
    name: 'Budget',
    hierarchy: 'default',
    level: 0,
    isLeaf: true,
    isActive: true,
    attributes: {},
    sortOrder: 2,
  });

  // Register GL cube
  cube.registerCube(
    'GL',
    ['Account', 'Entity', 'Scenario'],
    [{ name: 'amount', dataType: 'numeric', aggregation: 'sum' }]
  );

  return cube;
}

// =============================================================================
// CONSOLIDATION + CUBE ENGINE INTEGRATION TESTS
// =============================================================================

describe('ConsolidationEngine + CubeEngine Integration', () => {
  let cube: CubeEngine;

  beforeEach(() => {
    cube = setupCubeEngine();
  });

  // =========================================================================
  // CUBE FEEDING CONSOLIDATION
  // =========================================================================

  describe('cube data feeds consolidation', () => {
    it('should consolidate data from cube cells', async () => {
      // Write GL data to cube
      await cube.writeCell('GL', {
        coords: { Account: 'Account:1000', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: 100000,
        dataType: 'input',
      });
      await cube.writeCell('GL', {
        coords: { Account: 'Account:3000', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: -100000,
        dataType: 'input',
      });
      await cube.writeCell('GL', {
        coords: { Account: 'Account:1000', Entity: 'Entity:sub', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: 50000,
        dataType: 'input',
      });
      await cube.writeCell('GL', {
        coords: { Account: 'Account:3000', Entity: 'Entity:sub', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: -50000,
        dataType: 'input',
      });

      // Read from cube and create entities
      const parentCash = cube.getCellValue(
        'GL',
        { Account: 'Account:1000', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        'amount'
      ) as number;
      const parentEquity = cube.getCellValue(
        'GL',
        { Account: 'Account:3000', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        'amount'
      ) as number;
      const subCash = cube.getCellValue(
        'GL',
        { Account: 'Account:1000', Entity: 'Entity:sub', Scenario: 'Scenario:actual' },
        'amount'
      ) as number;
      const subEquity = cube.getCellValue(
        'GL',
        { Account: 'Account:3000', Entity: 'Entity:sub', Scenario: 'Scenario:actual' },
        'amount'
      ) as number;

      const entities: EntityData[] = [
        {
          entityId: 'parent',
          entityName: 'Parent Corp',
          currency: 'USD',
          entries: [
            createEntry('p1', '1000', 'Cash', parentCash, 'parent'),
            createEntry('p2', '3000', 'Common Stock', parentEquity, 'parent'),
          ],
        },
        {
          entityId: 'sub',
          entityName: 'Sub Inc',
          currency: 'USD',
          entries: [
            createEntry('s1', '1000', 'Cash', subCash, 'sub'),
            createEntry('s2', '3000', 'Common Stock', subEquity, 'sub'),
          ],
        },
      ];
      const ownerships: OwnershipStructure[] = [
        { parentId: 'parent', childId: 'sub', ownershipPct: 80, method: 'full' },
      ];

      const result = ConsolidationEngine.consolidate(entities, ownerships, []);

      expect(result.totalAssets).toBe(150000);
      expect(result.isBalanced).toBe(true);
    });

    it('should write consolidated results back to cube', async () => {
      // Write source data
      await cube.writeCell('GL', {
        coords: { Account: 'Account:1000', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: 100000,
        dataType: 'input',
      });
      await cube.writeCell('GL', {
        coords: { Account: 'Account:3000', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: -100000,
        dataType: 'input',
      });

      // Consolidate
      const entities: EntityData[] = [
        {
          entityId: 'parent',
          entityName: 'Parent',
          currency: 'USD',
          entries: [
            createEntry('p1', '1000', 'Cash', 100000, 'parent'),
            createEntry('p2', '3000', 'Equity', -100000, 'parent'),
          ],
        },
      ];

      const result = ConsolidationEngine.consolidate(entities, [], []);

      // Write consolidated result to cube as 'consolidated' entity
      await cube.writeCell('GL', {
        coords: { Account: 'Account:1000', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: result.totalAssets,
        dataType: 'consolidated',
      });

      const consolidatedCash = cube.getCellValue(
        'GL',
        { Account: 'Account:1000', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        'amount'
      );
      expect(consolidatedCash).toBe(100000);
    });

    it('should aggregate across entities using cube', async () => {
      // Write data for multiple entities
      await cube.writeCell('GL', {
        coords: { Account: 'Account:4000', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: 100000,
        dataType: 'input',
      });
      await cube.writeCell('GL', {
        coords: { Account: 'Account:4000', Entity: 'Entity:sub', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: 40000,
        dataType: 'input',
      });
      await cube.writeCell('GL', {
        coords: { Account: 'Account:4000', Entity: 'Entity:sub2', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: 30000,
        dataType: 'input',
      });

      // Aggregate total revenue across all entities
      const totalRevenue = cube.aggregate(
        'GL',
        { Account: 'Account:4000', Scenario: 'Scenario:actual' },
        'amount',
        'sum'
      );

      expect(totalRevenue).toBe(170000);
    });

    it('should query consolidated data with cube dimensions', async () => {
      // Write expense data
      await cube.writeCell('GL', {
        coords: { Account: 'Account:5000', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: -60000,
        dataType: 'input',
      });
      await cube.writeCell('GL', {
        coords: { Account: 'Account:5000', Entity: 'Entity:sub', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: -25000,
        dataType: 'input',
      });

      const result = cube.query({
        cube: 'GL',
        rows: ['Account'],
        columns: ['Entity'],
        filters: [{ dimension: 'Scenario', memberIds: ['Scenario:actual'] }],
        measures: ['amount'],
        aggregation: 'sum',
        includeGrandTotal: true,
      });

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.grandTotal).toBeDefined();
    });
  });

  // =========================================================================
  // CONSOLIDATION WITH IC ELIMINATION + CUBE
  // =========================================================================

  describe('IC elimination with cube', () => {
    it('should eliminate IC entries stored in cube', async () => {
      // Write IC entries to cube (same account code for both sides)
      await cube.writeCell('GL', {
        coords: { Account: 'Account:1100', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: 10000,
        dataType: 'input',
      });
      await cube.writeCell('GL', {
        coords: { Account: 'Account:1100', Entity: 'Entity:sub', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: -10000,
        dataType: 'input',
      });

      // Read IC balances from cube
      const icReceivable = cube.getCellValue(
        'GL',
        { Account: 'Account:1100', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        'amount'
      ) as number;
      const icPayable = cube.getCellValue(
        'GL',
        { Account: 'Account:1100', Entity: 'Entity:sub', Scenario: 'Scenario:actual' },
        'amount'
      ) as number;

      const entities: EntityData[] = [
        {
          entityId: 'parent',
          entityName: 'Parent',
          currency: 'USD',
          entries: [createEntry('p1', '1100', 'IC Receivable', icReceivable, 'parent')],
        },
        {
          entityId: 'sub',
          entityName: 'Sub',
          currency: 'USD',
          entries: [createEntry('s1', '1100', 'IC Payable', icPayable, 'sub')],
        },
      ];
      const icPairs: ICPair[] = [
        {
          fromEntityId: 'parent',
          toEntityId: 'sub',
          accountCode: '1100',
          amount: 10000,
          type: 'receivable',
        },
      ];

      const result = ConsolidationEngine.consolidate(entities, [], icPairs);

      expect(result.eliminations).toHaveLength(1);
      expect(result.totalAssets).toBe(0); // Eliminated
    });

    it('should track IC balances in cube after consolidation', async () => {
      const entities: EntityData[] = [
        {
          entityId: 'parent',
          entityName: 'Parent',
          currency: 'USD',
          entries: [createEntry('p1', '9000', 'IC Sales', 5000, 'parent')],
        },
        {
          entityId: 'sub',
          entityName: 'Sub',
          currency: 'USD',
          entries: [createEntry('s1', '9000', 'IC Purchases', -5000, 'sub')],
        },
      ];

      const result = ConsolidationEngine.consolidate(entities, [], []);

      // Write IC balance to cube for tracking
      await cube.writeCell('GL', {
        coords: { Account: 'Account:9000', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: result.consolidatedEntries.find((e) => e.accountCode === '9000')?.amount ?? 0,
        dataType: 'consolidated',
      });

      const icBalance = cube.getCellValue(
        'GL',
        { Account: 'Account:9000', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        'amount'
      );
      expect(icBalance).toBe(0); // Should be eliminated
    });
  });

  // =========================================================================
  // MINORITY INTEREST + CUBE
  // =========================================================================

  describe('minority interest with cube', () => {
    it('should store minority interest in cube', async () => {
      const subEntries = [
        createEntry('s1', '4000', 'Revenue', 10000, 'sub'),
        createEntry('s2', '5000', 'Expense', -4000, 'sub'),
      ];
      const entities: EntityData[] = [
        { entityId: 'parent', entityName: 'Parent', currency: 'USD', entries: [] },
        { entityId: 'sub', entityName: 'Sub', currency: 'USD', entries: subEntries },
      ];
      const ownerships: OwnershipStructure[] = [
        { parentId: 'parent', childId: 'sub', ownershipPct: 80, method: 'full' },
      ];

      const result = ConsolidationEngine.consolidate(entities, ownerships, []);

      // Store minority interest in cube
      await cube.writeCell('GL', {
        coords: { Account: 'Account:3000', Entity: 'Entity:sub', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: result.minorityInterest,
        dataType: 'consolidated',
      });

      const miInCube = cube.getCellValue(
        'GL',
        { Account: 'Account:3000', Entity: 'Entity:sub', Scenario: 'Scenario:actual' },
        'amount'
      );
      expect(miInCube).toBeCloseTo(1200, 2);
    });
  });

  // =========================================================================
  // SCENARIO COMPARISON + CONSOLIDATION
  // =========================================================================

  describe('scenario comparison', () => {
    it('should consolidate actual vs budget scenarios', async () => {
      // Write actual data
      await cube.writeCell('GL', {
        coords: { Account: 'Account:4000', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: 100000,
        dataType: 'input',
      });
      await cube.writeCell('GL', {
        coords: { Account: 'Account:4000', Entity: 'Entity:sub', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: 40000,
        dataType: 'input',
      });

      // Write budget data
      await cube.writeCell('GL', {
        coords: { Account: 'Account:4000', Entity: 'Entity:parent', Scenario: 'Scenario:budget' },
        measure: 'amount',
        value: 90000,
        dataType: 'input',
      });
      await cube.writeCell('GL', {
        coords: { Account: 'Account:4000', Entity: 'Entity:sub', Scenario: 'Scenario:budget' },
        measure: 'amount',
        value: 35000,
        dataType: 'input',
      });

      // Aggregate actual
      const actualTotal = cube.aggregate(
        'GL',
        { Account: 'Account:4000', Scenario: 'Scenario:actual' },
        'amount',
        'sum'
      );
      // Aggregate budget
      const budgetTotal = cube.aggregate(
        'GL',
        { Account: 'Account:4000', Scenario: 'Scenario:budget' },
        'amount',
        'sum'
      );

      expect(actualTotal!).toBe(140000);
      expect(budgetTotal!).toBe(125000);
      expect(actualTotal! - budgetTotal!).toBe(15000); // Variance
    });
  });

  // =========================================================================
  // SNAPSHOT + CONSOLIDATION
  // =========================================================================

  describe('snapshot integration', () => {
    it('should snapshot before and after consolidation', async () => {
      // Write initial data
      await cube.writeCell('GL', {
        coords: { Account: 'Account:1000', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: 100000,
        dataType: 'input',
      });
      await cube.writeCell('GL', {
        coords: { Account: 'Account:1000', Entity: 'Entity:sub', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: 50000,
        dataType: 'input',
      });

      // Snapshot before consolidation
      const snapBefore = cube.createSnapshot('pre-consolidation', 'Before consolidation');

      // Consolidate and write result
      const entities: EntityData[] = [
        {
          entityId: 'parent',
          entityName: 'Parent',
          currency: 'USD',
          entries: [
            createEntry('p1', '1000', 'Cash', 100000, 'parent'),
            createEntry('p2', '3000', 'Equity', -100000, 'parent'),
          ],
        },
        {
          entityId: 'sub',
          entityName: 'Sub',
          currency: 'USD',
          entries: [
            createEntry('s1', '1000', 'Cash', 50000, 'sub'),
            createEntry('s2', '3000', 'Equity', -50000, 'sub'),
          ],
        },
      ];

      const result = ConsolidationEngine.consolidate(entities, [], []);

      // Write consolidated to cube
      await cube.writeCell('GL', {
        coords: { Account: 'Account:1000', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: result.totalAssets,
        dataType: 'consolidated',
      });

      // Snapshot after
      const snapAfter = cube.createSnapshot('post-consolidation', 'After consolidation');

      // Compare snapshots
      const diff = cube.compareSnapshots(snapBefore.id, snapAfter.id);
      expect(diff.changed.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // MULTI-SUBSIDIARY CONSOLIDATION + CUBE
  // =========================================================================

  describe('multi-subsidiary consolidation', () => {
    it('should consolidate parent + 2 subsidiaries from cube', async () => {
      // Write data for all entities
      await cube.writeCell('GL', {
        coords: { Account: 'Account:1000', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: 200000,
        dataType: 'input',
      });
      await cube.writeCell('GL', {
        coords: { Account: 'Account:1000', Entity: 'Entity:sub', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: 50000,
        dataType: 'input',
      });
      await cube.writeCell('GL', {
        coords: { Account: 'Account:1000', Entity: 'Entity:sub2', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: 30000,
        dataType: 'input',
      });

      // Read from cube
      const parentCash = cube.getCellValue(
        'GL',
        { Account: 'Account:1000', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        'amount'
      ) as number;
      const subCash = cube.getCellValue(
        'GL',
        { Account: 'Account:1000', Entity: 'Entity:sub', Scenario: 'Scenario:actual' },
        'amount'
      ) as number;
      const sub2Cash = cube.getCellValue(
        'GL',
        { Account: 'Account:1000', Entity: 'Entity:sub2', Scenario: 'Scenario:actual' },
        'amount'
      ) as number;

      const entities: EntityData[] = [
        {
          entityId: 'parent',
          entityName: 'Parent',
          currency: 'USD',
          entries: [
            createEntry('p1', '1000', 'Cash', parentCash, 'parent'),
            createEntry('p2', '3000', 'Equity', -parentCash, 'parent'),
          ],
        },
        {
          entityId: 'sub',
          entityName: 'Sub',
          currency: 'USD',
          entries: [
            createEntry('s1', '1000', 'Cash', subCash, 'sub'),
            createEntry('s2', '3000', 'Equity', -subCash, 'sub'),
          ],
        },
        {
          entityId: 'sub2',
          entityName: 'Sub2',
          currency: 'USD',
          entries: [
            createEntry('s3', '1000', 'Cash', sub2Cash, 'sub2'),
            createEntry('s4', '3000', 'Equity', -sub2Cash, 'sub2'),
          ],
        },
      ];
      const ownerships: OwnershipStructure[] = [
        { parentId: 'parent', childId: 'sub', ownershipPct: 80, method: 'full' },
        { parentId: 'parent', childId: 'sub2', ownershipPct: 60, method: 'full' },
      ];

      const result = ConsolidationEngine.consolidate(entities, ownerships, []);

      expect(result.totalAssets).toBe(280000);
      expect(result.minorityInterestDetails).toHaveLength(2);
    });
  });

  // =========================================================================
  // FX TRANSLATION + CUBE
  // =========================================================================

  describe('FX translation with cube', () => {
    it('should translate foreign entity data and consolidate', async () => {
      // Write foreign entity data in EUR
      await cube.writeCell('GL', {
        coords: { Account: 'Account:1000', Entity: 'Entity:sub', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: 50000,
        dataType: 'input',
      });

      // Read raw value
      const rawCash = cube.getCellValue(
        'GL',
        { Account: 'Account:1000', Entity: 'Entity:sub', Scenario: 'Scenario:actual' },
        'amount'
      ) as number;

      const entities: EntityData[] = [
        {
          entityId: 'parent',
          entityName: 'Parent',
          currency: 'USD',
          entries: [
            createEntry('p1', '1000', 'Cash', 100000, 'parent'),
            createEntry('p2', '3000', 'Equity', -100000, 'parent'),
          ],
        },
        {
          entityId: 'sub',
          entityName: 'Foreign Sub',
          currency: 'EUR',
          entries: [
            createEntry('s1', '1000', 'Cash', rawCash, 'sub', 'EUR'),
            createEntry('s2', '3000', 'Equity', -rawCash, 'sub', 'EUR'),
          ],
          isForeign: true,
          functionalCurrency: 'EUR',
        },
      ];
      const ownerships: OwnershipStructure[] = [
        { parentId: 'parent', childId: 'sub', ownershipPct: 80, method: 'full' },
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

      const result = ConsolidationEngine.consolidate(entities, ownerships, [], fxRates);

      // Cash should be translated at closing rate (1.1)
      expect(result.totalAssets).toBe(155000); // 100000 + 50000*1.1
    });
  });

  // =========================================================================
  // CUBE AGGREGATION + CONSOLIDATION
  // =========================================================================

  describe('cube aggregation post-consolidation', () => {
    it('should aggregate consolidated entries by account hierarchy', async () => {
      const entities: EntityData[] = [
        {
          entityId: 'parent',
          entityName: 'Parent',
          currency: 'USD',
          entries: [
            createEntry('p1', '4000', 'Revenue', 100000, 'parent'),
            createEntry('p2', '5000', 'Expense', -60000, 'parent'),
          ],
        },
        {
          entityId: 'sub',
          entityName: 'Sub',
          currency: 'USD',
          entries: [
            createEntry('s1', '4000', 'Revenue', 40000, 'sub'),
            createEntry('s2', '5000', 'Expense', -25000, 'sub'),
          ],
        },
      ];

      const result = ConsolidationEngine.consolidate(entities, [], []);

      // Aggregate consolidated entries by account code before writing to cube
      const aggregatedByAccount = new Map<string, number>();
      for (const entry of result.consolidatedEntries) {
        aggregatedByAccount.set(
          entry.accountCode,
          (aggregatedByAccount.get(entry.accountCode) ?? 0) + entry.amount
        );
      }

      for (const [accountCode, amount] of aggregatedByAccount) {
        await cube.writeCell('GL', {
          coords: {
            Account: `Account:${accountCode}`,
            Entity: 'Entity:parent',
            Scenario: 'Scenario:actual',
          },
          measure: 'amount',
          value: amount,
          dataType: 'consolidated',
        });
      }

      // Query consolidated totals
      const totalRevenue = cube.aggregate(
        'GL',
        { Account: 'Account:4000', Scenario: 'Scenario:actual' },
        'amount',
        'sum'
      );
      const totalExpense = cube.aggregate(
        'GL',
        { Account: 'Account:5000', Scenario: 'Scenario:actual' },
        'amount',
        'sum'
      );

      expect(totalRevenue).toBe(140000);
      expect(totalExpense).toBe(-85000);
    });
  });

  // =========================================================================
  // ERROR HANDLING INTEGRATION
  // =========================================================================

  describe('error handling', () => {
    it('should handle empty cube gracefully', () => {
      // F-0003: an empty consolidation is a failure condition, not a
      // "balanced" no-op. A consumer that discards the empty-entities case
      // must never be told the books tie out — that is exactly the silent
      // "balanced zero" defect the fix closed. Zero entities => status
      // 'failed', isBalanced false, with a validation error explaining why.
      const result = ConsolidationEngine.consolidate([], [], []);
      expect(result.status).toBe('failed');
      expect(result.isBalanced).toBe(false);
      expect(result.totalAssets).toBe(0);
      expect(result.errors?.[0]?.message).toMatch(/no entities provided/i);
    });

    it('should handle missing cube cells', () => {
      const cash = cube.getCellValue(
        'GL',
        { Account: 'Account:1000', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        'amount'
      );
      expect(cash).toBeUndefined();

      const entities: EntityData[] = [
        { entityId: 'parent', entityName: 'Parent', currency: 'USD', entries: [] },
      ];

      const result = ConsolidationEngine.consolidate(entities, [], []);
      expect(result.isBalanced).toBe(true);
    });

    it('should handle non-existent entity in cube', () => {
      const value = cube.getCellValue(
        'GL',
        { Account: 'Account:1000', Entity: 'Entity:nonexistent', Scenario: 'Scenario:actual' },
        'amount'
      );
      expect(value).toBeUndefined();
    });

    it('should handle consolidation with no IC pairs', () => {
      const entities: EntityData[] = [
        {
          entityId: 'parent',
          entityName: 'Parent',
          currency: 'USD',
          entries: [
            createEntry('p1', '1000', 'Cash', 100000, 'parent'),
            createEntry('p2', '3000', 'Equity', -100000, 'parent'),
          ],
        },
        {
          entityId: 'sub',
          entityName: 'Sub',
          currency: 'USD',
          entries: [
            createEntry('s1', '1000', 'Cash', 50000, 'sub'),
            createEntry('s2', '3000', 'Equity', -50000, 'sub'),
          ],
        },
      ];
      const ownerships: OwnershipStructure[] = [
        { parentId: 'parent', childId: 'sub', ownershipPct: 100, method: 'full' },
      ];

      const result = ConsolidationEngine.consolidate(entities, ownerships, []);

      expect(result.totalAssets).toBe(150000);
      expect(result.minorityInterest).toBe(0);
    });
  });

  // =========================================================================
  // VALIDATION + CUBE
  // =========================================================================

  describe('validation integration', () => {
    it('should validate consolidated data stored in cube', async () => {
      const entities: EntityData[] = [
        {
          entityId: 'parent',
          entityName: 'Parent',
          currency: 'USD',
          entries: [
            createEntry('p1', '1000', 'Cash', 100000, 'parent'),
            createEntry('p2', '3000', 'Equity', -100000, 'parent'),
          ],
        },
      ];

      const result = ConsolidationEngine.consolidate(entities, [], []);

      // Write to cube
      for (const entry of result.consolidatedEntries) {
        await cube.writeCell('GL', {
          coords: {
            Account: `Account:${entry.accountCode}`,
            Entity: 'Entity:parent',
            Scenario: 'Scenario:actual',
          },
          measure: 'amount',
          value: entry.amount,
          dataType: 'consolidated',
        });
      }

      // Validate
      const validation = ConsolidationEngine.validate(result);
      expect(validation.valid).toBe(true);

      // Verify cube has the data
      const cashInCube = cube.getCellValue(
        'GL',
        { Account: 'Account:1000', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        'amount'
      );
      expect(cashInCube).toBe(100000);
    });

    it('should detect and report imbalanced consolidation in cube', async () => {
      const entities: EntityData[] = [
        {
          entityId: 'parent',
          entityName: 'Parent',
          currency: 'USD',
          entries: [
            createEntry('p1', '1000', 'Cash', 100000, 'parent'),
            // Missing equity — will be imbalanced
          ],
        },
      ];

      const result = ConsolidationEngine.consolidate(entities, [], []);

      // Write to cube
      for (const entry of result.consolidatedEntries) {
        await cube.writeCell('GL', {
          coords: {
            Account: `Account:${entry.accountCode}`,
            Entity: 'Entity:parent',
            Scenario: 'Scenario:actual',
          },
          measure: 'amount',
          value: entry.amount,
          dataType: 'consolidated',
        });
      }

      const validation = ConsolidationEngine.validate(result);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // FULL END-TO-END INTEGRATION
  // =========================================================================

  describe('end-to-end consolidation workflow', () => {
    it('should complete full consolidation workflow with cube', async () => {
      // Step 1: Write source data to cube
      await cube.writeCell('GL', {
        coords: { Account: 'Account:1000', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: 200000,
        dataType: 'input',
      });
      await cube.writeCell('GL', {
        coords: { Account: 'Account:1500', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: 80000,
        dataType: 'input',
      });
      await cube.writeCell('GL', {
        coords: { Account: 'Account:3000', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: -280000,
        dataType: 'input',
      });
      await cube.writeCell('GL', {
        coords: { Account: 'Account:1000', Entity: 'Entity:sub', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: 50000,
        dataType: 'input',
      });
      await cube.writeCell('GL', {
        coords: { Account: 'Account:3000', Entity: 'Entity:sub', Scenario: 'Scenario:actual' },
        measure: 'amount',
        value: -50000,
        dataType: 'input',
      });

      // Step 2: Read from cube
      const parentCash = cube.getCellValue(
        'GL',
        { Account: 'Account:1000', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        'amount'
      ) as number;
      const parentInvestment = cube.getCellValue(
        'GL',
        { Account: 'Account:1500', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        'amount'
      ) as number;
      const parentEquity = cube.getCellValue(
        'GL',
        { Account: 'Account:3000', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        'amount'
      ) as number;
      const subCash = cube.getCellValue(
        'GL',
        { Account: 'Account:1000', Entity: 'Entity:sub', Scenario: 'Scenario:actual' },
        'amount'
      ) as number;
      const subEquity = cube.getCellValue(
        'GL',
        { Account: 'Account:3000', Entity: 'Entity:sub', Scenario: 'Scenario:actual' },
        'amount'
      ) as number;

      // Step 3: Build entities
      const entities: EntityData[] = [
        {
          entityId: 'parent',
          entityName: 'Parent',
          currency: 'USD',
          entries: [
            createEntry('p1', '1000', 'Cash', parentCash, 'parent'),
            createEntry('p2', '1500', 'Investment in Sub', parentInvestment, 'parent'),
            createEntry('p3', '3000', 'Common Stock', parentEquity, 'parent'),
          ],
        },
        {
          entityId: 'sub',
          entityName: 'Sub',
          currency: 'USD',
          entries: [
            createEntry('s1', '1000', 'Cash', subCash, 'sub'),
            createEntry('s2', '3000', 'Common Stock', subEquity, 'sub'),
          ],
        },
      ];
      const ownerships: OwnershipStructure[] = [
        { parentId: 'parent', childId: 'sub', ownershipPct: 80, method: 'full' },
      ];
      const icPairs: ICPair[] = [
        {
          fromEntityId: 'parent',
          toEntityId: 'sub',
          accountCode: '1500',
          amount: 80000,
          type: 'investment',
        },
      ];

      // Step 4: Consolidate
      const result = ConsolidationEngine.consolidate(entities, ownerships, icPairs);

      // Step 5: Validate
      const _validation = ConsolidationEngine.validate(result);

      // Assertions: parent cash (200000) + sub cash (50000) = 250000, investment eliminated
      expect(result.totalAssets).toBe(250000);
      expect(result.minorityInterestDetails).toHaveLength(1);
      expect(result.eliminations.length).toBeGreaterThan(0);

      // Step 7: Verify cube has consolidated data
      // Aggregate consolidated entries by account before writing
      const aggregatedByAccount = new Map<string, number>();
      for (const entry of result.consolidatedEntries) {
        aggregatedByAccount.set(
          entry.accountCode,
          (aggregatedByAccount.get(entry.accountCode) ?? 0) + entry.amount
        );
      }
      for (const [accountCode, amount] of aggregatedByAccount) {
        await cube.writeCell('GL', {
          coords: {
            Account: `Account:${accountCode}`,
            Entity: 'Entity:parent',
            Scenario: 'Scenario:actual',
          },
          measure: 'amount',
          value: amount,
          dataType: 'consolidated',
        });
      }

      const consolidatedCash = cube.getCellValue(
        'GL',
        { Account: 'Account:1000', Entity: 'Entity:parent', Scenario: 'Scenario:actual' },
        'amount'
      );
      expect(consolidatedCash).toBe(250000);
    });
  });
});
