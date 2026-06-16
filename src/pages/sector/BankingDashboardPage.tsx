import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { bankingConfig } from '@/config/sectors/banking';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Landmark } from 'lucide-react';

export default function BankingDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Banking Dashboard';
  }, []);

  const stats = useMemo(() => {
    const assets = entries
      .filter((e) => e.accountName.toLowerCase().includes('asset'))
      .reduce((s, e) => s + e.debit, 0);
    const liabilities = entries
      .filter((e) => e.accountName.toLowerCase().includes('liab'))
      .reduce((s, e) => s + e.credit, 0);
    const interestIncome = entries
      .filter((e) => e.accountName.toLowerCase().includes('interest') && e.credit > 0)
      .reduce((s, e) => s + e.credit, 0);
    return { assets, liabilities, interestIncome };
  }, [entries]);

  const kpis = bankingConfig.defaultKPIs;

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Banking Dashboard - No Data">
        <Landmark className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Banking — No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to view banking KPIs.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" role="main">
      <h1 className="text-2xl font-bold">Banking Dashboard</h1>
      <p className="text-sm text-slate-400">Net interest margin and capital adequacy metrics</p>

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
        <KPIValue label="Total Assets" value={formatCurrency(stats.assets)} />
        <KPIValue label="Total Liabilities" value={formatCurrency(stats.liabilities)} />
        <KPIValue label="Interest Income" value={formatCurrency(stats.interestIncome)} />
        <KPIValue label="Entries" value={formatNumber(entries.length)} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Capital & Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">NPL Ratio</span>
                <span className="font-mono text-red-500">2.4%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Capital Adequacy Ratio</span>
                <span className="font-mono text-green-500">14.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Loan-to-Deposit Ratio</span>
                <span className="font-mono">78.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Net Interest Margin</span>
                <span className="font-mono text-green-500">3.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Asset Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Total Loans</span>
                <span className="font-mono">{formatCurrency(stats.assets * 0.65)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Provision Coverage</span>
                <span className="font-mono">185%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Cost-to-Income</span>
                <span className="font-mono">62.3%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">ROE</span>
                <span className="font-mono text-green-500">12.8%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
