import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { activateOnKey } from '@/utils/a11yActivate';
import { PageHeader } from '@/components/ui/PageHeader';

import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useGLTrialBalanceStore } from '@/store/glTrialBalanceStore';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { toCSV } from '@/utils/csv';
import { sumMoney, subtractMoney, roundTo } from '@/utils/money';
import {
  Scale,
  RefreshCw,
  Download,
  Eye,
  BarChart3,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
/** Money-primitive trial-balance totals (GAP-1 F-0006). */
export interface TrialBalanceTotals {
  totalDebits: number;
  totalCredits: number;
  diff: number;
  isBalanced: boolean;
  totalBeginningBalance: number;
  totalNetChange: number;
  totalEndingBalance: number;
}

export function computeTrialBalanceTotals(
  rows: readonly {
    debit: number;
    credit: number;
    beginningBalance: number;
    netChange: number;
    endingBalance: number;
  }[]
): TrialBalanceTotals {
  const totalDebits = roundTo(sumMoney(rows.map((r) => r.debit)), 2);
  const totalCredits = roundTo(sumMoney(rows.map((r) => r.credit)), 2);
  const diff = roundTo(subtractMoney(totalDebits, totalCredits), 2);
  const totalBeginningBalance = roundTo(sumMoney(rows.map((r) => r.beginningBalance)), 2);
  const totalNetChange = roundTo(sumMoney(rows.map((r) => r.netChange)), 2);
  const totalEndingBalance = roundTo(sumMoney(rows.map((r) => r.endingBalance)), 2);
  return {
    totalDebits,
    totalCredits,
    diff,
    isBalanced: Math.abs(diff) < 0.01,
    totalBeginningBalance,
    totalNetChange,
    totalEndingBalance,
  };
}

export default function GLTrialBalancePage() {
  const fmt = useCurrencyFormatter();
  const [_helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — G L Trial Balance';
  }, []);

  const { entries, trialBalance, isLoading, generateTrialBalance } = useGLStore(
    useShallow((s) => ({
      entries: s.entries,
      trialBalance: s.trialBalance,
      isLoading: s.isLoading,
      generateTrialBalance: s.generateTrialBalance,
    }))
  );
  const navigate = useNavigate();

  // Sorting is delegated to glTrialBalanceStore, which already implements
  // real column sort/filter/pagination logic (previously built but never
  // wired to any page — a fully-tested, fully-functional store sitting
  // unused while this page rendered rows in raw GL order with no way to
  // sort by any column). Feed the generated trial balance rows into it and
  // render its sorted, RBAC-enforced output instead of the raw store rows.
  const setTBRows = useGLTrialBalanceStore((s) => s.setRows);
  const tbSortConfig = useGLTrialBalanceStore((s) => s.sortConfig);
  const tbFilteredRows = useGLTrialBalanceStore((s) => s.filteredRows);
  const setTBSort = useGLTrialBalanceStore((s) => s.setSort);

  useEffect(() => {
    if (entries.length > 0 && trialBalance.length === 0 && !isLoading) {
      generateTrialBalance();
    }
  }, [entries, trialBalance, isLoading, generateTrialBalance]);

  useEffect(() => {
    if (trialBalance.length === 0) return;
    try {
      setTBRows(trialBalance);
    } catch {
      // glTrialBalanceStore.setRows is RBAC-gated (IMPORT_UPDATE) because
      // its primary caller is the import pipeline. Feeding it the trial
      // balance to enable column sorting is a read-side convenience, not a
      // data mutation — a viewer without import:update should still see
      // the (unsorted) trial balance rather than have the whole page
      // crash. sortedTrialBalance below already falls back to the raw
      // trialBalance array whenever the sort store has nothing loaded.
    }
  }, [trialBalance, setTBRows]);

  const sortedTrialBalance =
    tbFilteredRows.length > 0 || tbSortConfig ? tbFilteredRows : trialBalance;

  const handleSort = useCallback(
    (column: string) => {
      const nextDirection: 'asc' | 'desc' =
        tbSortConfig?.column === column && tbSortConfig.direction === 'asc' ? 'desc' : 'asc';
      setTBSort(column, nextDirection);
    },
    [tbSortConfig, setTBSort]
  );

  const sortIconFor = useCallback(
    (column: string) => {
      if (tbSortConfig?.column !== column) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
      return tbSortConfig.direction === 'asc' ? (
        <ArrowUp className="h-3 w-3" />
      ) : (
        <ArrowDown className="h-3 w-3" />
      );
    },
    [tbSortConfig]
  );

  const {
    totalDebits,
    totalCredits,
    diff,
    isBalanced,
    totalBeginningBalance,
    totalNetChange,
    totalEndingBalance,
  } = useMemo(() => computeTrialBalanceTotals(trialBalance), [trialBalance]);

  // B2 Enhancement: Auto-generate on mount if needed + manual refresh
  const handleGenerate = useCallback(() => {
    generateTrialBalance();
  }, [generateTrialBalance]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton
          variant="rectangular"
          height="32px"
          className="w-60"
          srLabel="Loading trial balance…"
        />
        <Skeleton variant="rectangular" height="48px" />
        <Skeleton variant="rectangular" height="400px" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <Scale className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No GL Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
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
        <p className="text-[var(--text-muted)] mb-6">
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
            : `Trial Balance is Off by ${fmt.currency0(Math.abs(diff))}`}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <PageHeader
            title="Trial Balance"
            actions={
              <button
                onClick={() => setHelpOpen(true)}
                className="p-2 hover:bg-slate-800 rounded-full text-[var(--text-muted)] hover:text-white transition-colors"
                aria-label="Help"
              ></button>
            }
          />
          <p className="text-sm text-[var(--text-muted)] mt-1">
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
              const csv = toCSV(
                trialBalance.map((row) => ({
                  Code: row.accountCode,
                  Name: row.accountName,
                  Type: row.accountType,
                  Beginning: row.beginningBalance,
                  Debits: row.debit,
                  Credits: row.credit,
                  Net: row.netChange,
                  Ending: row.endingBalance,
                })),
                ['Code', 'Name', 'Type', 'Beginning', 'Debits', 'Credits', 'Net', 'Ending']
              );
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'trial-balance.csv';
              a.click();
              URL.revokeObjectURL(url);
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
                <tr className="text-left text-[var(--text-muted)] text-xs uppercase border-b border-slate-800">
                  {(
                    [
                      { key: 'accountCode', label: 'Code', className: 'w-20' },
                      { key: 'accountName', label: 'Account Name', className: '' },
                      { key: 'accountType', label: 'Type', className: 'w-16' },
                      {
                        key: 'beginningBalance',
                        label: 'Beginning Balance',
                        className: 'text-right w-28',
                      },
                      { key: 'debit', label: 'Debits', className: 'text-right w-28' },
                      { key: 'credit', label: 'Credits', className: 'text-right w-28' },
                      { key: 'netChange', label: 'Net Change', className: 'text-right w-28' },
                      {
                        key: 'endingBalance',
                        label: 'Ending Balance',
                        className: 'text-right w-28',
                      },
                    ] as const
                  ).map((col) => (
                    <th key={col.key} scope="col" className={`px-4 py-3 ${col.className}`}>
                      <button
                        type="button"
                        onClick={() => handleSort(col.key)}
                        className="inline-flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors"
                        aria-label={`Sort by ${col.label}`}
                      >
                        {col.label}
                        {sortIconFor(col.key)}
                      </button>
                    </th>
                  ))}
                  <th scope="col" className="px-2 py-3 w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sortedTrialBalance.map((row) => (
                  <tr
                    key={row.accountId}
                    className="hover:bg-slate-900/50 cursor-pointer group"
                    onClick={() => {
                      // Primary action: go to Account Analysis
                      navigate('/data/gl-account-analysis', {
                        state: { accountId: row.accountId || row.accountCode },
                      });
                    }}
                    onKeyDown={activateOnKey(() => {
                      navigate('/data/gl-account-analysis', {
                        state: { accountId: row.accountId || row.accountCode },
                      });
                    })}
                    tabIndex={0}
                    title="Click to analyze account"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 group-hover:text-blue-400">
                      {row.accountCode}
                    </td>
                    <td className="px-4 py-3 group-hover:text-blue-400">{row.accountName}</td>
                    <td className="px-4 py-3">
                      <Badge variant="default" className="text-[10px]">
                        {row.accountType}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                      {fmt.currency0(row.beginningBalance)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-blue-400">
                      {fmt.currency0(row.debit)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-green-400">
                      {fmt.currency0(row.credit)}
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
                      {fmt.currency0(row.netChange)}
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
                      {fmt.currency0(row.endingBalance)}
                    </td>
                    <td className="px-2 py-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/data/gl-journals', {
                              state: { accountId: row.accountId || row.accountCode },
                            });
                          }}
                          title="View in Journals"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/data/gl-account-analysis', {
                              state: { accountId: row.accountId || row.accountCode },
                            });
                          }}
                          title="Analyze Account"
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-600">
                <tr className="font-bold text-sm text-[var(--text-primary)]">
                  <td className="px-4 py-3" colSpan={3}>
                    Total
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {fmt.currency0(totalBeginningBalance)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-blue-400">
                    {fmt.currency0(totalDebits)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-green-400">
                    {fmt.currency0(totalCredits)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {fmt.currency0(totalNetChange)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {fmt.currency0(totalEndingBalance)}
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
