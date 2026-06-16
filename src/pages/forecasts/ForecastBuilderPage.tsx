/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForecastStore } from '@/store/forecastStore';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { TrendingUp, FileText, Table as TableIcon, Brain, BarChart3 } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
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

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

const historicalData = [
  { month: 'Jan', actual: 4200000, forecast: 4100000 },
  { month: 'Feb', actual: 3900000, forecast: 4000000 },
  { month: 'Mar', actual: 4500000, forecast: 4300000 },
  { month: 'Apr', actual: 4100000, forecast: 4200000 },
  { month: 'May', actual: 4400000, forecast: 4350000 },
  { month: 'Jun', actual: 4600000, forecast: 4500000 },
  { month: 'Jul', actual: null, forecast: 4700000, low: 4400000, high: 5000000 },
  { month: 'Aug', actual: null, forecast: 4850000, low: 4450000, high: 5250000 },
  { month: 'Sep', actual: null, forecast: 5000000, low: 4500000, high: 5500000 },
  { month: 'Oct', actual: null, forecast: 5150000, low: 4550000, high: 5750000 },
  { month: 'Nov', actual: null, forecast: 5300000, low: 4600000, high: 6000000 },
  { month: 'Dec', actual: null, forecast: 5500000, low: 4650000, high: 6350000 },
];

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
  const [method, setMethod] = useState<'linear' | 'seasonal' | 'ai'>('linear');
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'FinPlan Pro — Forecast Builder';
  }, []);

  const totalForecast = historicalData
    .filter((d) => d.actual === null)
    .reduce((s, d) => s + d.forecast, 0);
  const avgConfidence = 87;
  const _trendDirection = 'up';

  const handleExportPDF = () => {
    setExportError(null);
    try {
      ExportEngine.exportToPDF(
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
        { title: 'Forecast Report', subtitle: `Method: ${method}` }
      );
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Failed to export PDF');
    }
  };

  const handleExportExcel = () => {
    setExportError(null);
    try {
      ExportEngine.exportToExcel(
        {
          headers: ['Month', 'Actual', 'Forecast', 'Low', 'High'],
          rows: historicalData.map(
            (d) =>
              [d.month, d.actual, d.forecast, d.low, d.high] as (string | number | boolean | null)[]
          ),
        },
        { title: 'Forecast_Report' }
      );
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
          <h1 id="forecast-builder-heading" className="text-2xl font-bold">Forecast Builder</h1>
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
            method === 'linear' ? 'Linear' : method === 'seasonal' ? 'Seasonal' : 'AI-Assisted'
          }
        />
        <KPIValue label="Accuracy (MAPE)" value="4.2%" trend="up" />
      </div>

      <div className="flex gap-2">
        {(
          [
            ['linear', TrendingUp, 'Linear'],
            ['seasonal', BarChart3, 'Seasonal'],
            ['ai', Brain, 'AI-Assisted'],
          ] as const
        ).map(([key, Icon, label]) => (
          <Button
            key={key}
            size="sm"
            variant={method === key ? 'default' : 'ghost'}
            onClick={() => setMethod(key as typeof method)}
            aria-pressed={method === key}
            aria-label={`${label} forecast method${method === key ? ' (selected)' : ''}`}
            data-testid={`method-${key}`}
          >
            <Icon className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            {label}
          </Button>
        ))}
      </div>

      <h2 className="sr-only">Forecast Charts</h2>
      <Card>
        <CardHeader>
          <CardTitle>Revenue Forecast with Confidence Bands</CardTitle>
        </CardHeader>
        <CardContent>
          <div role="img" aria-label="Revenue forecast area chart from January to December. Actual values shown for Jan to Jun. Forecast with high and low confidence bands shown for Jul to Dec.">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} />
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
            <dl
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
                    <dt className="font-semibold text-sm">{m.metric}</dt>
                    <dd className="text-xs text-slate-400 m-0">{m.description}</dd>
                  </div>
                  <dd className="text-lg font-bold m-0">
                    <span className="sr-only">{m.metric}: </span>
                    {m.value}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Driver Sensitivity</CardTitle>
          </CardHeader>
          <CardContent>
            <dl
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
                    <dt className="font-semibold text-sm">{d.driver}</dt>
                    <dd className="text-xs text-slate-400 m-0">Sensitivity: {d.sensitivity}</dd>
                  </div>
                  <dd
                    className={`font-mono text-sm m-0 ${d.impact.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}
                  >
                    <span className="sr-only">Impact: </span>
                    {d.impact}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
