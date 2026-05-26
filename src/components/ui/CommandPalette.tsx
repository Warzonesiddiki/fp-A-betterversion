import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { FormulaAutoCompleteEngine } from '@/engines/FormulaAutoCompleteEngine';
export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  category: string;
  shortcut?: string;
  onSelect: () => void;
}
interface CommandPaletteProps {
  items?: CommandItem[];
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  placeholder?: string;
}
export function CommandPalette({
  items = [],
  isOpen,
  open,
  onClose,
  placeholder,
}: CommandPaletteProps) {
  const visible = isOpen ?? open ?? false;
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const lowerQuery = query.toLowerCase();
    // If query starts with "=", show formula suggestions
    if (query.startsWith('=')) {
      const formulaQuery = query.slice(1).trim();
      const suggestions = FormulaAutoCompleteEngine.suggest(formulaQuery);
      return suggestions.map((s, i) => ({
        id: `formula-${s.text}-${i}`,
        label: s.text,
        description: s.description,
        category: 'Formulas',
        onSelect: () => {},
      }));
    }
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery) ||
        item.category.toLowerCase().includes(lowerQuery)
    );
  }, [items, query]);
  const groupedItems = useMemo(() => {
    const groups = new Map<string, CommandItem[]>();
    for (const item of filteredItems) {
      const list = groups.get(item.category) ?? [];
      list.push(item);
      groups.set(item.category, list);
    }
    return groups;
  }, [filteredItems]);
  const prevVisible = useRef(false);
  useEffect(() => {
    if (visible && !prevVisible.current) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    prevVisible.current = visible;
  }, [visible]);
  const prevQuery = useRef(query);
  useEffect(() => {
    if (query !== prevQuery.current && filteredItems.length > 0) {
      setSelectedIndex(0);
    }
    prevQuery.current = query;
  }, [query, filteredItems]);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].onSelect();
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };
  useEffect(() => {
    const selectedEl = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    selectedEl?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);
  if (!visible) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      role="button"
      tabIndex={0}
      aria-label="Close command palette"
    >
      <div
        className="w-full max-w-lg rounded-lg shadow-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        tabIndex={-1}
      >
        {/* Search Input */}
        <div
          className="flex items-center gap-3 p-4 border-b border-[var(--border-subtle)]"
        >
          <Search className="w-5 h-5 text-[var(--text-secondary)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            role="combobox"
            aria-expanded="true"
            aria-controls="command-list"
            aria-activedescendant={
              filteredItems[selectedIndex] ? `cmd-${filteredItems[selectedIndex].id}` : undefined
            }
            aria-label="Search commands"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--text-primary)' }}
          />
          <kbd
            className="px-2 py-0.5 text-xs rounded border"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}
          >
            ESC
          </kbd>
        </div>
        {/* Item List */}
        <div
          ref={listRef}
          id="command-list"
          role="listbox"
          aria-label="Commands"
          className="max-h-80 overflow-y-auto p-2"
        >
          {filteredItems.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
              <p className="text-sm">No commands found</p>
            </div>
          ) : (
            Array.from(groupedItems.entries()).map(([category, categoryItems]) => (
              <div key={category} className="mb-2">
                <div
                  className="px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {category}
                </div>
                {categoryItems.map((item) => {
                  const globalIndex = filteredItems.findIndex((f) => f.id === item.id);
                  return (
                    <button
                      key={item.id}
                      id={`cmd-${item.id}`}
                      data-index={globalIndex}
                      role="option"
                      aria-selected={globalIndex === selectedIndex}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors cursor-pointer"
                      style={{
                        background:
                          globalIndex === selectedIndex ? 'var(--bg-hover)' : 'transparent',
                        color: 'var(--text-primary)',
                      }}
                      onClick={() => {
                        item.onSelect();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                    >
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.shortcut && (
                        <kbd
                          className="px-2 py-0.5 text-xs rounded border"
                          style={{
                            color: 'var(--text-secondary)',
                            borderColor: 'var(--border-subtle)',
                          }}
                        >
                          {item.shortcut}
                        </kbd>
                      )}
                      <ArrowRight
                        className="w-3 h-3 opacity-60"
                        style={{ color: 'var(--text-secondary)' }}
                      />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        {/* Footer */}
        <div
          className="flex items-center justify-between px-4 py-2 border-t text-xs"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
        >
          <span>{filteredItems.length} results</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd
                className="px-1 py-0.5 rounded border"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd
                className="px-1 py-0.5 rounded border"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                ↵
              </kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd
                className="px-1 py-0.5 rounded border"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                Esc
              </kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
