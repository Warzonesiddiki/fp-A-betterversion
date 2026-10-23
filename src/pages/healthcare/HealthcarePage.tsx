/**
 * Healthcare overview — every figure is derived from the posted GL.
 *
 * CORRECTNESS CONTRACT:
 * 1. Sector KPIs come from `HealthcareEngine.calculatePatientRevenue` and
 *    `HealthcareEngine.getPayerMix` (pure, money-primitive-backed). This page
 *    previously rendered the same generic debit/credit reskin as the
 *    manufacturing overview while the engine sat unwired.
 * 2. The claim-denial rate is `null` by engine contract — a GL carries no
 *    submitted/denied claim counts — so it is disclosed as unavailable rather
 *    than defaulted.
 * 3. Days in A/R renders with its stated divisor basis (30 days) because the
 *    basis is a modelling assumption, not a measured calendar.
 */
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Download, DollarSign, FileSpreadsheet, Heart, Layers } from 'lucide-react';
import { useGLStore } from '@/store/glStore';
import { useHealthcareStore } from '@/store/healthcareStore';
import { HealthcareEngine } from '@/engines/HealthcareEngine';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { computeHealthcareRatioPct } from './healthcareMetrics';
import { aggregateAccounts } from './accountOverview';
import { AccountOverviewCard } from './AccountOverviewCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { PageHeader } from '@/components/ui/PageHeader';

const REVENUE_CYCLE_STAGES = [
  { key: 'grossCharges', label: 'Gross patient charges (40xx)' },
  { key: 'contractuals', label: 'Contractual adjustments (41xx, contra)' },
  { key: 'netRevenue', label: 'Net patient revenue' },
  { key: 'cashCollected', label: 'Cash collected (11xx)' },
  { key: 'badDebt', label: 'Bad debt (42xx)' },
] as const;

/** Engine payor colors mapped to literal Tailwind classes (no inline styles). */
const PAYER_DOT_CLASSES: Record<string, string> = {
  '#3b82f6': 'bg-blue-500',
  '#10b981': 'bg-emerald-500',
  '#f59e0b': 'bg-amber-500',
  '#ef4444': 'bg-red-500',
  '#6366f1': 'bg-indigo-500',
};

export function HealthcarePage() {
  const fmt = useCurrencyFormatter();
  const entries = useGLStore((s) => s.entries);
  const programs = useHealthcareStore((s) => s.programs);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Healthcare';
  }, []);

  const rev = useMemo(() => HealthcareEngine.calculatePatientRevenue(entries), [entries]);
  const payerMix = useMemo(() => HealthcareEngine.getPayerMix(entries), [entries]);
  const accountBreakdown = useMemo(() => aggregateAccounts(entries), [entries]);
  const programCount = Array.isArray(programs) ? programs.length : 0;

  const handleExportPDF = () => {
    void ExportEngine.exportToPDF(
      {
        headers: ['Metric', 'Value'],
        rows: [
          ['Gross Charges', fmt.currency0(rev.grossCharges)],
          ['Contractual Adjustments', fmt.currency0(rev.contractuals)],
          ['Net Patient Revenue', fmt.currency0(rev.netRevenue)],
          ['Cash Collected', fmt.currency0(rev.cashCollected)],
          ['Bad Debt', fmt.currency0(rev.badDebt)],
          ['Collection Rate', fmt.percent(rev.collectionRate, 1)],
          [`Days in A/R (${rev.daysInPeriodBasis}-day basis)`, fmt.number(rev.daysInAR, 2)],
        ],
      },
      { title: 'Healthcare Overview Report' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    void ExportEngine.exportToExcel(
      {
        headers: ['Payor', 'Charges'],
        rows: payerMix.map((p) => [p.name, p.value]),
      },
      { title: 'Healthcare_Payor_Mix' }
    ).catch(reportExportFailure);
  };

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Healthcare - No Data">
        <a
          href="#import-btn"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
        >
          Skip to import action
        </a>
        <Heart className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-xl font-semibold mb-2">No Healthcare Data</h1>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to view healthcare.</p>
        <Button
          id="import-btn"
          onClick={() => navigate('/data/gl-upload')}
          aria-label="Import GL data to view healthcare"
        >
          Import Data
        </Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6 animate-fade-in" role="main" aria-label="Healthcare Dashboard">
      <a
        href="#kpi-section"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to key metrics
      </a>
      <PageHeader
        title="Healthcare"
        titleId="healthcare-heading"
        purpose="Patient-revenue KPIs derived from posted GL accounts (40xx charges, 41xx contractuals, 42xx bad debt, 11xx cash, 12xx A/R) via HealthcareEngine."
        status={
          <span className="text-sm text-[var(--text-muted)]">
            {fmt.number(entries.length)} entries · {fmt.number(programCount)} care programs
          </span>
        }
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleExportPDF} aria-label="Export PDF">
              <Download className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              PDF
            </Button>
            <Button size="sm" variant="ghost" onClick={handleExportExcel} aria-label="Export Excel">
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              Excel
            </Button>
          </div>
        }
      />
      <section
        id="kpi-section"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        aria-label="Healthcare KPIs"
        aria-labelledby="healthcare-heading"
      >
        <KPIValue
          label="Net Patient Revenue"
          value={fmt.currency0(rev.netRevenue)}
          icon={<Heart className="h-4 w-4" aria-hidden="true" />}
          changeLabel="Charges less contractual adjustments"
        />
        <KPIValue
          label="Gross Charges"
          value={fmt.currency0(rev.grossCharges)}
          icon={<DollarSign className="h-4 w-4" aria-hidden="true" />}
          changeLabel="Posted 40xx accounts"
        />
        <KPIValue
          label="Cash Collected"
          value={fmt.currency0(rev.cashCollected)}
          icon={<Layers className="h-4 w-4" aria-hidden="true" />}
          changeLabel={`Collection rate ${fmt.percent(rev.collectionRate, 1)} of net revenue`}
        />
        <KPIValue
          label="Days in A/R"
          value={fmt.number(rev.daysInAR, 2)}
          changeLabel={`${rev.daysInPeriodBasis}-day divisor basis — modelling assumption, not a measured calendar`}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card aria-label="Revenue Cycle" aria-live="polite">
          <CardHeader>
            <CardTitle>Patient Revenue Cycle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2">
              {REVENUE_CYCLE_STAGES.map((stage) => (
                <li
                  key={stage.key}
                  className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 last:border-0 text-sm"
                >
                  <span>{stage.label}</span>
                  <span className="font-mono tabular-nums">{fmt.currency(rev[stage.key])}</span>
                </li>
              ))}
            </ul>
            <p className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Claim denial rate is not derivable from a general ledger — it requires
                claim/remittance (835/837) feeds and is never estimated here.
              </span>
            </p>
          </CardContent>
        </Card>

        <Card aria-label="Payor Mix" aria-live="polite">
          <CardHeader>
            <CardTitle>Payor Mix</CardTitle>
          </CardHeader>
          <CardContent>
            {payerMix.length > 0 ? (
              <>
                <ul className="space-y-2">
                  {payerMix.map((payer) => (
                    <li
                      key={payer.name}
                      className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 last:border-0 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            PAYER_DOT_CLASSES[payer.color] ?? 'bg-blue-500'
                          }`}
                          aria-hidden="true"
                        />
                        {payer.name}
                      </span>
                      <span className="font-mono tabular-nums">
                        {fmt.currency(payer.value)}
                        <span className="ml-2 text-[var(--text-secondary)]">
                          {fmt.percent(computeHealthcareRatioPct(payer.value, rev.grossCharges), 1)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="pt-2 text-xs text-[var(--text-muted)]">
                  Shares are each payor portion of posted gross charges (exact decimal division).
                </p>
              </>
            ) : (
              <p className="text-[var(--text-muted)]">
                No payor-coded revenue accounts found. Post 40xx accounts whose codes end in the
                payor suffix (01 Medicare, 02 Commercial, 03 Medicaid, 04 Self-Pay, 05 Other) to
                populate this mix.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <AccountOverviewCard rows={accountBreakdown} />
    </main>
  );
}

export default HealthcarePage;
