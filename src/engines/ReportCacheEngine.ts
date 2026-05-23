// =============================================================================
// REPORT CACHE ENGINE — Cache generated reports for instant access
// Pure TypeScript, deterministic, no external dependencies
// =============================================================================

export interface CacheConfig {
  maxSize: number; // Max number of cached reports
  ttlMs: number; // Time-to-live in milliseconds
  evictionPolicy: 'lru' | 'lfu' | 'fifo';
}

export interface CacheEntry {
  reportId: string;
  key: string;
  data: unknown;
  size: number;
  createdAt: string;
  lastAccessed: string;
  accessCount: number;
  ttlMs: number;
  metadata: Record<string, unknown>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  currentSize: number;
  totalSize: number;
  hitRate: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 100,
  ttlMs: 5 * 60 * 1000, // 5 minutes
  evictionPolicy: 'lru',
};

export class ReportCacheEngine {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  get(key: string): unknown | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }

    entry.lastAccessed = new Date().toISOString();
    entry.accessCount++;
    this.hits++;
    return entry.data;
  }

  set(key: string, data: unknown, reportId: string, metadata: Record<string, unknown> = {}): void {
    if (this.cache.size >= this.config.maxSize) {
      this.evict();
    }

    const now = new Date().toISOString();
    const entry: CacheEntry = {
      reportId,
      key,
      data,
      size: this.estimateSize(data),
      createdAt: now,
      lastAccessed: now,
      accessCount: 0,
      ttlMs: this.config.ttlMs,
      metadata,
    };

    this.cache.set(key, entry);
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  invalidateByReport(reportId: string): number {
    let count = 0;
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.reportId === reportId) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): CacheStats {
    const totalSize = Array.from(this.cache.values()).reduce((sum, e) => sum + e.size, 0);
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      currentSize: this.cache.size,
      totalSize,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  getEntries(): CacheEntry[] {
    return Array.from(this.cache.values());
  }

  cleanup(): number {
    let removed = 0;
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        removed++;
      }
    }
    return removed;
  }

  configure(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): CacheConfig {
    return { ...this.config };
  }

  serialize(): string {
    return JSON.stringify({
      cache: Array.from(this.cache.entries()),
      config: this.config,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
    });
  }

  deserialize(data: string): void {
    const parsed = JSON.parse(data);
    this.cache = new Map(parsed.cache);
    this.config = parsed.config;
    this.hits = parsed.hits;
    this.misses = parsed.misses;
    this.evictions = parsed.evictions;
  }

  private isExpired(entry: CacheEntry): boolean {
    const elapsed = Date.now() - new Date(entry.createdAt).getTime();
    return elapsed > entry.ttlMs;
  }

  private evict(): void {
    const entries = Array.from(this.cache.entries());
    if (entries.length === 0) return;

    let targetKey: string;
    switch (this.config.evictionPolicy) {
      case 'lru':
        targetKey = entries.reduce(
          (min, [key, entry]) => (entry.lastAccessed < min[1].lastAccessed ? [key, entry] : min),
          entries[0]
        )[0];
        break;
      case 'lfu':
        targetKey = entries.reduce(
          (min, [key, entry]) => (entry.accessCount < min[1].accessCount ? [key, entry] : min),
          entries[0]
        )[0];
        break;
      case 'fifo':
        targetKey = entries.reduce(
          (min, [key, entry]) => (entry.createdAt < min[1].createdAt ? [key, entry] : min),
          entries[0]
        )[0];
        break;
      default:
        targetKey = entries[0][0];
    }

    this.cache.delete(targetKey);
    this.evictions++;
  }

  private estimateSize(value: unknown): number {
    if (value === null || value === undefined) return 8;
    if (typeof value === 'number') return 8;
    if (typeof value === 'boolean') return 4;
    if (typeof value === 'string') return value.length * 2;
    if (Array.isArray(value)) return value.reduce((sum, item) => sum + this.estimateSize(item), 16);
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value).length * 2;
      } catch {
        return 64;
      }
    }
    return 8;
  }
}
