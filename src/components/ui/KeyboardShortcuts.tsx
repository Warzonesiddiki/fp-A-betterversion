import React, { useEffect, useRef, useState } from 'react';
import { X, Keyboard } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts: Shortcut[] = [
  // Navigation
  { keys: ['Ctrl', 'K'], description: 'Open command palette', category: 'Navigation' },
  { keys: ['Ctrl', 'B'], description: 'Toggle sidebar', category: 'Navigation' },
  { keys: ['Ctrl', '/'], description: 'Show keyboard shortcuts', category: 'Navigation' },
  { keys: ['Alt', '1-9'], description: 'Switch to tab N', category: 'Navigation' },

  // Editing
  { keys: ['Ctrl', 'Z'], description: 'Undo', category: 'Editing' },
  { keys: ['Ctrl', 'Y'], description: 'Redo', category: 'Editing' },
  { keys: ['Ctrl', 'S'], description: 'Save', category: 'Editing' },
  { keys: ['Ctrl', 'C'], description: 'Copy cell', category: 'Editing' },
  { keys: ['Ctrl', 'V'], description: 'Paste cell', category: 'Editing' },
  { keys: ['Ctrl', 'X'], description: 'Cut cell', category: 'Editing' },
  { keys: ['Delete'], description: 'Clear cell', category: 'Editing' },
  { keys: ['F2'], description: 'Edit cell', category: 'Editing' },
  { keys: ['Enter'], description: 'Confirm edit', category: 'Editing' },
  { keys: ['Escape'], description: 'Cancel edit', category: 'Editing' },
  { keys: ['Tab'], description: 'Next cell', category: 'Editing' },
  { keys: ['Shift', 'Tab'], description: 'Previous cell', category: 'Editing' },

  // Grid Navigation
  { keys: ['↑↓←→'], description: 'Navigate cells', category: 'Grid' },
  { keys: ['Ctrl', '↑'], description: 'Go to first row', category: 'Grid' },
  { keys: ['Ctrl', '↓'], description: 'Go to last row', category: 'Grid' },
  { keys: ['Ctrl', '←'], description: 'Go to first column', category: 'Grid' },
  { keys: ['Ctrl', '→'], description: 'Go to last column', category: 'Grid' },
  { keys: ['Page Up/Down'], description: 'Scroll page', category: 'Grid' },
  { keys: ['Home'], description: 'Go to row start', category: 'Grid' },
  { keys: ['End'], description: 'Go to row end', category: 'Grid' },

  // Excel-like
  { keys: ['Ctrl', 'D'], description: 'Fill down', category: 'Excel' },
  { keys: ['Ctrl', 'R'], description: 'Fill right', category: 'Excel' },
  { keys: ['Ctrl', 'Shift', '+'], description: 'Insert row/column', category: 'Excel' },
  { keys: ['Ctrl', '-'], description: 'Delete row/column', category: 'Excel' },
  { keys: ['Ctrl', '9'], description: 'Hide row', category: 'Excel' },
  { keys: ['Ctrl', '0'], description: 'Hide column', category: 'Excel' },
  { keys: ['Ctrl', 'Shift', '&'], description: 'Apply border', category: 'Excel' },

  // Formatting
  { keys: ['Ctrl', 'B'], description: 'Bold', category: 'Formatting' },
  { keys: ['Ctrl', 'I'], description: 'Italic', category: 'Formatting' },
  { keys: ['Ctrl', 'U'], description: 'Underline', category: 'Formatting' },
  { keys: ['Ctrl', '1'], description: 'Format as number', category: 'Formatting' },
  { keys: ['Ctrl', '2'], description: 'Format as currency', category: 'Formatting' },
  { keys: ['Ctrl', '3'], description: 'Format as percentage', category: 'Formatting' },
  { keys: ['Ctrl', '4'], description: 'Format as date', category: 'Formatting' },

  // Data
  { keys: ['Ctrl', 'F'], description: 'Find', category: 'Data' },
  { keys: ['Ctrl', 'H'], description: 'Find and replace', category: 'Data' },
  { keys: ['Ctrl', 'G'], description: 'Go to cell', category: 'Data' },
  { keys: ['Ctrl', 'T'], description: 'Create table', category: 'Data' },
  { keys: ['Ctrl', 'Shift', 'L'], description: 'Toggle filter', category: 'Data' },
  { keys: ['Ctrl', 'Shift', 'F'], description: 'Toggle filter bar', category: 'Data' },
  { keys: ['Alt', 'D', 'F'], description: 'Filter dropdown', category: 'Data' },

  // Reports
  { keys: ['Ctrl', 'P'], description: 'Print/Export', category: 'Reports' },
  { keys: ['Ctrl', 'Shift', 'P'], description: 'Print preview', category: 'Reports' },
  { keys: ['F11'], description: 'Fullscreen', category: 'Reports' },

  // General
  { keys: ['F1'], description: 'Help', category: 'General' },
  { keys: ['F5'], description: 'Refresh data', category: 'General' },
  { keys: ['Ctrl', 'Q'], description: 'Quick actions', category: 'General' },
  { keys: ['Ctrl', 'Shift', 'A'], description: 'Accessibility audit', category: 'General' },
];

export function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  const [filter, setFilter] = useState('');
  const prevIsOpen = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      setFilter('');
    }
    prevIsOpen.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  if (!isOpen) return null;

  const filteredShortcuts = filter
    ? shortcuts.filter(
        (s) =>
          s.description.toLowerCase().includes(filter.toLowerCase()) ||
          s.category.toLowerCase().includes(filter.toLowerCase()) ||
          s.keys.some((k) => k.toLowerCase().includes(filter.toLowerCase()))
      )
    : shortcuts;

  const categories = Array.from(new Set(filteredShortcuts.map((s) => s.category)));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClose();
      }}
    >
      <div
        className="w-full max-w-2xl max-h-[80vh] rounded-lg shadow-2xl border overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <input
            ref={searchRef}
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search shortcuts..."
            className="w-full px-3 py-2 rounded border text-sm bg-transparent outline-none"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto p-4">
          {categories.map((category) => (
            <div key={category} className="mb-6">
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: 'var(--text-secondary)' }}
              >
                {category}
              </h3>
              <div className="space-y-1">
                {filteredShortcuts
                  .filter((s) => s.category === category)
                  .map((shortcut, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:opacity-80"
                      style={{ background: 'transparent' }}
                    >
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, j) => (
                          <React.Fragment key={j}>
                            {j > 0 && (
                              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                +
                              </span>
                            )}
                            <kbd
                              className="px-2 py-0.5 text-xs rounded border font-mono"
                              style={{
                                borderColor: 'var(--border)',
                                color: 'var(--text-secondary)',
                                background: 'var(--bg-secondary)',
                              }}
                            >
                              {key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="p-3 border-t text-xs text-center"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          Press{' '}
          <kbd className="px-1 py-0.5 rounded border mx-1" style={{ borderColor: 'var(--border)' }}>
            Ctrl + /
          </kbd>{' '}
          to toggle this overlay
        </div>
      </div>
    </div>
  );
}
