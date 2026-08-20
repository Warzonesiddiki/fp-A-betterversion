import { buildFiscalPeriods } from '@/utils/fiscalPeriods';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { useMemo, useState } from 'react';

import { Activity, Stethoscope, Building2, Download, Share2, MoreHorizontal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { DataTable, Column } from '@/components/ui/DataTable';
import { divideMoney, roundTo, sumMoney } from '@/utils/money';

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
import { HealthcareEngine } from '@/engines/HealthcareEngine';
import { formatNumber, formatPercent } from '@/utils/financialFormatting';

// Mock Data
const mockPeriods: FiscalPeriod[] = buildFiscalPeriods();

const patientVolumeData = [
  { month: 'Jan', emergency: 850, inpatient: 420, outpatient: 2100 },
  { month: 'Feb', emergency: 780, inpatient: 390, outpatient: 1950 },
  { month: 'Mar', emergency: 920, inpatient: 450, outpatient: 2300 },
  { month: 'Apr', emergency: 890, inpatient: 440, outpatient: 2200 },
  { month: 'May', emergency: 950, inpatient: 480, outpatient: 2450 },
  { month: 'Jun', emergency: 1100, inpatient: 520, outpatient: 2800 },
];

export default function HealthcareDashboardPage() {
  const fmtCurrency = useCurrencyFormatter();

  const columns = useMemo<Column[]>(
    () => [
      { key: 'dept', header: 'Department', sortable: true },
      {
        key: 'revenue',
        header: 'Net Revenue',
        align: 'right',
        render: (v) => fmtCurrency.custom({ maxDecimals: 0 })(v as number),
      },
      {
        key: 'margin',
        header: 'Operating Margin',
        align: 'right',
        render: (v) =>
          v == null ? (
            <span className="text-[var(--text-muted)]">—</span>
          ) : (
            <span
              className={
                (v as number) > 20 ? 'text-green-600 font-bold' : 'text-blue-600 font-bold'
              }
            >
              {formatPercent(v as number, 1)}
            </span>
          ),
      },
      {
        key: 'efficiency',
        header: 'Efficiency Score',
        align: 'right',
        render: (v) => (v == null ? <span className="text-[var(--text-muted)]">—</span> : `${v}%`),
      },
      {
        key: 'patients',
        header: 'Patient Count',
        align: 'right',
        render: (v) =>
          v == null ? (
            <span className="text-[var(--text-muted)]">—</span>
          ) : (
            <span>{String(v)}</span>
          ),
      },
    ],
    [fmtCurrency]
  );
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
        // Derive revenue from the 40xx GL slice for this department suffix.
        // The general ledger does not carry department-level opex, encounter
        // counts, or operating-margin inputs, so the other columns are
        // returned as null and rendered as 'not derivable' (see columns).
        const deptRevenue = roundTo(
          sumMoney(
            entries
              .filter((e) => e.accountCode.startsWith('40') && e.accountCode.endsWith(d.id))
              .map((e) => e.amount)
          ),
          2
        );

        return {
          dept: d.name,
          revenue: deptRevenue,
          patients: null as number | null,
          margin: null as number | null,
          efficiency: null as number | null,
        };
      })
      .filter((d) => d.revenue > 0);
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <Activity className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Healthcare Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
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
        <PageHeader
          title="Healthcare Dashboard"
          purpose="Enterprise hospital management: Patient volume, revenue cycles, and departmental efficiency."
        />
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
          // Admission estimate = net revenue / $5,000 average revenue per admission.
          // Disclosed modelling basis, not a measured encounter count.
          value={Math.floor(roundTo(divideMoney(stats.netRevenue, 5000), 0)).toLocaleString()}
          change={4.2}
          changeLabel="inpatient up 5%"
          trend="up"
          sparklineData={[
            1100,
            1150,
            1120,
            1180,
            1210,
            1230,
            roundTo(divideMoney(stats.netRevenue, 5000), 0),
          ]}
        />
        <KPIValue
          label="Avg. Length of Stay"
          value={`${formatNumber(stats.daysInAR, 1)} Days`}
          change={-1.5}
          changeLabel="efficiency improved"
          trend="up" // Up is good for efficiency
          sparklineData={[4.8, 4.6, 4.5, 4.4, 4.3, 4.2, stats.daysInAR]}
        />
        <KPIValue
          label="Net Patient Revenue"
          value={fmtCurrency.custom({ maxDecimals: 1, compact: true })(stats.netRevenue)}
          change={12.1}
          changeLabel="reimbursements up"
          trend="up"
          // Sparkline is millions of dollars — convert on decimal, round to 1 dp.
          sparklineData={[
            7.2,
            7.5,
            7.4,
            7.8,
            8.1,
            8.3,
            roundTo(divideMoney(stats.netRevenue, 1_000_000), 1),
          ]}
        />
        <KPIValue
          label="Collection Rate"
          value={`${formatPercent(stats.collectionRate, 1)}`}
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
              <Stethoscope className="h-5 w-5 text-blue-600" />
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
            {/* Facility-utilization percentages and on-shift staffing counts are
                NOT derivable from a general ledger. They require a bed-management
                feed and a workforce roster. We disclose the gap rather than
                ship hand-typed placeholders. */}
            <div className="text-sm text-[var(--text-muted)] space-y-2">
              <p>
                <span className="font-medium text-[var(--text-primary)]">
                  ICU Occupancy, General Ward, Surgery Suites
                </span>{' '}
                — bed-occupancy percentages are not derivable from the GL. Connect a bed-management
                feed to populate this card.
              </p>
              <p>
                <span className="font-medium text-[var(--text-primary)]">
                  Nurses on Shift, On-call Doctors
                </span>{' '}
                — staffing counts require a workforce roster, not a ledger.
              </p>
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
          <DataTable
            columns={columns}
            data={departmentPerformance}
            caption="Healthcare department performance metrics"
            ariaLabel="Department performance table"
          />
        </CardContent>
      </Card>
    </div>
  );
}
