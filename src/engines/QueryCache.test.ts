import { describe, it, expect, beforeEach } from 'vitest';
import { QueryCache, createCubeQueryCache, createFormulaCache } from './QueryCache';

describe('QueryCache', () => {
  let cache: QueryCache<string>;

  beforeEach(() => {
    cache = new QueryCache<string>({ maxEntries: 100, maxSize: 1024 * 1024, defaultTtl: 5000 });
  });

  it('should initialize with empty cache', () => {
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.getStats().entryCount).toBe(0);
    expect(cache.size).toBe(0);
    expect(cache.memoryUsage).toBe(0);
  });

  it('should set and get values', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('should return undefined for missing keys', () => {
    expect(cache.get('nonexistent')).toBeUndefined();
  });

  it('should track hit/miss stats and allow resetStats', () => {
    cache.set('key1', 'value1');
    cache.get('key1'); // hit
    cache.get('missing'); // miss

    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBeCloseTo(0.5);

    cache.resetStats();
    expect(cache.getStats().hits).toBe(0);
    expect(cache.getStats().misses).toBe(0);
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
    expect(cache.delete('key1')).toBe(false);
    expect(cache.get('key1')).toBeUndefined();
  });

  it('should clear all entries', () => {
    cache.set('a', '1');
    cache.set('b', '2');
    cache.clear();
    expect(cache.getStats().entryCount).toBe(0);
    expect(cache.size).toBe(0);
  });

  it('should check if key exists', () => {
    cache.set('key1', 'value1');
    expect(cache.has('key1')).toBe(true);
    expect(cache.has('missing')).toBe(false);
  });

  it('should invalidate by prefix and by regex pattern', () => {
    cache.set('query:users:1', 'user1');
    cache.set('query:users:2', 'user2');
    cache.set('query:posts:1', 'post1');
    cache.set('query:posts:2', 'post2');

    const count1 = cache.invalidateByPrefix('query:users');
    expect(count1).toBe(2);
    expect(cache.get('query:users:1')).toBeUndefined();
    expect(cache.get('query:posts:1')).toBe('post1');

    const count2 = cache.invalidateByPattern(/posts:\d/);
    expect(count2).toBe(2);
    expect(cache.get('query:posts:1')).toBeUndefined();
  });

  it('should get stats with oldest and newest entries', () => {
    cache.set('key1', 'value1');
    const stats = cache.getStats();
    expect(stats.entryCount).toBe(1);
    expect(stats.totalSize).toBeGreaterThan(0);
    expect(stats.oldestEntry).toBeGreaterThan(0);
    expect(stats.newestEntry).toBeGreaterThan(0);
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

  it('provides keys, values, entries, and forEach iterators', () => {
    cache.set('k1', 'v1');
    cache.set('k2', 'v2');

    expect(cache.keys()).toEqual(['k1', 'k2']);
    expect(cache.values()).toEqual(['v1', 'v2']);
    expect(cache.entries()).toHaveLength(2);

    const visited: string[] = [];
    cache.forEach((v, k) => {
      visited.push(`${k}:${v}`);
    });
    expect(visited).toEqual(['k1:v1', 'k2:v2']);
  });

  it('expires entries when ttl expires', async () => {
    const expCache = new QueryCache<string>({ defaultTtl: 5 });
    expCache.set('temp', 'val');
    expect(expCache.get('temp')).toBe('val');

    await new Promise((r) => setTimeout(r, 15));
    expect(expCache.get('temp')).toBeUndefined();
    expect(expCache.has('temp')).toBe(false);
  });

  it('estimates memory size for various payload types', () => {
    const objectCache = new QueryCache<unknown>();
    objectCache.set('num', 42);
    objectCache.set('bool', true);
    objectCache.set('arr', [1, 'two', { three: 3 }]);
    objectCache.set('obj', { a: 1, b: 'two' });
    objectCache.set('null', null);

    expect(objectCache.memoryUsage).toBeGreaterThan(0);
  });

  it('creates cube query cache and formula cache presets', () => {
    const cubeCache = createCubeQueryCache();
    const formulaCache = createFormulaCache();

    expect(cubeCache).toBeInstanceOf(QueryCache);
    expect(formulaCache).toBeInstanceOf(QueryCache);
  });
});
