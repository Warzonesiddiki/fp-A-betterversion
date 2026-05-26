import { useState, useMemo, useCallback, Fragment } from 'react';
import {
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import type { Scenario, ScenarioMetrics } from '@/types';
import {
  CATEGORIZED_METRICS,
  CATEGORY_LABELS,
  fmtValue,
  severityOf,
  severityColor,
  type CategoryMetricDef,
  type Severity,
} from './scenarioUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImpactAnalysisProps {
  baseScenario: Scenario;
  compareScenarios: Scenario[];
  onHighlightMetric?: (metric: keyof ScenarioMetrics) => void;
}

interface ImpactRow {
  metric: CategoryMetricDef;
  baseValue: number;
  changes: Array<{
    scenarioId: string;
    scenarioName: string;
    value: number;
    delta: number;
    pctChange: number;
    isFavorable: boolean;
    severity: Severity;
  }>;
}

type SeverityFilter = 'all' | 'high' | 'medium' | 'low';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ImpactAnalysis({
  baseScenario,
  compareScenarios,
  onHighlightMetric,
}: ImpactAnalysisProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['profitability', 'liquidity', 'efficiency'])
  );
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const impactRows = useMemo((): ImpactRow[] => {
    return CATEGORIZED_METRICS.map((metric) => {
      const baseValue = baseScenario.calculatedMetrics[metric.key];
      const changes = compareScenarios.map((s) => {
        const value = s.calculatedMetrics[metric.key];
        const delta = value - baseValue;
        const pctChange = baseValue !== 0 ? (delta / Math.abs(baseValue)) * 100 : 0;
        return {
          scenarioId: s.id,
          scenarioName: s.name,
          value,
          delta: Math.round(delta * 100) / 100,
          pctChange: Math.round(pctChange * 100) / 100,
          isFavorable: metric.higherIsBetter ? delta >= 0 : delta <= 0,
          severity: severityOf(pctChange),
        };
      });
      return { metric, baseValue, changes };
    });
  }, [baseScenario, compareScenarios]);

  const filteredRows = useMemo(() => {
    if (severityFilter === 'all') return impactRows;
    return impactRows.filter((row) => row.changes.some((c) => c.severity === severityFilter));
  }, [impactRows, severityFilter]);

  const grouped = useMemo(() => {
    const groups: Record<string, ImpactRow[]> = {};
    for (const row of filteredRows) {
      const cat = row.metric.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(row);
    }
    return groups;
  }, [filteredRows]);

  const highImpactCount = impactRows.reduce(
    (acc, row) => acc + row.changes.filter((c) => c.severity === 'high').length,
    0
  );

  if (compareScenarios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Activity className="h-12 w-12 text-[var(--text-tertiary)]" />
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">No Comparisons</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Select scenarios to analyze impact against the base.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Impact Analysis</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            What changed vs. <span className="font-medium">{baseScenario.name}</span> and by how
            much.
          </p>
        </div>
        <div className="flex gap-2">
          {(['all', 'high', 'medium', 'low'] as SeverityFilter[]).map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSeverityFilter(sev)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                severityFilter === sev
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {sev === 'all' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1)}
              {sev === 'high' && highImpactCount > 0 && (
                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  {highImpactCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {compareScenarios.map((s) => {
          const totalDelta = s.calculatedMetrics.revenue - baseScenario.calculatedMetrics.revenue;
          const pctDelta =
            baseScenario.calculatedMetrics.revenue !== 0
              ? (totalDelta / Math.abs(baseScenario.calculatedMetrics.revenue)) * 100
              : 0;
          const isPositive = totalDelta >= 0;
          return (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{s.name}</span>
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div
                  className={`mt-1 text-2xl font-bold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  {isPositive ? '+' : ''}
                  {fmtValue(totalDelta, 'currency')}
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {pctDelta >= 0 ? '+' : ''}
                  {pctDelta.toFixed(1)}% revenue impact
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Tables */}
      {Object.entries(grouped).map(([category, rows]) => {
        if (rows.length === 0) return null;
        const isExpanded = expandedCategories.has(category);
        return (
          <Card key={category}>
            <CardHeader>
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="flex w-full items-center justify-between"
              >
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  {CATEGORY_LABELS[category] ?? category}
                  <span className="text-xs font-normal text-[var(--text-tertiary)]">
                    ({rows.length} metric{rows.length !== 1 ? 's' : ''})
                  </span>
                </CardTitle>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-[var(--text-secondary)]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />
                )}
              </button>
            </CardHeader>
            {isExpanded && (
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border-subtle)]">
                        <th className="pb-3 pr-4 text-left font-medium text-[var(--text-secondary)]">
                          Metric
                        </th>
                        <th className="pb-3 px-3 text-right font-medium text-[var(--text-secondary)]">
                          Base
                        </th>
                        {compareScenarios.map((s) => (
                          <th
                            key={s.id}
                            colSpan={2}
                            className="pb-3 px-3 text-center font-medium text-[var(--text-secondary)]"
                          >
                            {s.name}
                          </th>
                        ))}
                      </tr>
                      <tr className="border-b border-[var(--border-subtle)]">
                        <th />
                        <th />
                        {compareScenarios.map((s) => (
                          <Fragment key={`h-${s.id}`}>
                            <th className="pb-2 px-3 text-right text-xs font-normal text-[var(--text-tertiary)]">
                              Value
                            </th>
                            <th className="pb-2 px-3 text-right text-xs font-normal text-[var(--text-tertiary)]">
                              Delta
                            </th>
                          </Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {rows.map((row) => (
                        <tr
                          key={row.metric.key}
                          className="hover:bg-[var(--bg-hover)] cursor-pointer"
                          onClick={() => onHighlightMetric?.(row.metric.key)}
                        >
                          <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">
                            {row.metric.label}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums text-[var(--text-secondary)]">
                            {fmtValue(row.baseValue, row.metric.format)}
                          </td>
                          {row.changes.map((change) => (
                            <Fragment key={change.scenarioId}>
                              <td className="py-3 px-3 text-right tabular-nums text-[var(--text-primary)]">
                                {fmtValue(change.value, row.metric.format)}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {change.isFavorable ? (
                                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                                  ) : change.delta === 0 ? (
                                    <Minus className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                  ) : (
                                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                                  )}
                                  <span
                                    className={`text-xs ${
                                      change.isFavorable
                                        ? 'text-green-600 dark:text-green-400'
                                        : change.delta === 0
                                          ? 'text-gray-400 dark:text-gray-500'
                                          : 'text-red-600 dark:text-red-400'
                                    }`}
                                  >
                                    {change.delta >= 0 ? '+' : ''}
                                    {fmtValue(change.delta, row.metric.format)}
                                  </span>
                                  <span
                                    className={`ml-1 rounded px-1 py-0.5 text-[10px] ${severityColor(change.severity)}`}
                                  >
                                    {change.pctChange >= 0 ? '+' : ''}
                                    {change.pctChange.toFixed(1)}%
                                  </span>
                                </div>
                              </td>
                            </Fragment>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Alert */}
      {highImpactCount > 0 && severityFilter !== 'low' && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {highImpactCount} high-impact change{highImpactCount !== 1 ? 's' : ''} detected
            </p>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
              Metrics with 20%+ variance from base require attention. Review the highlighted rows
              above for details.
            </p>
          </div>
        </div>
      )}

      {filteredRows.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-[var(--text-secondary)]">
          <Activity className="h-8 w-8" />
          <p className="text-sm font-medium">No metrics match this filter</p>
          <p className="text-xs">Try selecting a different severity level.</p>
        </div>
      )}
    </div>
  );
}
