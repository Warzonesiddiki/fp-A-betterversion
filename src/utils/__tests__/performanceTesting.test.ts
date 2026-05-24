import { describe, it, expect, vi } from 'vitest';
import { PerformanceTesting } from '../performanceTesting';

describe('PerformanceTesting', () => {
  it('benchmark runs function and returns results', async () => {
    const result = await PerformanceTesting.benchmark('test', () => {}, 5);
    expect(result.name).toBe('test');
    expect(result.iterations).toBe(5);
    expect(result.avgTime).toBeGreaterThanOrEqual(0);
    expect(result.minTime).toBeGreaterThanOrEqual(0);
    expect(result.maxTime).toBeGreaterThanOrEqual(0);
  });

  it('checkBudget compares against threshold', () => {
    const result = PerformanceTesting.checkBudget(
      {
        name: 't',
        iterations: 1,
        totalTime: 10,
        avgTime: 10,
        minTime: 10,
        maxTime: 10,
        p95Time: 10,
        p99Time: 10,
      },
      20
    );
    expect(result.pass).toBe(true);
    expect(result.ratio).toBe(0.5);
  });

  it('checkBudget fails when over threshold', () => {
    const result = PerformanceTesting.checkBudget(
      {
        name: 't',
        iterations: 1,
        totalTime: 30,
        avgTime: 30,
        minTime: 30,
        maxTime: 30,
        p95Time: 30,
        p99Time: 30,
      },
      20
    );
    expect(result.pass).toBe(false);
    expect(result.ratio).toBe(1.5);
  });

  it('printResults does not throw', () => {
    expect(() =>
      PerformanceTesting.printResults([
        {
          name: 't',
          iterations: 1,
          totalTime: 10,
          avgTime: 10,
          minTime: 10,
          maxTime: 10,
          p95Time: 10,
          p99Time: 10,
        },
      ])
    ).not.toThrow();
  });
});
