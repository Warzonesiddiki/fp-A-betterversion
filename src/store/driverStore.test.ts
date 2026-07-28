import { describe, it, expect, beforeEach } from 'vitest';
import { useDriverStore, resetEngine } from './driverStore';
import { actAs } from '@/test/rbacFixtures';

describe('driverStore', () => {
  beforeEach(() => {
    actAs('Admin');
    resetEngine();
    useDriverStore.setState({
      isRecalculating: false,
      affectedCellCount: 0,
      lastCascadeResult: null,
      selectedDriverId: null,
    });
  });

  it('should have correct initial state', () => {
    const state = useDriverStore.getState();
    expect(state.isRecalculating).toBe(false);
    expect(state.affectedCellCount).toBe(0);
    expect(state.lastCascadeResult).toBeNull();
    expect(state.selectedDriverId).toBeNull();
  });

  it('should select a driver', () => {
    useDriverStore.getState().selectDriver('driver-1');
    expect(useDriverStore.getState().selectedDriverId).toBe('driver-1');
  });

  it('should deselect a driver', () => {
    useDriverStore.getState().selectDriver('driver-1');
    useDriverStore.getState().selectDriver(null);
    expect(useDriverStore.getState().selectedDriverId).toBeNull();
  });

  it('should add a driver', () => {
    const driver = useDriverStore.getState().addDriver({
      name: 'Growth Rate',
      description: 'Revenue growth',
      currentValue: 10,
      baseValue: 10,
      minValue: 0,
      maxValue: 100,
      step: 1,
      category: 'Revenue',
      unit: 'percentage',
      tags: ['growth'],
    });
    expect(driver.id).toBeDefined();
    expect(driver.name).toBe('Growth Rate');
  });

  it('should remove a driver', () => {
    const driver = useDriverStore.getState().addDriver({
      name: 'Test',
      description: 'Test',
      currentValue: 5,
      baseValue: 5,
      minValue: 0,
      maxValue: 100,
      step: 1,
      category: 'Test',
      unit: 'percentage',
      tags: [],
    });
    const result = useDriverStore.getState().removeDriver(driver.id);
    expect(result).toBe(true);
  });

  it('should reset state', () => {
    useDriverStore.getState().selectDriver('driver-1');
    useDriverStore.setState({ affectedCellCount: 5 });
    useDriverStore.getState().reset();
    expect(useDriverStore.getState().selectedDriverId).toBeNull();
    expect(useDriverStore.getState().affectedCellCount).toBe(0);
  });
});
