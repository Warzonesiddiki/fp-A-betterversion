// @money-ast-allow Reason: String cursor position: value.length - currentToken.length is character-index arithmetic, not money
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Check, X, FlaskConical } from 'lucide-react';
import { cn } from '@/utils/cn';
import { FormulaAutocomplete } from './formula/FormulaAutocomplete';
import type { FormulaFunction } from './formula/formulaData';

export interface FormulaBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onEvaluate?: (result: number) => void;
  activeCell?: string;
  disabled?: boolean;
  className?: string;
}

export function FormulaBar({
  value = '',
  onChange,
  onEvaluate,
  activeCell,
  disabled = false,
  className,
}: FormulaBarProps) {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentToken = useMemo(() => {
    if (!value.startsWith('=')) return '';
    const afterEquals = value.slice(1);
    const match = afterEquals.match(/([A-Z_]+)$/i);
    return match ? match[1]!.toUpperCase() : '';
  }, [value]);

  useEffect(() => {
    setShowAutocomplete(currentToken.length >= 2);
  }, [currentToken]);

  const insertFunction = useCallback(
    (fn: FormulaFunction) => {
      const beforeToken = value.slice(0, value.length - currentToken.length);
      onChange?.(`${beforeToken}${fn.name}(`);
      setShowAutocomplete(false);
      inputRef.current?.focus();
    },
    [value, currentToken, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (showAutocomplete) {
        if (['ArrowDown', 'ArrowUp', 'Tab', 'Enter', 'Escape'].includes(e.key)) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('formula-autocomplete-key', { detail: e.key }));
        }
        return;
      }
      if (e.key === 'Enter') {
        onEvaluate?.(0);
      } else if (e.key === 'Escape') {
        onChange?.('');
      }
    },
    [showAutocomplete, onEvaluate, onChange]
  );

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'flex items-center w-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] rounded-t-lg overflow-hidden shadow-sm h-10',
          disabled && 'opacity-50 pointer-events-none'
        )}
      >
        <div
          className="flex items-center justify-center px-4 border-r border-[var(--border-subtle)] bg-gray-50 dark:bg-gray-900 min-w-[80px]"
          aria-live="polite"
          aria-label={`Active cell: ${activeCell || 'none'}`}
        >
          <span className="text-xs font-bold text-blue-600 uppercase tabular-nums">
            {activeCell || '---'}
          </span>
        </div>

        <div className="flex items-center justify-center px-3 text-[var(--text-secondary)] italic font-serif select-none border-r border-gray-100 dark:border-gray-800">
          <span className="text-sm font-bold opacity-60">fx</span>
        </div>

        <div className="flex-1 relative group">
          <input
            ref={inputRef}
            type="text"
            className="w-full h-full bg-transparent px-3 py-2 text-sm font-mono text-[var(--text-primary)] outline-none placeholder:italic placeholder:opacity-40"
            placeholder="Enter formula (e.g., =SUM(C2:C10) * 1.05)"
            aria-label="Formula input"
            role="combobox"
            aria-expanded={showAutocomplete}
            aria-controls="formula-autocomplete"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (currentToken.length >= 2) {
                setShowAutocomplete(true);
              }
            }}
            disabled={disabled}
          />
          {!value && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <FlaskConical className="h-3.5 w-3.5 text-amber-700" />
              <span className="text-[10px] font-medium text-amber-600">Pure Calculation</span>
            </div>
          )}
        </div>

        <div className="flex items-center px-1 border-l border-[var(--border-subtle)] bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={() => onChange?.('')}
            className="p-1.5 rounded-md hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
            title="Cancel (Esc)"
            aria-label="Cancel formula"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEvaluate?.(0)}
            className="p-1.5 rounded-md hover:bg-green-50 text-green-700 hover:text-green-700 transition-colors"
            title="Evaluate (Enter)"
            aria-label="Confirm formula"
          >
            <Check className="h-4 w-4" />
          </button>
        </div>
      </div>

      <FormulaAutocomplete
        value={value}
        show={showAutocomplete}
        onSelect={insertFunction}
        onClose={() => setShowAutocomplete(false)}
      />
    </div>
  );
}
