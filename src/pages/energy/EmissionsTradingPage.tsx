import { useState } from 'react';
import {
  Download,
  Filter,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { DataTable, Column } from '@/components/ui/DataTable';
import {
  ResponsiveContainer,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
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

const emissionData = [
  { month: 'Jan', actual: 4200, target: 4500, credits: 300 },
  { month: 'Feb', actual: 4100, target: 4400, credits: 400 },
  { month: 'Mar', actual: 4600, target: 4300, credits: -200 },
  { month: 'Apr', actual: 3900, target: 4200, credits: 300 },
  { month: 'May', actual: 3800, target: 4100, credits: 400 },
  { month: 'Jun', actual: 4200, target: 4000, credits: -200 },
];

const creditInventory = [
  {
    id: 'C-001',
    type: 'EU Allowances (EUA)',
    vintage: '2025',
    quantity: '25,000',
    costBasis: '€82.40',
    marketValue: '€88.10',
    gain: '+6.9%',
  },
  {
    id: 'C-002',
    type: 'Certified Emission Reductions',
    vintage: '2024',
    quantity: '12,400',
    costBasis: '$12.50',
    marketValue: '$11.80',
    gain: '-5.6%',
  },
  {
    id: 'C-003',
    type: 'Gold Standard Offsets',
    vintage: '2026',
    quantity: '45,000',
    costBasis: '$18.20',
    marketValue: '$21.40',
    gain: '+17.5%',
  },
  {
    id: 'C-004',
    type: 'California Carbon Offsets',
    vintage: '2025',
    quantity: '18,000',
    costBasis: '$32.10',
    marketValue: '$34.50',
    gain: '+7.4%',
  },
];

const columns: Column[] = [
  { key: 'type', header: 'Credit Type', sortable: true },
  { key: 'vintage', header: 'Vintage', align: 'center' },
  { key: 'quantity', header: 'Quantity', align: 'right' },
  { key: 'costBasis', header: 'Cost Basis', align: 'right' },
  { key: 'marketValue', header: 'Market Value', align: 'right' },
  {
    key: 'gain',
    header: 'Unrealized Gain/Loss',
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
];

export default function EmissionsTradingPage() {
  const [periodId, setPeriodId] = useState('P01');

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            Emissions Trading
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Carbon allowance management, credit portfolio valuation, and net-zero compliance
            tracking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter Credits
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Total Carbon Credits"
          value="100.4k"
          change={12.4}
          changeLabel="Portfolio expanded in Q1"
          trend="up"
          sparklineData={[80, 85, 82, 90, 95, 98, 100.4]}
        />
        <KPIValue
          label="Emissions Offset"
          value="1.2M tons"
          change={8.2}
          changeLabel="74% of annual target"
          trend="up"
          sparklineData={[0.8, 0.9, 1.0, 1.05, 1.1, 1.15, 1.2]}
        />
        <KPIValue
          label="Compliance Buffer"
          value="+15.2%"
          changeLabel="Safe margin vs. cap"
          trend="up"
        />
        <KPIValue
          label="Portfolio Market Value"
          value="$12.8M"
          change={3.4}
          changeLabel="+$420k unrealized gain"
          trend="up"
          sparklineData={[11.5, 11.8, 12.0, 12.2, 12.4, 12.6, 12.8]}
        />
      </div>

      {/* Analysis Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Emission Trends vs. Target</CardTitle>
              <CardDescription>Actual CO2e emissions against regulatory caps</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span>Actual</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                <span>Regulatory Cap</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={emissionData}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorActual)"
                  />
                  <Area
                    type="monotone"
                    dataKey="target"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
            <CardDescription>Jurisdictional requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>EU ETS (Phase IV)</span>
                <span className="text-green-600">Compliant</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>California Cap-and-Trade</span>
                <span className="text-blue-600">82% Verified</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '82%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>UK Emissions Trading</span>
                <span className="text-amber-600">Renewal Pending</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)]">
              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <div>
                  <div className="text-xs font-bold text-indigo-700 uppercase">Verification ID</div>
                  <div className="text-[10px] font-mono text-indigo-600">VER-2026-88X-BETA</div>
                </div>
                <ArrowUpRight className="ml-auto h-4 w-4 text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Carbon Credit Inventory</CardTitle>
            <CardDescription>
              Detailed list of held allowances and offset instruments
            </CardDescription>
          </div>
          <Button variant="default" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export for Audit
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={creditInventory} />
        </CardContent>
      </Card>
    </div>
  );
}
