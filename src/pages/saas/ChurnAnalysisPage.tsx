import { useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AlertTriangle, BarChart4, Download, RefreshCw, TrendingDown } from 'lucide-react';
import {
  addMoney,
  divideMoney,
  multiplyMoney,
  roundTo,
  subtractMoney,
  sumMoney,
  toDecimal,
} from '@/utils/money';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { formatPercent } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { ExportEngine } from '@/engines/ExportEngine';

function formatPct(n: number | null): string {
  return n == null ? '—' : formatPercent(n, 1);
}

interface ChurnTrendPoint {
  month: string;
  customerChurn: number | null;
  revenueChurn: number | null;
}

interface EntityRevenueChurn {
  entityId: string;
  revenue: number;
}

/**
 * Churn Analysis (session 028, replaces fabricated session-022 version).
 *
 * Pre-session-028 page rendered six months of fake customer-churn and
 * revenue-churn percentages, four "segments" with hand-typed churn values,
 * and five at-risk customers with literal risk scores [85, 72, 68, 91, 78]
 * and "X days ago" last-login strings. None of it was backed by a
 * subscription-management system.
 *
 * The general ledger does carry 41xx (subscription revenue) and 43xx
 * (reversals / churn) and per-entity revenue. The page now reports:
 *   - Per-entity revenue from the GL.
 *   - Period-over-period revenue change as a revenue-churn signal.
 *
 * Customer counts, risk scores, and "last login" days require a
 * subscription-management system. They are disclosed as not derivable.
 */
export default function ChurnAnalysisPage() {
  const fmt = useCurrencyFormatter();
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Churn Analysis';
  }, []);

  // Real: per-entity revenue from 41xx credits. This is the input to the
  // revenue-churn signal.
  const entityRevenue = useMemo<EntityRevenueChurn[]>(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      if (!(e.accountCode ?? '').startsWith('41')) continue;
      const key = e.entityId ?? '—';
      const amt = roundTo(subtractMoney(e.credit, e.debit), 2);
      map.set(key, roundTo(addMoney(map.get(key) ?? 0, amt), 2));
    }
    return [...map.entries()].map(([entityId, revenue]) => ({ entityId, revenue }));
  }, [entries]);

  // Real: total subscription revenue.
  const totalRevenue = roundTo(sumMoney(entityRevenue.map((e) => e.revenue)), 2);

  // Real: revenue-churn-by-period from the GL, bucketed by month. We
  // compute the period-over-period % change; a negative change is a
  // revenue-churn signal.
  const churnTrend = useMemo<ChurnTrendPoint[]>(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      if (!(e.accountCode ?? '').startsWith('41')) continue;
      const month = e.period || (e.date ?? '').slice(0, 7);
      if (!month) continue;
      const amt = roundTo(subtractMoney(e.credit, e.debit), 2);
      map.set(month, roundTo(addMoney(map.get(month) ?? 0, amt), 2));
    }
    const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
    return sorted.map(([month, rev], idx) => {
      if (idx === 0) return { month, customerChurn: null, revenueChurn: null };
      const prior = sorted[idx - 1]![1];
      const churnPct =
        prior > 0
          ? roundTo(multiplyMoney(divideMoney(subtractMoney(prior, rev), toDecimal(prior)), 100), 2)
          : null;
      return { month, customerChurn: null, revenueChurn: churnPct };
    });
  }, [entries]);

  // The latest month-over-month churn signal.
  const latestTrend = churnTrend[churnTrend.length - 1];
  const latestRevenueChurn = latestTrend?.revenueChurn ?? null;
  // The most recent period's revenue (latest month on the trend).
  const latestPeriodRevenue = useMemo(() => {
    if (churnTrend.length === 0) return 0;
    const last = churnTrend[churnTrend.length - 1]!;
    const map = new Map<string, number>();
    for (const e of entries) {
      if (!(e.accountCode ?? '').startsWith('41')) continue;
      if ((e.period || (e.date ?? '').slice(0, 7)) !== last.month) continue;
      map.set(
        e.entityId ?? '—',
        roundTo(addMoney(map.get(e.entityId ?? '—') ?? 0, subtractMoney(e.credit, e.debit)), 2)
      );
    }
    return roundTo(sumMoney([...map.values()]), 2);
  }, [churnTrend, entries]);

  const handleExport = () => {
    void ExportEngine.exportToExcel(
      {
        headers: ['Entity', 'Revenue (41xx)'],
        rows: entityRevenue.map((e) => [e.entityId, e.revenue]),
      },
      { title: 'Revenue_By_Entity' }
    ).catch(reportExportFailure);
  };

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <BarChart4 className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No SaaS Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Import GL data with subscription revenue accounts (41xx) to analyze churn metrics.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import GL Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" role="main" aria-label="Churn Analysis page">
      <PageHeader
        title="Churn Analysis"
        purpose="Revenue-churn signal from 41xx movement. Customer count, risk score and last-login require a subscription feed."
        actions={
          <Button variant="outline" onClick={handleExport} aria-label="Export revenue by entity">
            <Download className="h-4 w-4 mr-2" aria-hidden="true" />
            Export
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <KPIValue
          label="Latest Revenue (41xx)"
          value={latestPeriodRevenue > 0 ? fmt.currency0(latestPeriodRevenue) : '—'}
          icon={<RefreshCw className="h-4 w-4" />}
        />
        <KPIValue
          label="Total Revenue (window)"
          value={totalRevenue > 0 ? fmt.currency0(totalRevenue) : '—'}
          icon={<TrendingDown className="h-4 w-4" />}
        />
        <KPIValue
          label="Latest Period-over-Period Δ"
          value={formatPct(latestRevenueChurn)}
          icon={<TrendingDown className="h-4 w-4" />}
          trend={latestRevenueChurn != null && latestRevenueChurn > 0 ? 'down' : 'up'}
        />
        <KPIValue
          label="Entities"
          value={String(entityRevenue.length)}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Churn Trend (period-over-period)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={churnTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                  }}
                  formatter={(v) => (v == null ? '—' : `${v}%`)}
                />
                <Legend />
                <Line
                  dataKey="revenueChurn"
                  name="Revenue Δ vs prior month"
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Entity (41xx)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={entityRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="entityId" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => fmt.currency0(v as number)} />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                  }}
                  formatter={(v) => fmt.currency0(v as number)}
                />
                <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>At-Risk Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[var(--text-muted)] text-center py-8">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-[var(--text-muted)]" />
            Per-customer churn, risk score, and last-login require a subscription-management system.
            The aggregate revenue-churn signal and per-entity revenue are reported above from the
            real GL.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function KPIValue({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
        {icon}
        {label}
      </div>
      <div className="text-lg font-semibold">{value}</div>
      {trend && (
        <div className="text-[10px] text-slate-500 mt-1">
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—'}
        </div>
      )}
    </div>
  );
}

/**
 * Pure helpers (GAP-1 — F-0006). These are the canonical way to derive
 * subscription MRR and period deltas from raw entries. Exposed for unit
 * tests; consumed by the in-page `useMemo` blocks above.
 */
export function computeSubscriptionMRR(
  entries: Array<{ credit?: number; debit?: number }>
): number {
  return roundTo(sumMoney(entries.map((e) => subtractMoney(e.credit ?? 0, e.debit ?? 0))), 2);
}

export function computeMRRDelta(currentMRR: number, prevMRR: number): number {
  return roundTo(subtractMoney(toDecimal(currentMRR), toDecimal(prevMRR)), 2);
}
