import { useState } from 'react';
import { useConstructionStore } from '@/store/constructionStore';
import {
  Construction,
  HardHat,
  TrendingUp,
  DollarSign,
  Briefcase,
  Clock,
  Download,
  Filter,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Layers,
} from 'lucide-react';
import { ConstructionEngine } from '@/engines/ConstructionEngine';
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
  ComposedChart,
  Line,
  Area,
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

const backlogTrend = [
  { month: 'Jan', backlog: 125000000, new_orders: 12000000, revenue: 15000000 },
  { month: 'Feb', backlog: 122000000, new_orders: 8000000, revenue: 11000000 },
  { month: 'Mar', backlog: 128000000, new_orders: 18000000, revenue: 12000000 },
  { month: 'Apr', backlog: 135000000, new_orders: 22000000, revenue: 15000000 },
  { month: 'May', backlog: 138000000, new_orders: 15000000, revenue: 12000000 },
  { month: 'Jun', backlog: 142000000, new_orders: 20000000, revenue: 16000000 },
];

const projectStatus = [
  {
    id: 'C-88',
    name: 'Downtown Plaza',
    client: 'City Dev Corp',
    status: 'In Progress',
    budget: '$42.5M',
    percent_complete: '65%',
    margin: '12.4%',
  },
  {
    id: 'C-92',
    name: 'Skyway Bridge',
    client: 'State DOT',
    status: 'Delayed',
    budget: '$118M',
    percent_complete: '42%',
    margin: '8.2%',
  },
  {
    id: 'C-75',
    name: 'Tech Hub Ph II',
    client: 'Global Systems',
    status: 'Optimal',
    budget: '$25.2M',
    percent_complete: '88%',
    margin: '14.5%',
  },
  {
    id: 'C-105',
    name: 'Westside Residential',
    client: 'Urban Living',
    status: 'In Progress',
    budget: '$18.4M',
    percent_complete: '15%',
    margin: '11.8%',
  },
  {
    id: 'C-64',
    name: 'Logistics Center',
    client: 'FastShip Inc',
    status: 'Completed',
    budget: '$32.1M',
    percent_complete: '100%',
    margin: '13.2%',
  },
];

const columns: Column[] = [
  { key: 'name', header: 'Project Name', sortable: true },
  { key: 'client', header: 'Client' },
  {
    key: 'status',
    header: 'Health',
    render: (v) => (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          v === 'Optimal' || v === 'Completed'
            ? 'bg-green-100 text-green-700'
            : v === 'Delayed'
              ? 'bg-red-100 text-red-700'
              : 'bg-blue-100 text-blue-700'
        }`}
      >
        {v}
      </span>
    ),
  },
  { key: 'budget', header: 'Total Budget', align: 'right' },
  {
    key: 'percent_complete',
    header: 'Completion',
    align: 'right',
    render: (v) => (
      <div className="flex flex-col items-end gap-1">
        <span className="text-[10px] font-bold">{v}</span>
        <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="bg-blue-500 h-full" style={{ width: v }} />
        </div>
      </div>
    ),
  },
  { key: 'margin', header: 'Est. Margin', align: 'right' },
];

export default function ConstructionDashboardPage() {
  const [periodId, setPeriodId] = useState('P01');

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            Construction Dashboard
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Global project pipeline: Revenue backlog, margin performance, and resource utilization.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
          <Button variant="outline" size="sm">
            <Layers className="h-4 w-4 mr-2" />
            Project Pipeline
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Total Backlog"
          value="$142.5M"
          change={8.4}
          changeLabel="new wins in Q1"
          trend="up"
          sparklineData={[125, 122, 128, 135, 138, 142.5]}
        />
        <KPIValue
          label="Revenue (YTD)"
          value="$74.2M"
          change={12.1}
          changeLabel="WIP conversion +5%"
          trend="up"
          sparklineData={[15, 11, 12, 15, 12, 16]}
        />
        <KPIValue
          label="Avg. Gross Margin"
          value="11.8%"
          change={-0.5}
          changeLabel="material cost impact"
          trend="down"
          sparklineData={[12.5, 12.2, 12.0, 11.9, 11.8, 11.8]}
        />
        <KPIValue
          label="Safety Incidents"
          value="0"
          changeLabel="Goal: Zero Harm"
          trend="neutral"
        />
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <CardTitle>Backlog & Book-to-Bill</CardTitle>
            </div>
            <CardDescription>Correlating new orders with revenue recognition</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={backlogTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v / 1000000}M`}
                  />
                  <Tooltip />
                  <Legend verticalAlign="top" align="right" />
                  <Bar
                    yAxisId="left"
                    dataKey="new_orders"
                    name="New Orders"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue Recognized"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-indigo-500" />
              <CardTitle>Resource Allocation</CardTitle>
            </div>
            <CardDescription>Direct vs. Subcontracted labor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Direct Labor</span>
                <span>42%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '42%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Subcontractors</span>
                <span>58%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '58%' }} />
              </div>
            </div>

            <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider mb-2">
                <Clock className="h-3 w-3" />
                Utilization Metrics
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-lg font-bold">92.4%</div>
                  <div className="text-[10px] text-slate-500">Fleet Uptime</div>
                </div>
                <div>
                  <div className="text-lg font-bold">84%</div>
                  <div className="text-[10px] text-slate-500">Staff Utilization</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Active Project Portfolio</CardTitle>
            <CardDescription>
              Real-time financial status and completion tracking for major contracts
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            WIP Report
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={projectStatus} />
        </CardContent>
      </Card>
    </div>
  );
}
