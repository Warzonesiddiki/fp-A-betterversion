export interface GridPosition {
  row: number;
  col: number;
}
export interface GridSelection {
  start: GridPosition;
  end: GridPosition;
}
export interface GridContext {
  selectedCell: GridPosition | null;
  selectedRange: GridSelection | null;
  activeRow: number;
  activeCol: number;
  totalRows: number;
  totalCols: number;
  isEditing: boolean;
}
export interface GridAction {
  type:
    | 'move'
    | 'edit'
    | 'copy'
    | 'paste'
    | 'undo'
    | 'redo'
    | 'fill'
    | 'delete'
    | 'select'
    | 'none';
  payload?: unknown;
}
export interface Shortcut {
  key: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  description: string;
  action: string;
}

export class ExcelKeyboardEngine {
  private static customShortcuts: Shortcut[] = [];

  static handleKey(
    key: string,
    modifiers: { ctrl: boolean; shift: boolean; alt: boolean },
    context: GridContext
  ): GridAction {
    if (context.isEditing && key !== 'Enter' && key !== 'Tab' && key !== 'Escape') {
      return { type: 'none' };
    }

    const { ctrl, shift } = modifiers;

    if (ctrl) {
      switch (key.toLowerCase()) {
        case 'c':
          return { type: 'copy' };
        case 'v':
          return { type: 'paste' };
        case 'x':
          return { type: 'edit', payload: 'cut' };
        case 'z':
          return { type: 'undo' };
        case 'y':
          return { type: 'redo' };
        case 'd':
          return { type: 'fill', payload: { direction: 'down' } };
        case 'r':
          return { type: 'fill', payload: { direction: 'right' } };
      }
    }

    switch (key) {
      case 'ArrowUp':
        return {
          type: shift ? 'select' : 'move',
          payload: { row: Math.max(0, context.activeRow - 1), col: context.activeCol },
        };
      case 'ArrowDown':
        return {
          type: shift ? 'select' : 'move',
          payload: {
            row: Math.min(context.totalRows - 1, context.activeRow + 1),
            col: context.activeCol,
          },
        };
      case 'ArrowLeft':
        return {
          type: shift ? 'select' : 'move',
          payload: { row: context.activeRow, col: Math.max(0, context.activeCol - 1) },
        };
      case 'ArrowRight':
        return {
          type: shift ? 'select' : 'move',
          payload: {
            row: context.activeRow,
            col: Math.min(context.totalCols - 1, context.activeCol + 1),
          },
        };
      case 'Tab':
        return {
          type: 'move',
          payload: {
            row: context.activeRow,
            col: shift
              ? Math.max(0, context.activeCol - 1)
              : Math.min(context.totalCols - 1, context.activeCol + 1),
          },
        };
      case 'Enter':
        return {
          type: 'move',
          payload: {
            row: shift
              ? Math.max(0, context.activeRow - 1)
              : Math.min(context.totalRows - 1, context.activeRow + 1),
            col: context.activeCol,
          },
        };
      case 'F2':
        return { type: 'edit' };
      case 'Delete':
      case 'Backspace':
        return { type: 'delete' };
      case 'Home':
        return { type: 'move', payload: { row: context.activeRow, col: 0 } };
      case 'End':
        return { type: 'move', payload: { row: context.activeRow, col: context.totalCols - 1 } };
      default:
        return { type: 'none' };
    }
  }

  static getShortcuts(): Shortcut[] {
    const defaults: Shortcut[] = [
      { key: 'C', ctrl: true, shift: false, alt: false, description: 'Copy', action: 'copy' },
      { key: 'V', ctrl: true, shift: false, alt: false, description: 'Paste', action: 'paste' },
      { key: 'Z', ctrl: true, shift: false, alt: false, description: 'Undo', action: 'undo' },
      { key: 'Y', ctrl: true, shift: false, alt: false, description: 'Redo', action: 'redo' },
      {
        key: 'F2',
        ctrl: false,
        shift: false,
        alt: false,
        description: 'Edit Cell',
        action: 'edit',
      },
    ];
    return [...defaults, ...this.customShortcuts];
  }

  static registerCustomShortcut(key: string, action: string): void {
    this.customShortcuts.push({
      key,
      ctrl: false,
      shift: false,
      alt: false,
      description: 'Custom Shortcut',
      action,
    });
  }
}
