import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceMonitor } from '../performanceMonitor';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    PerformanceMonitor.clear();
  });

  it('time executes and records metric', () => {
    const result = PerformanceMonitor.time('test-op', 'engine', () => 42);
    expect(result).toBe(42);
  });

  it('timeAsync executes and records metric', async () => {
    const result = await PerformanceMonitor.timeAsync('test-async', 'engine', async () => 42);
    expect(result).toBe(42);
  });

  it('getReport returns summary', () => {
    PerformanceMonitor.time('test-op', 'engine', () => 1);
    const report = PerformanceMonitor.getReport();
    expect(report.summary).toHaveLength(1);
    expect(report.generatedAt).toBeGreaterThan(0);
  });

  it('clear resets metrics', () => {
    PerformanceMonitor.time('test-op', 'engine', () => 1);
    PerformanceMonitor.clear();
    expect(PerformanceMonitor.getReport().summary).toHaveLength(0);
  });

  it('setThreshold adds custom threshold', () => {
    PerformanceMonitor.setThreshold('custom-op', 100);
  });
});
