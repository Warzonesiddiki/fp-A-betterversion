/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScenarioStore, scenarioSelectors } from '@/store/scenarioStore';
import type { ScenarioMetrics } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface MetricRow {
  key: keyof ScenarioMetrics;
  label: string;
  format: 'currency' | 'percent' | 'number';
  higherIsBetter: boolean;
}

const METRICS: MetricRow[] = [
  { key: 'revenue', label: 'Revenue', format: 'currency', higherIsBetter: true },
  { key: 'ebitda', label: 'EBITDA', format: 'currency', higherIsBetter: true },
  { key: 'netIncome', label: 'Net Income', format: 'currency', higherIsBetter: true },
  { key: 'cashFlow', label: 'Cash Flow', format: 'currency', higherIsBetter: true },
  { key: 'grossMargin', label: 'Gross Margin', format: 'percent', higherIsBetter: true },
  { key: 'ebitdaMargin', label: 'EBITDA Margin', format: 'percent', higherIsBetter: true },
  { key: 'headcount', label: 'Headcount', format: 'number', higherIsBetter: true },
  { key: 'burnRate', label: 'Burn Rate', format: 'currency', higherIsBetter: false },
  { key: 'runway', label: 'Runway (months)', format: 'number', higherIsBetter: true },
];

function formatValue(value: number, format: MetricRow['format']): string {
  if (format === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  if (format === 'percent') {
    return `${(value * 100).toFixed(1)}%`;
  }
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

function getVarianceClass(current: number, base: number, higherIsBetter: boolean): string {
  if (base === 0) return '';
  const diff = current - base;
  if (Math.abs(diff) < 0.001) return '';
  const isFavorable = higherIsBetter ? diff > 0 : diff < 0;
  return isFavorable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
}

function getBarWidth(value: number, max: number): number {
  if (max === 0) return 0;
  return Math.min(100, Math.max(2, (Math.abs(value) / Math.abs(max)) * 100));
}

const BAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-cyan-500',
];

export function ScenarioComparisonPage() {
  const navigate = useNavigate();
  const scenarios = useScenarioStore(scenarioSelectors.scenarios);
  const comparedIds = useScenarioStore(scenarioSelectors.comparedScenarioIds);
  const toggleComparison = useScenarioStore((s) => s.toggleScenarioComparison);

  const [selectedIds, setSelectedIds] = useState<string[]>(comparedIds);

  const selectedScenarios = useMemo(
    () => scenarios.filter((s) => selectedIds.includes(s.id)),
    [scenarios, selectedIds]
  );

  const baseScenario = useMemo(
    () => selectedScenarios.find((s) => s.type === 'Base') ?? selectedScenarios[0]!,
    [selectedScenarios]
  );

  const toggleSelection = useCallback(
    (id: string) => {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
      );
      toggleComparison(id);
    },
    [toggleComparison]
  );

  const barMetric = METRICS[0];
  const barMaxValue = useMemo(
    () =>
      Math.max(1, ...selectedScenarios.map((s) => Math.abs(s.calculatedMetrics[barMetric!.key]))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedScenarios, barMetric!.key]
  );

  if (scenarios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">No Scenarios Available</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Create a scenario first to enable comparison.
        </p>
        <Button onClick={() => navigate('/scenarios/create')}>Create Scenario</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Scenario Comparison</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Select scenarios to compare side-by-side.
          </p>
        </div>
        <Button onClick={() => navigate('/scenarios/create')}>Create Scenario</Button>
      </div>

      {/* Scenario Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Scenarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {scenarios.map((scenario) => {
              const isSelected = selectedIds.includes(scenario.id);
              return (
                <label
                  key={scenario.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-gray-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(scenario.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium">{scenario.name}</span>
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-[var(--text-secondary)] dark:bg-gray-700">
                    {scenario.type}
                  </span>
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      {selectedScenarios.length >= 2 && baseScenario && (
        <Card>
          <CardHeader>
            <CardTitle>Metrics Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Scenario comparison metrics">
                <caption className="sr-only">Detailed scenario comparison metrics</caption>
                <thead>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <th
                      scope="col"
                      className="pb-3 pr-4 text-left font-medium text-[var(--text-secondary)]"
                    >
                      Metric
                    </th>
                    {selectedScenarios.map((s) => (
                      <th
                        key={s.id}
                        className="pb-3 px-3 text-right font-medium text-[var(--text-secondary)]"
                        scope="col"
                      >
                        {s.name}
                        {s.id === baseScenario.id && (
                          <span className="ml-1 text-xs text-blue-500">(base)</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {METRICS.map((metric) => (
                    <tr key={metric.key} className="hover:bg-[var(--bg-hover)]">
                      <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">
                        {metric.label}
                      </td>
                      {selectedScenarios.map((s) => {
                        const value = s.calculatedMetrics[metric.key];
                        const baseValue = baseScenario.calculatedMetrics[metric.key];
                        const varianceClass =
                          s.id === baseScenario.id
                            ? ''
                            : getVarianceClass(value, baseValue, metric.higherIsBetter);
                        return (
                          <td
                            key={s.id}
                            className={`py-3 px-3 text-right tabular-nums ${varianceClass}`}
                          >
                            {formatValue(value, metric.format)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grouped Bar Chart */}
      {selectedScenarios.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Visual Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {METRICS.filter((m) => m.format !== 'percent').map((metric) => {
                const maxVal = Math.max(
                  1,
                  ...selectedScenarios.map((s) => Math.abs(s.calculatedMetrics[metric.key]))
                );
                return (
                  <div key={metric.key}>
                    <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">
                      {metric.label}
                    </p>
                    <div className="space-y-1.5">
                      {selectedScenarios.map((s, idx) => {
                        const value = s.calculatedMetrics[metric.key];
                        return (
                          <div key={s.id} className="flex items-center gap-3">
                            <span className="w-28 shrink-0 truncate text-xs text-[var(--text-secondary)]">
                              {s.name}
                            </span>
                            <div className="relative h-5 flex-1 overflow-hidden rounded bg-gray-100 dark:bg-gray-700">
                              <div
                                className={`h-full rounded transition-all ${BAR_COLORS[idx % BAR_COLORS.length]}`}
                                style={{ width: `${getBarWidth(value, maxVal)}%` }}
                              />
                            </div>
                            <span className="w-20 text-right text-xs tabular-nums text-[var(--text-secondary)]">
                              {formatValue(value, metric.format)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-4 border-t border-[var(--border-subtle)] pt-4">
              {selectedScenarios.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-sm ${BAR_COLORS[idx % BAR_COLORS.length]}`} />
                  <span className="text-xs text-[var(--text-secondary)]">{s.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedScenarios.length < 2 && (
        <div className="flex flex-col items-center gap-2 py-16 text-[var(--text-secondary)]">
          <p className="text-lg font-medium">Select at least 2 scenarios to compare</p>
          <p className="text-sm">Check the boxes above to begin comparing metrics.</p>
        </div>
      )}
    </div>
  );
}
