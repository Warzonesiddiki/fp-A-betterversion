import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { manufacturingConfig } from '@/config/sectors/manufacturing';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Factory } from 'lucide-react';

export default function ManufacturingDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Manufacturing Dashboard';
  }, []);

  const stats = useMemo(() => {
    const revenue = entries.filter((e) => e.credit > e.debit).reduce((s, e) => s + e.credit, 0);
    const costs = entries.filter((e) => e.debit > e.credit).reduce((s, e) => s + e.debit, 0);
    const margin = revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0;
    return { revenue, costs, margin };
  }, [entries]);

  const kpis = manufacturingConfig.defaultKPIs;

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main">
        <Factory className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Manufacturing — No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to view manufacturing KPIs.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" role="main">
      <h1 className="text-2xl font-bold">Manufacturing Dashboard</h1>
      <p className="text-sm text-slate-400">OEE, scrap rate, yield, and cycle time metrics</p>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPIValue
            key={kpi.id}
            label={kpi.label}
            value={formatCurrency(kpi.target * 0.93)}
            change={-3}
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
            <CardTitle>Production Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">OEE</span>
                <span className="font-mono text-green-500">82%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Scrap Rate</span>
                <span className="font-mono text-green-500">2.3%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Cycle Time</span>
                <span className="font-mono">1.6 days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Yield Rate</span>
                <span className="font-mono text-green-500">93.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Capacity & Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Capacity Utilization</span>
                <span className="font-mono">77%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Inventory Turnover</span>
                <span className="font-mono">7.2x</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Unplanned Downtime</span>
                <span className="font-mono text-red-500">5.8%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Throughput</span>
                <span className="font-mono">115 units/hr</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
