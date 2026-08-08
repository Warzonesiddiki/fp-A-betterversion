import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useSheetStore,
  useSheetTabs,
  applyDragFill,
  useContextMenuStore,
  useGridContextMenu,
  applyAutoSum,
  useAutoUpdate,
  isScenarioLocked,
  mergeScenarioNames,
  cellKey,
  SheetCell,
} from './competitiveGaps';

describe('competitiveGaps', () => {
  beforeEach(() => {
    // Reset stores
    useSheetStore.setState({
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
    });

    useContextMenuStore.setState({
      isOpen: false,
      x: 0,
      y: 0,
      cellRef: null,
      items: [],
    });
  });

  describe('Sheet Tabs & Store', () => {
    it('initializes with default sheet', () => {
      const state = useSheetStore.getState();
      expect(state.activeSheetId).toBe('sheet-default');
      expect(state.sheets['sheet-default']).toBeDefined();
    });

    it('adds a sheet, switches to it, and can remove it', () => {
      const { result } = renderHook(() => useSheetTabs());

      let newSheetId: string = '';
      act(() => {
        newSheetId = result.current.addSheet('TestSheet');
      });

      expect(result.current.activeSheetId).toBe(newSheetId);
      expect(result.current.sheets.find((s) => s.id === newSheetId)?.name).toBe('TestSheet');

      act(() => {
        result.current.removeSheet(newSheetId);
      });

      expect(result.current.sheets.find((s) => s.id === newSheetId)).toBeUndefined();
      expect(result.current.activeSheetId).toBe('sheet-default');
    });

    it('renames a sheet', () => {
      const { result } = renderHook(() => useSheetTabs());

      act(() => {
        result.current.renameSheet('sheet-default', 'RenamedSheet');
      });

      expect(result.current.sheets.find((s) => s.id === 'sheet-default')?.name).toBe(
        'RenamedSheet'
      );
    });

    it('sets active cell and selection', () => {
      const state = useSheetStore.getState();
      state.setActiveCell('B2');
      expect(useSheetStore.getState().sheets['sheet-default']?.activeCellRef).toBe('B2');

      state.setSelection('A1', 'C3');
      expect(useSheetStore.getState().cellSelection).toEqual({ start: 'A1', end: 'C3' });
    });

    it('sets and gets cell', () => {
      const state = useSheetStore.getState();
      state.setCell('sheet-default', 'A1', { row: 0, col: 0, value: 42 });

      const cell = state.getCell('sheet-default', 'A1');
      expect(cell).toBeDefined();
      expect(cell?.value).toBe(42);
    });

    it('generates cellKey correctly', () => {
      expect(cellKey(0, 0)).toBe('A1');
      expect(cellKey(0, 25)).toBe('Z1');
      expect(cellKey(0, 26)).toBe('AA1');
      expect(cellKey(1, 1)).toBe('B2');
    });
  });

  describe('Drag-Fill', () => {
    it('applies numeric sequence detection', () => {
      const source: SheetCell = { row: 0, col: 0, value: 1 };
      const targetRefs = ['A2', 'A3', 'B1'];

      const result = applyDragFill(source, 'A1', targetRefs);

      expect(result['A2']?.value).toBe(2); // rowDelta=1
      expect(result['A3']?.value).toBe(3); // rowDelta=2
      expect(result['B1']?.value).toBe(2); // colDelta=1
    });

    it('applies static copy for non-numeric values', () => {
      const source: SheetCell = { row: 0, col: 0, value: 'text' };
      const targetRefs = ['A2'];

      const result = applyDragFill(source, 'A1', targetRefs);

      expect(result['A2']?.value).toBe('text');
    });

    it('adjusts formula refs based on delta', () => {
      const source: SheetCell = { row: 0, col: 0, value: null, formula: '=A1+B2' };
      const targetRefs = ['A2', 'B1']; // A2: rowDelta=1, B1: colDelta=1

      const result = applyDragFill(source, 'A1', targetRefs);

      expect(result['A2']?.formula).toBe('=A2+B3');
      expect(result['B1']?.formula).toBe('=B1+C2');
    });

    it('returns empty if invalid source/target match', () => {
      const source: SheetCell = { row: 0, col: 0, value: 1 };
      expect(applyDragFill(source, 'Invalid', ['A2'])).toEqual({});
      expect(applyDragFill(source, 'A1', ['Invalid'])).toEqual({});
    });
  });

  describe('Context Menu', () => {
    it('opens and closes context menu', () => {
      const { result } = renderHook(() => useGridContextMenu());

      act(() => {
        result.current.openMenu(10, 20, 'A1', [{ id: '1', label: 'Item 1', onClick: vi.fn() }]);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.x).toBe(10);
      expect(result.current.y).toBe(20);
      expect(result.current.cellRef).toBe('A1');
      expect(result.current.items.length).toBe(1);

      act(() => {
        result.current.closeMenu();
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.cellRef).toBe(null);
    });
  });

  describe('Auto-Sum', () => {
    it('generates correct SUM formula and refs', () => {
      const result = applyAutoSum('A1', 'B2');
      expect(result.formula).toBe('=SUM(A1:B2)');
      expect(result.refs).toEqual(['A1', 'B1', 'A2', 'B2']);
    });

    it('returns empty for invalid ranges', () => {
      const result = applyAutoSum('Invalid', 'B2');
      expect(result.formula).toBe('');
      expect(result.refs).toEqual([]);
    });
  });

  describe('Auto-Update', () => {
    it('evaluates formulas and updates cells', () => {
      // Setup some cells
      const state = useSheetStore.getState();
      state.setCell('sheet-default', 'A1', { row: 0, col: 0, value: 10 });
      state.setCell('sheet-default', 'A2', { row: 1, col: 0, value: 20 });
      state.setCell('sheet-default', 'A3', { row: 2, col: 0, value: null, formula: '=SUM(A1:A2)' });
      state.setCell('sheet-default', 'B1', { row: 0, col: 1, value: null, formula: '=AVG(A1:A2)' });
      state.setCell('sheet-default', 'B2', {
        row: 1,
        col: 1,
        value: null,
        formula: '=COUNT(A1:A2)',
      });
      state.setCell('sheet-default', 'C1', { row: 0, col: 2, value: null, formula: '=A1+A2' });
      state.setCell('sheet-default', 'D1', {
        row: 0,
        col: 3,
        value: null,
        formula: '=invalid formula!',
      });

      const { result } = renderHook(() => useAutoUpdate('sheet-default'));

      // The hook computes derived values:
      expect(result.current.get('A3')).toBe(30);
      expect(result.current.get('B1')).toBe(15);
      expect(result.current.get('B2')).toBe(2);
      expect(result.current.get('C1')).toBe(30);
      expect(result.current.get('D1')).toBe(null);

      // Check if it updated the store (side-effect run by useEffect)
      // We may need to wait for useEffect
      const a3 = useSheetStore.getState().getCell('sheet-default', 'A3');
      expect(a3?.value).toBe(30);
    });

    it('handles no sheet selected', () => {
      const { result } = renderHook(() => useAutoUpdate(null));
      expect(result.current.size).toBe(0);
    });
  });

  describe('Scenario helpers', () => {
    it('isScenarioLocked checks correctly', () => {
      const state = { scenarios: [{ id: 's1', isLocked: true }, { id: 's2' }] };
      expect(isScenarioLocked(state, 's1')).toBe(true);
      expect(isScenarioLocked(state, 's2')).toBe(false);
      expect(isScenarioLocked(state, 's3')).toBe(false);
    });

    it('mergeScenarioNames works', () => {
      expect(mergeScenarioNames('A', 'B')).toBe('Merge: A ⊕ B');
    });
  });
});
