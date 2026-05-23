export interface ShortcutDefinition {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  category: string;
}

export const keyboardShortcuts: ShortcutDefinition[] = [
  // Navigation
  { key: 'k', ctrl: true, description: 'Open command palette', category: 'Navigation' },
  { key: 'b', ctrl: true, description: 'Toggle sidebar', category: 'Navigation' },
  { key: '/', ctrl: true, description: 'Show keyboard shortcuts', category: 'Navigation' },
  { key: '1', ctrl: true, description: 'Go to Dashboard', category: 'Navigation' },
  { key: '2', ctrl: true, description: 'Go to Budgets', category: 'Navigation' },
  { key: '3', ctrl: true, description: 'Go to Forecasts', category: 'Navigation' },
  { key: '4', ctrl: true, description: 'Go to Scenarios', category: 'Navigation' },
  { key: '5', ctrl: true, description: 'Go to Reports', category: 'Navigation' },

  // Actions
  { key: 's', ctrl: true, description: 'Save current form', category: 'Actions' },
  { key: 'z', ctrl: true, description: 'Undo', category: 'Actions' },
  { key: 'z', ctrl: true, shift: true, description: 'Redo', category: 'Actions' },
  { key: 'e', ctrl: true, description: 'Export data', category: 'Actions' },
  { key: 'n', ctrl: true, description: 'New item', category: 'Actions' },

  // Data
  { key: 'f', ctrl: true, description: 'Search / Filter', category: 'Data' },
  { key: 'g', ctrl: true, description: 'Go to row', category: 'Data' },

  // General
  { key: 'Escape', description: 'Close modal / dropdown', category: 'General' },
  { key: '?', description: 'Show help', category: 'General' },
  { key: 'Enter', description: 'Confirm / Submit', category: 'General' },
];

export const shortcutsByCategory = keyboardShortcuts.reduce<Record<string, ShortcutDefinition[]>>(
  (acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  },
  {}
);

export function formatShortcut(s: ShortcutDefinition): string {
  const parts: string[] = [];
  if (s.ctrl) parts.push('Ctrl');
  if (s.shift) parts.push('Shift');
  if (s.alt) parts.push('Alt');
  parts.push(s.key.length === 1 ? s.key.toUpperCase() : s.key);
  return parts.join(' + ');
}
