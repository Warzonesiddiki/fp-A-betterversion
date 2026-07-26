import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Scale, RefreshCw, Download } from 'lucide-react';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function GLTrialBalancePage() {
  const [_helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — G L Trial Balance';
  }, []);

  const { entries, trialBalance, isLoading, generateTrialBalance } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (entries.length > 0 && trialBalance.length === 0 && !isLoading) {
      generateTrialBalance();
    }
  }, [entries, trialBalance, isLoading, generateTrialBalance]);

  const { totalDebits, totalCredits, diff, isBalanced } = useMemo(() => {
    const debits = trialBalance.reduce((s, r) => s + r.debit, 0);
    const credits = trialBalance.reduce((s, r) => s + r.credit, 0);
    return {
      totalDebits: debits,
      totalCredits: credits,
      diff: debits - credits,
      isBalanced: Math.abs(debits - credits) < 0.01,
    };
  }, [trialBalance]);

  // B2 Enhancement: Auto-generate on mount if needed + manual refresh
  const handleGenerate = useCallback(() => {
    generateTrialBalance();
  }, [generateTrialBalance]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton variant="rectangular" height="32px" className="w-60" />
        <Skeleton variant="rectangular" height="48px" />
        <Skeleton variant="rectangular" height="400px" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <Scale className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No GL Data</h2>
        <p className="text-slate-400 mb-6">
          Import General Ledger entries first to generate the Trial Balance. The Trial Balance
          verifies that total debits equal total credits.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  if (trialBalance.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-2">Trial Balance Not Generated</h2>
        <p className="text-slate-400 mb-6">
          Click below to generate the Trial Balance from {entries.length.toLocaleString()} GL
          entries.
        </p>
        <Button onClick={handleGenerate}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Generate Trial Balance
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div
        className={`px-4 py-3 rounded-lg text-sm font-semibold flex items-center gap-3 ${
          isBalanced
            ? 'bg-green-900/30 text-green-400 border border-green-800/50'
            : 'bg-red-900/30 text-red-400 border border-red-800/50'
        }`}
      >
        <div className={`p-1.5 rounded-full ${isBalanced ? 'bg-green-800/50' : 'bg-red-800/50'}`}>
          <Scale className="h-5 w-5" />
        </div>
        <div>
          {isBalanced
            ? 'Trial Balance is Balanced — Total Debits = Total Credits'
            : `Trial Balance is Off by ${formatCurrency(Math.abs(diff))}`}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Trial Balance</h1>
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
              aria-label="Help"
            ></button>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {trialBalance.length} accounts · {entries.length.toLocaleString()} entries
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={handleGenerate}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              // Simple CSV export of trial balance
              const csv = ['Code,Name,Type,Beginning,Debits,Credits,Net,Ending'];
              trialBalance.forEach((r) =>
                csv.push(
                  [
                    r.accountCode,
                    `"${r.accountName}"`,
                    r.accountType,
                    r.beginningBalance,
                    r.debit,
                    r.credit,
                    r.netChange,
                    r.endingBalance,
                  ].join(',')
                )
              );
              const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'trial-balance.csv';
              a.click();
            }}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="GL trial balance">
              <caption className="sr-only">Detailed gl trial balance</caption>
              <thead>
                <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-800">
                  <th scope="col" className="px-4 py-3 w-20">
                    Code
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Account Name
                  </th>
                  <th scope="col" className="px-4 py-3 w-16">
                    Type
                  </th>
                  <th scope="col" className="px-4 py-3 text-right w-28">
                    Beginning Balance
                  </th>
                  <th scope="col" className="px-4 py-3 text-right w-28">
                    Debits
                  </th>
                  <th scope="col" className="px-4 py-3 text-right w-28">
                    Credits
                  </th>
                  <th scope="col" className="px-4 py-3 text-right w-28">
                    Net Change
                  </th>
                  <th scope="col" className="px-4 py-3 text-right w-28">
                    Ending Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {trialBalance.map((row) => (
                  <tr key={row.accountId} className="hover:bg-slate-900/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {row.accountCode}
                    </td>
                    <td className="px-4 py-3">{row.accountName}</td>
                    <td className="px-4 py-3">
                      <Badge variant="default" className="text-[10px]">
                        {row.accountType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                      {formatCurrency(row.beginningBalance)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-blue-400">
                      {formatCurrency(row.debit)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-green-400">
                      {formatCurrency(row.credit)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums font-medium ${
                        row.netChange > 0
                          ? 'text-green-400'
                          : row.netChange < 0
                            ? 'text-red-400'
                            : 'text-slate-300'
                      }`}
                    >
                      {formatCurrency(row.netChange)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums font-semibold ${
                        row.endingBalance > 0
                          ? 'text-green-400'
                          : row.endingBalance < 0
                            ? 'text-red-400'
                            : 'text-slate-300'
                      }`}
                    >
                      {formatCurrency(row.endingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-600">
                <tr className="font-bold text-sm text-slate-200">
                  <td className="px-4 py-3" colSpan={3}>
                    Total
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(trialBalance.reduce((s, r) => s + r.beginningBalance, 0))}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-blue-400">
                    {formatCurrency(totalDebits)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-green-400">
                    {formatCurrency(totalCredits)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(trialBalance.reduce((s, r) => s + r.netChange, 0))}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(trialBalance.reduce((s, r) => s + r.endingBalance, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
