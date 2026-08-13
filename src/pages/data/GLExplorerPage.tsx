import { useMemo, useState, useTransition } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Database, Download, Search } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useGLStore } from '@/store/glStore';
import { toCSV } from '@/utils/csv';
import { filterGLEntriesByPermission } from '@/utils/dataPermissionFilter';
import { sumMoney, subtractMoney, roundTo, toDecimal } from '@/utils/money';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
/** Money-primitive GL explorer totals (GAP-1 F-0006). */
export interface GLExplorerTotals {
  debits: number;
  credits: number;
}

export function computeGLExplorerTotals(
  entries: readonly { debit: number; credit: number }[]
): GLExplorerTotals {
  return {
    debits: roundTo(sumMoney(entries.map((e) => e.debit)), 2),
    credits: roundTo(sumMoney(entries.map((e) => e.credit)), 2),
  };
}

/** Money-primitive per-account summary row (GAP-1 F-0006). */
export interface GLAccountSummaryRow {
  id: string;
  code: string;
  name: string;
  debit: number;
  credit: number;
  count: number;
  lastDate: string;
  net: number;
  [key: string]: unknown;
}

export function computeAccountSummaries(
  entries: readonly {
    accountId?: string;
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
    date: string;
  }[]
): GLAccountSummaryRow[] {
  const summaries = new Map<
    string,
    {
      code: string;
      name: string;
      debit: ReturnType<typeof toDecimal>;
      credit: ReturnType<typeof toDecimal>;
      count: number;
      lastDate: string;
    }
  >();

  for (const entry of entries) {
    const key = entry.accountId || entry.accountCode;
    const current = summaries.get(key) ?? {
      code: entry.accountCode,
      name: entry.accountName,
      debit: toDecimal(0),
      credit: toDecimal(0),
      count: 0,
      lastDate: entry.date,
    };
    current.debit = current.debit.plus(toDecimal(entry.debit));
    current.credit = current.credit.plus(toDecimal(entry.credit));
    current.count += 1;
    current.lastDate = entry.date > current.lastDate ? entry.date : current.lastDate;
    summaries.set(key, current);
  }

  return Array.from(summaries.entries())
    .map(([id, summary]) => ({
      id,
      code: summary.code,
      name: summary.name,
      debit: roundTo(summary.debit, 2),
      credit: roundTo(summary.credit, 2),
      count: summary.count,
      lastDate: summary.lastDate,
      net: roundTo(subtractMoney(summary.debit, summary.credit), 2),
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

export default function GLExplorerPage() {
  const fmt = useCurrencyFormatter();
  const { entries, accounts } = useGLStore();
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const accountSummaries = useMemo(() => computeAccountSummaries(entries), [entries]);

  const filtered = useMemo(() => {
    let list = filterGLEntriesByPermission([...entries]);
    if (typeFilter !== 'all') {
      list = list.filter((entry) => (entry.accountCode || '').startsWith(typeFilter));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (entry) =>
          entry.accountCode.toLowerCase().includes(q) ||
          entry.description.toLowerCase().includes(q) ||
          entry.accountName.toLowerCase().includes(q) ||
          entry.reference.toLowerCase().includes(q)
      );
    }
    return list
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
      .slice(0, 200);
  }, [entries, typeFilter, search]);

  const totals = useMemo(() => computeGLExplorerTotals(entries), [entries]);

  const exportVisibleRows = () => {
    const csv = toCSV(
      filtered.map((entry) => ({
        Date: entry.date || entry.period,
        Account: entry.accountCode,
        Name: entry.accountName,
        Description: entry.description,
        Debit: entry.debit,
        Credit: entry.credit,
        Reference: entry.reference,
      })),
      ['Date', 'Account', 'Name', 'Description', 'Debit', 'Credit', 'Reference']
    );
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gl-explorer.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center">
        <Database className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No GL Data</h2>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="GL Explorer"
        purpose={
          <>
            Explore {entries.length.toLocaleString()}journal lines across {accounts.length}chart
            accounts and {accountSummaries.length}active GL accounts.
          </>
        }
        actions={
          <Button size="sm" variant="ghost" onClick={exportVisibleRows}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export visible rows
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
              Journal lines
            </div>
            <div className="text-2xl font-bold tabular-nums mt-1">
              {entries.length.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
              Active accounts
            </div>
            <div className="text-2xl font-bold tabular-nums mt-1">
              {accountSummaries.length.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Debits</div>
            <div className="text-2xl font-bold tabular-nums mt-1 text-blue-400">
              {fmt.currency0(totals.debits)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Credits</div>
            <div className="text-2xl font-bold tabular-nums mt-1 text-green-400">
              {fmt.currency0(totals.credits)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
            placeholder="Explore entries..."
            value={search}
            onChange={(e) => startTransition(() => setSearch(e.target.value))}
          />
        </div>
        <select
          className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="1">Assets</option>
          <option value="2">Liabilities</option>
          <option value="3">Equity</option>
          <option value="4">Revenue</option>
          <option value="5">COGS</option>
          <option value="6">Expenses</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm" aria-label="General ledger explorer">
              <caption className="sr-only">Detailed GL general ledger explorer</caption>
              <thead className="sticky top-0 bg-slate-900">
                <tr className="text-left text-slate-400 text-xs uppercase">
                  <th scope="col" className="px-4 py-3">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Account
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Description
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Debit
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Credit
                  </th>
                  <th scope="col" className="px-2 py-3 w-12">
                    Analyze
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-slate-800 ${isPending ? 'opacity-60' : ''}`}>
                {filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-900/50">
                    <td className="px-4 py-2 text-xs text-slate-400">
                      {entry.date || entry.period}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">{entry.accountCode}</td>
                    <td className="px-4 py-2 text-xs max-w-[260px] truncate">
                      {entry.description || '-'}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-blue-400 text-xs">
                      {entry.debit > 0 ? fmt.currency0(entry.debit) : ''}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-green-400 text-xs">
                      {entry.credit > 0 ? fmt.currency0(entry.credit) : ''}
                    </td>
                    <td className="px-2 py-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2"
                        onClick={() =>
                          navigate('/data/gl-account-analysis', {
                            state: { accountId: entry.accountId || entry.accountCode },
                          })
                        }
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-slate-500">
        {entries.length.toLocaleString()} total · showing first {filtered.length.toLocaleString()}
      </p>
    </div>
  );
}
