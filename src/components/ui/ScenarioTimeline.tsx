import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { formatNumber } from '@/utils/financialFormatting';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
} from 'recharts';

interface ScenarioTimelineProps {
  /** Time periods (e.g., months, quarters) */
  periods: string[];
  /** Base case values per period */
  baseValues: number[];
  /** Scenario lines: name, color, values per period */
  scenarios: {
    id: string;
    name: string;
    color: string;
    values: number[];
  }[];
  /** Optional Monte Carlo confidence bands */
  confidenceBands?: {
    low: number[];
    high: number[];
  };
  /** Metric being displayed (for axis label) */
  metricLabel?: string;
  /** Highlight inflection points where scenario diverges from base */
  showInflectionPoints?: boolean;
  className?: string;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: 'compact',
    compactDisplay: 'short',
  }).format(n);
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload) return null;
  return (
    <div
      className="rounded-lg border border-[var(--border-subtle)] bg-white dark:bg-gray-800 p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800"
      role="region"
      aria-label="ScenarioTimeline"
    >
      <p className="text-xs font-medium text-[var(--text-muted)] dark:text-[var(--text-muted)] mb-2">
        {label}
      </p>
      {payload.map((entry: { dataKey: string; value: number; color: string }) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[var(--text-secondary)] dark:text-gray-300">{entry.dataKey}</span>
          </div>
          <span className="font-mono font-medium text-[var(--text-primary)] dark:text-gray-100">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ScenarioTimeline({
  periods,
  baseValues,
  scenarios,
  confidenceBands,
  metricLabel = 'Value',
  showInflectionPoints = true,
  className,
}: ScenarioTimelineProps) {
  const chartData = useMemo(() => {
    return periods.map((period, i) => {
      const point: Record<string, number | string> = { period };
      point.Base = baseValues[i]!;
      scenarios.forEach((s) => {
        point[s.name] = s.values[i]!;
      });
      if (confidenceBands) {
        point.confidenceLow = confidenceBands.low[i]!;
        point.confidenceHigh = confidenceBands.high[i]!;
      }
      return point;
    });
  }, [periods, baseValues, scenarios, confidenceBands]);

  // Find inflection points: periods where any scenario diverges significantly
  const inflectionPoints = useMemo(() => {
    if (!showInflectionPoints) return [];
    const points: { period: string; scenario: string; divergence: number }[] = [];
    periods.forEach((period, i) => {
      const base = baseValues[i];
      if (base === 0) return;
      scenarios.forEach((s) => {
        const divergence = ((s.values[i]! - base!) / base!) * 100;
        if (Math.abs(divergence) > 10) {
          // >10% divergence is inflection
          points.push({ period, scenario: s.name, divergence });
        }
      });
    });
    return points;
  }, [periods, baseValues, scenarios, showInflectionPoints]);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{metricLabel} — Timeline</CardTitle>
          {inflectionPoints.length > 0 && (
            <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
              {inflectionPoints.length} inflection point
              {inflectionPoints.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {confidenceBands ? (
              <AreaChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-gray-200 dark:stroke-gray-700"
                />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 10 }}
                  className="text-[var(--text-muted)]"
                />
                <YAxis
                  tickFormatter={(v) => formatCurrency(v)}
                  tick={{ fontSize: 10 }}
                  className="text-[var(--text-muted)]"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                <Area
                  dataKey="confidenceHigh"
                  fill="transparent"
                  stroke="transparent"
                  name="Confidence Band"
                />
                <Area
                  dataKey="confidenceLow"
                  fill="#94A3B8"
                  fillOpacity={0.1}
                  stroke="transparent"
                  name=""
                />
                <Line
                  type="monotone"
                  dataKey="Base"
                  stroke="#6B7280"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
                {scenarios.map((s) => (
                  <Line
                    key={s.id}
                    type="monotone"
                    dataKey={s.name}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-gray-200 dark:stroke-gray-700"
                />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 10 }}
                  className="text-[var(--text-muted)]"
                />
                <YAxis
                  tickFormatter={(v) => formatCurrency(v)}
                  tick={{ fontSize: 10 }}
                  className="text-[var(--text-muted)]"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                <Line
                  type="monotone"
                  dataKey="Base"
                  stroke="#6B7280"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
                {scenarios.map((s) => (
                  <Line
                    key={s.id}
                    type="monotone"
                    dataKey={s.name}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Inflection points legend */}
        {inflectionPoints.length > 0 && (
          <div className="mt-3 border-t border-gray-100 dark:border-gray-800 dark:border-gray-800 pt-3">
            <p className="text-[10px] font-medium text-[var(--text-muted)] dark:text-[var(--text-muted)] mb-1.5">
              Inflection Points (&gt;10% divergence)
            </p>
            <div className="flex flex-wrap gap-2">
              {inflectionPoints.slice(0, 6).map((ip, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 text-[10px]"
                >
                  <span className="font-medium">{ip.period}</span>
                  <span className="text-[var(--text-muted)]">·</span>
                  <span className="text-amber-700 dark:text-amber-400">{ip.scenario}</span>
                  <span className="text-[var(--text-muted)]">·</span>
                  <span className={ip.divergence > 0 ? 'fin-positive' : 'fin-negative'}>
                    {ip.divergence > 0 ? '+' : ''}
                    {formatNumber(ip.divergence, 1)}%
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
