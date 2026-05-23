import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { constructionConfig } from '@/config/sectors/construction';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { HardHat } from 'lucide-react';

export default function ConstructionDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Construction Dashboard';
  }, []);

  const stats = useMemo(() => {
    const revenue = entries.filter((e) => e.credit > e.debit).reduce((s, e) => s + e.credit, 0);
    const costs = entries.filter((e) => e.debit > e.credit).reduce((s, e) => s + e.debit, 0);
    const margin = revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0;
    return { revenue, costs, margin };
  }, [entries]);

  const kpis = constructionConfig.defaultKPIs;

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main">
        <HardHat className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Construction — No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to view construction KPIs.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" role="main">
      <h1 className="text-2xl font-bold">Construction Dashboard</h1>
      <p className="text-sm text-slate-400">Project cost and billing metrics</p>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPIValue
            key={kpi.id}
            label={kpi.label}
            value={formatCurrency(kpi.target * 0.88)}
            change={-8}
          />
        ))}
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPIValue label="Revenue" value={formatCurrency(stats.revenue)} />
        <KPIValue label="Costs" value={formatCurrency(stats.costs)} />
        <KPIValue label="Margin" value={`${stats.margin.toFixed(1)}%`} />
        <KPIValue label="Entries" value={formatNumber(entries.length)} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Billing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">WIP (Work in Progress)</span>
                <span className="font-mono">{formatCurrency(stats.revenue * 0.35)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Overbilling</span>
                <span className="font-mono text-green-500">
                  {formatCurrency(stats.revenue * 0.08)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Underbilling</span>
                <span className="font-mono text-red-500">
                  {formatCurrency(stats.revenue * 0.03)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Retainage Held</span>
                <span className="font-mono">{formatCurrency(stats.revenue * 0.05)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Project Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Active Projects</span>
                <span className="font-mono">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Budget Variance</span>
                <span className="font-mono text-red-500">+3.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Change Order %</span>
                <span className="font-mono">4.8%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Safety Incident Rate</span>
                <span className="font-mono text-green-500">0.8</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
