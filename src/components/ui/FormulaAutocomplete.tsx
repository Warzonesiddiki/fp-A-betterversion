import React from 'react';
import { cn } from '@/utils/cn';
import type { FormulaFunction } from './formulaFunctions';

export interface FormulaAutocompleteProps {
  filteredFunctions: FormulaFunction[];
  autocompleteIndex: number;
  categories: string[];
  selectedCategory: string | null;
  listRef: React.RefObject<HTMLDivElement | null>;
  onSelectCategory: (category: string | null) => void;
  onSelectFunction: (fn: FormulaFunction) => void;
  onHoverIndex: (index: number) => void;
}

export function FormulaAutocomplete({
  filteredFunctions,
  autocompleteIndex,
  categories,
  selectedCategory,
  listRef,
  onSelectCategory,
  onSelectFunction,
  onHoverIndex,
}: FormulaAutocompleteProps) {
  const selectedFn = filteredFunctions[autocompleteIndex];

  return (
    <div
      id="formula-autocomplete"
      className="absolute z-50 w-full bg-white dark:bg-gray-800 border border-[var(--border-subtle)] rounded-b-lg shadow-xl max-h-[320px] overflow-hidden flex flex-col"
      role="listbox"
      aria-label="Formula suggestions"
    >
      <div className="flex gap-1 px-2 py-1.5 border-b border-gray-100 dark:border-gray-800 overflow-x-auto flex-shrink-0">
        {categories.map((cat) => (
          <button
            key={cat}
            className={cn(
              'px-2 py-0.5 text-[10px] font-medium rounded-full whitespace-nowrap transition-colors',
              (cat === 'All' && !selectedCategory) || selectedCategory === cat
                ? 'bg-blue-100 text-blue-700'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
            )}
            onClick={(e) => {
              e.stopPropagation();
              onSelectCategory(cat === 'All' ? null : cat);
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div ref={listRef} className="overflow-y-auto max-h-[250px]">
        {filteredFunctions.map((fn, idx) => (
          <button
            key={fn.name}
            id={`fn-${fn.name}`}
            role="option"
            aria-selected={idx === autocompleteIndex}
            className={cn(
              'w-full flex items-start gap-3 px-3 py-2 text-left transition-colors',
              idx === autocompleteIndex ? 'bg-blue-50' : 'hover:bg-gray-50 dark:bg-gray-900'
            )}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelectFunction(fn);
            }}
            onMouseEnter={() => onHoverIndex(idx)}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-600 font-mono">
                {fn.name.slice(0, 2)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--text-primary)] font-mono">
                  {fn.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-[var(--text-muted)]">
                  {fn.category}
                </span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{fn.description}</div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-mono truncate">
                {fn.syntax}
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedFn && (
        <div className="flex-shrink-0 px-3 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
            Parameters
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedFn.params.map((param, i) => (
              <span
                key={param}
                className={cn(
                  'px-1.5 py-0.5 text-[10px] font-mono rounded',
                  i === 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-[var(--text-secondary)]'
                )}
              >
                {param}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
