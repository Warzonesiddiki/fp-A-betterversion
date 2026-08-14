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
import { Activity, Factory, Package, AlertCircle } from 'lucide-react';
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

export default function COGSVariancePage() {
  const fmtCurrency = useCurrencyFormatter();
  const { pathname } = useLocation();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — COGS Variance';
  }, []);

  const { entries } = useGLStore();
  const navigate = useNavigate();

  const metrics = useMemo(() => {
    if (entries.length === 0) return null;
    const res = COGSVarianceEngine.calculateGLVariances(entries);
    return {
      ...res,
      variancePercent: (res.totalVariance / res.standardCOGS) * 100,
    };
  }, [entries]);

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
        <KPICard
          title="Total Variance"
          value={metrics.totalVariance}
          format="currency"
          trend={metrics.totalVariance >= 0 ? 'up' : 'down'}
          change={metrics.variancePercent}
        />
        <KPICard
          title="Purchase Price Variance"
          value={metrics.breakdown[0]!.value}
          format="currency"
          trend={metrics.breakdown[0]!.value >= 0 ? 'up' : 'down'}
        />
        <KPICard
          title="Usage Variance"
          value={metrics.breakdown[1]!.value}
          format="currency"
          trend={metrics.breakdown[1]!.value >= 0 ? 'up' : 'down'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartWrapper
            title="Variance Decomposition"
            subtitle="Analysis of COGS variance by driver"
            height={400}
          >
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
          </ChartWrapper>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                Material Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="text-xs font-bold text-red-400">Steel Scrapped: +12%</div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Abnormal waste detected in Production Line 3.
                </p>
              </div>
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="text-xs font-bold text-yellow-400">Copper Price: +8%</div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Market price index trending above standard.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-400" />
                Inventory Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">Revaluation Reserve</span>
                <span className="font-bold">$124,500</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">Obsolescence Risk</span>
                <span className="font-bold text-red-400">$42,000</span>
              </div>
              <div className="pt-2">
                <Button variant="ghost" size="sm" className="w-full text-blue-400">
                  Adjust Inventory
                </Button>
              </div>
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
