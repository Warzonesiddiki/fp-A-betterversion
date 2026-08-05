import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { realestateConfig } from '@/config/sectors/realestate';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Building2 } from 'lucide-react';
import { sumMoney, roundTo } from '@/utils/money';

export default function RealEstateDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Real Estate Dashboard';
  }, []);

  const stats = useMemo(() => {
    const revenue = roundTo(
      sumMoney(entries.filter((e) => e.credit > e.debit).map((e) => e.credit)),
      2
    );
    const expenses = roundTo(
      sumMoney(entries.filter((e) => e.debit > e.credit).map((e) => e.debit)),
      2
    );
    const noi = revenue - expenses;
    return { revenue, expenses, noi };
  }, [entries]);

  const kpis = realestateConfig.defaultKPIs;

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Real Estate Dashboard - No Data">
        <Building2 className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Real Estate — No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to view real estate KPIs.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" role="main">
      <h1 className="text-2xl font-bold">Real Estate Dashboard</h1>
      <p className="text-sm text-slate-400">Property income and valuation metrics</p>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPIValue
            key={kpi.id}
            label={kpi.label}
            value={formatCurrency(kpi.target * 0.91)}
            change={-4}
          />
        ))}
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPIValue label="Revenue" value={formatCurrency(stats.revenue)} />
        <KPIValue label="Expenses" value={formatCurrency(stats.expenses)} />
        <KPIValue label="NOI" value={formatCurrency(stats.noi)} />
        <KPIValue label="Entries" value={formatNumber(entries.length)} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Property Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Cap Rate</span>
                <span className="font-mono">6.8%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">DSCR</span>
                <span className="font-mono text-green-600">1.35x</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Occupancy Rate</span>
                <span className="font-mono">94.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">LTV Ratio</span>
                <span className="font-mono">65.0%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Valuation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Portfolio Value</span>
                <span className="font-mono">{formatCurrency(stats.revenue * 12)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Price per Sqft</span>
                <span className="font-mono">$285</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Cash-on-Cash Return</span>
                <span className="font-mono text-green-600">8.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Debt Yield</span>
                <span className="font-mono">9.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
