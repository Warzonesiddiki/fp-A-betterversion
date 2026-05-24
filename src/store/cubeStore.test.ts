import { describe, it, expect, beforeEach } from 'vitest';
import { useCubeStore, getEngine, resetEngine } from './cubeStore';

describe('cubeStore', () => {
  beforeEach(() => {
    resetEngine();
    useCubeStore.setState({
      engine: getEngine(),
      isInitialized: false,
      cellCount: 0,
      historyCount: 0,
      snapshots: [],
    });
  });

  describe('initialize', () => {
    it('should register system dimensions', () => {
      useCubeStore.getState().initialize();
      const dims = getEngine().listDimensions();
      expect(dims).toContain('Account');
      expect(dims).toContain('Entity');
      expect(dims).toContain('Time');
      expect(dims).toContain('Scenario');
      expect(dims).toContain('Currency');
      expect(dims).toContain('Version');
      expect(dims).toContain('DataSource');
    });

    it('should register GL_Actuals cube', () => {
      useCubeStore.getState().initialize();
      const cube = getEngine().getCube('GL_Actuals');
      expect(cube).toBeDefined();
      expect(cube!.dimensions).toEqual(['Account', 'Entity', 'Time', 'Scenario', 'Currency']);
      expect(cube!.measures).toHaveLength(4);
    });

    it('should register GL_Budget cube', () => {
      useCubeStore.getState().initialize();
      const cube = getEngine().getCube('GL_Budget');
      expect(cube).toBeDefined();
    });

    it('should register GL_Forecast cube', () => {
      useCubeStore.getState().initialize();
      const cube = getEngine().getCube('GL_Forecast');
      expect(cube).toBeDefined();
    });

    it('should add default Scenario members', () => {
      useCubeStore.getState().initialize();
      const members = getEngine().getMembers('Scenario');
      expect(members).toHaveLength(3);
      expect(members.map((m) => m.code)).toEqual(['Actual', 'Budget', 'Forecast']);
    });

    it('should add default Currency members', () => {
      useCubeStore.getState().initialize();
      const members = getEngine().getMembers('Currency');
      expect(members).toHaveLength(1);
      expect(members[0].code).toBe('USD');
    });

    it('should set isInitialized to true', () => {
      useCubeStore.getState().initialize();
      expect(useCubeStore.getState().isInitialized).toBe(true);
    });

    it('should update cellCount and historyCount', () => {
      useCubeStore.getState().initialize();
      expect(useCubeStore.getState().cellCount).toBe(0);
      expect(useCubeStore.getState().historyCount).toBe(0);
    });
  });

  describe('writeCell / readCell', () => {
    beforeEach(() => {
      useCubeStore.getState().initialize();
    });

    it('should write and read a numeric cell', () => {
      const store = useCubeStore.getState();
      const coords = {
        Account: 'Account:1000',
        Entity: 'Entity:ent1',
        Time: 'Time:2026-Q1-M01',
        Scenario: 'Scenario:Actual',
        Currency: 'Currency:USD',
      };
      store.writeCell('GL_Actuals', coords, 'debit', 1500.5, 'input');
      const cell = store.readCell('GL_Actuals', coords, 'debit');
      expect(cell).toBeDefined();
      expect(cell!.value).toBe(1500.5);
      expect(cell!.dataType).toBe('input');
    });

    it('should write and read a string cell', () => {
      const store = useCubeStore.getState();
      const coords = {
        Account: 'Account:1000',
        Entity: 'Entity:ent1',
        Time: 'Time:2026-Q1-M01',
        Scenario: 'Scenario:Actual',
        Currency: 'Currency:USD',
      };
      store.writeCell('GL_Actuals', coords, 'amount', 'test-value', 'input');
      const cell = store.readCell('GL_Actuals', coords, 'amount');
      expect(cell).toBeDefined();
      expect(cell!.value).toBe('test-value');
    });

    it('should return undefined for non-existent cell', () => {
      const store = useCubeStore.getState();
      const coords = {
        Account: 'Account:9999',
        Entity: 'Entity:ent1',
        Time: 'Time:2026-Q1-M01',
        Scenario: 'Scenario:Actual',
        Currency: 'Currency:USD',
      };
      const cell = store.readCell('GL_Actuals', coords, 'debit');
      expect(cell).toBeUndefined();
    });

    it('should update cellCount after write', () => {
      const store = useCubeStore.getState();
      const coords = {
        Account: 'Account:1000',
        Entity: 'Entity:ent1',
        Time: 'Time:2026-Q1-M01',
        Scenario: 'Scenario:Actual',
        Currency: 'Currency:USD',
      };
      store.writeCell('GL_Actuals', coords, 'debit', 100, 'input');
      expect(useCubeStore.getState().cellCount).toBe(1);
      store.writeCell('GL_Actuals', coords, 'credit', 50, 'input');
      expect(useCubeStore.getState().cellCount).toBe(2);
    });

    it('should track history after write', () => {
      const store = useCubeStore.getState();
      const coords = {
        Account: 'Account:1000',
        Entity: 'Entity:ent1',
        Time: 'Time:2026-Q1-M01',
        Scenario: 'Scenario:Actual',
        Currency: 'Currency:USD',
      };
      store.writeCell('GL_Actuals', coords, 'debit', 100, 'input');
      expect(useCubeStore.getState().historyCount).toBe(1);
      store.writeCell('GL_Actuals', coords, 'debit', 200, 'input');
      expect(useCubeStore.getState().historyCount).toBe(2);
    });
  });

  describe('getCellValue', () => {
    beforeEach(() => {
      useCubeStore.getState().initialize();
    });

    it('should return the value directly', () => {
      const store = useCubeStore.getState();
      const coords = {
        Account: 'Account:1000',
        Entity: 'Entity:ent1',
        Time: 'Time:2026-Q1-M01',
        Scenario: 'Scenario:Actual',
        Currency: 'Currency:USD',
      };
      store.writeCell('GL_Actuals', coords, 'debit', 42.5, 'input');
      expect(store.getCellValue('GL_Actuals', coords, 'debit')).toBe(42.5);
    });

    it('should return undefined for missing cell', () => {
      const store = useCubeStore.getState();
      const coords = {
        Account: 'Account:missing',
        Entity: 'Entity:ent1',
        Time: 'Time:2026-Q1-M01',
        Scenario: 'Scenario:Actual',
        Currency: 'Currency:USD',
      };
      expect(store.getCellValue('GL_Actuals', coords, 'debit')).toBeUndefined();
    });
  });

  describe('deleteCell', () => {
    beforeEach(() => {
      useCubeStore.getState().initialize();
    });

    it('should delete an existing cell', () => {
      const store = useCubeStore.getState();
      const coords = {
        Account: 'Account:1000',
        Entity: 'Entity:ent1',
        Time: 'Time:2026-Q1-M01',
        Scenario: 'Scenario:Actual',
        Currency: 'Currency:USD',
      };
      store.writeCell('GL_Actuals', coords, 'debit', 100, 'input');
      const deleted = store.deleteCell('GL_Actuals', coords, 'debit');
      expect(deleted).toBe(true);
      expect(store.readCell('GL_Actuals', coords, 'debit')).toBeUndefined();
    });

    it('should return false for non-existent cell', () => {
      const store = useCubeStore.getState();
      const coords = {
        Account: 'Account:9999',
        Entity: 'Entity:ent1',
        Time: 'Time:2026-Q1-M01',
        Scenario: 'Scenario:Actual',
        Currency: 'Currency:USD',
      };
      const deleted = store.deleteCell('GL_Actuals', coords, 'debit');
      expect(deleted).toBe(false);
    });
  });

  describe('aggregate', () => {
    beforeEach(() => {
      useCubeStore.getState().initialize();
    });

    it('should sum debit values across accounts', () => {
      const store = useCubeStore.getState();
      const baseCoords = {
        Entity: 'Entity:ent1',
        Time: 'Time:2026-Q1-M01',
        Scenario: 'Scenario:Actual',
        Currency: 'Currency:USD',
      };
      store.writeCell(
        'GL_Actuals',
        { ...baseCoords, Account: 'Account:1000' },
        'debit',
        100,
        'input'
      );
      store.writeCell(
        'GL_Actuals',
        { ...baseCoords, Account: 'Account:2000' },
        'debit',
        200,
        'input'
      );
      store.writeCell(
        'GL_Actuals',
        { ...baseCoords, Account: 'Account:3000' },
        'debit',
        300,
        'input'
      );

      const total = store.aggregate('GL_Actuals', baseCoords, 'debit', 'sum');
      expect(total).toBe(600);
    });

    it('should compute average correctly', () => {
      const store = useCubeStore.getState();
      const baseCoords = {
        Entity: 'Entity:ent1',
        Time: 'Time:2026-Q1-M01',
        Scenario: 'Scenario:Actual',
        Currency: 'Currency:USD',
      };
      store.writeCell(
        'GL_Actuals',
        { ...baseCoords, Account: 'Account:1000' },
        'debit',
        100,
        'input'
      );
      store.writeCell(
        'GL_Actuals',
        { ...baseCoords, Account: 'Account:2000' },
        'debit',
        300,
        'input'
      );

      const avg = store.aggregate('GL_Actuals', baseCoords, 'debit', 'avg');
      expect(avg).toBe(200);
    });

    it('should count cells', () => {
      const store = useCubeStore.getState();
      const baseCoords = {
        Entity: 'Entity:ent1',
        Time: 'Time:2026-Q1-M01',
        Scenario: 'Scenario:Actual',
        Currency: 'Currency:USD',
      };
      store.writeCell(
        'GL_Actuals',
        { ...baseCoords, Account: 'Account:1000' },
        'debit',
        100,
        'input'
      );
      store.writeCell(
        'GL_Actuals',
        { ...baseCoords, Account: 'Account:2000' },
        'debit',
        200,
        'input'
      );

      const count = store.aggregate('GL_Actuals', baseCoords, 'debit', 'count');
      expect(count).toBe(2);
    });

    it('should return null when no cells match', () => {
      const store = useCubeStore.getState();
      const result = store.aggregate('GL_Actuals', { Entity: 'Entity:nobody' }, 'debit', 'sum');
      expect(result).toBeNull();
    });
  });

  describe('query', () => {
    beforeEach(() => {
      useCubeStore.getState().initialize();
    });

    it('should query cells with filters', () => {
      const store = useCubeStore.getState();
      store.writeCell(
        'GL_Actuals',
        {
          Account: 'Account:1000',
          Entity: 'Entity:ent1',
          Time: 'Time:2026-Q1-M01',
          Scenario: 'Scenario:Actual',
          Currency: 'Currency:USD',
        },
        'debit',
        500,
        'input'
      );
      store.writeCell(
        'GL_Actuals',
        {
          Account: 'Account:2000',
          Entity: 'Entity:ent1',
          Time: 'Time:2026-Q1-M01',
          Scenario: 'Scenario:Actual',
          Currency: 'Currency:USD',
        },
        'debit',
        300,
        'input'
      );

      const result = store.query({
        cube: 'GL_Actuals',
        rows: ['Account'],
        columns: ['Time'],
        filters: [{ dimension: 'Scenario', memberIds: ['Scenario:Actual'] }],
        measures: ['debit'],
        aggregation: 'sum',
      });

      expect(result.rows.length).toBeGreaterThan(0);
    });

    it('should include grand total when requested', () => {
      const store = useCubeStore.getState();
      store.writeCell(
        'GL_Actuals',
        {
          Account: 'Account:1000',
          Entity: 'Entity:ent1',
          Time: 'Time:2026-Q1-M01',
          Scenario: 'Scenario:Actual',
          Currency: 'Currency:USD',
        },
        'debit',
        500,
        'input'
      );

      const result = store.query({
        cube: 'GL_Actuals',
        rows: ['Account'],
        columns: ['Time'],
        filters: [{ dimension: 'Scenario', memberIds: ['Scenario:Actual'] }],
        measures: ['debit'],
        aggregation: 'sum',
        includeGrandTotal: true,
      });

      expect(result.grandTotal).toBeDefined();
    });
  });

  describe('snapshots', () => {
    beforeEach(() => {
      useCubeStore.getState().initialize();
    });

    it('should create a snapshot', () => {
      const store = useCubeStore.getState();
      store.writeCell(
        'GL_Actuals',
        {
          Account: 'Account:1000',
          Entity: 'Entity:ent1',
          Time: 'Time:2026-Q1-M01',
          Scenario: 'Scenario:Actual',
          Currency: 'Currency:USD',
        },
        'debit',
        100,
        'input'
      );

      const snap = store.createSnapshot('Test Snapshot', 'A test');
      expect(snap.name).toBe('Test Snapshot');
      expect(snap.description).toBe('A test');
      expect(useCubeStore.getState().snapshots).toHaveLength(1);
    });

    it('should list snapshots', () => {
      const store = useCubeStore.getState();
      store.createSnapshot('Snap 1');
      store.createSnapshot('Snap 2');
      expect(store.listSnapshots()).toHaveLength(2);
    });

    it('should compare snapshots and detect changes', () => {
      const store = useCubeStore.getState();
      const coords = {
        Account: 'Account:1000',
        Entity: 'Entity:ent1',
        Time: 'Time:2026-Q1-M01',
        Scenario: 'Scenario:Actual',
        Currency: 'Currency:USD',
      };
      store.writeCell('GL_Actuals', coords, 'debit', 100, 'input');
      const snap1 = store.createSnapshot('Before');

      store.writeCell('GL_Actuals', coords, 'debit', 200, 'input');
      const snap2 = store.createSnapshot('After');

      const diff = store.compareSnapshots(snap1.id, snap2.id);
      expect(diff.changed.length).toBeGreaterThan(0);
      expect(diff.changed[0].oldValue).toBe(100);
      expect(diff.changed[0].newValue).toBe(200);
    });

    it('should detect added cells in diff', () => {
      const store = useCubeStore.getState();
      const coords1 = {
        Account: 'Account:1000',
        Entity: 'Entity:ent1',
        Time: 'Time:2026-Q1-M01',
        Scenario: 'Scenario:Actual',
        Currency: 'Currency:USD',
      };
      store.writeCell('GL_Actuals', coords1, 'debit', 100, 'input');
      const snap1 = store.createSnapshot('Before');

      const coords2 = {
        Account: 'Account:2000',
        Entity: 'Entity:ent1',
        Time: 'Time:2026-Q1-M01',
        Scenario: 'Scenario:Actual',
        Currency: 'Currency:USD',
      };
      store.writeCell('GL_Actuals', coords2, 'debit', 200, 'input');
      const snap2 = store.createSnapshot('After');

      const diff = store.compareSnapshots(snap1.id, snap2.id);
      expect(diff.added.length).toBeGreaterThan(0);
    });
  });

  describe('undo / redo', () => {
    beforeEach(() => {
      resetEngine();
      useCubeStore.setState({
        engine: getEngine(),
        isInitialized: false,
        cellCount: 0,
        historyCount: 0,
        snapshots: [],
      });
      useCubeStore.getState().resetUndoRedo();
      useCubeStore.getState().initialize();
    });

    it('should undo a write', () => {
      const store = useCubeStore.getState();
      const coords = {
        Account: 'Account:1000',
        Entity: 'Entity:ent1',
        Time: 'Time:2026-Q1-M01',
        Scenario: 'Scenario:Actual',
        Currency: 'Currency:USD',
      };
      store.writeCell('GL_Actuals', coords, 'debit', 100, 'input');
      expect(store.readCell('GL_Actuals', coords, 'debit')?.value).toBe(100);

      store.undo();
      expect(store.readCell('GL_Actuals', coords, 'debit')).toBeUndefined();
    });

    it('should redo after undo', () => {
      const store = useCubeStore.getState();
      const coords = {
        Account: 'Account:1000',
        Entity: 'Entity:ent1',
        Time: 'Time:2026-Q1-M01',
        Scenario: 'Scenario:Actual',
        Currency: 'Currency:USD',
      };
      store.writeCell('GL_Actuals', coords, 'debit', 100, 'input');
      store.undo();
      store.redo();
      expect(store.readCell('GL_Actuals', coords, 'debit')?.value).toBe(100);
    });

    it('should return false when nothing to undo', () => {
      const store = useCubeStore.getState();
      expect(store.undo()).toBe(false);
    });

    it('should return false when nothing to redo', () => {
      const store = useCubeStore.getState();
      expect(store.redo()).toBe(false);
    });

    it('should report canUndo / canRedo correctly', () => {
      const store = useCubeStore.getState();
      expect(store.canUndo()).toBe(false);
      expect(store.canRedo()).toBe(false);

      store.writeCell(
        'GL_Actuals',
        {
          Account: 'Account:1000',
          Entity: 'Entity:ent1',
          Time: 'Time:2026-Q1-M01',
          Scenario: 'Scenario:Actual',
          Currency: 'Currency:USD',
        },
        'debit',
        100,
        'input'
      );

      expect(store.canUndo()).toBe(true);
      expect(store.canRedo()).toBe(false);

      store.undo();
      expect(store.canUndo()).toBe(false);
      expect(store.canRedo()).toBe(true);
    });
  });

  describe('registerDimension / registerCube', () => {
    beforeEach(() => {
      useCubeStore.getState().initialize();
    });

    it('should register a custom dimension', () => {
      const store = useCubeStore.getState();
      store.registerDimension('Department', [{ name: 'org', levels: ['division', 'department'] }]);
      expect(getEngine().getDimension('Department')).toBeDefined();
    });

    it('should register a custom cube', () => {
      const store = useCubeStore.getState();
      store.registerDimension('Department');
      store.registerCube(
        'Dept_Budget',
        ['Account', 'Department'],
        [{ name: 'budgetAmount', dataType: 'numeric', aggregation: 'sum' }]
      );
      expect(getEngine().getCube('Dept_Budget')).toBeDefined();
    });
  });

  describe('addMember / getMembers', () => {
    beforeEach(() => {
      useCubeStore.getState().initialize();
    });

    it('should add and retrieve a member', () => {
      const store = useCubeStore.getState();
      store.addMember('Account', {
        code: '1000',
        name: 'Cash',
        hierarchy: 'reporting',
        level: 0,
        isLeaf: true,
        isActive: true,
        attributes: {},
        sortOrder: 0,
      });
      const members = store.getMembers('Account');
      expect(members).toHaveLength(1);
      expect(members[0].code).toBe('1000');
    });
  });

  describe('bulkWriteCells', () => {
    beforeEach(() => {
      useCubeStore.getState().initialize();
    });

    it('should write multiple cells at once', () => {
      const store = useCubeStore.getState();
      const baseCoords = {
        Entity: 'Entity:ent1',
        Time: 'Time:2026-Q1-M01',
        Scenario: 'Scenario:Actual',
        Currency: 'Currency:USD',
      };
      store.bulkWriteCells([
        {
          cube: 'GL_Actuals',
          cell: {
            coords: { ...baseCoords, Account: 'Account:1000' },
            measure: 'debit',
            value: 100,
            dataType: 'input',
          },
        },
        {
          cube: 'GL_Actuals',
          cell: {
            coords: { ...baseCoords, Account: 'Account:2000' },
            measure: 'debit',
            value: 200,
            dataType: 'input',
          },
        },
      ]);
      expect(useCubeStore.getState().cellCount).toBe(2);
    });

    it('should handle empty array', () => {
      const store = useCubeStore.getState();
      store.bulkWriteCells([]);
      expect(useCubeStore.getState().cellCount).toBe(0);
    });
  });

  describe('clearAll', () => {
    it('should reset all state', () => {
      const store = useCubeStore.getState();
      store.initialize();
      store.writeCell(
        'GL_Actuals',
        {
          Account: 'Account:1000',
          Entity: 'Entity:ent1',
          Time: 'Time:2026-Q1-M01',
          Scenario: 'Scenario:Actual',
          Currency: 'Currency:USD',
        },
        'debit',
        100,
        'input'
      );

      store.clearAll();
      expect(useCubeStore.getState().isInitialized).toBe(false);
      expect(useCubeStore.getState().cellCount).toBe(0);
    });
  });

  describe('refreshCounts', () => {
    it('should update counts from engine', () => {
      useCubeStore.getState().initialize();
      const engine = getEngine();
      engine.writeCell('GL_Actuals', {
        coords: {
          Account: 'Account:1000',
          Entity: 'Entity:ent1',
          Time: 'Time:2026-Q1-M01',
          Scenario: 'Scenario:Actual',
          Currency: 'Currency:USD',
        },
        measure: 'debit',
        value: 100,
        dataType: 'input',
      });

      useCubeStore.getState().refreshCounts();
      expect(useCubeStore.getState().cellCount).toBe(1);
      expect(useCubeStore.getState().historyCount).toBe(1);
    });
  });
});
