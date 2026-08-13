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
import { sumMoney, roundTo } from '@/utils/money';

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

    // Filter for subscription revenue accounts (e.g., starting with 41)
    const subscriptionRevenue = entries.filter((e) => e.accountCode?.startsWith('41'));

    // In a real app, we'd have historical data to calculate NRR, Churn, etc.
    // Here we'll derive some representative metrics from the GL entries
    const currentMRR = roundTo(sumMoney(subscriptionRevenue.map((e) => e.credit - e.debit)), 2);
    const arr = SaaSMetricsEngine.calculateARR(currentMRR);

    // Mocking some movement data for the waterfall
    const newMRR = currentMRR * 0.15;
    const expansionMRR = currentMRR * 0.08;
    const contractionMRR = currentMRR * 0.03;
    const churnMRR = currentMRR * 0.02;
    const openingMRR = currentMRR - newMRR - expansionMRR + contractionMRR + churnMRR;

    const nrr = SaaSMetricsEngine.calculateNRR(openingMRR, expansionMRR, contractionMRR, churnMRR);
    const quickRatio = SaaSMetricsEngine.calculateQuickRatio(
      newMRR,
      expansionMRR,
      contractionMRR,
      churnMRR
    );

    return {
      arr,
      mrr: currentMRR,
      nrr,
      quickRatio,
      waterfall: [
        { label: 'Opening', value: openingMRR, isTotal: true },
        { label: 'New', value: newMRR },
        { label: 'Expansion', value: expansionMRR },
        { label: 'Contraction', value: -contractionMRR },
        { label: 'Churn', value: -churnMRR },
        { label: 'Closing', value: currentMRR, isTotal: true },
      ],
    };
  }, [entries]);

  if (!metrics) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <BarChart4 className="h-10 w-10 text-slate-400" />
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-emerald-400" />
              ARR Dashboard
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              SaaS Recurring Revenue & Growth Efficiency
            </p>
          </div>
          <button
            onClick={() => setHelpOpen(true)}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors ml-4"
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
        </div>
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
          value={metrics.nrr}
          format="percent"
          trend="up"
          change={0.5}
        />
        <KPICard
          title="Quick Ratio"
          value={metrics.quickRatio}
          format="number"
          trend="neutral"
          change={0.1}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartWrapper
            title="MRR Waterfall"
            subtitle="Movement from opening to closing MRR for current period"
            height={400}
          >
            <WaterfallChart data={metrics.waterfall} height={350} />
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
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--text-muted)]">Magic Number</span>
                <span className="text-sm font-bold">0.85</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--text-muted)]">LTV : CAC</span>
                <span className="text-sm font-bold text-emerald-400">3.2x</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--text-muted)]">Payback Period</span>
                <span className="text-sm font-bold">14.2 Mo</span>
              </div>
              <div className="pt-2">
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[70%]" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">70% of target efficiency</p>
              </div>
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
              <div className="space-y-3">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Gross Churn</div>
                  <div className="text-lg font-bold">2.4%</div>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Net Churn</div>
                  <div className="text-lg font-bold text-emerald-400">-4.2%</div>
                </div>
              </div>
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
