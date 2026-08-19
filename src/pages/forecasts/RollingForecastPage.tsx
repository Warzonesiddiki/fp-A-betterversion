import { useState, useEffect, useMemo } from 'react';
import { useGLStore } from '@/store/glStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HelpPanel } from '@/components/ui/HelpPanel';
import { Skeleton } from '@/components/ui/Skeleton';
import { deriveRollingForecast, type RollingPoint } from '@/pages/forecasts/rollingForecastModel';
import { scaleToPercent } from '@/utils/chartScale';
import { formatPercent } from '@/utils/financialFormatting';
import {
  TrendingUp,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  HelpCircle,
} from 'lucide-react';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { PageHeader } from '@/components/ui/PageHeader';
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
      'Revenue growth and expense growth are the mean month-over-month change of your posted GL entries over the selected window, measured separately. Projected net income is derived from the two, never extrapolated on its own.',
  },
  {
    title: 'Method accuracy',
    content:
      'Accuracy is a walk-forward backtest: the projection rule is fitted on the months before a period and compared with what was actually posted in it. It measures the method, not forecasts previously shown to you — the app does not store those yet. No confidence interval is published, because this history does not justify one.',
  },
];

export default function RollingForecastPage() {
  const fmt = useCurrencyFormatter();
  const [helpOpen, setHelpOpen] = useState(false);
  const { entries, isLoading, importError } = useGLStore();
  const [period, setPeriod] = useState<'3m' | '6m' | '12m'>('12m');

  useEffect(() => {
    document.title = 'FinPlan Pro — Rolling Forecast';
  }, []);

  const periodMonths = period === '3m' ? 3 : period === '6m' ? 6 : 12;

  // All figures come from `@/pages/forecasts/rollingForecastModel`: posted P&L
  // actuals signed by natural balance, a projection whose method is disclosed,
  // and a backtested accuracy instead of an invented one.
  const stats = useMemo(
    () => deriveRollingForecast(entries, periodMonths),
    [entries, periodMonths]
  );

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
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <TrendingUp className="h-10 w-10 text-[var(--text-negative)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Failed to load data</h2>
        <p className="text-[var(--text-muted)] mb-6">{importError}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <TrendingUp className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Import GL data to generate a rolling forecast.
        </p>
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
          <PageHeader
            title="Rolling Forecast"
            actions={
              <button
                onClick={() => setHelpOpen(true)}
                className="p-2 hover:bg-slate-800 rounded-full text-[var(--text-muted)] hover:text-white transition-colors"
                aria-label="Help"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
            }
          />
          <p className="text-muted-foreground">
            {periodMonths}-month forward-looking forecast
            {stats && ` \u00B7 ${stats.actualMonths} months of actuals`}
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
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
              <TrendingUp className="h-4 w-4" />
              Posted Revenue
            </div>
            <div className="text-xl font-bold text-green-400">
              {stats ? fmt.currency0(stats.postedRevenue) : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
              <ArrowDownRight className="h-4 w-4" />
              Posted Expenses
            </div>
            <div className="text-xl font-bold text-red-400">
              {stats ? fmt.currency0(stats.postedExpenses) : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
              <ArrowUpRight className="h-4 w-4" />
              Posted Net Income
            </div>
            <div
              className="text-xl font-bold"
              style={{ color: stats && stats.postedNetIncome >= 0 ? '#22c55e' : '#ef4444' }}
            >
              {stats ? fmt.currency0(stats.postedNetIncome) : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
              <Target className="h-4 w-4" />
              Method Accuracy (backtest)
            </div>
            <div className="text-xl font-bold text-blue-400">
              {stats ? formatPercent(stats.backtestAccuracyPercent, 1) : '-'}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
              {stats && stats.backtestSampleCount > 0
                ? `walk-forward, ${stats.backtestSampleCount} period${
                    stats.backtestSampleCount === 1 ? '' : 's'
                  }`
                : 'not enough posted history'}
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
                {stats.series.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)]">No posted month in range.</p>
                ) : (
                  <div className="space-y-2">
                    {stats.series.map((d: RollingPoint) => {
                      const maxVal = Math.max(
                        ...stats.series.map((x) => Math.max(x.revenue, x.expenses)),
                        1
                      );
                      // Layout only: bar width is a fraction of the widest bar,
                      // never a financial figure. See @/utils/chartScale.
                      const revenuePct = scaleToPercent(d.revenue, maxVal, 1);
                      const expensePct = scaleToPercent(d.expenses, maxVal, 1);
                      return (
                        <div key={`${d.kind}-${d.month}`} className="flex items-center gap-4">
                          <span className="w-16 text-xs text-muted-foreground">
                            {d.month.slice(-2)}
                          </span>
                          <div className="flex-1 flex gap-0.5 items-end h-6">
                            <div
                              className={`h-full rounded-t transition-all ${
                                d.kind === 'actual'
                                  ? 'bg-blue-500'
                                  : 'bg-blue-300/40 border border-dashed border-blue-400'
                              }`}
                              style={{ width: `${revenuePct}%`, maxHeight: '100%' }}
                              title={`${d.kind === 'actual' ? 'Posted' : 'Projected'} revenue: ${fmt.currency0(d.revenue)}`}
                            />
                            <div
                              className={`h-full rounded-t transition-all ${
                                d.kind === 'actual'
                                  ? 'bg-red-500/70'
                                  : 'bg-red-300/30 border border-dashed border-red-400'
                              }`}
                              style={{ width: `${expensePct}%`, maxHeight: '100%' }}
                              title={`${d.kind === 'actual' ? 'Posted' : 'Projected'} expenses: ${fmt.currency0(d.expenses)}`}
                            />
                          </div>
                          <span className="w-20 text-xs text-right tabular-nums text-[var(--text-muted)]">
                            {d.kind === 'actual' ? 'posted' : 'projected'}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <div className="text-muted-foreground text-xs">Revenue Growth (mean MoM)</div>
                    <div
                      className="text-lg font-bold"
                      style={{
                        color:
                          stats.revenueGrowthPercent === null
                            ? 'var(--text-muted)'
                            : stats.revenueGrowthPercent >= 0
                              ? '#22c55e'
                              : '#ef4444',
                      }}
                    >
                      {formatPercent(stats.revenueGrowthPercent)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stats.actualMonths} posted month{stats.actualMonths === 1 ? '' : 's'}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <div className="text-muted-foreground text-xs">Expense Growth (mean MoM)</div>
                    <div className="text-lg font-bold text-orange-400">
                      {formatPercent(stats.expenseGrowthPercent)}
                    </div>
                    <div className="text-xs text-muted-foreground">measured separately</div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-[var(--text-muted)]">{stats.projectionMethod}</p>
                <ul className="mt-3 space-y-1.5 text-xs">
                  {stats.unavailable.map((u) => (
                    <li key={u.label}>
                      <span className="font-semibold">{u.label} — unavailable.</span>{' '}
                      <span className="text-[var(--text-muted)]">{u.reason}</span>
                    </li>
                  ))}
                </ul>
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
                    <tr className="text-left text-[var(--text-muted)] text-xs uppercase border-b border-slate-800">
                      <th className="px-4 py-2" role="columnheader" scope="col">
                        Period
                      </th>
                      <th className="px-4 py-2 text-right" role="columnheader" scope="col">
                        Actual
                      </th>
                      <th className="px-4 py-2 text-right" role="columnheader" scope="col">
                        Forecast
                      </th>
                      <th className="px-4 py-2 text-right" role="columnheader" scope="col">
                        Basis
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {stats.series.map((d: RollingPoint) => (
                      <tr key={`${d.kind}-${d.month}`} className="hover:bg-slate-900/50">
                        <td className="px-4 py-2 text-slate-300">{d.month}</td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {d.kind === 'actual' ? fmt.currency0(d.revenue) : '-'}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {d.kind === 'projected' ? fmt.currency0(d.revenue) : '-'}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-[var(--text-muted)]">
                          {d.kind === 'actual' ? 'posted' : 'projected'}
                        </td>
                      </tr>
                    ))}
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
