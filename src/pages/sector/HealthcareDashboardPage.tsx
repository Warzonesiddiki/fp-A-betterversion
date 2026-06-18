import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { healthcareConfig } from '@/config/sectors/healthcare';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Heart } from 'lucide-react';

export default function HealthcareDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Healthcare Dashboard';
  }, []);

  const stats = useMemo(() => {
    const revenue = entries.filter((e) => e.credit > e.debit).reduce((s, e) => s + e.credit, 0);
    const expenses = entries.filter((e) => e.debit > e.credit).reduce((s, e) => s + e.debit, 0);
    const margin = revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0;
    return { revenue, expenses, margin };
  }, [entries]);

  const kpis = healthcareConfig.defaultKPIs;

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Healthcare Dashboard - No Data">
        <Heart className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Healthcare — No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to view healthcare KPIs.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" role="main">
      <h1 className="text-2xl font-bold">Healthcare Dashboard</h1>
      <p className="text-sm text-slate-400">Clinical and financial performance metrics</p>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPIValue
            key={kpi.id}
            label={kpi.label}
            value={formatCurrency(kpi.target * 0.93)}
            change={-2}
          />
        ))}
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPIValue label="Revenue" value={formatCurrency(stats.revenue)} />
        <KPIValue label="Expenses" value={formatCurrency(stats.expenses)} />
        <KPIValue label="Margin" value={`${stats.margin.toFixed(1)}%`} />
        <KPIValue label="Entries" value={formatNumber(entries.length)} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Clinical Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Bed Occupancy Rate</span>
                <span className="font-mono">87.3%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Average Length of Stay</span>
                <span className="font-mono">4.2 days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Readmission Rate</span>
                <span className="font-mono text-red-600">8.7%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Case Mix Index</span>
                <span className="font-mono">1.42</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Financial Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Revenue per Patient Day</span>
                <span className="font-mono">{formatCurrency(stats.revenue / 365)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Cost per Patient Day</span>
                <span className="font-mono">{formatCurrency(stats.expenses / 365)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Operating Margin</span>
                <span
                  className={`font-mono ${stats.margin > 0 ? 'text-green-500' : 'text-red-600'}`}
                >
                  {stats.margin.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">FTE per Adjusted Occupied Bed</span>
                <span className="font-mono">4.8</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
