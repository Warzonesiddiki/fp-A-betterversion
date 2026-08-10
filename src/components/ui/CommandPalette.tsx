import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ArrowRight } from 'lucide-react';
import { FormulaAutoCompleteEngine } from '@/engines/FormulaAutoCompleteEngine';
import { GlobalSearchEngine } from '@/engines/GlobalSearchEngine';
import { useBudgetStore } from '@/store/budgetStore';
import { useForecastStore } from '@/store/forecastStore';
import { useScenarioStore } from '@/store/scenarioStore';
import { useEntityStore } from '@/store/entityStore';
import { useNavigate } from 'react-router-dom';
export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  category: string;
  shortcut?: string;
  /** Optional ROLE_PERMISSIONS key; items without one are visible to all roles. */
  permission?: string;
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const budgets = useBudgetStore((state) => state.budgets);
  const forecasts = useForecastStore((state) => state.forecasts);
  const scenarios = useScenarioStore((state) => state.scenarios);
  const entities = useEntityStore((state) => state.entities);

  useEffect(() => {
    GlobalSearchEngine.buildIndex({
      budgets,
      forecasts,
      scenarios,
      entities: entities.map((e) => ({ id: e.id, name: e.name, type: 'entity' })),
    });
  }, [budgets, forecasts, scenarios, entities]);
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
    const localMatches = items.filter(
      (item) =>
        item.label.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery) ||
        item.category.toLowerCase().includes(lowerQuery)
    );

    if (lowerQuery.length > 1) {
      const globalMatches = GlobalSearchEngine.search(lowerQuery).map((res, i) => ({
        id: `global-${res.id}-${i}`,
        label: res.title,
        description: res.description,
        category: `Search: ${res.type}`,
        onSelect: () => {
          onClose();
          navigate(res.path);
        },
      }));
      return [...localMatches, ...globalMatches];
    }

    return localMatches;
  }, [items, query, navigate, onClose]);
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
  const previousFocusRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (visible && !prevVisible.current) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else if (!visible && prevVisible.current) {
      previousFocusRef.current?.focus();
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
        if (filteredItems[selectedIndex]!) {
          filteredItems[selectedIndex]!.onSelect();
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
      role="presentation"
      tabIndex={-1}
      aria-hidden="true"
    >
      <div
        className="w-full max-w-lg rounded-lg shadow-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        tabIndex={-1}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-[var(--border-subtle)]">
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
              filteredItems[selectedIndex]! ? `cmd-${filteredItems[selectedIndex]!.id}` : undefined
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
            <div
              className="text-center py-8"
              style={{ color: 'var(--text-secondary)' }}
              role="option"
              aria-hidden="true"
              aria-selected="false"
            >
              <p className="text-sm">{t('commands.notFound')}</p>
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
                      className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
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
