import { useMemo } from 'react';
import { cn } from '@/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { ExportMenu } from './ExportMenu';
import type { ScenarioMetrics } from '@/types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ScenarioColumn {
  id: string;
  name: string;
  color: string;
  metrics: ScenarioMetrics;
}

interface ScenarioComparisonGridProps {
  baseMetrics: ScenarioMetrics;
  scenarios: ScenarioColumn[];
  className?: string;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function varianceColor(current: number, base: number, metric: string): string {
  const diff = current - base;
  if (Math.abs(diff) < 0.01) return 'text-[var(--text-muted)]';
  // For cost metrics (burnRate), lower is better
  const invertMetrics = ['burnRate'];
  const isPositive = invertMetrics.includes(metric) ? diff < 0 : diff > 0;
  return isPositive ? 'fin-positive dark:text-green-400' : 'fin-negative dark:text-red-400';
}

function VarianceCell({
  current,
  base,
  metric,
}: {
  current: number;
  base: number;
  metric: string;
}) {
  const diff = current - base;
  const pctDiff = base !== 0 ? (diff / base) * 100 : 0;
  const isNeutral = Math.abs(pctDiff) < 0.01;
  const color = varianceColor(current, base, metric);

  return (
    <div className="flex flex-col items-end">
      <span className={cn('text-xs font-medium', color)}>
        {diff >= 0 ? '+' : ''}
        {formatCurrency(diff)}
      </span>
      <span className={cn('text-[10px]', color)}>
        {isNeutral ? '—' : `${pctDiff >= 0 ? '+' : ''}${pctDiff.toFixed(1)}%`}
      </span>
    </div>
  );
}

export function ScenarioComparisonGrid({
  baseMetrics,
  scenarios,
  className,
}: ScenarioComparisonGridProps) {
  const metricRows: { key: keyof ScenarioMetrics; label: string; isPercent: boolean }[] = [
    { key: 'revenue', label: 'Revenue', isPercent: false },
    { key: 'ebitda', label: 'EBITDA', isPercent: false },
    { key: 'netIncome', label: 'Net Income', isPercent: false },
    { key: 'cashFlow', label: 'Cash Flow', isPercent: false },
    { key: 'headcount', label: 'Headcount', isPercent: false },
    { key: 'burnRate', label: 'Burn Rate', isPercent: false },
    { key: 'runway', label: 'Runway (months)', isPercent: false },
    { key: 'grossMargin', label: 'Gross Margin', isPercent: true },
    { key: 'ebitdaMargin', label: 'EBITDA Margin', isPercent: true },
  ];

  const formatValue = (val: number, isPercent: boolean, key: string) => {
    if (key === 'headcount') return Math.round(val).toLocaleString();
    if (key === 'runway') return `${val.toFixed(1)} mo`;
    if (isPercent) return `${val.toFixed(1)}%`;
    return formatCurrency(val);
  };

  // Impact ranking: sort scenarios by revenue delta from base
  const rankedScenarios = useMemo(() => {
    return [...scenarios].sort(
      (a, b) =>
        Math.abs(b.metrics.revenue - baseMetrics.revenue) -
        Math.abs(a.metrics.revenue - baseMetrics.revenue)
    );
  }, [scenarios, baseMetrics]);

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    // Build export data from grid
    const headers = ['Metric', 'Base', ...rankedScenarios.map((s) => s.name)];
    const rows = metricRows.map((row) => [
      row.label,
      formatValue(baseMetrics[row.key], row.isPercent, row.key),
      ...rankedScenarios.map((s) => formatValue(s.metrics[row.key], row.isPercent, row.key)),
    ]);
    const data = [headers, ...rows];

    if (format === 'csv') {
      const csv = data.map((r) => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'scenario-comparison.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Scenario Comparison Grid</CardTitle>
        <ExportMenu onExport={handleExport} />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] dark:border-gray-700">
                <th className="py-2 pr-4 text-left font-medium text-[var(--text-muted)] dark:text-[var(--text-muted)]">
                  Metric
                </th>
                <th className="py-2 px-3 text-right font-medium text-[var(--text-muted)] dark:text-[var(--text-muted)]">
                  Base
                </th>
                {rankedScenarios.map((s) => (
                  <th
                    key={s.id}
                    className="py-2 px-3 text-right font-medium"
                    style={{ color: s.color }}
                  >
                    {s.name}
                  </th>
                ))}
                {rankedScenarios.map((s) => (
                  <th
                    key={`var-${s.id}`}
                    className="py-2 px-3 text-right font-medium text-[var(--text-muted)] text-xs"
                  >
                    Δ vs Base
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metricRows.map((row) => (
                <tr
                  key={row.key}
                  className="border-b border-gray-100 dark:border-gray-800 dark:border-gray-800 hover:bg-[var(--bg-surface)] dark:hover:bg-gray-800/50"
                >
                  <td className="py-2 pr-4 text-gray-700 dark:text-gray-300 dark:text-gray-300 font-medium">
                    {row.label}
                  </td>
                  <td className="py-2 px-3 text-right text-[var(--text-primary)] dark:text-gray-100 font-mono">
                    {formatValue(baseMetrics[row.key], row.isPercent, row.key)}
                  </td>
                  {rankedScenarios.map((s) => (
                    <td
                      key={s.id}
                      className="py-2 px-3 text-right font-mono"
                      style={{ color: s.color }}
                    >
                      {formatValue(s.metrics[row.key], row.isPercent, row.key)}
                    </td>
                  ))}
                  {rankedScenarios.map((s) => (
                    <td key={`var-${s.id}`} className="py-2 px-3 text-right">
                      <VarianceCell
                        current={s.metrics[row.key]}
                        base={baseMetrics[row.key]}
                        metric={row.key}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary row */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {rankedScenarios.map((s) => {
            const revenueDelta = s.metrics.revenue - baseMetrics.revenue;
            const isPositive = revenueDelta >= 0;
            return (
              <div
                key={s.id}
                className={cn(
                  'rounded-lg border p-3',
                  isPositive
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                    : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                )}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {isPositive ? (
                    <TrendingUp className="h-3.5 w-3.5 fin-positive" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 fin-negative" />
                  )}
                  <span className="text-xs font-medium" style={{ color: s.color }}>
                    {s.name}
                  </span>
                </div>
                <div
                  className={cn(
                    'text-lg font-bold',
                    isPositive
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-red-700 dark:text-red-400'
                  )}
                >
                  {isPositive ? '+' : ''}
                  {formatCurrency(revenueDelta)}
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">revenue impact</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
