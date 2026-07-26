/* eslint-disable @typescript-eslint/no-unused-vars, jsx-a11y/label-has-associated-control */
import { useEffect, useMemo, useState } from 'react';

import { useNavigate, useLocation } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';

import { BarChart3, Search, ArrowLeft } from 'lucide-react';
import { computeRunningBalance, getAccountSummary } from '@/utils/glAnalysis';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function GLAccountAnalysisPage() {
  const [_helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — G L Account Analysis';
  }, []);

  const { entries, accounts, accountAnalysis, isLoading, analyzeAccount } = useGLStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedAccountId, setSelectedAccountId] = useState('');

  const accountOptions = useMemo(
    () => [
      { value: '', label: 'Select an account...' },
      ...accounts.map((a) => ({ value: a.id, label: a.code + ' — ' + a.name })),
    ],
    [accounts]
  );

  // Section 012: Support deep link from TB / Journals
  useEffect(() => {
    const rawState: unknown = location.state;
    const state =
      rawState && typeof rawState === 'object' ? (rawState as Record<string, unknown>) : {};
    const accountId = typeof state.accountId === 'string' ? state.accountId : undefined;
    if (accountId && !selectedAccountId) {
      setSelectedAccountId(accountId);
      if (typeof analyzeAccount === 'function') {
        analyzeAccount(accountId);
      }
    }
  }, [location.state, selectedAccountId, analyzeAccount]);

  const accountStats = useMemo(() => {
    if (!selectedAccountId || entries.length === 0) return null;

    const summary = getAccountSummary(entries, selectedAccountId);
    if (summary.transactionCount === 0) return null;

    const monthlyTotals = computeRunningBalance(entries, selectedAccountId).map((r) => ({
      month: r.month,
      debit: r.debit,
      credit: r.credit,
      net: r.net,
      count: 0, // we can enhance later
    }));

    const maxNet = Math.max(...monthlyTotals.map((m) => Math.abs(m.net)), 1);

    return {
      ...summary,
      monthlyTotals: monthlyTotals.map((m) => ({ ...m, count: 1 })), // placeholder
      maxNet,
      avgPerMonth: monthlyTotals.length > 0 ? summary.netChange / monthlyTotals.length : 0,
      runningBalance: computeRunningBalance(entries, selectedAccountId),
    };
  }, [entries, selectedAccountId]);

  const handleAccountChange = (value: string) => {
    setSelectedAccountId(value);
    if (value) {
      analyzeAccount(value);
    }
  };

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <BarChart3 className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No GL Data</h2>
        <p className="text-slate-400 mb-6">
          Import General Ledger data first to analyze individual accounts.
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
            <h1 className="text-2xl font-bold">Account Analysis</h1>
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
              aria-label="Help"
            ></button>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {entries.length.toLocaleString()} total entries across {accounts.length} accounts
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Select Account</label>
          <div className="flex gap-3 items-center">
            <div className="flex-1 max-w-md">
              <Select
                options={accountOptions}
                value={selectedAccountId}
                onChange={handleAccountChange}
                placeholder="Search or select an account..."
              />
            </div>
            {selectedAccountId && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedAccountId('');
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {!selectedAccountId && (
        <div className="text-center py-12 text-slate-500">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Select an account above to view detailed analysis.</p>
        </div>
      )}

      {isLoading && selectedAccountId && (
        <div className="space-y-4">
          <Skeleton variant="rectangular" height="100px" />
          <Skeleton variant="rectangular" height="200px" />
        </div>
      )}

      {!isLoading && selectedAccountId && !accountStats && (
        <div className="p-12 text-center max-w-md mx-auto">
          <h2 className="text-lg font-semibold mb-2">No Transactions Found</h2>
          <p className="text-slate-400">
            The selected account has no transactions in the current data set.
          </p>
        </div>
      )}

      {accountStats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-xs text-slate-400 mb-1">Total Debits</div>
                <div className="text-lg font-bold tabular-nums text-blue-400">
                  {formatCurrency(accountStats.totalDebit)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-xs text-slate-400 mb-1">Total Credits</div>
                <div className="text-lg font-bold tabular-nums text-green-400">
                  {formatCurrency(accountStats.totalCredit)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-xs text-slate-400 mb-1">Net Change</div>
                <div
                  className={`text-lg font-bold tabular-nums ${accountStats.netChange >= 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {formatCurrency(accountStats.netChange)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-xs text-slate-400 mb-1">Transactions</div>
                <div className="text-lg font-bold tabular-nums">
                  {accountStats.transactionCount.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-xs text-slate-400 mb-1">Avg Monthly</div>
                <div className="text-lg font-bold tabular-nums">
                  {formatCurrency(accountStats.avgPerMonth)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Monthly Trend</h3>
              {accountStats.monthlyTotals.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">No monthly data available</p>
              ) : (
                <div className="space-y-2">
                  {accountStats.monthlyTotals.map((m) => {
                    const barWidth = (Math.abs(m.net) / accountStats.maxNet) * 100;
                    const isPositive = m.net >= 0;
                    return (
                      <div key={m.month} className="flex items-center gap-3 text-sm">
                        <span className="w-16 text-xs text-slate-400 shrink-0">{m.month}</span>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="flex-1 bg-slate-800 rounded-full h-5 overflow-hidden flex">
                            {!isPositive && (
                              <div
                                className="bg-red-500/60 h-full rounded-full transition-all"
                                style={{
                                  width: Math.min(barWidth, 100) + '%',
                                  marginLeft: 100 - Math.min(barWidth, 100) + '%',
                                }}
                              />
                            )}
                            {isPositive && (
                              <div
                                className="bg-green-500/60 h-full rounded-full transition-all"
                                style={{ width: Math.min(barWidth, 100) + '%' }}
                              />
                            )}
                          </div>
                          <span
                            className={`w-24 text-right tabular-nums font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}
                          >
                            {formatCurrency(m.net)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Running Balance */}
          {accountStats.runningBalance && accountStats.runningBalance.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="font-semibold">Running Balance</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      navigate('/data/gl-journals', {
                        state: { accountId: selectedAccountId },
                      })
                    }
                  >
                    View in Journals
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" aria-label="Running balance">
                    <thead>
                      <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-800">
                        <th className="px-4 py-3">Month</th>
                        <th className="px-4 py-3 text-right">Net</th>
                        <th className="px-4 py-3 text-right">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {accountStats.runningBalance.map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50">
                          <td className="px-4 py-2 text-xs text-slate-400">{r.month}</td>
                          <td
                            className={`px-4 py-2 text-right tabular-nums font-medium ${r.net >= 0 ? 'text-green-400' : 'text-red-400'}`}
                          >
                            {formatCurrency(r.net)}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums font-semibold">
                            {formatCurrency(r.runningBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b border-slate-800">
                <h3 className="font-semibold">Monthly Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="GL account analysis">
                  <thead>
                    <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-800">
                      <th scope="col" className="px-4 py-3">
                        Month
                      </th>
                      <th scope="col" className="px-4 py-3 text-right">
                        Debits
                      </th>
                      <th scope="col" className="px-4 py-3 text-right">
                        Credits
                      </th>
                      <th scope="col" className="px-4 py-3 text-right">
                        Net
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {accountStats.monthlyTotals.map((m) => (
                      <tr key={m.month} className="hover:bg-slate-900/50">
                        <td className="px-4 py-3 text-xs text-slate-400">{m.month}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-blue-400">
                          {formatCurrency(m.debit)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-green-400">
                          {formatCurrency(m.credit)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right tabular-nums font-medium ${m.net >= 0 ? 'text-green-400' : 'text-red-400'}`}
                        >
                          {formatCurrency(m.net)}
                        </td>
                      </tr>
                    ))}
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
