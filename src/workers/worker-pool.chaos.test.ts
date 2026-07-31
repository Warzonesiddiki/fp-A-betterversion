/**
 * Omega Protocol §4 — Worker chaos-resilience suite.
 *
 * Actively tries to break the WorkerPool rather than checking the happy path
 * (covered by worker-pool.test.ts). Each SURVIVES scenario probes one failure
 * mode of the real pool contract: construction refusal, a hung worker, a
 * transient error, rapid spawn/terminate flapping, and shutdown drain. The pool
 * must settle every promise (never strand the caller) and leave no leaked
 * workers or queued tasks.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { WorkerPool } from './worker-pool';
import type { WorkerResponse } from './types';

// ── Fault-injecting mock worker (mirrors worker-pool.test.ts) ────────────────
interface MockWorkerInstance {
  postMessage: ReturnType<typeof vi.fn>;
  terminate: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  simulateResponse: (response: WorkerResponse) => void;
  simulateError: (message: string) => void;
}

function createMockWorker(): MockWorkerInstance {
  const handlers = new Map<string, ((...args: unknown[]) => unknown)[]>();
  return {
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
      for (const h of handlers.get('message') ?? []) h({ data: response });
    },
    simulateError: (message: string) => {
      for (const h of handlers.get('error') ?? []) h({ message });
    },
  };
}

function createMockWorkerFactory(): { factory: () => Worker; instances: MockWorkerInstance[] } {
  const instances: MockWorkerInstance[] = [];
  return {
    factory: () => {
      const mock = createMockWorker();
      instances.push(mock);
      return mock as unknown as Worker;
    },
    instances,
  };
}

describe('CHAOS: WorkerPool resilience (Omega §4)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('SURVIVES: worker construction is refused (CSP / no Worker global) — rejects immediately, never strands', async () => {
    const pool = new WorkerPool(
      () => {
        throw new Error('CSP violation: Worker blocked');
      },
      { maxWorkers: 1 }
    );

    // Two consecutive submissions must BOTH reject with the unavailable reason —
    // a refused pool must never silently queue a task it can never run.
    await expect(pool.run({})).rejects.toThrow(/cannot create a worker/i);
    await expect(pool.run({})).rejects.toThrow(/cannot create a worker/i);
    expect(pool.workerCount).toBe(0);
    expect(pool.queuedCount).toBe(0);
  });

  it('SURVIVES: worker hangs indefinitely — watchdog times out, rejects, and terminates the worker', async () => {
    const { factory, instances } = createMockWorkerFactory();
    const pool = new WorkerPool(factory, { maxWorkers: 1, timeoutMs: 60, maxRetries: 0 });

    await expect(pool.run({})).rejects.toThrow(/timed out after 60ms/i);
    // The hung worker must be killed so it cannot leak.
    expect(instances[0]!.terminate).toHaveBeenCalled();
    expect(pool.workerCount).toBe(0);
  });

  it('SURVIVES: transient worker error — retries once and recovers the result', async () => {
    const { factory, instances } = createMockWorkerFactory();
    const pool = new WorkerPool(factory, { maxWorkers: 1, timeoutMs: 5000, maxRetries: 1 });

    const result = pool.run<number>({ n: 1 });
    expect(instances[0]).toBeDefined();

    // First dispatch fails transiently; the pool re-queues and re-dispatches.
    instances[0]!.simulateError('transient fault');
    expect(instances[0]!.postMessage).toHaveBeenCalledTimes(2); // initial + retry

    const id = (instances[0]!.postMessage.mock.calls[0]![0] as { id: string }).id;
    instances[0]!.simulateResponse({ id, type: 'result', payload: 42 });

    await expect(result).resolves.toBe(42);
  });

  it('SURVIVES: rapid spawn/respond/terminate flapping leaves no leaked workers or queue', async () => {
    for (let i = 0; i < 50; i++) {
      const { factory, instances } = createMockWorkerFactory();
      const pool = new WorkerPool(factory, { maxWorkers: 2 });

      const result = pool.run<number>({});
      expect(instances[0]).toBeDefined();
      const id = (instances[0]!.postMessage.mock.calls[0]![0] as { id: string }).id;
      instances[0]!.simulateResponse({ id, type: 'result', payload: i });

      await expect(result).resolves.toBe(i);
      pool.terminate(); // flapping: tear down immediately
      expect(pool.workerCount).toBe(0);
      expect(pool.queuedCount).toBe(0);
    }
  });

  it('SURVIVES: terminate() while workers are busy drains the queue and rejects stranded tasks', async () => {
    const { factory } = createMockWorkerFactory();
    const pool = new WorkerPool(factory, { maxWorkers: 1, timeoutMs: 5000 });

    void pool.run({}).catch(() => {}); // occupies the only worker (never responds)
    const queued = pool.run({}); // stranded behind the busy worker
    expect(pool.queuedCount).toBe(1);

    pool.terminate();
    await expect(queued).rejects.toThrow(/terminated/i);
    expect(pool.queuedCount).toBe(0);
    expect(pool.workerCount).toBe(0);
  });
});
