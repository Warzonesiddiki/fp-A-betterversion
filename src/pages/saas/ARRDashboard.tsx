import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPICard } from '@/components/dashboard/KPICard';
import { ChartWrapper } from '@/components/analytics/ChartWrapper';
import { SaaSMetricsEngine } from '@/engines/SaaSMetricsEngine';
import { HelpPanel } from '@/components/ui/HelpPanel';
import { EmptyState } from '@/components/ui/EmptyState';
import { PAGE_HELP } from '../_docs';
import { TrendingUp } from 'lucide-react';
import {
  addMoney,
  divideMoney,
  multiplyMoney,
  roundTo,
  subtractMoney,
  sumMoney,
} from '@/utils/money';
import { PageHeader } from '@/components/ui/PageHeader';

// W-FAB remediation (phase0-exit amendment item 3). The previous revision:
//   - rendered hardcoded trend deltas (`change={12.4}` / `change={2.1}`,
//     displayed by KPICard as "+12.4% vs prior") with no prior period anywhere;
//   - rendered Net Revenue Retention and Quick Ratio as `metrics.nrr ?? 0` /
//     `metrics.quickRatio ?? 0`, i.e. presented a not-derivable metric as a
//     measured 0.
// Now the month-over-month delta is derived from real monthly buckets of the
// 41xx subscription accounts and only shown when a prior month exists; NRR and
// Quick Ratio are disclosure cards (they need cohort/billing feeds the GL does
// not carry), never fabricated numbers.

export default function ARRDashboard() {
  const { pathname } = useLocation();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — ARR Dashboard';
  }, []);

  const { entries } = useGLStore();
  const navigate = useNavigate();

  const metrics = useMemo(() => {
    if (entries.length === 0) return null;

    // Subscription revenue accounts (41xx in this chart of accounts).
    const subscriptionRevenue = entries.filter((e) => e.accountCode?.startsWith('41'));

    // Monthly buckets of credit-minus-debit give an honest period basis: the
    // latest posted month is the current MRR, the prior month grounds the
    // delta. ARR stays the documented MRR × 12 conversion — labeled as such.
    const byMonth = new Map<string, number>();
    for (const e of subscriptionRevenue) {
      const month = e.period || e.date.slice(0, 7);
      if (!month) continue;
      byMonth.set(
        month,
        roundTo(addMoney(byMonth.get(month) ?? 0, subtractMoney(e.credit, e.debit)), 2)
      );
    }
    const months = Array.from(byMonth.entries()).sort(([a], [b]) => a.localeCompare(b));
    const currentMRR =
      months.length > 0
        ? months[months.length - 1]![1]
        : roundTo(sumMoney(subscriptionRevenue.map((e) => subtractMoney(e.credit, e.debit))), 2);
    const arr = SaaSMetricsEngine.calculateARR(currentMRR);

    let momChangePct: number | undefined;
    if (months.length >= 2) {
      const prior = months[months.length - 2]![1];
      if (prior > 0) {
        momChangePct = roundTo(
          multiplyMoney(divideMoney(subtractMoney(currentMRR, prior), prior), 100),
          1
        );
      }
    }

    return { arr, mrr: currentMRR, momChangePct };
  }, [entries]);

  if (!metrics) {
    // K30 four-states: honest empty state under the page-level h1. No demo
    // ARR figures are invented here.
    return (
      <div className="p-6 space-y-6 max-w-7xl" aria-labelledby="arr-heading">
        <PageHeader
          title="ARR Dashboard"
          titleId="arr-heading"
          purpose="SaaS recurring revenue and growth efficiency."
        />
        <EmptyState
          variant="no-data"
          title="No SaaS Data Found"
          description="We couldn't find any subscription revenue in your GL. Import data with account codes starting with 41xx."
          action={<Button onClick={() => navigate('/data/gl-upload')}>Import GL Data</Button>}
        />
      </div>
    );
  }

  const trend =
    metrics.momChangePct === undefined ? undefined : metrics.momChangePct >= 0 ? 'up' : 'down';

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <PageHeader
          icon={<TrendingUp className="h-6 w-6 text-emerald-400" />}
          title="ARR Dashboard"
          purpose="SaaS recurring revenue & growth efficiency. MRR is the latest posted month of 41xx subscription revenue; ARR applies the documented MRR × 12 conversion."
          actions={
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-full text-[var(--text-muted)] hover:text-white transition-colors ml-4"
              aria-label="Help"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          }
        />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/saas/cohort')}>
            Cohort Analysis
          </Button>
          <Button size="sm" onClick={() => navigate('/forecasts/create')}>
            Forecast ARR
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="arr-kpis">
        <KPICard
          title="Annual Recurring Revenue (MRR × 12)"
          value={metrics.arr}
          format="currency"
          trend={trend}
          change={metrics.momChangePct}
        />
        <KPICard
          title="Monthly Recurring Revenue (latest posted month)"
          value={metrics.mrr}
          format="currency"
          trend={trend}
          change={metrics.momChangePct}
        />
        {/* Not derivable from the GL: disclosed instead of rendered as 0. */}
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Net Revenue Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-[var(--text-muted)]">
              Needs expansion and contraction by customer cohort — data a general ledger does not
              carry. Disclosed as unavailable rather than shown as a measured 0%.
            </p>
          </CardContent>
        </Card>
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Quick Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-[var(--text-muted)]">
              Needs new plus recovered MRR versus churned and contracted MRR per period. It is not
              derivable from journal postings and is disclosed rather than estimated.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartWrapper
            title="MRR Waterfall"
            subtitle="Movement from opening to closing MRR for current period"
            height={400}
          >
            <WaterfallDisclosure />
          </ChartWrapper>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                Growth Efficiency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[var(--text-muted)]">
                Magic Number, LTV:CAC, and Payback Period require a subscription billing system and
                a sales/marketing spend ledger. They are not derivable from the general ledger and
                are disclosed as not available rather than estimated.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                Retention Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[var(--text-muted)]">
                Gross Churn and Net Churn require a subscription / customer feed (logo counts,
                contraction amounts, churn events). They are not derivable from the general ledger.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <HelpPanel
        title={PAGE_HELP[pathname]?.title || 'ARR Dashboard Help'}
        sections={PAGE_HELP[pathname]?.sections || []}
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </div>
  );
}

/** The waterfall needs cohort movements no GL carries; say so instead of plotting nothing-as-data. */
function WaterfallDisclosure() {
  return (
    <div className="text-sm text-[var(--text-muted)] text-center py-8">
      Per-period MRR movement (opening → new → expansion → contraction → churn → closing) requires a
      subscription / cohort feed that a general ledger does not carry. The aggregate ARR and MRR are
      reported above from the real GL.
    </div>
  );
}
