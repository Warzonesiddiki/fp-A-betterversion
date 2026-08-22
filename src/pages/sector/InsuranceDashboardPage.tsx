/**
 * Insurance sector dashboard (W-FAB-001).
 *
 * Every figure on this page comes from `buildInsuranceDashboardModel`
 * (@/pages/insurance/insuranceDashboardData) — the same derivation the
 * insurance twin page consumes. This page holds no stats memo, no metric
 * fallback layer and no constants of its own.
 *
 * Account semantics (from `InsuranceEngine`, natural balances):
 *   41xx written premium (credit − debit) · 42xx earned premium ·
 *   43xx reinsurance ceded (debit − credit) — reported separately, never
 *   inside expenses · 44xx investment income — excluded from underwriting
 *   figures · 51xx loss & LAE · 52xx commission · 53xx underwriting expense.
 *
 * Ratios render as `—` unless their denominator is positive. Retention rate,
 * Solvency II ratio, average claim size and policy count are NOT derived —
 * no posting supports them — and are named in the disclosure block instead.
 */

import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { Shield } from 'lucide-react';
import { useGLStore } from '@/store/glStore';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { formatPercent } from '@/utils/financialFormatting';
import { buildInsuranceDashboardModel } from '@/pages/insurance/insuranceDashboardData';

/** Percentage-point ratio, or an em dash when the denominator does not exist. */
function ratio(value: number | null): string {
  return value === null ? '—' : formatPercent(value, 2);
}

export default function InsuranceDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();
  const fmt = useCurrencyFormatter();

  useEffect(() => {
    document.title = 'FinPlan Pro — Insurance Dashboard';
  }, []);

  const model = useMemo(() => buildInsuranceDashboardModel(entries), [entries]);

  if (!model.hasData) {
    return (
      <main
        className="p-12 text-center max-w-xl mx-auto"
        role="main"
        aria-label="Insurance Dashboard - No Data"
      >
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <Shield className="h-10 w-10 text-[var(--text-muted)]" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold mb-2">Insurance Dashboard</h1>
        <p className="text-[var(--text-muted)] mb-2">
          No underwriting activity is posted. This page reads the general ledger and shows nothing
          until premium, loss or expense accounts carry entries.
        </p>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Expected account prefixes: 41xx written premium, 42xx earned premium, 43xx ceded premium,
          44xx investment income, 51xx loss and LAE, 52xx commission, 53xx underwriting expense.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  const { stats, priorPeriod, periodsCovered, combinedSparkline, lossRatioSparkline } = model;
  const combinedPrior =
    priorPeriod && priorPeriod.combined !== null
      ? `Prior period ${priorPeriod.month}: ${formatPercent(priorPeriod.combined, 2)}`
      : 'No prior period to compare';

  return (
    <main className="p-6 space-y-6" role="main">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Insurance Dashboard"
          purpose="Underwriting performance derived from posted premium, loss and expense accounts."
        />
        {periodsCovered && (
          <span className="text-xs text-[var(--text-muted)] tabular-nums">
            Periods {periodsCovered.first} – {periodsCovered.last}
          </span>
        )}
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIValue
          label="Combined Ratio"
          value={ratio(stats.combinedRatio)}
          changeLabel={combinedPrior}
          sparklineData={[...combinedSparkline]}
        />
        <KPIValue
          label="Gross Written Premium"
          value={fmt.currency0(stats.grossWrittenPremium)}
          changeLabel="Credit-normal total of 41xx accounts"
        />
        <KPIValue
          label="Net Written Premium"
          value={stats.netWrittenPremium === null ? '—' : fmt.currency0(stats.netWrittenPremium)}
          changeLabel={
            stats.netWrittenPremium === null
              ? 'Requires posted reinsurance cessions (43xx)'
              : `Gross less ceded ${fmt.currency0(stats.cededPremium)}`
          }
        />
        <KPIValue
          label="Loss Ratio"
          value={ratio(stats.lossRatio)}
          changeLabel={
            priorPeriod
              ? `Prior period ${priorPeriod.month}: ${formatPercent(priorPeriod.lossRatio, 2)}`
              : 'No prior period to compare'
          }
          sparklineData={[...lossRatioSparkline]}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Underwriting Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Loss Ratio</span>
                <span className="font-mono tabular-nums">{ratio(stats.lossRatio)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Expense Ratio</span>
                <span className="font-mono tabular-nums">{ratio(stats.expenseRatio)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Combined Ratio</span>
                <span className="font-mono tabular-nums">{ratio(stats.combinedRatio)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Underwriting Income</span>
                <span className="font-mono tabular-nums">
                  {fmt.currency0(stats.underwritingIncome)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Premium &amp; Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Earned Premium (42xx)</span>
                <span className="font-mono tabular-nums">{fmt.currency0(stats.earnedPremium)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Loss &amp; LAE (51xx)</span>
                <span className="font-mono tabular-nums">{fmt.currency0(stats.lossExpense)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">
                  Commission &amp; UW Expense (52xx+53xx)
                </span>
                <span className="font-mono tabular-nums">{fmt.currency0(stats.expenseTotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Ceded Premium (43xx)</span>
                <span className="font-mono tabular-nums">
                  {stats.cededPremium === null ? '—' : fmt.currency0(stats.cededPremium)}
                </span>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-4">
              Ceded premium is reported separately and never counted as an expense. Investment
              income (44xx) is excluded from every underwriting figure above.
            </p>
          </CardContent>
        </Card>
      </section>

      <section
        aria-labelledby="sector-insurance-not-derivable"
        className="text-xs text-[var(--text-muted)] space-y-1"
      >
        <h2 id="sector-insurance-not-derivable" className="font-semibold">
          Not derivable from this ledger
        </h2>
        <p>
          Retention rate and Solvency II ratio — no capital model or cession structure exists in a
          general ledger. Policy count — a ledger records amounts, not contracts. Average claim size
          — postings are not one-per-claim, so dividing losses by posting count would mislabel GL
          lines as claims.
        </p>
      </section>
    </main>
  );
}
