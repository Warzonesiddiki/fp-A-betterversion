import { describe, it, expect, beforeEach } from 'vitest';
import {
  ExcelKeyboardShortcuts,
  SHORTCUT_CATEGORIES,
  type ShortcutDef,
} from './ExcelKeyboardShortcuts';

describe('ExcelKeyboardShortcuts', () => {
  beforeEach(() => {
    // Clear any custom shortcuts between tests
    (ExcelKeyboardShortcuts as any).customShortcuts = [];
  });

  it('should initialize with default shortcuts', () => {
    const all = ExcelKeyboardShortcuts.getAll();
    expect(all.length).toBeGreaterThan(80);
  });

  it('should have shortcuts in all categories', () => {
    const groups = ExcelKeyboardShortcuts.getGrouped();
    const categories = groups.map((g) => g.category);
    expect(categories).toContain('Navigation');
    expect(categories).toContain('Selection');
    expect(categories).toContain('Editing');
    expect(categories).toContain('Clipboard');
    expect(categories).toContain('Formatting');
    expect(categories).toContain('Formulas');
    expect(categories).toContain('Data');
    expect(categories).toContain('Sheets');
    expect(categories).toContain('Application');
  });

  it('should search shortcuts', () => {
    const results = ExcelKeyboardShortcuts.search('undo');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((s) => s.action.toLowerCase().includes('undo'))).toBe(true);
  });

  it('should search case-insensitively', () => {
    const lower = ExcelKeyboardShortcuts.search('undo');
    const upper = ExcelKeyboardShortcuts.search('UNDO');
    expect(lower.length).toBe(upper.length);
  });

  it('should return empty for no matches', () => {
    expect(ExcelKeyboardShortcuts.search('xyznonexistent')).toEqual([]);
  });

  it('should match keyboard event', () => {
    const matched = ExcelKeyboardShortcuts.match('z', {
      ctrl: true,
      shift: false,
      alt: false,
      meta: false,
    });
    expect(matched).toBeDefined();
    expect(matched!.action).toBe('undo');
  });

  it('should match Ctrl+Shift+Z for redo', () => {
    const matched = ExcelKeyboardShortcuts.match('z', {
      ctrl: true,
      shift: true,
      alt: false,
      meta: false,
    });
    expect(matched).toBeDefined();
    expect(matched!.action).toBe('redo');
  });

  it('should register custom shortcut', () => {
    const custom = ExcelKeyboardShortcuts.register({
      key: 'F9',
      description: 'Recalculate',
      category: 'Formulas',
      action: 'recalc',
    });
    expect(custom.id).toBeDefined();
    expect(custom.isCustom).toBe(true);
  });

  it('should format key combo for display', () => {
    const shortcut: ShortcutDef = {
      id: 'test',
      key: 'z',
      ctrl: true,
      description: 'Test',
      category: 'Editing',
      action: 'test',
    };
    const formatted = ExcelKeyboardShortcuts.formatKeys(shortcut);
    expect(formatted).toContain('Ctrl');
    expect(formatted).toContain('Z');
  });

  it('should have navigation shortcuts', () => {
    const all = ExcelKeyboardShortcuts.getAll();
    const nav = all.filter((s) => s.category === 'Navigation');
    expect(nav.length).toBeGreaterThanOrEqual(15);
  });

  it('should have editing shortcuts', () => {
    const all = ExcelKeyboardShortcuts.getAll();
    const editing = all.filter((s) => s.category === 'Editing');
    expect(editing.length).toBeGreaterThanOrEqual(5);
  });
});
