import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceBudget } from '../performanceBudget';

describe('PerformanceBudget', () => {
  beforeEach(() => {
    PerformanceBudget.clear();
  });

  it('markStart and markEnd track duration', () => {
    PerformanceBudget.markStart('test-op', 'engine');
    const duration = PerformanceBudget.markEnd('test-op');
    expect(duration).toBeGreaterThanOrEqual(0);
  });

  it('markEnd returns 0 for unknown mark', () => {
    expect(PerformanceBudget.markEnd('unknown')).toBe(0);
  });

  it('time executes and times function', () => {
    const result = PerformanceBudget.time('sync-op', () => 42);
    expect(result).toBe(42);
  });

  it('timeAsync executes and times async function', async () => {
    const result = await PerformanceBudget.timeAsync('async-op', async () => 42);
    expect(result).toBe(42);
  });

  it('checkStartupTime returns result', () => {
    const result = PerformanceBudget.checkStartupTime();
    expect(result.pass).toBe(true);
    expect(result.budget).toBeGreaterThan(0);
  });

  it('checkCalculationTime returns result', () => {
    const result = PerformanceBudget.checkCalculationTime('test');
    expect(result.pass).toBe(true);
    expect(result.budget).toBeGreaterThan(0);
  });

  it('checkMemory returns result', () => {
    const result = PerformanceBudget.checkMemory();
    expect(result.budget).toBeGreaterThan(0);
  });

  it('setBudgets updates thresholds', () => {
    PerformanceBudget.setBudgets({ startupTimeMs: 10000 });
    const result = PerformanceBudget.checkStartupTime();
    expect(result.budget).toBe(10000);
  });

  it('getReport returns full report', () => {
    PerformanceBudget.markStart('app.test', 'startup');
    PerformanceBudget.markEnd('app.test');
    const report = PerformanceBudget.getReport();
    expect(report.startup).toBeDefined();
    expect(report.memory).toBeDefined();
    expect(report.recentMarks).toBeDefined();
    expect(report.categoryBreakdown).toBeDefined();
    expect(report.violations).toBeDefined();
  });

  it('clear resets all marks', () => {
    PerformanceBudget.markStart('test');
    PerformanceBudget.markEnd('test');
    PerformanceBudget.clear();
    const report = PerformanceBudget.getReport();
    expect(report.recentMarks).toHaveLength(0);
  });
});
