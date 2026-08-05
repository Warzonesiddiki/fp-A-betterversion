import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { technologyConfig } from '@/config/sectors/technology';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Cpu } from 'lucide-react';
import { sumMoney, roundTo } from '@/utils/money';
import { formatPercent } from '@/utils/financialFormatting';

export default function TechnologyDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Technology Dashboard';
  }, []);

  const stats = useMemo(() => {
    const revenue = roundTo(
      sumMoney(entries.filter((e) => e.credit > e.debit).map((e) => e.credit)),
      2
    );
    const costs = roundTo(
      sumMoney(entries.filter((e) => e.debit > e.credit).map((e) => e.debit)),
      2
    );
    const margin = revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0;
    return { revenue, costs, margin };
  }, [entries]);

  const kpis = technologyConfig.defaultKPIs;

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Technology Dashboard - No Data">
        <Cpu className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Technology — No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to view SaaS metrics.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" role="main">
      <h1 className="text-2xl font-bold">Technology / SaaS Dashboard</h1>
      <p className="text-sm text-slate-400">ARR, NRR, churn, LTV/CAC, and Rule of 40</p>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPIValue
            key={kpi.id}
            label={kpi.label}
            value={formatCurrency(kpi.target * 0.87)}
            change={-7}
          />
        ))}
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPIValue label="Revenue" value={formatCurrency(stats.revenue)} />
        <KPIValue label="Costs" value={formatCurrency(stats.costs)} />
        <KPIValue label="Margin" value={`${formatPercent(stats.margin, 1)}`} />
        <KPIValue label="Entries" value={formatNumber(entries.length)} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>SaaS Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">ARR</span>
                <span className="font-mono">{formatCurrency(43500000)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Net Revenue Retention</span>
                <span className="font-mono text-green-600">115%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Logo Churn Rate</span>
                <span className="font-mono text-red-600">5.8%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Gross Margin</span>
                <span className="font-mono text-green-600">72%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Growth & Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">LTV/CAC Ratio</span>
                <span className="font-mono text-green-600">2.8x</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Magic Number</span>
                <span className="font-mono">0.68</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Quick Ratio</span>
                <span className="font-mono">3.5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Rule of 40</span>
                <span className="font-mono text-green-600">38</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
