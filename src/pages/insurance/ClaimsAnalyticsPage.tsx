import { useState } from 'react';
import {
  FileSearch,
  TrendingUp,
  DollarSign,
  Users,
  AlertTriangle,
  BarChart3,
  Download,
  Filter,
  Clock,
  PieChart as PieChartIcon,
} from 'lucide-react';
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
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import type { FiscalPeriod } from '@/types';

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

const claimTrend = [
  { month: 'Jan', frequency: 1240, severity: 14200, totalPaid: 17600000 },
  { month: 'Feb', frequency: 1180, severity: 13800, totalPaid: 16280000 },
  { month: 'Mar', frequency: 1350, severity: 15100, totalPaid: 20380000 },
  { month: 'Apr', frequency: 1280, severity: 14500, totalPaid: 18560000 },
  { month: 'May', frequency: 1420, severity: 14800, totalPaid: 21020000 },
  { month: 'Jun', frequency: 1380, severity: 15200, totalPaid: 20980000 },
];

const claimsByType = [
  { name: 'Property Damage', value: 28, color: '#3b82f6' },
  { name: 'Bodily Injury', value: 22, color: '#ef4444' },
  { name: 'Liability', value: 18, color: '#f59e0b' },
  { name: 'Workers Comp', value: 15, color: '#10b981' },
  { name: 'Other', value: 17, color: '#6366f1' },
];

const claimDetails = [
  {
    id: 'CL-4401',
    claimant: 'Acme Corp',
    type: 'Property',
    incurred: '$240k',
    paid: '$185k',
    status: 'Open',
    severity: 'Medium',
    age: '45 Days',
  },
  {
    id: 'CL-4392',
    claimant: 'Jane Doe',
    type: 'Bodily Injury',
    incurred: '$1.2M',
    paid: '$890k',
    status: 'In Review',
    severity: 'High',
    age: '82 Days',
  },
  {
    id: 'CL-4415',
    claimant: 'City Transit Auth',
    type: 'Liability',
    incurred: '$680k',
    paid: '$420k',
    status: 'Open',
    severity: 'High',
    age: '28 Days',
  },
  {
    id: 'CL-4378',
    claimant: 'State Employee Fund',
    type: 'Workers Comp',
    incurred: '$145k',
    paid: '$112k',
    status: 'Closed',
    severity: 'Low',
    age: '120 Days',
  },
  {
    id: 'CL-4422',
    claimant: 'Smith Construction',
    type: 'Property',
    incurred: '$380k',
    paid: '$245k',
    status: 'Open',
    severity: 'Medium',
    age: '15 Days',
  },
];

const columns: Column[] = [
  { key: 'id', header: 'Claim ID', sortable: true },
  { key: 'claimant', header: 'Claimant' },
  { key: 'type', header: 'Type' },
  { key: 'incurred', header: 'Incurred', align: 'right' },
  { key: 'paid', header: 'Paid to Date', align: 'right' },
  {
    key: 'status',
    header: 'Status',
    render: (v) => (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          v === 'Open'
            ? 'bg-blue-100 text-blue-700'
            : v === 'In Review'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-green-100 text-green-700'
        }`}
      >
        {v}
      </span>
    ),
  },
  {
    key: 'severity',
    header: 'Severity',
    render: (v) => (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          v === 'High'
            ? 'bg-red-100 text-red-700'
            : v === 'Medium'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-green-100 text-green-700'
        }`}
      >
        {v}
      </span>
    ),
  },
  { key: 'age', header: 'Age', align: 'right' },
];

export default function ClaimsAnalyticsPage() {
  const [periodId, setPeriodId] = useState('P01');

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            Claims Analytics
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Claim frequency and severity tracking, loss development, and settlement cycle analysis.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
          <Button variant="outline" size="sm" className="h-10">
            <Download className="h-4 w-4 mr-2" />
            Loss Run Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Claim Count (MTD)"
          value="1,380"
          change={4.2}
          changeLabel="frequency up seasonally"
          trend="up"
          sparklineData={[1240, 1180, 1350, 1280, 1420, 1380]}
        />
        <KPIValue
          label="Avg Severity"
          value="$15,200"
          change={2.8}
          changeLabel="per claim incurred"
          trend="down"
          sparklineData={[14.2, 13.8, 15.1, 14.5, 14.8, 15.2]}
        />
        <KPIValue
          label="Total Incurred (YTD)"
          value="$114.8M"
          change={8.6}
          changeLabel="loss development"
          trend="down"
          sparklineData={[95, 98, 104, 108, 112, 114.8]}
        />
        <KPIValue
          label="Avg Cycle Time"
          value="42 Days"
          changeLabel="open to settlement"
          trend="neutral"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <CardTitle>Frequency & Severity Trend</CardTitle>
            </div>
            <CardDescription>
              Monthly claim volume and average cost per claim across all lines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={claimTrend}>
                  <defs>
                    <linearGradient id="colorFreq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Legend verticalAlign="top" align="right" />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="frequency"
                    name="Claim Count"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorFreq)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="totalPaid"
                    name="Total Paid"
                    stroke="#ef4444"
                    strokeWidth={2}
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
              <PieChartIcon className="h-5 w-5 text-indigo-500" />
              <CardTitle>Claims by Type</CardTitle>
            </div>
            <CardDescription>Distribution of current open claims</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={claimsByType}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {claimsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-1">
              {claimsByType.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="font-medium">{s.name}</span>
                  </div>
                  <span className="text-[var(--text-secondary)]">{s.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Active Claims Registry</CardTitle>
            <CardDescription>
              Detailed claim-level view with incurred amounts, paid-to-date, and aging metrics
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter Claims
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={claimDetails} />
        </CardContent>
      </Card>
    </div>
  );
}
