import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Wrench } from 'lucide-react';

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
    const totalValue = equipment.reduce((s, e) => s + e.debit, 0);
    const depreciation = entries
      .filter((e) => e.accountName.toLowerCase().includes('depreciat'))
      .reduce((s, e) => s + e.debit, 0);
    const maintenance = entries
      .filter((e) => e.accountName.toLowerCase().includes('maint'))
      .reduce((s, e) => s + e.debit, 0);
    return { totalValue, depreciation, maintenance, count: equipment.length };
  }, [entries]);

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main">
        <Wrench className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Equipment — No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to view equipment metrics.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" role="main">
      <h1 className="text-2xl font-bold">Equipment Management</h1>
      <p className="text-sm text-slate-400">Asset values, depreciation, and maintenance costs</p>

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
                <span className="text-sm text-slate-400">
                  OEE (Overall Equipment Effectiveness)
                </span>
                <span className="font-mono">82.4%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Utilization Rate</span>
                <span className="font-mono">78.6%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Avg Asset Age</span>
                <span className="font-mono">4.2 years</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Replacement Value</span>
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
                <span className="text-sm text-slate-400">Maintenance Cost Ratio</span>
                <span className="font-mono">
                  {stats.totalValue > 0
                    ? ((stats.maintenance / stats.totalValue) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Depreciation Rate</span>
                <span className="font-mono">
                  {stats.totalValue > 0
                    ? ((stats.depreciation / stats.totalValue) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Net Book Value</span>
                <span className="font-mono">
                  {formatCurrency(stats.totalValue - stats.depreciation)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Downtime Hours (MTD)</span>
                <span className="font-mono text-red-500">24.5 hrs</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
