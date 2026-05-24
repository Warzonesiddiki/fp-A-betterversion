import { useCallback, useMemo, useRef, useState } from 'react';
import { FunctionSquare, AlertCircle, CheckCircle, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  ReportBuilderEngine,
  type FormulaCellContent,
  type NumberFormat,
} from '@/engines/ReportBuilderEngine';

/* ────────────────── props ────────────────── */

export interface FormulaBarProps {
  currentExpression?: string;
  currentFormat?: NumberFormat;
  currentDecimals?: number;
  currentLabel?: string;
  cellPosition?: string; // e.g. "A1", "B3"
  onApplyFormula: (content: FormulaCellContent) => void;
  onCancel: () => void;
  className?: string;
}

/* ────────────────── built-in functions ────────────────── */

interface FormulaFunction {
  name: string;
  description: string;
  syntax: string;
  example: string;
}

const FORMULA_FUNCTIONS: FormulaFunction[] = [
  { name: 'SUM', description: 'Sum of values', syntax: 'SUM(A1:A10)', example: 'SUM(A1:A5)' },
  { name: 'AVG', description: 'Average of values', syntax: 'AVG(A1:A10)', example: 'AVG(B1:B4)' },
  { name: 'MIN', description: 'Minimum value', syntax: 'MIN(A1:A10)', example: 'MIN(C1:C3)' },
  { name: 'MAX', description: 'Maximum value', syntax: 'MAX(A1:A10)', example: 'MAX(D1:D5)' },
  { name: 'ABS', description: 'Absolute value', syntax: 'ABS(A1)', example: 'ABS(A1-B1)' },
  {
    name: 'ROUND',
    description: 'Round to decimals',
    syntax: 'ROUND(A1, 2)',
    example: 'ROUND(A1/B1, 1)',
  },
  {
    name: 'IF',
    description: 'Conditional',
    syntax: 'IF(A1>0, A1, 0)',
    example: 'IF(A1>B1, A1-B1, 0)',
  },
  {
    name: 'PCT',
    description: 'Percentage change',
    syntax: 'PCT(A1, B1)',
    example: 'PCT(actual, budget)',
  },
];

/* ────────────────── main component ────────────────── */

export function FormulaBar({
  currentExpression = '',
  currentFormat = 'currency',
  currentDecimals = 0,
  currentLabel = '',
  cellPosition,
  onApplyFormula,
  onCancel,
  className,
}: FormulaBarProps) {
  const [expression, setExpression] = useState(currentExpression);
  const [format, setFormat] = useState<NumberFormat>(currentFormat);
  const [decimals, setDecimals] = useState(currentDecimals);
  const [label, setLabel] = useState(currentLabel);
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validationResult = useMemo(() => {
    if (!expression.trim()) return null;

    try {
      const refs = ReportBuilderEngine.parseFormulaReferences(expression);
      const dummyValues: Record<string, number> = {};
      for (const ref of refs) {
        dummyValues[ref] = 1;
      }
      if (refs.length > 0) {
        ReportBuilderEngine.evaluateFormula(expression, dummyValues);
      } else {
        ReportBuilderEngine.safeEvaluate(expression);
      }
      return { valid: true };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Invalid formula';
      return { valid: false, error: message };
    }
  }, [expression]);

  const handleApply = useCallback(() => {
    if (!expression.trim()) return;
    if (validationResult && !validationResult.valid) return;

    onApplyFormula({
      expression: expression.trim(),
      format,
      decimals,
      label: label.trim() || undefined,
    });
  }, [expression, format, decimals, label, validationResult, onApplyFormula]);

  const handleInsertFunction = useCallback(
    (fn: FormulaFunction) => {
      const input = inputRef.current;
      if (input) {
        const start = input.selectionStart ?? expression.length;
        const end = input.selectionEnd ?? expression.length;
        const before = expression.slice(0, start);
        const after = expression.slice(end);
        // Insert just the function name with parentheses
        const insertion = fn.name + '()';
        setExpression(before + insertion + after);
        // Focus and place cursor inside parentheses
        setTimeout(() => {
          input.focus();
          const newPos = start + fn.name.length + 1;
          input.setSelectionRange(newPos, newPos);
        }, 0);
      } else {
        setExpression((prev) => prev + fn.name + '()');
      }
    },
    [expression]
  );

  const handleInsertReference = useCallback(
    (ref: string) => {
      const input = inputRef.current;
      if (input) {
        const start = input.selectionStart ?? expression.length;
        const end = input.selectionEnd ?? expression.length;
        const before = expression.slice(0, start);
        const after = expression.slice(end);
        setExpression(before + ref + after);
        setTimeout(() => {
          input.focus();
          const newPos = start + ref.length;
          input.setSelectionRange(newPos, newPos);
        }, 0);
      } else {
        setExpression((prev) => prev + ref);
      }
    },
    [expression]
  );

  // Quick reference buttons
  const quickRefs = useMemo(() => {
    const refs: string[] = [];
    for (let col = 0; col < 5; col++) {
      for (let row = 1; row <= 3; row++) {
        refs.push(ReportBuilderEngine.columnIndexToLetter(col) + row);
      }
    }
    return refs;
  }, []);

  return (
    <div className={cn('bg-slate-900 border border-slate-700 rounded-lg space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-2">
          <FunctionSquare className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-semibold text-white">Formula Bar</span>
          {cellPosition && (
            <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
              {cellPosition}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={cn(
              'text-xs px-2 py-1 rounded transition-colors',
              showHelp ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-white'
            )}
          >
            Functions
          </button>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Cancel formula editing"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expression input */}
      <div className="px-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">=</span>
          <input
            ref={inputRef}
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleApply();
              }
              if (e.key === 'Escape') {
                onCancel();
              }
            }}
            placeholder="Enter formula (e.g., A1+B1*2, (A1-B1)/B1*100)"
            className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white font-mono placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
            aria-label="Formula expression"
          />
        </div>

        {/* Validation indicator */}
        {validationResult && (
          <div
            className={cn(
              'flex items-center gap-1.5 mt-1.5 text-xs',
              validationResult.valid ? 'text-green-400' : 'text-red-400'
            )}
          >
            {validationResult.valid ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <AlertCircle className="h-3 w-3" />
            )}
            {validationResult.valid ? 'Valid formula' : validationResult.error}
          </div>
        )}
      </div>

      {/* Quick cell references */}
      <div className="px-4">
        <p className="text-xs text-slate-500 mb-1.5">Insert reference</p>
        <div className="flex flex-wrap gap-1">
          {quickRefs.map((ref) => (
            <button
              key={ref}
              onClick={() => handleInsertReference(ref)}
              className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:border-blue-500 hover:text-blue-400 transition-colors"
            >
              {ref}
            </button>
          ))}
        </div>
      </div>

      {/* Function help */}
      {showHelp && (
        <div className="px-4 pb-2">
          <p className="text-xs text-slate-500 mb-1.5">Available functions</p>
          <div className="space-y-1 max-h-[160px] overflow-y-auto">
            {FORMULA_FUNCTIONS.map((fn) => (
              <button
                key={fn.name}
                onClick={() => handleInsertFunction(fn)}
                className="w-full text-left flex items-start gap-2 px-2 py-1.5 rounded hover:bg-slate-800 transition-colors"
              >
                <span className="text-xs font-mono text-blue-400 font-semibold min-w-[48px]">
                  {fn.name}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-slate-300">{fn.description}</span>
                  <span className="text-xs text-slate-600 ml-2 font-mono">{fn.syntax}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Options row */}
      <div className="px-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-slate-500">Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as NumberFormat)}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
            aria-label="Number format"
          >
            <option value="currency">Currency</option>
            <option value="percentage">Percentage</option>
            <option value="compact">Compact</option>
            <option value="wholenumber">Whole Number</option>
            <option value="decimal">Decimal</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-slate-500">Decimals</label>
          <input
            type="number"
            value={decimals}
            onChange={(e) =>
              setDecimals(Math.max(0, Math.min(10, parseInt(e.target.value, 10) || 0)))
            }
            className="w-14 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
            min={0}
            max={10}
            aria-label="Decimal places"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-1 min-w-[120px]">
          <label className="text-xs text-slate-500">Label</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Display label..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder:text-slate-600"
            aria-label="Formula display label"
          />
        </div>
      </div>

      {/* Apply button */}
      <div className="px-4 pb-3">
        <button
          onClick={handleApply}
          disabled={!expression.trim() || (validationResult != null && !validationResult.valid)}
          className={cn(
            'w-full px-3 py-2 rounded text-sm font-medium transition-colors',
            !expression.trim() || (validationResult != null && !validationResult.valid)
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-500'
          )}
        >
          Apply Formula
        </button>
      </div>
    </div>
  );
}
