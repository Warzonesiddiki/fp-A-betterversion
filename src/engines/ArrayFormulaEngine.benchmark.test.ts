import { describe, it } from 'vitest';
import { ArrayFormulaEngine } from './ArrayFormulaEngine';

describe('ArrayFormulaEngine Benchmark', () => {
  it('benchmarks MMULT with 1M operations (cumulative)', () => {
    const data = [
      [1, 2],
      [3, 4],
    ];
    const startTime = Date.now();

    // 1M operations doesn't necessarily mean 1M full matrix mults if they are large
    // But for 2x2, we can do many.
    const iterations = 250000; // 250k * 4 cells = 1M operations

    for (let i = 0; i < iterations; i++) {
      ArrayFormulaEngine.evaluate('MMULT()', data, 2, 2);
    }

    const duration = Date.now() - startTime;
    console.log(`[PERF] ArrayFormulaEngine MMULT 2x2 (${iterations} iterations): ${duration}ms`);
  });

  it('benchmarks UNIQUE with 10k rows', () => {
    const data: number[][] = [];
    for (let i = 0; i < 10000; i++) {
      data.push([i % 100, i % 50]);
    }

    const startTime = Date.now();
    ArrayFormulaEngine.evaluate('UNIQUE()', data, 10000, 2);
    const duration = Date.now() - startTime;

    console.log(`[PERF] ArrayFormulaEngine UNIQUE 10k rows: ${duration}ms`);
  });
});
