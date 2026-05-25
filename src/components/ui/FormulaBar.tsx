import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Check, X, FlaskConical } from 'lucide-react';
import { cn } from '@/utils/cn';

interface FormulaFunction {
  name: string;
  category: string;
  syntax: string;
  description: string;
  params: string[];
}

const FUNCTIONS: FormulaFunction[] = [
  // Lookup
  {
    name: 'VLOOKUP',
    category: 'Lookup',
    syntax: 'VLOOKUP(lookup_value, table_array, col_index, [range_lookup])',
    description: 'Search vertically for a value',
    params: ['lookup_value', 'table_array', 'col_index', 'range_lookup'],
  },
  {
    name: 'HLOOKUP',
    category: 'Lookup',
    syntax: 'HLOOKUP(lookup_value, table_array, row_index, [range_lookup])',
    description: 'Search horizontally for a value',
    params: ['lookup_value', 'table_array', 'row_index', 'range_lookup'],
  },
  {
    name: 'INDEX',
    category: 'Lookup',
    syntax: 'INDEX(array, row_num, [col_num])',
    description: 'Return a value from a table by position',
    params: ['array', 'row_num', 'col_num'],
  },
  {
    name: 'MATCH',
    category: 'Lookup',
    syntax: 'MATCH(lookup_value, lookup_array, [match_type])',
    description: 'Return position of a value in a range',
    params: ['lookup_value', 'lookup_array', 'match_type'],
  },
  {
    name: 'XLOOKUP',
    category: 'Lookup',
    syntax: 'XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found])',
    description: 'Modern lookup with fallback',
    params: ['lookup_value', 'lookup_array', 'return_array', 'if_not_found'],
  },
  {
    name: 'OFFSET',
    category: 'Lookup',
    syntax: 'OFFSET(reference, rows, cols, [height], [width])',
    description: 'Return a range offset from a reference',
    params: ['reference', 'rows', 'cols', 'height', 'width'],
  },
  // Math
  {
    name: 'SUM',
    category: 'Math',
    syntax: 'SUM(number1, [number2], ...)',
    description: 'Sum all numbers',
    params: ['number1', 'number2'],
  },
  {
    name: 'SUMIF',
    category: 'Math',
    syntax: 'SUMIF(range, criteria, [sum_range])',
    description: 'Sum with condition',
    params: ['range', 'criteria', 'sum_range'],
  },
  {
    name: 'SUMIFS',
    category: 'Math',
    syntax: 'SUMIFS(sum_range, criteria_range1, criteria1, ...)',
    description: 'Sum with multiple conditions',
    params: ['sum_range', 'criteria_range1', 'criteria1'],
  },
  {
    name: 'SUMPRODUCT',
    category: 'Math',
    syntax: 'SUMPRODUCT(array1, [array2], ...)',
    description: 'Sum of products of arrays',
    params: ['array1', 'array2'],
  },
  {
    name: 'COUNT',
    category: 'Math',
    syntax: 'COUNT(value1, [value2], ...)',
    description: 'Count numbers',
    params: ['value1', 'value2'],
  },
  {
    name: 'COUNTIF',
    category: 'Math',
    syntax: 'COUNTIF(range, criteria)',
    description: 'Count with condition',
    params: ['range', 'criteria'],
  },
  {
    name: 'COUNTIFS',
    category: 'Math',
    syntax: 'COUNTIFS(range1, criteria1, ...)',
    description: 'Count with multiple conditions',
    params: ['range1', 'criteria1'],
  },
  {
    name: 'AVERAGE',
    category: 'Math',
    syntax: 'AVERAGE(number1, [number2], ...)',
    description: 'Average of numbers',
    params: ['number1', 'number2'],
  },
  {
    name: 'AVERAGEIF',
    category: 'Math',
    syntax: 'AVERAGEIF(range, criteria, [average_range])',
    description: 'Average with condition',
    params: ['range', 'criteria', 'average_range'],
  },
  {
    name: 'AVERAGEIFS',
    category: 'Math',
    syntax: 'AVERAGEIFS(avg_range, criteria_range1, criteria1, ...)',
    description: 'Average with multiple conditions',
    params: ['avg_range', 'criteria_range1', 'criteria1'],
  },
  {
    name: 'MIN',
    category: 'Math',
    syntax: 'MIN(number1, [number2], ...)',
    description: 'Minimum value',
    params: ['number1', 'number2'],
  },
  {
    name: 'MAX',
    category: 'Math',
    syntax: 'MAX(number1, [number2], ...)',
    description: 'Maximum value',
    params: ['number1', 'number2'],
  },
  {
    name: 'ABS',
    category: 'Math',
    syntax: 'ABS(number)',
    description: 'Absolute value',
    params: ['number'],
  },
  {
    name: 'ROUND',
    category: 'Math',
    syntax: 'ROUND(number, num_digits)',
    description: 'Round to digits',
    params: ['number', 'num_digits'],
  },
  {
    name: 'ROUNDUP',
    category: 'Math',
    syntax: 'ROUNDUP(number, num_digits)',
    description: 'Round up',
    params: ['number', 'num_digits'],
  },
  {
    name: 'ROUNDDOWN',
    category: 'Math',
    syntax: 'ROUNDDOWN(number, num_digits)',
    description: 'Round down',
    params: ['number', 'num_digits'],
  },
  {
    name: 'MOD',
    category: 'Math',
    syntax: 'MOD(number, divisor)',
    description: 'Remainder after division',
    params: ['number', 'divisor'],
  },
  {
    name: 'POWER',
    category: 'Math',
    syntax: 'POWER(number, power)',
    description: 'Raise to power',
    params: ['number', 'power'],
  },
  {
    name: 'SQRT',
    category: 'Math',
    syntax: 'SQRT(number)',
    description: 'Square root',
    params: ['number'],
  },
  // Financial
  {
    name: 'IRR',
    category: 'Financial',
    syntax: 'IRR(values, [guess])',
    description: 'Internal rate of return',
    params: ['values', 'guess'],
  },
  {
    name: 'XIRR',
    category: 'Financial',
    syntax: 'XIRR(values, dates, [guess])',
    description: 'IRR with specific dates',
    params: ['values', 'dates', 'guess'],
  },
  {
    name: 'NPV',
    category: 'Financial',
    syntax: 'NPV(rate, value1, [value2], ...)',
    description: 'Net present value',
    params: ['rate', 'value1', 'value2'],
  },
  {
    name: 'XNPV',
    category: 'Financial',
    syntax: 'XNPV(rate, values, dates)',
    description: 'NPV with specific dates',
    params: ['rate', 'values', 'dates'],
  },
  {
    name: 'PV',
    category: 'Financial',
    syntax: 'PV(rate, nper, pmt, [fv], [type])',
    description: 'Present value',
    params: ['rate', 'nper', 'pmt', 'fv', 'type'],
  },
  {
    name: 'FV',
    category: 'Financial',
    syntax: 'FV(rate, nper, pmt, [pv], [type])',
    description: 'Future value',
    params: ['rate', 'nper', 'pmt', 'pv', 'type'],
  },
  {
    name: 'PMT',
    category: 'Financial',
    syntax: 'PMT(rate, nper, pv, [fv], [type])',
    description: 'Payment per period',
    params: ['rate', 'nper', 'pv', 'fv', 'type'],
  },
  {
    name: 'IPMT',
    category: 'Financial',
    syntax: 'IPMT(rate, per, nper, pv, [fv], [type])',
    description: 'Interest payment',
    params: ['rate', 'per', 'nper', 'pv', 'fv', 'type'],
  },
  {
    name: 'PPMT',
    category: 'Financial',
    syntax: 'PPMT(rate, per, nper, pv, [fv], [type])',
    description: 'Principal payment',
    params: ['rate', 'per', 'nper', 'pv', 'fv', 'type'],
  },
  {
    name: 'NPER',
    category: 'Financial',
    syntax: 'NPER(rate, pmt, pv, [fv], [type])',
    description: 'Number of periods',
    params: ['rate', 'pmt', 'pv', 'fv', 'type'],
  },
  {
    name: 'RATE',
    category: 'Financial',
    syntax: 'RATE(nper, pmt, pv, [fv], [type], [guess])',
    description: 'Interest rate per period',
    params: ['nper', 'pmt', 'pv', 'fv', 'type', 'guess'],
  },
  {
    name: 'CAGR',
    category: 'Financial',
    syntax: 'CAGR(begin_value, end_value, periods)',
    description: 'Compound annual growth rate',
    params: ['begin_value', 'end_value', 'periods'],
  },
  {
    name: 'SLN',
    category: 'Financial',
    syntax: 'SLN(cost, salvage, life)',
    description: 'Straight-line depreciation',
    params: ['cost', 'salvage', 'life'],
  },
  {
    name: 'DB',
    category: 'Financial',
    syntax: 'DB(cost, salvage, life, period, [month])',
    description: 'Declining balance depreciation',
    params: ['cost', 'salvage', 'life', 'period', 'month'],
  },
  {
    name: 'SYD',
    category: 'Financial',
    syntax: 'SYD(cost, salvage, life, per)',
    description: 'Sum-of-years depreciation',
    params: ['cost', 'salvage', 'life', 'per'],
  },
  {
    name: 'DDB',
    category: 'Financial',
    syntax: 'DDB(cost, salvage, life, period, [factor])',
    description: 'Double declining depreciation',
    params: ['cost', 'salvage', 'life', 'period', 'factor'],
  },
  // Logical
  {
    name: 'IF',
    category: 'Logical',
    syntax: 'IF(logical_test, value_if_true, value_if_false)',
    description: 'Conditional value',
    params: ['logical_test', 'value_if_true', 'value_if_false'],
  },
  {
    name: 'IFS',
    category: 'Logical',
    syntax: 'IFS(test1, val1, test2, val2, ...)',
    description: 'Multiple conditions',
    params: ['test1', 'val1', 'test2', 'val2'],
  },
  {
    name: 'AND',
    category: 'Logical',
    syntax: 'AND(logical1, [logical2], ...)',
    description: 'All conditions true',
    params: ['logical1', 'logical2'],
  },
  {
    name: 'OR',
    category: 'Logical',
    syntax: 'OR(logical1, [logical2], ...)',
    description: 'Any condition true',
    params: ['logical1', 'logical2'],
  },
  {
    name: 'NOT',
    category: 'Logical',
    syntax: 'NOT(logical)',
    description: 'Reverse logical',
    params: ['logical'],
  },
  {
    name: 'IFERROR',
    category: 'Logical',
    syntax: 'IFERROR(value, value_if_error)',
    description: 'Value or fallback on error',
    params: ['value', 'value_if_error'],
  },
  {
    name: 'IFNA',
    category: 'Logical',
    syntax: 'IFNA(value, value_if_na)',
    description: 'Value or fallback on #N/A',
    params: ['value', 'value_if_na'],
  },
  {
    name: 'SWITCH',
    category: 'Logical',
    syntax: 'SWITCH(expression, val1, result1, ..., [default])',
    description: 'Match and return',
    params: ['expression', 'val1', 'result1', 'default'],
  },
  // Text
  {
    name: 'CONCATENATE',
    category: 'Text',
    syntax: 'CONCATENATE(text1, [text2], ...)',
    description: 'Join text strings',
    params: ['text1', 'text2'],
  },
  {
    name: 'LEFT',
    category: 'Text',
    syntax: 'LEFT(text, [num_chars])',
    description: 'Left characters',
    params: ['text', 'num_chars'],
  },
  {
    name: 'RIGHT',
    category: 'Text',
    syntax: 'RIGHT(text, [num_chars])',
    description: 'Right characters',
    params: ['text', 'num_chars'],
  },
  {
    name: 'MID',
    category: 'Text',
    syntax: 'MID(text, start_num, num_chars)',
    description: 'Middle characters',
    params: ['text', 'start_num', 'num_chars'],
  },
  {
    name: 'LEN',
    category: 'Text',
    syntax: 'LEN(text)',
    description: 'Text length',
    params: ['text'],
  },
  {
    name: 'TRIM',
    category: 'Text',
    syntax: 'TRIM(text)',
    description: 'Remove extra spaces',
    params: ['text'],
  },
  {
    name: 'UPPER',
    category: 'Text',
    syntax: 'UPPER(text)',
    description: 'To uppercase',
    params: ['text'],
  },
  {
    name: 'LOWER',
    category: 'Text',
    syntax: 'LOWER(text)',
    description: 'To lowercase',
    params: ['text'],
  },
  {
    name: 'SUBSTITUTE',
    category: 'Text',
    syntax: 'SUBSTITUTE(text, old_text, new_text, [instance])',
    description: 'Replace text',
    params: ['text', 'old_text', 'new_text', 'instance'],
  },
  {
    name: 'TEXT',
    category: 'Text',
    syntax: 'TEXT(value, format_text)',
    description: 'Format number as text',
    params: ['value', 'format_text'],
  },
  // Date
  {
    name: 'DATE',
    category: 'Date',
    syntax: 'DATE(year, month, day)',
    description: 'Create a date',
    params: ['year', 'month', 'day'],
  },
  {
    name: 'YEAR',
    category: 'Date',
    syntax: 'YEAR(date)',
    description: 'Year from date',
    params: ['date'],
  },
  {
    name: 'MONTH',
    category: 'Date',
    syntax: 'MONTH(date)',
    description: 'Month from date',
    params: ['date'],
  },
  {
    name: 'DAY',
    category: 'Date',
    syntax: 'DAY(date)',
    description: 'Day from date',
    params: ['date'],
  },
  {
    name: 'EOMONTH',
    category: 'Date',
    syntax: 'EOMONTH(start_date, months)',
    description: 'End of month',
    params: ['start_date', 'months'],
  },
  {
    name: 'EDATE',
    category: 'Date',
    syntax: 'EDATE(start_date, months)',
    description: 'Date +/- months',
    params: ['start_date', 'months'],
  },
  {
    name: 'DATEDIF',
    category: 'Date',
    syntax: 'DATEDIF(start_date, end_date, unit)',
    description: 'Difference between dates',
    params: ['start_date', 'end_date', 'unit'],
  },
  {
    name: 'NETWORKDAYS',
    category: 'Date',
    syntax: 'NETWORKDAYS(start_date, end_date, [holidays])',
    description: 'Working days between dates',
    params: ['start_date', 'end_date', 'holidays'],
  },
  {
    name: 'WORKDAY',
    category: 'Date',
    syntax: 'WORKDAY(start_date, days, [holidays])',
    description: 'Date after working days',
    params: ['start_date', 'days', 'holidays'],
  },
  // Statistical
  {
    name: 'MEDIAN',
    category: 'Statistical',
    syntax: 'MEDIAN(number1, [number2], ...)',
    description: 'Median value',
    params: ['number1', 'number2'],
  },
  {
    name: 'MODE',
    category: 'Statistical',
    syntax: 'MODE(number1, [number2], ...)',
    description: 'Most frequent value',
    params: ['number1', 'number2'],
  },
  {
    name: 'STDEV',
    category: 'Statistical',
    syntax: 'STDEV(number1, [number2], ...)',
    description: 'Standard deviation (sample)',
    params: ['number1', 'number2'],
  },
  {
    name: 'STDEVP',
    category: 'Statistical',
    syntax: 'STDEVP(number1, [number2], ...)',
    description: 'Standard deviation (population)',
    params: ['number1', 'number2'],
  },
  {
    name: 'VAR',
    category: 'Statistical',
    syntax: 'VAR(number1, [number2], ...)',
    description: 'Variance (sample)',
    params: ['number1', 'number2'],
  },
  {
    name: 'VARP',
    category: 'Statistical',
    syntax: 'VARP(number1, [number2], ...)',
    description: 'Variance (population)',
    params: ['number1', 'number2'],
  },
  {
    name: 'PERCENTILE',
    category: 'Statistical',
    syntax: 'PERCENTILE(array, k)',
    description: 'k-th percentile',
    params: ['array', 'k'],
  },
  {
    name: 'CORREL',
    category: 'Statistical',
    syntax: 'CORREL(array1, array2)',
    description: 'Correlation coefficient',
    params: ['array1', 'array2'],
  },
  {
    name: 'FORECAST',
    category: 'Statistical',
    syntax: 'FORECAST(x, known_ys, known_xs)',
    description: 'Linear forecast',
    params: ['x', 'known_ys', 'known_xs'],
  },
];

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
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Detect if user is typing a function name
  const currentToken = useMemo(() => {
    if (!value.startsWith('=')) return '';
    const afterEquals = value.slice(1);
    const match = afterEquals.match(/([A-Z_]+)$/i);
    return match ? match[1].toUpperCase() : '';
  }, [value]);

  // Filter functions based on what user is typing
  const filteredFunctions = useMemo(() => {
    if (!currentToken) return [];
    return FUNCTIONS.filter(
      (fn) =>
        fn.name.startsWith(currentToken) && (!selectedCategory || fn.category === selectedCategory)
    ).slice(0, 10);
  }, [currentToken, selectedCategory]);

  // Show autocomplete when typing a function
  useEffect(() => {
    setShowAutocomplete(currentToken.length >= 2 && filteredFunctions.length > 0);
    setAutocompleteIndex(0);
  }, [currentToken, filteredFunctions.length]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[autocompleteIndex] as HTMLElement;
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [autocompleteIndex]);

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
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setAutocompleteIndex((prev) => Math.min(prev + 1, filteredFunctions.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setAutocompleteIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Tab' || e.key === 'Enter') {
          if (filteredFunctions[autocompleteIndex]) {
            e.preventDefault();
            insertFunction(filteredFunctions[autocompleteIndex]);
          }
        } else if (e.key === 'Escape') {
          setShowAutocomplete(false);
        }
        return;
      }

      if (e.key === 'Enter') {
        onEvaluate?.(0);
      } else if (e.key === 'Escape') {
        onChange?.('');
      }
    },
    [showAutocomplete, filteredFunctions, autocompleteIndex, insertFunction, onEvaluate, onChange]
  );

  const categories = useMemo(() => {
    const cats = new Set(FUNCTIONS.map((fn) => fn.category));
    return ['All', ...Array.from(cats)];
  }, []);

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'flex items-center w-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] rounded-t-lg overflow-hidden shadow-sm h-10',
          disabled && 'opacity-50 pointer-events-none'
        )}
      >
        {/* Active Cell Reference */}
        <div
          className="flex items-center justify-center px-4 border-r border-[var(--border-subtle)] bg-gray-50 dark:bg-gray-900 min-w-[80px]"
          aria-live="polite"
          aria-label={`Active cell: ${activeCell || 'none'}`}
        >
          <span className="text-xs font-bold text-blue-600 uppercase tabular-nums">
            {activeCell || '---'}
          </span>
        </div>

        {/* FX Icon */}
        <div className="flex items-center justify-center px-3 text-[var(--text-secondary)] italic font-serif select-none border-r border-gray-100 dark:border-gray-800">
          <span className="text-sm font-bold opacity-60">fx</span>
        </div>

        {/* Input Field */}
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
            aria-activedescendant={
              showAutocomplete && filteredFunctions[autocompleteIndex]
                ? `fn-${filteredFunctions[autocompleteIndex].name}`
                : undefined
            }
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (currentToken.length >= 2 && filteredFunctions.length > 0) {
                setShowAutocomplete(true);
              }
            }}
            disabled={disabled}
          />
          {!value && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <FlaskConical className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[10px] font-medium text-amber-600">Pure Calculation</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center px-1 border-l border-[var(--border-subtle)] bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={() => onChange?.('')}
            className="p-1.5 rounded-md hover:bg-red-50 text-red-400 hover:fin-negative transition-colors"
            title="Cancel (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEvaluate?.(0)}
            className="p-1.5 rounded-md hover:bg-green-50 text-green-400 hover:fin-positive transition-colors"
            title="Evaluate (Enter)"
          >
            <Check className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {showAutocomplete && (
        <div
          id="formula-autocomplete"
          className="absolute z-50 w-full bg-white dark:bg-gray-800 border border-[var(--border-subtle)] rounded-b-lg shadow-xl max-h-[320px] overflow-hidden flex flex-col"
          role="listbox"
          aria-label="Formula suggestions"
        >
          {/* Category filter */}
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
                  setSelectedCategory(cat === 'All' ? null : cat);
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Function list */}
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
                  insertFunction(fn);
                }}
                onMouseEnter={() => setAutocompleteIndex(idx)}
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
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[var(--text-muted)]">
                      {fn.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {fn.description}
                  </div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-mono truncate">
                    {fn.syntax}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Selected function tooltip */}
          {filteredFunctions[autocompleteIndex] && (
            <div className="flex-shrink-0 px-3 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Parameters
              </div>
              <div className="flex flex-wrap gap-1">
                {filteredFunctions[autocompleteIndex].params.map((param, i) => (
                  <span
                    key={param}
                    className={cn(
                      'px-1.5 py-0.5 text-[10px] font-mono rounded',
                      i === 0
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 dark:bg-gray-800 text-[var(--text-secondary)]'
                    )}
                  >
                    {param}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
