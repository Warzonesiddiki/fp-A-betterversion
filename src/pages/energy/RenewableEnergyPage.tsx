/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import {
  Sun,
  Wind,
  Droplets,
  Leaf,
  Battery,
  TrendingUp,
  Download,
  RefreshCw,
  LayoutGrid,
  FileText,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { DataTable, Column } from '@/components/ui/DataTable';
import {
  ResponsiveContainer,
  LineChart,
  Line,
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
];

const generationTrend = [
  { date: '2026-01-01', solar: 450, wind: 320, hydro: 180, total: 950 },
  { date: '2026-01-05', solar: 480, wind: 290, hydro: 175, total: 945 },
  { date: '2026-01-10', solar: 520, wind: 410, hydro: 190, total: 1120 },
  { date: '2026-01-15', solar: 410, wind: 550, hydro: 210, total: 1170 },
  { date: '2026-01-20', solar: 550, wind: 380, hydro: 205, total: 1135 },
  { date: '2026-01-25', solar: 590, wind: 310, hydro: 195, total: 1095 },
  { date: '2026-01-31', solar: 540, wind: 350, hydro: 200, total: 1090 },
];

const capacityMix = [
  { name: 'Solar', value: 1200, color: '#f59e0b' },
  { name: 'Onshore Wind', value: 850, color: '#10b981' },
  { name: 'Offshore Wind', value: 450, color: '#059669' },
  { name: 'Small Hydro', value: 280, color: '#3b82f6' },
  { name: 'Battery Storage', value: 500, color: '#8b5cf6' },
];

const renewableAssets = [
  {
    id: 'S-01',
    name: 'Mojave Solar I',
    type: 'Solar',
    capacity: '250 MW',
    outputYTD: '42.5 GWh',
    availability: '98.5%',
    roi: '12.4%',
  },
  {
    id: 'W-05',
    name: 'North Sea Wind',
    type: 'Wind',
    capacity: '400 MW',
    outputYTD: '85.2 GWh',
    availability: '92.1%',
    roi: '10.8%',
  },
  {
    id: 'H-02',
    name: 'Blue River Hydro',
    type: 'Hydro',
    capacity: '120 MW',
    outputYTD: '28.4 GWh',
    availability: '96.8%',
    roi: '15.2%',
  },
  {
    id: 'S-02',
    name: 'Arizona Array',
    type: 'Solar',
    capacity: '150 MW',
    outputYTD: '31.1 GWh',
    availability: '97.2%',
    roi: '11.5%',
  },
  {
    id: 'B-01',
    name: 'Tesla Megapack Hub',
    type: 'Storage',
    capacity: '100 MW',
    outputYTD: 'N/A',
    availability: '99.9%',
    roi: '8.4%',
  },
];

const columns: Column[] = [
  { key: 'name', header: 'Asset Name', sortable: true },
  {
    key: 'type',
    header: 'Type',
    render: (value) => (
      <div className="flex items-center gap-2">
        {value === 'Solar' && <Sun className="h-3 w-3 text-amber-700" />}
        {value === 'Wind' && <Wind className="h-3 w-3 text-emerald-700" />}
        {value === 'Hydro' && <Droplets className="h-3 w-3 text-blue-600" />}
        {value === 'Storage' && <Battery className="h-3 w-3 text-purple-600" />}
        <span>{String(value ?? '')}</span>
      </div>
    ),
  },
  { key: 'capacity', header: 'Capacity', align: 'right' },
  { key: 'outputYTD', header: 'Output YTD', align: 'right' },
  {
    key: 'availability',
    header: 'Availability',
    align: 'right',
    render: (v) => (
      <span
        className={parseFloat(v) > 95 ? 'text-green-700 font-bold' : 'text-amber-700 font-bold'}
      >
        {v}
      </span>
    ),
  },
  { key: 'roi', header: 'ROI', align: 'right' },
];

export default function RenewableEnergyPage() {
  const [periodId, setPeriodId] = useState('P01');

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            Renewable Energy
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Performance analytics for zero-emission assets and portfolio diversification.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
          <Button variant="outline" size="sm" className="h-10">
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Solar Generation"
          value="1.2 GW"
          change={5.4}
          changeLabel="vs last year"
          sparklineData={[30, 32, 45, 42, 55, 60, 58]}
        />
        <KPIValue
          label="Wind Output"
          value="850 MW"
          change={12.1}
          changeLabel="new offshore online"
          trend="up"
          sparklineData={[20, 25, 22, 35, 48, 42, 50]}
        />
        <KPIValue
          label="RECs Generated"
          value="4,250"
          change={8.4}
          changeLabel="Renewable Energy Credits"
          sparklineData={[10, 15, 12, 18, 22, 25, 28]}
        />
        <KPIValue
          label="Portfolio ROI"
          value="11.8%"
          change={1.2}
          changeLabel="above 10.5% target"
          trend="up"
          sparklineData={[10.5, 10.8, 11.0, 11.2, 11.5, 11.7, 11.8]}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Generation Mix (MW)</CardTitle>
            <CardDescription>
              Real-time tracking of renewable energy source performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={generationTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(v) => v.split('-')[2]}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Legend verticalAlign="top" align="right" />
                  <Line
                    type="monotone"
                    dataKey="solar"
                    name="Solar"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="wind"
                    name="Wind"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="hydro"
                    name="Hydro"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total Mix"
                    stroke="#64748b"
                    strokeWidth={3}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capacity Distribution</CardTitle>
            <CardDescription>Diversification by technology</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={capacityMix}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {capacityMix.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="vertical" align="right" verticalAlign="middle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider">
                <Leaf className="h-3 w-3" />
                Sustainability Impact
              </div>
              <p className="text-blue-600 text-[10px] mt-1 font-medium leading-relaxed">
                Your portfolio currently offsets <span className="font-bold">124,500 tons</span> of
                CO2 annually, equivalent to planting <span className="font-bold">2.1M trees</span>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Asset Portfolio Detailed View</CardTitle>
            <CardDescription>
              Monitoring profitability and uptime across 24 strategic sites
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Grid View
            </Button>
            <Button variant="ghost" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Audit Logs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={renewableAssets}
            caption="Renewable energy asset portfolio"
            ariaLabel="Renewable assets table"
          />
        </CardContent>
      </Card>
    </div>
  );
}
