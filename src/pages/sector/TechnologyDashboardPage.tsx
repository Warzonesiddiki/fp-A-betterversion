import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Cpu } from 'lucide-react';
import {
  compareMoney,
  divideMoney,
  multiplyMoney,
  roundTo,
  subtractMoney,
  sumMoney,
  toDecimal,
} from '@/utils/money';
import { formatPercent } from '@/utils/financialFormatting';
import { PageHeader } from '@/components/ui/PageHeader';

/**
 * Technology / SaaS dashboard — vertical truthfulness sweep (wave 2).
 *
 * The previous version rendered two fabrication layers on top of real GL
 * stats: config-driven tiles whose values were the configured target times
 * a magic factor plus an invented negative change prop, and two cards of
 * hand-typed SaaS literals (a fictional ARR figure, NRR, logo churn, gross
 * margin, LTV/CAC multiple, magic number, quick ratio and Rule-of-40
 * score).
 *
 * None of those are derivable in this app: `SaaSMetricsEngine` consumes MRR
 * by customer, renewals and sales-and-marketing spend, and no store carries
 * subscription-billing or customer-success data — the same conclusion the
 * `saas/ARRDashboard` reached when it disclosed its unit-economics gaps.
 * This page keeps only what the posted general ledger supports (revenue,
 * costs, margin, entry count) and names the missing feeds instead of
 * estimating them.
 */

export default function TechnologyDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Technology Dashboard';
  }, []);

  const stats = useMemo(() => {
    // revenue: credit-side amount when credit > debit (a credit-normal
    // account, typically revenue / income / liability).
    const revenue = roundTo(
      sumMoney(entries.filter((e) => compareMoney(e.credit, e.debit) > 0).map((e) => e.credit)),
      2
    );
    // costs: debit-side amount when debit > credit (a debit-normal
    // account, typically expense / asset).
    const costs = roundTo(
      sumMoney(entries.filter((e) => compareMoney(e.debit, e.credit) > 0).map((e) => e.debit)),
      2
    );
    // margin: dimensionless ratio. numerator is the currency difference
    // (revenue − costs); denominator is revenue. result is a percentage.
    const margin =
      revenue > 0
        ? roundTo(
            multiplyMoney(divideMoney(subtractMoney(revenue, costs), toDecimal(revenue)), 100),
            2
          )
        : 0;
    return { revenue, costs, margin };
  }, [entries]);

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Technology Dashboard - No Data">
        <Cpu className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">Technology — No Data</h1>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to view posted results.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" role="main">
      <PageHeader
        title="Technology / SaaS Dashboard"
        purpose="Posted revenue, costs and margin from the general ledger. Subscription metrics require a billing feed the ledger does not carry."
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIValue label="Revenue" value={formatCurrency(stats.revenue)} />
        <KPIValue label="Costs" value={formatCurrency(stats.costs)} />
        <KPIValue label="Margin" value={`${formatPercent(stats.margin, 1)}`} />
        <KPIValue label="Entries" value={formatNumber(entries.length)} />
      </section>

      <section
        aria-labelledby="technology-not-derivable"
        className="text-xs text-[var(--text-muted)] space-y-1"
      >
        <h2 id="technology-not-derivable" className="font-semibold">
          Not derivable from this ledger
        </h2>
        <p>
          ARR, net revenue retention, logo churn, LTV/CAC, magic number, quick ratio and Rule of 40
          — computing them requires contract-level billing data (MRR by customer, renewals,
          downgrades) plus attributed sales-and-marketing spend. A general ledger records posted
          amounts only, so these are omitted rather than estimated.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Scope of this page</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--text-muted)]">
            Revenue is the credit-side total of accounts whose credits exceed debits; costs are the
            matching debit-side total; margin is (revenue − costs) ÷ revenue for whatever period the
            postings cover. Connect a subscription-billing system to see recurring-revenue metrics.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
