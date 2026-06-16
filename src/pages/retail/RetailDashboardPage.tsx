/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import {
  Store,
  TrendingUp,
  DollarSign,
  Users,
  ShoppingCart,
  BarChart3,
  Download,
  RefreshCw,
  Eye,
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

const salesTrend = [
  { month: 'Jan', compSales: 1250000, totalSales: 1850000, transactions: 42500 },
  { month: 'Feb', compSales: 1180000, totalSales: 1720000, transactions: 39800 },
  { month: 'Mar', compSales: 1420000, totalSales: 2100000, transactions: 48200 },
  { month: 'Apr', compSales: 1380000, totalSales: 2050000, transactions: 46500 },
  { month: 'May', compSales: 1550000, totalSales: 2250000, transactions: 51200 },
  { month: 'Jun', compSales: 1620000, totalSales: 2420000, transactions: 54800 },
];

const trafficData = [
  { name: 'In-Store', value: 284000, color: '#3b82f6' },
  { name: 'Online', value: 142000, color: '#10b981' },
  { name: 'Mobile App', value: 98000, color: '#f59e0b' },
  { name: 'Catalog', value: 24000, color: '#6366f1' },
];

const storePerformance = [
  {
    id: 'S-101',
    store: 'Flagship NYC',
    region: 'Northeast',
    sales: '$4.2M',
    compGrowth: '8.4%',
    traffic: '142k',
    conversion: '24.5%',
  },
  {
    id: 'S-203',
    store: 'Westside LA',
    region: 'West',
    sales: '$3.8M',
    compGrowth: '5.2%',
    traffic: '128k',
    conversion: '22.1%',
  },
  {
    id: 'S-305',
    store: 'Magnificent Mile',
    region: 'Midwest',
    sales: '$3.1M',
    compGrowth: '-1.2%',
    traffic: '98k',
    conversion: '18.7%',
  },
  {
    id: 'S-112',
    store: 'Houston Galleria',
    region: 'South',
    sales: '$2.8M',
    compGrowth: '6.5%',
    traffic: '112k',
    conversion: '21.3%',
  },
  {
    id: 'S-408',
    store: 'Miami Beach',
    region: 'Southeast',
    sales: '$3.5M',
    compGrowth: '12.1%',
    traffic: '156k',
    conversion: '28.4%',
  },
];

const columns: Column[] = [
  { key: 'store', header: 'Store Name', sortable: true },
  { key: 'region', header: 'Region' },
  { key: 'sales', header: 'Total Sales', align: 'right' },
  {
    key: 'compGrowth',
    header: 'Comp Growth',
    align: 'right',
    render: (v) => (
      <span
        className={
          v.startsWith('+') || parseFloat(v) > 0
            ? 'text-green-600 font-bold'
            : 'text-red-600 font-bold'
        }
      >
        {v}
      </span>
    ),
  },
  { key: 'traffic', header: 'Foot Traffic', align: 'right' },
  { key: 'conversion', header: 'Conversion', align: 'right' },
];

export default function RetailDashboardPage() {
  const [periodId, setPeriodId] = useState('P01');

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            Retail Dashboard
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Same-store sales performance, foot traffic analysis, and conversion rate optimization.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
          <Button variant="outline" size="sm" className="h-10">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Total Sales (YTD)"
          value="$12.4M"
          change={8.2}
          changeLabel="vs. same period last year"
          trend="up"
          sparklineData={[1.85, 1.72, 2.1, 2.05, 2.25, 2.42]}
        />
        <KPIValue
          label="Comp Store Sales Growth"
          value="6.8%"
          change={2.1}
          changeLabel="above industry avg"
          trend="up"
          sparklineData={[3.2, 4.0, 5.1, 5.8, 6.2, 6.8]}
        />
        <KPIValue
          label="Foot Traffic"
          value="548k"
          change={12.5}
          changeLabel="visitors this month"
          trend="up"
          sparklineData={[380, 420, 460, 480, 510, 548]}
        />
        <KPIValue
          label="Conversion Rate"
          value="24.2%"
          change={1.4}
          changeLabel="up 140 bps YoY"
          trend="up"
          sparklineData={[21.5, 22.0, 22.8, 23.2, 23.8, 24.2]}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <CardTitle>Sales & Transaction Volume</CardTitle>
            </div>
            <CardDescription>Monthly same-store and total revenue performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend}>
                  <defs>
                    <linearGradient id="colorCompSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    formatter={(v: any) => [`$${v.toLocaleString()}`, '']}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '20px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalSales"
                    name="Total Sales"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCompSales)"
                  />
                  <Area
                    type="monotone"
                    dataKey="compSales"
                    name="Same-Store Sales"
                    stroke="#10b981"
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
              <CardTitle>Traffic Channels</CardTitle>
            </div>
            <CardDescription>Customer acquisition by channel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trafficData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fontWeight: 600 }}
                    width={90}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                    {trafficData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {trafficData.slice(0, 3).map((s) => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="font-medium">{s.name}</span>
                  </div>
                  <span className="text-[var(--text-secondary)]">
                    {((s.value / 548000) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Store Performance Summary</CardTitle>
            <CardDescription>
              Same-store sales growth, traffic, and conversion across key locations
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View All Stores
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={storePerformance}
            caption="Store performance summary table"
            ariaLabel="Store performance summary data table for retail dashboard"
          />
        </CardContent>
      </Card>
    </div>
  );
}
