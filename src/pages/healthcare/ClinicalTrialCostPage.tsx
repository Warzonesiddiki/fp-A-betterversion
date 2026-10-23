import { buildFiscalPeriods } from '@/utils/fiscalPeriods';
import { PageHeader } from '@/components/ui/PageHeader';
import { useMemo, useState } from 'react';
import { Beaker, Timer, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { DataTable, Column } from '@/components/ui/DataTable';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
} from 'recharts';
import type { FiscalPeriod } from '@/types';
import { useHealthcareStore } from '@/store/healthcareStore';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { formatNumber, formatPercent } from '@/utils/financialFormatting';
import { deriveClinicalTrialAnalysis } from '@/pages/healthcare/clinicalTrialData';

const fiscalPeriods: FiscalPeriod[] = buildFiscalPeriods();

/**
 * Clinical trial costs.
 *
 * Every figure comes from `@/pages/healthcare/clinicalTrialData` over trials
 * recorded in `healthcareStore.clinicalTrials`. See that module's correctness
 * contract: this page previously hardcoded five studies at named institutions
 * (Onco-Shield Ph III at Mayo Clinic, Neuro-Restore Ph II at Johns Hopkins …),
 * six months of budget/actual/enrolment, a four-literal KPI strip
 * ($24.8M / $18.5k / 92.4% / $3.2M) with invented deltas and sparkline
 * histories, and a phase breakdown quoting "2 active, $13.6M total · 55%".
 */
export default function ClinicalTrialCostPage() {
  const [periodId, setPeriodId] = useState('P01');
  const fmt = useCurrencyFormatter();
  const trials = useHealthcareStore((s) => s.clinicalTrials);

  const analysis = useMemo(() => deriveClinicalTrialAnalysis(trials), [trials]);

  const columns = useMemo<Column[]>(
    () => [
      { key: 'name', header: 'Trial Name', sortable: true },
      { key: 'site', header: 'Lead Site' },
      { key: 'phase', header: 'Phase' },
      {
        key: 'budget',
        header: 'Budget',
        align: 'right',
        render: (v) => fmt.currency0(v as number),
      },
      {
        key: 'actualSpend',
        header: 'Actual Spend',
        align: 'right',
        render: (v) => fmt.currency0(v as number),
      },
      {
        key: 'variancePercent',
        header: 'Variance',
        align: 'right',
        render: (v) => {
          const pct = v as number | null;
          if (pct === null) return <span className="text-[var(--text-muted)]">—</span>;
          return (
            <span className={pct > 0 ? 'text-red-600' : 'text-green-600'}>
              {formatPercent(pct, 1)}
            </span>
          );
        },
      },
      {
        key: 'enrollmentPercent',
        header: 'Enrolment',
        align: 'right',
        render: (v, row) => (
          <span>
            {formatPercent(v as number | null, 0)}{' '}
            <span className="text-[10px] text-[var(--text-muted)]">
              ({formatNumber(row.enrolled as number)} /{' '}
              {formatNumber(row.targetEnrollment as number)})
            </span>
          </span>
        ),
      },
      {
        key: 'costPerPatient',
        header: 'Cost / Patient',
        align: 'right',
        render: (v) => {
          const value = v as number | null;
          return value === null ? (
            <span className="text-[var(--text-muted)]">—</span>
          ) : (
            fmt.currency0(value)
          );
        },
      },
      {
        key: 'status',
        header: 'Status',
        render: (v) => (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
            {String(v)}
          </span>
        ),
      },
    ],
    [fmt]
  );

  if (!analysis) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <Beaker className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Trials Recorded</h2>
        <p className="text-[var(--text-muted)]">
          Record a study — its budget, spend to date, enrolment target and patients enrolled — to
          see cost per patient and budget variance. Trials are not general-ledger objects, so this
          workspace will not infer a portfolio for you.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Clinical Trial Costs"
          purpose={
            'Research & Development financial tracking: Trial budgets, site spend, and enrollment ROI.'
          }
        />
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={fiscalPeriods} />
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
          value={fmt.currency0(analysis.totalBudget)}
          changeLabel={`${analysis.trials.length} trial${analysis.trials.length === 1 ? '' : 's'} recorded`}
        />
        <KPIValue
          label="Spend to Date"
          value={fmt.currency0(analysis.totalSpend)}
          changeLabel={
            analysis.overBudgetCount > 0
              ? `${analysis.overBudgetCount} over budget`
              : 'all within budget'
          }
          trend={analysis.totalVariance > 0 ? 'down' : 'up'}
        />
        <KPIValue
          label="Cost per Patient"
          value={analysis.costPerPatient === null ? '—' : fmt.currency0(analysis.costPerPatient)}
          changeLabel={`${formatNumber(analysis.totalEnrolled)} enrolled`}
        />
        <KPIValue
          label="Enrolment Rate"
          value={formatPercent(analysis.enrollmentPercent, 1)}
          changeLabel={`target ${formatNumber(analysis.totalTarget)}`}
        />
      </div>

      {/* Main Analysis */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-blue-600" />
              <CardTitle>Budget vs Spend by Trial</CardTitle>
            </div>
            <CardDescription>
              Recorded budget against spend to date, with patients enrolled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={[...analysis.trials]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => fmt.compact(Number(v))}
                  />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => fmt.currency0(Number(v))} />
                  <Legend verticalAlign="top" align="right" />
                  <Bar
                    yAxisId="left"
                    dataKey="actualSpend"
                    name="Spend to date"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="enrolled"
                    name="Patients enrolled"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="budget"
                    name="Budget"
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
            <CardDescription>Recorded budget by trial phase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {analysis.phases.map((p) => (
              <div key={p.phase} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">{p.phase}</div>
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    {p.count} trial{p.count === 1 ? '' : 's'} · {fmt.currency0(p.budget)} budget
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{formatPercent(p.sharePercent, 1)}</div>
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    {fmt.currency0(p.spend)} spent
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Trial table */}
      <Card>
        <CardHeader>
          <CardTitle>Trial Portfolio</CardTitle>
          <CardDescription>Recorded studies, budget variance and cost per patient</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={analysis.trials as unknown as Record<string, unknown>[]}
            caption="Clinical trial portfolio table"
            ariaLabel="Clinical trial portfolio data table"
          />
        </CardContent>
      </Card>

      {analysis.unavailable.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Not derivable from recorded trials</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {analysis.unavailable.map((u) => (
                <li key={u.label}>
                  <span className="font-semibold">{u.label}</span>
                  <span className="text-[var(--text-muted)]"> — {u.reason}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
