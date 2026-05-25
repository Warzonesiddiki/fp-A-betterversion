import { useState } from 'react';

import { BarChart3, Download, RefreshCw } from 'lucide-react';
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

// Mock Data
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
  {
    id: 'P03',
    name: 'March',
    year: 2026,
    periodNumber: 3,
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    periodType: 'Monthly',
    isAdjustingPeriod: false,
    isClosed: false,
    closedAt: null,
    closedBy: null,
  },
];

const trendData = [
  { month: 'Jan', revenue: 1250000, cost: 850000, production: 4200 },
  { month: 'Feb', revenue: 1320000, cost: 880000, production: 4500 },
  { month: 'Mar', revenue: 1180000, cost: 920000, production: 4100 },
  { month: 'Apr', revenue: 1450000, cost: 910000, production: 4800 },
  { month: 'May', revenue: 1600000, cost: 950000, production: 5200 },
  { month: 'Jun', revenue: 1550000, cost: 940000, production: 5000 },
];

const sourceData = [
  { name: 'Solar', value: 450, color: '#f59e0b' },
  { name: 'Wind', value: 380, color: '#10b981' },
  { name: 'Hydro', value: 210, color: '#3b82f6' },
  { name: 'Thermal', value: 150, color: '#6366f1' },
  { name: 'Nuclear', value: 300, color: '#8b5cf6' },
];

const assetPerformance = [
  {
    id: '1',
    asset: 'Solar Farm Alpha',
    output: '24.5 MWh',
    efficiency: '94.2%',
    status: 'Optimal',
    cost: '$12,400',
  },
  {
    id: '2',
    asset: 'Wind Park Beta',
    output: '18.2 MWh',
    efficiency: '88.7%',
    status: 'Maintenance',
    cost: '$15,800',
  },
  {
    id: '3',
    asset: 'Hydro Station Gamma',
    output: '12.8 MWh',
    efficiency: '91.5%',
    status: 'Optimal',
    cost: '$8,200',
  },
  {
    id: '4',
    asset: 'Solar Array Delta',
    output: '15.4 MWh',
    efficiency: '76.3%',
    status: 'Warning',
    cost: '$14,100',
  },
  {
    id: '5',
    asset: 'Thermal Plant Epsilon',
    output: '42.1 MWh',
    efficiency: '82.1%',
    status: 'Optimal',
    cost: '$54,000',
  },
];

const columns: Column[] = [
  { key: 'asset', header: 'Asset Name', sortable: true },
  { key: 'output', header: 'Energy Output', align: 'right' },
  { key: 'efficiency', header: 'Efficiency', align: 'right' },
  {
    key: 'status',
    header: 'Status',
    render: (value) => (
      <span
        className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
          value === 'Optimal'
            ? 'bg-green-100 text-green-700'
            : value === 'Maintenance'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-yellow-100 text-yellow-700'
        }`}
      >
        {value}
      </span>
    ),
  },
  { key: 'cost', header: 'Operating Cost', align: 'right' },
];

export default function EnergyDashboardPage() {
  const [periodId, setPeriodId] = useState('P01');

  const handleExport = () => {
    // Export handled by ExportEngine
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            Energy Dashboard
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Monitor production efficiency, revenue streams, and asset performance across all grids.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
          <Button variant="outline" size="sm" onClick={handleExport} className="h-10">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Refresh data">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 2. KPI Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Total Energy Revenue"
          value="$14.2M"
          change={12.5}
          changeLabel="vs. previous month"
          sparklineData={[42, 45, 41, 48, 52, 50, 55]}
        />
        <KPIValue
          label="Grid Production"
          value="8,420 MWh"
          change={8.2}
          changeLabel="efficiency up 2.1%"
          trend="up"
          sparklineData={[30, 35, 40, 38, 42, 45, 48]}
        />
        <KPIValue
          label="Avg. Market Price"
          value="$87.50"
          change={-1.8}
          changeLabel="MWh pricing stable"
          trend="down"
          sparklineData={[92, 90, 89, 88, 87, 88, 87.5]}
        />
        <KPIValue
          label="Carbon Intensity"
          value="240 g/kWh"
          change={-4.2}
          changeLabel="15% below target"
          trend="up" // Up is good here (intensity down)
          sparklineData={[280, 270, 265, 255, 250, 245, 240]}
        />
      </div>

      {/* 3. Main Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Revenue vs. Cost Trend</CardTitle>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Monthly financial performance across all sectors
              </p>
            </div>
            <BarChart3 className="h-4 w-4 text-[var(--text-secondary)] opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
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
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    name="Operating Cost"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fillOpacity={1}
                    fill="url(#colorCost)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Production by Source</CardTitle>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Current mix of energy generation
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fontWeight: 600 }}
                    width={80}
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
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {sourceData.slice(0, 3).map((s) => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="font-medium">{s.name}</span>
                  </div>
                  <span className="text-[var(--text-secondary)]">
                    {(s.value / 14.9).toFixed(1)}% of total
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Detail Table Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Asset Performance Analysis</CardTitle>
            <CardDescription>
              Detailed efficiency and output metrics for major energy assets
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            View All Assets
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={assetPerformance} />
        </CardContent>
      </Card>
    </div>
  );
}
