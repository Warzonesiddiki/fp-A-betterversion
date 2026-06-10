import { describe, it, expect } from 'vitest';
import {
  ConsolidationEngine,
  type EntityData,
  type OwnershipStructure,
} from './ConsolidationEngine';
import type { GLEntry } from '@/types';

function createEntry(
  id: string,
  accountCode: string,
  accountName: string,
  amount: number,
  entityId: string
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
    currency: 'USD',
  };
}

describe('ConsolidationEngine - Recursive Hierarchies', () => {
  it('should calculate effective ownership for A -> B -> C', () => {
    const ownerships: OwnershipStructure[] = [
      { parentId: 'A', childId: 'B', ownershipPct: 80, method: 'full' },
      { parentId: 'B', childId: 'C', ownershipPct: 50, method: 'full' },
    ];

    const effectiveMap = ConsolidationEngine.calculateEffectiveOwnership('A', ownerships);

    expect(effectiveMap.get('A')).toBe(100);
    expect(effectiveMap.get('B')).toBe(80);
    expect(effectiveMap.get('C')).toBe(40); // 80% of 50%
  });

  it('should calculate effective ownership for multiple paths A -> B -> D and A -> C -> D', () => {
    const ownerships: OwnershipStructure[] = [
      { parentId: 'A', childId: 'B', ownershipPct: 50, method: 'full' },
      { parentId: 'A', childId: 'C', ownershipPct: 30, method: 'full' },
      { parentId: 'B', childId: 'D', ownershipPct: 40, method: 'full' },
      { parentId: 'C', childId: 'D', ownershipPct: 20, method: 'full' },
    ];

    const effectiveMap = ConsolidationEngine.calculateEffectiveOwnership('A', ownerships);

    expect(effectiveMap.get('B')).toBe(50);
    expect(effectiveMap.get('C')).toBe(30);
    expect(effectiveMap.get('D')).toBe(26); // (50% * 40%) + (30% * 20%) = 20% + 6% = 26%
  });

  it('should calculate minority interest correctly in a recursive hierarchy', () => {
    const aEntries = [createEntry('a1', '1000', 'Cash', 1000, 'A')];
    const bEntries = [
      createEntry('b1', '4000', 'Revenue', 1000, 'B'), // NI = 1000
    ];
    const cEntries = [
      createEntry('c1', '4000', 'Revenue', 1000, 'C'), // NI = 1000
    ];

    const entities: EntityData[] = [
      { entityId: 'A', entityName: 'A Corp', currency: 'USD', entries: aEntries },
      { entityId: 'B', entityName: 'B Corp', currency: 'USD', entries: bEntries },
      { entityId: 'C', entityName: 'C Corp', currency: 'USD', entries: cEntries },
    ];

    const ownerships: OwnershipStructure[] = [
      { parentId: 'A', childId: 'B', ownershipPct: 80, method: 'full' },
      { parentId: 'B', childId: 'C', ownershipPct: 50, method: 'full' },
    ];

    const result = ConsolidationEngine.consolidate(entities, ownerships);

    // B: 80% owned by A. Minority = 20%. Share = 20% of 1000 = 200.
    // C: 40% effectively owned by A. Minority = 60%. Share = 60% of 1000 = 600.

    expect(result.minorityInterestDetails).toHaveLength(2);

    const bDetail = result.minorityInterestDetails.find((d) => d.entityId === 'B');
    const cDetail = result.minorityInterestDetails.find((d) => d.entityId === 'C');

    expect(bDetail?.minorityPct).toBe(20);
    expect(bDetail?.endingBalance).toBe(200);

    expect(cDetail?.minorityPct).toBe(60);
    expect(cDetail?.endingBalance).toBe(600);

    expect(result.minorityInterest).toBe(800); // 200 + 600
  });

  it('should build a hierarchy tree', () => {
    const entities: EntityData[] = [
      { entityId: 'A', entityName: 'A Corp', currency: 'USD', entries: [] },
      { entityId: 'B', entityName: 'B Corp', currency: 'USD', entries: [] },
      { entityId: 'C', entityName: 'C Corp', currency: 'USD', entries: [] },
    ];

    const ownerships: OwnershipStructure[] = [
      { parentId: 'A', childId: 'B', ownershipPct: 80, method: 'full' },
      { parentId: 'B', childId: 'C', ownershipPct: 50, method: 'full' },
    ];

    const tree = ConsolidationEngine.getHierarchyTree('A', ownerships, entities);

    expect(tree.entityId).toBe('A');
    expect(tree.effectivePct).toBe(100);
    expect(tree.children).toHaveLength(1);
    expect(tree!.children[0]!.entityId).toBe('B');
    expect(tree!.children[0]!.effectivePct).toBe(80);
    expect(tree!.children[0]!.children).toHaveLength(1);
    expect(tree!.children[0]!.children[0]!.entityId).toBe('C');
    expect(tree!.children[0]!.children[0]!.effectivePct).toBe(40);
  });
});
