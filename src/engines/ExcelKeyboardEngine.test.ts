import { describe, it, expect } from 'vitest';
import { ExcelKeyboardEngine, type GridContext } from './ExcelKeyboardEngine';

type MovePayload = { row: number; col: number };

describe('ExcelKeyboardEngine', () => {
  const context: GridContext = {
    selectedCell: { row: 3, col: 2 },
    selectedRange: { start: { row: 3, col: 2 }, end: { row: 3, col: 2 } },
    activeRow: 3,
    activeCol: 2,
    totalRows: 10,
    totalCols: 8,
    isEditing: false,
  };

  describe('handleKey', () => {
    it('should move up with ArrowUp', () => {
      const action = ExcelKeyboardEngine.handleKey(
        'ArrowUp',
        { ctrl: false, shift: false, alt: false },
        context
      );
      expect(action.type).toBe('move');
      expect((action.payload as MovePayload).row).toBe(2);
    });

    it('should move down with ArrowDown', () => {
      const action = ExcelKeyboardEngine.handleKey(
        'ArrowDown',
        { ctrl: false, shift: false, alt: false },
        context
      );
      expect(action.type).toBe('move');
      expect((action.payload as MovePayload).row).toBe(4);
    });

    it('should not move beyond grid bounds', () => {
      const topContext = { ...context, activeRow: 0 };
      const action = ExcelKeyboardEngine.handleKey(
        'ArrowUp',
        { ctrl: false, shift: false, alt: false },
        topContext
      );
      expect((action.payload as MovePayload).row).toBe(0);
    });

    it('should handle Tab to move right', () => {
      const action = ExcelKeyboardEngine.handleKey(
        'Tab',
        { ctrl: false, shift: false, alt: false },
        context
      );
      expect(action.type).toBe('move');
      expect((action.payload as MovePayload).col).toBe(3);
    });

    it('should handle Shift+Tab to move left', () => {
      const action = ExcelKeyboardEngine.handleKey(
        'Tab',
        { ctrl: false, shift: true, alt: false },
        context
      );
      expect((action.payload as MovePayload).col).toBe(1);
    });

    it('should handle Ctrl+C for copy', () => {
      const action = ExcelKeyboardEngine.handleKey(
        'c',
        { ctrl: true, shift: false, alt: false },
        context
      );
      expect(action.type).toBe('copy');
    });

    it('should handle Ctrl+V for paste', () => {
      const action = ExcelKeyboardEngine.handleKey(
        'v',
        { ctrl: true, shift: false, alt: false },
        context
      );
      expect(action.type).toBe('paste');
    });

    it('should handle Ctrl+Z for undo', () => {
      const action = ExcelKeyboardEngine.handleKey(
        'z',
        { ctrl: true, shift: false, alt: false },
        context
      );
      expect(action.type).toBe('undo');
    });

    it('should handle Ctrl+Y for redo', () => {
      const action = ExcelKeyboardEngine.handleKey(
        'y',
        { ctrl: true, shift: false, alt: false },
        context
      );
      expect(action.type).toBe('redo');
    });

    it('should handle Delete key', () => {
      const action = ExcelKeyboardEngine.handleKey(
        'Delete',
        { ctrl: false, shift: false, alt: false },
        context
      );
      expect(action.type).toBe('delete');
    });

    it('should handle F2 for edit', () => {
      const action = ExcelKeyboardEngine.handleKey(
        'F2',
        { ctrl: false, shift: false, alt: false },
        context
      );
      expect(action.type).toBe('edit');
    });

    it('should handle Home to go to first column', () => {
      const action = ExcelKeyboardEngine.handleKey(
        'Home',
        { ctrl: false, shift: false, alt: false },
        context
      );
      expect((action.payload as MovePayload).col).toBe(0);
    });

    it('should handle End to go to last column', () => {
      const action = ExcelKeyboardEngine.handleKey(
        'End',
        { ctrl: false, shift: false, alt: false },
        context
      );
      expect((action.payload as MovePayload).col).toBe(7);
    });

    it('should return none for unknown keys', () => {
      const action = ExcelKeyboardEngine.handleKey(
        'a',
        { ctrl: false, shift: false, alt: false },
        context
      );
      expect(action.type).toBe('none');
    });

    it('should ignore non-navigation keys while editing', () => {
      const editingContext = { ...context, isEditing: true };
      const action = ExcelKeyboardEngine.handleKey(
        'a',
        { ctrl: false, shift: false, alt: false },
        editingContext
      );
      expect(action.type).toBe('none');
    });
  });

  describe('getShortcuts', () => {
    it('should return default shortcuts', () => {
      const shortcuts = ExcelKeyboardEngine.getShortcuts();
      expect(shortcuts.length).toBeGreaterThanOrEqual(5);
      expect(shortcuts.some((s) => s.key === 'C' && s.ctrl)).toBe(true);
    });
  });

  describe('registerCustomShortcut', () => {
    it('should register a custom shortcut', () => {
      const before = ExcelKeyboardEngine.getShortcuts().length;
      ExcelKeyboardEngine.registerCustomShortcut('F5', 'refresh');
      const after = ExcelKeyboardEngine.getShortcuts().length;
      expect(after).toBe(before + 1);
    });
  });

  describe('shift+arrow for selection', () => {
    it('should return select type when shift is held', () => {
      const action = ExcelKeyboardEngine.handleKey(
        'ArrowDown',
        { ctrl: false, shift: true, alt: false },
        context
      );
      expect(action.type).toBe('select');
    });
  });

  describe('Ctrl+X for cut', () => {
    it('should return edit type with cut payload', () => {
      const action = ExcelKeyboardEngine.handleKey(
        'x',
        { ctrl: true, shift: false, alt: false },
        context
      );
      expect(action.type).toBe('edit');
      expect(action.payload).toBe('cut');
    });
  });
});
