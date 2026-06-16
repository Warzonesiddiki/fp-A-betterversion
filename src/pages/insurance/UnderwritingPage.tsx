/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import {
  Scale,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  BarChart3,
  Download,
  Filter,
  Percent,
  Target,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { DataTable, Column } from '@/components/ui/DataTable';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  BarChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import type { FiscalPeriod } from '@/types';

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

const rateAdequacy = [
  { month: 'Jan', indicatedRate: 100, filedRate: 95, adequate: 92 },
  { month: 'Feb', indicatedRate: 102, filedRate: 96, adequate: 91 },
  { month: 'Mar', indicatedRate: 105, filedRate: 97, adequate: 93 },
  { month: 'Apr', indicatedRate: 104, filedRate: 98, adequate: 94 },
  { month: 'May', indicatedRate: 106, filedRate: 99, adequate: 95 },
  { month: 'Jun', indicatedRate: 108, filedRate: 100, adequate: 96 },
];

const lossPickData = [
  { line: 'Auto', pick: '62.0%', ultimate: '58.5%', dev: '+350bps', credibility: 'High' },
  { line: 'Homeowners', pick: '68.0%', ultimate: '65.2%', dev: '+280bps', credibility: 'High' },
  { line: 'Commercial', pick: '55.0%', ultimate: '53.1%', dev: '+190bps', credibility: 'Medium' },
  { line: 'Workers Comp', pick: '70.0%', ultimate: '67.8%', dev: '+220bps', credibility: 'High' },
  { line: 'Liability', pick: '52.0%', ultimate: '48.5%', dev: '+350bps', credibility: 'Low' },
];

const rateFilings = [
  {
    id: 'RF-401',
    line: 'Personal Auto',
    state: 'California',
    filing: 'CA-2026-012',
    change: '+8.4%',
    status: 'Approved',
    effective: 'Jul 2026',
  },
  {
    id: 'RF-402',
    line: 'Homeowners',
    state: 'Florida',
    filing: 'FL-2026-045',
    change: '+12.2%',
    status: 'Pending',
    effective: 'TBD',
  },
  {
    id: 'RF-403',
    line: 'Commercial Auto',
    state: 'Texas',
    filing: 'TX-2026-088',
    change: '+6.5%',
    status: 'Approved',
    effective: 'Aug 2026',
  },
  {
    id: 'RF-404',
    line: 'Workers Comp',
    state: 'New York',
    filing: 'NY-2026-124',
    change: '+4.1%',
    status: 'Objection',
    effective: 'TBD',
  },
];

const columns: Column[] = [
  { key: 'line', header: 'Line of Business', sortable: true },
  { key: 'state', header: 'State' },
  { key: 'filing', header: 'Filing ID' },
  { key: 'change', header: 'Rate Change', align: 'right' },
  {
    key: 'status',
    header: 'Status',
    render: (v) => (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          v === 'Approved'
            ? 'bg-green-100 text-green-700'
            : v === 'Pending'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-red-100 text-red-700'
        }`}
      >
        {v}
      </span>
    ),
  },
  { key: 'effective', header: 'Effective Date', align: 'center' },
];

export default function UnderwritingPage() {
  const [periodId, setPeriodId] = useState('P01');

  return (
    <div className="p-6 space-y-6 animate-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
            Underwriting Analytics
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Rate adequacy monitoring, loss pick analysis, and regulatory filing performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
          <Button variant="outline" size="sm" className="h-10">
            <Download className="h-4 w-4 mr-2" />
            Rate Filing Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Avg Rate Adequacy"
          value="96.4%"
          change={2.8}
          changeLabel="closing gap to 100%"
          trend="up"
          sparklineData={[92, 91, 93, 94, 95, 96.4]}
        />
        <KPIValue
          label="Loss Ratio Picks"
          value="61.4%"
          change={-1.2}
          changeLabel="average selected pick"
          trend="up"
          sparklineData={[64, 63, 62.5, 62, 61.8, 61.4]}
        />
        <KPIValue
          label="Rate Filings Approved"
          value="8"
          changeLabel="4 pending, 1 objected"
          trend="neutral"
        />
        <KPIValue
          label="Avg Credibility"
          value="High"
          changeLabel="5 of 5 lines scored"
          trend="neutral"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <CardTitle>Rate Adequacy Trend</CardTitle>
            </div>
            <CardDescription>
              Indicated rate levels vs. filed rates vs. adequate threshold
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={rateAdequacy}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} domain={[85, 115]} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Legend verticalAlign="top" align="right" />
                  <Bar
                    dataKey="indicatedRate"
                    name="Indicated Rate"
                    fill="#e2e8f0"
                    radius={[4, 4, 0, 0]}
                    barSize={28}
                  />
                  <Bar
                    dataKey="filedRate"
                    name="Filed Rate"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    barSize={28}
                  />
                  <Line
                    type="monotone"
                    dataKey="adequate"
                    name="Adequate Level"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-purple-500" />
              <CardTitle>Loss Pick Analysis</CardTitle>
            </div>
            <CardDescription>Selected picks vs. ultimate emergence</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lossPickData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="line"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600 }}
                    width={90}
                  />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Legend />
                  <Bar
                    dataKey="pick"
                    name="Selected Pick"
                    fill="#3b82f6"
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                  />
                  <Bar
                    dataKey="ultimate"
                    name="Ultimate"
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Rate Filing Pipeline</CardTitle>
            <CardDescription>
              Regulatory filings by jurisdiction with approval status and effective dates
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter by State
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={rateFilings}
            caption="Insurance rate filings: line of business, effective date, rate change percentage, and approval status"
            ariaLabel="Insurance rate filings table"
          />
        </CardContent>
      </Card>
    </div>
  );
}
