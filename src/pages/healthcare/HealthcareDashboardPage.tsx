import { useMemo, useState } from 'react';

import { Activity, Stethoscope, Building2, Download, Share2, MoreHorizontal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { DataTable, Column } from '@/components/ui/DataTable';

const getRandom = () => Math.random();
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { FiscalPeriod } from '@/types';
import { useGLStore } from '@/store/glStore';
import { HealthcareEngine } from '@/engines';

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

const patientVolumeData = [
  { month: 'Jan', emergency: 850, inpatient: 420, outpatient: 2100 },
  { month: 'Feb', emergency: 780, inpatient: 390, outpatient: 1950 },
  { month: 'Mar', emergency: 920, inpatient: 450, outpatient: 2300 },
  { month: 'Apr', emergency: 890, inpatient: 440, outpatient: 2200 },
  { month: 'May', emergency: 950, inpatient: 480, outpatient: 2450 },
  { month: 'Jun', emergency: 1100, inpatient: 520, outpatient: 2800 },
];

const columns: Column[] = [
  { key: 'dept', header: 'Department', sortable: true },
  {
    key: 'revenue',
    header: 'Net Revenue',
    align: 'right',
    render: (v) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(v as number),
  },
  { key: 'patients', header: 'Patient Count', align: 'right' },
  {
    key: 'margin',
    header: 'Operating Margin',
    align: 'right',
    render: (v) => (
      <span className={(v as number) > 20 ? 'text-green-600 font-bold' : 'text-blue-600 font-bold'}>
        {(v as number).toFixed(1)}%
      </span>
    ),
  },
  { key: 'efficiency', header: 'Efficiency Score', align: 'right', render: (v) => `${v}%` },
];

export default function HealthcareDashboardPage() {
  const { entries } = useGLStore();
  const [periodId, setPeriodId] = useState('P01');

  const stats = useMemo(() => {
    return HealthcareEngine.calculatePatientRevenue(entries);
  }, [entries]);

  const departmentPerformance = useMemo(() => {
    const depts = [
      { id: '01', name: 'Cardiology' },
      { id: '02', name: 'Neurology' },
      { id: '03', name: 'Oncology' },
      { id: '04', name: 'Orthopedics' },
      { id: '05', name: 'Pediatrics' },
    ];

    return depts
      .map((d) => {
        const deptRevenue = entries
          .filter((e) => e.accountCode.startsWith('40') && e.accountCode.endsWith(d.id))
          .reduce((acc, e) => acc + e.amount, 0);

        return {
          dept: d.name,
          revenue: deptRevenue,
          patients: Math.floor(deptRevenue / 2500) || 0, // Mocked patient count based on revenue
          margin: 15 + getRandom() * 15,
          efficiency: 85 + Math.floor(getRandom() * 12),
        };
      })
      .filter((d) => d.revenue > 0);
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <Activity className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Healthcare Data</h2>
        <p className="text-slate-400 mb-6">
          Import your Patient Revenue GL data (40xx accounts) to view hospital performance
          analytics.
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
            Healthcare Dashboard
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Enterprise hospital management: Patient volume, revenue cycles, and departmental
            efficiency.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            PDF Report
          </Button>
          <Button variant="ghost" size="icon" aria-label="More options">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Estimated Admissions"
          value={Math.floor(stats.netRevenue / 5000).toLocaleString()}
          change={4.2}
          changeLabel="inpatient up 5%"
          trend="up"
          sparklineData={[1100, 1150, 1120, 1180, 1210, 1230, stats.netRevenue / 5000]}
        />
        <KPIValue
          label="Avg. Length of Stay"
          value={`${stats.daysInAR.toFixed(1)} Days`}
          change={-1.5}
          changeLabel="efficiency improved"
          trend="up" // Up is good for efficiency
          sparklineData={[4.8, 4.6, 4.5, 4.4, 4.3, 4.2, stats.daysInAR]}
        />
        <KPIValue
          label="Net Patient Revenue"
          value={new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 1,
            notation: 'compact',
          }).format(stats.netRevenue)}
          change={12.1}
          changeLabel="reimbursements up"
          trend="up"
          sparklineData={[7.2, 7.5, 7.4, 7.8, 8.1, 8.3, stats.netRevenue / 1000000]}
        />
        <KPIValue
          label="Collection Rate"
          value={`${stats.collectionRate.toFixed(1)}%`}
          change={1.2}
          changeLabel="target: 95%"
          trend="up"
          sparklineData={[92, 92.5, 93.1, 93.8, 94.2, 94.5, stats.collectionRate]}
        />
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-blue-500" />
              <CardTitle>Patient Volume Trend</CardTitle>
            </div>
            <CardDescription>Monthly admissions by department category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={patientVolumeData}>
                  <defs>
                    <linearGradient id="colorOutpatient" x1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend verticalAlign="top" align="right" />
                  <Area
                    type="monotone"
                    dataKey="outpatient"
                    name="Outpatient"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorOutpatient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="emergency"
                    name="ER / Trauma"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="transparent"
                  />
                  <Area
                    type="monotone"
                    dataKey="inpatient"
                    name="Inpatient"
                    stroke="#10b981"
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
              <Building2 className="h-5 w-5 text-indigo-500" />
              <CardTitle>Facility Utilization</CardTitle>
            </div>
            <CardDescription>Bed occupancy and room efficiency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>ICU Occupancy</span>
                <span className="text-red-600 font-bold">92%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '92%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>General Ward</span>
                <span className="text-green-600 font-bold">74%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '74%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Surgery Suites</span>
                <span className="text-blue-600 font-bold">85%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>

            <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider mb-2">
                <Activity className="h-3 w-3" />
                Staffing Status
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-lg font-bold">428</div>
                  <div className="text-[10px] text-slate-500">Nurses on Shift</div>
                </div>
                <div>
                  <div className="text-lg font-bold">84</div>
                  <div className="text-[10px] text-slate-500">On-call Doctors</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Departmental Performance Analysis</CardTitle>
            <CardDescription>
              Profitability and efficiency metrics across specialized clinical units
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share Audit
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={departmentPerformance} />
        </CardContent>
      </Card>
    </div>
  );
}
