export interface CacheEntry<T> {
  key: string;
  value: T;
  size: number;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  ttl?: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalSize: number;
  entryCount: number;
  evictions: number;
  oldestEntry: number;
  newestEntry: number;
}

export interface QueryCacheConfig {
  maxSize: number;
  maxEntries: number;
  defaultTtl: number;
  enableStats: boolean;
}

const DEFAULT_CONFIG: QueryCacheConfig = {
  maxSize: 50 * 1024 * 1024,
  maxEntries: 10000,
  defaultTtl: 5 * 60 * 1000,
  enableStats: true,
};

export class QueryCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: QueryCacheConfig;
  private hits = 0;
  private misses = 0;
  private evictions = 0;
  private currentSize = 0;

  constructor(config: Partial<QueryCacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private hashKey(params: Record<string, unknown>): string {
    const sorted = Object.keys(params)
      .sort()
      .map((key) => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    return this.simpleHash(sorted);
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `q_${Math.abs(hash).toString(36)}`;
  }

  private estimateSize(value: unknown): number {
    if (value === null || value === undefined) return 8;
    if (typeof value === 'number') return 8;
    if (typeof value === 'boolean') return 4;
    if (typeof value === 'string') return value.length * 2;
    if (Array.isArray(value)) {
      return value.reduce((sum, item) => sum + this.estimateSize(item), 16);
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value).length * 2;
      } catch {
        return 64;
      }
    }
    return 8;
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.createdAt > entry.ttl;
  }

  private evict(): void {
    if (this.cache.size === 0) return;

    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of Array.from(this.cache)) {
      if (this.isExpired(entry)) {
        this.currentSize -= entry.size;
        this.cache.delete(key);
        this.evictions++;
        return;
      }
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey)!;
      this.currentSize -= entry.size;
      this.cache.delete(oldestKey);
      this.evictions++;
    }
  }

  private ensureCapacity(): void {
    while (this.cache.size >= this.config.maxEntries || this.currentSize >= this.config.maxSize) {
      this.evict();
    }
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      if (this.config.enableStats) this.misses++;
      return undefined;
    }

    if (this.isExpired(entry)) {
      this.currentSize -= entry.size;
      this.cache.delete(key);
      if (this.config.enableStats) this.misses++;
      return undefined;
    }

    entry.lastAccessed = Date.now();
    entry.accessCount++;
    if (this.config.enableStats) this.hits++;
    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    const size = this.estimateSize(value);

    const existing = this.cache.get(key);
    if (existing) {
      this.currentSize -= existing.size;
    }

    this.ensureCapacity();

    const entry: CacheEntry<T> = {
      key,
      value,
      size,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
      ttl: ttl ?? this.config.defaultTtl,
    };

    this.cache.set(key, entry);
    this.currentSize += size;
  }

  getOrSet(key: string, factory: () => T, ttl?: number): T {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const value = factory();
    this.set(key, value, ttl);
    return value;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.currentSize -= entry.size;
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSize -= entry.size;
      this.cache.delete(key);
      return true;
    }
    return false;
  }

  invalidateByPrefix(prefix: string): number {
    let count = 0;
    for (const [key, entry] of Array.from(this.cache)) {
      if (key.startsWith(prefix)) {
        this.currentSize -= entry.size;
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  invalidateByPattern(pattern: RegExp): number {
    let count = 0;
    for (const [key, entry] of Array.from(this.cache)) {
      if (pattern.test(key)) {
        this.currentSize -= entry.size;
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalRequests = this.hits + this.misses;

    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: totalRequests > 0 ? this.hits / totalRequests : 0,
      totalSize: this.currentSize,
      entryCount: this.cache.size,
      evictions: this.evictions,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map((e) => e.createdAt)) : 0,
      newestEntry: entries.length > 0 ? Math.max(...entries.map((e) => e.createdAt)) : 0,
    };
  }

  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  values(): T[] {
    return Array.from(this.cache.values()).map((e) => e.value);
  }

  entries(): Array<{ key: string; value: T; metadata: Omit<CacheEntry<T>, 'value'> }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      value: entry.value,
      metadata: {
        key: entry.key,
        size: entry.size,
        createdAt: entry.createdAt,
        lastAccessed: entry.lastAccessed,
        accessCount: entry.accessCount,
        ttl: entry.ttl,
      },
    }));
  }

  forEach(callback: (value: T, key: string) => void): void {
    for (const [key, entry] of Array.from(this.cache)) {
      if (!this.isExpired(entry)) {
        callback(entry.value, key);
      }
    }
  }

  get size(): number {
    return this.cache.size;
  }

  get memoryUsage(): number {
    return this.currentSize;
  }
}

export function createCubeQueryCache(config?: Partial<QueryCacheConfig>): QueryCache {
  return new QueryCache(config);
}

export function createFormulaCache(config?: Partial<QueryCacheConfig>): QueryCache {
  return new QueryCache({
    maxSize: 10 * 1024 * 1024,
    maxEntries: 5000,
    defaultTtl: 2 * 60 * 1000,
    ...config,
  });
}
