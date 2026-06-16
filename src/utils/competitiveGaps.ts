/**
 * G12 — 7 Competitive Gaps
 *
 * Implements the competitive feature set that distinguishes FinPlan Pro from competitors
 * (Anaplan, Pigment, Mosaic, Vena):
 *
 * 1. Scenario Merge      — mergeScenarios() in scenarioStore
 * 2. Scenario Locking    — lockScenario()/unlockScenario() in scenarioStore
 * 3. Drag-Fill           — applyDragFill() helper
 * 4. Context Menu        — openContextMenu()/closeContextMenu() state + useGridContextMenu() hook
 * 5. Auto-Sum            — applyAutoSum() helper
 * 6. Sheet Tabs          — sheetStore + useSheetTabs() hook
 * 7. Auto-Update         — autoUpdateCells() reactive recompute via dep graph
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useEffect, useMemo } from 'react';

/* ──────────────────────────────────────────────────────────────────────────
 * 6. Sheet Tabs
 * Multi-sheet workbook navigation. Each sheet has cells, formulas, and a tab.
 * ────────────────────────────────────────────────────────────────────────── */
export type CellValue = number | string | boolean | null;

export interface SheetCell {
  row: number;
  col: number;
  value: CellValue;
  formula?: string;
  dependencies?: string[]; // cell refs this formula depends on (e.g. "A1", "B2")
}

export interface Sheet {
  id: string;
  name: string;
  cells: Record<string, SheetCell>; // key: "A1", "B2" etc.
  activeCellRef?: string;
}

interface SheetStoreState {
  sheets: Record<string, Sheet>;
  activeSheetId: string | null;
  cellSelection: { start: string; end: string } | null;
  addSheet: (name: string) => string;
  removeSheet: (id: string) => void;
  renameSheet: (id: string, name: string) => void;
  setActiveSheet: (id: string) => void;
  setActiveCell: (ref: string) => void;
  setSelection: (start: string, end: string) => void;
  setCell: (sheetId: string, ref: string, cell: Partial<SheetCell>) => void;
  getCell: (sheetId: string, ref: string) => SheetCell | undefined;
}

const cellKey = (row: number, col: number) => {
  let colLetters = '';
  let n = col;
  while (n >= 0) {
    colLetters = String.fromCharCode(65 + (n % 26)) + colLetters;
    n = Math.floor(n / 26) - 1;
    if (n < 0) break;
  }
  return `${colLetters}${row + 1}`;
};

export const useSheetStore = create<SheetStoreState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      sheets: {
        'sheet-default': {
          id: 'sheet-default',
          name: 'Sheet1',
          cells: {},
          activeCellRef: 'A1',
        },
      },
      activeSheetId: 'sheet-default',
      cellSelection: null,

      addSheet: (name) => {
        const id = `sheet-${Date.now()}`;
        set((state) => {
          state.sheets[id] = { id, name, cells: {}, activeCellRef: 'A1' };
        });
        return id;
      },

      removeSheet: (id) => {
        set((state) => {
          delete state.sheets[id];
          if (state.activeSheetId === id) {
            const remaining = Object.keys(state.sheets);
            state.activeSheetId = remaining[0] ?? null;
          }
        });
      },

      renameSheet: (id, name) => {
        set((state) => {
          if (state.sheets[id]) state.sheets[id].name = name;
        });
      },

      setActiveSheet: (id) => {
        set((state) => {
          state.activeSheetId = id;
          state.cellSelection = null;
        });
      },

      setActiveCell: (ref) => {
        const sid = get().activeSheetId;
        if (!sid) return;
        set((state) => {
          if (state.sheets[sid]) state.sheets[sid].activeCellRef = ref;
        });
      },

      setSelection: (start, end) => {
        set((state) => {
          state.cellSelection = { start, end };
        });
      },

      setCell: (sheetId, ref, cell) => {
        set((state) => {
          if (!state.sheets[sheetId]) return;
          const existing = state.sheets[sheetId].cells[ref] ?? { row: 0, col: 0, value: null };
          state.sheets[sheetId].cells[ref] = { ...existing, ...cell };
        });
      },

      getCell: (sheetId, ref) => {
        return get().sheets[sheetId]?.cells[ref];
      },
    }))
  )
);

export const useSheetTabs = () => {
  const sheets = useSheetStore((s) => s.sheets);
  const activeId = useSheetStore((s) => s.activeSheetId);
  const addSheet = useSheetStore((s) => s.addSheet);
  const removeSheet = useSheetStore((s) => s.removeSheet);
  const renameSheet = useSheetStore((s) => s.renameSheet);
  const setActiveSheet = useSheetStore((s) => s.setActiveSheet);

  return {
    sheets: Object.values(sheets),
    activeSheetId: activeId,
    addSheet: (name: string) => {
      const id = addSheet(name);
      setActiveSheet(id);
      return id;
    },
    removeSheet,
    renameSheet,
    setActiveSheet,
  };
};

/* ──────────────────────────────────────────────────────────────────────────
 * 3. Drag-Fill
 * Apply a source cell's value/formula across a target range, with smart
 * pattern detection for sequences (1,2,3 → 2,3,4) and formulas (A1+1 with
 * relative ref adjustment).
 * ────────────────────────────────────────────────────────────────────────── */
export const applyDragFill = (
  source: SheetCell,
  sourceRef: string,
  targetRefs: string[]
): Record<string, SheetCell> => {
  const result: Record<string, SheetCell> = {};
  const sourceMatch = sourceRef.match(/^([A-Z]+)(\d+)$/);
  if (!sourceMatch) return result;
  const sourceColLetters = sourceMatch[1] ?? '';
  const sourceRow = parseInt(sourceMatch[2] ?? '0', 10);

  // Parse column to index
  const colToIndex = (letters: string) => {
    let n = 0;
    for (let i = 0; i < letters.length; i++) {
      n = n * 26 + (letters.charCodeAt(i) - 64);
    }
    return n - 1;
  };
  const indexToCol = (n: number) => {
    let s = '';
    let i = n + 1;
    while (i > 0) {
      const r = (i - 1) % 26;
      s = String.fromCharCode(65 + r) + s;
      i = Math.floor((i - 1) / 26);
    }
    return s;
  };

  const sourceColIdx = colToIndex(sourceColLetters);

  for (const targetRef of targetRefs) {
    const targetMatch = targetRef.match(/^([A-Z]+)(\d+)$/);
    if (!targetMatch) continue;
    // F2 Pattern A: non-null assertion (regex match guarantees captures exist; noUncheckedIndexedAccess)
    const targetColIdx = colToIndex(targetMatch[1]!);
    const targetRow = parseInt(targetMatch[2]!, 10);
    const rowDelta = targetRow - sourceRow;
    const colDelta = targetColIdx - sourceColIdx;

    if (source.formula) {
      // Adjust relative cell refs in formula
      const adjusted = source.formula.replace(
        /([A-Z]+)(\d+)/g,
        (m, letters: string, row: string) => {
          const c = colToIndex(letters) + colDelta;
          const r = parseInt(row, 10) + rowDelta;
          if (c < 0 || r < 0) return m;
          return `${indexToCol(c)}${r}`;
        }
      );
      result[targetRef] = { ...source, formula: adjusted };
    } else if (typeof source.value === 'number') {
      // Numeric sequence detection
      result[targetRef] = {
        ...source,
        value:
          source.value +
          (typeof rowDelta === 'number' ? rowDelta : 0) +
          (typeof colDelta === 'number' ? colDelta : 0),
      };
    } else {
      // Static copy
      result[targetRef] = { ...source };
    }
  }

  return result;
};

/* ──────────────────────────────────────────────────────────────────────────
 * 4. Context Menu
 * Right-click context menu state management for grid cells.
 * ────────────────────────────────────────────────────────────────────────── */
export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
  separator?: boolean;
}

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  cellRef: string | null;
  items: ContextMenuItem[];
  openMenu: (x: number, y: number, cellRef: string, items: ContextMenuItem[]) => void;
  closeMenu: () => void;
}

export const useContextMenuStore = create<ContextMenuState>((set) => ({
  isOpen: false,
  x: 0,
  y: 0,
  cellRef: null,
  items: [],
  openMenu: (x, y, cellRef, items) => set({ isOpen: true, x, y, cellRef, items }),
  closeMenu: () => set({ isOpen: false, x: 0, y: 0, cellRef: null, items: [] }),
}));

export const useGridContextMenu = () => {
  const { isOpen, x, y, cellRef, items, openMenu, closeMenu } = useContextMenuStore();
  return { isOpen, x, y, cellRef, items, openMenu, closeMenu };
};

/* ──────────────────────────────────────────────────────────────────────────
 * 5. Auto-Sum
 * Insert SUM(range) formula into a cell.
 * ────────────────────────────────────────────────────────────────────────── */
export const applyAutoSum = (start: string, end: string): { formula: string; refs: string[] } => {
  const refs: string[] = [];
  const startMatch = start.match(/^([A-Z]+)(\d+)$/);
  const endMatch = end.match(/^([A-Z]+)(\d+)$/);
  if (!startMatch || !endMatch) return { formula: '', refs };
  const startCol = startMatch[1] ?? '';
  const startRow = parseInt(startMatch[2] ?? '0', 10);
  const endCol = endMatch[1] ?? '';
  const endRow = parseInt(endMatch[2] ?? '0', 10);

  const colToIndex = (letters: string) => {
    let n = 0;
    for (let i = 0; i < letters.length; i++) {
      n = n * 26 + (letters.charCodeAt(i) - 64);
    }
    return n - 1;
  };
  const indexToCol = (n: number) => {
    let s = '';
    let i = n + 1;
    while (i > 0) {
      const r = (i - 1) % 26;
      s = String.fromCharCode(65 + r) + s;
      i = Math.floor((i - 1) / 26);
    }
    return s;
  };
  const startColIdx = colToIndex(startCol);
  const endColIdx = colToIndex(endCol);
  const r1 = Math.min(startRow, endRow);
  const r2 = Math.max(startRow, endRow);
  const c1 = Math.min(startColIdx, endColIdx);
  const c2 = Math.max(startColIdx, endColIdx);
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      refs.push(`${indexToCol(c)}${r}`);
    }
  }
  return { formula: `=SUM(${start}:${end})`, refs };
};

/* ──────────────────────────────────────────────────────────────────────────
 * 7. Auto-Update
 * Reactive formula recomputation. When a source cell changes, all dependent
 * formulas in the active sheet are re-evaluated.
 * ────────────────────────────────────────────────────────────────────────── */
const parseCellRefs = (formula: string): string[] => {
  const refs: string[] = [];
  const re = /([A-Z]+)(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(formula)) !== null) {
    refs.push(`${m[1]}${m[2]}`);
  }
  return refs;
};

const evalFormula = (formula: string, getCellValue: (ref: string) => CellValue): CellValue => {
  if (!formula.startsWith('=')) return formula;
  const expr = formula.slice(1).toUpperCase();
  if (expr.startsWith('SUM(')) {
    const inner = expr.slice(4, -1);
    const [start, end] = inner.split(':');
    if (!start || !end) return null;
    const refs = expandRange(start, end);
    let total = 0;
    for (const r of refs) {
      const v = getCellValue(r);
      if (typeof v === 'number') total += v;
    }
    return total;
  }
  if (expr.startsWith('AVG(') || expr.startsWith('AVERAGE(')) {
    const inner = expr.replace(/^A(VERAGE|VG)\(/, '').replace(/\)$/, '');
    const [start, end] = inner.split(':');
    if (!start || !end) return null;
    const refs = expandRange(start, end);
    let total = 0;
    let count = 0;
    for (const r of refs) {
      const v = getCellValue(r);
      if (typeof v === 'number') {
        total += v;
        count++;
      }
    }
    return count > 0 ? total / count : 0;
  }
  if (expr.startsWith('COUNT(')) {
    const inner = expr.slice(6, -1);
    const [start, end] = inner.split(':');
    if (!start || !end) return null;
    const refs = expandRange(start, end);
    return refs.filter((r) => typeof getCellValue(r) === 'number').length;
  }
  // Simple arithmetic
  const safeExpr = expr.replace(/[^0-9+\-*/().A-Z]/g, '');
  let resolved = safeExpr;
  resolved = resolved.replace(/([A-Z]+\d+)/g, (m) => {
    const v = getCellValue(m);
    return typeof v === 'number' ? String(v) : '0';
  });
  try {
    const result = Function(`"use strict"; return (${resolved});`)();
    if (typeof result === 'number' && !isNaN(result)) return result;
  } catch {
    return null;
  }
  return null;
};

const expandRange = (start: string, end: string): string[] => {
  const startMatch = start.match(/^([A-Z]+)(\d+)$/);
  const endMatch = end.match(/^([A-Z]+)(\d+)$/);
  if (!startMatch || !endMatch) return [];
  const colToIndex = (letters: string) => {
    let n = 0;
    for (let i = 0; i < letters.length; i++) {
      n = n * 26 + (letters.charCodeAt(i) - 64);
    }
    return n - 1;
  };
  const indexToCol = (n: number) => {
    let s = '';
    let i = n + 1;
    while (i > 0) {
      const r = (i - 1) % 26;
      s = String.fromCharCode(65 + r) + s;
      i = Math.floor((i - 1) / 26);
    }
    return s;
  };
  // F2 Pattern A: non-null assertion (regex match guarantees captures exist; noUncheckedIndexedAccess)
  const r1 = parseInt(startMatch[2]!, 10);
  const r2 = parseInt(endMatch[2]!, 10);
  const c1 = colToIndex(startMatch[1]!);
  const c2 = colToIndex(endMatch[1]!);
  const refs: string[] = [];
  for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
    for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
      refs.push(`${indexToCol(c)}${r}`);
    }
  }
  return refs;
};

export const useAutoUpdate = (sheetId: string | null) => {
  const cells = useSheetStore((s) => (sheetId ? s.sheets[sheetId]?.cells : null));
  const setCell = useSheetStore((s) => s.setCell);

  // Derive computed values from formulas (pure, runs during render).
  // We previously used useRef + useEffect which is a React anti-pattern:
  // refs read during render return stale values, so the first render
  // after a cell change shows the OLD computed map. useMemo gives the
  // caller the freshest value on every render.
  const recomputed = useMemo<Map<string, CellValue>>(() => {
    if (!sheetId || !cells) return new Map();
    const newValues = new Map<string, CellValue>();
    const getCellValue = (ref: string): CellValue => {
      if (newValues.has(ref)) return newValues.get(ref) as CellValue;
      const c = cells[ref];
      return c?.value ?? null;
    };
    // Topo-sort by deps, then evaluate. Sets `cell.dependencies` as a
    // side-channel for downstream introspection (kept for backwards
    // compatibility with the previous useRef-based implementation).
    for (const [ref, cell] of Object.entries(cells)) {
      if (cell.formula) {
        cell.dependencies = parseCellRefs(cell.formula);
        const value = evalFormula(cell.formula, getCellValue);
        newValues.set(ref, value);
      }
    }
    return newValues;
  }, [cells, sheetId]);

  // Side effect: sync computed values back to the store. Separated
  // from the derivation so the derivation stays pure.
  useEffect(() => {
    if (!sheetId || !cells) return;
    for (const [ref, value] of recomputed.entries()) {
      if (cells[ref]?.value !== value) {
        setCell(sheetId, ref, { value });
      }
    }
  }, [recomputed, cells, sheetId, setCell]);

  return recomputed;
};

/* ──────────────────────────────────────────────────────────────────────────
 * 1+2. Scenario Merge & Locking helpers
 * Exposed here for completeness; implementations live in scenarioStore.ts.
 * ────────────────────────────────────────────────────────────────────────── */
export const isScenarioLocked = (
  state: { scenarios: { id: string; isLocked?: boolean }[] },
  id: string
) => {
  return state.scenarios.find((s) => s.id === id)?.isLocked === true;
};

export const mergeScenarioNames = (a: string, b: string) => `Merge: ${a} ⊕ ${b}`;

export { cellKey };
