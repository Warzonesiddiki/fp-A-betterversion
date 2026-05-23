export interface ShortcutDef {
  id: string;
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  category: ShortcutCategory;
  action: string;
  isCustom?: boolean;
}

export type ShortcutCategory =
  | 'Navigation'
  | 'Selection'
  | 'Editing'
  | 'Clipboard'
  | 'Formatting'
  | 'Formulas'
  | 'Data'
  | 'Sheets'
  | 'Application';

export interface ShortcutGroup {
  category: ShortcutCategory;
  shortcuts: ShortcutDef[];
}

const uid = (): string => Math.random().toString(36).slice(2, 9);

// ─── Default shortcut registry ───────────────────────────────────────

const NAVIGATION: ShortcutDef[] = [
  {
    id: uid(),
    key: 'ArrowUp',
    description: 'Move up one cell',
    category: 'Navigation',
    action: 'moveUp',
  },
  {
    id: uid(),
    key: 'ArrowDown',
    description: 'Move down one cell',
    category: 'Navigation',
    action: 'moveDown',
  },
  {
    id: uid(),
    key: 'ArrowLeft',
    description: 'Move left one cell',
    category: 'Navigation',
    action: 'moveLeft',
  },
  {
    id: uid(),
    key: 'ArrowRight',
    description: 'Move right one cell',
    category: 'Navigation',
    action: 'moveRight',
  },
  {
    id: uid(),
    key: 'Tab',
    description: 'Move to next cell',
    category: 'Navigation',
    action: 'moveNext',
  },
  {
    id: uid(),
    key: 'Tab',
    shift: true,
    description: 'Move to previous cell',
    category: 'Navigation',
    action: 'movePrevious',
  },
  {
    id: uid(),
    key: 'Enter',
    description: 'Move down / confirm edit',
    category: 'Navigation',
    action: 'moveDownOrConfirm',
  },
  {
    id: uid(),
    key: 'Enter',
    shift: true,
    description: 'Move up / confirm edit',
    category: 'Navigation',
    action: 'moveUpOrConfirm',
  },
  {
    id: uid(),
    key: 'Home',
    description: 'Go to column A in current row',
    category: 'Navigation',
    action: 'goToRowStart',
  },
  {
    id: uid(),
    key: 'Home',
    ctrl: true,
    description: 'Go to cell A1',
    category: 'Navigation',
    action: 'goToA1',
  },
  {
    id: uid(),
    key: 'End',
    description: 'Go to last column in current row',
    category: 'Navigation',
    action: 'goToRowEnd',
  },
  {
    id: uid(),
    key: 'End',
    ctrl: true,
    description: 'Go to last used cell',
    category: 'Navigation',
    action: 'goToLastUsed',
  },
  {
    id: uid(),
    key: 'PageUp',
    description: 'Scroll up one screen',
    category: 'Navigation',
    action: 'pageUp',
  },
  {
    id: uid(),
    key: 'PageDown',
    description: 'Scroll down one screen',
    category: 'Navigation',
    action: 'pageDown',
  },
  {
    id: uid(),
    key: 'PageUp',
    ctrl: true,
    description: 'Previous sheet',
    category: 'Navigation',
    action: 'previousSheet',
  },
  {
    id: uid(),
    key: 'PageDown',
    ctrl: true,
    description: 'Next sheet',
    category: 'Navigation',
    action: 'nextSheet',
  },
  {
    id: uid(),
    key: 'ArrowUp',
    ctrl: true,
    description: 'Jump to top of data region',
    category: 'Navigation',
    action: 'jumpUp',
  },
  {
    id: uid(),
    key: 'ArrowDown',
    ctrl: true,
    description: 'Jump to bottom of data region',
    category: 'Navigation',
    action: 'jumpDown',
  },
  {
    id: uid(),
    key: 'ArrowLeft',
    ctrl: true,
    description: 'Jump to left edge of data region',
    category: 'Navigation',
    action: 'jumpLeft',
  },
  {
    id: uid(),
    key: 'ArrowRight',
    ctrl: true,
    description: 'Jump to right edge of data region',
    category: 'Navigation',
    action: 'jumpRight',
  },
];

const SELECTION: ShortcutDef[] = [
  {
    id: uid(),
    key: 'ArrowUp',
    shift: true,
    description: 'Extend selection up',
    category: 'Selection',
    action: 'extendUp',
  },
  {
    id: uid(),
    key: 'ArrowDown',
    shift: true,
    description: 'Extend selection down',
    category: 'Selection',
    action: 'extendDown',
  },
  {
    id: uid(),
    key: 'ArrowLeft',
    shift: true,
    description: 'Extend selection left',
    category: 'Selection',
    action: 'extendLeft',
  },
  {
    id: uid(),
    key: 'ArrowRight',
    shift: true,
    description: 'Extend selection right',
    category: 'Selection',
    action: 'extendRight',
  },
  {
    id: uid(),
    key: 'ArrowUp',
    ctrl: true,
    shift: true,
    description: 'Extend to top of data region',
    category: 'Selection',
    action: 'extendJumpUp',
  },
  {
    id: uid(),
    key: 'ArrowDown',
    ctrl: true,
    shift: true,
    description: 'Extend to bottom of data region',
    category: 'Selection',
    action: 'extendJumpDown',
  },
  {
    id: uid(),
    key: 'ArrowLeft',
    ctrl: true,
    shift: true,
    description: 'Extend to left edge of data region',
    category: 'Selection',
    action: 'extendJumpLeft',
  },
  {
    id: uid(),
    key: 'ArrowRight',
    ctrl: true,
    shift: true,
    description: 'Extend to right edge of data region',
    category: 'Selection',
    action: 'extendJumpRight',
  },
  {
    id: uid(),
    key: 'Home',
    shift: true,
    description: 'Extend selection to column A',
    category: 'Selection',
    action: 'extendToRowStart',
  },
  {
    id: uid(),
    key: 'Home',
    ctrl: true,
    shift: true,
    description: 'Extend selection to A1',
    category: 'Selection',
    action: 'extendToA1',
  },
  {
    id: uid(),
    key: 'End',
    shift: true,
    description: 'Extend to last column',
    category: 'Selection',
    action: 'extendToRowEnd',
  },
  {
    id: uid(),
    key: 'End',
    ctrl: true,
    shift: true,
    description: 'Extend to last used cell',
    category: 'Selection',
    action: 'extendToLastUsed',
  },
  {
    id: uid(),
    key: 'a',
    ctrl: true,
    description: 'Select all cells',
    category: 'Selection',
    action: 'selectAll',
  },
  {
    id: uid(),
    key: 'Space',
    shift: true,
    description: 'Select entire row',
    category: 'Selection',
    action: 'selectRow',
  },
  {
    id: uid(),
    key: 'Space',
    ctrl: true,
    description: 'Select entire column',
    category: 'Selection',
    action: 'selectColumn',
  },
];

const EDITING: ShortcutDef[] = [
  {
    id: uid(),
    key: 'F2',
    description: 'Enter cell edit mode',
    category: 'Editing',
    action: 'enterEditMode',
  },
  {
    id: uid(),
    key: 'Escape',
    description: 'Cancel edit / close dialog',
    category: 'Editing',
    action: 'cancelEdit',
  },
  {
    id: uid(),
    key: 'Delete',
    description: 'Clear cell contents',
    category: 'Editing',
    action: 'clearContents',
  },
  {
    id: uid(),
    key: 'Backspace',
    description: 'Clear and enter edit mode',
    category: 'Editing',
    action: 'clearAndEdit',
  },
  { id: uid(), key: 'z', ctrl: true, description: 'Undo', category: 'Editing', action: 'undo' },
  { id: uid(), key: 'y', ctrl: true, description: 'Redo', category: 'Editing', action: 'redo' },
  {
    id: uid(),
    key: 'z',
    ctrl: true,
    shift: true,
    description: 'Redo (alt)',
    category: 'Editing',
    action: 'redo',
  },
  {
    id: uid(),
    key: 's',
    ctrl: true,
    description: 'Save workbook',
    category: 'Editing',
    action: 'save',
  },
  {
    id: uid(),
    key: 'Insert',
    description: 'Insert cell/row/column',
    category: 'Editing',
    action: 'insert',
  },
];

const CLIPBOARD: ShortcutDef[] = [
  {
    id: uid(),
    key: 'c',
    ctrl: true,
    description: 'Copy selection',
    category: 'Clipboard',
    action: 'copy',
  },
  {
    id: uid(),
    key: 'x',
    ctrl: true,
    description: 'Cut selection',
    category: 'Clipboard',
    action: 'cut',
  },
  { id: uid(), key: 'v', ctrl: true, description: 'Paste', category: 'Clipboard', action: 'paste' },
  {
    id: uid(),
    key: 'v',
    ctrl: true,
    shift: true,
    description: 'Paste values only',
    category: 'Clipboard',
    action: 'pasteValues',
  },
  {
    id: uid(),
    key: "'",
    ctrl: true,
    description: 'Copy value from cell above',
    category: 'Clipboard',
    action: 'copyCellAbove',
  },
];

const FORMATTING: ShortcutDef[] = [
  {
    id: uid(),
    key: '1',
    ctrl: true,
    description: 'Format cells dialog',
    category: 'Formatting',
    action: 'formatCells',
  },
  {
    id: uid(),
    key: 'b',
    ctrl: true,
    description: 'Toggle bold',
    category: 'Formatting',
    action: 'toggleBold',
  },
  {
    id: uid(),
    key: 'i',
    ctrl: true,
    description: 'Toggle italic',
    category: 'Formatting',
    action: 'toggleItalic',
  },
  {
    id: uid(),
    key: 'u',
    ctrl: true,
    description: 'Toggle underline',
    category: 'Formatting',
    action: 'toggleUnderline',
  },
  {
    id: uid(),
    key: '5',
    ctrl: true,
    description: 'Toggle strikethrough',
    category: 'Formatting',
    action: 'toggleStrikethrough',
  },
  {
    id: uid(),
    key: '~',
    ctrl: true,
    shift: true,
    description: 'Format: General',
    category: 'Formatting',
    action: 'formatGeneral',
  },
  {
    id: uid(),
    key: '$',
    ctrl: true,
    shift: true,
    description: 'Format: Currency',
    category: 'Formatting',
    action: 'formatCurrency',
  },
  {
    id: uid(),
    key: '%',
    ctrl: true,
    shift: true,
    description: 'Format: Percentage',
    category: 'Formatting',
    action: 'formatPercent',
  },
  {
    id: uid(),
    key: '#',
    ctrl: true,
    shift: true,
    description: 'Format: Date (dd-mmm-yy)',
    category: 'Formatting',
    action: 'formatDate',
  },
  {
    id: uid(),
    key: '!',
    ctrl: true,
    shift: true,
    description: 'Format: Number with 2 decimals',
    category: 'Formatting',
    action: 'formatNumber',
  },
  {
    id: uid(),
    key: '@',
    ctrl: true,
    shift: true,
    description: 'Format: Time',
    category: 'Formatting',
    action: 'formatTime',
  },
  {
    id: uid(),
    key: '&',
    ctrl: true,
    shift: true,
    description: 'Format: Accounting',
    category: 'Formatting',
    action: 'formatAccounting',
  },
];

const FORMULAS: ShortcutDef[] = [
  {
    id: uid(),
    key: '=',
    alt: true,
    description: 'Auto-sum selected cells',
    category: 'Formulas',
    action: 'autoSum',
  },
  {
    id: uid(),
    key: '`',
    ctrl: true,
    description: 'Toggle formula view',
    category: 'Formulas',
    action: 'toggleFormulaView',
  },
  {
    id: uid(),
    key: 'F4',
    description: 'Toggle absolute/relative reference',
    category: 'Formulas',
    action: 'toggleAbsoluteRef',
  },
  {
    id: uid(),
    key: 'Enter',
    ctrl: true,
    shift: true,
    description: 'Enter array formula',
    category: 'Formulas',
    action: 'enterArrayFormula',
  },
  {
    id: uid(),
    key: 'F9',
    description: 'Recalculate all formulas',
    category: 'Formulas',
    action: 'recalculate',
  },
  {
    id: uid(),
    key: 'F9',
    shift: true,
    description: 'Calculate active sheet',
    category: 'Formulas',
    action: 'calculateSheet',
  },
];

const DATA: ShortcutDef[] = [
  {
    id: uid(),
    key: 't',
    ctrl: true,
    description: 'Create table from selection',
    category: 'Data',
    action: 'createTable',
  },
  {
    id: uid(),
    key: 'l',
    ctrl: true,
    shift: true,
    description: 'Toggle auto-filter',
    category: 'Data',
    action: 'toggleFilter',
  },
  {
    id: uid(),
    key: 'd',
    ctrl: true,
    description: 'Fill down',
    category: 'Data',
    action: 'fillDown',
  },
  {
    id: uid(),
    key: 'r',
    ctrl: true,
    description: 'Fill right',
    category: 'Data',
    action: 'fillRight',
  },
  {
    id: uid(),
    key: ';',
    ctrl: true,
    description: 'Insert current date',
    category: 'Data',
    action: 'insertDate',
  },
  {
    id: uid(),
    key: ':',
    ctrl: true,
    shift: true,
    description: 'Insert current time',
    category: 'Data',
    action: 'insertTime',
  },
  {
    id: uid(),
    key: 'h',
    ctrl: true,
    description: 'Find and replace',
    category: 'Data',
    action: 'findReplace',
  },
  { id: uid(), key: 'f', ctrl: true, description: 'Find', category: 'Data', action: 'find' },
];

const SHEETS: ShortcutDef[] = [
  {
    id: uid(),
    key: 'PageUp',
    ctrl: true,
    description: 'Previous sheet tab',
    category: 'Sheets',
    action: 'previousSheet',
  },
  {
    id: uid(),
    key: 'PageDown',
    ctrl: true,
    description: 'Next sheet tab',
    category: 'Sheets',
    action: 'nextSheet',
  },
  {
    id: uid(),
    key: 'n',
    ctrl: true,
    shift: true,
    description: 'Insert new sheet',
    category: 'Sheets',
    action: 'insertSheet',
  },
];

const APPLICATION: ShortcutDef[] = [
  {
    id: uid(),
    key: 'k',
    ctrl: true,
    description: 'Open command palette',
    category: 'Application',
    action: 'commandPalette',
  },
  {
    id: uid(),
    key: 'b',
    ctrl: true,
    description: 'Toggle sidebar',
    category: 'Application',
    action: 'toggleSidebar',
  },
  {
    id: uid(),
    key: '/',
    ctrl: true,
    description: 'Show keyboard shortcuts',
    category: 'Application',
    action: 'showShortcuts',
  },
  {
    id: uid(),
    key: 'p',
    ctrl: true,
    description: 'Print / export PDF',
    category: 'Application',
    action: 'print',
  },
  {
    id: uid(),
    key: 'e',
    ctrl: true,
    description: 'Export report',
    category: 'Application',
    action: 'export',
  },
  {
    id: uid(),
    key: '?',
    shift: true,
    description: 'Show keyboard shortcuts',
    category: 'Application',
    action: 'showShortcuts',
  },
];

// ─── Full registry ───────────────────────────────────────────────────

const DEFAULT_SHORTCUTS: ShortcutDef[] = [
  ...NAVIGATION,
  ...SELECTION,
  ...EDITING,
  ...CLIPBOARD,
  ...FORMATTING,
  ...FORMULAS,
  ...DATA,
  ...SHEETS,
  ...APPLICATION,
];

export const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  'Navigation',
  'Selection',
  'Editing',
  'Clipboard',
  'Formatting',
  'Formulas',
  'Data',
  'Sheets',
  'Application',
];

// ─── Engine ──────────────────────────────────────────────────────────

export class ExcelKeyboardShortcuts {
  private static shortcuts: ShortcutDef[] = [...DEFAULT_SHORTCUTS];
  private static customShortcuts: ShortcutDef[] = [];
  private static listeners: Set<() => void> = new Set();

  /** Get all shortcuts (default + custom) grouped by category. */
  static getGrouped(): ShortcutGroup[] {
    const all = [...this.shortcuts, ...this.customShortcuts];
    return SHORTCUT_CATEGORIES.map((cat) => ({
      category: cat,
      shortcuts: all.filter((s) => s.category === cat),
    }));
  }

  /** Flat list of all shortcuts. */
  static getAll(): ShortcutDef[] {
    return [...this.shortcuts, ...this.customShortcuts];
  }

  /** Search shortcuts by description or key. */
  static search(query: string): ShortcutDef[] {
    const q = query.toLowerCase();
    return this.getAll().filter(
      (s) =>
        s.description.toLowerCase().includes(q) ||
        s.key.toLowerCase().includes(q) ||
        s.action.toLowerCase().includes(q)
    );
  }

  /** Find a shortcut matching the given key event. */
  static match(
    key: string,
    modifiers: { ctrl: boolean; shift: boolean; alt: boolean; meta: boolean }
  ): ShortcutDef | undefined {
    return this.getAll().find((s) => {
      const keyMatch =
        s.key.toLowerCase() === key.toLowerCase() || (s.key.startsWith('Arrow') && s.key === key);
      return (
        keyMatch &&
        !!s.ctrl === modifiers.ctrl &&
        !!s.shift === modifiers.shift &&
        !!s.alt === modifiers.alt
      );
    });
  }

  /** Register a user-defined custom shortcut. */
  static register(shortcut: Omit<ShortcutDef, 'id' | 'isCustom'>): ShortcutDef {
    const def: ShortcutDef = { ...shortcut, id: uid(), isCustom: true };
    this.customShortcuts.push(def);
    this.notify();
    return def;
  }

  /** Remove a custom shortcut by id. */
  static removeCustom(id: string): boolean {
    const idx = this.customShortcuts.findIndex((s) => s.id === id);
    if (idx < 0) return false;
    this.customShortcuts.splice(idx, 1);
    this.notify();
    return true;
  }

  /** Persist custom shortcuts to localStorage. */
  static saveCustom(): void {
    try {
      localStorage.setItem('finplan_custom_shortcuts', JSON.stringify(this.customShortcuts));
    } catch {
      // storage full or unavailable
    }
  }

  /** Load custom shortcuts from localStorage. */
  static loadCustom(): void {
    try {
      const raw = localStorage.getItem('finplan_custom_shortcuts');
      if (raw) {
        this.customShortcuts = JSON.parse(raw) as ShortcutDef[];
        this.notify();
      }
    } catch {
      // corrupt data — ignore
    }
  }

  /** Format a shortcut as a human-readable key combo string. */
  static formatKeys(s: ShortcutDef): string {
    const parts: string[] = [];
    if (s.ctrl) parts.push('Ctrl');
    if (s.alt) parts.push('Alt');
    if (s.shift) parts.push('Shift');
    parts.push(formatKeyName(s.key));
    return parts.join('+');
  }

  /** Subscribe to changes (custom shortcut add/remove). */
  static subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private static notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}

function formatKeyName(key: string): string {
  const map: Record<string, string> = {
    ArrowUp: '\u2191',
    ArrowDown: '\u2193',
    ArrowLeft: '\u2190',
    ArrowRight: '\u2192',
    Enter: '\u21B5',
    Backspace: '\u232B',
    Delete: '\u2326',
    Escape: 'Esc',
    Tab: '\u21E5',
    ' ': 'Space',
    PageUp: 'PgUp',
    PageDown: 'PgDn',
  };
  return map[key] ?? key.toUpperCase();
}
