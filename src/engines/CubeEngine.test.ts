import { describe, it, expect, beforeEach } from 'vitest';
import { CubeEngine } from './CubeEngine';

describe('CubeEngine', () => {
  let engine: CubeEngine;

  beforeEach(() => {
    engine = new CubeEngine();
  });

  // --- Dimension Management ---

  describe('registerDimension', () => {
    it('should register a new dimension', () => {
      engine.registerDimension('Product', 'user');
      expect(engine.listDimensions()).toContain('Product');
    });

    it('should throw when registering duplicate dimension', () => {
      engine.registerDimension('Product', 'user');
      expect(() => engine.registerDimension('Product', 'user')).toThrow();
    });

    it('should register system dimension', () => {
      engine.registerDimension('Account', 'system');
      const dim = engine.getDimension('Account');
      expect(dim?.type).toBe('system');
    });

    it('should register dimension with hierarchies', () => {
      engine.registerDimension('Entity', 'user', [
        { name: 'legal', levels: ['group', 'entity'], effectiveDating: false },
      ]);
      const dim = engine.getDimension('Entity');
      expect(dim?.hierarchies).toHaveLength(1);
      expect(dim?.hierarchies[0]!.levels).toEqual(['group', 'entity']);
    });

    it('should register dimension with attributes', () => {
      engine.registerDimension(
        'Product',
        'user',
        [],
        [
          { name: 'category', dataType: 'text' },
          { name: 'price', dataType: 'number' },
        ]
      );
      const dim = engine.getDimension('Product');
      expect(dim?.attributes).toHaveLength(2);
    });
  });

  describe('addMember', () => {
    beforeEach(() => {
      engine.registerDimension('Account', 'system');
    });

    it('should add a member to a dimension', () => {
      const member = engine.addMember('Account', {
        code: '4000',
        name: 'Revenue',
        hierarchy: 'default',
        level: 0,
        isLeaf: true,
        isActive: true,
        attributes: {},
        sortOrder: 1,
      });
      expect(member.id).toBe('Account:4000');
      expect(engine.getMember('Account', 'Account:4000')).toBeDefined();
    });

    it('should throw when dimension not found', () => {
      expect(() =>
        engine.addMember('NonExistent', {
          code: 'X',
          name: 'X',
          hierarchy: 'default',
          level: 0,
          isLeaf: true,
          isActive: true,
          attributes: {},
          sortOrder: 0,
        })
      ).toThrow();
    });

    it('should get all members', () => {
      engine.addMember('Account', {
        code: '4000',
        name: 'Revenue',
        hierarchy: 'default',
        level: 0,
        isLeaf: true,
        isActive: true,
        attributes: {},
        sortOrder: 1,
      });
      engine.addMember('Account', {
        code: '5000',
        name: 'COGS',
        hierarchy: 'default',
        level: 0,
        isLeaf: true,
        isActive: true,
        attributes: {},
        sortOrder: 2,
      });
      expect(engine.getMembers('Account')).toHaveLength(2);
    });

    it('should get leaf members only', () => {
      engine.addMember('Account', {
        code: '4000',
        name: 'Revenue',
        hierarchy: 'default',
        level: 0,
        isLeaf: true,
        isActive: true,
        attributes: {},
        sortOrder: 1,
      });
      engine.addMember('Account', {
        code: '40',
        name: 'Revenue Group',
        hierarchy: 'default',
        level: 0,
        isLeaf: false,
        isActive: true,
        attributes: {},
        sortOrder: 0,
      });
      expect(engine.getLeafMembers('Account')).toHaveLength(1);
    });
  });

  describe('hierarchy navigation', () => {
    beforeEach(() => {
      engine.registerDimension('Entity', 'system', [
        { name: 'legal', levels: ['group', 'entity'], effectiveDating: false },
      ]);
      engine.addMember('Entity', {
        code: 'GRP',
        name: 'Group',
        hierarchy: 'legal',
        level: 0,
        isLeaf: false,
        isActive: true,
        attributes: {},
        sortOrder: 0,
      });
      engine.addMember('Entity', {
        code: 'ENT1',
        name: 'Entity 1',
        hierarchy: 'legal',
        level: 1,
        isLeaf: true,
        isActive: true,
        attributes: {},
        sortOrder: 1,
        parentId: 'GRP',
      });
      engine.addMember('Entity', {
        code: 'ENT2',
        name: 'Entity 2',
        hierarchy: 'legal',
        level: 1,
        isLeaf: true,
        isActive: true,
        attributes: {},
        sortOrder: 2,
        parentId: 'GRP',
      });
    });

    it('should get ancestors', () => {
      const ancestors = engine.getAncestors('Entity', 'Entity:ENT1');
      expect(ancestors).toHaveLength(1);
      expect(ancestors![0]!.code).toBe('GRP');
    });

    it('should get descendants', () => {
      const descendants = engine.getDescendants('Entity', 'Entity:GRP');
      expect(descendants).toHaveLength(2);
    });

    it('should return empty for leaf ancestors', () => {
      expect(engine.getAncestors('Entity', 'Entity:ENT1')).toHaveLength(1);
    });
  });

  // --- Cube Management ---

  describe('registerCube', () => {
    beforeEach(() => {
      engine.registerDimension('Account', 'system');
      engine.registerDimension('Entity', 'system');
      engine.registerDimension('Time', 'system');
    });

    it('should register a cube with dimensions and measures', () => {
      engine.registerCube(
        'Financials',
        ['Account', 'Entity', 'Time'],
        [{ name: 'amount', dataType: 'numeric', aggregation: 'sum' }]
      );
      expect(engine.listCubes()).toContain('Financials');
    });

    it('should throw when dimension not registered', () => {
      expect(() =>
        engine.registerCube(
          'Bad',
          ['NonExistent'],
          [{ name: 'amount', dataType: 'numeric', aggregation: 'sum' }]
        )
      ).toThrow();
    });

    it('should support sparse storage mode', () => {
      engine.registerCube(
        'Financials',
        ['Account', 'Entity'],
        [{ name: 'amount', dataType: 'numeric', aggregation: 'sum' }],
        'sparse'
      );
      const cube = engine.getCube('Financials');
      expect(cube?.storage).toBe('sparse');
    });
  });

  // --- Cell Operations ---

  describe('writeCell / readCell', () => {
    beforeEach(() => {
      engine.registerDimension('Account', 'system');
      engine.registerDimension('Entity', 'system');
      engine.registerDimension('Time', 'system');
      engine.registerCube(
        'Financials',
        ['Account', 'Entity', 'Time'],
        [{ name: 'amount', dataType: 'numeric', aggregation: 'sum' }]
      );
      engine.addMember('Account', {
        code: '4000',
        name: 'Revenue',
        hierarchy: 'default',
        level: 0,
        isLeaf: true,
        isActive: true,
        attributes: {},
        sortOrder: 1,
      });
      engine.addMember('Entity', {
        code: 'ENT1',
        name: 'Entity 1',
        hierarchy: 'default',
        level: 0,
        isLeaf: true,
        isActive: true,
        attributes: {},
        sortOrder: 1,
      });
      engine.addMember('Time', {
        code: '2024-01',
        name: 'Jan 2024',
        hierarchy: 'default',
        level: 0,
        isLeaf: true,
        isActive: true,
        attributes: {},
        sortOrder: 1,
      });
    });

    it('should write and read a cell', async () => {
      await engine.writeCell('Financials', {
        coords: { Account: 'Account:4000', Entity: 'Entity:ENT1', Time: 'Time:2024-01' },
        measure: 'amount',
        value: 10000,
        dataType: 'input',
      });
      const cell = engine.readCell(
        'Financials',
        {
          Account: 'Account:4000',
          Entity: 'Entity:ENT1',
          Time: 'Time:2024-01',
        },
        'amount'
      );
      expect(cell?.value).toBe(10000);
    });

    it('should get cell value directly', async () => {
      await engine.writeCell('Financials', {
        coords: { Account: 'Account:4000', Entity: 'Entity:ENT1', Time: 'Time:2024-01' },
        measure: 'amount',
        value: 5000,
        dataType: 'input',
      });
      expect(
        engine.getCellValue(
          'Financials',
          {
            Account: 'Account:4000',
            Entity: 'Entity:ENT1',
            Time: 'Time:2024-01',
          },
          'amount'
        )
      ).toBe(5000);
    });

    it('should return undefined for missing cell', () => {
      expect(
        engine.getCellValue(
          'Financials',
          {
            Account: 'Account:4000',
            Entity: 'Entity:ENT1',
            Time: 'Time:2024-01',
          },
          'amount'
        )
      ).toBeUndefined();
    });

    it('should throw when cube not found', async () => {
      await expect(
        engine.writeCell('NonExistent', {
          coords: {},
          measure: 'amount',
          value: 100,
          dataType: 'input',
        })
      ).rejects.toThrow();
    });

    it('should throw when missing dimension in coords', async () => {
      await expect(
        engine.writeCell('Financials', {
          coords: { Account: 'Account:4000' },
          measure: 'amount',
          value: 100,
          dataType: 'input',
        })
      ).rejects.toThrow();
    });

    it('should throw when measure not found', async () => {
      await expect(
        engine.writeCell('Financials', {
          coords: { Account: 'Account:4000', Entity: 'Entity:ENT1', Time: 'Time:2024-01' },
          measure: 'nonexistent',
          value: 100,
          dataType: 'input',
        })
      ).rejects.toThrow();
    });

    it('should overwrite existing cell', async () => {
      await engine.writeCell('Financials', {
        coords: { Account: 'Account:4000', Entity: 'Entity:ENT1', Time: 'Time:2024-01' },
        measure: 'amount',
        value: 1000,
        dataType: 'input',
      });
      await engine.writeCell('Financials', {
        coords: { Account: 'Account:4000', Entity: 'Entity:ENT1', Time: 'Time:2024-01' },
        measure: 'amount',
        value: 2000,
        dataType: 'input',
      });
      expect(
        engine.getCellValue(
          'Financials',
          {
            Account: 'Account:4000',
            Entity: 'Entity:ENT1',
            Time: 'Time:2024-01',
          },
          'amount'
        )
      ).toBe(2000);
    });

    it('should delete a cell', async () => {
      await engine.writeCell('Financials', {
        coords: { Account: 'Account:4000', Entity: 'Entity:ENT1', Time: 'Time:2024-01' },
        measure: 'amount',
        value: 1000,
        dataType: 'input',
      });
      const deleted = engine.deleteCell(
        'Financials',
        {
          Account: 'Account:4000',
          Entity: 'Entity:ENT1',
          Time: 'Time:2024-01',
        },
        'amount'
      );
      expect(deleted).toBe(true);
      expect(
        engine.getCellValue(
          'Financials',
          {
            Account: 'Account:4000',
            Entity: 'Entity:ENT1',
            Time: 'Time:2024-01',
          },
          'amount'
        )
      ).toBeUndefined();
    });
  });

  // --- Cell History ---

  describe('cell history', () => {
    beforeEach(() => {
      engine.registerDimension('Account', 'system');
      engine.registerDimension('Time', 'system');
      engine.registerCube(
        'Test',
        ['Account', 'Time'],
        [{ name: 'value', dataType: 'numeric', aggregation: 'sum' }]
      );
      engine.addMember('Account', {
        code: 'A1',
        name: 'A1',
        hierarchy: 'default',
        level: 0,
        isLeaf: true,
        isActive: true,
        attributes: {},
        sortOrder: 1,
      });
      engine.addMember('Time', {
        code: '2024-01',
        name: 'Jan',
        hierarchy: 'default',
        level: 0,
        isLeaf: true,
        isActive: true,
        attributes: {},
        sortOrder: 1,
      });
    });

    it('should record history on write', async () => {
      await engine.writeCell('Test', {
        coords: { Account: 'Account:A1', Time: 'Time:2024-01' },
        measure: 'value',
        value: 100,
        dataType: 'input',
      });
      await engine.writeCell('Test', {
        coords: { Account: 'Account:A1', Time: 'Time:2024-01' },
        measure: 'value',
        value: 200,
        dataType: 'input',
      });
      const history = engine.getCellHistory(
        'Test',
        {
          Account: 'Account:A1',
          Time: 'Time:2024-01',
        },
        'value'
      );
      expect(history).toHaveLength(2);
      expect(history![0]!.oldValue).toBeNull();
      expect(history![0]!.newValue).toBe(100);
      expect(history![1]!.oldValue).toBe(100);
      expect(history![1]!.newValue).toBe(200);
    });

    it('should return empty history for never-written cell', () => {
      const history = engine.getCellHistory(
        'Test',
        {
          Account: 'Account:A1',
          Time: 'Time:2024-01',
        },
        'value'
      );
      expect(history).toHaveLength(0);
    });
  });

  // --- Aggregation ---

  describe('aggregate', () => {
    beforeEach(async () => {
      engine.registerDimension('Account', 'system');
      engine.registerDimension('Entity', 'system');
      engine.registerDimension('Time', 'system');
      engine.registerCube(
        'Financials',
        ['Account', 'Entity', 'Time'],
        [{ name: 'amount', dataType: 'numeric', aggregation: 'sum' }]
      );
      engine.addMember('Account', {
        code: '4000',
        name: 'Revenue',
        hierarchy: 'default',
        level: 0,
        isLeaf: true,
        isActive: true,
        attributes: {},
        sortOrder: 1,
      });
      engine.addMember('Entity', {
        code: 'ENT1',
        name: 'Entity 1',
        hierarchy: 'default',
        level: 0,
        isLeaf: true,
        isActive: true,
        attributes: {},
        sortOrder: 1,
      });
      engine.addMember('Entity', {
        code: 'ENT2',
        name: 'Entity 2',
        hierarchy: 'default',
        level: 0,
        isLeaf: true,
        isActive: true,
        attributes: {},
        sortOrder: 2,
      });
      engine.addMember('Time', {
        code: '2024-01',
        name: 'Jan',
        hierarchy: 'default',
        level: 0,
        isLeaf: true,
        isActive: true,
        attributes: {},
        sortOrder: 1,
      });

      await engine.writeCell('Financials', {
        coords: { Account: 'Account:4000', Entity: 'Entity:ENT1', Time: 'Time:2024-01' },
        measure: 'amount',
        value: 1000,
        dataType: 'input',
      });
      await engine.writeCell('Financials', {
        coords: { Account: 'Account:4000', Entity: 'Entity:ENT2', Time: 'Time:2024-01' },
        measure: 'amount',
        value: 2000,
        dataType: 'input',
      });
    });

    it('should sum across entities', () => {
      const result = engine.aggregate(
        'Financials',
        {
          Account: 'Account:4000',
          Time: 'Time:2024-01',
        },
        'amount',
        'sum'
      );
      expect(result).toBe(3000);
    });

    it('should average across entities', () => {
      const result = engine.aggregate(
        'Financials',
        {
          Account: 'Account:4000',
          Time: 'Time:2024-01',
        },
        'amount',
        'avg'
      );
      expect(result).toBe(1500);
    });

    it('should count cells', () => {
      const result = engine.aggregate(
        'Financials',
        {
          Account: 'Account:4000',
          Time: 'Time:2024-01',
        },
        'amount',
        'count'
      );
      expect(result).toBe(2);
    });

    it('should get min', () => {
      const result = engine.aggregate(
        'Financials',
        {
          Account: 'Account:4000',
          Time: 'Time:2024-01',
        },
        'amount',
        'min'
      );
      expect(result).toBe(1000);
    });

    it('should get max', () => {
      const result = engine.aggregate(
        'Financials',
        {
          Account: 'Account:4000',
          Time: 'Time:2024-01',
        },
        'amount',
        'max'
      );
      expect(result).toBe(2000);
    });

    it('should return null for no matching cells', () => {
      const result = engine.aggregate(
        'Financials',
        {
          Account: 'Account:4000',
          Time: 'Time:2024-99',
        },
        'amount'
      );
      expect(result).toBeNull();
    });
  });

  // --- Snapshots ---

  describe('snapshots', () => {
    beforeEach(async () => {
      engine.registerDimension('Account', 'system');
      engine.registerDimension('Time', 'system');
      engine.registerCube(
        'Test',
        ['Account', 'Time'],
        [{ name: 'value', dataType: 'numeric', aggregation: 'sum' }]
      );
      engine.addMember('Account', {
        code: 'A1',
        name: 'A1',
        hierarchy: 'default',
        level: 0,
        isLeaf: true,
        isActive: true,
        attributes: {},
        sortOrder: 1,
      });
      engine.addMember('Time', {
        code: '2024-01',
        name: 'Jan',
        hierarchy: 'default',
        level: 0,
        isLeaf: true,
        isActive: true,
        attributes: {},
        sortOrder: 1,
      });
    });

    it('should create a snapshot', async () => {
      await engine.writeCell('Test', {
        coords: { Account: 'Account:A1', Time: 'Time:2024-01' },
        measure: 'value',
        value: 100,
        dataType: 'input',
      });
      const snap = engine.createSnapshot('Baseline', 'Initial data');
      expect(snap.name).toBe('Baseline');
      expect(snap.description).toBe('Initial data');
      expect(engine.listSnapshots()).toHaveLength(1);
    });

    it('should compare snapshots', async () => {
      await engine.writeCell('Test', {
        coords: { Account: 'Account:A1', Time: 'Time:2024-01' },
        measure: 'value',
        value: 100,
        dataType: 'input',
      });
      const snapA = engine.createSnapshot('Before');

      await engine.writeCell('Test', {
        coords: { Account: 'Account:A1', Time: 'Time:2024-01' },
        measure: 'value',
        value: 200,
        dataType: 'input',
      });
      const snapB = engine.createSnapshot('After');

      const diff = engine.compareSnapshots(snapA.id, snapB.id);
      expect(diff.summary.cellsChanged).toBe(1);
      expect(diff!.changed[0]!.oldValue).toBe(100);
      expect(diff!.changed[0]!.newValue).toBe(200);
    });

    it('should detect added cells in diff', async () => {
      const snapA = engine.createSnapshot('Empty');

      await engine.writeCell('Test', {
        coords: { Account: 'Account:A1', Time: 'Time:2024-01' },
        measure: 'value',
        value: 500,
        dataType: 'input',
      });
      const snapB = engine.createSnapshot('WithData');

      const diff = engine.compareSnapshots(snapA.id, snapB.id);
      expect(diff.summary.cellsAdded).toBe(1);
    });
  });

  // --- System Dimensions ---

  describe('registerSystemDimensions', () => {
    it('should register all 7 system dimensions', () => {
      engine.registerSystemDimensions();
      const dims = engine.listDimensions();
      expect(dims).toContain('Account');
      expect(dims).toContain('Entity');
      expect(dims).toContain('Time');
      expect(dims).toContain('Scenario');
      expect(dims).toContain('Currency');
      expect(dims).toContain('Version');
      expect(dims).toContain('DataSource');
      expect(dims).toHaveLength(7);
    });

    it('should not duplicate on re-registration', () => {
      engine.registerSystemDimensions();
      engine.registerSystemDimensions();
      expect(engine.listDimensions()).toHaveLength(7);
    });
  });

  // --- Query ---

  describe('query', () => {
    beforeEach(async () => {
      engine.registerSystemDimensions();
      engine.registerCube(
        'Financials',
        ['Account', 'Entity', 'Time'],
        [{ name: 'amount', dataType: 'numeric', aggregation: 'sum' }]
      );
      engine.addMember('Account', {
        code: '4000',
        name: 'Revenue',
        hierarchy: 'default',
        level: 0,
        isLeaf: true,
        isActive: true,
        attributes: {},
        sortOrder: 1,
      });
      engine.addMember('Entity', {
        code: 'ENT1',
        name: 'Entity 1',
        hierarchy: 'default',
        level: 0,
        isLeaf: true,
        isActive: true,
        attributes: {},
        sortOrder: 1,
      });
      engine.addMember('Time', {
        code: '2024-01',
        name: 'Jan',
        hierarchy: 'default',
        level: 0,
        isLeaf: true,
        isActive: true,
        attributes: {},
        sortOrder: 1,
      });
      engine.addMember('Time', {
        code: '2024-02',
        name: 'Feb',
        hierarchy: 'default',
        level: 0,
        isLeaf: true,
        isActive: true,
        attributes: {},
        sortOrder: 2,
      });

      await engine.writeCell('Financials', {
        coords: { Account: 'Account:4000', Entity: 'Entity:ENT1', Time: 'Time:2024-01' },
        measure: 'amount',
        value: 1000,
        dataType: 'input',
      });
      await engine.writeCell('Financials', {
        coords: { Account: 'Account:4000', Entity: 'Entity:ENT1', Time: 'Time:2024-02' },
        measure: 'amount',
        value: 1500,
        dataType: 'input',
      });
    });

    it('should query and return rows', () => {
      const result = engine.query({
        cube: 'Financials',
        rows: ['Time'],
        columns: [],
        filters: [],
        measures: ['amount'],
      });
      expect(result.rows).toHaveLength(2);
    });

    it('should include grand total when requested', () => {
      const result = engine.query({
        cube: 'Financials',
        rows: ['Time'],
        columns: [],
        filters: [],
        measures: ['amount'],
        includeGrandTotal: true,
      });
      expect(result.grandTotal).toBeDefined();
      expect(result.grandTotal![0]).toBe(2500);
    });

    it('should throw when cube not found', () => {
      expect(() =>
        engine.query({
          cube: 'NonExistent',
          rows: [],
          columns: [],
          filters: [],
          measures: [],
        })
      ).toThrow();
    });
  });

  // --- State ---

  describe('state', () => {
    it('should report cell count', async () => {
      expect(engine.getCellCount()).toBe(0);
      engine.registerDimension('A', 'system');
      engine.registerCube('C', ['A'], [{ name: 'v', dataType: 'numeric', aggregation: 'sum' }]);
      engine.addMember('A', {
        code: 'X',
        name: 'X',
        hierarchy: 'default',
        level: 0,
        isLeaf: true,
        isActive: true,
        attributes: {},
        sortOrder: 0,
      });
      await engine.writeCell('C', {
        coords: { A: 'A:X' },
        measure: 'v',
        value: 1,
        dataType: 'input',
      });
      expect(engine.getCellCount()).toBe(1);
    });

    it('should report history count', () => {
      expect(engine.getHistoryCount()).toBe(0);
    });

    it('should clear all data', () => {
      engine.registerDimension('A', 'system');
      engine.registerCube('C', ['A'], [{ name: 'v', dataType: 'numeric', aggregation: 'sum' }]);
      engine.clearAll();
      expect(engine.listDimensions()).toHaveLength(0);
      expect(engine.listCubes()).toHaveLength(0);
      expect(engine.getCellCount()).toBe(0);
    });
  });
});
