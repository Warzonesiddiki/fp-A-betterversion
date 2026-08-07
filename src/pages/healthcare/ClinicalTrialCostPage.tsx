import { useState } from 'react';
import { Beaker, FileText, Timer, Plus, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { DataTable, Column } from '@/components/ui/DataTable';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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

const trialBudgetTrend = [
  { month: 'Jan', budget: 4200000, actual: 3800000, enrollment: 85 },
  { month: 'Feb', budget: 4200000, actual: 4100000, enrollment: 92 },
  { month: 'Mar', budget: 4500000, actual: 4800000, enrollment: 110 },
  { month: 'Apr', budget: 4500000, actual: 4400000, enrollment: 105 },
  { month: 'May', budget: 4800000, actual: 4600000, enrollment: 120 },
  { month: 'Jun', budget: 5000000, actual: 5200000, enrollment: 135 },
];

const trialInventory = [
  {
    id: 'T-801',
    name: 'Onco-Shield Ph III',
    site: 'Mayo Clinic',
    budget: '$5.2M',
    actual: '$4.8M',
    status: 'Active',
    burn: 'Low',
  },
  {
    id: 'T-442',
    name: 'Neuro-Restore Ph II',
    site: 'Johns Hopkins',
    budget: '$2.1M',
    actual: '$2.3M',
    status: 'Over Budget',
    burn: 'High',
  },
  {
    id: 'T-215',
    name: 'Cardio-Flow Ph I',
    site: 'Cleveland Clinic',
    budget: '$1.5M',
    actual: '$1.2M',
    status: 'Enrolling',
    burn: 'Medium',
  },
  {
    id: 'T-990',
    name: 'Immuno-Boost Ph III',
    site: 'Cedars-Sinai',
    budget: '$8.4M',
    actual: '$3.1M',
    status: 'Active',
    burn: 'Low',
  },
  {
    id: 'T-105',
    name: 'RareDisease-7',
    site: 'Stanford Med',
    budget: '$3.2M',
    actual: '$3.4M',
    status: 'Warning',
    burn: 'High',
  },
];

const columns: Column[] = [
  { key: 'name', header: 'Trial Name', sortable: true },
  { key: 'site', header: 'Lead Site' },
  { key: 'budget', header: 'Budget', align: 'right' },
  { key: 'actual', header: 'Actual Spend', align: 'right' },
  {
    key: 'status',
    header: 'Status',
    render: (v) => (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          String(v) === 'Active'
            ? 'bg-green-100 text-green-700'
            : String(v) === 'Warning'
              ? 'bg-yellow-100 text-yellow-700'
              : String(v) === 'Over Budget'
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700'
        }`}
      >
        {String(v)}
      </span>
    ),
  },
  { key: 'burn', header: 'Burn Rate' },
];

export default function ClinicalTrialCostPage() {
  const [periodId, setPeriodId] = useState('P01');

  return (
    <div className="p-6 space-y-6 animate-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            Clinical Trial Costs
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Research & Development financial tracking: Trial budgets, site spend, and enrollment
            ROI.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
          <Button variant="default" size="sm" className="h-10">
            <Plus className="h-4 w-4 mr-2" />
            New Trial Budget
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Total Trial Budget"
          value="$24.8M"
          change={12.4}
          changeLabel="4 new trials in Q1"
          trend="up"
          sparklineData={[18, 20, 21, 22, 23, 24, 24.8]}
        />
        <KPIValue
          label="Cost per Patient"
          value="$18.5k"
          change={4.2}
          changeLabel="specialty labs higher"
          trend="down" // Down is bad (cost up)
          sparklineData={[16.2, 16.8, 17.1, 17.5, 17.9, 18.2, 18.5]}
        />
        <KPIValue
          label="Enrollment Rate"
          value="92.4%"
          change={5.1}
          changeLabel="ahead of schedule"
          trend="up"
          sparklineData={[82, 85, 84, 88, 90, 91, 92.4]}
        />
        <KPIValue
          label="R&D Tax Credits"
          value="$3.2M"
          changeLabel="Pending verification"
          trend="neutral"
        />
      </div>

      {/* Main Analysis */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-blue-600" />
              <CardTitle>Spend vs. Enrollment Efficiency</CardTitle>
            </div>
            <CardDescription>
              Correlating monthly trial spend with patient accrual rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trialBudgetTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v / 1000000}M`}
                  />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend verticalAlign="top" align="right" />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="actual"
                    name="Actual Spend"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="enrollment"
                    name="New Patients"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="budget"
                    name="Budget Limit"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Beaker className="h-5 w-5 text-purple-600" />
              <CardTitle>Phase Breakdown</CardTitle>
            </div>
            <CardDescription>Cost distribution by trial stage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                    III
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">Phase III</div>
                    <div className="text-[10px] text-[var(--text-secondary)]">
                      2 active, $13.6M total
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">55%</div>
                  <div className="text-[10px] text-green-600">+2.4%</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                    II
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">Phase II</div>
                    <div className="text-[10px] text-[var(--text-secondary)]">
                      4 active, $7.2M total
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">29%</div>
                  <div className="text-[10px] text-slate-400">Stable</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">
                    I
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">Phase I</div>
                    <div className="text-[10px] text-[var(--text-secondary)]">
                      6 active, $4.0M total
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">16%</div>
                  <div className="text-[10px] text-red-600">-1.5%</div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-[10px] uppercase tracking-wider">
                <FileText className="h-3 w-3" />
                Regulatory Milestone
              </div>
              <p className="text-indigo-600 text-[10px] mt-1 font-medium leading-relaxed">
                <span className="font-bold">NDA Filing</span> for Onco-Shield expected in{' '}
                <span className="font-bold">Oct 2026</span>. Estimated cost: $450k.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trial Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Active Trial Inventory</CardTitle>
            <CardDescription>
              Lead site performance and financial health across 12 programs
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            Site Metrics
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={trialInventory}
            caption="Clinical trial cost and enrollment"
            ariaLabel="Clinical trial inventory table"
          />
        </CardContent>
      </Card>
    </div>
  );
}
