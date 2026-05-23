import { useState } from 'react';
import { useGLStore } from '@/store/glStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { SparklineChart } from '@/components/charts/SparklineChart';
import {
  TrendingUp,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Target,
} from 'lucide-react';

export default function RollingForecastPage() {
  const { entries } = useGLStore();
  const [period, setPeriod] = useState<'3m' | '6m' | '12m'>('12m');

  const totalRevenue = entries
    .filter((e) => e.type === 'credit')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = entries
    .filter((e) => e.type === 'debit')
    .reduce((sum, e) => sum + e.amount, 0);

  const netIncome = totalRevenue - totalExpenses;
  const forecastAccuracy = 94.2;

  const trendData = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2026, i).toLocaleString('default', { month: 'short' }),
    actual: Math.round(totalRevenue * (0.8 + Math.random() * 0.4)),
    forecast: Math.round(totalRevenue * (0.85 + Math.random() * 0.3)),
  }));

  const variance = trendData.map((d) => ({
    name: d.month,
    value: ((d.actual - d.forecast) / d.forecast) * 100,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rolling Forecast</h1>
          <p className="text-muted-foreground">Continuous 12-month forward-looking forecast</p>
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
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Forecast Revenue"
              value={totalRevenue}
              icon={<TrendingUp className="h-4 w-4" />}
              format="currency"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Forecast Expenses"
              value={totalExpenses}
              icon={<ArrowDownRight className="h-4 w-4" />}
              format="currency"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Net Income"
              value={netIncome}
              icon={<ArrowUpRight className="h-4 w-4" />}
              format="currency"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <KPIValue
              label="Forecast Accuracy"
              value={forecastAccuracy}
              icon={<Target className="h-4 w-4" />}
              format="percent"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Actual vs Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {trendData.map((d) => (
                <div key={d.month} className="flex items-center gap-4">
                  <span className="w-10 text-xs text-muted-foreground">{d.month}</span>
                  <div className="flex-1 flex gap-1">
                    <div
                      className="h-4 bg-blue-500 rounded"
                      style={{ width: `${(d.actual / totalRevenue) * 100}%` }}
                    />
                    <div
                      className="h-4 bg-blue-300 rounded border border-dashed border-blue-500"
                      style={{ width: `${(d.forecast / totalRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="w-16 text-xs text-right">
                    {d.actual > d.forecast ? '+' : ''}
                    {(((d.actual - d.forecast) / d.forecast) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Variance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <SparklineChart
              data={variance.map((v) => v.value)}
              color={variance.some((v) => v.value < -5) ? '#EF4444' : '#10B981'}
              height={120}
              width={400}
              ariaLabel="Variance trend chart"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Forecast Assumptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-slate-800 rounded-lg">
              <div className="text-muted-foreground">Revenue Growth</div>
              <div className="text-lg font-bold text-green-400">+5.2%</div>
              <div className="text-xs text-muted-foreground">Based on 12-month trend</div>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg">
              <div className="text-muted-foreground">Expense Inflation</div>
              <div className="text-lg font-bold text-orange-400">+3.1%</div>
              <div className="text-xs text-muted-foreground">CPI-adjusted</div>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg">
              <div className="text-muted-foreference">Confidence Interval</div>
              <div className="text-lg font-bold text-blue-400">±8.5%</div>
              <div className="text-xs text-muted-foreground">95% CI</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
