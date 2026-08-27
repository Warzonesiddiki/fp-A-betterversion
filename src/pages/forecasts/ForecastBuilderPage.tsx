import { useEffect, useState, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { TrendingUp, FileText, Table as TableIcon, Brain, BarChart3, Upload } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ExportEngine } from '@/engines/ExportEngine';
import { sumMoney, roundTo } from '@/utils/money';
import {
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { formatCompact, formatNumber, formatPercent } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { PageHeader } from '@/components/ui/PageHeader';
import { useGLStore } from '@/store/glStore';
import {
  backtestForecastMethod,
  computeForecastSeries,
  confidenceBandsFromResiduals,
  deriveMonthlyRevenue,
  SEASONALITY_WEIGHTS,
  BAND_Z,
  MIN_HISTORY_FOR_BACKTEST,
  type ForecastMethod,
  type SeasonalityPreset,
} from '@/pages/forecasts/forecastBuilderData';

// Re-exported for callers and tests that imported them from this page before
// the derivation moved to `forecastBuilderData`.
export { computeForecastSeries, SEASONALITY_WEIGHTS, type ForecastMethod, type SeasonalityPreset };

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Forecast builder.
 *
 * See `@/pages/forecasts/forecastBuilderData` for the correctness contract.
 * This page used to forecast from six invented months
 * (HISTORICAL_ACTUALS = 4.2M, 3.9M, 4.5M, 4.1M, 4.4M, 4.6M), publish four
 * literal accuracy statistics (MAPE 4.2%, RMSE $182K, R² 0.94, Bias −1.8%),
 * widen a confidence band by a fixed 6% + 1.5%/period, plot a past "forecast"
 * line synthesised as actual + 2% − 50,000, and report a constant 87%
 * confidence — then export all of it.
 */
/** `YYYY-MM` plus n months, for labelling projected periods. */
function addMonthLabel(month: string, n: number): string {
  const [y, m] = month.split('-').map((x) => Number(x));
  if (!Number.isFinite(y) || !Number.isFinite(m)) return `${month}+${n}`;
  const zeroBased = (y as number) * 12 + ((m as number) - 1) + n;
  return `${String(Math.floor(zeroBased / 12)).padStart(4, '0')}-${String((zeroBased % 12) + 1).padStart(2, '0')}`;
}

export default function ForecastBuilderPage() {
  const fmt = useCurrencyFormatter();
  const navigate = useNavigate();
  const [method, setMethod] = useState<ForecastMethod>('linear');
  const [seasonality, setSeasonality] = useState<SeasonalityPreset>('standard');
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'FinPlan Pro — Forecast Builder';
  }, []);

  // W-K30-001 (1): the builder has zero states when the GL store is hydrating
  // or a GL import failed — it used to render KPIs of $0 and an empty chart.
  const { entries, isLoading, importError } = useGLStore(
    useShallow((s) => ({
      entries: s.entries,
      isLoading: s.isLoading,
      importError: s.importError,
    }))
  );

  const historical = useMemo(() => deriveMonthlyRevenue(entries), [entries]);
  const historicalValues = useMemo(() => historical.map((h) => h.value), [historical]);

  const forecastSeries = useMemo(
    () => computeForecastSeries(historicalValues, method, seasonality, 6),
    [historicalValues, method, seasonality]
  );

  const accuracy = useMemo(
    () => backtestForecastMethod(historicalValues, method, seasonality),
    [historicalValues, method, seasonality]
  );

  const bands = useMemo(
    () => confidenceBandsFromResiduals(forecastSeries, accuracy.residualStdDev),
    [forecastSeries, accuracy.residualStdDev]
  );

  const historicalData = useMemo(() => {
    // Past periods carry actuals only. A forecast that was never made cannot
    // be plotted next to the actual it supposedly predicted.
    const hist = historical.map((h) => ({
      month: h.month,
      actual: h.value,
      forecast: null as number | null,
      low: null as number | null,
      high: null as number | null,
    }));
    const lastMonth = historical.at(-1)?.month;
    const fcast = forecastSeries.map((fc, idx) => ({
      month: lastMonth ? addMonthLabel(lastMonth, idx + 1) : MONTH_LABELS[idx % 12]!,
      actual: null as number | null,
      forecast: fc,
      low: bands ? bands.low[idx]! : null,
      high: bands ? bands.high[idx]! : null,
    }));
    return [...hist, ...fcast];
  }, [historical, forecastSeries, bands]);

  const totalForecast = roundTo(sumMoney(forecastSeries), 2);

  const accuracyMetrics = useMemo(
    () => [
      {
        metric: 'MAPE',
        value: formatPercent(accuracy.mapePercent, 1),
        description: 'Mean Absolute Percentage Error — walk-forward backtest',
      },
      {
        metric: 'RMSE',
        value: accuracy.rmse === null ? '\u2014' : fmt.currency0(accuracy.rmse),
        description: 'Root Mean Square Error of the same backtest',
      },
      {
        metric: 'R-Squared',
        value: accuracy.rSquared === null ? '\u2014' : formatNumber(accuracy.rSquared, 2),
        description: 'Variance of posted revenue explained',
      },
      {
        metric: 'Bias',
        value: formatPercent(accuracy.biasPercent, 1),
        description: 'Mean signed error; negative means under-forecast',
      },
    ],
    [accuracy, fmt]
  );

  const handleExportPDF = () => {
    setExportError(null);
    try {
      void ExportEngine.exportToPDF(
        {
          headers: ['Month', 'Actual', 'Forecast', 'Low', 'High'],
          rows: historicalData.map((d) => [
            d.month,
            d.actual ? fmt.currency0(d.actual) : '—',
            fmt.currency0(d.forecast),
            d.low ? fmt.currency0(d.low) : '—',
            d.high ? fmt.currency0(d.high) : '—',
          ]),
        },
        { title: 'Forecast Report', subtitle: `Method: ${method} · Seasonality: ${seasonality}` }
      ).catch(reportExportFailure);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Failed to export PDF');
    }
  };

  const handleExportExcel = () => {
    setExportError(null);
    try {
      void ExportEngine.exportToExcel(
        {
          headers: ['Month', 'Actual', 'Forecast', 'Low', 'High'],
          rows: historicalData.map(
            (d) =>
              [d.month, d.actual, d.forecast, d.low, d.high] as (string | number | boolean | null)[]
          ),
        },
        { title: 'Forecast_Report' }
      ).catch(reportExportFailure);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Failed to export Excel');
    }
  };

  return (
    <main className="p-6 space-y-6" aria-labelledby="forecast-builder-heading">
      {exportError && (
        <div
          className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-sm text-red-400"
          role="alert"
          aria-live="assertive"
        >
          {exportError}
        </div>
      )}
      <PageHeader
        title="Forecast Builder"
        titleId="forecast-builder-heading"
        purpose="Driver-based forecasting with confidence intervals"
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleExportPDF}
              aria-label="Export forecast as PDF"
              data-testid="export-pdf"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              PDF
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleExportExcel}
              aria-label="Export forecast as Excel"
              data-testid="export-excel"
            >
              <TableIcon className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              Excel
            </Button>
          </div>
        }
      />

      {/* W-K30-001 (1): loading / error / empty branches. The PageHeader above
          keeps the page's h1 in every branch, so EmptyState's h3 never breaks
          document heading order. */}
      {isLoading ? (
        <div data-testid="forecast-builder-loading" className="space-y-4">
          {/* W-A11Y-002 M5: one polite announcement for the whole loading branch. */}
          <Skeleton count={1} height="40px" width="30%" srLabel="Loading forecast builder…" />
          <Skeleton count={4} variant="card" height="120px" />
          <Skeleton count={6} variant="text" height="24px" />
        </div>
      ) : importError ? (
        <ErrorState
          title="Failed to load GL history"
          message={importError}
          errorCode="GL-IMPORT-ERROR"
          onRetry={() => window.location.reload()}
          retryLabel="Retry"
          secondaryAction={{ label: 'Go to Data Import', onClick: () => navigate('/data') }}
        />
      ) : historical.length === 0 ? (
        // GL history empty AND required inputs absent: deriveMonthlyRevenue
        // found no posted revenue months, so the builder has nothing to fit.
        <div data-testid="forecast-builder-empty">
          <EmptyState
            variant="no-data"
            title="No GL history to forecast from"
            description="Forecasts are derived from posted revenue in your general ledger. Import your GL so the builder has history to learn from."
            action={
              <Button onClick={() => navigate('/data/gl-upload')}>
                <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                Import Data
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div
            className="grid grid-cols-4 gap-4"
            role="region"
            aria-label="Forecast key performance indicators"
            data-testid="forecast-kpis"
          >
            <KPIValue label="Forecast Total" value={fmt.currency0(totalForecast)} />
            <KPIValue
              label="Backtest Samples"
              value={
                accuracy.sampleCount > 0
                  ? `${accuracy.sampleCount} period${accuracy.sampleCount === 1 ? '' : 's'}`
                  : '\u2014'
              }
              changeLabel={
                accuracy.sampleCount > 0
                  ? 'method scored against posted months'
                  : `needs ${MIN_HISTORY_FOR_BACKTEST} posted months`
              }
            />
            <KPIValue
              label="Method"
              value={
                method === 'linear'
                  ? 'Linear'
                  : method === 'cagr'
                    ? 'CAGR'
                    : method === 'last-3'
                      ? 'Last-3 Avg'
                      : 'Flat'
              }
            />
            <KPIValue
              label="Accuracy (MAPE, backtest)"
              value={formatPercent(accuracy.mapePercent, 1)}
              trend={accuracy.mapePercent !== null && accuracy.mapePercent < 10 ? 'up' : 'neutral'}
            />
          </div>

          {/* Forecast Configuration & Driver Tree */}
          <Card data-testid="forecast-config">
            <CardHeader>
              <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                <BarChart3 className="h-4 w-4" /> Forecast Configuration & Driver Tree
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">
                    Auto-Fill Method
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ['linear', TrendingUp, 'Linear'],
                        ['cagr', BarChart3, 'CAGR'],
                        ['last-3', TrendingUp, 'Last-3'],
                        ['flat', Brain, 'Flat'],
                      ] as const
                    ).map(([key, Icon, label]) => (
                      <Button
                        key={key}
                        size="sm"
                        variant={method === key ? 'default' : 'ghost'}
                        onClick={() => setMethod(key as ForecastMethod)}
                        aria-pressed={method === key}
                        aria-label={`${label} forecast method${method === key ? ' (selected)' : ''}`}
                        data-testid={`method-${key}`}
                      >
                        <Icon className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">
                    Seasonality Preset
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ['standard', 'Standard'],
                        ['q4_spike', 'Q4 Spike'],
                        ['summer_peak', 'Summer Peak'],
                        ['flat', 'Flat'],
                      ] as const
                    ).map(([key, label]) => (
                      <Button
                        key={key}
                        size="sm"
                        variant={seasonality === key ? 'default' : 'ghost'}
                        onClick={() => setSeasonality(key as SeasonalityPreset)}
                        aria-pressed={seasonality === key}
                        data-testid={`seasonality-${key}`}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <h3 className="text-sm font-semibold mb-2">Driver Tree</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    {
                      driver: 'Revenue Growth',
                      formula: 'base × (1 + growth)',
                      impact: `→ ${fmt.currency0(forecastSeries[0] || 0)}`,
                    },
                    {
                      driver: 'Seasonality Weight',
                      formula: `${seasonality} × monthly weight`,
                      impact: `${formatNumber(SEASONALITY_WEIGHTS[seasonality][6], 2)} for Jul`,
                    },
                    {
                      driver: 'Prediction Band',
                      formula: bands
                        ? `±${BAND_Z}σ of backtest residuals`
                        : 'unavailable — needs a backtest',
                      impact: bands
                        ? `${fmt.currency0(bands.low[0] ?? 0)} – ${fmt.currency0(bands.high[0] ?? 0)}`
                        : '—',
                    },
                    {
                      driver: 'Driver: Headcount',
                      formula: 'hc × avgSalary',
                      impact: 'via opex driver',
                    },
                  ].map((d) => (
                    <div key={d.driver} className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="font-semibold text-xs">{d.driver}</div>
                      <div className="text-xs text-slate-400">{d.formula}</div>
                      <div className="text-xs font-mono text-blue-400">{d.impact}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="sr-only">Forecast Charts</h2>
          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecast with Confidence Bands</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                role="img"
                aria-label="Revenue forecast area chart from January to December. Actual values shown for Jan to Jun. Forecast with high and low confidence bands shown for Jul to Dec."
              >
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${formatCompact(v)}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                      formatter={(v) => fmt.currency0(Number(v))}
                    />
                    <Legend />
                    <Area
                      dataKey="high"
                      fill="#3b82f6"
                      fillOpacity={0.1}
                      stroke="none"
                      name="High"
                    />
                    <Area dataKey="low" fill="#3b82f6" fillOpacity={0.1} stroke="none" name="Low" />
                    <Line
                      dataKey="actual"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981' }}
                      name="Actual"
                    />
                    <Line
                      dataKey="forecast"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#3b82f6' }}
                      name="Forecast"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Forecast Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="space-y-3"
                  aria-label="Forecast accuracy metrics"
                  data-testid="accuracy-metrics"
                >
                  {accuracyMetrics.map((m) => (
                    <div
                      key={m.metric}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                    >
                      <div>
                        <div className="font-semibold text-sm">{m.metric}</div>
                        <div className="text-xs text-slate-400">{m.description}</div>
                      </div>
                      <div className="text-lg font-bold">
                        <span className="sr-only">{m.metric}: </span>
                        {m.value}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Driver Sensitivity</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="space-y-3"
                  aria-label="Driver sensitivity analysis"
                  data-testid="driver-sensitivity"
                >
                  {[
                    { driver: 'Headcount Growth', impact: '+$2.4M', sensitivity: 'High' },
                    { driver: 'Pricing Power', impact: '+$1.8M', sensitivity: 'Medium' },
                    { driver: 'Market Share', impact: '+$3.1M', sensitivity: 'High' },
                    { driver: 'Churn Rate', impact: '-$1.2M', sensitivity: 'Medium' },
                    { driver: 'ARPU Growth', impact: '+$960K', sensitivity: 'Low' },
                  ].map((d) => (
                    <div
                      key={d.driver}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                    >
                      <div>
                        <div className="font-semibold text-sm">{d.driver}</div>
                        <div className="text-xs text-slate-400">Sensitivity: {d.sensitivity}</div>
                      </div>
                      <div
                        className={`font-mono text-sm ${d.impact.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}
                      >
                        <span className="sr-only">Impact: </span>
                        {d.impact}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </main>
  );
}
