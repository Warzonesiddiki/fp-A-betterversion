import { useState } from 'react';
import { ShieldAlert, Activity, Download, Flame, ArrowRightLeft } from 'lucide-react';
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
  ComposedChart,
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

const volatilityData = [
  { month: 'Jan', spot: 82, forward: 85, vol: 12 },
  { month: 'Feb', spot: 88, forward: 86, vol: 15 },
  { month: 'Mar', spot: 95, forward: 88, vol: 22 },
  { month: 'Apr', spot: 91, forward: 89, vol: 18 },
  { month: 'May', spot: 85, forward: 87, vol: 14 },
  { month: 'Jun', spot: 87, forward: 88, vol: 16 },
];

const riskExposure = [
  { category: 'Natural Gas', exposure: 4500000, mitigated: 3800000, risk: 'Medium' },
  { category: 'Electricity Spot', exposure: 2800000, mitigated: 1200000, risk: 'High' },
  { category: 'Carbon Credits', exposure: 1200000, mitigated: 1100000, risk: 'Low' },
  { category: 'Coal Futures', exposure: 900000, mitigated: 850000, risk: 'Low' },
];

const hedgePositions = [
  {
    id: 'H-202',
    instrument: 'NG swap Q3-26',
    counterparty: 'Goldman Sachs',
    notional: '$1.2M',
    strike: '$2.45',
    status: 'Active',
    mtm: '+$84k',
  },
  {
    id: 'H-205',
    instrument: 'Power call Jan-27',
    counterparty: 'J.P. Morgan',
    notional: '$2.5M',
    strike: '$45.00',
    status: 'Active',
    mtm: '-$12k',
  },
  {
    id: 'H-210',
    instrument: 'Brent forward',
    counterparty: 'Citibank',
    notional: '$0.8M',
    strike: '$78.20',
    status: 'Pending',
    mtm: '---',
  },
  {
    id: 'H-198',
    instrument: 'Euro Carbon Opt',
    counterparty: 'SocGen',
    notional: '$1.5M',
    strike: '€65.00',
    status: 'Closed',
    mtm: '+$142k',
  },
];

const columns: Column[] = [
  { key: 'instrument', header: 'Instrument', sortable: true },
  { key: 'counterparty', header: 'Counterparty' },
  { key: 'notional', header: 'Notional Value', align: 'right' },
  { key: 'strike', header: 'Strike/Rate', align: 'right' },
  {
    key: 'status',
    header: 'Status',
    render: (v) => (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          String(v) === 'Active'
            ? 'bg-green-100 text-green-700'
            : String(v) === 'Pending'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              : 'bg-blue-100 text-blue-700'
        }`}
      >
        {String(v)}
      </span>
    ),
  },
  {
    key: 'mtm',
    header: 'MtM Gain/Loss',
    align: 'right',
    render: (v) => {
      const val = String(v ?? '');
      return (
        <span
          className={
            val.startsWith('+')
              ? 'text-green-600 font-mono'
              : val.startsWith('-')
                ? 'text-red-600 font-mono'
                : 'font-mono'
          }
        >
          {val}
        </span>
      );
    },
  },
];

export default function EnergyRiskPage() {
  const [periodId, setPeriodId] = useState('P01');

  return (
    <div className="p-6 space-y-6 animate-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            Energy Risk Management
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Exposure monitoring, hedging strategies, and market volatility stress testing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
          <Button variant="default" size="sm" className="h-10 bg-red-600 hover:bg-red-700">
            <ShieldAlert className="h-4 w-4 mr-2" />
            Trigger Stress Test
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Value at Risk (95%)"
          value="$2.42M"
          change={15.4}
          changeLabel="increase in spot volatility"
          trend="down" // Down is bad for VaR (means it's higher)
          sparklineData={[1.8, 1.9, 2.1, 2.0, 2.2, 2.3, 2.42]}
        />
        <KPIValue
          label="Net Hedge Ratio"
          value="78.2%"
          change={2.1}
          changeLabel="aligned with policy"
          trend="up"
          sparklineData={[72, 74, 75, 76, 76, 77, 78.2]}
        />
        <KPIValue
          label="Counterparty Risk"
          value="Low"
          changeLabel="No breaches detected"
          trend="neutral"
        />
        <KPIValue
          label="Price Volatility (avg)"
          value="16.4%"
          change={4.8}
          changeLabel="High market activity"
          trend="down"
          sparklineData={[12, 14, 18, 15, 14, 16, 16.4]}
        />
      </div>

      {/* Main Analysis */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <CardTitle>Spot vs. Forward Curve</CardTitle>
            </div>
            <CardDescription>
              Price convergence and future delivery pricing ($/unit)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={volatilityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend verticalAlign="top" />
                  <Bar
                    dataKey="spot"
                    name="Spot Price"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />
                  <Line
                    type="monotone"
                    dataKey="forward"
                    name="Forward Curve"
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
              <Flame className="h-5 w-5 text-orange-500" />
              <CardTitle>Exposure Mitigation</CardTitle>
            </div>
            <CardDescription>Unhedged vs. Hedged commodity exposure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskExposure} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="category"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={100}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="exposure"
                    name="Total Exposure"
                    fill="#e2e8f0"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="mitigated"
                    name="Hedged / Mitigated"
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hedge Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Derivatives & Hedging Portfolio</CardTitle>
            <CardDescription>Open positions and Mark-to-Market valuation</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Add Position
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export MtM
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={hedgePositions}
            caption="Energy hedge positions and exposure"
            ariaLabel="Energy hedge positions table"
          />
        </CardContent>
      </Card>
    </div>
  );
}
