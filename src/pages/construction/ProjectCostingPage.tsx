/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Calculator, ArrowRightLeft, Download, BarChart3, Scale } from 'lucide-react';
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

const costBreakdownData = [
  { name: 'Labor', budget: 1200000, actual: 1150000 },
  { name: 'Materials', budget: 2400000, actual: 2850000 },
  { name: 'Equipment', budget: 850000, actual: 720000 },
  { name: 'Subcontracts', budget: 3200000, actual: 3100000 },
  { name: 'Overhead', budget: 450000, actual: 480000 },
];

const changeOrders = [
  {
    id: 'CO-402',
    project: 'Downtown Plaza',
    description: 'Structural steel reinforcement',
    amount: '+$142k',
    status: 'Approved',
    impact: 'High',
  },
  {
    id: 'CO-405',
    project: 'Skyway Bridge',
    description: 'Foundation soil remediation',
    amount: '+$580k',
    status: 'Pending',
    impact: 'Critical',
  },
  {
    id: 'CO-398',
    project: 'Tech Hub',
    description: 'HVAC specification change',
    amount: '-$12k',
    status: 'Approved',
    impact: 'Low',
  },
  {
    id: 'CO-410',
    project: 'Downtown Plaza',
    description: 'Facade material swap',
    amount: '+$84k',
    status: 'Rejected',
    impact: 'Medium',
  },
];

const projectCostLedger = [
  {
    id: '101',
    code: '03-3000',
    category: 'Cast-in-Place Concrete',
    budget: '$1.2M',
    actual: '$1.1M',
    variance: '+8.4%',
    status: 'Under',
  },
  {
    id: '102',
    code: '05-1000',
    category: 'Structural Steel',
    budget: '$2.4M',
    actual: '$2.9M',
    variance: '-18.5%',
    status: 'Over',
  },
  {
    id: '103',
    code: '23-0000',
    category: 'HVAC Systems',
    budget: '$850k',
    actual: '$820k',
    variance: '+3.5%',
    status: 'Under',
  },
  {
    id: '104',
    code: '26-0000',
    category: 'Electrical',
    budget: '$1.5M',
    actual: '$1.6M',
    variance: '-6.2%',
    status: 'Over',
  },
];

const columns: Column[] = [
  { key: 'code', header: 'Cost Code', sortable: true },
  { key: 'category', header: 'Category' },
  { key: 'budget', header: 'Budgeted', align: 'right' },
  { key: 'actual', header: 'Actual Cost', align: 'right' },
  {
    key: 'variance',
    header: 'Variance',
    align: 'right',
    render: (v) => {
      const val = String(v ?? '');
      return (
        <span
          className={val.startsWith('+') ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}
        >
          {val}
        </span>
      );
    },
  },
  {
    key: 'status',
    header: 'Status',
    render: (v) => (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          v === 'Under' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}
      >
        {v}
      </span>
    ),
  },
];

export default function ProjectCostingPage() {
  const [periodId, setPeriodId] = useState('P01');

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            Project Costing
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Granular cost control: Budget vs. Actual by cost code, change order tracking, and WIP
            analysis.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
          <Button variant="default" size="sm" className="h-10">
            <Calculator className="h-4 w-4 mr-2" />
            Analyze Variance
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Total Project Costs"
          value="$58.2M"
          change={4.8}
          changeLabel="material inflation impact"
          trend="down" // Down is bad (cost up)
          sparklineData={[42, 45, 48, 52, 55, 58.2]}
        />
        <KPIValue
          label="Budget Utilization"
          value="92.4%"
          change={2.1}
          changeLabel="aligned with WIP"
          trend="up"
          sparklineData={[70, 75, 80, 85, 88, 92.4]}
        />
        <KPIValue
          label="Pending Change Orders"
          value="$1.24M"
          change={12}
          changeLabel="8 orders awaiting approval"
          trend="neutral"
        />
        <KPIValue
          label="Cost Performance (CPI)"
          value="0.98"
          changeLabel="Target: >1.00"
          trend="down"
        />
      </div>

      {/* Main Analysis */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <CardTitle>Budget vs. Actual by Category</CardTitle>
            </div>
            <CardDescription>Major cost drivers and financial variances</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costBreakdownData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip formatter={(v: any) => `$${v.toLocaleString()}`} />
                  <Legend verticalAlign="top" align="right" />
                  <Bar dataKey="budget" name="Budgeted" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" name="Actual Spend" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {costBreakdownData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.actual > entry.budget ? '#ef4444' : '#3b82f6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-orange-500" />
              <CardTitle>Change Order Log</CardTitle>
            </div>
            <CardDescription>Approval pipeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {changeOrders.map((order) => (
              <div
                key={order.id}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">
                    {order.id}
                  </span>
                  <span
                    className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                      order.status === 'Approved'
                        ? 'bg-green-100 text-green-700'
                        : order.status === 'Rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="text-xs font-bold text-[var(--text-primary)] mb-0.5">
                  {order.project}
                </div>
                <div className="text-[10px] text-[var(--text-secondary)] line-clamp-1">
                  {order.description}
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-700">{order.amount}</span>
                  <span className="text-[8px] font-bold text-slate-400 group-hover:text-blue-600 flex items-center">
                    View Details <Scale className="h-2 w-2 ml-1" />
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Cost Detail Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Cost Code Analysis</CardTitle>
            <CardDescription>CSI Division level financial tracking</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Ledger
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={projectCostLedger}
            caption="Project cost ledger by activity"
            ariaLabel="Project cost ledger table"
          />
        </CardContent>
      </Card>
    </div>
  );
}
