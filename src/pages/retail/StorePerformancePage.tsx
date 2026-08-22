// W-FAB remediation (phase0-exit amendment item 3). The previous revision:
//   - rendered a "Region" column hardcoding 'North' for every store row;
//   - decorated KPI cards with invented trend deltas (change={6.8} "blended
//     performance", {1.4} "portfolio benchmark", {5.2} "scheduling
//     optimization", {0.8} "NPS leader in region") and fabricated sparkline
//     histories ([2.8, 3.0 …], [25.0 …], [228…250], [90.5…92.4]);
//   - rendered RetailEngine.calculateDashboardStats() placeholder fields as
//     measured KPIs: salesPerLaborHour is hardcoded 254 ("Needs operational
//     data") and avgCustSat is hardcoded 92.8 in that engine.
// Sales-per-labor-hour and customer satisfaction are not derivable from the
// GL; they are disclosed below instead of displayed. Avg revenue/store and avg
// net margin remain — they are computed from posted entries by the engine.
import { buildFiscalPeriods } from '@/utils/fiscalPeriods';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, DollarSign, Users, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { DataTable, Column } from '@/components/ui/DataTable';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import type { FiscalPeriod } from '@/types';
import { useGLStore } from '@/store/glStore';
import { RetailEngine } from '@/engines/RetailEngine';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { formatCompact, formatPercent } from '@/utils/financialFormatting';

const mockPeriods: FiscalPeriod[] = buildFiscalPeriods();

export default function StorePerformancePage() {
  const fmtCurrency = useCurrencyFormatter();
  const navigate = useNavigate();

  const columns = useMemo<Column[]>(
    () => [
      {
        key: 'rank',
        header: 'Rank',
        align: 'center',
        render: (v) => (
          <span
            className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold ${
              v === 1
                ? 'bg-yellow-100 text-yellow-700'
                : v === 2
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  : v === 3
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-transparent text-[var(--text-muted)]'
            }`}
          >
            {v as number}
          </span>
        ),
      },
      { key: 'name', header: 'Store Name', sortable: true },
      {
        key: 'revenue',
        header: 'Revenue Period',
        align: 'right',
        render: (v) => fmtCurrency.custom({ maxDecimals: 0 })(v as number),
      },
      {
        key: 'netProfit',
        header: 'Net Profit',
        align: 'right',
        render: (v) => fmtCurrency.custom({ maxDecimals: 0 })(v as number),
      },
      {
        key: 'margin',
        header: 'Net Margin',
        align: 'right',
        render: (v) => `${formatPercent(v as number, 1)}`,
      },
      {
        key: 'laborPercent',
        header: 'Labor %',
        align: 'right',
        render: (v) => `${formatPercent(v as number, 1)}`,
      },
    ],
    [fmtCurrency]
  );
  const { entries } = useGLStore();
  const [periodId, setPeriodId] = useState('P01');

  const stats = useMemo(() => {
    return RetailEngine.calculateDashboardStats(entries);
  }, [entries]);

  const storePnLTrend = useMemo(() => {
    return RetailEngine.getPnLTrend(entries);
  }, [entries]);

  const storeRankings = useMemo(() => {
    return RetailEngine.getStoreBreakdown(entries);
  }, [entries]);

  const handleExport = () => {
    void ExportEngine.exportToPDF(
      {
        headers: ['Store', 'Revenue', 'COGS', 'Gross Profit', 'Net Profit', 'Margin %'],
        rows: storeRankings.map((s) => [
          s.name,
          fmtCurrency.custom({ maxDecimals: 0 })(s.revenue),
          fmtCurrency.custom({ maxDecimals: 0 })(s.cogs),
          fmtCurrency.custom({ maxDecimals: 0 })(s.grossProfit),
          fmtCurrency.custom({ maxDecimals: 0 })(s.netProfit),
          formatPercent(s.margin, 1),
        ]),
      },
      { title: 'Store P&L Report' }
    ).catch(reportExportFailure);
  };

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <Store className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h1 className="text-xl font-semibold mb-2">No Retail Data</h1>
        <p className="text-[var(--text-muted)] mb-6">
          Import your Store-level General Ledger to view P&L analysis. Labor-hour and satisfaction
          benchmarks are not invented.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Store Performance"
          purpose={
            'Per-location P&L analysis, labor efficiency benchmarking, and sales productivity rankings.'
          }
        />
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
          <Button variant="outline" size="sm" className="h-10" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Store P&L
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="store-perf-kpis">
        <KPIValue
          label="Avg Revenue Per Store"
          value={fmtCurrency.custom({ maxDecimals: 1, compact: true })(stats.avgRevenuePerStore)}
        />
        <KPIValue label="Avg Net Margin" value={`${formatPercent(stats.avgNetMargin, 1)}`} />
        {/* Not derivable from the GL: disclosed instead of rendering the
            engine's placeholder salesPerLaborHour (254) / avgCustSat (92.8). */}
        <Card className="md:col-span-2 border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Not derivable from the posted GL</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-[var(--text-muted)]">
              Sales per labor hour needs hours worked from a payroll/time-clock feed; customer
              satisfaction needs survey data. Both were previously displayed with fixed placeholder
              values (254 and 92.8%) — they are now omitted rather than estimated.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <CardTitle>Aggregate Store P&L Trend</CardTitle>
            </div>
            <CardDescription>
              Revenue, gross profit, and major cost components across all locations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={storePnLTrend}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${formatCompact(v)}`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(v) => `$${Number(v).toLocaleString()}`}
                  />
                  <Legend verticalAlign="top" align="right" />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="grossProfit"
                    name="Gross Profit"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="transparent"
                  />
                  <Area
                    type="monotone"
                    dataKey="labor"
                    name="Labor Cost"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              <CardTitle>Labor Efficiency</CardTitle>
            </div>
            <CardDescription>Sales productivity by store</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={storeRankings} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 600 }}
                    width={95}
                  />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]} barSize={20}>
                    {storeRankings.map((_entry, i) => (
                      <Cell key={i} fill={i < 2 ? '#3b82f6' : '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Store Ranking & Productivity</CardTitle>
          <CardDescription>
            Full P&L comparison across all posted locations with profitability rankings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={storeRankings}
            caption="Store ranking and productivity table"
            ariaLabel="Store ranking and productivity data table for retail performance"
          />
        </CardContent>
      </Card>
    </div>
  );
}
