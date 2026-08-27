// @money-ast-allow Reason: Entry-direction filter: e.credit > e.debit selects credit-heavy entries for sumMoney, not a money result
/**
 * Education — Research Grants (Wave 9 Phase 3 Sector Depth).
 *
 * Consumes the exact-money educationMetrics engine for research grant win
 * rate and endowment growth, plus exact income summation.
 */
import { useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { FlaskConical, TrendingUp, Award, PieChart } from 'lucide-react';
import type { GLEntry } from '@/types';
import { formatMoney, roundTo, sumMoney } from '@/utils/money';
import { formatNumber } from '@/utils/formatters';
import { formatPercent } from '@/utils/financialFormatting';
import {
  computeEducationMetrics,
  growthByRate,
  type EducationMetricsInput,
} from './educationMetrics';

export type ResearchGrantsInput = EducationMetricsInput & {
  /** Sponsored-research revenue recognized from grant accounts. */
  researchGrantRevenue: number;
};

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

/** Derive research-grant inputs from GL entries (exact sums). */
export function computeResearchGrantsFromEntries(entries: readonly GLEntry[]): ResearchGrantsInput {
  const researchGrantRevenue = roundTo(
    sumMoney(
      entries
        .filter((e) => /research.*grant|grant.*revenue|sponsored/.test(e.accountName.toLowerCase()))
        // Credit-normal only: debit-heavy grant-named rows are not revenue.
        .filter((e) => e.credit > e.debit)
        .map((e) => e.credit)
    ),
    2
  );

  return {
    // `null` = no tagged account posts this quantity. The previous literals
    // (12,000 students / $24M tuition / $100M→$108M endowment / 60-of-250
    // grants) fabricated an entire research institution out of thin air.
    totalStudents: sumDebitIfPosted(entries, /total students|enrollment/),
    retainedStudents: sumDebitIfPosted(entries, /retained|retention/),
    tuitionRevenue: sumCreditOrNetIfPosted(entries, /tuition|fees|student.*revenue/),
    totalExpenses: roundTo(
      sumMoney(entries.filter((e) => e.debit > e.credit).map((e) => e.debit)),
      2
    ),
    facultyCount: sumDebitIfPosted(entries, /faculty|staff.*count/),
    researchGrantsWon: sumDebitIfPosted(entries, /grant.*won|awarded/),
    researchGrantsApplied: sumDebitIfPosted(entries, /grant.*applied|submitted/),
    endowmentStart: sumDebitIfPosted(entries, /endowment.*start|opening.*endowment/),
    endowmentEnd: sumDebitIfPosted(entries, /endowment.*end|closing.*endowment/),
    researchGrantRevenue,
  };
}

/** Sum credit-normal amounts, or `null` when nothing matches. */
function sumCreditOrNetIfPosted(entries: readonly GLEntry[], pattern: RegExp): number | null {
  const matching = entries
    .filter((e) => pattern.test(e.accountName.toLowerCase()))
    .filter((e) => e.credit > e.debit);
  if (matching.length === 0 && !entries.some((e) => pattern.test(e.accountName.toLowerCase())))
    return null;
  return roundTo(sumMoney(matching.map((e) => e.credit)), 2);
}

export default function ResearchGrantsPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Research Grants';
  }, []);

  const input = useMemo(() => computeResearchGrantsFromEntries(entries), [entries]);
  const metrics = useMemo(() => computeEducationMetrics(input), [input]);
  // Projection: applies the MEASURED growth rate to the posted closing
  // balance. It is a projection of that rate, not a measured KPI, and it
  // exists only when both endowment balances are posted.
  const projectedEndowment = useMemo(
    () =>
      input.endowmentEnd !== null && metrics.endowmentGrowthRatePct !== null
        ? growthByRate(input.endowmentEnd, metrics.endowmentGrowthRatePct)
        : null,
    [input.endowmentEnd, metrics.endowmentGrowthRatePct]
  );

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Research Grants - No Data">
        <FlaskConical
          className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4"
          aria-hidden="true"
        />
        <h1 className="text-xl font-semibold mb-2">No Research Data</h1>
        <p className="text-[var(--text-muted)] mb-6">
          Import GL data to view research grant metrics.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6 animate-fade-in" role="main" aria-label="Research Grants">
      <header className="flex items-center justify-between">
        <PageHeader
          title="Research Grants"
          purpose={'Grant win rate, endowment growth & sponsored revenue'}
        />
        <Button variant="outline" onClick={() => navigate('/education')}>
          Back to Education
        </Button>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="Research KPIs">
        <KPIValue
          label="Grant Win Rate"
          value={
            metrics.researchGrantWinRatePct === null
              ? '—'
              : formatPercent(metrics.researchGrantWinRatePct, 1)
          }
          changeLabel={
            metrics.researchGrantWinRatePct === null
              ? 'no grant applied/won counts posted'
              : 'posted grants won ÷ grants applied'
          }
          icon={<Award className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Endowment Growth"
          value={
            metrics.endowmentGrowthRatePct === null
              ? '—'
              : formatPercent(metrics.endowmentGrowthRatePct, 1)
          }
          changeLabel={
            metrics.endowmentGrowthRatePct === null
              ? 'opening/closing endowment not both posted'
              : 'closing − opening, over opening'
          }
          icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Research Grant Revenue"
          value={formatMoney(input.researchGrantRevenue)}
          changeLabel={
            input.researchGrantRevenue > 0
              ? undefined
              : 'no research-grant/sponsored accounts posted'
          }
          icon={<FlaskConical className="h-4 w-4" aria-hidden="true" />}
        />
        <KPIValue
          label="Projected Endowment"
          value={projectedEndowment === null ? '—' : formatMoney(projectedEndowment)}
          changeLabel={
            projectedEndowment === null
              ? 'needs both endowment balances'
              : 'projection: closing balance × (1 + measured growth)'
          }
          icon={<PieChart className="h-4 w-4" aria-hidden="true" />}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card aria-label="Grant Detail">
          <CardHeader>
            <CardTitle>Grant Detail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-muted)]">Grants Applied</span>
              <span className="font-mono">
                {input.researchGrantsApplied === null
                  ? '— not posted'
                  : formatNumber(input.researchGrantsApplied)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-muted)]">Grants Won</span>
              <span className="font-mono">
                {input.researchGrantsWon === null
                  ? '— not posted'
                  : formatNumber(input.researchGrantsWon)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-muted)]">Closing Endowment</span>
              <span className="font-mono">
                {input.endowmentEnd === null ? '— not posted' : formatMoney(input.endowmentEnd)}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card aria-label="Endowment Detail">
          <CardHeader>
            <CardTitle>Endowment Detail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-muted)]">Opening Endowment</span>
              <span className="font-mono">
                {input.endowmentStart === null ? '— not posted' : formatMoney(input.endowmentStart)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-muted)]">Endowment Growth ($)</span>
              <span className="font-mono">
                {metrics.endowmentGrowth === null
                  ? '— needs both balances'
                  : formatMoney(metrics.endowmentGrowth)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-muted)]">Tuition Revenue (context)</span>
              <span className="font-mono">
                {input.tuitionRevenue === null
                  ? '— no tuition-classified accounts'
                  : formatMoney(input.tuitionRevenue)}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] pt-2">
              Figures come only from tagged GL accounts (grants, awards, submissions, endowment
              balances). Quantities the ledger does not post are shown blank — they are never filled
              with assumed institutional records. The projection tile reuses the measured growth
              rate; it is a scenario figure, not a measurement.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
