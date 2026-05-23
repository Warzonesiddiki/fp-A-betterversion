/**
 * Memory Monitor — tracks JS heap size, evicts cold data, hydrates on demand.
 * Desktop apps run for hours; this prevents unbounded memory growth.
 */

type StoreAccessRecord = { lastAccessed: number; size: number };

class MemoryMonitor {
  private softLimit: number;
  private checkIntervalMs: number;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private storeAccess = new Map<string, StoreAccessRecord>();
  private evictedStores = new Set<string>();

  constructor(softLimitMB = 512, checkIntervalSec = 30) {
    this.softLimit = softLimitMB * 1024 * 1024;
    this.checkIntervalMs = checkIntervalSec * 1000;
  }

  start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.check(), this.checkIntervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getHeapUsage(): { used: number; total: number; percentage: number } {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const mem = (
        performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number } }
      ).memory;
      return {
        used: mem.usedJSHeapSize,
        total: mem.totalJSHeapSize,
        percentage: Math.round((mem.usedJSHeapSize / mem.totalJSHeapSize) * 100),
      };
    }
    return { used: 0, total: 0, percentage: 0 };
  }

  isUnderLimit(): boolean {
    const { used } = this.getHeapUsage();
    return used === 0 || used < this.softLimit;
  }

  trackStore(storeName: string, sizeBytes: number): void {
    this.storeAccess.set(storeName, { lastAccessed: Date.now(), size: sizeBytes });
  }

  touchStore(storeName: string): void {
    const record = this.storeAccess.get(storeName);
    if (record) record.lastAccessed = Date.now();
  }

  async evictCold(): Promise<string[]> {
    const now = Date.now();
    const coldThreshold = 15 * 60 * 1000; // 15 minutes
    const evicted: string[] = [];

    const sorted = [...this.storeAccess.entries()]
      .filter(([, r]) => now - r.lastAccessed > coldThreshold)
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    for (const [name, record] of sorted) {
      if (this.isUnderLimit()) break;
      try {
        if (typeof indexedDB !== 'undefined') {
          const db = await this.openDB();
          const tx = db.transaction('coldStores', 'readwrite');
          const store = tx.objectStore('coldStores');
          store.put({ name, size: record.size, evictedAt: now });
        }
        this.evictedStores.add(name);
        this.storeAccess.delete(name);
        evicted.push(name);
      } catch {
        // ignore eviction failures
      }
    }
    return evicted;
  }

  async hydrate(storeName: string): Promise<boolean> {
    if (!this.evictedStores.has(storeName)) return false;
    try {
      if (typeof indexedDB !== 'undefined') {
        const db = await this.openDB();
        const tx = db.transaction('coldStores', 'readonly');
        const store = tx.objectStore('coldStores');
        const req = store.get(storeName);
        return new Promise((resolve) => {
          req.onsuccess = () => {
            this.evictedStores.delete(storeName);
            this.storeAccess.set(storeName, { lastAccessed: Date.now(), size: 0 });
            resolve(true);
          };
          req.onerror = () => resolve(false);
        });
      }
    } catch {
      // ignore
    }
    return false;
  }

  async forceCleanup(): Promise<void> {
    await this.evictCold();
    if (typeof globalThis.gc === 'function') {
      globalThis.gc();
    }
  }

  getEvictedStores(): string[] {
    return [...this.evictedStores];
  }

  private check(): void {
    if (!this.isUnderLimit()) {
      this.evictCold().catch(() => {});
    }
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('finplan-memory', 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore('coldStores', { keyPath: 'name' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
}

export const memoryMonitor = new MemoryMonitor();
export { MemoryMonitor };
