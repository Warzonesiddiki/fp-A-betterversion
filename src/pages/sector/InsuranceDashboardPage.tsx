import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { insuranceConfig } from '@/config/sectors/insurance';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Shield } from 'lucide-react';
import { sumMoney, roundTo, divideMoney, toDecimal } from '@/utils/money';
import { formatPercent } from '@/utils/financialFormatting';
import { computeSectorDriverModel } from './SectorDriverDashboard';
import { PageHeader } from '@/components/ui/PageHeader';

function formatMetricValue(metric: {
  format: 'currency' | 'percent' | 'number';
  value: number;
}): string {
  if (metric.format === 'currency') return formatCurrency(metric.value);
  if (metric.format === 'percent') return `${formatPercent(metric.value, 1)}`;
  return formatNumber(metric.value);
}

export default function InsuranceDashboardPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Insurance Dashboard';
  }, []);

  const model = useMemo(() => {
    if (entries.length === 0) return null;
    return computeSectorDriverModel({
      sectorId: 'insurance',
      config: insuranceConfig,
      entries,
    });
  }, [entries]);

  const stats = useMemo(() => {
    const revenue = roundTo(
      sumMoney(entries.filter((e) => e.credit > e.debit).map((e) => e.credit)),
      2
    );
    const claims = roundTo(
      sumMoney(
        entries.filter((e) => e.accountName.toLowerCase().includes('claim')).map((e) => e.debit)
      ),
      2
    );
    const expenses = roundTo(
      sumMoney(
        entries
          .filter((e) => e.debit > e.credit && !e.accountName.toLowerCase().includes('claim'))
          .map((e) => e.debit)
      ),
      2
    );
    const lossRatio = revenue > 0 ? roundTo(divideMoney(claims, revenue).times(100), 2) : 0;
    const expenseRatio = revenue > 0 ? roundTo(divideMoney(expenses, revenue).times(100), 2) : 0;
    // Exact average claim size (0 when no claims).
    const avgClaim =
      toDecimal(claims).gt(0) && entries.length > 0
        ? roundTo(divideMoney(claims, entries.filter((e) => e.debit > 0).length || 1), 2)
        : 0;
    return {
      revenue,
      claims,
      expenses,
      lossRatio,
      expenseRatio,
      combinedRatio: lossRatio + expenseRatio,
      avgClaim,
    };
  }, [entries]);

  const metricById = useMemo(() => {
    if (!model)
      return new Map<string, { format: 'currency' | 'percent' | 'number'; value: number }>();
    return new Map(model.metrics.map((m) => [m.id, { format: m.format, value: m.value }]));
  }, [model]);

  const retentionPct = metricById.get('retention_ratio')?.value ?? 90;
  const solvencyPct = metricById.get('solvency_ratio')?.value ?? 180;
  const lossRatioMetric = metricById.get('loss_ratio')?.value ?? stats?.lossRatio ?? 0;
  const expenseRatioMetric = metricById.get('expense_ratio')?.value ?? stats?.expenseRatio ?? 0;
  const combinedRatioMetric = metricById.get('combined_ratio')?.value ?? stats?.combinedRatio ?? 0;

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="Insurance Dashboard - No Data">
        <Shield className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">Insurance — No Data</h1>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to view insurance KPIs.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" role="main">
      <PageHeader title="Insurance Dashboard" purpose="Underwriting and claims metrics" />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {model?.metrics.slice(0, 8).map((metric) => (
          <KPIValue
            key={metric.id}
            label={metric.label}
            value={formatMetricValue(metric)}
            change={metric.varianceToTargetPct}
          />
        ))}
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPIValue label="GWP" value={formatCurrency(stats.revenue)} />
        <KPIValue label="Claims Paid" value={formatCurrency(stats.claims)} />
        <KPIValue label="Combined Ratio" value={`${formatPercent(stats.combinedRatio, 1)}`} />
        <KPIValue label="Loss Ratio" value={`${formatPercent(stats.lossRatio, 1)}`} />
        <KPIValue label="Expense Ratio" value={`${formatPercent(stats.expenseRatio, 1)}`} />
        <KPIValue label="Accounts" value={formatNumber(entries.length)} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Underwriting Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Loss Ratio</span>
                <span
                  className={`font-mono ${lossRatioMetric < 65 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatPercent(lossRatioMetric, 1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Expense Ratio</span>
                <span className="font-mono">{formatPercent(expenseRatioMetric, 1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Combined Ratio</span>
                <span
                  className={`font-mono ${combinedRatioMetric < 100 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatPercent(combinedRatioMetric, 1)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Retention Rate</span>
                <span className="font-mono text-green-600">{formatPercent(retentionPct, 1)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Claims Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Total Claims</span>
                <span className="font-mono">{formatCurrency(stats.claims)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Avg Claim Size</span>
                <span className="font-mono">{formatCurrency(stats.avgClaim)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Solvency II Ratio</span>
                <span className="font-mono text-green-600">{formatPercent(solvencyPct, 1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Reserve / Solvency Signal</span>
                <span className="font-mono">{formatCurrency(model?.assetBase ?? 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
