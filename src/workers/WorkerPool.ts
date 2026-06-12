export type WorkerPriority = 'low' | 'normal' | 'high' | 'critical';

export interface WorkerTask<T = unknown> {
  id: string;
  payload: T;
  priority: WorkerPriority;
  transferables?: Transferable[];
  timeout?: number;
}

export interface WorkerResult {
  taskId: string;
  result?: unknown;
  error?: string;
  duration: number;
}

interface InternalWorker {
  id: number;
  worker: Worker;
  busy: boolean;
  currentTaskId: string | null;
  taskCount: number;
  createdAt: number;
}

interface PendingTask<T = unknown> {
  task: WorkerTask<T>;
  resolve: (result: WorkerResult) => void;
  reject: (error: Error) => void;
  enqueuedAt: number;
}

const PRIORITY_WEIGHTS: Record<WorkerPriority, number> = {
  critical: 4,
  high: 3,
  normal: 2,
  low: 1,
};

export class WorkerPool {
  private workers: InternalWorker[] = [];
  private taskQueue: PendingTask[] = [];
  private activeTasks = new Map<string, { workerId: number; startTime: number }>();
  private maxWorkers: number;
  private workerFactory: () => Worker;
  private roundRobinIndex = 0;
  private isTerminated = false;
  private taskCounter = 0;

  constructor(workerFactory: () => Worker, maxWorkers?: number) {
    this.workerFactory = workerFactory;
    this.maxWorkers =
      maxWorkers ?? (typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency ?? 4) : 4);
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    for (let i = 0; i < this.maxWorkers; i++) {
      this.createWorker(i);
    }
  }

  private createWorker(id: number): InternalWorker {
    const worker = this.workerFactory();
    const internal: InternalWorker = {
      id,
      worker,
      busy: false,
      currentTaskId: null,
      taskCount: 0,
      createdAt: Date.now(),
    };

    worker.onmessage = (e: MessageEvent) => this.handleWorkerMessage(internal, e);
    worker.onerror = (e: ErrorEvent) => this.handleWorkerError(internal, e);

    this.workers.push(internal);
    return internal;
  }

  private handleWorkerMessage(internal: InternalWorker, event: MessageEvent): void {
    const taskId = internal.currentTaskId;
    if (!taskId) return;

    const pending = this.activeTasks.get(taskId);
    if (!pending) return;

    const duration = Date.now() - pending.startTime;
    this.activeTasks.delete(taskId);
    internal.busy = false;
    internal.currentTaskId = null;
    internal.taskCount++;

    const result: WorkerResult = {
      taskId,
      result: event.data,
      duration,
    };

    const queued = this.taskQueue.find((t) => t.task.id === taskId);
    if (queued) {
      this.taskQueue = this.taskQueue.filter((t) => t.task.id !== taskId);
      queued.resolve(result);
    }

    this.processNextTask();
  }

  private handleWorkerError(internal: InternalWorker, event: ErrorEvent): void {
    const taskId = internal.currentTaskId;
    if (!taskId) return;

    this.activeTasks.delete(taskId);
    internal.busy = false;
    internal.currentTaskId = null;

    const queued = this.taskQueue.find((t) => t.task.id === taskId);
    if (queued) {
      this.taskQueue = this.taskQueue.filter((t) => t.task.id !== taskId);
      queued.reject(new Error(event.message));
    }

    this.processNextTask();
  }

  async execute<T>(task: WorkerTask<T>): Promise<WorkerResult> {
    if (this.isTerminated) {
      throw new Error('WorkerPool has been terminated');
    }

    return new Promise<WorkerResult>((resolve, reject) => {
      const pending: PendingTask<T> = {
        task,
        resolve: resolve as (result: WorkerResult) => void,
        reject,
        enqueuedAt: Date.now(),
      };

      if (task.timeout) {
        setTimeout(() => {
          const idx = this.taskQueue.indexOf(pending as PendingTask);
          if (idx !== -1) {
            this.taskQueue.splice(idx, 1);
            reject(new Error(`Task ${task.id} timed out after ${task.timeout}ms`));
          }
        }, task.timeout);
      }

      this.taskQueue.push(pending as PendingTask);
      this.taskQueue.sort((a, b) => {
        const weightDiff = PRIORITY_WEIGHTS[b.task.priority] - PRIORITY_WEIGHTS[a.task.priority];
        if (weightDiff !== 0) return weightDiff;
        return a.enqueuedAt - b.enqueuedAt;
      });

      this.processNextTask();
    });
  }

  private processNextTask(): void {
    if (this.taskQueue.length === 0) return;

    const availableWorker = this.findAvailableWorker();
    if (!availableWorker) return;

    const pending = this.taskQueue.find((t) => !this.activeTasks.has(t.task.id));
    if (!pending) return;

    const { task } = pending;
    availableWorker.busy = true;
    availableWorker.currentTaskId = task.id;

    this.activeTasks.set(task.id, {
      workerId: availableWorker.id,
      startTime: Date.now(),
    });

    try {
      if (task.transferables) {
        availableWorker.worker.postMessage(task.payload, task.transferables);
      } else {
        availableWorker.worker.postMessage(task.payload);
      }
    } catch (error) {
      availableWorker.busy = false;
      availableWorker.currentTaskId = null;
      this.activeTasks.delete(task.id);
      pending.reject(error instanceof Error ? error : new Error(String(error)));
      this.processNextTask();
    }
  }

  private findAvailableWorker(): InternalWorker | null {
    for (let i = 0; i < this.workers.length; i++) {
      const idx = (this.roundRobinIndex + i) % this.workers.length;
      if (!this.workers[idx]!.busy) {
        this.roundRobinIndex = (idx + 1) % this.workers.length;
        return this.workers[idx]!;
      }
    }

    const leastBusy = this.workers.reduce<InternalWorker | null>(
      (min, w) => (min === null || w.taskCount < min.taskCount ? w : min),
      null
    );
    return leastBusy && !leastBusy.busy ? leastBusy : null;
  }

  async executeBatch<T>(tasks: WorkerTask<T>[]): Promise<WorkerResult[]> {
    return Promise.all(tasks.map((task) => this.execute<T>(task)));
  }

  getStats(): {
    totalWorkers: number;
    busyWorkers: number;
    queuedTasks: number;
    activeTasks: number;
    totalCompleted: number;
  } {
    const busyWorkers = this.workers.filter((w) => w.busy).length;
    const totalCompleted = this.workers.reduce((sum, w) => sum + w.taskCount, 0);

    return {
      totalWorkers: this.workers.length,
      busyWorkers,
      queuedTasks: this.taskQueue.length,
      activeTasks: this.activeTasks.size,
      totalCompleted,
    };
  }

  getQueueLength(): number {
    return this.taskQueue.length;
  }

  isIdle(): boolean {
    return this.taskQueue.length === 0 && this.activeTasks.size === 0;
  }

  generateTaskId(): string {
    return `task-${Date.now()}-${++this.taskCounter}`;
  }

  cancelTask(taskId: string): boolean {
    const queueIndex = this.taskQueue.findIndex((t) => t.task.id === taskId);
    if (queueIndex !== -1) {
      const [removed] = this.taskQueue.splice(queueIndex, 1);
      removed!.reject(new Error('Task cancelled'));
      return true;
    }

    const active = this.activeTasks.get(taskId);
    if (active) {
      const worker = this.workers.find((w) => w.id === active.workerId);
      if (worker) {
        worker.worker.terminate();
        const newWorker = this.createWorker(worker.id);
        const idx = this.workers.indexOf(worker);
        if (idx !== -1) this.workers[idx] = newWorker;
      }
      this.activeTasks.delete(taskId);
      return true;
    }

    return false;
  }

  terminate(): void {
    this.isTerminated = true;
    for (const pending of this.taskQueue) {
      pending.reject(new Error('WorkerPool terminated'));
    }
    this.taskQueue = [];

    for (const worker of this.workers) {
      worker.worker.terminate();
    }
    this.workers = [];
    this.activeTasks.clear();
  }

  resize(newSize: number): void {
    if (newSize < 1) throw new Error('Pool size must be at least 1');

    if (newSize > this.workers.length) {
      for (let i = this.workers.length; i < newSize; i++) {
        this.createWorker(i);
      }
    } else if (newSize < this.workers.length) {
      const toRemove = this.workers.splice(newSize);
      for (const worker of toRemove) {
        if (!worker.busy) {
          worker.worker.terminate();
        }
      }
    }
    this.maxWorkers = newSize;
  }
}
