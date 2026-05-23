/**
 * Persistence Debouncer — batches IndexedDB writes to prevent write amplification.
 * When 50 cells change, this writes once after a 1s pause instead of 50 individual writes.
 */

type WriteFn = (storeKey: string, data: unknown) => Promise<void>;

class PersistenceDebouncer {
  private pending = new Map<string, unknown>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private debounceMs: number;
  private paused = false;
  private writeFn: WriteFn | null = null;

  constructor(debounceMs = 1000) {
    this.debounceMs = debounceMs;
  }

  setWriteFn(fn: WriteFn): void {
    this.writeFn = fn;
  }

  queue(storeKey: string, data: unknown): void {
    this.pending.set(storeKey, data);

    if (this.paused) return;

    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), this.debounceMs);
  }

  async flush(): Promise<void> {
    if (!this.writeFn || this.pending.size === 0) return;

    const batch = new Map(this.pending);
    this.pending.clear();

    try {
      const writes: Promise<void>[] = [];
      for (const [storeKey, data] of batch) {
        writes.push(this.writeFn(storeKey, data));
      }
      await Promise.all(writes);
    } catch (error) {
      // Re-queue failed writes
      for (const [storeKey, data] of batch) {
        if (!this.pending.has(storeKey)) {
          this.pending.set(storeKey, data);
        }
      }
      console.error('[PersistenceDebouncer] Flush failed, re-queued:', error);
    }
  }

  pause(): void {
    this.paused = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  async resume(): Promise<void> {
    this.paused = false;
    if (this.pending.size > 0) {
      await this.flush();
    }
  }

  getPendingCount(): number {
    return this.pending.size;
  }

  clear(): void {
    this.pending.clear();
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

export const persistenceDebouncer = new PersistenceDebouncer();
export { PersistenceDebouncer };
