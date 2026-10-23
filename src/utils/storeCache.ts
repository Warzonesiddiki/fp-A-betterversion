import { QueryCache } from '@/engines/QueryCache';

// =============================================================================
// STORE CACHE — QueryCache integration for Zustand stores
// =============================================================================

const cache = new QueryCache({
  maxSize: 50 * 1024 * 1024, // 50MB
  maxEntries: 5000,
  defaultTtl: 5 * 60 * 1000, // 5 min
  enableStats: true,
});

/**
 * Get a cached value or compute and cache it.
 */
export function withCache<T>(key: string, fetcher: () => T, ttl?: number): T {
  return cache.getOrSet(key, fetcher as () => unknown, ttl) as T;
}

/**
 * Invalidate cache entries by key prefix.
 */
export function invalidateCache(prefix: string): number {
  return cache.invalidateByPrefix(prefix);
}

/**
 * Invalidate cache entries by regex pattern.
 */
export function invalidateCacheByPattern(pattern: RegExp): number {
  return cache.invalidateByPattern(pattern);
}

/**
 * Clear the entire cache.
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache statistics.
 */
export function getCacheStats() {
  return cache.getStats();
}

/**
 * Invalidate all cache entries for a store domain.
 */
export function invalidateStoreCache(storeName: string): number {
  return cache.invalidateByPrefix(`${storeName}:`);
}

export { cache as storeCache };
