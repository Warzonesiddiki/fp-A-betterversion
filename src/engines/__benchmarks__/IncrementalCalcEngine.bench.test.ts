/**
 * IncrementalCalcEngine Benchmark Suite
 *
 * "Feelings don't benchmark. Numbers do."
 *
 * Tests the dependency graph, dirty-cell tracking, topological sort,
 * and incremental recalculation at scales from 1K to 1M cells.
 *
 * Run: npx vitest run src/engines/__benchmarks__/IncrementalCalcEngine.bench.test.ts
 *
 * NOTE: Thresholds are set to CURRENT measured performance.
 *       See reports/calc-benchmarks.md for target vs actual analysis.
 */
import { describe, it, expect } from 'vitest';
import { IncrementalCalcEngine, type CellIdentifier } from '../IncrementalCalcEngine';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cell(col: string, row: number): CellIdentifier {
  return { sheet: 'Sheet1', col, row };
}

function colLetters(index: number): string {
  let s = '';
  let n = index;
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

function fmtBytes(bytes: number): string {
  if (Math.abs(bytes) < 1024) return `${bytes} B`;
  if (Math.abs(bytes) < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtMs(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)} us`;
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

// ---------------------------------------------------------------------------
// Grid builders
// ---------------------------------------------------------------------------

interface GridSetup {
  engine: IncrementalCalcEngine;
  values: Map<string, number>;
  cellIds: CellIdentifier[];
}

/** Linear chain: A1 <- A2 <- A3 <- ... <- AN */
function buildLinearChain(n: number): GridSetup {
  const engine = new IncrementalCalcEngine({ enableBatching: false });
  const values = new Map<string, number>();
  const cellIds: CellIdentifier[] = [];

  for (let i = 0; i < n; i++) {
    const c = cell('A', i + 1);
    cellIds.push(c);
    values.set(`${c.sheet}!${c.col}${c.row}`, i + 1);
  }

  for (let i = 1; i < n; i++) {
    engine.setDependencies(cellIds[i]!, [cellIds[i - 1]]);
  }

  return { engine, values, cellIds };
}

/** Wide grid: each row has a SUM cell depending on `cols` data cells. */
function buildWideGrid(rows: number, cols: number): GridSetup {
  const engine = new IncrementalCalcEngine({ enableBatching: false });
  const values = new Map<string, number>();
  const cellIds: CellIdentifier[] = [];

  for (let r = 1; r <= rows; r++) {
    const sumCell = cell('SUM', r);
    cellIds.push(sumCell);
    values.set(`${sumCell.sheet}!${sumCell.col}${sumCell.row}`, r * cols);

    const deps: CellIdentifier[] = [];
    for (let c = 0; c < cols; c++) {
      const colName = colLetters(c);
      const dataCell = cell(colName, r);
      cellIds.push(dataCell);
      values.set(`${dataCell.sheet}!${dataCell.col}${dataCell.row}`, r);
      deps.push(dataCell);
    }
    engine.setDependencies(sumCell, deps);
  }

  return { engine, values, cellIds };
}

/** Build standard getCellValue / setCellValue / evaluateFormula callbacks. */
function makeCallbacks(values: Map<string, number>) {
  const getCellValue = (c: CellIdentifier): number => {
    return values.get(`${c.sheet}!${c.col}${c.row}`) ?? 0;
  };
  const setCellValue = (c: CellIdentifier, v: number) => {
    values.set(`${c.sheet}!${c.col}${c.row}`, v);
  };
  const evaluateFormula = () => 42; // constant — converges in 1 iteration
  return { getCellValue, setCellValue, evaluateFormula };
}

// ============================================================================
// BENCHMARKS
// ============================================================================

describe('IncrementalCalcEngine - Mark Dirty', () => {
  it('markDirty 1K cells < 10ms', { timeout: 15000 }, () => {
    const { engine, cellIds } = buildLinearChain(1000);
    const start = performance.now();
    for (const c of cellIds) engine.markDirty(c);
    const elapsed = performance.now() - start;
    console.log(`  markDirty 1K: ${fmtMs(elapsed)}`);
    expect(elapsed).toBeLessThan(10);
  });

  it('markDirty 10K cells < 100ms', { timeout: 15000 }, () => {
    const { engine, cellIds } = buildLinearChain(10_000);
    const start = performance.now();
    for (const c of cellIds) engine.markDirty(c);
    const elapsed = performance.now() - start;
    console.log(`  markDirty 10K: ${fmtMs(elapsed)}`);
    expect(elapsed).toBeLessThan(100);
  });

  it('markDirty 100K cells < 2000ms', { timeout: 30000 }, () => {
    const { engine, cellIds } = buildLinearChain(100_000);
    const start = performance.now();
    for (const c of cellIds) engine.markDirty(c);
    const elapsed = performance.now() - start;
    console.log(`  markDirty 100K: ${fmtMs(elapsed)}`);
    expect(elapsed).toBeLessThan(2000);
  });

  it('markRangeDirty 1M cells < 20000ms', { timeout: 60000 }, () => {
    const { engine, cellIds } = buildLinearChain(1_000_000);
    const start = performance.now();
    engine.markRangeDirty(cellIds);
    const elapsed = performance.now() - start;
    console.log(`  markRangeDirty 1M: ${fmtMs(elapsed)}`);
    expect(elapsed).toBeLessThan(20000);
  });
});

describe('IncrementalCalcEngine - Dependency Graph Setup', () => {
  it('setDependencies 1K cells < 20ms', { timeout: 15000 }, () => {
    const engine = new IncrementalCalcEngine();
    const ids: CellIdentifier[] = [];
    for (let i = 0; i < 1000; i++) ids.push(cell('A', i + 1));
    const start = performance.now();
    for (let i = 1; i < ids.length; i++) engine.setDependencies(ids[i]!, [ids[i - 1]]);
    const elapsed = performance.now() - start;
    console.log(`  setDependencies 1K: ${fmtMs(elapsed)}`);
    expect(elapsed).toBeLessThan(20);
  });

  it('setDependencies 100K cells < 5000ms', { timeout: 30000 }, () => {
    const engine = new IncrementalCalcEngine();
    const ids: CellIdentifier[] = [];
    for (let i = 0; i < 100_000; i++) ids.push(cell('A', i + 1));
    const start = performance.now();
    for (let i = 1; i < ids.length; i++) engine.setDependencies(ids[i]!, [ids[i - 1]]);
    const elapsed = performance.now() - start;
    console.log(`  setDependencies 100K: ${fmtMs(elapsed)}`);
    expect(elapsed).toBeLessThan(5000);
  });

  it('setDependencies 1M cells < 30000ms', { timeout: 60000 }, () => {
    const engine = new IncrementalCalcEngine();
    const ids: CellIdentifier[] = [];
    for (let i = 0; i < 1_000_000; i++) ids.push(cell('A', i + 1));
    const start = performance.now();
    for (let i = 1; i < ids.length; i++) engine.setDependencies(ids[i]!, [ids[i - 1]]);
    const elapsed = performance.now() - start;
    console.log(`  setDependencies 1M: ${fmtMs(elapsed)}`);
    expect(elapsed).toBeLessThan(30000);
  });
});

describe('IncrementalCalcEngine - getAffectedCells BFS', () => {
  it('getAffectedCells from leaf of 1K chain < 500ms', { timeout: 15000 }, () => {
    const { engine, cellIds } = buildLinearChain(1000);
    const start = performance.now();
    const affected = engine.getAffectedCells(cellIds[0]!);
    const elapsed = performance.now() - start;
    console.log(`  getAffectedCells 1K: ${fmtMs(elapsed)}, affected=${affected.length}`);
    expect(affected.length).toBe(999);
    expect(elapsed).toBeLessThan(500);
  });

  it('getAffectedCells from leaf of 10K chain < 500ms', { timeout: 15000 }, () => {
    const { engine, cellIds } = buildLinearChain(10_000);
    const start = performance.now();
    const affected = engine.getAffectedCells(cellIds[0]!);
    const elapsed = performance.now() - start;
    console.log(`  getAffectedCells 10K: ${fmtMs(elapsed)}, affected=${affected.length}`);
    expect(affected.length).toBe(9999);
    expect(elapsed).toBeLessThan(500);
  });

  it('getAffectedCells from leaf of 100K chain < 5000ms', { timeout: 30000 }, () => {
    const { engine, cellIds } = buildLinearChain(100_000);
    const start = performance.now();
    const affected = engine.getAffectedCells(cellIds[0]!);
    const elapsed = performance.now() - start;
    console.log(`  getAffectedCells 100K: ${fmtMs(elapsed)}, affected=${affected.length}`);
    expect(affected.length).toBe(99_999);
    expect(elapsed).toBeLessThan(5000);
  });
});

describe('IncrementalCalcEngine - calculateIncremental', () => {
  function benchCalculate(n: number, maxMs: number) {
    it(
      `calculateIncremental ${n.toLocaleString()} cells (1 dirty) < ${fmtMs(maxMs)}`,
      { timeout: Math.max(maxMs * 3, 30000) },
      () => {
        const { engine, values, cellIds } = buildLinearChain(n);
        engine.markDirty(cellIds[0]!);
        const { getCellValue, setCellValue, evaluateFormula } = makeCallbacks(values);

        const start = performance.now();
        const result = engine.calculateIncremental(getCellValue, setCellValue, evaluateFormula);
        const elapsed = performance.now() - start;

        console.log(
          `  calc ${n.toLocaleString()}: ${fmtMs(elapsed)}, ` +
            `affected=${result.affectedCells.length}, iterations=${result.iterationCount}`
        );
        expect(elapsed).toBeLessThan(maxMs);
      }
    );
  }

  benchCalculate(1_000, 2000); // JIT warmup makes first run slow
  benchCalculate(10_000, 2000);
  benchCalculate(100_000, 15000);
});

describe('IncrementalCalcEngine - Worst Case (all dirty)', () => {
  function benchAllDirty(n: number, maxMs: number) {
    it(
      `all ${n.toLocaleString()} cells dirty < ${fmtMs(maxMs)}`,
      { timeout: Math.max(maxMs * 3, 60000) },
      () => {
        const { engine, values, cellIds } = buildLinearChain(n);
        for (const c of cellIds) engine.markDirty(c);
        const { getCellValue, setCellValue, evaluateFormula } = makeCallbacks(values);

        const start = performance.now();
        const result = engine.calculateIncremental(getCellValue, setCellValue, evaluateFormula);
        const elapsed = performance.now() - start;

        console.log(
          `  allDirty ${n.toLocaleString()}: ${fmtMs(elapsed)}, ` +
            `affected=${result.affectedCells.length}, iterations=${result.iterationCount}`
        );
        expect(elapsed).toBeLessThan(maxMs);
      }
    );
  }

  // Measured: 1K=581ms, 10K=67s. Thresholds set generously for CI.
  benchAllDirty(1_000, 5000);
  benchAllDirty(10_000, 300_000);
  // 100K and 1M are TOO SLOW to run in CI. Commented out.
  // benchAllDirty(100_000, ???);  // estimated: ~hours
  // benchAllDirty(1_000_000, ???); // estimated: ~days
});

describe('IncrementalCalcEngine - Chain Depth Impact', () => {
  const depths = [10, 100, 1000, 10_000];

  for (const depth of depths) {
    const maxMs = depth <= 100 ? 500 : depth <= 1000 ? 2000 : 15000;
    it(
      `chain depth ${depth.toLocaleString()}: recalc from root`,
      { timeout: Math.max(maxMs * 3, 30000) },
      () => {
        const { engine, values, cellIds } = buildLinearChain(depth);
        engine.markDirty(cellIds[0]!);
        const { getCellValue, setCellValue, evaluateFormula } = makeCallbacks(values);

        const start = performance.now();
        const result = engine.calculateIncremental(getCellValue, setCellValue, evaluateFormula);
        const elapsed = performance.now() - start;

        console.log(`  depth ${depth}: ${fmtMs(elapsed)}, affected=${result.affectedCells.length}`);
        expect(elapsed).toBeLessThan(maxMs);
      }
    );
  }
});

describe('IncrementalCalcEngine - Wide Fan-Out', () => {
  it('100 rows x 100 cols (10K cells) < 2000ms', { timeout: 30000 }, () => {
    const { engine, values, cellIds } = buildWideGrid(100, 100);
    const sumCells = cellIds.filter((c) => c.col === 'SUM');
    for (const c of sumCells) engine.markDirty(c);
    const { getCellValue, setCellValue, evaluateFormula } = makeCallbacks(values);

    const start = performance.now();
    engine.calculateIncremental(getCellValue, setCellValue, evaluateFormula);
    const elapsed = performance.now() - start;
    console.log(`  wide 100x100: ${fmtMs(elapsed)}`);
    expect(elapsed).toBeLessThan(2000);
  });
});

describe('IncrementalCalcEngine - Memory Usage', () => {
  function measureMemory(n: number) {
    it(`memory for ${n.toLocaleString()} cells`, { timeout: 60000 }, () => {
      const heapBefore = process.memoryUsage().heapUsed;
      const { engine } = buildLinearChain(n);
      const heapAfter = process.memoryUsage().heapUsed;
      const delta = heapAfter - heapBefore;
      const perCell = delta / n;

      console.log(
        `  Memory ${n.toLocaleString()}: ${fmtBytes(delta)} total, ${fmtBytes(perCell)}/cell`
      );
      console.log(`  Dependencies: ${engine.getDependencyCount().toLocaleString()}`);
      expect(perCell).toBeLessThan(2048);
    });
  }

  measureMemory(1_000);
  measureMemory(10_000);
  measureMemory(100_000);
  measureMemory(1_000_000);
});

describe('IncrementalCalcEngine - Dirty Tracking Overhead', () => {
  it('dirty tracking overhead for 100K cells', { timeout: 30000 }, () => {
    const engine = new IncrementalCalcEngine({ enableBatching: false });
    const ids: CellIdentifier[] = [];
    for (let i = 0; i < 100_000; i++) ids.push(cell('A', i + 1));

    const markStart = performance.now();
    for (const c of ids) engine.markDirty(c);
    const markElapsed = performance.now() - markStart;

    const countStart = performance.now();
    const count = engine.getDirtyCellCount();
    const countElapsed = performance.now() - countStart;

    const clearStart = performance.now();
    engine.clearDirty();
    const clearElapsed = performance.now() - clearStart;

    console.log(`  Mark 100K dirty: ${fmtMs(markElapsed)}`);
    console.log(`  getDirtyCellCount: ${fmtMs(countElapsed)} (count=${count})`);
    console.log(`  clearDirty: ${fmtMs(clearElapsed)}`);
    expect(count).toBe(100_000);
  });
});

describe('IncrementalCalcEngine - Convergence Iterations', () => {
  it('maxIterations=100 with non-converging formula (1K cells)', { timeout: 60000 }, () => {
    const maxIter = 100;
    const n = 1000;
    const engine = new IncrementalCalcEngine({
      enableBatching: false,
      maxIterations: maxIter,
      convergenceThreshold: 1e-10,
    });

    const ids: CellIdentifier[] = [];
    const values = new Map<string, number>();
    for (let i = 0; i < n; i++) {
      const c = cell('A', i + 1);
      ids.push(c);
      values.set(`${c.sheet}!${c.col}${c.row}`, 0);
    }
    for (let i = 1; i < n; i++) engine.setDependencies(ids[i]!, [ids[i - 1]]);
    for (const c of ids) engine.markDirty(c);

    let callCount = 0;
    const getCellValue = (c: CellIdentifier): number =>
      values.get(`${c.sheet}!${c.col}${c.row}`) ?? 0;
    const setCellValue = (c: CellIdentifier, v: number) =>
      values.set(`${c.sheet}!${c.col}${c.row}`, v);
    const evaluateFormula = (c: CellIdentifier): number => {
      callCount++;
      return (values.get(`${c.sheet}!${c.col}${c.row}`) ?? 0) + 0.5;
    };

    const start = performance.now();
    const result = engine.calculateIncremental(getCellValue, setCellValue, evaluateFormula);
    const elapsed = performance.now() - start;

    console.log(
      `  Non-converging ${n}: ${fmtMs(elapsed)}, ` +
        `iterations=${result.iterationCount}, formulaCalls=${callCount}`
    );
    expect(result.iterationCount).toBe(maxIter);
    expect(callCount).toBe(n * maxIter);
  });
});

describe('IncrementalCalcEngine - processBatch Analysis', () => {
  it('processBatch is a stub (dirtyCells not cleared)', { timeout: 15000 }, () => {
    const engine = new IncrementalCalcEngine({ enableBatching: true, batchSize: 100 });
    const ids: CellIdentifier[] = [];
    for (let i = 0; i < 500; i++) ids.push(cell('A', i + 1));

    for (const c of ids) engine.markDirty(c);

    // processBatch() only clears batchQueue, NOT dirtyCells.
    // All 500 cells remain dirty even after 5 batch triggers.
    expect(engine.getDirtyCellCount()).toBe(500);
  });
});

describe('IncrementalCalcEngine - Scaling Summary', () => {
  it('prints scaling summary table', { timeout: 120000 }, () => {
    const sizes = [1_000, 10_000, 100_000];
    const results: Array<{ n: number; setupMs: number; calcMs: number }> = [];

    for (const n of sizes) {
      const setupStart = performance.now();
      const { engine, values, cellIds } = buildLinearChain(n);
      const setupMs = performance.now() - setupStart;

      // Use 1 dirty cell for consistent comparison
      engine.markDirty(cellIds[0]!);
      const { getCellValue, setCellValue, evaluateFormula } = makeCallbacks(values);

      const calcStart = performance.now();
      engine.calculateIncremental(getCellValue, setCellValue, evaluateFormula);
      const calcMs = performance.now() - calcStart;

      results.push({ n, setupMs, calcMs });
    }

    console.log('\n  === SCALING SUMMARY (1 dirty cell) ===');
    console.log('  Cells      | Setup     | Calc');
    console.log('  -----------|-----------|--------');
    for (const r of results) {
      console.log(
        `  ${r.n.toLocaleString().padStart(10)} | ${fmtMs(r.setupMs).padStart(9)} | ${fmtMs(r.calcMs).padStart(9)}`
      );
    }
  });
});
