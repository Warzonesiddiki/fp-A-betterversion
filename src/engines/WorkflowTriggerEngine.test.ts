/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowTriggerEngine } from './WorkflowTriggerEngine';

describe('WorkflowTriggerEngine', () => {
  let engine: WorkflowTriggerEngine;

  beforeEach(() => {
    engine = new WorkflowTriggerEngine();
  });

  describe('createTrigger', () => {
    it('creates a data_change trigger', () => {
      const trigger = engine.createTrigger(
        'data_change',
        'Revenue Alert',
        'Alert when revenue drops'
      );
      expect(trigger.id).toMatch(/^trg-/);
      expect(trigger.type).toBe('data_change');
      expect(trigger.enabled).toBe(true);
      expect(trigger.triggerCount).toBe(0);
    });

    it('creates a threshold trigger', () => {
      const trigger = engine.createTrigger('threshold', 'Budget Threshold', 'Alert at 90%', {
        entity: 'US01',
      });
      expect(trigger.type).toBe('threshold');
      expect(trigger.config.entity).toBe('US01');
    });
  });

  describe('getTrigger / listTriggers', () => {
    it('retrieves a trigger by id', () => {
      const t = engine.createTrigger('manual', 'Test', 'desc');
      expect(engine.getTrigger(t.id)).toBeDefined();
    });

    it('returns undefined for missing id', () => {
      expect(engine.getTrigger('nonexistent')).toBeUndefined();
    });

    it('lists all triggers', () => {
      engine.createTrigger('manual', 'A', 'desc');
      engine.createTrigger('data_change', 'B', 'desc');
      expect(engine.listTriggers().length).toBe(2);
    });
  });

  describe('deleteTrigger', () => {
    it('deletes a trigger', () => {
      const t = engine.createTrigger('manual', 'Test', 'desc');
      expect(engine.deleteTrigger(t.id)).toBe(true);
      expect(engine.getTrigger(t.id)).toBeUndefined();
    });

    it('returns false for missing id', () => {
      expect(engine.deleteTrigger('nonexistent')).toBe(false);
    });
  });

  describe('enableTrigger / disableTrigger', () => {
    it('disables and re-enables a trigger', () => {
      const t = engine.createTrigger('manual', 'Test', 'desc');
      expect(engine.disableTrigger(t.id)).toBe(true);
      expect(engine.getTrigger(t.id)?.enabled).toBe(false);
      expect(engine.enableTrigger(t.id)).toBe(true);
      expect(engine.getTrigger(t.id)?.enabled).toBe(true);

      expect(engine.enableTrigger('invalid')).toBe(false);
      expect(engine.disableTrigger('invalid')).toBe(false);
    });
  });

  describe('addCondition / removeCondition', () => {
    it('adds and removes conditions with boundary checks', () => {
      const t = engine.createTrigger('data_change', 'Test', 'desc');
      expect(engine.addCondition(t.id, { field: 'revenue', operator: 'lt', value: 1000 })).toBe(
        true
      );
      expect(
        engine.addCondition('invalid', { field: 'revenue', operator: 'lt', value: 1000 })
      ).toBe(false);
      expect(engine.getTrigger(t.id)?.conditions.length).toBe(1);

      expect(engine.removeCondition(t.id, 99)).toBe(false);
      expect(engine.removeCondition('invalid', 0)).toBe(false);
      expect(engine.removeCondition(t.id, 0)).toBe(true);
      expect(engine.getTrigger(t.id)?.conditions.length).toBe(0);
    });
  });

  describe('evaluate and condition operators', () => {
    it('evaluates eq, neq, gt, lt, gte, lte, between, and contains', () => {
      const t = engine.createTrigger('data_change', 'Test', 'desc');
      engine.addCondition(t.id, { field: 'status', operator: 'eq', value: 'closed' });
      engine.addCondition(t.id, { field: 'stage', operator: 'neq', value: 'draft' });
      engine.addCondition(t.id, { field: 'score', operator: 'gte', value: 75 });
      engine.addCondition(t.id, { field: 'cost', operator: 'lte', value: 500 });
      engine.addCondition(t.id, { field: 'amount', operator: 'between', value: 100, value2: 1000 });
      engine.addCondition(t.id, { field: 'desc', operator: 'contains', value: 'Audit' });

      const data = {
        status: 'closed',
        stage: 'final',
        score: 80,
        cost: 450,
        amount: 500,
        desc: 'Q1 Audit Report',
      };

      const result = engine.evaluate(t.id, data);
      expect(result.matched).toBe(true);
      expect(result.matchedConditions).toHaveLength(6);
    });

    it('evaluates or and not logical operators', () => {
      const tOr = engine.createTrigger('threshold', 'Or Test', 'desc');
      tOr.logicalOperator = 'or';
      engine.addCondition(tOr.id, { field: 'a', operator: 'eq', value: 1 });
      engine.addCondition(tOr.id, { field: 'b', operator: 'eq', value: 2 });

      expect(engine.evaluate(tOr.id, { a: 1, b: 99 }).matched).toBe(true);

      const tNot = engine.createTrigger('threshold', 'Not Test', 'desc');
      tNot.logicalOperator = 'not';
      engine.addCondition(tNot.id, { field: 'a', operator: 'eq', value: 1 });
      expect(engine.evaluate(tNot.id, { a: 99 }).matched).toBe(true);
    });

    it('handles cooldown and maxTriggers limits', () => {
      const t = engine.createTrigger('threshold', 'Limited', 'desc', {
        cooldownMs: 5000,
        maxTriggers: 1,
      });

      engine.fireTrigger(t.id);
      const resCooldown = engine.evaluate(t.id, {});
      expect(resCooldown.matched).toBe(false);
      expect(resCooldown.reason).toBe('Cooldown active');

      // Clear cooldown timestamp to test maxTriggers
      (engine as any).lastTriggerTimes.set(t.id, 0);
      const resMax = engine.evaluate(t.id, {});
      expect(resMax.matched).toBe(false);
      expect(resMax.reason).toBe('Max triggers reached');
    });

    it('evaluates all active triggers with evaluateAll', () => {
      const t1 = engine.createTrigger('data_change', 'T1', 'desc');
      engine.addCondition(t1.id, { field: 'x', operator: 'gt', value: 10 });
      const t2 = engine.createTrigger('data_change', 'T2', 'desc');
      engine.disableTrigger(t2.id);

      const all = engine.evaluateAll({ x: 20 });
      expect(all).toHaveLength(1);
      expect(all[0]!.matched).toBe(true);
    });
  });

  describe('time-based triggers and events', () => {
    it('manages time-based trigger checks and event clearing', () => {
      const t = engine.createTrigger('time_based', 'Scheduled', 'desc', { intervalMs: 100 });
      expect(engine.getTimeBasedTriggers()).toHaveLength(1);

      expect(engine.shouldTriggerTimeBased(t.id)).toBe(true);

      engine.fireTrigger(t.id);
      expect(engine.shouldTriggerTimeBased(t.id)).toBe(false);

      expect(engine.getEvents()).toHaveLength(1);
      engine.clearEvents();
      expect(engine.getEvents()).toHaveLength(0);
    });
  });

  describe('serialize / deserialize', () => {
    it('round-trips triggers and events', () => {
      const t = engine.createTrigger('manual', 'Test', 'desc');
      engine.fireTrigger(t.id, {});
      const json = engine.serialize();
      const engine2 = new WorkflowTriggerEngine();
      expect(engine2.deserialize(json)).toBe(true);
      expect(engine2.listTriggers().length).toBe(1);
      expect(engine2.getEvents().length).toBe(1);
      expect(engine2.deserialize('invalid json')).toBe(false);
    });
  });
});
