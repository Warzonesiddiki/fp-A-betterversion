// =============================================================================
// WORKER POOL MANAGER
// Manages Web Worker lifecycle, task queuing, timeouts, and retries.
// Ensures workers are reused efficiently and terminated on shutdown.
// =============================================================================

import type { WorkerMessage, WorkerResponse, WorkerProgress } from './types';

/** Options for configuring a worker pool */
export interface WorkerPoolOptions {
  /** Maximum number of concurrent workers (default: navigator.hardwareConcurrency || 4) */
  readonly maxWorkers?: number;
  /** Task timeout in milliseconds (default: 60000) */
  readonly timeoutMs?: number;
  /** Maximum retry attempts on failure (default: 1) */
  readonly maxRetries?: number;
}

/** A pending task in the pool queue */
interface PendingTask<T> {
  readonly id: string;
  readonly data: unknown;
  readonly resolve: (value: T) => void;
  readonly reject: (reason: Error) => void;
  readonly onProgress?: (progress: WorkerProgress) => void;
  readonly timeoutMs: number;
  readonly maxRetries: number;
  retriesLeft: number;
}

/** Worker instance wrapper with state tracking */
interface ManagedWorker {
  worker: Worker;
  busy: boolean;
  currentTaskId: string | null;
  timeoutTimer: ReturnType<typeof setTimeout> | null;
}

/**
 * WorkerPool manages a pool of Web Workers for offloading heavy computations.
 *
 * Usage:
 * ```ts
 * const pool = new WorkerPool(
 *   () => new Worker(new URL('./monte-carlo.worker.ts', import.meta.url), { type: 'module' }),
 *   { maxWorkers: 2, timeoutMs: 30000 }
 * );
 *
 * const result = await pool.run<MonteCarloResponse>(requestData, onProgress);
 * pool.terminate();
 * ```
 */
export class WorkerPool {
  private workers: ManagedWorker[] = [];
  private queue: PendingTask<unknown>[] = [];
  private taskCounter = 0;
  private readonly workerFactory: () => Worker;
  private readonly maxWorkers: number;
  private readonly defaultTimeoutMs: number;
  private readonly defaultMaxRetries: number;
  private terminated = false;
  /**
   * Set when `workerFactory()` throws. Presence means this environment cannot
   * run workers at all, so queueing is pointless and tasks must be rejected.
   */
  private workerUnavailable: Error | null = null;

  constructor(workerFactory: () => Worker, options: WorkerPoolOptions = {}) {
    this.workerFactory = workerFactory;
    this.maxWorkers =
      options.maxWorkers ??
      (typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4);
    this.defaultTimeoutMs = options.timeoutMs ?? 60000;
    this.defaultMaxRetries = options.maxRetries ?? 1;
  }

  /**
   * Submit a task to the worker pool.
   * Returns a promise that resolves with the worker result.
   */
  run<T>(data: unknown, onProgress?: (progress: WorkerProgress) => void): Promise<T> {
    if (this.terminated) {
      return Promise.reject(new Error('WorkerPool has been terminated'));
    }

    const id = `task-${++this.taskCounter}`;

    return new Promise<T>((resolve, reject) => {
      const task: PendingTask<T> = {
        id,
        data,
        resolve: resolve as (value: unknown) => void,
        reject,
        onProgress,
        timeoutMs: this.defaultTimeoutMs,
        maxRetries: this.defaultMaxRetries,
        retriesLeft: this.defaultMaxRetries,
      };

      // Try to dispatch immediately
      this.workerUnavailable = null;
      const dispatched = this.dispatchTask(task as PendingTask<unknown>);
      if (dispatched) return;

      if (this.workerUnavailable) {
        // No worker can ever exist here — queueing would strand the caller.
        reject(this.wrapUnavailable(this.workerUnavailable));
        return;
      }

      // Every worker is busy: a running task will drain this queue on completion.
      this.queue.push(task as PendingTask<unknown>);
    });
  }

  /** Preserve the construction failure while naming the pool-level condition. */
  private wrapUnavailable(cause: Error): Error {
    const error = new Error(
      `WorkerPool cannot create a worker in this environment: ${cause.message}`,
      { cause }
    );
    error.name = 'WorkerUnavailableError';
    return error;
  }

  /**
   * Get the number of busy workers.
   */
  get busyCount(): number {
    return this.workers.filter((w) => w.busy).length;
  }

  /**
   * Get the number of queued tasks.
   */
  get queuedCount(): number {
    return this.queue.length;
  }

  /**
   * Get the total number of workers (active + idle).
   */
  get workerCount(): number {
    return this.workers.length;
  }

  /**
   * Terminate all workers and reject pending tasks.
   */
  terminate(): void {
    this.terminated = true;

    for (const managed of this.workers) {
      if (managed.timeoutTimer) {
        clearTimeout(managed.timeoutTimer);
      }
      managed.worker.terminate();
    }
    this.workers = [];

    // Reject all queued tasks
    for (const task of this.queue) {
      task.reject(new Error('WorkerPool terminated'));
    }
    this.queue = [];
  }

  // --- Private methods ---

  private dispatchTask(task: PendingTask<unknown>): boolean {
    // Find an idle worker
    let managed = this.workers.find((w) => !w.busy);

    // Create a new worker if under the limit
    if (!managed && this.workers.length < this.maxWorkers) {
      try {
        const worker = this.workerFactory();
        managed = {
          worker,
          busy: false,
          currentTaskId: null,
          timeoutTimer: null,
        };
        this.workers.push(managed);
      } catch (cause) {
        // The pool cannot create workers in this environment (no `Worker`
        // global, CSP refusal, module-worker unsupported...). Returning false
        // here used to send the task to a queue that only a worker could ever
        // drain, so the caller's promise never settled — masterStorage.setItem
        // hung forever and data was silently never persisted. Fail loudly and
        // immediately instead: an unusable pool must reject, never strand.
        this.workerUnavailable = cause instanceof Error ? cause : new Error(String(cause));
        return false;
      }
    }

    if (!managed || managed.busy) {
      return false;
    }

    // Assign task to worker
    managed.busy = true;
    managed.currentTaskId = task.id;

    // Set up message handler
    const messageHandler = (e: MessageEvent<WorkerResponse>) => {
      const response = e.data;

      if (response.id !== task.id) return;

      if (response.type === 'progress' && response.progress) {
        task.onProgress?.(response.progress);
        return;
      }

      // Clean up
      this.clearTimeout(managed!);
      managed!.worker.removeEventListener('message', messageHandler);
      // W7D: also drop the error listener. Leaving it attached let a stale
      // handler fire after this task settled and requeue/reject it again.
      managed!.worker.removeEventListener('error', errorHandler);
      managed!.busy = false;
      managed!.currentTaskId = null;

      if (response.type === 'error') {
        if (task.retriesLeft > 0) {
          task.retriesLeft--;
          // Re-queue with retry
          this.queue.unshift(task);
          this.processQueue();
        } else {
          task.reject(new Error(response.error ?? 'Worker task failed'));
          this.processQueue();
        }
      } else {
        task.resolve(response.payload);
        this.processQueue();
      }
    };

    managed.worker.addEventListener('message', messageHandler);

    // Set up error handler
    const errorHandler = (e: ErrorEvent) => {
      this.clearTimeout(managed!);
      managed!.worker.removeEventListener('message', messageHandler);
      managed!.worker.removeEventListener('error', errorHandler);
      managed!.busy = false;
      managed!.currentTaskId = null;

      if (task.retriesLeft > 0) {
        task.retriesLeft--;
        this.queue.unshift(task);
        this.processQueue();
      } else {
        task.reject(new Error(`Worker error: ${e.message}`));
        this.processQueue();
      }
    };

    managed.worker.addEventListener('error', errorHandler);

    // Set timeout
    managed.timeoutTimer = setTimeout(() => {
      managed!.worker.removeEventListener('message', messageHandler);
      managed!.worker.removeEventListener('error', errorHandler);

      // Terminate and replace the worker
      managed!.worker.terminate();
      const idx = this.workers.indexOf(managed!);
      if (idx >= 0) {
        this.workers.splice(idx, 1);
      }

      if (task.retriesLeft > 0) {
        task.retriesLeft--;
        this.queue.unshift(task);
        this.processQueue();
      } else {
        task.reject(new Error(`Worker task timed out after ${task.timeoutMs}ms`));
        this.processQueue();
      }
    }, task.timeoutMs);

    // Send the task
    const message: WorkerMessage = {
      id: task.id,
      type: 'compute',
      payload: task.data,
    };
    managed.worker.postMessage(message);

    return true;
  }

  private processQueue(): void {
    if (this.queue.length === 0) return;

    const task = this.queue.shift();
    if (!task) return;

    this.workerUnavailable = null;
    const dispatched = this.dispatchTask(task);
    if (dispatched) return;

    if (this.workerUnavailable) {
      // Worker creation just started failing (e.g. the last worker died and
      // cannot be replaced). Re-queueing would strand this task and every task
      // behind it, so drain the whole queue with the real reason.
      const reason = this.wrapUnavailable(this.workerUnavailable);
      task.reject(reason);
      const stranded = this.queue.splice(0, this.queue.length);
      for (const queued of stranded) queued.reject(reason);
      return;
    }

    // Workers exist but are all busy — a completion callback will retry.
    this.queue.unshift(task);
  }

  private clearTimeout(managed: ManagedWorker): void {
    if (managed.timeoutTimer) {
      clearTimeout(managed.timeoutTimer);
      managed.timeoutTimer = null;
    }
  }
}

// =============================================================================
// CONVENIENCE FACTORY FUNCTIONS
// =============================================================================

/**
 * Create a worker pool for Monte Carlo simulations.
 * Lazily creates the worker to avoid issues in SSR/test environments.
 */
export function createMonteCarloPool(options?: WorkerPoolOptions): WorkerPool {
  return new WorkerPool(
    () => new Worker(new URL('./monte-carlo.worker.ts', import.meta.url), { type: 'module' }),
    { maxWorkers: 2, timeoutMs: 120000, ...options }
  );
}

/**
 * Create a worker pool for consolidation calculations.
 */
export function createConsolidationPool(options?: WorkerPoolOptions): WorkerPool {
  return new WorkerPool(
    () => new Worker(new URL('./consolidation.worker.ts', import.meta.url), { type: 'module' }),
    { maxWorkers: 1, timeoutMs: 60000, ...options }
  );
}

/**
 * Create a worker pool for batch calculations.
 */
export function createBatchCalcPool(options?: WorkerPoolOptions): WorkerPool {
  return new WorkerPool(
    () => new Worker(new URL('./batch-calc.worker.ts', import.meta.url), { type: 'module' }),
    { maxWorkers: 2, timeoutMs: 30000, ...options }
  );
}

/**
 * Create a worker pool for heavy storage operations (JSON stringify/parse).
 */
export function createStoragePool(options?: WorkerPoolOptions): WorkerPool {
  return new WorkerPool(
    () => new Worker(new URL('./storage.worker.ts', import.meta.url), { type: 'module' }),
    { maxWorkers: 1, timeoutMs: 30000, ...options } // maxWorkers: 1 to preserve order if needed, though tasks are named
  );
}
