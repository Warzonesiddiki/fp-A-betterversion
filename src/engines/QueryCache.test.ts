import { describe, it, expect, beforeEach } from 'vitest';
import { QueryCache } from './QueryCache';

describe('QueryCache', () => {
  let cache: QueryCache<string>;

  beforeEach(() => {
    cache = new QueryCache<string>({ maxEntries: 100, maxSize: 1024 * 1024, defaultTtl: 5000 });
  });

  it('should initialize with empty cache', () => {
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.getStats().entryCount).toBe(0);
  });

  it('should set and get values', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('should return undefined for missing keys', () => {
    expect(cache.get('nonexistent')).toBeUndefined();
  });

  it('should track hit/miss stats', () => {
    cache.set('key1', 'value1');
    cache.get('key1'); // hit
    cache.get('missing'); // miss

    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBeCloseTo(0.5);
  });

  it('should evict LRU entries when max entries exceeded', () => {
    const smallCache = new QueryCache<string>({
      maxEntries: 3,
      maxSize: 1024 * 1024,
      defaultTtl: 5000,
    });
    smallCache.set('a', '1');
    smallCache.set('b', '2');
    smallCache.set('c', '3');
    smallCache.set('d', '4'); // should evict 'a'

    expect(smallCache.get('a')).toBeUndefined();
    expect(smallCache.get('d')).toBe('4');
  });

  it('should delete entries', () => {
    cache.set('key1', 'value1');
    expect(cache.delete('key1')).toBe(true);
    expect(cache.get('key1')).toBeUndefined();
  });

  it('should clear all entries', () => {
    cache.set('a', '1');
    cache.set('b', '2');
    cache.clear();
    expect(cache.getStats().entryCount).toBe(0);
  });

  it('should check if key exists', () => {
    cache.set('key1', 'value1');
    expect(cache.has('key1')).toBe(true);
    expect(cache.has('missing')).toBe(false);
  });

  it('should invalidate by prefix', () => {
    cache.set('query:users:1', 'user1');
    cache.set('query:users:2', 'user2');
    cache.set('query:posts:1', 'post1');

    cache.invalidateByPrefix('query:users');
    expect(cache.get('query:users:1')).toBeUndefined();
    expect(cache.get('query:users:2')).toBeUndefined();
    expect(cache.get('query:posts:1')).toBe('post1');
  });

  it('should get stats', () => {
    cache.set('key1', 'value1');
    const stats = cache.getStats();
    expect(stats.entryCount).toBe(1);
    expect(stats.totalSize).toBeGreaterThan(0);
  });

  it('should get or set with factory', () => {
    const result = cache.getOrSet('key1', () => 'computed');
    expect(result).toBe('computed');
    expect(cache.get('key1')).toBe('computed');
  });

  it('should not recompute if cached', () => {
    let callCount = 0;
    cache.set('key1', 'cached');
    cache.getOrSet('key1', () => {
      callCount++;
      return 'new';
    });
    expect(callCount).toBe(0);
    expect(cache.get('key1')).toBe('cached');
  });
});
