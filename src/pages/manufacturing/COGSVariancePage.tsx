import { useEffect, useMemo, useState } from 'react';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPICard } from '@/components/dashboard/KPICard';
import { ChartWrapper } from '@/components/analytics/ChartWrapper';
import { COGSVarianceEngine } from '@/engines/COGSVarianceEngine';
import { HelpPanel } from '@/components/ui/HelpPanel';
import { PAGE_HELP } from '../_docs';
import { Activity, Factory, Package } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { PageHeader } from '@/components/ui/PageHeader';

/**
 * Placeholder card for a standard-derived figure the ledger cannot produce.
 * The GL has no standard-cost layer, so until standards are posted every
 * variance renders an em dash plus this disclosure — never an estimate.
 */
function NullVarianceCard({ title }: { title: string }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-[var(--text-muted)] truncate">{title}</div>
      <div className="text-2xl font-bold tabular-nums" aria-label={`${title}: not derivable`}>
        —
      </div>
      <div className="text-xs mt-1 text-[var(--text-muted)]">Standard-cost layer required</div>
    </Card>
  );
}

export default function COGSVariancePage() {
  const fmtCurrency = useCurrencyFormatter();
  const { pathname } = useLocation();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — COGS Variance';
  }, []);

  const { entries } = useGLStore();
  const navigate = useNavigate();

  // The engine returns `null` for every standard-derived figure until a
  // standard cost is posted; no page-side arithmetic re-derives them here.
  const metrics = useMemo(
    () => (entries.length === 0 ? null : COGSVarianceEngine.calculateGLVariances(entries)),
    [entries]
  );

  if (!metrics) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <Activity className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Manufacturing Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Import GL data with accounts starting with 5xx (Cost of Goods Sold).
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <PageHeader
          icon={<Factory className="h-6 w-6 text-orange-400" />}
          title="COGS Variance Analysis"
          purpose="Standard Costing & Production Efficiency"
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
          <Button variant="outline" size="sm">
            Production Orders
          </Button>
          <Button size="sm">Update Standards</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Actual COGS" value={metrics.actualCOGS} format="currency" />
        {metrics.totalVariance === null ? (
          <NullVarianceCard title="Total Variance" />
        ) : (
          <KPICard
            title="Total Variance"
            value={metrics.totalVariance}
            format="currency"
            trend={metrics.totalVariance >= 0 ? 'up' : 'down'}
            change={metrics.variancePercent ?? undefined}
          />
        )}
        {metrics.breakdown?.[0] ? (
          <KPICard
            title="Purchase Price Variance"
            value={metrics.breakdown[0].value}
            format="currency"
            trend={metrics.breakdown[0].value >= 0 ? 'up' : 'down'}
          />
        ) : (
          <NullVarianceCard title="Purchase Price Variance" />
        )}
        {metrics.breakdown?.[1] ? (
          <KPICard
            title="Usage Variance"
            value={metrics.breakdown[1].value}
            format="currency"
            trend={metrics.breakdown[1].value >= 0 ? 'up' : 'down'}
          />
        ) : (
          <NullVarianceCard title="Usage Variance" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartWrapper
            title="Variance Decomposition"
            subtitle="Analysis of COGS variance by driver"
            height={400}
          >
            {metrics.breakdown ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={metrics.breakdown} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                    stroke="#334155"
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#1e293b' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0]!.payload;
                        return (
                          <div className="bg-slate-900 border border-slate-800 p-2 rounded shadow-xl">
                            <div className="text-xs font-bold text-slate-400 uppercase">
                              {data.name}
                            </div>
                            <div
                              className={`text-sm font-bold ${data.value >= 0 ? 'text-green-400' : 'text-red-400'}`}
                            >
                              {fmtCurrency.custom()(data.value)}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {metrics.breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[350px] items-center justify-center px-6 text-center">
                <p className="text-sm text-[var(--text-muted)]" role="note">
                  Standard-cost layer required. The general ledger records only actual COGS (5xxx
                  postings); without a posted standard cost and posted price / usage / efficiency /
                  volume components there is no baseline to decompose, so the breakdown is disclosed
                  as unavailable rather than estimated.
                </p>
              </div>
            )}
          </ChartWrapper>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-400" />
                Inventory Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--text-muted)]" role="note">
                No inventory impact figures are shown: revaluation reserve and obsolescence risk are
                not derivable from the general ledger alone, and this workspace has no inventory
                valuation subledger feed. Figures appear here once valuation postings exist.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <HelpPanel
        title={PAGE_HELP[pathname]?.title || 'COGS Variance Help'}
        sections={PAGE_HELP[pathname]?.sections || []}
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </div>
  );
}
