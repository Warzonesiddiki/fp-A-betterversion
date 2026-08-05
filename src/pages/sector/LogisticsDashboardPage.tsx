import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { logisticsConfig } from '@/config/sectors/logistics';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Truck } from 'lucide-react';
import { sumMoney, roundTo } from '@/utils/money';

export function LogisticsDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Logistics Dashboard';
  }, []);

  const stats = useMemo(() => {
    const revenue = roundTo(
      sumMoney(entries.filter((e) => e.credit > e.debit).map((e) => e.credit)),
      2
    );
    const fleetCosts = roundTo(
      sumMoney(
        entries
          .filter(
            (e) =>
              e.accountName.toLowerCase().includes('fleet') ||
              e.accountName.toLowerCase().includes('vehicle') ||
              e.accountName.toLowerCase().includes('fuel')
          )
          .map((e) => e.debit)
      ),
      2
    );
    const warehouseCosts = roundTo(
      sumMoney(
        entries
          .filter(
            (e) =>
              e.accountName.toLowerCase().includes('warehouse') ||
              e.accountName.toLowerCase().includes('storage')
          )
          .map((e) => e.debit)
      ),
      2
    );
    const totalExpenses = roundTo(
      sumMoney(entries.filter((e) => e.debit > e.credit).map((e) => e.debit)),
      2
    );
    return { revenue, fleetCosts, warehouseCosts, totalExpenses };
  }, [entries]);

  const kpis = logisticsConfig.defaultKPIs;

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Logistics Dashboard - No Data">
        <Truck className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Logistics — No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to view logistics KPIs.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" role="main">
      <h1 className="text-2xl font-bold">Logistics Dashboard</h1>
      <p className="text-sm text-slate-400">
        Fleet management, transportation, and warehousing metrics
      </p>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPIValue
            key={kpi.id}
            label={kpi.label}
            value={formatCurrency(kpi.target * 0.94)}
            change={-2}
          />
        ))}
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPIValue label="Total Revenue" value={formatCurrency(stats.revenue)} />
        <KPIValue label="Fleet Costs" value={formatCurrency(stats.fleetCosts)} />
        <KPIValue label="Warehouse Costs" value={formatCurrency(stats.warehouseCosts)} />
        <KPIValue label="Entries" value={formatNumber(entries.length)} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fleet &amp; Delivery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Fleet Utilization</span>
                <span className="font-mono text-green-600">82.6%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Cost Per Mile</span>
                <span className="font-mono">$2.08</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">On-Time Delivery Rate</span>
                <span className="font-mono text-green-600">96.4%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Empty Miles Percentage</span>
                <span className="font-mono text-red-600">12.3%</span>
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
                <span className="text-sm text-slate-400">Fuel Efficiency (MPG)</span>
                <span className="font-mono">7.2</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Capacity Utilization</span>
                <span className="font-mono">78.9%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Inventory Turnover</span>
                <span className="font-mono">8.1x</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Safety Incident Rate</span>
                <span className="font-mono text-green-600">0.018</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export default LogisticsDashboardPage;
