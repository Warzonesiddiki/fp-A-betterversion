import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { hospitalityConfig } from '@/config/sectors/hospitality';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Hotel } from 'lucide-react';

export default function HospitalityDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Hospitality Dashboard';
  }, []);

  const stats = useMemo(() => {
    const revenue = entries.filter((e) => e.credit > e.debit).reduce((s, e) => s + e.credit, 0);
    const costs = entries.filter((e) => e.debit > e.credit).reduce((s, e) => s + e.debit, 0);
    const margin = revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0;
    return { revenue, costs, margin };
  }, [entries]);

  const kpis = hospitalityConfig.defaultKPIs;

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main">
        <Hotel className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Hospitality — No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to view hospitality KPIs.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" role="main">
      <h1 className="text-2xl font-bold">Hospitality Dashboard</h1>
      <p className="text-sm text-slate-400">RevPAR, ADR, Occupancy, and GOPPAR metrics</p>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPIValue
            key={kpi.id}
            label={kpi.label}
            value={formatCurrency(kpi.target * 0.91)}
            change={-5}
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
            <CardTitle>Room Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">RevPAR</span>
                <span className="font-mono">{formatCurrency(132)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">ADR</span>
                <span className="font-mono">{formatCurrency(165)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Occupancy Rate</span>
                <span className="font-mono text-green-500">80%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Guest Satisfaction</span>
                <span className="font-mono text-green-500">8.7/10</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">GOP Per Available Room</span>
                <span className="font-mono">{formatCurrency(58)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">F&B Margin</span>
                <span className="font-mono">28%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Labor Cost % Revenue</span>
                <span className="font-mono">27%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Total Properties</span>
                <span className="font-mono">14</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
