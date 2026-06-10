import { describe, it, expect, beforeEach } from 'vitest';
import { DriverLibrary } from './DriverLibrary';

describe('DriverLibrary', () => {
  beforeEach(() => {
    DriverLibrary.initialize();
  });

  describe('initialize', () => {
    it('should load default drivers', () => {
      const drivers = DriverLibrary.getAllDrivers();
      expect(drivers.length).toBeGreaterThan(0);
    });

    it('should include revenue drivers', () => {
      const drivers = DriverLibrary.getAllDrivers();
      const revenueDriver = drivers.find((d) => d.category === 'revenue');
      expect(revenueDriver).toBeDefined();
    });
  });

  describe('getDriver', () => {
    it('should get driver by id', () => {
      const driver = DriverLibrary.getDriver('headcount');
      expect(driver).toBeDefined();
      expect(driver?.name).toBe('Headcount');
    });

    it('should return undefined for non-existent driver', () => {
      expect(DriverLibrary.getDriver('nonexistent')).toBeUndefined();
    });
  });

  describe('getByCategory', () => {
    it('should filter drivers by category', () => {
      const revenueDrivers = DriverLibrary.getByCategory('revenue');
      expect(revenueDrivers.length).toBeGreaterThan(0);
      expect(revenueDrivers.every((d) => d.category === 'revenue')).toBe(true);
    });

    it('should return empty array for unknown category', () => {
      expect(DriverLibrary.getByCategory('bogus')).toEqual([]);
    });
  });

  describe('updateDriver', () => {
    it('should update defaultValue on the driver', () => {
      DriverLibrary.updateDriver('headcount', 999, 'user-1', 'test');
      expect(DriverLibrary.getDriver('headcount')?.defaultValue).toBe(999);
    });

    it('should record a DriverChange entry', () => {
      DriverLibrary.updateDriver('headcount', 200, 'alice', 'hiring plan');
      DriverLibrary.updateDriver('headcount', 300, 'bob', 're-forecast');
      const changes = DriverLibrary.getChanges('headcount');
      expect(changes).toHaveLength(2);
      expect(changes![0]!.changedBy).toBe('alice');
      expect(changes![0]!.reason).toBe('hiring plan');
    });

    it('should reject value outside range', () => {
      DriverLibrary.updateDriver('headcount', 99999, 'u1', 'too high');
      expect(DriverLibrary.getDriver('headcount')?.defaultValue).toBe(100);
    });

    it('should silently skip non-existent driver', () => {
      DriverLibrary.updateDriver('bogus', 999, 'u1', 'nope');
      expect(DriverLibrary.getChanges()).toHaveLength(0);
    });
  });

  describe('getChanges', () => {
    it('should return all changes when called without argument', () => {
      DriverLibrary.updateDriver('headcount', 200, 'u1', 'hc');
      DriverLibrary.updateDriver('revenue-growth', 10, 'u2', 'rev');
      expect(DriverLibrary.getChanges()).toHaveLength(2);
    });

    it('should filter by driverId when provided', () => {
      DriverLibrary.updateDriver('headcount', 200, 'u1', 'hc');
      DriverLibrary.updateDriver('revenue-growth', 10, 'u2', 'rev');
      expect(DriverLibrary.getChanges('headcount')).toHaveLength(1);
    });
  });

  describe('cascadeChange', () => {
    it('should apply driver percentage to linked line items', () => {
      DriverLibrary.updateDriver('headcount', 10, 'u1', '+10%');
      const result = DriverLibrary.cascadeChange('headcount', {
        salaries: 100000,
        benefits: 20000,
        payroll_tax: 8000,
      });
      expect(result.salaries).toBeCloseTo(110000);
      expect(result.benefits).toBeCloseTo(22000);
      expect(result.payroll_tax).toBeCloseTo(8800);
    });

    it('should return items unchanged for unknown driver', () => {
      const items = { revenue: 50000 };
      expect(DriverLibrary.cascadeChange('bogus', items)).toEqual(items);
    });
  });
});
