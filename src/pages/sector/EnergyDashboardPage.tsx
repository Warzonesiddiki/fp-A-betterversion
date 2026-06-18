import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { energyConfig } from '@/config/sectors/energy';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Zap } from 'lucide-react';

export default function EnergyDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Energy Dashboard';
  }, []);

  const stats = useMemo(() => {
    const revenue = entries.filter((e) => e.credit > e.debit).reduce((s, e) => s + e.credit, 0);
    const capex = entries
      .filter(
        (e) =>
          e.accountName.toLowerCase().includes('capital') ||
          e.accountName.toLowerCase().includes('capex')
      )
      .reduce((s, e) => s + e.debit, 0);
    const opex = entries
      .filter((e) => e.debit > e.credit && !e.accountName.toLowerCase().includes('capital'))
      .reduce((s, e) => s + e.debit, 0);
    return { revenue, capex, opex };
  }, [entries]);

  const kpis = energyConfig.defaultKPIs;

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Energy Dashboard - No Data">
        <Zap className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Energy — No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to view energy KPIs.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" role="main">
      <h1 className="text-2xl font-bold">Energy Dashboard</h1>
      <p className="text-sm text-slate-400">Production, reserves, and emissions metrics</p>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPIValue
            key={kpi.id}
            label={kpi.label}
            value={formatCurrency(kpi.target * 0.92)}
            change={-3}
          />
        ))}
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPIValue label="Revenue" value={formatCurrency(stats.revenue)} />
        <KPIValue label="CapEx" value={formatCurrency(stats.capex)} />
        <KPIValue label="OpEx" value={formatCurrency(stats.opex)} />
        <KPIValue label="Entries" value={formatNumber(entries.length)} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Production & Reserves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Daily Production</span>
                <span className="font-mono">12,500 BOE</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Proved Reserves</span>
                <span className="font-mono">45.2M BOE</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Reserve Life Index</span>
                <span className="font-mono">9.8 years</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Lifting Cost</span>
                <span className="font-mono">$12.40/BOE</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Emissions & ESG</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Scope 1 Emissions</span>
                <span className="font-mono">45,200 tCO2e</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Scope 2 Emissions</span>
                <span className="font-mono">12,800 tCO2e</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Carbon Intensity</span>
                <span className="font-mono">0.42 tCO2e/BOE</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Renewable %</span>
                <span className="font-mono text-green-600">18.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
