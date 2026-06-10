import { describe, it, expect, vi, afterEach } from 'vitest';
import { WorkerPool } from './worker-pool';
import type { WorkerResponse } from './types';

// =============================================================================
// MOCK WORKER
// =============================================================================

interface MockWorkerInstance {
  postMessage: ReturnType<typeof vi.fn>;
  terminate: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  // Test helpers
  simulateResponse: (response: WorkerResponse) => void;
  simulateError: (message: string) => void;
  getHandlers: () => Map<string, ((...args: unknown[]) => unknown)[]>;
}

function createMockWorker(): MockWorkerInstance {
  const handlers = new Map<string, ((...args: unknown[]) => unknown)[]>();
  const mock: MockWorkerInstance = {
    postMessage: vi.fn(),
    terminate: vi.fn(),
    addEventListener: vi.fn((event: string, handler: (...args: unknown[]) => unknown) => {
      if (!handlers.has(event)) handlers.set(event, []);
      handlers.get(event)!.push(handler);
    }),
    removeEventListener: vi.fn((event: string, handler: (...args: unknown[]) => unknown) => {
      const list = handlers.get(event);
      if (list) {
        const idx = list.indexOf(handler);
        if (idx >= 0) list.splice(idx, 1);
      }
    }),
    simulateResponse: (response: WorkerResponse) => {
      const list = handlers.get('message');
      if (list) {
        for (const handler of list) {
          handler({ data: response });
        }
      }
    },
    simulateError: (message: string) => {
      const list = handlers.get('error');
      if (list) {
        for (const handler of list) {
          handler({ message });
        }
      }
    },
    getHandlers: () => handlers,
  };

  return mock;
}

function createMockWorkerFactory(): {
  factory: () => Worker;
  instances: MockWorkerInstance[];
} {
  const instances: MockWorkerInstance[] = [];
  const factory = () => {
    const mock = createMockWorker();
    instances.push(mock);
    return mock as unknown as Worker;
  };
  return { factory, instances };
}

// =============================================================================
// TESTS
// =============================================================================

describe('WorkerPool', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('construction', () => {
    it('should create a pool with default options', () => {
      const { factory } = createMockWorkerFactory();
      const pool = new WorkerPool(factory);

      expect(pool.workerCount).toBe(0);
      expect(pool.busyCount).toBe(0);
      expect(pool.queuedCount).toBe(0);

      pool.terminate();
    });

    it('should accept custom options', () => {
      const { factory } = createMockWorkerFactory();
      const pool = new WorkerPool(factory, {
        maxWorkers: 2,
        timeoutMs: 5000,
        maxRetries: 3,
      });

      expect(pool.workerCount).toBe(0);
      pool.terminate();
    });
  });

  describe('task execution', () => {
    it('should execute a task and return result', async () => {
      const { factory, instances } = createMockWorkerFactory();
      const pool = new WorkerPool(factory, { maxWorkers: 1 });

      const promise = pool.run({ data: 'test' });

      // Wait for worker to be created
      await new Promise((r) => setTimeout(r, 0));

      expect(instances.length).toBe(1);
      expect(pool.busyCount).toBe(1);

      // Simulate worker response
      const postedMessage = instances![0]!.postMessage.mock.calls[0]![0];
      instances![0]!.simulateResponse({
        id: postedMessage.id,
        type: 'result',
        payload: { result: 42 },
      });

      const result = await promise;
      expect(result).toEqual({ result: 42 });
      expect(pool.busyCount).toBe(0);

      pool.terminate();
    });

    it('should handle worker errors', async () => {
      const { factory, instances } = createMockWorkerFactory();
      const pool = new WorkerPool(factory, { maxWorkers: 1, maxRetries: 0 });

      const promise = pool.run({ data: 'test' });

      await new Promise((r) => setTimeout(r, 0));

      const postedMessage = instances![0]!.postMessage.mock.calls[0]![0];
      instances![0]!.simulateResponse({
        id: postedMessage.id,
        type: 'error',
        error: 'Computation failed',
      });

      await expect(promise).rejects.toThrow('Computation failed');

      pool.terminate();
    });

    it('should retry on failure', async () => {
      const { factory, instances } = createMockWorkerFactory();
      const pool = new WorkerPool(factory, { maxWorkers: 1, maxRetries: 1 });

      const promise = pool.run({ data: 'test' });

      // First attempt fails
      await new Promise((r) => setTimeout(r, 0));
      const firstMessage = instances![0]!.postMessage.mock.calls[0]![0];
      instances![0]!.simulateResponse({
        id: firstMessage.id,
        type: 'error',
        error: 'Temporary failure',
      });

      // Wait for retry
      await new Promise((r) => setTimeout(r, 10));

      // Second attempt succeeds
      if (instances![0]!.postMessage.mock.calls.length > 1) {
        const secondMessage = instances![0]!.postMessage.mock.calls[1]![0];
        instances![0]!.simulateResponse({
          id: secondMessage.id,
          type: 'result',
          payload: { recovered: true },
        });
      }

      const result = await promise;
      expect(result).toEqual({ recovered: true });

      pool.terminate();
    });

    it('should forward progress callbacks', async () => {
      const { factory, instances } = createMockWorkerFactory();
      const pool = new WorkerPool(factory, { maxWorkers: 1 });

      const progressCalls: Array<{ processed: number; total: number; percent: number }> = [];
      const promise = pool.run({ data: 'test' }, (progress) => progressCalls.push(progress));

      await new Promise((r) => setTimeout(r, 0));

      const postedMessage = instances![0]!.postMessage.mock.calls[0]![0];

      // Simulate progress
      instances![0]!.simulateResponse({
        id: postedMessage.id,
        type: 'progress',
        progress: { processed: 50, total: 100, percent: 50 },
      });

      instances![0]!.simulateResponse({
        id: postedMessage.id,
        type: 'progress',
        progress: { processed: 100, total: 100, percent: 100 },
      });

      // Simulate final result
      instances![0]!.simulateResponse({
        id: postedMessage.id,
        type: 'result',
        payload: { done: true },
      });

      const result = await promise;
      expect(result).toEqual({ done: true });
      expect(progressCalls.length).toBe(2);
      expect(progressCalls![0]!.percent).toBe(50);
      expect(progressCalls![1]!.percent).toBe(100);

      pool.terminate();
    });
  });

  describe('worker lifecycle', () => {
    it('should create workers lazily', async () => {
      const { factory, instances } = createMockWorkerFactory();
      const pool = new WorkerPool(factory, { maxWorkers: 4 });

      expect(instances.length).toBe(0);

      const promise = pool.run({ data: 'test' });
      await new Promise((r) => setTimeout(r, 0));

      expect(instances.length).toBe(1);

      const msg = instances![0]!.postMessage.mock.calls[0]![0];
      instances![0]!.simulateResponse({
        id: msg.id,
        type: 'result',
        payload: 'ok',
      });

      await promise;
      pool.terminate();
    });

    it('should reuse idle workers', async () => {
      const { factory, instances } = createMockWorkerFactory();
      const pool = new WorkerPool(factory, { maxWorkers: 2 });

      // First task
      const promise1 = pool.run({ data: 'task1' });
      await new Promise((r) => setTimeout(r, 0));

      const msg1 = instances![0]!.postMessage.mock.calls[0]![0];
      instances![0]!.simulateResponse({
        id: msg1.id,
        type: 'result',
        payload: 'result1',
      });
      await promise1;

      // Second task should reuse the same worker
      const promise2 = pool.run({ data: 'task2' });
      await new Promise((r) => setTimeout(r, 0));

      expect(instances.length).toBe(1); // Same worker reused

      const msg2 = instances![0]!.postMessage.mock.calls[1]![0];
      instances![0]!.simulateResponse({
        id: msg2.id,
        type: 'result',
        payload: 'result2',
      });
      await promise2;

      pool.terminate();
    });

    it('should terminate all workers', () => {
      const { factory, instances } = createMockWorkerFactory();
      const pool = new WorkerPool(factory, { maxWorkers: 3 });

      // Start 3 tasks to create 3 workers
      pool.run({ data: 't1' });
      pool.run({ data: 't2' });
      pool.run({ data: 't3' });

      pool.terminate();

      for (const instance of instances) {
        expect(instance.terminate).toHaveBeenCalled();
      }

      expect(pool.workerCount).toBe(0);
    });

    it('should reject tasks after termination', async () => {
      const { factory } = createMockWorkerFactory();
      const pool = new WorkerPool(factory, { maxWorkers: 1 });

      pool.terminate();

      await expect(pool.run({ data: 'test' })).rejects.toThrow('WorkerPool has been terminated');
    });
  });

  describe('task queuing', () => {
    it('should queue tasks when all workers are busy', async () => {
      const { factory, instances } = createMockWorkerFactory();
      const pool = new WorkerPool(factory, { maxWorkers: 1 });

      // Start two tasks with one worker
      const promise1 = pool.run({ data: 'task1' });
      const promise2 = pool.run({ data: 'task2' });

      await new Promise((r) => setTimeout(r, 0));

      expect(pool.busyCount).toBe(1);
      expect(pool.queuedCount).toBe(1);

      // Complete first task
      const msg1 = instances![0]!.postMessage.mock.calls[0]![0];
      instances![0]!.simulateResponse({
        id: msg1.id,
        type: 'result',
        payload: 'result1',
      });
      await promise1;

      // Second task should now be dispatched
      await new Promise((r) => setTimeout(r, 0));

      const msg2 = instances![0]!.postMessage.mock.calls[1]![0];
      instances![0]!.simulateResponse({
        id: msg2.id,
        type: 'result',
        payload: 'result2',
      });
      await promise2;

      expect(pool.queuedCount).toBe(0);
      pool.terminate();
    });

    it('should reject queued tasks on termination', async () => {
      const { factory, instances } = createMockWorkerFactory();
      const pool = new WorkerPool(factory, { maxWorkers: 1 });

      const promise1 = pool.run({ data: 'task1' });
      const promise2 = pool.run({ data: 'task2' });

      await new Promise((r) => setTimeout(r, 0));

      pool.terminate();

      await expect(promise2).rejects.toThrow('WorkerPool terminated');
    });
  });

  describe('timeout', () => {
    it('should timeout tasks that take too long', async () => {
      vi.useFakeTimers();
      const { factory, instances } = createMockWorkerFactory();
      const pool = new WorkerPool(factory, { maxWorkers: 1, timeoutMs: 1000, maxRetries: 0 });

      const promise = pool.run({ data: 'slow-task' });

      // Attach a no-op catch to prevent unhandled rejection during timer advancement
      promise.catch(() => {});

      // Advance past the initial setTimeout(r, 0) and the 1000ms task timeout
      await vi.advanceTimersByTimeAsync(1100);

      await expect(promise).rejects.toThrow(/timed out/);

      // Worker should have been terminated
      expect(instances![0]!.terminate).toHaveBeenCalled();

      pool.terminate();
      vi.useRealTimers();
    });
  });
});
