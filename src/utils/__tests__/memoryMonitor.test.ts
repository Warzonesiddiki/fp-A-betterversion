import { describe, it, expect, vi } from 'vitest';
import { MemoryMonitor } from '../memoryMonitor';

describe('MemoryMonitor', () => {
  it('starts and stops without error', () => {
    const monitor = new MemoryMonitor(64, 1);
    monitor.start();
    monitor.stop();
  });

  it('getHeapUsage returns zeros without performance', () => {
    const monitor = new MemoryMonitor();
    const usage = monitor.getHeapUsage();
    expect(usage.used).toBe(0);
    expect(usage.total).toBe(0);
    expect(usage.percentage).toBe(0);
  });

  it('isUnderLimit returns true when no memory api', () => {
    const monitor = new MemoryMonitor();
    expect(monitor.isUnderLimit()).toBe(true);
  });

  it('trackStore and touchStore work', () => {
    const monitor = new MemoryMonitor();
    monitor.trackStore('test', 1024);
    monitor.touchStore('test');
    expect(monitor.getEvictedStores()).toHaveLength(0);
  });

  it('evictCold returns empty array with no stores', async () => {
    const monitor = new MemoryMonitor();
    const evicted = await monitor.evictCold();
    expect(evicted).toEqual([]);
  });

  it('forceCleanup does not throw', async () => {
    const monitor = new MemoryMonitor();
    await monitor.forceCleanup();
  });
});
