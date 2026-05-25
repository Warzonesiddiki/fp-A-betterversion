import { useCallback, useMemo, useState } from 'react';
import { FormulaEngine } from '@/engines/FormulaEngine';
import type {
  CircularGroup,
  ConvergenceResult,
  IterativeConfig,
} from '@/engines/IterativeCalculationEngine';
import { DEFAULT_ITERATIVE_CONFIG } from '@/engines/IterativeCalculationEngine';
import {
  CircularReferenceWarning,
  CircularCellIndicator,
  useIterativeConfig,
} from '@/components/ui/CircularReferenceWarning';
import { cn } from '@/utils/cn';

// =============================================================================
// Spreadsheet Circular Reference Integration
// Connects FormulaEngine's circular detection to spreadsheet UI.
// Supports: debt schedules, interest-on-interest, working capital loops.
// =============================================================================

// --- Hook: useCircularDetection ---

export interface CircularDetectionResult {
  cycles: CircularGroup[];
  circularCells: Set<string>;
  hasCircular: boolean;
  convergence: ConvergenceResult | null;
  config: IterativeConfig;
  setConfig: (updates: Partial<IterativeConfig>) => void;
  resetConfig: () => void;
  recalculate: () => void;
  isRecalculating: boolean;
}

/**
 * Detect circular references in a set of cell formulas and manage iterative
 * calculation configuration. Designed for spreadsheet integration.
 *
 * @param cellFormulas - Map of cellRef -> formula string
 * @param recalcCell - Function to recalculate a single cell (evaluates its formula)
 * @param getCellValue - Function to get current cell value
 * @param setCellValue - Function to set cell value
 */
export function useCircularDetection(
  cellFormulas: Map<string, string>,
  recalcCell: (ref: string) => number,
  getCellValue: (ref: string) => number,
  setCellValue: (ref: string, value: number) => void
): CircularDetectionResult {
  const { config, setConfig, resetConfig } = useIterativeConfig();
  const [convergence, setConvergence] = useState<ConvergenceResult | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const analysis = useMemo(
    () => FormulaEngine.analyzeForCircularReferences(cellFormulas),
    [cellFormulas]
  );

  const recalculate = useCallback(() => {
    setIsRecalculating(true);
    try {
      const result = FormulaEngine.recalculateWithCircularSupport(
        cellFormulas,
        getCellValue,
        setCellValue,
        recalcCell,
        config
      );
      setConvergence(result.convergence);
    } finally {
      setIsRecalculating(false);
    }
  }, [cellFormulas, getCellValue, setCellValue, recalcCell, config]);

  return {
    cycles: analysis.cycles,
    circularCells: analysis.circularCells,
    hasCircular: analysis.hasCircular,
    convergence,
    config,
    setConfig,
    resetConfig,
    recalculate,
    isRecalculating,
  };
}

// --- Component: ConvergenceProgressIndicator ---

interface ConvergenceProgressIndicatorProps {
  convergence: ConvergenceResult;
  tolerance: number;
  className?: string;
}

/**
 * Visual indicator showing iterative convergence progress.
 * Renders a progress bar with iteration count and max-change sparkline.
 */
export function ConvergenceProgressIndicator({
  convergence,
  tolerance,
  className,
}: ConvergenceProgressIndicatorProps) {
  const progress =
    convergence.status === 'converged'
      ? 100
      : convergence.status === 'diverged'
        ? 0
        : convergence.history.length > 0
          ? Math.min(
              95,
              Math.max(
                5,
                ((Math.log10(convergence.history[0] + 1) - Math.log10(convergence.maxChange + 1)) /
                  (Math.log10(convergence.history[0] + 1) + 1)) *
                  100
              )
            )
          : 0;

  const statusColor =
    convergence.status === 'converged'
      ? 'bg-green-500'
      : convergence.status === 'diverged'
        ? 'bg-red-500'
        : 'bg-amber-500';

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div
          className="h-1.5 flex-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Convergence progress"
        >
          <div
            className={cn('h-full rounded-full transition-all duration-300', statusColor)}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs tabular-nums font-mono text-[var(--text-secondary)] whitespace-nowrap">
          {convergence.iterations} iter{convergence.iterations !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Sparkline of convergence history */}
      {convergence.history.length > 1 && (
        <div className="flex items-end gap-px h-4" aria-label="Convergence history chart">
          {convergence.history.slice(-20).map((val, i) => {
            const maxVal = Math.max(...convergence.history);
            const height = maxVal > 0 ? Math.max(2, (val / maxVal) * 100) : 0;
            const isLast = i === Math.min(convergence.history.length, 20) - 1;
            return (
              <div
                key={i}
                className={cn(
                  'flex-1 min-w-[2px] rounded-t transition-all',
                  isLast
                    ? val <= tolerance
                      ? 'bg-green-500'
                      : 'bg-red-500'
                    : 'bg-gray-400 dark:bg-gray-500 opacity-50'
                )}
                style={{ height: `${height}%` }}
                title={`Iter ${convergence.history.length - 20 + i}: ${val.toExponential(3)}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- Component: SpreadsheetCircularWarning ---

interface SpreadsheetCircularWarningProps {
  cellFormulas: Map<string, string>;
  recalcCell: (ref: string) => number;
  getCellValue: (ref: string) => number;
  setCellValue: (ref: string, value: number) => void;
  className?: string;
}

/**
 * Full circular reference warning for spreadsheet context.
 * Integrates FormulaEngine detection with CircularReferenceWarning UI,
 * including convergence progress visualization.
 *
 * Supports FP&A scenarios:
 * - Debt schedules (principal <-> interest circular)
 * - Interest-on-interest compounding
 * - Working capital loops (receivables/payables/cash)
 */
export function SpreadsheetCircularWarning({
  cellFormulas,
  recalcCell,
  getCellValue,
  setCellValue,
  className,
}: SpreadsheetCircularWarningProps) {
  const { cycles, convergence, config, setConfig, recalculate, isRecalculating } =
    useCircularDetection(cellFormulas, recalcCell, getCellValue, setCellValue);

  if (cycles.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)} aria-live="polite">
      <CircularReferenceWarning
        cycles={cycles}
        convergenceResult={convergence}
        config={config}
        onConfigChange={setConfig}
        onRecalc={recalculate}
      />
      {isRecalculating && (
        <div className="flex items-center gap-2 px-4 py-2 text-xs text-[var(--text-secondary)] bg-[var(--surface-secondary)] rounded-lg">
          <div
            className="w-3 h-3 border-2 border-[var(--border-subtle)] border-t-[var(--accent-primary)] rounded-full animate-spin"
            aria-hidden="true"
          />
          <span>Recalculating circular references...</span>
        </div>
      )}
      {convergence && (
        <ConvergenceProgressIndicator convergence={convergence} tolerance={config.maxChange} />
      )}
    </div>
  );
}
