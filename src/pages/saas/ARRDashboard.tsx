import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPICard } from '@/components/dashboard/KPICard';
import { ChartWrapper } from '@/components/analytics/ChartWrapper';
import { WaterfallChart } from '@/components/ui/WaterfallChart';
import { SaaSMetricsEngine } from '@/engines/SaaSMetricsEngine';
import { HelpPanel } from '@/components/ui/HelpPanel';
import { PAGE_HELP } from '../_docs';
import { BarChart4, TrendingUp, Users, RefreshCcw } from 'lucide-react';
import { subtractMoney, sumMoney, roundTo } from '@/utils/money';
import { PageHeader } from '@/components/ui/PageHeader';

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

    // Filter for subscription revenue accounts (41xx in this chart of
    // accounts). MRR is the credit-minus-debit of those entries; ARR is MRR
    // × 12 (a documented, not measured, conversion).
    const subscriptionRevenue = entries.filter((e) => e.accountCode?.startsWith('41'));
    const currentMRR = roundTo(
      sumMoney(subscriptionRevenue.map((e) => subtractMoney(e.credit, e.debit))),
      2
    );
    const arr = SaaSMetricsEngine.calculateARR(currentMRR);

    // NRR, Quick Ratio, and the per-period MRR waterfall require cohort and
    // churn data that a general ledger does not carry. They are disclosed as
    // not derivable rather than estimated. Only ARR and MRR are reported.
    return {
      arr,
      mrr: currentMRR,
      nrr: null as number | null,
      quickRatio: null as number | null,
      waterfall: [] as Array<{ label: string; value: number; isTotal?: boolean }>,
    };
  }, [entries]);

  if (!metrics) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <BarChart4 className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No SaaS Data Found</h2>
        <p className="text-[var(--text-muted)] mb-6">
          We couldn&apos;t find any subscription revenue in your GL. Import data with account codes
          starting with 41xx.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import GL Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <PageHeader
          icon={<TrendingUp className="h-6 w-6 text-emerald-400" />}
          title="ARR Dashboard"
          purpose="SaaS Recurring Revenue & Growth Efficiency"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Annual Recurring Revenue"
          value={metrics.arr}
          format="currency"
          trend="up"
          change={12.4}
        />
        <KPICard
          title="Monthly Recurring Revenue"
          value={metrics.mrr}
          format="currency"
          trend="up"
          change={2.1}
        />
        <KPICard
          title="Net Revenue Retention"
          value={metrics.nrr ?? 0}
          format="percent"
          trend="neutral"
          change={0}
        />
        <KPICard
          title="Quick Ratio"
          value={metrics.quickRatio ?? 0}
          format="number"
          trend="neutral"
          change={0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartWrapper
            title="MRR Waterfall"
            subtitle="Movement from opening to closing MRR for current period"
            height={400}
          >
            {metrics.waterfall.length > 0 ? (
              <WaterfallChart data={metrics.waterfall} height={350} />
            ) : (
              <div className="text-sm text-[var(--text-muted)] text-center py-8">
                Per-period MRR movement (opening → new → expansion → contraction → churn → closing)
                requires a subscription / cohort feed that a general ledger does not carry. The
                aggregate ARR and MRR are reported above from the real GL.
              </div>
            )}
          </ChartWrapper>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" />
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
                <RefreshCcw className="h-4 w-4 text-purple-400" />
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
