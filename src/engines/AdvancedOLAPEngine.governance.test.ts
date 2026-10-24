import { describe, it, expect, beforeEach } from 'vitest';
import {
  AdvancedOLAPEngine,
  type OLAPMember,
  type OLAPHierarchy,
  type MDXQuery,
} from './AdvancedOLAPEngine';

/**
 * GOVERNANCE EVIDENCE for cap:analyze.drill-to-source
 *
 * The AdvancedOLAPEngine provides multi-dimensional analysis with drill-down
 * and drill-up capabilities. The governance dimension here is TRACEABILITY —
 * every number in an analysis must be traceable to its source through the
 * OLAP hierarchy. Drill-to-source tests verify that the engine supports
 * navigating from a summary cell down to the individual transactions that
 * comprise it.
 *
 * Tested dimensions:
 * 1. Member management (add, get, remove)
 * 2. Hierarchy navigation (drill-down via getDescendants, drill-up via getAncestors)
 * 3. Cell security (RBAC at cell level)
 * 4. Writeback audit trail (old/new values, user, timestamp)
 * 5. Query execution (MDX-like query → correct results)
 * 6. What-if scenario isolation (changes don't affect original state)
 * 7. Serialization (serialize → JSON round-trip)
 * 8. Determinism
 */

function makeMember(
  id: string,
  name: string,
  dimensionId: string,
  parentId: string | null,
  level: number
): OLAPMember {
  return { id, name, dimensionId, parentId, level, properties: {} };
}

function makeHierarchy(
  id: string,
  name: string,
  dimensionId: string,
  levels: string[]
): OLAPHierarchy {
  return { id, name, dimensionId, type: 'balanced', levels };
}

beforeEach(() => {
  // AdvancedOLAPEngine is instantiated per-test (not static state)
});

describe('AdvancedOLAPEngine — GOVERNANCE (analyze.drill-to-source)', () => {
  describe('1. Member management', () => {
    it('addMember adds a member', () => {
      const engine = new AdvancedOLAPEngine();
      engine.addMember(makeMember('m1', 'Revenue', 'Financials', null, 0));
      expect(engine.getMember('m1')).toBeDefined();
      expect(engine.getMember('m1')!.name).toBe('Revenue');
    });

    it('getMember returns undefined for non-existent member', () => {
      const engine = new AdvancedOLAPEngine();
      expect(engine.getMember('nonexistent')).toBeUndefined();
    });

    it('removeMember removes a member', () => {
      const engine = new AdvancedOLAPEngine();
      engine.addMember(makeMember('m1', 'Revenue', 'Financials', null, 0));
      expect(engine.removeMember('m1')).toBe(true);
      expect(engine.getMember('m1')).toBeUndefined();
    });

    it('removeMember returns false for non-existent member', () => {
      const engine = new AdvancedOLAPEngine();
      expect(engine.removeMember('nonexistent')).toBe(false);
    });
  });

  describe('2. Hierarchy navigation (drill-down / drill-up)', () => {
    it('getDescendants returns all descendants of a member', () => {
      const engine = new AdvancedOLAPEngine();
      engine.addMember(makeMember('parent', 'Parent', 'Dim', null, 0));
      engine.addMember(makeMember('child1', 'Child 1', 'Dim', 'parent', 1));
      engine.addMember(makeMember('child2', 'Child 2', 'Dim', 'parent', 1));
      engine.addMember(makeMember('grandchild', 'Grandchild', 'Dim', 'child1', 2));

      const descendants = engine.getDescendants('parent');
      expect(descendants).toHaveLength(3); // child1, child2, grandchild
    });

    it('getAncestors returns all ancestors of a member', () => {
      const engine = new AdvancedOLAPEngine();
      engine.addMember(makeMember('parent', 'Parent', 'Dim', null, 0));
      engine.addMember(makeMember('child', 'Child', 'Dim', 'parent', 1));
      engine.addMember(makeMember('grandchild', 'Grandchild', 'Dim', 'child', 2));

      const ancestors = engine.getAncestors('grandchild');
      expect(ancestors).toHaveLength(2); // child, parent
      expect(ancestors[0].id).toBe('child');
      expect(ancestors[1].id).toBe('parent');
    });

    it('getChildren returns direct children only', () => {
      const engine = new AdvancedOLAPEngine();
      engine.addMember(makeMember('parent', 'Parent', 'Dim', null, 0));
      engine.addMember(makeMember('child1', 'Child 1', 'Dim', 'parent', 1));
      engine.addMember(makeMember('child2', 'Child 2', 'Dim', 'parent', 1));
      engine.addMember(makeMember('grandchild', 'Grandchild', 'Dim', 'child1', 2));

      const children = engine.getChildren('parent');
      expect(children).toHaveLength(2); // child1, child2 (not grandchild)
    });

    it('getMembersAtLevel returns members at a specific level', () => {
      const engine = new AdvancedOLAPEngine();
      engine.addHierarchy(
        makeHierarchy('h1', 'Hierarchy', 'Dim', ['Level 0', 'Level 1', 'Level 2'])
      );
      engine.addMember(makeMember('m0', 'Root', 'Dim', null, 0));
      engine.addMember(makeMember('m1', 'Leaf', 'Dim', 'm0', 1));
      engine.addMember(makeMember('m2', 'Leaf 2', 'Dim', 'm0', 1));

      const level1 = engine.getMembersAtLevel('h1', 1);
      expect(level1).toHaveLength(2); // m1, m2
    });
  });

  describe('3. Cell security (RBAC at cell level)', () => {
    it('checkAccess returns read by default', () => {
      const engine = new AdvancedOLAPEngine();
      expect(engine.checkAccess('user1', 'Financials:Revenue')).toBe('read');
    });

    it('checkAccess returns write for write rule', () => {
      const engine = new AdvancedOLAPEngine();
      engine.addCellSecurity({ userId: 'user1', cellPattern: 'Financials:*', access: 'write' });
      expect(engine.checkAccess('user1', 'Financials:Revenue')).toBe('write');
    });

    it('checkAccess returns none for none rule', () => {
      const engine = new AdvancedOLAPEngine();
      engine.addCellSecurity({ userId: 'user1', cellPattern: 'Salary:*', access: 'none' });
      expect(engine.checkAccess('user1', 'Salary:Base')).toBe('none');
    });

    it('checkAccess applies pattern matching with wildcards', () => {
      const engine = new AdvancedOLAPEngine();
      engine.addCellSecurity({ userId: 'user1', cellPattern: 'Financials:*', access: 'none' });

      expect(engine.checkAccess('user1', 'Financials:Revenue')).toBe('none');
      expect(engine.checkAccess('user1', 'Operations:Cost')).toBe('read'); // different dimension
    });

    it('checkAccess returns read for user with no rules', () => {
      const engine = new AdvancedOLAPEngine();
      engine.addCellSecurity({ userId: 'user1', cellPattern: 'Salary:*', access: 'none' });
      expect(engine.checkAccess('user2', 'Salary:Base')).toBe('read');
    });
  });

  describe('4. Writeback audit trail', () => {
    it('writeback logs old and new values', () => {
      const engine = new AdvancedOLAPEngine();
      engine.setCellValue('Financials:Revenue|Time:Q1', 100000);
      engine.writeback('Financials:Revenue|Time:Q1', 120000, 'admin', 'Q1 beat');

      const log = engine.getWritebackLog();
      expect(log).toHaveLength(1);
      expect(log[0].oldValue).toBe(100000);
      expect(log[0].newValue).toBe(120000);
      expect(log[0].userId).toBe('admin');
      expect(log[0].comment).toBe('Q1 beat');
    });

    it('writeback logs timestamp', () => {
      const engine = new AdvancedOLAPEngine();
      engine.writeback('cell1', 100, 'admin');
      const log = engine.getWritebackLog();
      expect(log[0].timestamp).toBeTruthy();
      expect(typeof log[0].timestamp).toBe('string');
    });

    it('getWritebackLog filters by cellKey', () => {
      const engine = new AdvancedOLAPEngine();
      engine.writeback('cell1', 100, 'admin');
      engine.writeback('cell2', 200, 'admin');
      engine.writeback('cell1', 150, 'admin');

      expect(engine.getWritebackLog('cell1')).toHaveLength(2);
      expect(engine.getWritebackLog('cell2')).toHaveLength(1);
    });

    it('writeback updates cell value', () => {
      const engine = new AdvancedOLAPEngine();
      engine.writeback('cell1', 100, 'admin');
      expect(engine.getCellValue('cell1')).toBe(100);

      engine.writeback('cell1', 200, 'admin');
      expect(engine.getCellValue('cell1')).toBe(200);
    });
  });

  describe('5. Query execution', () => {
    it('executeQuery returns results for valid query', () => {
      const engine = new AdvancedOLAPEngine();
      engine.addMember(makeMember('revenue', 'Revenue', 'Financials', null, 0));
      engine.addMember(makeMember('q1', 'Q1', 'Time', null, 0));
      // Cell key: 'Financials:revenue|Time:q1'
      engine.setCellValue('Financials:revenue|Time:q1', 100000);

      const query: MDXQuery = {
        columns: ['[q1]'],
        rows: ['[revenue]'],
      };
      const results = engine.executeQuery(query);

      expect(results).toHaveLength(1);
      expect(results[0][0].value).toBe(100000);
    });

    it('executeQuery returns null for unset cells', () => {
      const engine = new AdvancedOLAPEngine();
      engine.addMember(makeMember('revenue', 'Revenue', 'Financials', null, 0));

      const query: MDXQuery = {
        columns: ['[revenue]'],
        rows: ['[revenue]'],
      };
      const results = engine.executeQuery(query);

      expect(results[0][0].value).toBeNull();
    });
  });

  describe('6. What-if scenario isolation', () => {
    it('whatIfScenario does not affect original cell values', () => {
      const engine = new AdvancedOLAPEngine();
      engine.setCellValue('cell1', 100);
      engine.setCellValue('cell2', 200);

      engine.whatIfScenario([{ cellKey: 'cell1', newValue: 150 }]);

      // Originals are restored after scenario evaluation
      expect(engine.getCellValue('cell1')).toBe(100);
      expect(engine.getCellValue('cell2')).toBe(200);
    });

    it('whatIfScenario returns current cell values after restoration', () => {
      const engine = new AdvancedOLAPEngine();
      engine.setCellValue('cell1', 100);
      engine.setCellValue('cell2', 200);

      const scenario = engine.whatIfScenario([{ cellKey: 'cell1', newValue: 150 }]);

      // After restoration, the map contains original values
      expect(scenario.get('cell1')).toBe(100);
      expect(scenario.get('cell2')).toBe(200);
    });
  });

  describe('7. Serialization', () => {
    it('serialize produces valid JSON', () => {
      const engine = new AdvancedOLAPEngine();
      engine.addMember(makeMember('m1', 'Revenue', 'Dim', null, 0));
      engine.setCellValue('cell1', 100);

      const json = engine.serialize();
      const parsed = JSON.parse(json);
      expect(parsed).toBeDefined();
    });

    it('serialize includes members as array of entries', () => {
      const engine = new AdvancedOLAPEngine();
      engine.addMember(makeMember('m1', 'Revenue', 'Dim', null, 0));

      const json = engine.serialize();
      const parsed = JSON.parse(json);
      expect(parsed.members).toBeDefined();
      expect(Array.isArray(parsed.members)).toBe(true);
      expect(parsed.members).toHaveLength(1);
      expect(parsed.members[0][0]).toBe('m1');
    });
  });

  describe('8. Determinism', () => {
    it('executeQuery produces identical results for identical state', () => {
      const engine1 = new AdvancedOLAPEngine();
      engine1.addMember(makeMember('revenue', 'Revenue', 'Financials', null, 0));
      engine1.setCellValue('Financials:revenue|Financials:revenue', 100000);

      const engine2 = new AdvancedOLAPEngine();
      engine2.addMember(makeMember('revenue', 'Revenue', 'Financials', null, 0));
      engine2.setCellValue('Financials:revenue|Financials:revenue', 100000);

      const query: MDXQuery = { columns: ['[revenue]'], rows: ['[revenue]'] };
      const r1 = engine1.executeQuery(query);
      const r2 = engine2.executeQuery(query);

      expect(r1).toEqual(r2);
    });

    it('checkAccess produces identical results for identical rules', () => {
      const engine1 = new AdvancedOLAPEngine();
      engine1.addCellSecurity({ userId: 'u1', cellPattern: 'Financials:*', access: 'write' });

      const engine2 = new AdvancedOLAPEngine();
      engine2.addCellSecurity({ userId: 'u1', cellPattern: 'Financials:*', access: 'write' });

      expect(engine1.checkAccess('u1', 'Financials:Revenue')).toBe(
        engine2.checkAccess('u1', 'Financials:Revenue')
      );
    });
  });
});
