/* eslint-disable jsx-a11y/label-has-associated-control */
import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { GitMerge, Check, ChevronDown, ChevronUp, Trophy, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Scenario, ScenarioMetrics } from '@/types';
import {
  METRICS,
  STRATEGY_LABELS,
  fmtValue,
  pickBest,
  pickWorst,
  averageValue,
  type MergeStrategy,
} from './scenarioUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScenarioMergeProps {
  scenarios: Scenario[];
  onMerge?: (merged: MergedScenario) => void;
}

export interface MergedScenario {
  name: string;
  metrics: ScenarioMetrics;
  sources: Record<string, string>;
  assumptions: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScenarioMerge({ scenarios = [], onMerge }: ScenarioMergeProps) {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [strategy, setStrategy] = useState<MergeStrategy>('best');
  const [mergedName, setMergedName] = useState('Merged Scenario');
  const [showDropdown, setShowDropdown] = useState(false);
  const [merged, setMerged] = useState<MergedScenario | null>(null);

  const selected = useMemo(
    () => scenarios.filter((s) => selectedIds.includes(s.id)),
    [scenarios, selectedIds]
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
    setMerged(null);
  }, []);

  const computeMerge = useCallback((): MergedScenario => {
    if (selected.length === 0) throw new Error('No scenarios selected');
    const first = selected[0];
    if (selected.length === 1 && first) {
      return {
        name: mergedName,
        metrics: { ...first.calculatedMetrics },
        sources: Object.fromEntries(METRICS.map((m) => [m.key, first.id])),
        assumptions: {},
      };
    }

    const sources: Record<string, string> = {};
    const metricEntries: Array<[string, number]> = [];

    for (const metric of METRICS) {
      const pick =
        strategy === 'best'
          ? pickBest(selected, metric.key, metric.higherIsBetter)
          : strategy === 'worst'
            ? pickWorst(selected, metric.key, metric.higherIsBetter)
            : { value: averageValue(selected, metric.key), sourceId: 'average' };
      metricEntries.push([metric.key, pick.value]);
      sources[metric.key] = pick.sourceId;
    }

    const metrics = Object.fromEntries(metricEntries) as unknown as ScenarioMetrics;

    const assumptions: Record<string, number> = {};
    const allIds = new Set(selected.flatMap((s) => s.assumptions.map((a) => a.id)));
    for (const aId of allIds) {
      let bestVal = 0;
      let found = false;
      for (const s of selected) {
        const a = s.assumptions.find((ass) => ass.id === aId);
        if (a && (!found || a.currentValue > bestVal)) {
          bestVal = a.currentValue;
          found = true;
        }
      }
      if (found) assumptions[aId] = bestVal;
    }

    return { name: mergedName, metrics, sources, assumptions };
  }, [selected, strategy, mergedName]);

  const handleMerge = useCallback(() => {
    try {
      const result = computeMerge();
      setMerged(result);
      onMerge?.(result);
    } catch {
      /* noop */
    }
  }, [computeMerge, onMerge]);

  if (scenarios.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <GitMerge className="h-12 w-12 text-[var(--text-tertiary)]" />
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Not Enough Scenarios</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Create at least 2 scenarios to enable merging.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Scenario Merge</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Pick the best values from multiple scenarios to create an optimal combined result.
        </p>
      </div>

      {/* Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Scenarios to Merge</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {scenarios.map((s) => {
              const isSelected = selectedIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSelect(s.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-gray-400'
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                  <span className="font-medium">{s.name}</span>
                  <span className="rounded bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-xs text-[var(--text-secondary)] dark:bg-gray-700">
                    {s.type}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Config */}
      {selected.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Merge Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="merge-name"
                  className="mb-1 block text-sm font-medium text-[var(--text-primary)]"
                >
                  Merged Scenario Name
                </label>
                <input
                  id="merge-name"
                  type="text"
                  value={mergedName}
                  onChange={(e) => setMergedName(e.target.value)}
                  className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="relative">
                <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                  Merge Strategy
                </label>
                <button
                  type="button"
                  onClick={() => setShowDropdown((v) => !v)}
                  className="flex w-full items-center justify-between rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm"
                >
                  {STRATEGY_LABELS[strategy]}
                  {showDropdown ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {showDropdown && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-lg">
                    {(Object.keys(STRATEGY_LABELS) as MergeStrategy[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setStrategy(s);
                          setShowDropdown(false);
                          setMerged(null);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-hover)] ${s === strategy ? 'font-medium text-blue-600' : ''}`}
                      >
                        {STRATEGY_LABELS[s]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={handleMerge}>
                <GitMerge className="mr-1 h-4 w-4" /> Merge Scenarios
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {merged && selected.length >= 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" /> Merged Result: {merged.name}
              </CardTitle>
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {strategy === 'best'
                  ? 'Optimal'
                  : strategy === 'average'
                    ? 'Averaged'
                    : 'Conservative'}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <th className="pb-3 pr-4 text-left font-medium text-[var(--text-secondary)]" scope="col">
                      Metric
                    </th>
                    <th className="pb-3 px-3 text-right font-medium text-[var(--text-secondary)]" scope="col">
                      Merged Value
                    </th>
                    <th className="pb-3 px-3 text-left font-medium text-[var(--text-secondary)]" scope="col">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {METRICS.map((metric) => {
                    const value = merged.metrics[metric.key];
                    const sourceId = merged.sources[metric.key];
                    const src =
                      sourceId === 'average' ? null : scenarios.find((s) => s.id === sourceId);
                    return (
                      <tr key={metric.key} className="hover:bg-[var(--bg-hover)]">
                        <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">
                          {metric.label}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums">
                          {fmtValue(value, metric.format)}
                        </td>
                        <td className="py-3 px-3">
                          {src ? (
                            <span className="inline-flex items-center gap-1 rounded bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              {src.name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:bg-gray-700 dark:text-gray-400 dark:text-gray-500">
                              Average
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {strategy === 'best' && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Best-of merge picks optimal values per metric independently. The resulting
                  combination may not be internally consistent — verify assumptions align.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selected.length < 2 && (
        <div className="flex flex-col items-center gap-2 py-12 text-[var(--text-secondary)]">
          <GitMerge className="h-8 w-8" />
          <p className="text-sm font-medium">{t('scenarios.selectMinMerge')}</p>
          <p className="text-xs">Pick a strategy and combine the best values.</p>
        </div>
      )}
    </div>
  );
}
