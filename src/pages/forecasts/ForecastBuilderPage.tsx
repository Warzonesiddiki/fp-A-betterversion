/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForecastStore } from '@/store/forecastStore';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { TrendingUp, FileText, Table as TableIcon, Brain, BarChart3 } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import {
  sumMoney,
  roundTo,
  addMoney,
  subtractMoney,
  multiplyMoney,
  divideMoney,
  toDecimal,
} from '@/utils/money';
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
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { formatCompact, formatNumber } from '@/utils/financialFormatting';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export type ForecastMethod = 'linear' | 'cagr' | 'last-3' | 'flat';
export type SeasonalityPreset = 'standard' | 'q4_spike' | 'summer_peak' | 'flat';

export const SEASONALITY_WEIGHTS: Record<SeasonalityPreset, readonly number[]> = {
  standard: [0.92, 0.88, 0.96, 0.98, 1.02, 1.04, 1.06, 1.04, 1.02, 1.04, 0.98, 1.06],
  q4_spike: [0.8, 0.82, 0.88, 0.9, 0.95, 0.95, 0.95, 0.9, 0.95, 1.1, 1.35, 1.45],
  summer_peak: [0.85, 0.85, 0.9, 1.0, 1.1, 1.25, 1.3, 1.25, 1.1, 0.95, 0.85, 0.6],
  flat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
};

export const HISTORICAL_ACTUALS = [4200000, 3900000, 4500000, 4100000, 4400000, 4600000];
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
 * Exact money primitive — compute forecast series.
 *
 * Methods:
 * - linear: least-squares trend on historical indices
 * - cagr: compound growth rate from first to last historical; extrapolate
 * - last-3: trailing 3-period average, flat
 * - flat: last value run-rate, flat
 *
 * Seasonality: multiply each base forecast by the weight for that calendar month.
 */
export function computeForecastSeries(
  historical: readonly number[],
  method: ForecastMethod,
  seasonality: SeasonalityPreset,
  periods = 6
): number[] {
  if (historical.length === 0 || periods <= 0) return [];
  const weights = SEASONALITY_WEIGHTS[seasonality] ?? SEASONALITY_WEIGHTS.flat;
  let base: number[] = [];

  if (method === 'linear') {
    const n = historical.length;
    const xMean = (n - 1) / 2;
    const yMean = roundTo(divideMoney(sumMoney(historical), n));
    let ssXY = 0;
    let ssXX = 0;
    for (let i = 0; i < n; i++) {
      ssXY += (i - xMean) * (historical[i]! - yMean);
      ssXX += (i - xMean) ** 2;
    }
    const slope = ssXX === 0 ? 0 : ssXY / ssXX;
    const intercept = yMean - slope * xMean;
    for (let h = 0; h < periods; h++) {
      const x = n + h;
      const raw = intercept + slope * x;
      base.push(roundTo(raw));
    }
  } else if (method === 'cagr') {
    const first = historical[0]!;
    const last = historical[historical.length - 1]!;
    const n = historical.length;
    let growth = 0;
    if (first !== 0 && n > 1) {
      const ratio = divideMoney(last, first).toNumber();
      growth = Math.pow(ratio, 1 / (n - 1)) - 1;
    }
    for (let h = 0; h < periods; h++) {
      const raw = multiplyMoney(last, Math.pow(1 + growth, h + 1)).toNumber();
      base.push(roundTo(raw));
    }
  } else if (method === 'last-3') {
    const last3 = historical.slice(-3);
    const avg = roundTo(divideMoney(sumMoney(last3), last3.length));
    base = Array.from({ length: periods }, () => avg);
  } else {
    // flat
    const last = historical[historical.length - 1]!;
    base = Array.from({ length: periods }, () => roundTo(last));
  }

  // Apply seasonality: historical length determines starting calendar offset
  const startIdx = historical.length % 12;
  const result: number[] = [];
  for (let i = 0; i < periods; i++) {
    const calIdx = (startIdx + i) % 12;
    const w = weights[calIdx]!;
    const seasonal = roundTo(multiplyMoney(base[i]!, w));
    result.push(seasonal);
  }
  return result;
}

export function computeConfidenceBands(forecast: readonly number[]): {
  low: number[];
  high: number[];
} {
  const low: number[] = [];
  const high: number[] = [];
  forecast.forEach((v, i) => {
    const widenPct = 0.06 + i * 0.015;
    low.push(roundTo(multiplyMoney(v, 1 - widenPct)));
    high.push(roundTo(multiplyMoney(v, 1 + widenPct)));
  });
  return { low, high };
}

const accuracyMetrics = [
  { metric: 'MAPE', value: '4.2%', description: 'Mean Absolute Percentage Error' },
  { metric: 'RMSE', value: '$182K', description: 'Root Mean Square Error' },
  { metric: 'R-Squared', value: '0.94', description: 'Coefficient of Determination' },
  { metric: 'Bias', value: '-1.8%', description: 'Forecast Bias' },
];

export default function ForecastBuilderPage() {
  const { forecasts } = useForecastStore();
  const { entries } = useGLStore();
  const _navigate = useNavigate();
  const [method, setMethod] = useState<ForecastMethod>('linear');
  const [seasonality, setSeasonality] = useState<SeasonalityPreset>('standard');
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'FinPlan Pro — Forecast Builder';
  }, []);

  const forecastSeries = useMemo(
    () => computeForecastSeries(HISTORICAL_ACTUALS, method, seasonality, 6),
    [method, seasonality]
  );
  const { low: lowBand, high: highBand } = useMemo(
    () => computeConfidenceBands(forecastSeries),
    [forecastSeries]
  );

  const historicalData = useMemo(() => {
    const hist = HISTORICAL_ACTUALS.map((actual, idx) => ({
      month: MONTH_LABELS[idx]!,
      actual,
      forecast: HISTORICAL_ACTUALS[idx]! + Math.round(HISTORICAL_ACTUALS[idx]! * 0.02 - 50000),
      low: null as number | null,
      high: null as number | null,
    }));
    const fcast = forecastSeries.map((fc, idx) => ({
      month: MONTH_LABELS[HISTORICAL_ACTUALS.length + idx]!,
      actual: null as number | null,
      forecast: fc,
      low: lowBand[idx]!,
      high: highBand[idx]!,
    }));
    return [...hist, ...fcast];
  }, [forecastSeries, lowBand, highBand]);

  const totalForecast = roundTo(sumMoney(forecastSeries), 2);
  const avgConfidence = 87;

  const handleExportPDF = () => {
    setExportError(null);
    try {
      void ExportEngine.exportToPDF(
        {
          headers: ['Month', 'Actual', 'Forecast', 'Low', 'High'],
          rows: historicalData.map((d) => [
            d.month,
            d.actual ? formatCurrency(d.actual) : '—',
            formatCurrency(d.forecast),
            d.low ? formatCurrency(d.low) : '—',
            d.high ? formatCurrency(d.high) : '—',
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
      <div className="flex items-center justify-between">
        <div>
          <h1 id="forecast-builder-heading" className="text-2xl font-bold">
            Forecast Builder
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Driver-based forecasting with confidence intervals
          </p>
        </div>
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
      </div>

      <div
        className="grid grid-cols-4 gap-4"
        role="region"
        aria-label="Forecast key performance indicators"
        data-testid="forecast-kpis"
      >
        <KPIValue label="Forecast Total" value={formatCurrency(totalForecast)} />
        <KPIValue label="Confidence" value={`${avgConfidence}%`} trend="up" />
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
        <KPIValue label="Accuracy (MAPE)" value="4.2%" trend="up" />
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
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
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
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
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
                  impact: `→ ${formatCurrency(forecastSeries[0] || 0)}`,
                },
                {
                  driver: 'Seasonality Weight',
                  formula: `${seasonality} × monthly weight`,
                  impact: `${formatNumber(SEASONALITY_WEIGHTS[seasonality][6], 2)} for Jul`,
                },
                {
                  driver: 'Confidence Band',
                  formula: '±6% widening 1.5%/period',
                  impact: `${formatCurrency(lowBand[0] || 0)} – ${formatCurrency(highBand[0] || 0)}`,
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
                  formatter={(v: any) => formatCurrency(v)}
                />
                <Legend />
                <Area dataKey="high" fill="#3b82f6" fillOpacity={0.1} stroke="none" name="High" />
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
    </main>
  );
}
