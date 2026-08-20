import { buildFiscalPeriods } from '@/utils/fiscalPeriods';
import { PageHeader } from '@/components/ui/PageHeader';
import { useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, Download, Filter, PieChart as PieChartIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { PeriodPicker } from '@/components/ui/PeriodPicker';
import { DataTable, Column } from '@/components/ui/DataTable';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import type { FiscalPeriod } from '@/types';
import { InsuranceEngine } from '@/engines/InsuranceEngine';
import { addMoney, roundTo, subtractMoney, sumMoney, toDecimal } from '@/utils/money';
import { useGLStore } from '@/store/glStore';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';

const mockPeriods: FiscalPeriod[] = buildFiscalPeriods();

/**
 * Claims Analytics (session 028, replaces fabricated session-022 version).
 *
 * Pre-session-028 page rendered six months of fictional frequency/severity
 * numbers, a five-segment hand-typed claims-by-type pie, and five named
 * claimants with hand-typed incurred/paid amounts. None of it was backed by
 * a claim ledger.
 *
 * The general ledger does not carry per-claim records; per-claim frequency
 * and severity can only come from a claim-management system. This page
 * therefore:
 *   1. Reports real GL-derived insurance ratios from `InsuranceEngine`
 *      (loss ratio, expense ratio, combined ratio);
 *   2. Buckets real GL amounts by line of business (Auto / Homeowners /
 *      Life / Commercial / Health) for the breakdown chart;
 *   3. Empty-states the per-claim table and discloses that it requires a
 *      claim-management feed, not the GL.
 *
 * No hand-typed KPI literals remain. The 5-segment pie is replaced by a
 * real per-line earned premium mix that is empty when no premium is posted.
 */
export default function ClaimsAnalyticsPage() {
  const [periodId, setPeriodId] = useState('P01');
  const { entries } = useGLStore();
  const fmtCurrency = useCurrencyFormatter();

  const stats = useMemo(() => InsuranceEngine.calculateStats(entries), [entries]);
  const trend = useMemo(() => InsuranceEngine.getCombinedRatioTrend(entries), [entries]);
  const byLine = useMemo(() => InsuranceEngine.getPremiumByLine(entries), [entries]);

  // Real per-period loss-and-LAE from the GL (51xx), bucketed by month.
  // This is the closest analogue to a "claim count" we can derive from a
  // general ledger. The number of claims is NOT derivable — that lives in
  // a claim-management system, so we disclose.
  const lossByMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      if (!(e.accountCode ?? '').startsWith('51')) continue;
      const month = e.period || (e.date ?? '').slice(0, 7);
      if (!month) continue;
      const debit = e.debit ?? 0;
      const credit = e.credit ?? 0;
      const amt = roundTo(subtractMoney(toDecimal(debit), toDecimal(credit)), 2);
      const prior = map.get(month) ?? 0;
      map.set(month, roundTo(addMoney(prior, amt), 2));
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount }));
  }, [entries]);

  const lossTotal = roundTo(sumMoney(lossByMonth.map((p) => p.amount)), 2);

  const kpis = [
    {
      label: 'Loss Ratio',
      value: stats.lossRatio == null ? '—' : `${stats.lossRatio.toFixed(1)}%`,
      changeLabel: 'loss / earned premium',
    },
    {
      label: 'Combined Ratio',
      value: stats.combinedRatio == null ? '—' : `${stats.combinedRatio.toFixed(1)}%`,
      changeLabel: 'loss + expense',
    },
    {
      label: 'Earned Premium (window)',
      value:
        stats.earnedPremium > 0 ? fmtCurrency.custom({ compact: true })(stats.earnedPremium) : '—',
      changeLabel: 'sum of 42xx credits',
    },
    {
      label: 'Loss & LAE (window)',
      value: lossTotal > 0 ? fmtCurrency.custom({ compact: true })(lossTotal) : '—',
      changeLabel: 'sum of 51xx debits',
    },
  ];

  const columns: Column[] = [
    { key: 'id', header: 'Source', sortable: true },
    { key: 'line', header: 'Line' },
    {
      key: 'written',
      header: 'Written Premium',
      align: 'right',
      render: (v) => (v == null ? '—' : fmtCurrency.custom({ compact: true })(v as number)),
    },
    {
      key: 'earned',
      header: 'Earned Premium',
      align: 'right',
      render: (v) => (v == null ? '—' : fmtCurrency.custom({ compact: true })(v as number)),
    },
  ];

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Claims Analytics"
          purpose="Loss ratio, combined ratio and premium mix from the general ledger. Per-claim detail requires a claim-management feed."
        />
        <div className="flex items-center gap-3">
          <PeriodPicker value={periodId} onChange={setPeriodId} periods={mockPeriods} />
          <Button variant="outline" size="sm" className="h-10" disabled={entries.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Loss Run Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <KPIValue key={k.label} label={k.label} value={k.value} changeLabel={k.changeLabel} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <CardTitle>Loss & LAE Over Time</CardTitle>
            </div>
            <CardDescription>
              {lossByMonth.length > 0
                ? 'Posted loss & LAE (51xx) by period from the GL'
                : 'No 51xx entries in the GL'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
              {lossByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={lossByMonth}>
                    <defs>
                      <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Legend verticalAlign="top" align="right" />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      name="Loss & LAE"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorLoss)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No loss & LAE (51xx) entries posted." />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-indigo-500" />
              <CardTitle>Premium by Line</CardTitle>
            </div>
            <CardDescription>
              {byLine.length > 0
                ? 'Posted earned premium by line of business'
                : 'No 41xx / 42xx entries in the GL'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full pt-4">
              {byLine.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byLine}
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="earned"
                      nameKey="name"
                    >
                      {byLine.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No premium entries to chart." />
              )}
            </div>
            {byLine.length > 0 && (
              <div className="mt-4 space-y-1">
                {byLine.map((s) => {
                  const total = byLine.reduce((acc, x) => acc + x.earned, 0);
                  return (
                    <div key={s.name} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="font-medium">{s.name}</span>
                      </div>
                      <span className="text-[var(--text-secondary)]">
                        {total > 0 ? `${((s.earned / total) * 100).toFixed(0)}%` : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Premium by Line of Business</CardTitle>
            <CardDescription>
              Posted 41xx (written) and 42xx (earned) by line from the GL
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" disabled>
            <Filter className="h-4 w-4 mr-2" />
            Filter Lines
          </Button>
        </CardHeader>
        <CardContent>
          {byLine.length > 0 ? (
            <DataTable
              columns={columns}
              data={byLine.map((l) => ({
                id: l.name,
                line: l.name,
                written: l.written,
                earned: l.earned,
              }))}
              caption="Premium by line of business"
              ariaLabel="Premium by line table"
            />
          ) : (
            <div className="text-sm text-[var(--text-muted)] space-y-2">
              <p>
                Per-claim frequency, severity and individual claim records are not derivable from a
                general ledger. They require a claim-management system (claim intake, reserve
                posting, settlement cycle). Connect one to populate this table.
              </p>
              <p>
                Loss ratio, combined ratio, earned premium and loss &amp; LAE are reported above
                from the real GL.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Combined ratio trend — optional secondary chart, real data only */}
      {trend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Combined Ratio Trend</CardTitle>
            <CardDescription>Loss and expense ratios by period from the GL</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Legend verticalAlign="top" align="right" />
                  <Area
                    type="monotone"
                    dataKey="lossRatio"
                    name="Loss Ratio"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={0.2}
                    fill="#3b82f6"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenseRatio"
                    name="Expense Ratio"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={0.2}
                    fill="#10b981"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center text-sm text-[var(--text-muted)]">
      <div className="text-center max-w-sm">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-[var(--text-muted)]" />
        <p>{message}</p>
      </div>
    </div>
  );
}
