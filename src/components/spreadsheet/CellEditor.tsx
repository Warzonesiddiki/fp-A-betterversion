/**
 * CellEditor — Inline cell editor with Tab/Enter keyboard navigation
 * Overlays on the active cell for spreadsheet-like editing experience
 */
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { FormulaAutoCompleteEngine } from '@/engines/FormulaAutoCompleteEngine';

interface AutocompleteSuggestion {
  text: string;
  type: 'function' | 'cell' | 'range' | 'named' | 'operator';
  description: string;
  category?: string;
  insertText: string;
}

export type CellValueType = 'text' | 'number' | 'currency' | 'percent' | 'formula' | 'date';

export interface CellEditorProps {
  /** Current raw value of the cell */
  value: string;
  /** Column field name */
  field: string;
  /** Row index */
  rowIndex: number;
  /** Column type for validation */
  valueType?: CellValueType;
  /** Called when editing commits */
  onCommit: (value: string, moveDirection?: NavigationDirection) => void;
  /** Called when editing is cancelled */
  onCancel: () => void;
  /** Called when the editor wants to navigate to another cell */
  onNavigate?: (direction: NavigationDirection) => void;
  /** Named ranges for autocomplete */
  namedRanges?: string[];
  /** Whether the editor is visible */
  isOpen: boolean;
  /** CSS positioning overrides */
  style?: React.CSSProperties;
  className?: string;
}

export type NavigationDirection = 'up' | 'down' | 'left' | 'right';

export function CellEditor({
  value,
  valueType = 'text',
  onCommit,
  onCancel,
  namedRanges,
  isOpen,
  style,
  className,
}: CellEditorProps) {
  const [editValue, setEditValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync value when cell changes
  useEffect(() => {
    setEditValue(value);
    setShowSuggestions(false);
    setSuggestionIndex(0);
  }, [value]);

  // Focus input when editor opens
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [isOpen]);

  // Derived state
  const suggestions = useMemo<AutocompleteSuggestion[]>(() => {
    if (!editValue.startsWith('=') || editValue.length < 2) return [];
    return FormulaAutoCompleteEngine.suggest(editValue, { namedRanges });
  }, [editValue, namedRanges]);

  useEffect(() => {
    setShowSuggestions(
      editValue.startsWith('=') && editValue.length >= 2 && suggestions.length > 0
    );
    setSuggestionIndex(0);
  }, [editValue, suggestions.length]);

  const insertSuggestion = useCallback(
    (item: AutocompleteSuggestion) => {
      const lastTokenMatch = editValue.match(/([A-Za-z0-9_$]+)$/);
      if (lastTokenMatch && lastTokenMatch[1]!) {
        const before = editValue.slice(0, editValue.length - lastTokenMatch[1]!.length);
        setEditValue(`${before}${item.insertText}`);
      } else {
        setEditValue(`${editValue}${item.insertText}`);
      }
      setShowSuggestions(false);
      inputRef.current?.focus();
    },
    [editValue]
  );

  const validateValue = useCallback(
    (val: string): boolean => {
      if (val === '' || val.startsWith('=')) return true;
      switch (valueType) {
        case 'number':
        case 'currency':
        case 'percent':
          return !isNaN(Number(val)) || val === '';
        case 'date':
          return !isNaN(Date.parse(val)) || val === '';
        default:
          return true;
      }
    },
    [valueType]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Autocomplete navigation
      if (showSuggestions) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSuggestionIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSuggestionIndex((prev) => Math.max(prev - 1, 0));
          return;
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          if (suggestions[suggestionIndex]!) {
            insertSuggestion(suggestions[suggestionIndex]!);
          }
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          if (suggestions[suggestionIndex]!) {
            insertSuggestion(suggestions[suggestionIndex]!);
          }
          // Don't commit yet — let user continue editing formula
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowSuggestions(false);
          return;
        }
        return;
      }

      // Standard cell editing navigation
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          if (validateValue(editValue)) {
            onCommit(editValue, e.shiftKey ? 'up' : 'down');
          }
          break;
        case 'Tab':
          e.preventDefault();
          if (validateValue(editValue)) {
            onCommit(editValue, e.shiftKey ? 'left' : 'right');
          }
          break;
        case 'Escape':
          e.preventDefault();
          onCancel();
          break;
      }
    },
    [
      showSuggestions,
      suggestions,
      suggestionIndex,
      insertSuggestion,
      editValue,
      validateValue,
      onCommit,
      onCancel,
    ]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  }, []);

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      // Don't commit if focus moved to suggestion list
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      if (relatedTarget?.closest('[role="listbox"]')) return;
      if (validateValue(editValue)) {
        onCommit(editValue);
      }
    },
    [editValue, validateValue, onCommit]
  );

  if (!isOpen) return null;

  const inputType =
    valueType === 'number' || valueType === 'currency' || valueType === 'percent'
      ? 'text' // Use text for formula support, validate on commit
      : 'text';

  return (
    <div className={cn('relative', className)} style={style}>
      <input
        ref={inputRef}
        type={inputType}
        className={cn(
          'w-full h-full px-2 py-1 text-sm font-mono bg-white dark:bg-gray-900 dark:bg-gray-900',
          'border-2 border-[var(--accent-primary)] rounded-sm shadow-lg',
          'outline-none z-50',
          'text-[var(--text-primary)]'
        )}
        value={editValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        aria-label="Edit cell"
        aria-autocomplete="list"
        aria-expanded={showSuggestions}
        aria-controls="cell-editor-suggestions"
        role="combobox"
      />

      {/* Inline autocomplete */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={listRef}
          id="cell-editor-suggestions"
          role="listbox"
          aria-label="Formula suggestions"
          className="absolute top-full left-0 z-[60] w-72 max-h-[200px] overflow-y-auto bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md shadow-xl mt-0.5"
        >
          {suggestions.map((item, idx) => (
            <button
              key={`${item.type}-${item.text}`}
              type="button"
              role="option"
              aria-selected={idx === suggestionIndex}
              className={cn(
                'w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors',
                idx === suggestionIndex
                  ? 'bg-[var(--accent-primary)]/10'
                  : 'hover:bg-[var(--bg-hover)]'
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                insertSuggestion(item);
              }}
              onMouseEnter={() => setSuggestionIndex(idx)}
            >
              <span className="text-xs font-bold font-mono text-[var(--accent-primary)]">
                {item.text}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] truncate flex-1">
                {item.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
