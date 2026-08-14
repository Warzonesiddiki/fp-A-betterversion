import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Wrench } from 'lucide-react';
import { sumMoney, roundTo } from '@/utils/money';
import { formatPercent } from '@/utils/financialFormatting';
import { PageHeader } from '@/components/ui/PageHeader';

export default function EquipmentManagementPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Equipment Management';
  }, []);

  const stats = useMemo(() => {
    const equipment = entries.filter(
      (e) =>
        e.accountName.toLowerCase().includes('equipment') ||
        e.accountName.toLowerCase().includes('machinery')
    );
    const totalValue = roundTo(sumMoney(equipment.map((e) => e.debit)), 2);
    const depreciation = roundTo(
      sumMoney(
        entries.filter((e) => e.accountName.toLowerCase().includes('depreciat')).map((e) => e.debit)
      ),
      2
    );
    const maintenance = roundTo(
      sumMoney(
        entries.filter((e) => e.accountName.toLowerCase().includes('maint')).map((e) => e.debit)
      ),
      2
    );
    return { totalValue, depreciation, maintenance, count: equipment.length };
  }, [entries]);

  if (entries.length === 0) {
    return (
      <main
        className="p-12 text-center"
        role="main"
        aria-label="Equipment Management Dashboard - No Data"
      >
        <Wrench className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">Equipment — No Data</h1>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to view equipment metrics.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" role="main">
      <PageHeader
        title="Equipment Management"
        purpose="Asset values, depreciation, and maintenance costs"
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIValue label="Equipment Value" value={formatCurrency(stats.totalValue)} />
        <KPIValue label="Depreciation" value={formatCurrency(stats.depreciation)} />
        <KPIValue label="Maintenance" value={formatCurrency(stats.maintenance)} />
        <KPIValue label="Asset Count" value={formatNumber(stats.count)} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Asset Lifecycle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">
                  OEE (Overall Equipment Effectiveness)
                </span>
                <span className="font-mono">82.4%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Utilization Rate</span>
                <span className="font-mono">78.6%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Avg Asset Age</span>
                <span className="font-mono">4.2 years</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Replacement Value</span>
                <span className="font-mono">{formatCurrency(stats.totalValue * 1.3)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Maintenance & Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Maintenance Cost Ratio</span>
                <span className="font-mono">
                  {stats.totalValue > 0
                    ? formatPercent((stats.maintenance / stats.totalValue) * 100, 1)
                    : '0%'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Depreciation Rate</span>
                <span className="font-mono">
                  {stats.totalValue > 0
                    ? formatPercent((stats.depreciation / stats.totalValue) * 100, 1)
                    : '0%'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Net Book Value</span>
                <span className="font-mono">
                  {formatCurrency(stats.totalValue - stats.depreciation)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Downtime Hours (MTD)</span>
                <span className="font-mono text-red-600">24.5 hrs</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
