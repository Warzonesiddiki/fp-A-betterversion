import { describe, it, expect } from 'vitest';
import { keyboardShortcuts, shortcutsByCategory, formatShortcut } from './keyboardShortcuts';

describe('keyboardShortcuts config', () => {
  it('exposes a non-empty list of unique shortcuts', () => {
    expect(keyboardShortcuts.length).toBeGreaterThan(10);
    for (const s of keyboardShortcuts) {
      expect(s.key).toBeTruthy();
      expect(s.description).toBeTruthy();
      expect(s.category).toBeTruthy();
    }
  });

  it('groups shortcuts by category with no key collisions inside a group', () => {
    const categories = Object.keys(shortcutsByCategory);
    expect(categories.length).toBeGreaterThanOrEqual(3);
    expect(categories).toContain('Navigation');
    expect(categories).toContain('Actions');
    expect(categories).toContain('General');

    for (const [cat, items] of Object.entries(shortcutsByCategory)) {
      expect(items.length).toBeGreaterThan(0);
      const keyModifiers = items.map(
        (s) => `${s.ctrl ? 'C' : ''}${s.shift ? 'S' : ''}${s.alt ? 'A' : ''}-${s.key}`
      );
      expect(new Set(keyModifiers).size).toBe(items.length);
      expect(shortcutsByCategory[cat]).toBe(items);
    }
  });

  it('every shortcut in the category map came from the source list', () => {
    const total = Object.values(shortcutsByCategory).reduce((n, arr) => n + arr.length, 0);
    expect(total).toBe(keyboardShortcuts.length);
  });

  it('formatShortcut renders modifiers and single-letter keys', () => {
    expect(formatShortcut({ key: 'k', ctrl: true, description: '', category: '' })).toBe(
      'Ctrl + K'
    );
    expect(
      formatShortcut({ key: 'z', ctrl: true, shift: true, description: '', category: '' })
    ).toBe('Ctrl + Shift + Z');
    expect(formatShortcut({ key: 'e', ctrl: true, alt: true, description: '', category: '' })).toBe(
      'Ctrl + Alt + E'
    );
    expect(formatShortcut({ key: 'Escape', description: '', category: '' })).toBe('Escape');
    expect(formatShortcut({ key: '/', description: '', category: '' })).toBe('/');
  });
});
