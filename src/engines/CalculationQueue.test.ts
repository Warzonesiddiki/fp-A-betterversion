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
        engineId: 'test-engine',
        inputs: {},
        priority: 'normal' as const,
        computeFn: async () => 42,
      };
      queue.enqueue(task);
      const stats = queue.getStats();
      expect(stats.queued + stats.running).toBeGreaterThanOrEqual(1);
    });
  });

  describe('cancel', () => {
    it('cancels a task', async () => {
      const p = queue
        .enqueue({
          engineId: 'test-engine',
          inputs: {},
          priority: 'normal' as const,
          computeFn: async () => 42,
        })
        .catch(() => {});
      // The task counter starts at 0, so first enqueue gets 'calc-1'
      queue.cancel('calc-1');
      await p;
      const stats = queue.getStats();
      expect(stats.queued).toBe(0);
    });
  });

  describe('cancelAll', () => {
    it('cancels all tasks', async () => {
      const p1 = queue
        .enqueue({
          engineId: 'e1',
          inputs: {},
          priority: 'normal',
          computeFn: async () => 1,
        })
        .catch(() => {});
      const p2 = queue
        .enqueue({
          engineId: 'e2',
          inputs: {},
          priority: 'high',
          computeFn: async () => 2,
        })
        .catch(() => {});
      queue.cancelAll();
      await Promise.all([p1, p2]);
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
