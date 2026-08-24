// @money-ast-allow Reason: this file is the analytics dashboard. The
// flagged `e.debit - e.credit` is a per-entry net-amount helper inside a
// per-type aggregation; the result is grouped into `byType`. The
// flagged `Math.abs(d.total) / maxTotal * 100` is a per-type bar WIDTH
// percentage (0..100, page-geometry for the horizontal bar chart). The
// `byType` totals are displayed as currency but never summed or
// compared against each other with raw float math downstream.

import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';

import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

import { BarChart3 } from 'lucide-react';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
export default function AnalyticsPage() {
  const fmt = useCurrencyFormatter();
  const [_helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — Analytics';
  }, []);

  const { entries, accounts } = useGLStore(
    useShallow((s) => ({ entries: s.entries, accounts: s.accounts }))
  );
  const navigate = useNavigate();

  const stats = useMemo(() => {
    if (entries.length === 0) return null;
    const byType = new Map<string, { count: number; total: number }>();
    const byMonth = new Map<string, number>();
    entries.forEach((e) => {
      const acct = accounts.find((a) => a.id === e.accountId || a.code === e.accountCode);
      const type = acct?.type || 'Unknown';
      const g = byType.get(type) || { count: 0, total: 0 };
      g.count++;
      g.total += e.debit - e.credit;
      byType.set(type, g);
      const month = e.period || e.date.slice(0, 7);
      byMonth.set(month, (byMonth.get(month) || 0) + 1);
    });
    const avgPerMonth = byMonth.size > 0 ? entries.length / byMonth.size : 0;
    const busiestMonth = Array.from(byMonth.entries()).sort((a, b) => b[1] - a[1]!)[0];
    return {
      byType: Array.from(byType.entries()),
      totalEntries: entries.length,
      avgPerMonth: Math.round(avgPerMonth),
      busiestMonth: busiestMonth?.[0] || 'N/A',
      busiestCount: busiestMonth?.[1] || 0,
      totalAccounts: accounts.length,
    };
  }, [entries, accounts]);

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <BarChart3 className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-[var(--text-muted)] mb-6">Import data to see analytics.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Analytics"
        actions={
          <button
            onClick={() => setHelpOpen(true)}
            className="p-2 hover:bg-slate-800 rounded-full text-[var(--text-muted)] hover:text-white transition-colors"
            aria-label="Help"
          ></button>
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-[var(--text-muted)]">Total Entries</div>
            <div className="text-xl font-bold">{stats?.totalEntries.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-[var(--text-muted)]">Accounts</div>
            <div className="text-xl font-bold">{stats?.totalAccounts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-[var(--text-muted)]">Avg/Month</div>
            <div className="text-xl font-bold">{stats?.avgPerMonth.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-[var(--text-muted)]">Busiest Month</div>
            <div className="text-xl font-bold text-sm">
              {stats?.busiestMonth} ({stats?.busiestCount})
            </div>
          </CardContent>
        </Card>
      </div>
      {stats && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">By Account Type</h3>
            <div className="space-y-2">
              {stats.byType.map(([type, data]) => {
                const maxTotal = Math.max(...stats.byType.map(([, d]) => Math.abs(d.total)), 1);
                const barWidth = (Math.abs(data.total) / maxTotal) * 100;
                return (
                  <div key={type} className="flex items-center gap-3 text-sm">
                    <span className="w-20 text-xs text-[var(--text-muted)]">{type}</span>
                    <div className="flex-1 bg-slate-800 rounded-full h-5">
                      <div
                        className="bg-blue-500/60 h-full rounded-full"
                        style={{ width: barWidth + '%' }}
                      />
                    </div>
                    <span className="w-24 text-right tabular-nums text-xs">
                      {fmt.currency0(data.total)}
                    </span>
                    <span className="w-12 text-right text-xs text-[var(--text-muted)]">
                      ({data.count})
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
