import { useCallback, useState } from 'react';
import type {
  CircularGroup,
  ConvergenceResult,
  IterativeConfig,
} from '@/engines/IterativeCalculationEngine';
import { DEFAULT_ITERATIVE_CONFIG } from '@/engines/IterativeCalculationEngine';

// =============================================================================
// CircularReferenceWarning — Banner for circular reference detection
// =============================================================================

interface CircularReferenceWarningProps {
  cycles: CircularGroup[];
  convergenceResult?: ConvergenceResult | null;
  config: IterativeConfig;
  onConfigChange: (config: IterativeConfig) => void;
  onRecalc?: () => void;
  className?: string;
}

export function CircularReferenceWarning({
  cycles,
  convergenceResult,
  config,
  onConfigChange,
  onRecalc,
  className = '',
}: CircularReferenceWarningProps) {
  const [expanded, setExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleToggleIterative = useCallback(() => {
    onConfigChange({
      ...config,
      enableIterativeCalc: !config.enableIterativeCalc,
    });
  }, [config, onConfigChange]);

  const handleMaxIterationsChange = useCallback(
    (value: number) => {
      onConfigChange({ ...config, maxIterations: Math.max(1, Math.min(10000, value)) });
    },
    [config, onConfigChange]
  );

  const handleToleranceChange = useCallback(
    (value: number) => {
      onConfigChange({ ...config, maxChange: Math.max(0.0001, Math.min(100, value)) });
    },
    [config, onConfigChange]
  );

  if (cycles.length === 0) return null;

  const totalCells = new Set(cycles.flatMap((c) => c.cells)).size;

  const statusColor = convergenceResult
    ? convergenceResult.status === 'converged'
      ? 'text-green-700 bg-green-50 border-green-200'
      : convergenceResult.status === 'diverged'
        ? 'text-red-700 bg-red-50 border-red-200'
        : 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-amber-700 bg-amber-50 border-amber-200';

  const statusIcon = convergenceResult
    ? convergenceResult.status === 'converged'
      ? '✓'
      : convergenceResult.status === 'diverged'
        ? '✗'
        : '⟳'
    : '⚠';

  const statusLabel = convergenceResult
    ? convergenceResult.status === 'converged'
      ? 'Converged'
      : convergenceResult.status === 'diverged'
        ? 'Diverged — values growing unbounded'
        : `Max iterations (${config.maxIterations}) reached`
    : 'Circular references detected';

  return (
    <div className={`border rounded-lg ${statusColor} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{statusIcon}</span>
          <div>
            <p className="font-medium text-sm">{statusLabel}</p>
            <p className="text-xs opacity-75">
              {cycles.length} circular {cycles.length === 1 ? 'group' : 'groups'}, {totalCells}{' '}
              {totalCells === 1 ? 'cell' : 'cells'} involved
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRecalc && (
            <button
              onClick={onRecalc}
              className="px-3 py-1 text-xs font-medium rounded bg-white dark:bg-gray-800/50 hover:bg-white dark:bg-gray-800/80 border transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            >
              Recalculate
            </button>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-1 text-xs font-medium rounded bg-white dark:bg-gray-800/50 hover:bg-white dark:bg-gray-800/80 border transition-colors"
          >
            Settings
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-2 py-1 text-xs rounded bg-white dark:bg-gray-800/50 hover:bg-white dark:bg-gray-800/80 border transition-colors"
            aria-label={expanded ? 'Collapse details' : 'Expand details'}
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-t px-4 py-3 bg-white dark:bg-gray-800/30">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={config.enableIterativeCalc}
                onChange={handleToggleIterative}
                className="rounded"
              />
              <span className="font-medium">Enable iterative calculation</span>
            </label>

            <label className="flex items-center gap-2 text-xs">
              <span>Max iterations:</span>
              <input
                type="number"
                value={config.maxIterations}
                onChange={(e) => handleMaxIterationsChange(Number(e.target.value))}
                min={1}
                max={10000}
                className="w-20 px-2 py-1 rounded border bg-white dark:bg-gray-800 text-sm"
              />
            </label>

            <label className="flex items-center gap-2 text-xs">
              <span>Tolerance:</span>
              <input
                type="number"
                value={config.maxChange}
                onChange={(e) => handleToleranceChange(Number(e.target.value))}
                min={0.0001}
                max={100}
                step={0.001}
                className="w-24 px-2 py-1 rounded border bg-white dark:bg-gray-800 text-sm"
              />
            </label>
          </div>
          <p className="text-xs opacity-60 mt-2">
            Iterative calculation resolves circular references by repeatedly recalculating until
            values converge within tolerance.
          </p>
        </div>
      )}

      {/* Convergence Details */}
      {convergenceResult && expanded && (
        <div className="border-t px-4 py-3 bg-white dark:bg-gray-800/20">
          <div className="grid grid-cols-3 gap-4 text-xs mb-3">
            <div>
              <span className="opacity-60">Iterations:</span>
              <span className="ml-1 font-mono font-medium">{convergenceResult.iterations}</span>
            </div>
            <div>
              <span className="opacity-60">Final max change:</span>
              <span className="ml-1 font-mono font-medium">
                {convergenceResult.maxChange < 0.01
                  ? convergenceResult.maxChange.toExponential(2)
                  : convergenceResult.maxChange.toFixed(4)}
              </span>
            </div>
            <div>
              <span className="opacity-60">Tolerance:</span>
              <span className="ml-1 font-mono font-medium">{config.maxChange}</span>
            </div>
          </div>

          {/* Convergence chart (ASCII sparkline) */}
          {convergenceResult.history.length > 1 && (
            <div className="mb-3">
              <p className="text-xs opacity-60 mb-1">
                Convergence history (max change per iteration):
              </p>
              <div className="flex items-end gap-px h-8">
                {convergenceResult.history.map((val, i) => {
                  const maxVal = Math.max(...convergenceResult.history);
                  const height = maxVal > 0 ? Math.max(1, (val / maxVal) * 100) : 0;
                  const isLast = i === convergenceResult.history.length - 1;
                  return (
                    <div
                      key={i}
                      className={`flex-1 min-w-[2px] rounded-t ${
                        isLast
                          ? val <= config.maxChange
                            ? 'bg-green-500'
                            : 'bg-red-500'
                          : 'bg-current opacity-40'
                      }`}
                      style={{ height: `${height}%` }}
                      title={`Iter ${i + 1}: ${val.toFixed(6)}`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Circular Groups */}
      {expanded && (
        <div className="border-t px-4 py-3 bg-white dark:bg-gray-800/20">
          <p className="text-xs font-medium mb-2">Circular reference groups:</p>
          <div className="space-y-2">
            {cycles.map((cycle, i) => (
              <div
                key={i}
                className="text-xs bg-white dark:bg-gray-800/40 rounded px-3 py-2 font-mono"
              >
                {cycle.cells.join(' → ')} → {cycle.cells[0]}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Compact inline warning (for cell-level indicators)
// =============================================================================

interface CircularCellIndicatorProps {
  cellRef: string;
  isCircular: boolean;
  className?: string;
}

export function CircularCellIndicator({
  cellRef,
  isCircular,
  className = '',
}: CircularCellIndicatorProps) {
  if (!isCircular) return null;

  return (
    <span
      className={`inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-amber-600 bg-amber-100 rounded-full ${className}`}
      title={`Cell ${cellRef} is part of a circular reference`}
      aria-label="Circular reference"
    >
      ⚠
    </span>
  );
}

// =============================================================================
// Hook for managing iterative calculation state
// =============================================================================

export function useIterativeConfig(initial?: Partial<IterativeConfig>) {
  const [config, setConfig] = useState<IterativeConfig>({
    ...DEFAULT_ITERATIVE_CONFIG,
    ...initial,
  });

  const updateConfig = useCallback((updates: Partial<IterativeConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_ITERATIVE_CONFIG);
  }, []);

  return { config, setConfig: updateConfig, resetConfig };
}
