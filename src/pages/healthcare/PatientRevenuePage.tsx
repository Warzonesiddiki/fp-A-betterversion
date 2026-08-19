/**
 * Patient revenue cycle — every figure is derived from the posted GL.
 *
 * CORRECTNESS CONTRACT (K18):
 *
 * 1. NEVER render a figure the ledger cannot support. Removed in this pass:
 *    - a five-row denial root-cause table ($840k / $450k / $1.2M / $120k /
 *      $2.1M against counts 420 / 215 / 180 / 95 / 64) that was identical for
 *      every entity and every period, and was additionally rendered through a
 *      column config (`metric` / `value`) that did not match its own rows;
 *    - KPI deltas +8.4% / -0.8 / +1.2 / -2.4 with narrative causes
 *      ("volume increase in Q1", "coding audits effective");
 *    - seven-point sparkline "histories" (10.2 … 12.2, 5.2 … 4.3, 92.5 … 94.5,
 *      42 … 39) with the live value appended, which made invented trends look
 *      measured.
 * 2. A denial rate needs claim/remittance (835/837) data. The GL does not
 *    carry it, so `HealthcareEngine` returns `null` and this page discloses
 *    it. It used to be a hardcoded 4.2.
 * 3. Days in A/R is shown with its divisor basis disclosed, because the basis
 *    is a modelling assumption, not a measured calendar.
 */
import type { FiscalPeriod } from '@/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { buildFiscalPeriods } from '@/utils/fiscalPeriods';

import { useMemo, useState } from 'react';
import {
  DollarSign,
  PieChart as PieChartIcon,
  BarChart2,
  AlertCircle,
  Download,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
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

  // Engine returns null by contract; render the absence, never a default.
  const denialRateDisplay = stats.denialRate === null ? '\u2014' : `${stats.denialRate}%`;

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
          changeLabel="posted to 40xx"
        />
        <KPIValue
          label="Net Revenue"
          value={fmtCurrency.custom()(stats.netRevenue)}
          changeLabel="gross charges less 41xx contractuals"
        />
        <KPIValue
          label="Collection Rate"
          value={formatPercent(stats.collectionRate, 1)}
          changeLabel="11xx cash against net revenue"
        />
        <KPIValue
          label="Days in A/R"
          value={formatNumber(stats.daysInAR, 1)}
          changeLabel={`12xx balance on a ${stats.daysInPeriodBasis}-day basis`}
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

      {/* Denial analytics: disclosed, not estimated */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <CardTitle>Denial Root Cause Analysis</CardTitle>
          </div>
          <CardDescription>
            Requires claim and remittance detail, which the general ledger does not carry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p className="text-[var(--text-muted)]">
              Denial counts, denial rate and denied dollars are claim-level facts. They come from
              837 submissions and 835 remittance advice, not from posted journal entries, so this
              workspace cannot derive them from your ledger.
            </p>
            <ul className="list-disc pl-5 text-[var(--text-muted)] space-y-1">
              <li>Denial rate — unavailable ({denialRateDisplay})</li>
              <li>
                Denials by root cause (eligibility, coding, prior auth, medical necessity) —
                unavailable
              </li>
              <li>Denied dollars and appeal recovery — unavailable</li>
            </ul>
            <p className="text-[var(--text-muted)]">
              Connect a claims or clearinghouse feed to populate this analysis.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
