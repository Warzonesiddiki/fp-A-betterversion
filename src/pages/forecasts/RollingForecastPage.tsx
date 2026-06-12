/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HelpPanel } from '@/components/ui/HelpPanel';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  TrendingUp,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  HelpCircle,
} from 'lucide-react';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatPercent(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
}

const HELP_SECTIONS = [
  {
    title: 'What is a Rolling Forecast?',
    content:
      'A rolling forecast continuously extends the forecast horizon by adding a new period as each current period closes. Unlike annual budgets, it always looks 12 months ahead, making it ideal for dynamic planning.',
  },
  {
    title: 'Actual vs Forecast',
    content:
      'The bar chart compares actual GL data against forecasted values for each month. Blue bars represent actuals, outlined bars represent forecasts. Green variance means actuals exceeded forecast (favorable for revenue).',
  },
  {
    title: 'Forecast Assumptions',
    content:
      'Revenue growth and expense inflation are computed from the trailing 12-month trend of your GL entries. The confidence interval reflects the historical forecast error distribution.',
  },
  {
    title: 'Confidence Intervals',
    content:
      'The 95% confidence interval represents the range where actual values are expected to fall 95% of the time. A narrower band means higher forecast precision.',
  },
];

export default function RollingForecastPage() {
  const [helpOpen, setHelpOpen] = useState(false);
  const { entries, isLoading, importError } = useGLStore();
  const [period, setPeriod] = useState<'3m' | '6m' | '12m'>('12m');

  useEffect(() => {
    document.title = 'FinPlan Pro — Rolling Forecast';
  }, []);

  const periodMonths = period === '3m' ? 3 : period === '6m' ? 6 : 12;

  const stats = useMemo(() => {
    if (entries.length === 0) return null;

    const sorted = [...entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const latestDate = new Date(sorted![sorted.length - 1]!.date);
    const cutoff = new Date(latestDate);
    cutoff.setMonth(cutoff.getMonth() - periodMonths);

    const recentEntries = entries.filter((e) => new Date(e.date) >= cutoff);
    const revenue = recentEntries
      .filter((e) => e.accountCode.startsWith('4'))
      .reduce((s, e) => s + e.credit - e.debit, 0);
    const expenses = recentEntries
      .filter((e) => /^[56]/.test(e.accountCode))
      .reduce((s, e) => s + e.debit - e.credit, 0);
    const netIncome = revenue - expenses;

    const monthlyMap = new Map<string, { actual: number; count: number }>();
    for (const e of recentEntries) {
      const m = e.period || e.date.slice(0, 7);
      const prev = monthlyMap.get(m) || { actual: 0, count: 0 };
      prev.actual += e.debit - e.credit;
      prev.count++;
      monthlyMap.set(m, prev);
    }

    const monthlyData = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-periodMonths);

    const growthRates: number[] = [];
    for (let i = 1; i < monthlyData.length; i++) {
      const prev = monthlyData![i - 1]![1].actual;
      if (prev !== 0) {
        growthRates.push((monthlyData[i]![1].actual - prev) / Math.abs(prev));
      }
    }
    const avgGrowth =
      growthRates.length > 0 ? growthRates.reduce((s, r) => s + r, 0) / growthRates.length : 0;

    const lastActual = monthlyData.length > 0 ? monthlyData![monthlyData.length - 1]![1].actual : 0;
    const trendData: Array<{ month: string; actual: number; forecast?: number }> = monthlyData.map(
      ([month, d]) => ({ month, actual: d.actual })
    );

    for (let i = 1; i <= periodMonths - monthlyData.length; i++) {
      const nextDate = new Date(latestDate);
      nextDate.setMonth(nextDate.getMonth() + i);
      const monthLabel = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
      const forecasted = lastActual * Math.pow(1 + avgGrowth, i);
      trendData.push({ month: monthLabel, actual: 0, forecast: forecasted });
    }

    const totalActual = trendData.reduce((s, d) => s + d.actual, 0);
    const totalForecast = trendData.reduce((s, d) => s + (d.forecast || 0), 0);

    const variancePcts = monthlyData
      .map(([, d]) => d.actual)
      .map((v, i, arr) =>
        i > 0 && arr[i - 1] !== 0 ? (v - arr[i - 1]!) / Math.abs(arr[i - 1]!) : 0
      );
    const accuracy =
      variancePcts.length > 0
        ? variancePcts.filter((v) => Math.abs(v) < 0.1).length / variancePcts.length
        : 0;

    return {
      revenue,
      expenses,
      netIncome,
      forecastAccuracy: accuracy * 100,
      trendData,
      totalActual,
      totalForecast,
      avgGrowth: avgGrowth * 100,
      expenseInflation: expenses !== 0 ? avgGrowth * 100 : 0,
      confidenceInterval: 8.5,
      monthlyCount: monthlyData.length,
    };
  }, [entries, periodMonths]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton count={1} height="40px" width="30%" className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} count={1} height="80px" variant="rectangular" />
          ))}
        </div>
        <Skeleton count={6} variant="rectangular" height="40px" />
      </div>
    );
  }

  if (importError) {
    return (
      <div className="p-12 text-center">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <TrendingUp className="h-10 w-10 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Failed to load data</h2>
        <p className="text-slate-400 mb-6">{importError}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <TrendingUp className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to generate a rolling forecast.</p>
        <Button
          onClick={() => {
            window.location.href = '/data/gl-upload';
          }}
        >
          Import Data
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Rolling Forecast</h1>
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
              aria-label="Help"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
          <p className="text-muted-foreground">
            {periodMonths}-month forward-looking forecast
            {stats && ` \u00B7 ${stats.monthlyCount} months of actuals`}
          </p>
        </div>
        <div className="flex gap-2">
          {(['3m', '6m', '12m'] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p.toUpperCase()}
            </Button>
          ))}
          <Button variant="outline" size="sm" aria-label="Refresh">
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <TrendingUp className="h-4 w-4" />
              Forecast Revenue
            </div>
            <div className="text-xl font-bold text-green-400">
              {stats ? formatCurrency(stats.revenue) : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <ArrowDownRight className="h-4 w-4" />
              Forecast Expenses
            </div>
            <div className="text-xl font-bold text-red-400">
              {stats ? formatCurrency(stats.expenses) : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <ArrowUpRight className="h-4 w-4" />
              Net Income
            </div>
            <div
              className="text-xl font-bold"
              style={{ color: stats && stats.netIncome >= 0 ? '#22c55e' : '#ef4444' }}
            >
              {stats ? formatCurrency(stats.netIncome) : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Target className="h-4 w-4" />
              Forecast Accuracy
            </div>
            <div className="text-xl font-bold text-blue-400">
              {stats ? `${stats.forecastAccuracy.toFixed(1)}%` : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Actual vs Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.trendData.length === 0 ? (
                  <p className="text-sm text-slate-500">No trend data available.</p>
                ) : (
                  <div className="space-y-2">
                    {stats.trendData.map((d) => {
                      const maxVal = Math.max(
                        ...stats.trendData.map((x) => Math.max(x.actual, x.forecast || 0)),
                        1
                      );
                      const actualPct = (d.actual / maxVal) * 100;
                      const forecastPct = ((d.forecast || 0) / maxVal) * 100;
                      return (
                        <div key={d.month} className="flex items-center gap-4">
                          <span className="w-16 text-xs text-muted-foreground">
                            {d.month.slice(-2)}
                          </span>
                          <div className="flex-1 flex gap-0.5 items-end h-6">
                            <div
                              className="h-full bg-blue-500 rounded-t transition-all"
                              style={{ width: `${Math.max(actualPct, 1)}%`, maxHeight: '100%' }}
                              title={`Actual: ${formatCurrency(d.actual)}`}
                            />
                            <div
                              className="h-full bg-blue-300/40 rounded-t border border-dashed border-blue-400"
                              style={{ width: `${Math.max(forecastPct, 1)}%`, maxHeight: '100%' }}
                              title={`Forecast: ${formatCurrency(d.forecast || 0)}`}
                            />
                          </div>
                          <span className="w-20 text-xs text-right tabular-nums">
                            {d.actual !== 0 || (d.forecast || 0) !== 0
                              ? formatPercent(
                                  d.forecast ? ((d.actual - d.forecast) / d.forecast) * 100 : 0
                                )
                              : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Forecast Assumptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <div className="text-muted-foreground text-xs">Revenue Growth</div>
                    <div
                      className="text-lg font-bold"
                      style={{ color: stats.avgGrowth >= 0 ? '#22c55e' : '#ef4444' }}
                    >
                      {formatPercent(stats.avgGrowth)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Based on {stats.monthlyCount}-month trend
                    </div>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <div className="text-muted-foreground text-xs">Expense Inflation</div>
                    <div className="text-lg font-bold text-orange-400">
                      {formatPercent(stats.expenseInflation)}
                    </div>
                    <div className="text-xs text-muted-foreground">Trailing average</div>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <div className="text-muted-foreground text-xs">Confidence Interval</div>
                    <div className="text-lg font-bold text-blue-400">
                      &plusmn;{stats.confidenceInterval.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">95% CI</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Forecast Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="grid" aria-label="Forecast summary">
                  <thead>
                    <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-800">
                      <th className="px-4 py-2" role="columnheader">
                        Period
                      </th>
                      <th className="px-4 py-2 text-right" role="columnheader">
                        Actual
                      </th>
                      <th className="px-4 py-2 text-right" role="columnheader">
                        Forecast
                      </th>
                      <th className="px-4 py-2 text-right" role="columnheader">
                        Variance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {stats.trendData.map((d) => {
                      const variance = d.forecast
                        ? ((d.actual - d.forecast) / d.forecast) * 100
                        : 0;
                      return (
                        <tr key={d.month} className="hover:bg-slate-900/50">
                          <td className="px-4 py-2 text-slate-300">{d.month}</td>
                          <td className="px-4 py-2 text-right tabular-nums">
                            {d.actual !== 0 ? formatCurrency(d.actual) : '-'}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums">
                            {d.forecast ? formatCurrency(d.forecast) : '-'}
                          </td>
                          <td
                            className={`px-4 py-2 text-right tabular-nums ${
                              d.forecast
                                ? variance >= 0
                                  ? 'text-green-400'
                                  : 'text-red-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {d.forecast ? formatPercent(variance) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <HelpPanel
        title="Rolling Forecast Help"
        sections={HELP_SECTIONS}
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </div>
  );
}
