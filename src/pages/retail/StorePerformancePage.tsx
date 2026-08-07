import { useMemo, useState } from 'react';
import { Store, DollarSign, Users, Download, Award } from 'lucide-react';
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
import { formatCompact, formatPercent } from '@/utils/financialFormatting';

const mockPeriods: FiscalPeriod[] = [
  {
    id: 'P01',
    name: 'January',
    year: 2026,
    periodNumber: 1,
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    periodType: 'Monthly',
    isAdjustingPeriod: false,
    isClosed: true,
    closedAt: '2026-02-05',
    closedBy: 'User1',
  },
];

const columns: Column[] = [
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
                : 'bg-transparent text-slate-500'
        }`}
      >
        {v as number}
      </span>
    ),
  },
  { key: 'name', header: 'Store Name', sortable: true },
  { key: 'region', header: 'Region', render: () => 'North' },
  {
    key: 'revenue',
    header: 'Revenue Period',
    align: 'right',
    render: (v) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(v as number),
  },
  {
    key: 'netProfit',
    header: 'Net Profit',
    align: 'right',
    render: (v) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(v as number),
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
];

export default function StorePerformancePage() {
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

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <Store className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Retail Data</h2>
        <p className="text-slate-400 mb-6">
          Import your Store-level General Ledger to view P&L analysis and labor efficiency
          benchmarking.
        </p>
        <Button>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            Store Performance
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Per-location P&L analysis, labor efficiency benchmarking, and sales productivity
            rankings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
          <Button variant="outline" size="sm" className="h-10">
            <Download className="h-4 w-4 mr-2" />
            Export Store P&L
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Avg Revenue Per Store"
          value={new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 1,
            notation: 'compact',
          }).format(stats.avgRevenuePerStore)}
          change={6.8}
          changeLabel="blended performance"
          trend="up"
          sparklineData={[2.8, 3.0, 3.1, 3.2, 3.35, stats.avgRevenuePerStore / 1000000]}
        />
        <KPIValue
          label="Avg Net Margin"
          value={`${formatPercent(stats.avgNetMargin, 1)}`}
          change={1.4}
          changeLabel="portfolio benchmark"
          trend="up"
          sparklineData={[25.0, 25.5, 26.2, 26.8, 27.2, stats.avgNetMargin]}
        />
        <KPIValue
          label="Sales per Labor Hour"
          value={`$${stats.salesPerLaborHour}`}
          change={5.2}
          changeLabel="scheduling optimization"
          trend="up"
          sparklineData={[228, 235, 240, 244, 250, stats.salesPerLaborHour]}
        />
        <KPIValue
          label="Avg Customer Satisfaction"
          value={`${stats.avgCustSat}%`}
          change={0.8}
          changeLabel="NPS leader in region"
          trend="up"
          sparklineData={[90.5, 91.0, 91.5, 92.0, 92.4, stats.avgCustSat]}
        />
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Store Ranking & Productivity</CardTitle>
            <CardDescription>
              Full P&L comparison across all locations with profitability rankings
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Award className="h-4 w-4 mr-2" />
            Top Performers
          </Button>
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
