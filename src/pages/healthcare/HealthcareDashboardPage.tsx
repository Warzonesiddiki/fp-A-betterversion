/**
 * Healthcare dashboard — every figure is derived from the posted GL.
 *
 * CORRECTNESS CONTRACT (K18):
 *
 * 1. NEVER render a figure the ledger cannot support. Removed in this pass:
 *    - the "Patient Volume Trend" area chart fed by a hand-typed six-month
 *      fixture (`patientVolumeData`: emergency/inpatient/outpatient counts,
 *      Jan–Jun) that no store carried;
 *    - the "Estimated Admissions" KPI — net revenue divided by an invented
 *      $5,000 per-admission divisor — together with its hand-typed sparkline
 *      history (1100 … 1230 with the live value appended);
 *    - "Avg. Length of Stay", which mislabelled the ledger's days-in-A/R as
 *      a clinical length of stay and appended an invented 4.8 → 4.2 history;
 *    - invented KPI deltas with narrative causes (+4.2 "inpatient up 5%",
 *      −1.5 "efficiency improved", +12.1 "reimbursements up", +1.2
 *      "target: 95%") and the remaining two sparkline "histories".
 * 2. The four KPIs shown are exactly the posted-ledger outputs of
 *    `HealthcareEngine.calculatePatientRevenue`, each labelled with its
 *    derivation basis (same contract as PatientRevenuePage).
 * 3. Patient encounters, bed occupancy and staffing are clinical/roster
 *    facts, not ledger facts. Those cards disclose what is missing instead
 *    of estimating. The departmental table sums posted 40xx revenue by the
 *    account-suffix convention and renders every non-derivable column as
 *    '—' with that basis disclosed.
 */
import { buildFiscalPeriods } from '@/utils/fiscalPeriods';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Stethoscope, Building2, Download, Share2, MoreHorizontal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { DataTable, Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { roundTo, sumMoney } from '@/utils/money';

import type { FiscalPeriod } from '@/types';
import { useGLStore } from '@/store/glStore';
import { HealthcareEngine } from '@/engines/HealthcareEngine';
import { formatNumber, formatPercent } from '@/utils/financialFormatting';

// Real fiscal periods from FiscalCalendar + org settings (see fiscalPeriods.ts).
const fiscalPeriods: FiscalPeriod[] = buildFiscalPeriods();

export default function HealthcareDashboardPage() {
  const fmtCurrency = useCurrencyFormatter();
  const navigate = useNavigate();

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
  const entries = useGLStore((s) => s.entries);
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
    // K30 four-states: shared EmptyState under the page-level h1 (PageHeader
    // stays mounted in this branch). Nothing is invented while the ledger is
    // empty, and the CTA drives the real import flow.
    return (
      <div className="p-6 space-y-6 max-w-7xl" aria-labelledby="healthcare-dashboard-heading">
        <PageHeader
          title="Healthcare Dashboard"
          titleId="healthcare-dashboard-heading"
          purpose="Hospital performance analytics derived from posted General Ledger entries."
        />
        <EmptyState
          variant="no-data"
          title="No healthcare data"
          description="Import your General Ledger data with patient-revenue accounts (40xx charges, 41xx contractuals, 11xx cash, 12xx receivables) to view hospital performance analytics. Encounters, occupancy and staffing are never inferred from the ledger."
          action={
            <Button
              onClick={() => navigate('/data/gl-upload')}
              data-testid="healthcare-empty-import"
            >
              Import Data
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div
      className="p-6 space-y-6 animate-in fade-in duration-500"
      aria-labelledby="healthcare-dashboard-heading"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Healthcare Dashboard"
          titleId="healthcare-dashboard-heading"
          purpose="Hospital performance analytics derived from posted General Ledger entries."
        />
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={fiscalPeriods} />
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            PDF Report
          </Button>
          <Button variant="ghost" size="icon" aria-label="More options">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPIs — all four are posted-ledger outputs with their basis disclosed */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIValue
          label="Gross Charges"
          value={fmtCurrency.custom()(stats.grossCharges)}
          changeLabel="posted to 40xx"
        />
        <KPIValue
          label="Net Patient Revenue"
          value={fmtCurrency.custom({ maxDecimals: 1, compact: true })(stats.netRevenue)}
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

      {/* Clinical-facts cards — disclosed gaps, not estimates */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              <CardTitle>Patient Volume</CardTitle>
            </div>
            <CardDescription>Encounters are clinical facts, not ledger facts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <p className="text-[var(--text-muted)]">
                Emergency, inpatient and outpatient encounter counts come from
                admission-discharge-transfer (ADT) systems, not from journal entries. Estimating
                admissions by dividing net revenue by an assumed average revenue per admission is
                modelling, not measurement, so no such estimate is rendered either.
              </p>
              <p className="text-[var(--text-muted)]">
                Connect an ADT/EHR feed to populate volume trends.
              </p>
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
              Net revenue summed from posted 40xx accounts whose code ends in the department&apos;s
              number convention. Operating margin, efficiency and patient counts are not derivable
              from the ledger.
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
