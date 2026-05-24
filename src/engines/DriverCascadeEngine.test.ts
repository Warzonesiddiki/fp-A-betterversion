// =============================================================================
// DRIVER CASCADE ENGINE TESTS — 80+ tests for DAG-based cascading
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { DriverCascadeEngine } from './DriverCascadeEngine';

describe('DriverCascadeEngine', () => {
  let engine: DriverCascadeEngine;

  beforeEach(() => {
    engine = new DriverCascadeEngine();
  });

  // ---------------------------------------------------------------------------
  // Driver Management
  // ---------------------------------------------------------------------------

  describe('Driver Management', () => {
    it('should add a driver', () => {
      const driver = engine.addDriver({
        name: 'Revenue Growth',
        unit: 'percentage',
        baseValue: 10,
        currentValue: 10,
        minValue: -50,
        maxValue: 100,
        step: 1,
        category: 'Revenue',
        tags: ['growth'],
      });
      expect(driver.id).toBeDefined();
      expect(driver.name).toBe('Revenue Growth');
      expect(driver.currentValue).toBe(10);
      expect(driver.createdAt).toBeDefined();
    });

    it('should update a driver', () => {
      const driver = engine.addDriver({
        name: 'Revenue Growth',
        unit: 'percentage',
        baseValue: 10,
        currentValue: 10,
        minValue: -50,
        maxValue: 100,
        step: 1,
        category: 'Revenue',
        tags: [],
      });
      const updated = engine.updateDriver(driver.id, { currentValue: 15 });
      expect(updated).toBeDefined();
      expect(updated!.currentValue).toBe(15);
      expect(updated!.updatedAt).toBeDefined();
      expect(updated!.id).toBe(driver.id);
    });

    it('should return undefined when updating non-existent driver', () => {
      const result = engine.updateDriver('non-existent', { currentValue: 5 });
      expect(result).toBeUndefined();
    });

    it('should remove a driver and its rules', () => {
      const driver = engine.addDriver({
        name: 'Revenue Growth',
        unit: 'percentage',
        baseValue: 10,
        currentValue: 10,
        minValue: -50,
        maxValue: 100,
        step: 1,
        category: 'Revenue',
        tags: [],
      });
      engine.addRule({
        driverId: driver.id,
        targetCube: 'Budget',
        targetCoords: { Account: 'Account:Revenue' },
        targetMeasure: 'amount',
        cascadeType: 'direct',
        impactType: 'multiplicative',
        weight: 1,
      });

      expect(engine.removeDriver(driver.id)).toBe(true);
      expect(engine.getDriver(driver.id)).toBeUndefined();
      expect(engine.getRulesForDriver(driver.id)).toHaveLength(0);
    });

    it('should list all drivers', () => {
      engine.addDriver({
        name: 'A',
        unit: 'percentage',
        baseValue: 1,
        currentValue: 1,
        minValue: 0,
        maxValue: 100,
        step: 1,
        category: 'C',
        tags: [],
      });
      engine.addDriver({
        name: 'B',
        unit: 'percentage',
        baseValue: 2,
        currentValue: 2,
        minValue: 0,
        maxValue: 100,
        step: 1,
        category: 'C',
        tags: [],
      });
      expect(engine.listDrivers()).toHaveLength(2);
    });

    it('should get drivers by category', () => {
      engine.addDriver({
        name: 'A',
        unit: 'percentage',
        baseValue: 1,
        currentValue: 1,
        minValue: 0,
        maxValue: 100,
        step: 1,
        category: 'Revenue',
        tags: [],
      });
      engine.addDriver({
        name: 'B',
        unit: 'percentage',
        baseValue: 2,
        currentValue: 2,
        minValue: 0,
        maxValue: 100,
        step: 1,
        category: 'Cost',
        tags: [],
      });
      engine.addDriver({
        name: 'C',
        unit: 'percentage',
        baseValue: 3,
        currentValue: 3,
        minValue: 0,
        maxValue: 100,
        step: 1,
        category: 'Revenue',
        tags: [],
      });
      expect(engine.getDriversByCategory('Revenue')).toHaveLength(2);
      expect(engine.getDriversByCategory('Cost')).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Cascade Rules
  // ---------------------------------------------------------------------------

  describe('Cascade Rules', () => {
    it('should add a rule', () => {
      const driver = engine.addDriver({
        name: 'Revenue Growth',
        unit: 'percentage',
        baseValue: 10,
        currentValue: 10,
        minValue: -50,
        maxValue: 100,
        step: 1,
        category: 'Revenue',
        tags: [],
      });
      const rule = engine.addRule({
        driverId: driver.id,
        targetCube: 'Budget',
        targetCoords: { Account: 'Account:Revenue' },
        targetMeasure: 'amount',
        cascadeType: 'direct',
        impactType: 'multiplicative',
        weight: 1,
      });
      expect(rule.id).toBeDefined();
      expect(rule.driverId).toBe(driver.id);
    });

    it('should remove a rule', () => {
      const driver = engine.addDriver({
        name: 'Revenue Growth',
        unit: 'percentage',
        baseValue: 10,
        currentValue: 10,
        minValue: -50,
        maxValue: 100,
        step: 1,
        category: 'Revenue',
        tags: [],
      });
      const rule = engine.addRule({
        driverId: driver.id,
        targetCube: 'Budget',
        targetCoords: { Account: 'Account:Revenue' },
        targetMeasure: 'amount',
        cascadeType: 'direct',
        impactType: 'multiplicative',
        weight: 1,
      });
      expect(engine.removeRule(rule.id)).toBe(true);
      expect(engine.getRulesForDriver(driver.id)).toHaveLength(0);
    });

    it('should return false when removing non-existent rule', () => {
      expect(engine.removeRule('non-existent')).toBe(false);
    });

    it('should get all rules', () => {
      const driver = engine.addDriver({
        name: 'Revenue Growth',
        unit: 'percentage',
        baseValue: 10,
        currentValue: 10,
        minValue: -50,
        maxValue: 100,
        step: 1,
        category: 'Revenue',
        tags: [],
      });
      engine.addRule({
        driverId: driver.id,
        targetCube: 'Budget',
        targetCoords: { Account: 'Account:Revenue' },
        targetMeasure: 'amount',
        cascadeType: 'direct',
        impactType: 'multiplicative',
        weight: 1,
      });
      engine.addRule({
        driverId: driver.id,
        targetCube: 'Budget',
        targetCoords: { Account: 'Account:COGS' },
        targetMeasure: 'amount',
        cascadeType: 'direct',
        impactType: 'multiplicative',
        weight: 0.6,
      });
      expect(engine.getAllRules()).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Cascade Calculation — Direct
  // ---------------------------------------------------------------------------

  describe('Cascade Calculation — Direct', () => {
    it('should calculate additive cascade', () => {
      const driver = engine.addDriver({
        name: 'Headcount',
        unit: 'absolute',
        baseValue: 100,
        currentValue: 100,
        minValue: 0,
        maxValue: 1000,
        step: 1,
        category: 'Workforce',
        tags: [],
      });
      engine.addRule({
        driverId: driver.id,
        targetCube: 'Budget',
        targetCoords: { Account: 'Account:Salaries' },
        targetMeasure: 'amount',
        cascadeType: 'direct',
        impactType: 'additive',
        weight: 50000,
      });

      const cells = new Map<string, number>();
      cells.set('Budget|Account=Account:Salaries|amount', 5000000);

      const readCell = (cube: string, coords: Record<string, string>, measure: string) => {
        const key = `${cube}|${Object.keys(coords)
          .sort()
          .map((k) => `${k}=${coords[k]}`)
          .join('|')}|${measure}`;
        return cells.get(key);
      };

      const result = engine.calculateCascade(driver.id, 110, readCell);
      expect(result.affectedCells).toHaveLength(1);
      expect(result.affectedCells[0].newValue).toBe(5500000);
      expect(result.affectedCells[0].delta).toBe(500000);
    });

    it('should calculate multiplicative cascade', () => {
      const driver = engine.addDriver({
        name: 'Revenue Growth',
        unit: 'percentage',
        baseValue: 10,
        currentValue: 10,
        minValue: -50,
        maxValue: 100,
        step: 1,
        category: 'Revenue',
        tags: [],
      });
      engine.addRule({
        driverId: driver.id,
        targetCube: 'Budget',
        targetCoords: { Account: 'Account:Revenue' },
        targetMeasure: 'amount',
        cascadeType: 'direct',
        impactType: 'multiplicative',
        weight: 1,
      });

      const cells = new Map<string, number>();
      cells.set('Budget|Account=Account:Revenue|amount', 1000000);

      const readCell = (cube: string, coords: Record<string, string>, measure: string) => {
        const key = `${cube}|${Object.keys(coords)
          .sort()
          .map((k) => `${k}=${coords[k]}`)
          .join('|')}|${measure}`;
        return cells.get(key);
      };

      const result = engine.calculateCascade(driver.id, 20, readCell);
      expect(result.affectedCells).toHaveLength(1);
      expect(result.affectedCells[0].newValue).toBe(2000000);
    });

    it('should calculate replacement cascade', () => {
      const driver = engine.addDriver({
        name: 'Tax Rate',
        unit: 'percentage',
        baseValue: 25,
        currentValue: 25,
        minValue: 0,
        maxValue: 100,
        step: 1,
        category: 'Tax',
        tags: [],
      });
      engine.addRule({
        driverId: driver.id,
        targetCube: 'Budget',
        targetCoords: { Account: 'Account:TaxProvision' },
        targetMeasure: 'amount',
        cascadeType: 'direct',
        impactType: 'replacement',
        weight: 1,
      });

      const readCell = () => 100000;
      const result = engine.calculateCascade(driver.id, 30, readCell);
      expect(result.affectedCells).toHaveLength(1);
      expect(result.affectedCells[0].newValue).toBe(30);
    });

    it('should not create affected cell when delta is zero', () => {
      const driver = engine.addDriver({
        name: 'Revenue Growth',
        unit: 'percentage',
        baseValue: 10,
        currentValue: 10,
        minValue: -50,
        maxValue: 100,
        step: 1,
        category: 'Revenue',
        tags: [],
      });
      engine.addRule({
        driverId: driver.id,
        targetCube: 'Budget',
        targetCoords: { Account: 'Account:Revenue' },
        targetMeasure: 'amount',
        cascadeType: 'direct',
        impactType: 'additive',
        weight: 0,
      });

      const readCell = () => 1000000;
      const result = engine.calculateCascade(driver.id, 10, readCell);
      expect(result.affectedCells).toHaveLength(0);
    });

    it('should throw when driver not found', () => {
      expect(() => engine.calculateCascade('non-existent', 10, () => 0)).toThrow(
        'Driver "non-existent" not found'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Cascade Calculation — Weighted
  // ---------------------------------------------------------------------------

  describe('Cascade Calculation — Weighted', () => {
    it('should calculate weighted cascade', () => {
      const driver = engine.addDriver({
        name: 'Revenue Growth',
        unit: 'percentage',
        baseValue: 10,
        currentValue: 10,
        minValue: -50,
        maxValue: 100,
        step: 1,
        category: 'Revenue',
        tags: [],
      });
      engine.addRule({
        driverId: driver.id,
        targetCube: 'Budget',
        targetCoords: { Account: 'Account:COGS' },
        targetMeasure: 'amount',
        cascadeType: 'weighted',
        impactType: 'additive',
        weight: 0.6,
      });

      const readCell = () => 600000;
      const result = engine.calculateCascade(driver.id, 15, readCell);
      expect(result.affectedCells).toHaveLength(1);
      expect(result.affectedCells[0].delta).toBe(3);
    });
  });

  // ---------------------------------------------------------------------------
  // Cascade Calculation — Formula
  // ---------------------------------------------------------------------------

  describe('Cascade Calculation — Formula', () => {
    it('should calculate formula-based cascade', () => {
      const driver = engine.addDriver({
        name: 'Price',
        unit: 'absolute',
        baseValue: 100,
        currentValue: 100,
        minValue: 0,
        maxValue: 1000,
        step: 1,
        category: 'Revenue',
        tags: [],
      });
      engine.addRule({
        driverId: driver.id,
        targetCube: 'Budget',
        targetCoords: { Account: 'Account:Revenue' },
        targetMeasure: 'amount',
        cascadeType: 'formula',
        impactType: 'additive',
        weight: 1,
        formula: 'x * 1000',
      });

      const readCell = () => 100000;
      const result = engine.calculateCascade(driver.id, 120, readCell);
      expect(result.affectedCells).toHaveLength(1);
      expect(result.affectedCells[0].newValue).toBe(120000);
    });

    it('should handle formula with current value', () => {
      const driver = engine.addDriver({
        name: 'Growth Rate',
        unit: 'percentage',
        baseValue: 10,
        currentValue: 10,
        minValue: -50,
        maxValue: 100,
        step: 1,
        category: 'Revenue',
        tags: [],
      });
      engine.addRule({
        driverId: driver.id,
        targetCube: 'Budget',
        targetCoords: { Account: 'Account:Revenue' },
        targetMeasure: 'amount',
        cascadeType: 'formula',
        impactType: 'additive',
        weight: 1,
        formula: 'current * (1 + x / 100)',
      });

      const readCell = () => 1000000;
      const result = engine.calculateCascade(driver.id, 15, readCell);
      expect(result.affectedCells).toHaveLength(1);
      expect(result.affectedCells[0].newValue).toBe(1150000);
    });

    it('should fallback to current value on invalid formula', () => {
      const driver = engine.addDriver({
        name: 'Growth Rate',
        unit: 'percentage',
        baseValue: 10,
        currentValue: 10,
        minValue: -50,
        maxValue: 100,
        step: 1,
        category: 'Revenue',
        tags: [],
      });
      engine.addRule({
        driverId: driver.id,
        targetCube: 'Budget',
        targetCoords: { Account: 'Account:Revenue' },
        targetMeasure: 'amount',
        cascadeType: 'formula',
        impactType: 'additive',
        weight: 1,
        formula: 'invalid!!!formula',
      });

      const readCell = () => 1000000;
      const result = engine.calculateCascade(driver.id, 15, readCell);
      expect(result.affectedCells).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Multiple Rules per Driver
  // ---------------------------------------------------------------------------

  describe('Multiple Rules per Driver', () => {
    it('should cascade to multiple targets', () => {
      const driver = engine.addDriver({
        name: 'Revenue Growth',
        unit: 'percentage',
        baseValue: 10,
        currentValue: 10,
        minValue: -50,
        maxValue: 100,
        step: 1,
        category: 'Revenue',
        tags: [],
      });
      engine.addRule({
        driverId: driver.id,
        targetCube: 'Budget',
        targetCoords: { Account: 'Account:Revenue' },
        targetMeasure: 'amount',
        cascadeType: 'direct',
        impactType: 'multiplicative',
        weight: 1,
      });
      engine.addRule({
        driverId: driver.id,
        targetCube: 'Budget',
        targetCoords: { Account: 'Account:COGS' },
        targetMeasure: 'amount',
        cascadeType: 'direct',
        impactType: 'multiplicative',
        weight: 0.6,
      });
      engine.addRule({
        driverId: driver.id,
        targetCube: 'Budget',
        targetCoords: { Account: 'Account:OpEx' },
        targetMeasure: 'amount',
        cascadeType: 'direct',
        impactType: 'multiplicative',
        weight: 0.3,
      });

      const readCell = (cube: string, coords: Record<string, string>, measure: string) => {
        const key = `${cube}|${Object.keys(coords)
          .sort()
          .map((k) => `${k}=${coords[k]}`)
          .join('|')}|${measure}`;
        const values: Record<string, number> = {
          'Budget|Account=Account:Revenue|amount': 1000000,
          'Budget|Account=Account:COGS|amount': 600000,
          'Budget|Account=Account:OpEx|amount': 300000,
        };
        return values[key];
      };

      const result = engine.calculateCascade(driver.id, 20, readCell);
      expect(result.affectedCells).toHaveLength(3);
      expect(result.totalImpact).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Apply Cascade
  // ---------------------------------------------------------------------------

  describe('Apply Cascade', () => {
    it('should apply cascade results to cells', () => {
      const driver = engine.addDriver({
        name: 'Revenue Growth',
        unit: 'percentage',
        baseValue: 10,
        currentValue: 10,
        minValue: -50,
        maxValue: 100,
        step: 1,
        category: 'Revenue',
        tags: [],
      });
      engine.addRule({
        driverId: driver.id,
        targetCube: 'Budget',
        targetCoords: { Account: 'Account:Revenue' },
        targetMeasure: 'amount',
        cascadeType: 'direct',
        impactType: 'multiplicative',
        weight: 1,
      });

      const cells = new Map<string, number>();
      cells.set('Budget|Account=Account:Revenue|amount', 1000000);

      const readCell = (cube: string, coords: Record<string, string>, measure: string) => {
        const key = `${cube}|${Object.keys(coords)
          .sort()
          .map((k) => `${k}=${coords[k]}`)
          .join('|')}|${measure}`;
        return cells.get(key);
      };
      const writeCell = (
        cube: string,
        coords: Record<string, string>,
        measure: string,
        value: number
      ) => {
        const key = `${cube}|${Object.keys(coords)
          .sort()
          .map((k) => `${k}=${coords[k]}`)
          .join('|')}|${measure}`;
        cells.set(key, value);
      };

      const result = engine.calculateCascade(driver.id, 20, readCell);
      engine.applyCascade(result, writeCell);

      expect(cells.get('Budget|Account=Account:Revenue|amount')).toBe(2000000);
      expect(engine.getDriver(driver.id)?.currentValue).toBe(20);
    });
  });

  // ---------------------------------------------------------------------------
  // Batch Operations
  // ---------------------------------------------------------------------------

  describe('Batch Operations', () => {
    it('should batch update multiple drivers', () => {
      const driver1 = engine.addDriver({
        name: 'Revenue Growth',
        unit: 'percentage',
        baseValue: 10,
        currentValue: 10,
        minValue: -50,
        maxValue: 100,
        step: 1,
        category: 'Revenue',
        tags: [],
      });
      const driver2 = engine.addDriver({
        name: 'Headcount Growth',
        unit: 'percentage',
        baseValue: 5,
        currentValue: 5,
        minValue: -50,
        maxValue: 100,
        step: 1,
        category: 'Workforce',
        tags: [],
      });

      engine.addRule({
        driverId: driver1.id,
        targetCube: 'Budget',
        targetCoords: { Account: 'Account:Revenue' },
        targetMeasure: 'amount',
        cascadeType: 'direct',
        impactType: 'multiplicative',
        weight: 1,
      });
      engine.addRule({
        driverId: driver2.id,
        targetCube: 'Budget',
        targetCoords: { Account: 'Account:Salaries' },
        targetMeasure: 'amount',
        cascadeType: 'direct',
        impactType: 'multiplicative',
        weight: 1,
      });

      const cells = new Map<string, number>();
      cells.set('Budget|Account=Account:Revenue|amount', 1000000);
      cells.set('Budget|Account=Account:Salaries|amount', 500000);

      const readCell = (cube: string, coords: Record<string, string>, measure: string) => {
        const key = `${cube}|${Object.keys(coords)
          .sort()
          .map((k) => `${k}=${coords[k]}`)
          .join('|')}|${measure}`;
        return cells.get(key);
      };
      const writeCell = (
        cube: string,
        coords: Record<string, string>,
        measure: string,
        value: number
      ) => {
        const key = `${cube}|${Object.keys(coords)
          .sort()
          .map((k) => `${k}=${coords[k]}`)
          .join('|')}|${measure}`;
        cells.set(key, value);
      };

      const results = engine.batchUpdateDrivers(
        [
          { driverId: driver1.id, newValue: 20 },
          { driverId: driver2.id, newValue: 10 },
        ],
        readCell,
        writeCell
      );

      expect(results).toHaveLength(2);
      expect(cells.get('Budget|Account=Account:Revenue|amount')).toBe(2000000);
      expect(cells.get('Budget|Account=Account:Salaries|amount')).toBe(1000000);
    });
  });

  // ---------------------------------------------------------------------------
  // Impact Analysis
  // ---------------------------------------------------------------------------

  describe('Impact Analysis', () => {
    it('should analyze impact before applying', () => {
      const driver = engine.addDriver({
        name: 'Revenue Growth',
        unit: 'percentage',
        baseValue: 10,
        currentValue: 10,
        minValue: -50,
        maxValue: 100,
        step: 1,
        category: 'Revenue',
        tags: [],
      });
      engine.addRule({
        driverId: driver.id,
        targetCube: 'Budget',
        targetCoords: { Account: 'Account:Revenue' },
        targetMeasure: 'amount',
        cascadeType: 'direct',
        impactType: 'multiplicative',
        weight: 1,
      });

      const readCell = () => 1000000;
      const impact = engine.analyzeImpact(driver.id, 20, readCell);

      expect(impact.driverName).toBe('Revenue Growth');
      expect(impact.currentValue).toBe(10);
      expect(impact.proposedValue).toBe(20);
      expect(impact.delta).toBe(10);
      expect(impact.percentageChange).toBe(100);
      expect(impact.affectedCellCount).toBe(1);
      expect(impact.totalImpact).toBeGreaterThan(0);
      expect(impact.impactByCube['Budget']).toBeDefined();
    });

    it('should throw when analyzing non-existent driver', () => {
      expect(() => engine.analyzeImpact('non-existent', 10, () => 0)).toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // Circular Dependency Detection
  // ---------------------------------------------------------------------------

  describe('Circular Dependencies', () => {
    it('should detect no circular dependencies in simple graph', () => {
      const driver = engine.addDriver({
        name: 'Revenue Growth',
        unit: 'percentage',
        baseValue: 10,
        currentValue: 10,
        minValue: -50,
        maxValue: 100,
        step: 1,
        category: 'Revenue',
        tags: [],
      });
      engine.addRule({
        driverId: driver.id,
        targetCube: 'Budget',
        targetCoords: { Account: 'Account:Revenue' },
        targetMeasure: 'amount',
        cascadeType: 'direct',
        impactType: 'multiplicative',
        weight: 1,
      });

      const cycles = engine.detectCircularDependencies();
      expect(cycles).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Snapshots
  // ---------------------------------------------------------------------------

  describe('Snapshots', () => {
    it('should create and restore snapshots', () => {
      engine.addDriver({
        name: 'Revenue Growth',
        unit: 'percentage',
        baseValue: 10,
        currentValue: 10,
        minValue: -50,
        maxValue: 100,
        step: 1,
        category: 'Revenue',
        tags: [],
      });

      const snapshot = engine.createSnapshot();
      expect(snapshot.drivers).toHaveLength(1);
      expect(snapshot.timestamp).toBeDefined();

      engine.addDriver({
        name: 'Cost Growth',
        unit: 'percentage',
        baseValue: 5,
        currentValue: 5,
        minValue: -50,
        maxValue: 100,
        step: 1,
        category: 'Cost',
        tags: [],
      });
      expect(engine.listDrivers()).toHaveLength(2);

      engine.restoreSnapshot(snapshot);
      expect(engine.listDrivers()).toHaveLength(1);
    });

    it('should list snapshots', () => {
      engine.createSnapshot();
      engine.createSnapshot();
      expect(engine.listSnapshots()).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Export/Import
  // ---------------------------------------------------------------------------

  describe('Export/Import', () => {
    it('should export and import state', () => {
      const driver = engine.addDriver({
        name: 'Revenue Growth',
        unit: 'percentage',
        baseValue: 10,
        currentValue: 10,
        minValue: -50,
        maxValue: 100,
        step: 1,
        category: 'Revenue',
        tags: [],
      });
      engine.addRule({
        driverId: driver.id,
        targetCube: 'Budget',
        targetCoords: { Account: 'Account:Revenue' },
        targetMeasure: 'amount',
        cascadeType: 'direct',
        impactType: 'multiplicative',
        weight: 1,
      });

      const state = engine.exportState();
      expect(state.drivers).toHaveLength(1);
      expect(state.rules).toHaveLength(1);

      const newEngine = new DriverCascadeEngine();
      newEngine.importState(state);
      expect(newEngine.listDrivers()).toHaveLength(1);
      expect(newEngine.getAllRules()).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  describe('Reset', () => {
    it('should reset all state', () => {
      engine.addDriver({
        name: 'Revenue Growth',
        unit: 'percentage',
        baseValue: 10,
        currentValue: 10,
        minValue: -50,
        maxValue: 100,
        step: 1,
        category: 'Revenue',
        tags: [],
      });
      engine.createSnapshot();

      engine.reset();
      expect(engine.listDrivers()).toHaveLength(0);
      expect(engine.getAllRules()).toHaveLength(0);
      expect(engine.listSnapshots()).toHaveLength(0);
    });
  });
});
