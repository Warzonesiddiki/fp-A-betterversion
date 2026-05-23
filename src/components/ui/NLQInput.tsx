/**
 * NLQ Input — Natural Language Query search bar.
 * Type a question like "show Q3 revenue by region" and get auto-generated charts.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface NLQInputProps {
  onSubmit: (query: string) => void;
  isProcessing?: boolean;
  placeholder?: string;
  className?: string;
}

const SUGGESTIONS = [
  'Show Q3 revenue by region',
  'Compare budget vs actual expenses',
  'What is total profit this year?',
  'Trend of sales over time',
  'Expenses by department',
  'Show cash flow by quarter',
];

export function NLQInput({
  onSubmit,
  isProcessing = false,
  placeholder,
  className,
}: NLQInputProps) {
  const [value, setValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered =
    value.length > 0
      ? SUGGESTIONS.filter((s) => s.toLowerCase().includes(value.toLowerCase()))
      : SUGGESTIONS;

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isProcessing) return;
    onSubmit(trimmed);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  }, [value, isProcessing, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filtered.length) {
          setValue(filtered[selectedIndex]);
          onSubmit(filtered[selectedIndex]);
          setShowSuggestions(false);
          setSelectedIndex(-1);
        } else {
          handleSubmit();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    },
    [filtered, selectedIndex, handleSubmit, onSubmit]
  );

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  return (
    <div className={cn('relative w-full max-w-2xl', className)}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Ask a question about your financial data...'}
          disabled={isProcessing}
          className={cn(
            'w-full pl-10 pr-20 py-3 text-sm',
            'border rounded-lg bg-background',
            'focus:outline-none focus:ring-2 focus:ring-primary/50',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label="Natural language query input"
          aria-describedby="nlq-hint"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Sparkles className="h-4 w-4 text-primary" />
          )}
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {showSuggestions && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-md">
          {filtered.map((suggestion, i) => (
            <button
              key={suggestion}
              className={cn(
                'w-full px-4 py-2 text-left text-sm hover:bg-accent',
                i === selectedIndex && 'bg-accent'
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                setValue(suggestion);
                onSubmit(suggestion);
                setShowSuggestions(false);
              }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <Sparkles className="inline h-3 w-3 mr-2 text-primary" />
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <p id="nlq-hint" className="mt-1 text-xs text-muted-foreground">
        Try: "show Q3 revenue by region" or "compare budget vs actual"
      </p>
    </div>
  );
}
