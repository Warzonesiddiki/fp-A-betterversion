import { useState } from 'react';

import { Activity, BarChart3, Download, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { DataTable, Column } from '@/components/ui/DataTable';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import type { FiscalPeriod } from '@/types';
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
  {
    id: 'P02',
    name: 'February',
    year: 2026,
    periodNumber: 2,
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    periodType: 'Monthly',
    isAdjustingPeriod: false,
    isClosed: false,
    closedAt: null,
    closedBy: null,
  },
];

const combinedRatioTrend = [
  { month: 'Jan', lossRatio: 62.5, expenseRatio: 28.4, combined: 90.9 },
  { month: 'Feb', lossRatio: 64.1, expenseRatio: 27.8, combined: 91.9 },
  { month: 'Mar', lossRatio: 60.8, expenseRatio: 28.1, combined: 88.9 },
  { month: 'Apr', lossRatio: 58.2, expenseRatio: 27.5, combined: 85.7 },
  { month: 'May', lossRatio: 59.5, expenseRatio: 27.2, combined: 86.7 },
  { month: 'Jun', lossRatio: 57.8, expenseRatio: 26.9, combined: 84.7 },
];

const premiumByLine = [
  { name: 'Auto', written: 12400000, earned: 11200000, color: '#3b82f6' },
  { name: 'Homeowners', written: 8200000, earned: 7800000, color: '#10b981' },
  { name: 'Life', written: 6500000, earned: 6200000, color: '#f59e0b' },
  { name: 'Commercial', written: 15400000, earned: 14100000, color: '#6366f1' },
  { name: 'Health', written: 9200000, earned: 8800000, color: '#ec4899' },
];

const underwritingResults = [
  {
    id: 'L-01',
    line: 'Personal Auto',
    premium: '$12.4M',
    losses: '$6.8M',
    lossRatio: '54.8%',
    combined: '88.2%',
    trend: 'Improving',
  },
  {
    id: 'L-02',
    line: 'Homeowners',
    premium: '$8.2M',
    losses: '$5.4M',
    lossRatio: '65.9%',
    combined: '95.4%',
    trend: 'Stable',
  },
  {
    id: 'L-03',
    line: 'Commercial Property',
    premium: '$15.4M',
    losses: '$8.2M',
    lossRatio: '53.2%',
    combined: '82.5%',
    trend: 'Improving',
  },
  {
    id: 'L-04',
    line: 'Workers Comp',
    premium: '$5.8M',
    losses: '$3.9M',
    lossRatio: '67.2%',
    combined: '98.1%',
    trend: 'Worsening',
  },
  {
    id: 'L-05',
    line: 'General Liability',
    premium: '$6.5M',
    losses: '$3.1M',
    lossRatio: '47.7%',
    combined: '78.4%',
    trend: 'Improving',
  },
];

const columns: Column[] = [
  { key: 'line', header: 'Line of Business', sortable: true },
  { key: 'premium', header: 'Net Written Premium', align: 'right' },
  { key: 'losses', header: 'Incurred Losses', align: 'right' },
  { key: 'lossRatio', header: 'Loss Ratio', align: 'right' },
  { key: 'combined', header: 'Combined Ratio', align: 'right' },
  {
    key: 'trend',
    header: 'Trend',
    render: (v) => (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          String(v) === 'Improving'
            ? 'bg-green-100 text-green-700'
            : String(v) === 'Worsening'
              ? 'bg-red-100 text-red-700'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
        }`}
      >
        {String(v)}
      </span>
    ),
  },
];

export default function InsuranceDashboardPage() {
  const [periodId, setPeriodId] = useState('P01');

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            Insurance Dashboard
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Enterprise underwriting performance: Combined ratio monitoring, premium growth, and loss
            trends.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
          <Button variant="outline" size="sm" className="h-10">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Combined Ratio"
          value="84.7%"
          change={-6.2}
          changeLabel="improving profitability"
          trend="up"
          sparklineData={[90.9, 91.9, 88.9, 85.7, 86.7, 84.7]}
        />
        <KPIValue
          label="Net Written Premium"
          value="$51.7M"
          change={14.2}
          changeLabel="YTD growth 12%"
          trend="up"
          sparklineData={[42, 44, 46, 48, 50, 51.7]}
        />
        <KPIValue
          label="Loss Ratio (YTD)"
          value="58.9%"
          change={-2.4}
          changeLabel="favorable reserve dev."
          trend="up"
          sparklineData={[62.5, 64.1, 60.8, 58.2, 59.5, 57.8]}
        />
        <KPIValue
          label="Policy Count"
          value="142,800"
          change={5.8}
          changeLabel="new business up 8%"
          trend="up"
          sparklineData={[128, 132, 135, 138, 140, 142.8]}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <CardTitle>Combined Ratio Decomposition</CardTitle>
            </div>
            <CardDescription>
              {'Loss ratio + Expense ratio = Combined ratio (target < 95%)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={combinedRatioTrend}>
                  <defs>
                    <linearGradient id="colorCombined" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${String(v)}%`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(v) => `${formatPercent(Number(v), 1)}`}
                  />
                  <Legend verticalAlign="top" align="right" />
                  <Area
                    type="monotone"
                    dataKey="combined"
                    name="Combined Ratio"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCombined)"
                  />
                  <Area
                    type="monotone"
                    dataKey="lossRatio"
                    name="Loss Ratio"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="transparent"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenseRatio"
                    name="Expense Ratio"
                    stroke="#f59e0b"
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
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              <CardTitle>Premium by Line</CardTitle>
            </div>
            <CardDescription>Written vs. Earned premium</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={premiumByLine} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600 }}
                    width={90}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    formatter={(v) => `$${formatCompact(Number(v))}`}
                  />
                  <Legend />
                  <Bar
                    dataKey="written"
                    name="Written Premium"
                    fill="#3b82f6"
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                  />
                  <Bar
                    dataKey="earned"
                    name="Earned Premium"
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Underwriting Results by Line</CardTitle>
            <CardDescription>
              Loss ratios, combined ratios, and trend direction for all active product lines
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Detailed Report
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={underwritingResults}
            caption="Insurance underwriting results"
            ariaLabel="Underwriting results table"
          />
        </CardContent>
      </Card>
    </div>
  );
}
