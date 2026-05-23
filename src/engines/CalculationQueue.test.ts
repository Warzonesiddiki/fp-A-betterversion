/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CalculationQueue, calculationQueue } from './CalculationQueue';

describe('CalculationQueue', () => {
  let queue: CalculationQueue;

  beforeEach(() => {
    queue = new CalculationQueue();
  });

  describe('enqueue', () => {
    it('adds a task to the queue or starts it immediately', () => {
      const task = {
        id: 'test-1',
        engineId: 'test-engine',
        inputs: {},
        priority: 'normal' as const,
        computeFn: async () => 42,
      };
      queue.enqueue(task);
      const stats = queue.getStats();
      // Task may be queued or already running depending on concurrency
      expect(stats.queued + stats.running).toBeGreaterThanOrEqual(1);
    });
  });

  describe('cancel', () => {
    it('cancels a task', () => {
      const task = {
        id: 'test-1',
        engineId: 'test-engine',
        inputs: {},
        priority: 'normal' as const,
        computeFn: async () => 42,
      };
      queue.enqueue(task);
      queue.cancel('test-1');
      const stats = queue.getStats();
      expect(stats.queued).toBe(0);
    });
  });

  describe('cancelAll', () => {
    it('cancels all tasks', () => {
      queue.enqueue({
        id: '1',
        engineId: 'e1',
        inputs: {},
        priority: 'normal',
        computeFn: async () => 1,
      });
      queue.enqueue({
        id: '2',
        engineId: 'e2',
        inputs: {},
        priority: 'high',
        computeFn: async () => 2,
      });
      queue.cancelAll();
      const stats = queue.getStats();
      expect(stats.queued).toBe(0);
      expect(stats.running).toBe(0);
    });
  });

  describe('compute with cache', () => {
    it('caches results', () => {
      const result1 = queue.compute('test', { x: 1 }, () => 42);
      const result2 = queue.compute('test', { x: 1 }, () => 99);
      expect(result1).toBe(42);
      expect(result2).toBe(42); // cached
    });

    it('invalidates cache', () => {
      queue.compute('test', { x: 1 }, () => 42);
      queue.invalidate('test');
      const result = queue.compute('test', { x: 1 }, () => 99);
      expect(result).toBe(99); // recomputed
    });
  });

  describe('getStats', () => {
    it('returns queue statistics', () => {
      const stats = queue.getStats();
      expect(stats).toHaveProperty('queued');
      expect(stats).toHaveProperty('running');
      expect(stats).toHaveProperty('cached');
    });
  });

  describe('singleton', () => {
    it('exports a singleton instance', () => {
      expect(calculationQueue).toBeInstanceOf(CalculationQueue);
    });
  });
});
