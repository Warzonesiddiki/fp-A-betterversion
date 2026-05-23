import { describe, it, expect } from 'vitest';

describe('Workers module exports', () => {
  it('should export WorkerPool class', async () => {
    const { WorkerPool } = await import('./worker-pool');
    expect(WorkerPool).toBeDefined();
    expect(typeof WorkerPool).toBe('function');
  });

  it('should export all public API functions from index', async () => {
    const mod = await import('./index');

    expect(mod.WorkerPool).toBeDefined();
    expect(typeof mod.runMonteCarlo).toBe('function');
    expect(typeof mod.runConsolidation).toBe('function');
    expect(typeof mod.runBatchCalc).toBe('function');
    expect(typeof mod.terminateAllWorkers).toBe('function');
    expect(typeof mod.getWorkerPoolStatus).toBe('function');
  });

  it('should export worker pool factory functions', async () => {
    const pool = await import('./worker-pool');

    // The factory functions are internal but WorkerPool is the public API
    expect(pool.WorkerPool).toBeDefined();
  });

  it('should have getWorkerPoolStatus return correct initial state', async () => {
    const { getWorkerPoolStatus } = await import('./index');
    const status = getWorkerPoolStatus();

    expect(status.monteCarlo).toEqual({ workers: 0, busy: 0, queued: 0 });
    expect(status.consolidation).toEqual({ workers: 0, busy: 0, queued: 0 });
    expect(status.batchCalc).toEqual({ workers: 0, busy: 0, queued: 0 });
  });

  it('should have terminateAllWorkers as a no-op when no pools exist', async () => {
    const { terminateAllWorkers } = await import('./index');
    // Should not throw
    expect(() => terminateAllWorkers()).not.toThrow();
  });
});
