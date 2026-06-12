/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Calculation Queue — priority-based engine execution with LRU cache.
 * Prevents UI freezing by controlling concurrent calculations.
 */

type Priority = 'critical' | 'high' | 'normal' | 'background';

interface CalcTask<T = unknown> {
  id: string;
  engineId: string;
  inputs: unknown;
  priority: Priority;
  computeFn: () => T | Promise<T>;
  onProgress?: (pct: number) => void;
  onResult?: (result: T) => void;
  abortController?: AbortController;
  resolve?: (value: T) => void;
  reject?: (reason: Error) => void;
}

interface CacheEntry<T = unknown> {
  result: T;
  timestamp: number;
}

const PRIORITY_ORDER: Record<Priority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  background: 3,
};

class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = 500) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const val = this.cache.get(key);
    if (val !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, val);
    }
    return val;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict oldest (first entry)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

function hashInputs(inputs: unknown): string {
  try {
    return JSON.stringify(inputs, Object.keys(inputs as Record<string, unknown>).sort());
  } catch {
    return String(inputs);
  }
}

export class CalculationQueue {
  private queue: CalcTask[] = [];
  private running = new Map<string, CalcTask>();
  private maxConcurrent: number;
  private cache = new LRUCache<string, unknown>(500);
  private taskCounter = 0;

  constructor(maxConcurrent: number = 4) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Enqueue a calculation task. Returns a promise that resolves with the result.
   */
  enqueue<T>(task: Omit<CalcTask<T>, 'id' | 'resolve' | 'reject'>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const fullTask: CalcTask<T> = {
        ...task,
        id: `calc-${++this.taskCounter}`,
        resolve: resolve as (value: unknown) => void,
        reject,
      } as CalcTask<T>;

      // Check cache first
      const cacheKey = `${task.engineId}:${hashInputs(task.inputs)}`;
      const cached = this.cache.get(cacheKey);
      if (cached !== undefined) {
        resolve(cached as T);
        return;
      }

      this.queue.push(fullTask as CalcTask);
      this.sort();
      this.processNext();
    });
  }

  /**
   * Cancel a task by ID.
   */
  cancel(taskId: string): void {
    // Remove from queue
    this.queue = this.queue.filter((t) => t.id !== taskId);

    // Abort if running
    const running = this.running.get(taskId);
    if (running) {
      running.abortController?.abort();
      this.running.delete(taskId);
      running.reject?.(new Error('Cancelled'));
    }
  }

  /**
   * Cancel all tasks.
   */
  cancelAll(): void {
    for (const task of this.queue) {
      task.reject?.(new Error('Cancelled'));
    }
    this.queue = [];

    for (const [, task] of this.running) {
      task.abortController?.abort();
      task.reject?.(new Error('Cancelled'));
    }
    this.running.clear();
  }

  /**
   * Compute with caching. Returns cached result if inputs match.
   */
  compute<T>(engineId: string, inputs: unknown, computeFn: () => T): T {
    const cacheKey = `${engineId}:${hashInputs(inputs)}`;
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) return cached as T;

    const result = computeFn();
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Invalidate cache entries for an engine, or all if no engine specified.
   */
  invalidate(engineId?: string): void {
    if (!engineId) {
      this.cache.clear();
      return;
    }
    // Clear entries matching engine prefix
    // LRU doesn't support prefix delete, so clear all for simplicity
    this.cache.clear();
  }

  /**
   * Sort queue by priority.
   */
  private sort(): void {
    this.queue.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  }

  /**
   * Process next task if under concurrency limit.
   */
  private processNext(): void {
    if (this.running.size >= this.maxConcurrent) return;
    if (this.queue.length === 0) return;

    const task = this.queue.shift()!;
    this.running.set(task.id, task);

    this.executeTask(task).finally(() => {
      this.running.delete(task.id);
      this.processNext();
    });
  }

  /**
   * Execute a single task.
   */
  private async executeTask(task: CalcTask): Promise<void> {
    try {
      if (task.abortController?.signal.aborted) {
        task.reject?.(new Error('Cancelled'));
        return;
      }

      const result = await task.computeFn();

      // Cache the result
      const cacheKey = `${task.engineId}:${hashInputs(task.inputs)}`;
      this.cache.set(cacheKey, result);

      task.onResult?.(result);
      task.resolve?.(result);
    } catch (error) {
      task.reject?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get queue stats.
   */
  getStats(): { queued: number; running: number; cached: number } {
    return {
      queued: this.queue.length,
      running: this.running.size,
      cached: this.cache.size,
    };
  }
}

// Singleton instance
export const calculationQueue = new CalculationQueue(4);
