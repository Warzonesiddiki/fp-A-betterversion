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
    it('disables a trigger', () => {
      const t = engine.createTrigger('manual', 'Test', 'desc');
      expect(engine.disableTrigger(t.id)).toBe(true);
      expect(engine.getTrigger(t.id)?.enabled).toBe(false);
    });

    it('re-enables a trigger', () => {
      const t = engine.createTrigger('manual', 'Test', 'desc');
      engine.disableTrigger(t.id);
      expect(engine.enableTrigger(t.id)).toBe(true);
      expect(engine.getTrigger(t.id)?.enabled).toBe(true);
    });
  });

  describe('addCondition / removeCondition', () => {
    it('adds a condition to a trigger', () => {
      const t = engine.createTrigger('data_change', 'Test', 'desc');
      expect(engine.addCondition(t.id, { field: 'revenue', operator: 'lt', value: 1000 })).toBe(
        true
      );
      expect(engine.getTrigger(t.id)?.conditions.length).toBe(1);
    });

    it('removes a condition from a trigger', () => {
      const t = engine.createTrigger('data_change', 'Test', 'desc');
      engine.addCondition(t.id, { field: 'revenue', operator: 'lt', value: 1000 });
      expect(engine.removeCondition(t.id, 0)).toBe(true);
      expect(engine.getTrigger(t.id)?.conditions.length).toBe(0);
    });
  });

  describe('evaluate', () => {
    it('evaluates a trigger against data', () => {
      const t = engine.createTrigger('data_change', 'Test', 'desc');
      engine.addCondition(t.id, { field: 'revenue', operator: 'gt', value: 1000 });
      const result = engine.evaluate(t.id, { revenue: 2000 });
      expect(result).toBeDefined();
      expect(result?.matched).toBe(true);
    });

    it('returns not matched for non-existent trigger', () => {
      const result = engine.evaluate('nonexistent', {});
      expect(result.matched).toBe(false);
    });

    it('returns not matched for disabled trigger', () => {
      const t = engine.createTrigger('manual', 'Test', 'desc');
      engine.disableTrigger(t.id);
      const result = engine.evaluate(t.id, {});
      expect(result.matched).toBe(false);
    });
  });

  describe('fireTrigger / getEvents', () => {
    it('fires a trigger and records event', () => {
      const t = engine.createTrigger('manual', 'Test', 'desc');
      const event = engine.fireTrigger(t.id, { source: 'test' });
      expect(event).not.toBeNull();
      expect(event?.triggerId).toBe(t.id);
      expect(engine.getEvents().length).toBe(1);
    });

    it('filters events by trigger id', () => {
      const t1 = engine.createTrigger('manual', 'A', 'desc');
      const t2 = engine.createTrigger('manual', 'B', 'desc');
      engine.fireTrigger(t1.id, {});
      engine.fireTrigger(t2.id, {});
      expect(engine.getEvents(t1.id).length).toBe(1);
    });
  });

  describe('serialize / deserialize', () => {
    it('round-trips triggers and events', () => {
      const t = engine.createTrigger('manual', 'Test', 'desc');
      engine.fireTrigger(t.id, {});
      const json = engine.serialize();
      const engine2 = new WorkflowTriggerEngine();
      engine2.deserialize(json);
      expect(engine2.listTriggers().length).toBe(1);
      expect(engine2.getEvents().length).toBe(1);
    });
  });
});
