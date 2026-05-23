import { describe, it, expect, beforeEach } from 'vitest';
import { AssumptionEngine } from './AssumptionEngine';

describe('AssumptionEngine', () => {
  beforeEach(() => {
    AssumptionEngine.clear();
  });

  describe('create', () => {
    it('creates an assumption with auto-generated id', () => {
      const result = AssumptionEngine.create({
        name: 'Revenue Growth Rate',
        value: 0.08,
        unit: 'percent',
        category: 'revenue',
        source: 'Board approved',
        effectiveFrom: '2026-01',
        effectiveTo: '2026-12',
      });
      expect(result.id).toMatch(/^asm_/);
      expect(result.version).toBe(1);
      expect(result.history).toEqual([]);
    });
  });

  describe('get', () => {
    it('retrieves by id', () => {
      const created = AssumptionEngine.create({
        name: 'Test',
        value: 5,
        unit: 'count',
        category: 'operational',
        source: 'test',
        effectiveFrom: '2026-01',
        effectiveTo: '2026-12',
      });
      expect(AssumptionEngine.get(created.id)?.name).toBe('Test');
    });

    it('returns undefined for missing id', () => {
      expect(AssumptionEngine.get('nonexistent')).toBeUndefined();
    });
  });

  describe('update', () => {
    it('updates value and increments version', () => {
      const a = AssumptionEngine.create({
        name: 'Growth',
        value: 0.05,
        unit: 'percent',
        category: 'revenue',
        source: 'test',
        effectiveFrom: '2026-01',
        effectiveTo: '2026-12',
      });
      const updated = AssumptionEngine.update(a.id, 0.08, 'user1', 'Board revision');
      expect(updated.value).toBe(0.08);
      expect(updated.version).toBe(2);
      expect(updated.history).toHaveLength(1);
    });

    it('throws for missing id', () => {
      expect(() => AssumptionEngine.update('bad', 1, 'u', 'r')).toThrow();
    });

    it('throws when locked by another user', () => {
      const a = AssumptionEngine.create({
        name: 'Locked',
        value: 1,
        unit: 'count',
        category: 'operational',
        source: 'test',
        effectiveFrom: '2026-01',
        effectiveTo: '2026-12',
      });
      AssumptionEngine.lock(a.id, 'userA');
      expect(() => AssumptionEngine.update(a.id, 2, 'userB', 'try')).toThrow();
    });
  });

  describe('lock/unlock', () => {
    it('locks and unlocks', () => {
      const a = AssumptionEngine.create({
        name: 'Lockable',
        value: 1,
        unit: 'count',
        category: 'operational',
        source: 'test',
        effectiveFrom: '2026-01',
        effectiveTo: '2026-12',
      });
      AssumptionEngine.lock(a.id, 'user1');
      expect(AssumptionEngine.get(a.id)?.lockedBy).toBe('user1');
      AssumptionEngine.unlock(a.id, 'user1');
      expect(AssumptionEngine.get(a.id)?.lockedBy).toBeUndefined();
    });
  });

  describe('impactAnalysis', () => {
    it('calculates impact', () => {
      const a = AssumptionEngine.create({
        name: 'Growth',
        value: 0.05,
        unit: 'percent',
        category: 'revenue',
        source: 'test',
        effectiveFrom: '2026-01',
        effectiveTo: '2026-12',
      });
      const result = AssumptionEngine.impactAnalysis(a.id, 0.1);
      expect(result.delta).toBeCloseTo(0.05);
      expect(result.oldValue).toBe(0.05);
      expect(result.newValue).toBe(0.1);
    });
  });

  describe('getByCategory', () => {
    it('filters by category', () => {
      AssumptionEngine.create({
        name: 'A',
        value: 1,
        unit: 'count',
        category: 'revenue',
        source: '',
        effectiveFrom: '',
        effectiveTo: '',
      });
      AssumptionEngine.create({
        name: 'B',
        value: 2,
        unit: 'count',
        category: 'cost',
        source: '',
        effectiveFrom: '',
        effectiveTo: '',
      });
      expect(AssumptionEngine.getByCategory('revenue')).toHaveLength(1);
    });
  });
});
