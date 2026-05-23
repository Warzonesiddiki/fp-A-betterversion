import { describe, it, expect, beforeEach } from 'vitest';
import { DataRetentionEngine } from './DataRetentionEngine';

describe('DataRetentionEngine', () => {
  let engine: DataRetentionEngine;

  beforeEach(() => {
    engine = new DataRetentionEngine();
  });

  describe('addRule', () => {
    it('should add a retention rule', () => {
      engine.addRule({
        id: 'rule1',
        name: 'GL Retention',
        description: 'Keep GL entries for 7 years',
        dataSource: 'gl_entries',
        retentionDays: 2555,
        action: 'archive',
        priority: 1,
        enabled: true,
      });
      const rules = engine.getRules();
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].name).toBe('GL Retention');
    });
  });

  describe('removeRule', () => {
    it('should remove a rule', () => {
      engine.addRule({
        id: 'rule1',
        name: 'Test',
        description: '',
        dataSource: 'test',
        retentionDays: 365,
        action: 'delete',
        priority: 1,
        enabled: true,
      });
      expect(engine.removeRule('rule1')).toBe(true);
      expect(engine.getRules()).toHaveLength(0);
    });
  });
});
