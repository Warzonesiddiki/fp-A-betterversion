import { describe, it, expect, vi, afterEach } from 'vitest';
import { WorkerPool } from './WorkerPool';
import type { WorkerTask } from './WorkerPool';

interface MockWorkerHandlers {
  onmessage: ((e: MessageEvent) => void) | null;
  onerror: ((e: ErrorEvent) => void) | null;
}

function createMockWorker(): Worker & MockWorkerHandlers {
  let _onmessage: ((e: MessageEvent) => void) | null = null;
  let _onerror: ((e: ErrorEvent) => void) | null = null;
  return {
    postMessage: vi.fn(),
    terminate: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    get onmessage() {
      return _onmessage;
    },
    set onmessage(fn) {
      _onmessage = fn;
    },
    get onerror() {
      return _onerror;
    },
    set onerror(fn) {
      _onerror = fn;
    },
  } as unknown as Worker & MockWorkerHandlers;
}

function createWorkerFactory(): {
  factory: () => Worker;
  instances: (Worker & MockWorkerHandlers)[];
} {
  const instances: (Worker & MockWorkerHandlers)[] = [];
  const factory = () => {
    const w = createMockWorker();
    instances.push(w);
    return w;
  };
  return { factory, instances };
}

describe('WorkerPool (alternative implementation)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('construction', () => {
    it('creates a pool with default maxWorkers', () => {
      const { factory } = createWorkerFactory();
      const pool = new WorkerPool(factory);
      expect(pool.getStats().totalWorkers).toBeGreaterThan(0);
      expect(pool.isIdle()).toBe(true);
      pool.terminate();
    });

    it('creates a pool with specified maxWorkers', () => {
      const { factory } = createWorkerFactory();
      const pool = new WorkerPool(factory, 3);
      expect(pool.getStats().totalWorkers).toBe(3);
      pool.terminate();
    });
  });

  describe('task execution', () => {
    it('dispatches a task to a worker', async () => {
      const { factory, instances } = createWorkerFactory();
      const pool = new WorkerPool(factory, 1);

      const task: WorkerTask = { id: 't1', payload: { data: 'hello' }, priority: 'normal' };
      pool.execute(task);

      await new Promise((r) => setTimeout(r, 10));

      expect(instances[0].postMessage).toHaveBeenCalled();
      pool.terminate();
    });

    it('completes task and receives result via onmessage', async () => {
      const { factory, instances } = createWorkerFactory();
      const pool = new WorkerPool(factory, 1);

      const task: WorkerTask = { id: 't1', payload: { x: 1 }, priority: 'normal' };
      const promise = pool.execute(task);

      await new Promise((r) => setTimeout(r, 10));

      const worker = instances[0];
      expect(worker.onmessage).toBeTruthy();

      worker.onmessage!({ data: { result: 42 } } as MessageEvent);

      const result = await promise;
      expect(result.result).toEqual({ result: 42 });
      expect(result.taskId).toBe('t1');
      pool.terminate();
    });

    it('handles worker error event', async () => {
      const { factory, instances } = createWorkerFactory();
      const pool = new WorkerPool(factory, 1);

      const task: WorkerTask = { id: 't1', payload: {}, priority: 'normal' };
      const promise = pool.execute(task);

      await new Promise((r) => setTimeout(r, 10));

      const worker = instances[0];
      expect(worker.onerror).toBeTruthy();

      worker.onerror!({ message: 'Worker crashed', error: new Error('crash') } as ErrorEvent);

      await expect(promise).rejects.toThrow();
      pool.terminate();
    });
  });

  describe('task queuing', () => {
    it('queues tasks when all workers busy', async () => {
      const { factory } = createWorkerFactory();
      const pool = new WorkerPool(factory, 1);

      const task1: WorkerTask = { id: 't1', payload: {}, priority: 'normal' };
      const task2: WorkerTask = { id: 't2', payload: {}, priority: 'normal' };

      pool.execute(task1);
      pool.execute(task2);

      await new Promise((r) => setTimeout(r, 10));

      expect(pool.getQueueLength()).toBe(2);
      expect(pool.getStats().busyWorkers).toBe(1);
      pool.terminate();
    });

    it('dequeues and processes after worker completes', async () => {
      const { factory, instances } = createWorkerFactory();
      const pool = new WorkerPool(factory, 1);

      const task1: WorkerTask = { id: 't1', payload: {}, priority: 'normal' };
      const task2: WorkerTask = { id: 't2', payload: {}, priority: 'normal' };

      const p1 = pool.execute(task1);
      pool.execute(task2);

      await new Promise((r) => setTimeout(r, 10));
      expect(pool.getQueueLength()).toBe(2);

      instances[0].onmessage!({ data: { result: 'done' } } as MessageEvent);
      await new Promise((r) => setTimeout(r, 10));

      expect(pool.getQueueLength()).toBe(1);
      pool.terminate();
    });
  });

  describe('batch execution', () => {
    it('executes multiple tasks and returns all results', async () => {
      const { factory, instances } = createWorkerFactory();
      const pool = new WorkerPool(factory, 2);

      const tasks: WorkerTask[] = [
        { id: 'a', payload: { val: 1 }, priority: 'normal' },
        { id: 'b', payload: { val: 2 }, priority: 'normal' },
      ];

      const promise = pool.executeBatch(tasks);

      await new Promise((r) => setTimeout(r, 10));

      for (const instance of instances) {
        if (instance.onmessage) {
          instance.onmessage!({ data: { done: true } } as MessageEvent);
        }
      }

      const results = await promise;
      expect(results).toHaveLength(2);
      pool.terminate();
    });
  });

  describe('cancellation', () => {
    it('cancels a queued task', async () => {
      const { factory } = createWorkerFactory();
      const pool = new WorkerPool(factory, 1);

      const task1: WorkerTask = { id: 't1', payload: {}, priority: 'normal' };
      const task2: WorkerTask = { id: 't2', payload: {}, priority: 'normal' };

      pool.execute(task1);
      const promise2 = pool.execute(task2);

      const cancelled = pool.cancelTask('t2');
      expect(cancelled).toBe(true);
      await expect(promise2).rejects.toThrow('cancelled');
      pool.terminate();
    });

    it('returns false for unknown task id', () => {
      const { factory } = createWorkerFactory();
      const pool = new WorkerPool(factory, 1);
      expect(pool.cancelTask('nonexistent')).toBe(false);
      pool.terminate();
    });
  });

  describe('pool management', () => {
    it('generates unique task ids', () => {
      const { factory } = createWorkerFactory();
      const pool = new WorkerPool(factory, 1);
      const id1 = pool.generateTaskId();
      const id2 = pool.generateTaskId();
      expect(id1).not.toBe(id2);
      pool.terminate();
    });

    it('resizes to more workers', () => {
      const { factory } = createWorkerFactory();
      const pool = new WorkerPool(factory, 1);
      pool.resize(5);
      expect(pool.getStats().totalWorkers).toBe(5);
      pool.terminate();
    });

    it('resizes to fewer workers', () => {
      const { factory } = createWorkerFactory();
      const pool = new WorkerPool(factory, 5);
      pool.resize(2);
      expect(pool.getStats().totalWorkers).toBe(2);
      pool.terminate();
    });

    it('throws on resize below 1', () => {
      const { factory } = createWorkerFactory();
      const pool = new WorkerPool(factory, 1);
      expect(() => pool.resize(0)).toThrow('at least 1');
      pool.terminate();
    });

    it('terminates all workers and clears state', () => {
      const { factory, instances } = createWorkerFactory();
      const pool = new WorkerPool(factory, 3);

      pool.terminate();
      expect(pool.getStats().totalWorkers).toBe(0);
      for (const instance of instances) {
        expect(instance.terminate).toHaveBeenCalled();
      }
    });
  });

  describe('stats and status', () => {
    it('reports idle state', () => {
      const { factory } = createWorkerFactory();
      const pool = new WorkerPool(factory, 1);
      expect(pool.isIdle()).toBe(true);
      expect(pool.getStats().busyWorkers).toBe(0);
      pool.terminate();
    });

    it('reports busy state during task', async () => {
      const { factory } = createWorkerFactory();
      const pool = new WorkerPool(factory, 1);

      const task: WorkerTask = { id: 't1', payload: {}, priority: 'normal' };
      pool.execute(task);

      await new Promise((r) => setTimeout(r, 10));
      expect(pool.getStats().busyWorkers).toBe(1);
      pool.terminate();
    });

    it('tracks completed task count', async () => {
      const { factory, instances } = createWorkerFactory();
      const pool = new WorkerPool(factory, 1);

      const task: WorkerTask = { id: 't1', payload: {}, priority: 'normal' };
      pool.execute(task);

      await new Promise((r) => setTimeout(r, 10));

      instances[0].onmessage!({ data: { result: 'done' } } as MessageEvent);
      await new Promise((r) => setTimeout(r, 10));

      expect(pool.getStats().totalCompleted).toBe(1);
      pool.terminate();
    });
  });

  describe('idle detection', () => {
    it('returns idle when no tasks', () => {
      const { factory } = createWorkerFactory();
      const pool = new WorkerPool(factory, 1);
      expect(pool.isIdle()).toBe(true);
      pool.terminate();
    });

    it('returns not idle during active task', async () => {
      const { factory } = createWorkerFactory();
      const pool = new WorkerPool(factory, 1);

      const task: WorkerTask = { id: 't1', payload: {}, priority: 'normal' };
      pool.execute(task);

      await new Promise((r) => setTimeout(r, 10));
      expect(pool.isIdle()).toBe(false);
      pool.terminate();
    });

    it('returns idle after task completes', async () => {
      const { factory, instances } = createWorkerFactory();
      const pool = new WorkerPool(factory, 1);

      const task: WorkerTask = { id: 't1', payload: {}, priority: 'normal' };
      pool.execute(task);

      await new Promise((r) => setTimeout(r, 10));

      instances[0].onmessage!({ data: { result: 'done' } } as MessageEvent);
      await new Promise((r) => setTimeout(r, 10));

      expect(pool.isIdle()).toBe(true);
      pool.terminate();
    });
  });
});
