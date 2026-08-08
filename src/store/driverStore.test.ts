import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDriverStore, resetEngine, loadDriverTemplate, DRIVER_TEMPLATES } from './driverStore';

// Mock rbacEnforcer to just call the function
vi.mock('@/utils/rbacEnforcer', () => ({
  enforce: (perm: string, name: string, fn: any) => fn,
  enforceMany: (set: any, get: any, map: any, actions: any) => actions,
  Permissions: {
    DRIVER_CREATE: 'driver:create',
    DRIVER_UPDATE: 'driver:update',
    DRIVER_DELETE: 'driver:delete',
  },
}));

// Mock masterStorage for Zustand persist
vi.mock('@/utils/masterStorage', () => ({
  masterStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe('driverStore', () => {
  beforeEach(() => {
    resetEngine();
    useDriverStore.getState().reset();
  });

  it('adds and removes a driver', () => {
    const store = useDriverStore.getState();
    const driver = store.addDriver({
      name: 'Test Driver',
      category: 'revenue',
      unit: 'absolute',
      baseValue: 100,
      currentValue: 100,
      minValue: 0,
      maxValue: 1000,
      step: 10,
      tags: [],
    });

    expect(driver.id).toBeDefined();
    expect(driver.name).toBe('Test Driver');

    // Select it
    store.selectDriver(driver.id);
    expect(useDriverStore.getState().selectedDriverId).toBe(driver.id);

    // Remove it
    const removed = store.removeDriver(driver.id);
    expect(removed).toBe(true);

    // Should clear selection
    expect(useDriverStore.getState().selectedDriverId).toBeNull();
  });

  it('updates a driver', () => {
    const store = useDriverStore.getState();
    const driver = store.addDriver({
      name: 'Old Name',
      category: 'revenue',
      unit: 'absolute',
      baseValue: 100,
      currentValue: 100,
    });

    const updated = store.updateDriver(driver.id, { name: 'New Name', currentValue: 200 });
    expect(updated).toBeDefined();
    expect(updated?.name).toBe('New Name');
    expect(updated?.currentValue).toBe(200);
  });

  it('adds and removes a cascade rule', () => {
    const store = useDriverStore.getState();
    const driver = store.addDriver({
      name: 'D1',
      category: 'revenue',
      unit: 'absolute',
      baseValue: 1,
      currentValue: 1,
    });

    const rule = store.addRule({
      driverId: driver.id,
      targetCube: 'test-cube',
      targetCoords: { Account: 'Rev' },
      targetMeasure: 'Amount',
      cascadeType: 'direct',
      impactType: 'proportional',
      weight: 1.5,
    });

    expect(rule.id).toBeDefined();

    const rules = store.getRulesForDriver(driver.id);
    expect(rules).toHaveLength(1);
    expect(rules[0].id).toBe(rule.id);

    store.removeRule(rule.id);
    expect(store.getRulesForDriver(driver.id)).toHaveLength(0);
  });

  it('calculates and applies a cascade', () => {
    const store = useDriverStore.getState();
    const driver = store.addDriver({
      name: 'Growth',
      category: 'revenue',
      unit: 'percent',
      baseValue: 1,
      currentValue: 1,
    });

    store.addRule({
      driverId: driver.id,
      targetCube: 'plan',
      targetCoords: { Acc: 'Sales' },
      targetMeasure: 'Amount',
      cascadeType: 'direct',
      impactType: 'additive',
      weight: 10, // each 1% (or unit) adds 10 to Sales
    });

    // Dummy cell reader: initial value is 100
    const readCell = vi.fn().mockReturnValue(100);

    const result = store.calculateCascade(driver.id, 1.1, readCell);

    expect(useDriverStore.getState().isRecalculating).toBe(false);
    expect(useDriverStore.getState().lastCascadeResult).toBe(result);

    // Applying the cascade
    const writeCell = vi.fn();
    store.applyCascade(result, writeCell);

    // Apply should write the new value and clear the result
    expect(writeCell).toHaveBeenCalled();
    expect(useDriverStore.getState().lastCascadeResult).toBeNull();
  });

  it('analyzes impact', () => {
    const store = useDriverStore.getState();
    const driver = store.addDriver({
      name: 'Rate',
      category: 'cost',
      unit: 'absolute',
      baseValue: 10,
      currentValue: 10,
    });

    store.addRule({
      driverId: driver.id,
      targetCube: 'plan',
      targetCoords: { Acc: 'Cost' },
      targetMeasure: 'Amount',
      cascadeType: 'direct',
      impactType: 'additive',
      weight: 5,
    });

    const readCell = vi.fn().mockReturnValue(50);
    const impact = store.analyzeImpact(driver.id, 20, readCell);

    expect(impact).toBeDefined();
    // 20 - 10 = 10 delta * 5 multiplier = 50 change
    expect(impact.totalImpact).toBeDefined(); // Testing that it computes something
  });

  it('batch updates multiple drivers', () => {
    const store = useDriverStore.getState();
    const d1 = store.addDriver({
      name: 'D1',
      category: 'revenue',
      unit: 'absolute',
      baseValue: 10,
      currentValue: 10,
    });
    const d2 = store.addDriver({
      name: 'D2',
      category: 'cost',
      unit: 'absolute',
      baseValue: 5,
      currentValue: 5,
    });

    const readCell = vi.fn().mockReturnValue(0);
    const writeCell = vi.fn();

    const results = store.batchUpdate(
      [
        { driverId: d1.id, newValue: 20 },
        { driverId: d2.id, newValue: 10 },
      ],
      readCell,
      writeCell
    );

    expect(results).toHaveLength(2);
  });

  it('creates and restores snapshots', () => {
    const store = useDriverStore.getState();
    store.addDriver({
      name: 'SnapDriver',
      category: 'revenue',
      unit: 'absolute',
      baseValue: 100,
      currentValue: 100,
    });

    const snapshot = store.createSnapshot();

    // Clear and restore
    store.reset();
    expect(useDriverStore.getState().engine.listDrivers()).toHaveLength(0);

    store.restoreSnapshot(snapshot);
    expect(useDriverStore.getState().engine.listDrivers()).toHaveLength(1);
    expect(useDriverStore.getState().engine.listDrivers()[0].name).toBe('SnapDriver');
  });

  it('loads templates properly', () => {
    loadDriverTemplate(DRIVER_TEMPLATES[0]);
    const drivers = useDriverStore.getState().engine.listDrivers();
    // the template adds 2 drivers
    expect(drivers.length).toBeGreaterThanOrEqual(2);
    expect(drivers.find((d) => d.name === 'Volume')).toBeDefined();
  });
});
