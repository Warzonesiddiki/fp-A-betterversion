/* eslint-disable jsx-a11y/label-has-associated-control */
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';

import { useNavigate, useLocation } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';

import { Button } from '@/components/ui/Button';

import { Select } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { BookOpen, ChevronLeft, ChevronRight, Download, Search, BarChart3 } from 'lucide-react';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function getFirstDayOfMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return y + '-' + m + '-01';
}

function getLastDayOfMonth(): string {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const y = lastDay.getFullYear();
  const m = String(lastDay.getMonth() + 1).padStart(2, '0');
  const d = String(lastDay.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

export default function GLJournalsPage() {
  const [_helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — G L Journals';
  }, []);

  const { entries, accounts } = useGLStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getLastDayOfMonth());
  const [accountFilter, setAccountFilter] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  // Section 012: Support deep link from Trial Balance / Analysis
  useEffect(() => {
    const rawState: unknown = location.state;
    const state =
      rawState && typeof rawState === 'object' ? (rawState as Record<string, unknown>) : {};
    const accountId = typeof state.accountId === 'string' ? state.accountId : undefined;
    if (accountId) {
      const account = accounts.find((a) => a.id === accountId || a.code === accountId);
      if (account) {
        setAccountFilter([account.id]);
      } else {
        setAccountFilter([accountId]);
      }
      const start = typeof state.startDate === 'string' ? state.startDate : undefined;
      const end = typeof state.endDate === 'string' ? state.endDate : undefined;
      if (start) setStartDate(start);
      if (end) setEndDate(end);
    }
  }, [accounts, location.state]);

  const accountOptions = useMemo(
    () => [
      { value: '', label: 'All Accounts' },
      ...accounts.map((a) => ({ value: a.id, label: `${a.code} ${a.name}` })),
    ],
    [accounts]
  );

  const filtered = useMemo(() => {
    let list = entries.filter((e) => e.date >= startDate && e.date <= endDate);
    if (accountFilter.length > 0 && accountFilter[0]!) {
      list = list.filter((e) => accountFilter.includes(e.accountId));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) => e.description?.toLowerCase().includes(q) || e.reference?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  }, [entries, startDate, endDate, accountFilter, search]);

  const pageItems = useMemo(
    () => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filtered, page]
  );

  const totals = useMemo(() => {
    const debits = filtered.reduce((s, e) => s + e.debit, 0);
    const credits = filtered.reduce((s, e) => s + e.credit, 0);
    return { debits, credits, isBalanced: Math.abs(debits - credits) < 0.01 };
  }, [filtered]);

  // B2 Enhancement: Export journals
  const exportJournals = useCallback(() => {
    const csv = ['Date,Account,Description,Debit,Credit,Reference'];
    filtered.forEach((e) => {
      csv.push(
        [
          e.date,
          e.accountCode,
          `"${(e.description || '').replace(/"/g, '""')}"`,
          e.debit,
          e.credit,
          e.reference || '',
        ].join(',')
      );
    });
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journals-${startDate}-to-${endDate}.csv`;
    a.click();
  }, [filtered, startDate, endDate]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <BookOpen className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Journal Entries</h2>
        <p className="text-slate-400 mb-6">
          Import your General Ledger data to view journal entries.
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
            <h1 className="text-2xl font-bold">General Journal</h1>
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
              aria-label="Help"
            ></button>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {entries.length.toLocaleString()} total entries
            {filtered.length !== entries.length &&
              ` · ${filtered.length.toLocaleString()} filtered`}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={exportJournals}>
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">From</label>
              <input
                type="date"
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(0);
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">To</label>
              <input
                type="date"
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(0);
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Account</label>
              <Select
                options={accountOptions}
                value={accountFilter[0] || ''}
                onChange={(v) => {
                  setAccountFilter(v ? [v] : []);
                  setPage(0);
                }}
                placeholder="All accounts"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  className="w-48 pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Description or ref..."
                  value={search}
                  onChange={(e) =>
                    startTransition(() => {
                      setSearch(e.target.value);
                      setPage(0);
                    })
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="GL journal entries">
              <caption className="sr-only">Detailed GL gl journal entries</caption>
              <thead>
                <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-800">
                  <th scope="col" className="px-4 py-3 w-24">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3 w-20">
                    Account
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Description
                  </th>
                  <th scope="col" className="px-4 py-3 text-right w-28">
                    Debit
                  </th>
                  <th scope="col" className="px-4 py-3 text-right w-28">
                    Credit
                  </th>
                  <th scope="col" className="px-4 py-3 w-24">
                    Reference
                  </th>
                  <th scope="col" className="px-2 py-3 w-12">
                    {/* Analyze */}
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-slate-800 ${isPending ? 'opacity-60' : ''}`}>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      No entries match the current filters.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-900/50">
                      <td className="px-4 py-3 text-xs text-slate-400">{e.date}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-300">
                        {e.accountCode}
                      </td>
                      <td
                        className="px-4 py-3 max-w-[240px] truncate text-slate-200"
                        title={e.description}
                      >
                        {e.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-blue-400">
                        {e.debit > 0 ? formatCurrency(e.debit) : ''}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-green-400">
                        {e.credit > 0 ? formatCurrency(e.credit) : ''}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{e.reference || '-'}</td>
                      <td className="px-2 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2"
                          onClick={() => {
                            navigate('/data/gl-account-analysis', {
                              state: { accountId: e.accountId || e.accountCode },
                            });
                          }}
                          title="Analyze Account"
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {pageItems.length > 0 && (
                <tfoot className="border-t-2 border-slate-600">
                  <tr className="font-bold text-sm text-slate-200">
                    <td className="px-4 py-3" colSpan={3}>
                      Total ({filtered.length.toLocaleString()} entries)
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-blue-400">
                      {formatCurrency(totals.debits)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-green-400">
                      {formatCurrency(totals.credits)}
                    </td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">
            Showing {page * PAGE_SIZE + 1}–
            {Math.min((page + 1) * PAGE_SIZE, filtered.length).toLocaleString()} of{' '}
            {filtered.length.toLocaleString()}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
