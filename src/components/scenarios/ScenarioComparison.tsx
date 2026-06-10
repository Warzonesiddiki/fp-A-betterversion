import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GitCompare,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Lock,
  Unlock,
  Download,
  Upload,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Scenario } from '@/types';
import {
  METRICS,
  BAR_COLORS,
  TYPE_BADGE,
  fmtValue,
  variancePct,
  isFavorable,
  barWidth,
} from './scenarioUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScenarioComparisonProps {
  scenarios: Scenario[];
  maxScenarios?: number;
  onLock?: (scenarioId: string) => void;
  onExport?: (scenarioIds: string[]) => void;
  onImport?: () => void;
}

type SortField = 'name' | 'revenue' | 'ebitda' | 'netIncome';
type SortDir = 'asc' | 'desc';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScenarioComparison({
  scenarios,
  maxScenarios = 4,
  onLock,
  onExport,
  onImport,
}: ScenarioComparisonProps) {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedMetrics, setExpandedMetrics] = useState(true);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const toggleSelect = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        if (prev.includes(id)) return prev.filter((sid) => sid !== id);
        if (prev.length >= maxScenarios) return prev;
        return [...prev, id];
      });
    },
    [maxScenarios]
  );

  const selected = useMemo(
    () => scenarios.filter((s) => selectedIds.includes(s.id)),
    [scenarios, selectedIds]
  );

  const baseScenario = useMemo(
    () => selected.find((s) => s.type === 'Base') ?? selected[0]!,
    [selected]
  );

  const sorted = useMemo(() => {
    const copy = [...selected];
    copy.sort((a, b) => {
      const cmp =
        sortField === 'name'
          ? a.name.localeCompare(b.name)
          : a.calculatedMetrics[sortField] - b.calculatedMetrics[sortField];
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [selected, sortField, sortDir]);

  const toggleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      else {
        setSortField(field);
        setSortDir('asc');
      }
    },
    [sortField]
  );

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport(selectedIds);
      return;
    }
    const blob = new Blob([JSON.stringify(selected, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenarios-comparison-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedIds, selected, onExport]);

  if (scenarios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <GitCompare className="h-12 w-12 text-[var(--text-tertiary)]" />
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">No Scenarios</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Create scenarios to enable side-by-side comparison.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Scenario Comparison</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Select up to {maxScenarios} scenarios to compare side-by-side.
          </p>
        </div>
        <div className="flex gap-2">
          {onImport && (
            <Button variant="outline" size="sm" onClick={onImport}>
              <Upload className="mr-1 h-3 w-3" /> Import
            </Button>
          )}
          {selectedIds.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-1 h-3 w-3" /> Export
            </Button>
          )}
        </div>
      </div>

      {/* Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Scenarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {scenarios.map((s) => {
              const isSelected = selectedIds.includes(s.id);
              const isDisabled = !isSelected && selectedIds.length >= maxScenarios;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => toggleSelect(s.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300'
                      : isDisabled
                        ? 'cursor-not-allowed border-[var(--border-subtle)] opacity-50'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-gray-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => toggleSelect(s.id)}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    aria-label={`Select ${s.name}`}
                  />
                  <span className="font-medium">{s.name}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs ${TYPE_BADGE[s.type] ?? TYPE_BADGE.Custom}`}
                  >
                    {s.type}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Table */}
      {selected.length >= 2 && baseScenario && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Metrics Comparison</CardTitle>
              <button
                type="button"
                onClick={() => setExpandedMetrics((v) => !v)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                aria-label={expandedMetrics ? 'Collapse' : 'Expand'}
              >
                {expandedMetrics ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <th className="pb-3 pr-4 text-left font-medium text-[var(--text-secondary)]">
                      <button
                        type="button"
                        onClick={() => toggleSort('name')}
                        className="flex items-center gap-1 hover:text-[var(--text-primary)]"
                      >
                        Metric
                        {sortField === 'name' &&
                          (sortDir === 'asc' ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          ))}
                      </button>
                    </th>
                    {sorted.map((s) => (
                      <th
                        key={s.id}
                        className="pb-3 px-3 text-right font-medium text-[var(--text-secondary)]"
                      >
                        <div className="flex items-center justify-end gap-1">
                          {s.name}
                          {s.id === baseScenario.id && (
                            <span className="text-xs text-blue-500">(base)</span>
                          )}
                          {onLock && (
                            <button
                              type="button"
                              onClick={() => onLock(s.id)}
                              className="ml-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                              aria-label={s.isActive ? 'Lock' : 'Unlock'}
                            >
                              {s.isActive ? (
                                <Unlock className="h-3 w-3" />
                              ) : (
                                <Lock className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                {expandedMetrics && (
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {METRICS.map((metric) => (
                      <tr key={metric.key} className="hover:bg-[var(--bg-hover)]">
                        <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">
                          {metric.label}
                        </td>
                        {sorted.map((s) => {
                          const value = s.calculatedMetrics[metric.key];
                          const baseValue = baseScenario.calculatedMetrics[metric.key];
                          const pct = variancePct(value, baseValue);
                          const fav = isFavorable(value, baseValue, metric.higherIsBetter);
                          const isBase = s.id === baseScenario.id;
                          return (
                            <td key={s.id} className="py-3 px-3 text-right tabular-nums">
                              <div>{fmtValue(value, metric.format)}</div>
                              {!isBase && Math.abs(pct) > 0.01 && (
                                <div
                                  className={`flex items-center justify-end gap-0.5 text-xs ${
                                    fav
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-red-600 dark:text-red-400'
                                  }`}
                                >
                                  {fav ? (
                                    <ArrowUpRight className="h-3 w-3" />
                                  ) : (
                                    <ArrowDownRight className="h-3 w-3" />
                                  )}
                                  {pct >= 0 ? '+' : ''}
                                  {pct.toFixed(1)}%
                                </div>
                              )}
                              {!isBase && Math.abs(pct) <= 0.01 && (
                                <div className="flex items-center justify-end gap-0.5 text-xs text-[var(--text-tertiary)]">
                                  <Minus className="h-3 w-3" />
                                  0.0%
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visual Bars */}
      {selected.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visual Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {METRICS.filter((m) => m.format !== 'percent').map((metric) => {
                const maxVal = Math.max(
                  1,
                  ...sorted.map((s) => Math.abs(s.calculatedMetrics[metric.key]))
                );
                return (
                  <div key={metric.key}>
                    <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">
                      {metric.label}
                    </p>
                    <div className="space-y-1.5">
                      {sorted.map((s, idx) => {
                        const value = s.calculatedMetrics[metric.key];
                        return (
                          <div key={s.id} className="flex items-center gap-3">
                            <span className="w-28 shrink-0 truncate text-xs text-[var(--text-secondary)]">
                              {s.name}
                            </span>
                            <div className="relative h-5 flex-1 overflow-hidden rounded bg-gray-100 dark:bg-gray-800 dark:bg-gray-700">
                              <div
                                className={`h-full rounded transition-all ${BAR_COLORS[idx % BAR_COLORS.length]}`}
                                style={{ width: `${barWidth(value, maxVal)}%` }}
                              />
                            </div>
                            <span className="w-20 text-right text-xs tabular-nums text-[var(--text-secondary)]">
                              {fmtValue(value, metric.format)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex flex-wrap gap-4 border-t border-[var(--border-subtle)] pt-4">
              {sorted.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-sm ${BAR_COLORS[idx % BAR_COLORS.length]}`} />
                  <span className="text-xs text-[var(--text-secondary)]">{s.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selected.length < 2 && (
        <div className="flex flex-col items-center gap-2 py-12 text-[var(--text-secondary)]">
          <GitCompare className="h-8 w-8" />
          <p className="text-sm font-medium">{t('scenarios.selectMin')}</p>
          <p className="text-xs">Check the boxes above to begin comparing metrics.</p>
        </div>
      )}
    </div>
  );
}
