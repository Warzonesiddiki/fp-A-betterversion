import { useState } from 'react';
import {
  Truck,
  Settings,
  TrendingUp,
  DollarSign,
  Wrench,
  AlertTriangle,
  Calendar,
  Download,
  Filter,
  BarChart3,
  Gauge,
  MapPin,
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

const utilizationTrend = [
  { month: 'Jan', heavy: 82, light: 75, aux: 90 },
  { month: 'Feb', heavy: 85, light: 72, aux: 88 },
  { month: 'Mar', heavy: 78, light: 68, aux: 92 },
  { month: 'Apr', heavy: 91, light: 80, aux: 94 },
  { month: 'May', heavy: 94, light: 85, aux: 95 },
  { month: 'Jun', heavy: 92, light: 82, aux: 93 },
];

const equipmentFleet = [
  {
    id: 'EQ-001',
    asset: 'Excavator 320',
    status: 'In Use',
    location: 'Site Alpha',
    utilization: '94.2%',
    fuel_eff: '12.4 L/h',
    next_service: '14 Days',
  },
  {
    id: 'EQ-042',
    asset: 'Tower Crane 550',
    status: 'Maintenance',
    location: 'Main Depot',
    utilization: '0.0%',
    fuel_eff: '---',
    next_service: 'Overdue',
  },
  {
    id: 'EQ-015',
    asset: 'Concrete Mixer',
    status: 'In Use',
    location: 'Site Gamma',
    utilization: '78.5%',
    fuel_eff: '8.2 L/h',
    next_service: '28 Days',
  },
  {
    id: 'EQ-009',
    asset: 'Articulated Hauler',
    status: 'Idle',
    location: 'Site Alpha',
    utilization: '42.1%',
    fuel_eff: '15.8 L/h',
    next_service: '4 Days',
  },
  {
    id: 'EQ-088',
    asset: 'Paving Machine',
    status: 'In Use',
    location: 'Highway 40',
    utilization: '88.7%',
    fuel_eff: '10.5 L/h',
    next_service: '12 Days',
  },
];

const columns: Column[] = [
  { key: 'asset', header: 'Asset Name', sortable: true },
  {
    key: 'status',
    header: 'Status',
    render: (v) => (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          v === 'In Use'
            ? 'bg-green-100 text-green-700'
            : v === 'Maintenance'
              ? 'bg-red-100 text-red-700'
              : 'bg-slate-100 text-slate-700'
        }`}
      >
        {v}
      </span>
    ),
  },
  { key: 'location', header: 'Current Location' },
  { key: 'utilization', header: 'Utilization', align: 'right' },
  { key: 'fuel_eff', header: 'Fuel Efficiency', align: 'right' },
  {
    key: 'next_service',
    header: 'Next Service',
    align: 'right',
    render: (v) => (
      <span className={v === 'Overdue' ? 'text-red-600 font-bold' : 'text-slate-600'}>{v}</span>
    ),
  },
];

export default function EquipmentManagementPage() {
  const [periodId, setPeriodId] = useState('P01');

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-left-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            Equipment Management
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Fleet optimization: Utilization tracking, maintenance scheduling, and fuel efficiency
            analytics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
          <Button variant="outline" size="sm">
            <MapPin className="h-4 w-4 mr-2" />
            Live Map
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Fleet Utilization"
          value="84.2%"
          change={5.4}
          changeLabel="increase in shift hours"
          trend="up"
          sparklineData={[72, 75, 78, 80, 82, 84.2]}
        />
        <KPIValue
          label="Maintenance Cost"
          value="$142k"
          change={-12.1}
          changeLabel="preventative program win"
          trend="up" // Up is good (lower cost)
          sparklineData={[180, 170, 165, 155, 150, 142]}
        />
        <KPIValue
          label="Equipment ROI"
          value="18.5%"
          change={1.2}
          changeLabel="above 15% benchmark"
          trend="up"
          sparklineData={[16.5, 17.0, 17.5, 17.8, 18.2, 18.5]}
        />
        <KPIValue
          label="Down Time (Avg)"
          value="4.2 Hrs"
          changeLabel="Per 100 operating hours"
          trend="neutral"
        />
      </div>

      {/* Main Analysis */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-blue-500" />
              <CardTitle>Fleet Utilization Trend (%)</CardTitle>
            </div>
            <CardDescription>
              Operating hours vs. Total available hours by equipment type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={utilizationTrend}>
                  <defs>
                    <linearGradient id="colorHeavy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip />
                  <Legend verticalAlign="top" align="right" />
                  <Area
                    type="monotone"
                    dataKey="heavy"
                    name="Heavy Equipment"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorHeavy)"
                  />
                  <Area
                    type="monotone"
                    dataKey="light"
                    name="Light Vehicles"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="transparent"
                  />
                  <Area
                    type="monotone"
                    dataKey="aux"
                    name="Auxiliary Gear"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fill="transparent"
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-indigo-500" />
              <CardTitle>Maintenance Health</CardTitle>
            </div>
            <CardDescription>Fleet readiness status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Operational</span>
                <span>88%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '88%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>In Maintenance</span>
                <span>8%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '8%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Out of Service</span>
                <span>4%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '4%' }} />
              </div>
            </div>

            <div className="mt-8 p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="flex items-center gap-2 text-red-700 font-bold text-xs uppercase tracking-wider mb-2">
                <AlertTriangle className="h-3 w-3" />
                Critical Service Alert
              </div>
              <p className="text-red-800 text-[10px] leading-relaxed">
                <span className="font-bold">Tower Crane 550</span> is 120 operating hours past its
                scheduled 500-hour inspection. Work order #WO-992 generated.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-3 h-8 text-[10px] border-red-200 text-red-700 hover:bg-red-100"
              >
                Assign Technician
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Fleet Inventory & Telematics</CardTitle>
            <CardDescription>
              Live status and efficiency metrics from integrated GPS/IoT sensors
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Telematics Export
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={equipmentFleet} />
        </CardContent>
      </Card>
    </div>
  );
}
