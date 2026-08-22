// @money-ast-allow Reason: this file is the education enrollment/retention
// page. The flagged `>` comparisons (`e.credit > e.debit` and
// `e.debit > e.credit`) are entry-direction FILTERS used to choose whether
// a GL entry is revenue (credit-side) or expense (debit-side). They are
// not money arithmetic; they select which entries flow into the
// downstream `sumMoney(...)` aggregation in the canonical money
// primitive. Net amounts are summed exactly.

/**
 * Education — Enrollment & Retention (Wave 9 Phase 3 Sector Depth).
 *
 * Consumes the exact-money educationMetrics engine for retention rate,
 * revenue per student and faculty-to-student ratio.
 */
import { useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { GraduationCap, Users, Banknote, UserCheck } from 'lucide-react';
import type { GLEntry } from '@/types';
import { formatMoney, roundTo, sumMoney } from '@/utils/money';
import { formatNumber } from '@/utils/formatters';
import { formatPercent } from '@/utils/financialFormatting';
import { computeEducationMetrics, type EducationMetricsInput } from './educationMetrics';

export type EnrollmentInput = EducationMetricsInput;

/**
 * Sum debit-side amounts of entries matching `pattern`, or `null` when no
 * account name matches — the quantity was never posted, which must not be
 * replaced with an assumed constant.
 */
function sumDebitIfPosted(entries: readonly GLEntry[], pattern: RegExp): number | null {
  const matching = entries.filter((e) => pattern.test(e.accountName.toLowerCase()));
  if (matching.length === 0) return null;
  return roundTo(sumMoney(matching.map((e) => e.debit)), 2);
}

/** Derive enrollment inputs from GL entries (exact sums). */
export function computeEnrollmentFromEntries(entries: readonly GLEntry[]): EnrollmentInput {
  const tuitionMatches = entries.filter((e) =>
    /tuition|fees|student.*revenue/.test(e.accountName.toLowerCase())
  );
  const tuitionRevenue =
    tuitionMatches.length === 0
      ? null
      : roundTo(
          // Credit-normal only: debit-heavy rows with a tuition-ish name are
          // not revenue.
          sumMoney(tuitionMatches.filter((e) => e.credit > e.debit).map((e) => e.credit)),
          2
        );
  const totalExpenses = roundTo(
    sumMoney(entries.filter((e) => e.debit > e.credit).map((e) => e.debit)),
    2
  );

  return {
    // `null` = no tagged account posts this quantity. The previous constants
    // (12,000 students / 11,400 retained / $24M tuition / $21.6M expenses /
    // 800 faculty / literal grants & endowment balances) fabricated an entire
    // institution whenever the GL lacked these accounts.
    totalStudents: sumDebitIfPosted(entries, /total students|enrollment/),
    retainedStudents: sumDebitIfPosted(entries, /retained|retention/),
    tuitionRevenue,
    totalExpenses,
    facultyCount: sumDebitIfPosted(entries, /faculty|staff.*count/),
    researchGrantsWon: null,
    researchGrantsApplied: null,
    endowmentStart: null,
    endowmentEnd: null,
  };
}

export default function EnrollmentRetentionPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Enrollment & Retention';
  }, []);

  const input = useMemo(() => computeEnrollmentFromEntries(entries), [entries]);
  const metrics = useMemo(() => computeEducationMetrics(input), [input]);

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Enrollment - No Data">
        <GraduationCap
          className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4"
          aria-hidden="true"
        />
        <h1 className="text-xl font-semibold mb-2">No Enrollment Data</h1>
        <p className="text-[var(--text-muted)] mb-6">
          Import GL data to view enrollment & retention metrics.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6 animate-fade-in" role="main" aria-label="Enrollment & Retention">
      <header className="flex items-center justify-between">
        <PageHeader
          title={'Enrollment & Retention'}
          purpose={'Enrollment, retention & revenue-per-student analytics'}
        />
        <Button variant="outline" onClick={() => navigate('/education')}>
          Back to Education
        </Button>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="Enrollment KPIs">
        <KPIValue
          label="Retention Rate"
          value={
            metrics.studentRetentionRatePct === null
              ? '—'
              : formatPercent(metrics.studentRetentionRatePct, 1)
          }
          changeLabel={
            metrics.studentRetentionRatePct === null
              ? 'no enrollment/retention counts posted'
              : undefined
          }
          icon={<UserCheck className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Revenue Per Student"
          value={metrics.revenuePerStudent === null ? '—' : formatMoney(metrics.revenuePerStudent)}
          changeLabel={
            metrics.revenuePerStudent === null
              ? 'needs posted tuition and enrollment counts'
              : 'posted tuition ÷ posted students'
          }
          icon={<Banknote className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Faculty : Student"
          value={
            metrics.facultyToStudentRatio === null
              ? '—'
              : formatNumber(metrics.facultyToStudentRatio)
          }
          changeLabel={
            metrics.facultyToStudentRatio === null
              ? 'no faculty/student counts posted'
              : 'students per faculty FTE'
          }
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Net Income"
          value={metrics.netIncome === null ? '—' : formatMoney(metrics.netIncome)}
          changeLabel={
            metrics.netIncome === null
              ? 'needs posted tuition and expenses'
              : 'tuition − posted expenses'
          }
          icon={<GraduationCap className="h-4 w-4" aria-hidden="true" />}
        />
      </section>

      <Card aria-label="Enrollment Detail">
        <CardHeader>
          <CardTitle>Enrollment Detail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--text-muted)]">Total Students</span>
            <span className="font-mono">
              {input.totalStudents === null ? '— not posted' : formatNumber(input.totalStudents)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--text-muted)]">Retained Students</span>
            <span className="font-mono">
              {input.retainedStudents === null
                ? '— not posted'
                : formatNumber(input.retainedStudents)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--text-muted)]">Tuition Revenue</span>
            <span className="font-mono">
              {input.tuitionRevenue === null
                ? '— no tuition-classified accounts'
                : formatMoney(input.tuitionRevenue)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--text-muted)]">Faculty Count</span>
            <span className="font-mono">
              {input.facultyCount === null ? '— not posted' : formatNumber(input.facultyCount)}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] pt-2">
            Figures come only from tagged GL accounts (enrollment, retention, tuition, faculty).
            Quantities the ledger does not post are shown blank — they are never filled with assumed
            institutional averages.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
