/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import {
  Wrench,
  Zap,
  Droplets,
  ShieldCheck,
  AlertTriangle,
  BarChart3,
  TrendingDown,
  Download,
  Clock,
  Settings,
} from 'lucide-react';
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
  LineChart,
  Line,
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
];

const maintenanceCostTrend = [
  { month: 'Jan', planned: 120000, reactive: 45000 },
  { month: 'Feb', planned: 125000, reactive: 38000 },
  { month: 'Mar', planned: 110000, reactive: 62000 },
  { month: 'Apr', planned: 130000, reactive: 25000 },
  { month: 'May', planned: 120000, reactive: 18000 },
  { month: 'Jun', planned: 125000, reactive: 22000 },
];

const facilityOpEx = [
  {
    id: 'F-101',
    name: 'Skyline Tower',
    opex_sqft: '$8.42',
    utilities: '$42k',
    cleaning: '$18k',
    maintenance: '$24k',
    efficiency: 'A',
  },
  {
    id: 'F-105',
    name: 'Green Gardens',
    opex_sqft: '$5.15',
    utilities: '$12k',
    cleaning: '$8k',
    maintenance: '$15k',
    efficiency: 'B+',
  },
  {
    id: 'F-112',
    name: 'Harbor Logistics',
    opex_sqft: '$3.20',
    utilities: '$85k',
    cleaning: '$5k',
    maintenance: '$32k',
    efficiency: 'A-',
  },
  {
    id: 'F-108',
    name: 'Metro Plaza',
    opex_sqft: '$12.40',
    utilities: '$64k',
    cleaning: '$32k',
    maintenance: '$45k',
    efficiency: 'C',
  },
  {
    id: 'F-115',
    name: 'Westside Med',
    opex_sqft: '$15.80',
    utilities: '$92k',
    cleaning: '$45k',
    maintenance: '$58k',
    efficiency: 'A',
  },
];

const columns: Column[] = [
  { key: 'name', header: 'Facility Name', sortable: true },
  { key: 'opex_sqft', header: 'OpEx / SqFt', align: 'right' },
  { key: 'utilities', header: 'Utilities', align: 'right' },
  { key: 'cleaning', header: 'Cleaning', align: 'right' },
  { key: 'maintenance', header: 'Maintenance', align: 'right' },
  {
    key: 'efficiency',
    header: 'Energy Rating',
    align: 'center',
    render: (v) => (
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          v.startsWith('A')
            ? 'bg-green-100 text-green-700'
            : v.startsWith('B')
              ? 'bg-blue-100 text-blue-700'
              : 'bg-yellow-100 text-yellow-700'
        }`}
      >
        {v}
      </span>
    ),
  },
];

export default function FacilityManagementPage() {
  const [periodId, setPeriodId] = useState('P01');

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-left-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            Facility Operations
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            OpEx tracking, maintenance efficiency, and sustainability benchmarks across the
            portfolio.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Service Rules
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Total Facility OpEx"
          value="$1.24M"
          change={-4.2}
          changeLabel="energy efficiency lift"
          trend="up"
          sparklineData={[1.4, 1.35, 1.32, 1.3, 1.28, 1.26, 1.24]}
        />
        <KPIValue
          label="Reactive Maint. %"
          value="14.5%"
          change={-8.4}
          changeLabel="Target: <15%"
          trend="up"
          sparklineData={[22, 20, 21, 18, 17, 16, 14.5]}
        />
        <KPIValue
          label="Energy Intensity"
          value="18.2 kWh/sqft"
          change={-2.1}
          changeLabel="HVAC upgrades online"
          trend="up"
          sparklineData={[20, 19.5, 19.2, 19, 18.8, 18.5, 18.2]}
        />
        <KPIValue
          label="Open Work Orders"
          value="42"
          change={12}
          changeLabel="SLA compliance 98%"
          trend="neutral"
        />
      </div>

      {/* Main Analysis */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-500" />
              <CardTitle>Maintenance Spend Mix</CardTitle>
            </div>
            <CardDescription>Planned preventative vs. Reactive/Emergency repairs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maintenanceCostTrend} stackOffset="none">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip />
                  <Legend verticalAlign="top" align="right" />
                  <Bar
                    dataKey="planned"
                    name="Planned Preventative"
                    fill="#3b82f6"
                    stackId="a"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="reactive"
                    name="Reactive / Repair"
                    fill="#ef4444"
                    stackId="a"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utility Benchmarking</CardTitle>
            <CardDescription>Cost per Square Foot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                <Zap className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">
                  Electricity Avg
                </div>
                <div className="text-lg font-bold">$2.45 / sqft</div>
              </div>
              <div className="ml-auto text-green-600 text-xs font-bold">-5.2%</div>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                <Droplets className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Water / Sewage</div>
                <div className="text-lg font-bold">$0.82 / sqft</div>
              </div>
              <div className="ml-auto text-slate-400 text-xs font-bold">Stable</div>
            </div>

            <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider mb-2">
                <ShieldCheck className="h-3 w-3" />
                SLA Compliance
              </div>
              <div className="flex items-end gap-2">
                <div className="text-2xl font-black text-indigo-800">98.4%</div>
                <div className="text-[10px] text-indigo-600 mb-1">Target: 95.0%</div>
              </div>
              <p className="text-indigo-600 text-[9px] mt-2 font-medium">
                Average response time for Priority 1 tickets:{' '}
                <span className="font-bold">42 minutes</span>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Facility Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Site Operational Ledger</CardTitle>
            <CardDescription>
              Property-level OpEx breakout and utility efficiency tracking
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Vendor Export
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={facilityOpEx} />
        </CardContent>
      </Card>
    </div>
  );
}
