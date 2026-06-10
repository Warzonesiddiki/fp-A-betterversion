import { useMemo, useState } from 'react';

import {
  Building2,
  Home,
  DollarSign,
  TrendingUp,
  MapPin,
  Users,
  Download,
  Filter,
  ArrowUpRight,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { FiscalPeriod } from '@/types';
import { useGLStore } from '@/store/glStore';
import { RealEstateEngine } from '@/engines';

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

const occupancyData = [
  { month: 'Jan', residential: 94, commercial: 88, industrial: 98 },
  { month: 'Feb', residential: 95, commercial: 89, industrial: 98 },
  { month: 'Mar', residential: 94, commercial: 91, industrial: 97 },
  { month: 'Apr', residential: 96, commercial: 90, industrial: 99 },
  { month: 'May', residential: 97, commercial: 92, industrial: 99 },
  { month: 'Jun', residential: 98, commercial: 93, industrial: 99 },
];

const columns: Column[] = [
  { key: 'name', header: 'Property Name', sortable: true },
  { key: 'status', header: 'Asset Class' },
  {
    key: 'currentVal',
    header: 'Fair Value',
    align: 'right',
    render: (v) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(v as number),
  },
  {
    key: 'noi',
    header: 'NOI (Est)',
    align: 'right',
    render: (v) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format((v as number) || 0),
  },
  {
    key: 'occupancy',
    header: 'Occupancy',
    align: 'right',
    render: (v) => (
      <span
        className={
          parseFloat((v as string) || '95') > 95
            ? 'text-green-600 font-bold'
            : 'text-blue-600 font-bold'
        }
      >
        {(v as string) || '94.8%'}
      </span>
    ),
  },
  {
    key: 'yield',
    header: 'Cap Rate',
    align: 'right',
    render: (v) => `${v}%`,
  },
];

export default function RealEstateDashboardPage() {
  const { entries } = useGLStore();
  const [periodId, setPeriodId] = useState('P01');

  const stats = useMemo(() => {
    return RealEstateEngine.calculateDashboardStats(entries);
  }, [entries]);

  const assetClassData = useMemo(() => {
    const breakdown = RealEstateEngine.getPropertyBreakdown(entries);
    const classes = ['Office', 'Residential', 'Industrial', 'Retail', 'Healthcare'];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];

    return classes.map((name, i) => ({
      name,
      value:
        breakdown
          .filter((p) => p.status === (i === 0 ? 'Core' : 'Value-Add'))
          .reduce((acc, p) => acc + p.currentVal, 0) || 20000000 / (i + 1),
      color: colors[i]!,
    }));
  }, [entries]);

  const topAssets = useMemo(() => {
    return RealEstateEngine.getPropertyBreakdown(entries);
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <Building2 className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Real Estate Data</h2>
        <p className="text-slate-400 mb-6">
          Import your Real Estate General Ledger to view global portfolio analytics and occupancy
          trends.
        </p>
        <Button>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            Real Estate Dashboard
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Global portfolio analytics: Fair value tracking, NOI performance, and occupancy trends.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Portfolio Report
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Portfolio Fair Value"
          value={new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 1,
            notation: 'compact',
          }).format(stats.fairValue)}
          change={8.4}
          changeLabel="valuation update Q1"
          trend="up"
          sparklineData={[110, 115, 118, 122, 125, 128, stats.fairValue / 1000000]}
        />
        <KPIValue
          label="Net Operating Income"
          value={new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 1,
            notation: 'compact',
          }).format(stats.noi)}
          change={12.1}
          changeLabel="OpEx reduction 5%"
          trend="up"
          sparklineData={[6.8, 7.2, 7.1, 7.5, 7.8, 8.1, stats.noi / 1000000]}
        />
        <KPIValue
          label="Portfolio Occupancy"
          value={`${stats.occupancy}%`}
          change={1.2}
          changeLabel="leasable area stable"
          trend="up"
          sparklineData={[92.5, 93.0, 93.2, 93.8, 94.1, 94.5, stats.occupancy]}
        />
        <KPIValue
          label="Avg. Cap Rate"
          value={`${stats.capRate.toFixed(2)}%`}
          change={-0.2}
          changeLabel="compression in prime"
          trend="up"
          sparklineData={[7.15, 7.1, 7.05, 7.02, 6.98, 6.95, stats.capRate]}
        />
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <CardTitle>Occupancy Rate Trends</CardTitle>
            </div>
            <CardDescription>Historical performance across major asset classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={occupancyData}>
                  <defs>
                    <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} domain={[80, 100]} />
                  <Tooltip />
                  <Legend verticalAlign="top" align="right" />
                  <Area
                    type="monotone"
                    dataKey="residential"
                    name="Residential"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRes)"
                  />
                  <Area
                    type="monotone"
                    dataKey="commercial"
                    name="Commercial"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="transparent"
                  />
                  <Area
                    type="monotone"
                    dataKey="industrial"
                    name="Industrial"
                    stroke="#f59e0b"
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
              <CardTitle>Asset Allocation</CardTitle>
            </div>
            <CardDescription>By Fair Value (USD)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetClassData}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {assetClassData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => `$${(v / 1000000).toFixed(1)}M`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider mb-2">
                <MapPin className="h-3 w-3" />
                Geographic Split
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-medium">
                <div className="flex justify-between">
                  <span>North America</span> <span className="font-bold">42%</span>
                </div>
                <div className="flex justify-between">
                  <span>Europe</span> <span className="font-bold">31%</span>
                </div>
                <div className="flex justify-between">
                  <span>APAC</span> <span className="font-bold">18%</span>
                </div>
                <div className="flex justify-between">
                  <span>Other</span> <span className="font-bold">9%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Top Performing Assets</CardTitle>
            <CardDescription>Property-level financial health and efficiency</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter Assets
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={topAssets} />
        </CardContent>
      </Card>
    </div>
  );
}
