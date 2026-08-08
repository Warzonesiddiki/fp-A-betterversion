/**
 * Phase 6 — Large Grid Keyboard Responsiveness (5,000+ rows).
 *
 * Gate: keyboard navigation over a 5,000-row grid must stay within a
 * ≤100ms per-interaction budget. In DataGrid the synchronous work per
 * keystroke is ExcelKeyboardEngine.handleKey (AG Grid virtualizes the
 * actual paint), so that path must remain O(1) in row count.
 *
 * Falsifiability: if handleKey ever scans rows (O(n) regression — e.g.
 * someone walks all rows to find the next focusable cell), the full-grid
 * traversal below blows through the budget and this suite fails.
 */
import { describe, it, expect } from 'vitest';
import { ExcelKeyboardEngine, type GridContext } from '@/engines/ExcelKeyboardEngine';

const ROWS = 5_000;
const COLS = 25;

function makeContext(row: number, col: number): GridContext {
  return {
    selectedCell: { row, col },
    selectedRange: { start: { row, col }, end: { row, col } },
    activeRow: row,
    activeCol: col,
    totalRows: ROWS,
    totalCols: COLS,
    isEditing: false,
  };
}

const NO_MODS = { ctrl: false, shift: false, alt: false };

/**
 * Median-of-N wall-clock sample to reject scheduler jitter without being
 * overly sensitive to single outlier runs (best-of-N can still be skewed by
 * warm-up cost on cold V8 tiers in sandboxed CI environments).
 */
function medianOf(samples: number, fn: () => void): number {
  const runs: number[] = [];
  for (let i = 0; i < samples; i++) {
    const start = performance.now();
    fn();
    runs.push(performance.now() - start);
  }
  runs.sort((a, b) => a - b);
  return runs[Math.floor(runs.length / 2)];
}

/**
 * Wall-clock budget for 5,000 keystrokes' worth of synchronous work.
 *
 * In isolated micro-benchmarks handleKey is well under 100ms for the full
 * sweep, but under Vitest's worker pool + jsdom environment + coverage
 * instrumentation (when enabled) wall time inflates materially. We use
 * a 250ms budget here so correctness is still exercised and true O(n)
 * regressions (which would take many seconds) are still caught, while
 * avoiding flakiness from scheduler jitter in sandboxed CI.
 */
const WALL_BUDGET_MS = 250;

describe('DataGrid keyboard navigation performance (5,000 rows)', () => {
  it('traverses all 5,000 rows via ArrowDown within budget', () => {
    // Warm-up (JIT).
    ExcelKeyboardEngine.handleKey('ArrowDown', NO_MODS, makeContext(0, 0));

    let finalRow = -1;
    const elapsed = medianOf(5, () => {
      let row = 0;
      for (let i = 0; i < ROWS; i++) {
        const action = ExcelKeyboardEngine.handleKey('ArrowDown', NO_MODS, makeContext(row, 3));
        expect(action.type).toBe('move');
        row = (action.payload as { row: number; col: number }).row;
      }
      finalRow = row;
    });

    // Correctness: traversal clamps at the last row, never overflows.
    expect(finalRow).toBe(ROWS - 1);
    // Budget: 5,000 keystrokes' worth of synchronous work stays well under
    // the 100ms per-interaction budget headroom (≤0.02ms per keystroke
    // nominally; wider tolerance under coverage instrumentation).
    expect(elapsed).toBeLessThan(WALL_BUDGET_MS);
  });

  it('single keystroke at the bottom of a 5,000-row grid stays O(1)', () => {
    ExcelKeyboardEngine.handleKey('ArrowUp', NO_MODS, makeContext(ROWS - 1, COLS - 1));

    const atTop = medianOf(5, () => {
      for (let i = 0; i < 1_000; i++) {
        ExcelKeyboardEngine.handleKey('ArrowDown', NO_MODS, makeContext(0, 0));
      }
    });
    const atBottom = medianOf(5, () => {
      for (let i = 0; i < 1_000; i++) {
        ExcelKeyboardEngine.handleKey('ArrowUp', NO_MODS, makeContext(ROWS - 1, COLS - 1));
      }
    });

    // Position-independence: cost at row 4,999 must not exceed the budget
    // any more than at row 0 (an O(row) scan would show up here).
    expect(atTop).toBeLessThan(WALL_BUDGET_MS);
    expect(atBottom).toBeLessThan(WALL_BUDGET_MS);
  });

  it('Home/End jumps and Tab walking stay within budget and clamp correctly', () => {
    const elapsed = medianOf(5, () => {
      for (let i = 0; i < 1_000; i++) {
        const home = ExcelKeyboardEngine.handleKey('Home', NO_MODS, makeContext(2_500, 20));
        expect((home.payload as { col: number }).col).toBe(0);
        const end = ExcelKeyboardEngine.handleKey('End', NO_MODS, makeContext(2_500, 0));
        expect((end.payload as { col: number }).col).toBe(COLS - 1);
        const tab = ExcelKeyboardEngine.handleKey('Tab', NO_MODS, makeContext(2_500, COLS - 1));
        // Tab clamps at last column — no wrap into a phantom column.
        expect((tab.payload as { col: number }).col).toBe(COLS - 1);
      }
    });
    expect(elapsed).toBeLessThan(WALL_BUDGET_MS);
  });

  it('shift-selection over the large grid does not degrade', () => {
    const elapsed = medianOf(5, () => {
      let row = 0;
      for (let i = 0; i < ROWS; i++) {
        const action = ExcelKeyboardEngine.handleKey(
          'ArrowDown',
          { ctrl: false, shift: true, alt: false },
          makeContext(row, 5)
        );
        expect(action.type).toBe('select');
        row = (action.payload as { row: number }).row;
      }
      expect(row).toBe(ROWS - 1);
    });
    expect(elapsed).toBeLessThan(WALL_BUDGET_MS);
  });
});
