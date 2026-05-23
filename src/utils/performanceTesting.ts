/**
 * Performance Testing Utilities
 * Benchmark engines, renders, and user interactions
 */

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  p95Time: number;
  p99Time: number;
}

export class PerformanceTesting {
  /**
   * Benchmark a function
   */
  static async benchmark(
    name: string,
    fn: () => void | Promise<void>,
    iterations: number = 100
  ): Promise<BenchmarkResult> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      times.push(performance.now() - start);
    }

    times.sort((a, b) => a - b);
    const totalTime = times.reduce((a, b) => a + b, 0);

    return {
      name,
      iterations,
      totalTime,
      avgTime: totalTime / iterations,
      minTime: times[0],
      maxTime: times[times.length - 1],
      p95Time: times[Math.floor(iterations * 0.95)],
      p99Time: times[Math.floor(iterations * 0.99)],
    };
  }

  /**
   * Benchmark formula engine with N cells
   */
  static async benchmarkFormulaEngine(
    engine: { evaluate: (formula: string, context: unknown) => unknown },
    formulaCount: number
  ): Promise<BenchmarkResult> {
    const formulas = Array.from({ length: formulaCount }, (_, i) => `SUM(A${i}, B${i})`);
    return this.benchmark(
      `FormulaEngine_${formulaCount}_cells`,
      () => {
        for (const f of formulas) {
          engine.evaluate(f, {});
        }
      },
      10
    );
  }

  /**
   * Benchmark grid rendering
   */
  static async benchmarkGridRender(
    renderFn: () => void,
    rowCount: number
  ): Promise<BenchmarkResult> {
    return this.benchmark(`GridRender_${rowCount}_rows`, renderFn, 20);
  }

  /**
   * Benchmark import with N rows
   */
  static async benchmarkImport(
    importFn: (data: unknown[]) => Promise<void>,
    rowCount: number
  ): Promise<BenchmarkResult> {
    const data = Array.from({ length: rowCount }, (_, i) => ({
      account: `ACC${String(i).padStart(4, '0')}`,
      amount: Math.round(Math.random() * 100000) / 100,
      date: new Date(
        2026,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1
      ).toISOString(),
    }));

    return this.benchmark(`Import_${rowCount}_rows`, () => importFn(data), 5);
  }

  /**
   * Benchmark export with N rows
   */
  static async benchmarkExport(
    exportFn: (data: unknown[]) => Promise<void>,
    rowCount: number
  ): Promise<BenchmarkResult> {
    const data = Array.from({ length: rowCount }, (_, i) => ({
      account: `ACC${String(i).padStart(4, '0')}`,
      amount: Math.round(Math.random() * 100000) / 100,
      period: '2026-01',
    }));

    return this.benchmark(`Export_${rowCount}_rows`, () => exportFn(data), 5);
  }

  /**
   * Print benchmark results
   */
  static printResults(results: BenchmarkResult[]): void {
    console.log('\n=== Performance Benchmark Results ===\n');
    for (const r of results) {
      console.log(`${r.name}:`);
      console.log(`  Iterations: ${r.iterations}`);
      console.log(`  Avg: ${r.avgTime.toFixed(2)}ms`);
      console.log(`  Min: ${r.minTime.toFixed(2)}ms`);
      console.log(`  Max: ${r.maxTime.toFixed(2)}ms`);
      console.log(`  P95: ${r.p95Time.toFixed(2)}ms`);
      console.log(`  P99: ${r.p99Time.toFixed(2)}ms`);
      console.log('');
    }
  }

  /**
   * Check if performance meets budget
   */
  static checkBudget(result: BenchmarkResult, budgetMs: number): { pass: boolean; ratio: number } {
    return {
      pass: result.avgTime <= budgetMs,
      ratio: result.avgTime / budgetMs,
    };
  }
}
