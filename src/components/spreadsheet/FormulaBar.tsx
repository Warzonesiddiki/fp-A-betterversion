/** FormulaBar — Enhanced formula bar with autocomplete from FormulaAutoCompleteEngine */
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { FormulaAutoCompleteEngine } from '@/engines/FormulaAutoCompleteEngine';

interface AutocompleteItem {
  text: string;
  type: 'function' | 'cell' | 'range' | 'named' | 'operator';
  description: string;
  category?: string;
  insertText: string;
}

export interface FormulaBarProps {
  value: string;
  onChange: (value: string) => void;
  onEvaluate: (result: string) => void;
  onNavigate?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  activeCell?: string;
  disabled?: boolean;
  namedRanges?: string[];
  className?: string;
}

export function FormulaBar({
  value,
  onChange,
  onEvaluate,
  onNavigate,
  activeCell = 'A1',
  disabled = false,
  namedRanges,
  className,
}: FormulaBarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const suggestions = useMemo<AutocompleteItem[]>(() => {
    if (!value.startsWith('=') || value.length < 2) return [];
    return FormulaAutoCompleteEngine.suggest(value, { namedRanges });
  }, [value, namedRanges]);

  const errors = useMemo<string[]>(() => {
    if (value.startsWith('=')) return FormulaAutoCompleteEngine.detectErrors(value);
    return [];
  }, [value]);

  useEffect(() => {
    setShowSuggestions(value.startsWith('=') && value.length >= 2 && suggestions.length > 0);
    setSelectedIndex(0);
  }, [value, suggestions.length]);

  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.children[selectedIndex] as HTMLElement | undefined;
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const insertSuggestion = useCallback(
    (item: AutocompleteItem) => {
      const lastTokenMatch = value.match(/([A-Za-z0-9_$]+)$/);
      if (lastTokenMatch) {
        const before = value.slice(0, value.length - lastTokenMatch[1].length);
        onChange(`${before}${item.insertText}`);
      } else {
        onChange(`${value}${item.insertText}`);
      }
      setShowSuggestions(false);
      inputRef.current?.focus();
    },
    [value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (showSuggestions) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          return;
        }
        if (e.key === 'Tab' || e.key === 'Enter') {
          if (suggestions[selectedIndex]) {
            e.preventDefault();
            insertSuggestion(suggestions[selectedIndex]);
            if (e.key === 'Enter') onEvaluate(value);
          }
          return;
        }
        if (e.key === 'Escape') {
          setShowSuggestions(false);
          return;
        }
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        onEvaluate(value);
        onNavigate?.('down');
      } else if (e.key === 'Tab') {
        e.preventDefault();
        onEvaluate(value);
        onNavigate?.(e.shiftKey ? 'left' : 'right');
      } else if (e.key === 'Escape') {
        onChange('');
      }
    },
    [
      showSuggestions,
      suggestions,
      selectedIndex,
      insertSuggestion,
      onEvaluate,
      onNavigate,
      value,
      onChange,
    ]
  );

  const helpText = useMemo(() => {
    if (!showSuggestions || !suggestions[selectedIndex]) return null;
    const item = suggestions[selectedIndex];
    if (item.type === 'function') {
      const fnHelp = FormulaAutoCompleteEngine.getFunctionHelp(item.text);
      return fnHelp?.syntax ?? null;
    }
    return item.description;
  }, [showSuggestions, suggestions, selectedIndex]);

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'flex items-center w-full border border-[var(--border-subtle)] bg-[var(--bg-surface)]',
          'rounded-t-lg overflow-hidden shadow-sm h-10',
          disabled && 'opacity-50 pointer-events-none',
          errors.length > 0 && 'border-red-400'
        )}
      >
        <div
          className="flex items-center justify-center px-3 border-r border-[var(--border-subtle)] bg-[var(--bg-muted)] min-w-[72px]"
          aria-live="polite"
          aria-label={`Active cell: ${activeCell}`}
        >
          <span className="text-xs font-bold text-[var(--accent-primary)] tabular-nums font-mono">
            {activeCell}
          </span>
        </div>
        <div className="flex items-center justify-center px-2.5 text-[var(--text-muted)] italic font-serif select-none border-r border-[var(--border-subtle)]">
          <span className="text-sm font-bold opacity-60">fx</span>
        </div>
        <input
          ref={inputRef}
          type="text"
          className="flex-1 h-full bg-transparent px-3 py-2 text-sm font-mono text-[var(--text-primary)] outline-none placeholder:italic placeholder:opacity-40"
          placeholder="Enter value or formula (e.g. =SUM(A1:A10))"
          aria-label="Formula input"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-controls="formula-suggestions"
          aria-activedescendant={
            showSuggestions && suggestions[selectedIndex]
              ? `suggestion-${selectedIndex}`
              : undefined
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.startsWith('=') && suggestions.length > 0) setShowSuggestions(true);
          }}
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 150);
          }}
          disabled={disabled}
        />
        {errors.length > 0 && (
          <div
            className="flex items-center px-2 text-red-500"
            role="alert"
            title={errors.join('; ')}
          >
            <AlertTriangle className="h-4 w-4" />
          </div>
        )}
        <div className="flex items-center px-1 border-l border-[var(--border-subtle)] bg-[var(--bg-muted)]">
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1.5 rounded-md hover:bg-red-50 dark:bg-red-900/20 text-red-400 hover:text-red-600 transition-colors"
            title="Cancel (Esc)"
            aria-label="Cancel formula"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onEvaluate(value)}
            className="p-1.5 rounded-md hover:bg-green-50 dark:bg-green-900/20 text-green-500 hover:text-green-700 transition-colors"
            title="Confirm (Enter)"
            aria-label="Confirm formula"
          >
            <Check className="h-4 w-4" />
          </button>
        </div>
      </div>
      {showSuggestions && (
        <div
          id="formula-suggestions"
          ref={listRef}
          className="absolute z-50 w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-b-lg shadow-xl max-h-[280px] overflow-y-auto"
          role="listbox"
          aria-label="Formula suggestions"
        >
          {suggestions.map((item, idx) => (
            <button
              key={`${item.type}-${item.text}`}
              id={`suggestion-${idx}`}
              type="button"
              role="option"
              aria-selected={idx === selectedIndex}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                idx === selectedIndex
                  ? 'bg-[var(--accent-primary)]/10'
                  : 'hover:bg-[var(--bg-hover)]'
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                insertSuggestion(item);
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <span
                className={cn(
                  'flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold font-mono',
                  item.type === 'function' && 'bg-blue-100 text-blue-700',
                  item.type === 'cell' && 'bg-emerald-100 text-emerald-700',
                  item.type === 'named' && 'bg-purple-100 text-purple-700'
                )}
              >
                {item.type === 'function' ? 'fn' : item.type === 'cell' ? '#' : '~'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-[var(--text-primary)]">
                    {item.text}
                  </span>
                  {item.category && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)]">
                      {item.category}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] truncate">
                  {item.description}
                </div>
              </div>
            </button>
          ))}
          {helpText && (
            <div className="sticky bottom-0 px-3 py-2 bg-[var(--bg-muted)] border-t border-[var(--border-subtle)]">
              <span className="text-[10px] font-mono text-[var(--text-muted)]">{helpText}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
