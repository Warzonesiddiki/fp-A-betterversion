import { useEffect, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FileText, Download, Calendar } from 'lucide-react';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function GLReportingPage() {
  const [_helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — G L Reporting';
  }, []);

  const { entries, accounts, trialBalance } = useGLStore();
  const navigate = useNavigate();
  const [_dateRange, _setDateRange] = useState(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      start: first.toISOString().slice(0, 10),
      end: now.toISOString().slice(0, 10),
    };
  });
  const [_typeFilter, _setTypeFilter] = useState('all');

  const summary = useMemo(() => {
    if (entries.length === 0) return null;
    const dates = entries
      .map((e) => e.date)
      .filter(Boolean)
      .sort();
    const accountsWithEntries = new Set(entries.map((e) => e.accountId || e.accountCode));
    const typeBreakdown = accounts.reduce(
      (acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const accountTypeTotals = entries.reduce(
      (acc, e) => {
        const acct = accounts.find((a) => a.id === e.accountId || a.code === e.accountCode);
        const type = acct?.type || 'Unknown';
        if (!acc[type]!) acc[type] = { debit: 0, credit: 0, count: 0 };
        acc[type]!.debit += e.debit;
        acc[type]!.credit += e.credit;
        acc[type]!.count++;
        return acc;
      },
      {} as Record<string, { debit: number; credit: number; count: number }>
    );
    return {
      totalEntries: entries.length,
      totalAccounts: accounts.length,
      accountsWithEntries: accountsWithEntries.size,
      dateRange: dates.length >= 2 ? { start: dates[0]!, end: dates[dates.length - 1] } : null,
      typeBreakdown,
      accountTypeTotals,
      trialBalanceBalanced:
        trialBalance.length > 0 &&
        Math.abs(
          trialBalance.reduce((s, r) => s + r.debit, 0) -
            trialBalance.reduce((s, r) => s + r.credit, 0)
        ) < 0.01,
    };
  }, [entries, accounts, trialBalance]);

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <FileText className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No GL Data</h2>
        <p className="text-slate-400 mb-6">
          Import General Ledger data to view reports and summaries.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">GL Reporting</h1>
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
              aria-label="Help"
            ></button>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Summary and analysis of your General Ledger data
          </p>
        </div>
        <Button size="sm" variant="ghost">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export Report
        </Button>
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-xs text-slate-400 mb-1">Total Entries</div>
                <div className="text-xl font-bold">{summary.totalEntries.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-xs text-slate-400 mb-1">Accounts Used</div>
                <div className="text-xl font-bold">
                  {summary.accountsWithEntries.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-xs text-slate-400 mb-1">Total Accounts</div>
                <div className="text-xl font-bold">{summary.totalAccounts.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-xs text-slate-400 mb-1">Trial Balance</div>
                <div className="text-xl font-bold">
                  {summary.trialBalanceBalanced ? (
                    <span className="text-green-400">Balanced</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Date Range</h3>
              {summary.dateRange ? (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <span>{summary.dateRange.start}</span>
                  <span className="text-slate-500">to</span>
                  <span>{summary.dateRange.end}</span>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Date information not available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Account Type Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-800">
                      <th className="pb-3 pr-4">Account Type</th>
                      <th className="pb-3 pr-4 text-right">Accounts</th>
                      <th className="pb-3 pr-4 text-right">Total Debits</th>
                      <th className="pb-3 pr-4 text-right">Total Credits</th>
                      <th className="pb-3 pr-4 text-right">Net</th>
                      <th className="pb-3 pr-4 text-right">Transactions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {Object.entries(summary.accountTypeTotals).map(([type, data]) => {
                      const net = data.debit - data.credit;
                      const typeCount = summary.typeBreakdown[type] || 0;
                      return (
                        <tr key={type} className="hover:bg-slate-900/50">
                          <td className="py-3 pr-4">
                            <Badge variant="default" className="text-[10px]">
                              {type}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums">{typeCount}</td>
                          <td className="py-3 pr-4 text-right tabular-nums text-blue-400">
                            {formatCurrency(data.debit)}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums text-green-400">
                            {formatCurrency(data.credit)}
                          </td>
                          <td
                            className={`py-3 pr-4 text-right tabular-nums font-medium ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}
                          >
                            {formatCurrency(net)}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums">
                            {data.count.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
