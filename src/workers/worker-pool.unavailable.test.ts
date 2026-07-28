/**
 * F-0025 / F-0011 — worker-pool must never strand a task forever.
 *
 * Root cause found while diagnosing the cubeMigration timeout: when
 * `workerFactory()` throws (no `Worker` global in jsdom/Node, a CSP that blocks
 * module workers, or a browser that refuses the construction), `dispatchTask()`
 * caught the error and returned false, and `run()` pushed the task onto a queue
 * that nothing could ever drain — because draining requires a worker. The
 * returned promise then neither resolved nor rejected.
 *
 * That is a production data-loss path, not merely a test-hang: masterStorage
 * routes every persistence write through `wrapChunkedStorage`, whose `setItem`
 * awaits `storagePool.run(...)`. A user in that environment would see saves that
 * never complete and never error.
 *
 * These tests pin the contract: a pool that cannot obtain a worker must REJECT
 * with a diagnosable error, promptly, and must not leave queued work behind.
 */
import { describe, it, expect } from 'vitest';
import { WorkerPool } from './worker-pool';

const REJECT_BUDGET_MS = 2000;

describe('WorkerPool when workers are unavailable', () => {
  it('rejects instead of hanging when the worker factory throws', async () => {
    const pool = new WorkerPool(
      () => {
        throw new ReferenceError('Worker is not defined');
      },
      { maxWorkers: 1, timeoutMs: 30000 }
    );

    const started = Date.now();
    await expect(pool.run({ type: 'stringify' })).rejects.toThrow(/worker/i);
    expect(Date.now() - started).toBeLessThan(REJECT_BUDGET_MS);
    expect(pool.queuedCount, 'a rejected task must not stay queued').toBe(0);
  });

  it('surfaces the underlying construction failure for diagnosis', async () => {
    const pool = new WorkerPool(
      () => {
        throw new ReferenceError('Worker is not defined');
      },
      { maxWorkers: 1 }
    );

    await expect(pool.run({})).rejects.toThrow(/Worker is not defined/);
  });

  it('rejects every concurrent caller, not just the first', async () => {
    const pool = new WorkerPool(
      () => {
        throw new Error('blocked by CSP');
      },
      { maxWorkers: 2 }
    );

    const results = await Promise.allSettled([pool.run({}), pool.run({}), pool.run({})]);
    expect(results.map((r) => r.status)).toEqual(['rejected', 'rejected', 'rejected']);
    expect(pool.queuedCount).toBe(0);
  });

  it('rejects new work after terminate() rather than queueing it', async () => {
    const pool = new WorkerPool(() => {
      throw new Error('unavailable');
    });
    pool.terminate();
    await expect(pool.run({})).rejects.toThrow(/terminated/i);
  });
});
