import type { FiscalPeriod } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { buildFiscalPeriods } from '@/utils/fiscalPeriods';

const columns = [
  { key: 'metric', header: 'Metric' },
  { key: 'value', header: 'Value' },
];
import { useMemo, useState } from 'react';
import {
  DollarSign,
  PieChart as PieChartIcon,
  BarChart2,
  FileCheck,
  AlertCircle,
  Download,
  CreditCard,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { DataTable } from '@/components/ui/DataTable';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { useGLStore } from '@/store/glStore';
import { HealthcareEngine } from '@/engines/HealthcareEngine';
import { formatCompact, formatNumber, formatPercent } from '@/utils/financialFormatting';

export default function PatientRevenuePage() {
  const fmtCurrency = useCurrencyFormatter();
  const { entries } = useGLStore();
  const [periodId, setPeriodId] = useState('P01');
  // WIRED (C-3): real fiscal periods from FiscalCalendar + org settings.
  const fiscalPeriods: FiscalPeriod[] = buildFiscalPeriods();

  const stats = useMemo(() => {
    return HealthcareEngine.calculatePatientRevenue(entries);
  }, [entries]);

  const payerMixData = useMemo(() => {
    return HealthcareEngine.getPayerMix(entries);
  }, [entries]);

  const revenueCycleData = useMemo(
    () => [
      { stage: 'Charges', amount: stats.grossCharges },
      { stage: 'Contractuals', amount: stats.contractuals },
      { stage: 'Net Revenue', amount: stats.netRevenue },
      { stage: 'Cash Collected', amount: stats.cashCollected },
      { stage: 'Bad Debt', amount: stats.badDebt },
    ],
    [stats]
  );

  const denialAnalytics = [
    { reason: 'Eligibility', count: 420, value: '$840k', trend: 'down' },
    { reason: 'Coding Error', count: 215, value: '$450k', trend: 'up' },
    { reason: 'Prior Auth', count: 180, value: '$1.2M', trend: 'stable' },
    { reason: 'Duplicate Claim', count: 95, value: '$120k', trend: 'down' },
    { reason: 'Medical Necessity', count: 64, value: '$2.1M', trend: 'up' },
  ];

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <DollarSign className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Healthcare Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Import your General Ledger data with healthcare specific accounts to view revenue cycle
          analysis.
        </p>
        <Button>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Patient Revenue Analysis"
          purpose="Revenue cycle management, payer mix optimization, and denial mitigation."
        />
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={fiscalPeriods} />
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Gross Charges"
          value={fmtCurrency.custom()(stats.grossCharges)}
          change={8.4}
          changeLabel="volume increase in Q1"
          trend="up"
          sparklineData={[10.2, 10.8, 11.2, 11.5, 11.8, 12.2, stats.grossCharges / 1000000]}
        />
        <KPIValue
          label="Denial Rate"
          value={`${stats.denialRate}%`}
          change={-0.8}
          changeLabel="coding audits effective"
          trend="up" // Up is good for lower denial rate
          sparklineData={[5.2, 5.0, 4.8, 4.7, 4.5, 4.3, stats.denialRate]}
        />
        <KPIValue
          label="Collection Rate"
          value={`${formatPercent(stats.collectionRate, 1)}`}
          change={1.2}
          changeLabel="net of contractuals"
          trend="up"
          sparklineData={[92.5, 93.0, 93.2, 93.8, 94.1, 94.5, stats.collectionRate]}
        />
        <KPIValue
          label="Days in A/R"
          value={formatNumber(stats.daysInAR, 1)}
          change={-2.4}
          changeLabel="billing cycle faster"
          trend="up" // Up is good for fewer days
          sparklineData={[42, 41, 40.5, 40, 39.5, 39, stats.daysInAR]}
        />
      </div>

      {/* Main Analysis */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-green-600" />
              <CardTitle>Net Revenue by Payer</CardTitle>
            </div>
            <CardDescription>Strategic distribution of reimbursement sources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={payerMixData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {payerMixData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `$${formatCompact(Number(v))}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-blue-600" />
              <CardTitle>Revenue Cycle Waterfall</CardTitle>
            </div>
            <CardDescription>Charge capture to cash collection lifecycle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueCycleData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="stage"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v / 1000000}M`}
                  />
                  <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40}>
                    {revenueCycleData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.stage === 'Net Revenue'
                            ? '#10b981'
                            : entry.stage === 'Bad Debt'
                              ? '#ef4444'
                              : '#3b82f6'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Denial Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <CardTitle>Denial Root Cause Analysis</CardTitle>
            </div>
            <CardDescription>
              High-value claims requiring appeal or process correction
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <FileCheck className="h-4 w-4 mr-2" />
              Assign Appeals
            </Button>
            <Button variant="outline" size="sm">
              <CreditCard className="h-4 w-4 mr-2" />
              Payer Rules
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={denialAnalytics}
            caption="Denial root cause analysis table"
            ariaLabel="Denial root cause analysis data table for patient revenue"
          />
        </CardContent>
      </Card>
    </div>
  );
}
