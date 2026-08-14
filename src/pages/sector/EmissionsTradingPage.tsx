import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Leaf } from 'lucide-react';
import { sumMoney, roundTo } from '@/utils/money';
import { PageHeader } from '@/components/ui/PageHeader';

export default function EmissionsTradingPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Emissions Trading';
  }, []);

  const stats = useMemo(() => {
    const credits = entries.filter(
      (e) =>
        e.accountName.toLowerCase().includes('emission') ||
        e.accountName.toLowerCase().includes('carbon')
    );
    const creditValue = roundTo(sumMoney(credits.map((e) => e.debit)), 2);
    const offsetCost = roundTo(
      sumMoney(
        entries.filter((e) => e.accountName.toLowerCase().includes('offset')).map((e) => e.debit)
      ),
      2
    );
    return { creditValue, offsetCost, count: credits.length };
  }, [entries]);

  if (entries.length === 0) {
    return (
      <main
        className="p-12 text-center"
        role="main"
        aria-label="Emissions Trading Dashboard - No Data"
      >
        <Leaf className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">Emissions Trading — No Data</h1>
        <p className="text-[var(--text-muted)] mb-6">
          Import GL data to view carbon credit metrics.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" role="main">
      <PageHeader title="Emissions Trading" purpose="Carbon credits and offset tracking" />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIValue label="Credit Value" value={formatCurrency(stats.creditValue)} />
        <KPIValue label="Offset Cost" value={formatCurrency(stats.offsetCost)} />
        <KPIValue label="Credit Entries" value={formatNumber(stats.count)} />
        <KPIValue
          label="Net Position"
          value={formatCurrency(stats.creditValue - stats.offsetCost)}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Carbon Portfolio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Total Credits Held</span>
                <span className="font-mono">12,500 tCO2e</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Credits Retired</span>
                <span className="font-mono">8,200 tCO2e</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Credits Available</span>
                <span className="font-mono text-green-600">4,300 tCO2e</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Avg Price per Credit</span>
                <span className="font-mono">$28.50</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Regulatory Obligation</span>
                <span className="font-mono">15,000 tCO2e</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Compliance Rate</span>
                <span className="font-mono text-green-600">83.3%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Shortfall</span>
                <span className="font-mono text-red-600">2,500 tCO2e</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Estimated Penalty</span>
                <span className="font-mono text-red-600">$75,000</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
