import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { retailConfig } from '@/config/sectors/retail';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { ShoppingCart } from 'lucide-react';

export default function RetailDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Retail Dashboard';
  }, []);

  const stats = useMemo(() => {
    const revenue = entries.filter((e) => e.credit > e.debit).reduce((s, e) => s + e.credit, 0);
    const costs = entries.filter((e) => e.debit > e.credit).reduce((s, e) => s + e.debit, 0);
    const margin = revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0;
    return { revenue, costs, margin };
  }, [entries]);

  const kpis = retailConfig.defaultKPIs;

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Retail Dashboard - No Data">
        <ShoppingCart className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Retail — No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to view retail KPIs.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" role="main">
      <h1 className="text-2xl font-bold">Retail Dashboard</h1>
      <p className="text-sm text-slate-400">
        Same-store sales, conversion, ATV, and inventory metrics
      </p>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPIValue
            key={kpi.id}
            label={kpi.label}
            value={formatCurrency(kpi.target * 0.89)}
            change={-6}
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
            <CardTitle>Sales Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Same-Store Sales Growth</span>
                <span className="font-mono text-green-500">4.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Conversion Rate</span>
                <span className="font-mono">3.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Average Ticket Value</span>
                <span className="font-mono">{formatCurrency(78)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Basket Size</span>
                <span className="font-mono">2.9 items</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Inventory & Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">GMROI</span>
                <span className="font-mono text-green-500">2.3x</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Inventory Shrink</span>
                <span className="font-mono text-red-500">1.4%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Sales per Sq. Ft.</span>
                <span className="font-mono">{formatCurrency(365)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Inventory Turnover</span>
                <span className="font-mono">5.6x</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
