/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import {
  HeartPulse,
  Scale,
  TrendingUp,
  Users,
  ShieldCheck,
  Target,
  Award,
  Download,
  Filter,
  BarChart3,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { DataTable, Column } from '@/components/ui/DataTable';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
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

const qualityMetrics = [
  { subject: 'Readmission', A: 120, B: 110, fullMark: 150 },
  { subject: 'Patient Sat', A: 98, B: 130, fullMark: 150 },
  { subject: 'Mortality', A: 86, B: 130, fullMark: 150 },
  { subject: 'Safety', A: 99, B: 100, fullMark: 150 },
  { subject: 'Efficiency', A: 85, B: 90, fullMark: 150 },
  { subject: 'Clinical', A: 65, B: 85, fullMark: 150 },
];

const savingsData = [
  { category: 'Orthopedics', target: 2400000, actual: 2100000, savings: 300000 },
  { category: 'Cardiology', target: 1800000, actual: 1950000, savings: -150000 },
  { category: 'Neurology', target: 1500000, actual: 1200000, savings: 300000 },
  { category: 'Primary Care', target: 4500000, actual: 3800000, savings: 700000 },
];

const programPerformance = [
  {
    id: 'V-01',
    program: 'MSSP ACO Track 3',
    population: '24,500',
    qualityScore: '94.2%',
    sharedSavings: '+$2.4M',
    status: 'High',
  },
  {
    id: 'V-02',
    program: 'BPCI-Advanced',
    population: '1,200',
    qualityScore: '88.7%',
    sharedSavings: '-$140k',
    status: 'Watch',
  },
  {
    id: 'V-03',
    program: 'CJR Bundle',
    population: '850',
    qualityScore: '96.8%',
    sharedSavings: '+$840k',
    status: 'High',
  },
  {
    id: 'V-04',
    program: 'Direct Contracting',
    population: '4,200',
    qualityScore: '76.3%',
    sharedSavings: '+$120k',
    status: 'Medium',
  },
];

const columns: Column[] = [
  { key: 'program', header: 'Incentive Program', sortable: true },
  { key: 'population', header: 'Patient Population', align: 'right' },
  { key: 'qualityScore', header: 'Quality Score', align: 'right' },
  {
    key: 'sharedSavings',
    header: 'Net Savings/Loss',
    align: 'right',
    render: (v) => (
      <span className={v.startsWith('+') ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
        {v}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (v) => (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          v === 'High'
            ? 'bg-green-100 text-green-700'
            : v === 'Watch'
              ? 'bg-red-100 text-red-700'
              : 'bg-blue-100 text-blue-700'
        }`}
      >
        {v}
      </span>
    ),
  },
];

export default function ValueBasedCarePage() {
  const [periodId, setPeriodId] = useState('P01');

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            Value-Based Care
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Performance-based reimbursement tracking: Quality scores, shared savings, and bundled
            payments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
          <Button variant="outline" size="sm">
            <Award className="h-4 w-4 mr-2" />
            Quality Rankings
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Aggregate Quality Score"
          value="91.4%"
          change={2.4}
          changeLabel="Clinical outcomes improved"
          trend="up"
          sparklineData={[85, 87, 88, 89, 90, 91, 91.4]}
        />
        <KPIValue
          label="Est. Shared Savings"
          value="$4.8M"
          change={15.2}
          changeLabel="YTD net incentives"
          trend="up"
          sparklineData={[3.2, 3.5, 3.8, 4.1, 4.4, 4.6, 4.8]}
        />
        <KPIValue
          label="Pop. Health ROI"
          value="14.2%"
          changeLabel="Cost avoidance metric"
          trend="up"
        />
        <KPIValue
          label="Compliance Status"
          value="Compliant"
          changeLabel="HEDIS & Stars"
          trend="neutral"
        />
      </div>

      {/* Main Analysis */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <CardTitle>Clinical Quality Dimensions</CardTitle>
            </div>
            <CardDescription>Current performance vs. National Benchmark (CMS)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={qualityMetrics}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 150]} hide />
                  <Radar
                    name="Our Score"
                    dataKey="A"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.5}
                  />
                  <Radar
                    name="CMS Benchmark"
                    dataKey="B"
                    stroke="#94a3b8"
                    fill="#94a3b8"
                    fillOpacity={0.1}
                  />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <CardTitle>Bundled Payment Performance</CardTitle>
            </div>
            <CardDescription>Target price vs. actual episode cost</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={savingsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="target" name="Target Cost" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" name="Actual Cost" fill="#10b981" radius={[4, 4, 0, 0]}>
                    {savingsData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.actual > entry.target ? '#ef4444' : '#10b981'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Program Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Managed Care & Incentive Programs</CardTitle>
            <CardDescription>
              Performance breakdown across Medicare and Commercial value-based contracts
            </CardDescription>
          </div>
          <Button variant="default" size="sm">
            <Download className="h-4 w-4 mr-2" />
            VBC Summary
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={programPerformance}
            caption="Value-based care program performance: program name, attribution, quality score, and savings rate"
            ariaLabel="Value-based care performance table"
          />
        </CardContent>
      </Card>
    </div>
  );
}
