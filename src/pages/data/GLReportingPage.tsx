import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';

import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FileText, Download, Calendar } from 'lucide-react';
import { sumMoney, subtractMoney, roundTo, toDecimal } from '@/utils/money';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
/** Money-primitive GL reporting account-type totals (GAP-1 F-0006). */
export interface AccountTypeTotalRow {
  debit: number;
  credit: number;
  count: number;
  [key: string]: unknown;
}

/** Money-primitive GL reporting summary (GAP-1 F-0006). */
export interface GLReportingSummary {
  totalEntries: number;
  totalAccounts: number;
  accountsWithEntries: number;
  dateRange: { start: string; end: string } | null;
  typeBreakdown: Record<string, number>;
  accountTypeTotals: Record<string, AccountTypeTotalRow>;
  trialBalanceBalanced: boolean;
}

export function computeGLReportingSummary(
  entries: readonly {
    date: string;
    accountId?: string;
    accountCode: string;
    debit: number;
    credit: number;
  }[],
  accounts: readonly { id: string; code: string; type: string }[],
  trialBalance: readonly { debit: number; credit: number }[]
): GLReportingSummary | null {
  if (entries.length === 0) return null;
  const dates = entries
    .map((e) => e.date)
    .filter(Boolean)
    .sort();
  const accountsWithEntries = new Set(entries.map((e) => e.accountId || e.accountCode));
  // typeBreakdown is a COUNT (not money) — stays as raw number
  const typeBreakdown = accounts.reduce(
    (acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  // accountTypeTotals accumulates money (debit/credit) via toDecimal and count separately
  const accBuf: Record<
    string,
    { debit: ReturnType<typeof toDecimal>; credit: ReturnType<typeof toDecimal>; count: number }
  > = {};
  for (const e of entries) {
    const acct = accounts.find((a) => a.id === e.accountId || a.code === e.accountCode);
    const type = acct?.type || 'Unknown';
    if (!accBuf[type]) accBuf[type] = { debit: toDecimal(0), credit: toDecimal(0), count: 0 };
    accBuf[type]!.debit = accBuf[type]!.debit.plus(toDecimal(e.debit));
    accBuf[type]!.credit = accBuf[type]!.credit.plus(toDecimal(e.credit));
    accBuf[type]!.count++;
  }
  const accountTypeTotals: Record<string, AccountTypeTotalRow> = {};
  for (const [type, buf] of Object.entries(accBuf)) {
    accountTypeTotals[type] = {
      debit: roundTo(buf.debit, 2),
      credit: roundTo(buf.credit, 2),
      count: buf.count,
    };
  }
  const totalDebits = roundTo(sumMoney(trialBalance.map((r) => r.debit)), 2);
  const totalCredits = roundTo(sumMoney(trialBalance.map((r) => r.credit)), 2);
  const diff = roundTo(subtractMoney(totalDebits, totalCredits), 2);
  const lastDate = dates[dates.length - 1];
  return {
    totalEntries: entries.length,
    totalAccounts: accounts.length,
    accountsWithEntries: accountsWithEntries.size,
    dateRange: dates.length >= 2 && lastDate ? { start: dates[0]!, end: lastDate } : null,
    typeBreakdown,
    accountTypeTotals,
    trialBalanceBalanced: trialBalance.length > 0 && Math.abs(diff) < 0.01,
  };
}

export default function GLReportingPage() {
  const fmt = useCurrencyFormatter();
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

  const summary = useMemo(
    () => computeGLReportingSummary(entries, accounts, trialBalance),
    [entries, accounts, trialBalance]
  );

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <FileText className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No GL Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
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
          <PageHeader
            title="GL Reporting"
            actions={
              <button
                onClick={() => setHelpOpen(true)}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
                aria-label="Help"
              ></button>
            }
          />
          <p className="text-sm text-[var(--text-muted)] mt-1">
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
                <div className="text-xs text-[var(--text-muted)] mb-1">Total Entries</div>
                <div className="text-xl font-bold">{summary.totalEntries.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-xs text-[var(--text-muted)] mb-1">Accounts Used</div>
                <div className="text-xl font-bold">
                  {summary.accountsWithEntries.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-xs text-[var(--text-muted)] mb-1">Total Accounts</div>
                <div className="text-xl font-bold">{summary.totalAccounts.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-xs text-[var(--text-muted)] mb-1">Trial Balance</div>
                <div className="text-xl font-bold">
                  {summary.trialBalanceBalanced ? (
                    <span className="text-green-400">Balanced</span>
                  ) : (
                    <span className="text-[var(--text-muted)]">—</span>
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
                <p className="text-sm text-[var(--text-muted)]">Date information not available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Account Type Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="GL reporting">
                  <caption className="sr-only">Detailed GL gl reporting</caption>
                  <thead>
                    <tr className="text-left text-[var(--text-muted)] text-xs uppercase border-b border-slate-800">
                      <th scope="col" className="pb-3 pr-4">
                        Account Type
                      </th>
                      <th scope="col" className="pb-3 pr-4 text-right">
                        Accounts
                      </th>
                      <th scope="col" className="pb-3 pr-4 text-right">
                        Total Debits
                      </th>
                      <th scope="col" className="pb-3 pr-4 text-right">
                        Total Credits
                      </th>
                      <th scope="col" className="pb-3 pr-4 text-right">
                        Net
                      </th>
                      <th scope="col" className="pb-3 pr-4 text-right">
                        Transactions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {Object.entries(summary.accountTypeTotals).map(([type, data]) => {
                      const net = roundTo(subtractMoney(data.debit, data.credit), 2);
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
                            {fmt.currency0(data.debit)}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums text-green-400">
                            {fmt.currency0(data.credit)}
                          </td>
                          <td
                            className={`py-3 pr-4 text-right tabular-nums font-medium ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}
                          >
                            {fmt.currency0(net)}
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
