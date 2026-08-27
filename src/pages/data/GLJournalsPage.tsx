// @money-ast-allow Reason: Pagination index: totalPages - 1 is a page-number calculation, not money

// K30 four-states honesty note: entries/accounts come from synchronous Zustand
// store reads, so this page renders NO loading skeleton — one would fake
// asynchrony that does not exist (same honesty test as ScenarioBuilderPage).
// In-flight filtering feedback stays on the real useTransition pending state.
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { PageHeader } from '@/components/ui/PageHeader';

import { useNavigate, useLocation } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';

import { Button } from '@/components/ui/Button';

import { Select } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { toCSV } from '@/utils/csv';
import { filterGLEntriesByPermission } from '@/utils/dataPermissionFilter';
import { sumMoney, subtractMoney, roundTo } from '@/utils/money';
import { BookOpen, ChevronLeft, ChevronRight, Download, Search, BarChart3 } from 'lucide-react';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
/** Money-primitive journal totals (GAP-1 F-0006). */
export interface GLJournalTotals {
  debits: number;
  credits: number;
  isBalanced: boolean;
}

export function computeJournalTotals(
  entries: readonly { debit: number; credit: number }[]
): GLJournalTotals {
  const debits = roundTo(sumMoney(entries.map((e) => e.debit)), 2);
  const credits = roundTo(sumMoney(entries.map((e) => e.credit)), 2);
  const diff = roundTo(subtractMoney(debits, credits), 2);
  return { debits, credits, isBalanced: Math.abs(diff) < 0.01 };
}

export default function GLJournalsPage() {
  const fmt = useCurrencyFormatter();
  // K30 four-states: the only fallible action on this page is the CSV export
  // (blob creation / download); its failure renders ErrorState with a retry
  // that re-runs exactly that export.
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'FinPlan Pro — G L Journals';
  }, []);

  const { entries, accounts } = useGLStore(
    useShallow((s) => ({ entries: s.entries, accounts: s.accounts }))
  );
  const navigate = useNavigate();
  const location = useLocation();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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

  // Radix Select forbids items with an empty-string value; the "no filter"
  // state is carried by the control's own placeholder instead.
  const accountOptions = useMemo(
    () => accounts.map((a) => ({ value: a.id, label: `${a.code} ${a.name}` })),
    [accounts]
  );

  const filtered = useMemo(() => {
    let list = filterGLEntriesByPermission([...entries]);
    if (startDate) list = list.filter((e) => e.date >= startDate);
    if (endDate) list = list.filter((e) => e.date <= endDate);
    if (accountFilter.length > 0 && accountFilter[0]!) {
      list = list.filter((e) =>
        accountFilter.some((account) =>
          [e.accountId, e.accountCode, e.accountName].some((value) => value === account)
        )
      );
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

  const totals = useMemo(() => computeJournalTotals(filtered), [filtered]);

  // B2 Enhancement: Export journals
  const exportJournals = useCallback(() => {
    setExportError(null);
    try {
      const csv = toCSV(
        filtered.map((e) => ({
          Date: e.date,
          Account: e.accountCode,
          Description: e.description,
          Debit: e.debit,
          Credit: e.credit,
          Reference: e.reference,
        })),
        ['Date', 'Account', 'Description', 'Debit', 'Credit', 'Reference']
      );
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `journals-${startDate || 'all'}-to-${endDate || 'all'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      // K30 four-states: the failed export is surfaced verbatim; the ErrorState
      // retry control re-runs this exact callback over the same filter result.
      setExportError(err instanceof Error ? err.message : 'Failed to generate the journals CSV');
    }
  }, [filtered, startDate, endDate]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  if (entries.length === 0) {
    // K30 four-states: shared EmptyState under the page-level h1 (PageHeader
    // stays mounted in this branch). The CTA re-enters the import flow; no
    // demo journal rows are invented.
    return (
      <div className="p-6 space-y-6 max-w-7xl" aria-labelledby="gl-journals-heading">
        <PageHeader
          title="General Journal"
          titleId="gl-journals-heading"
          purpose="Every posted General Ledger line, filterable by date, account and text, with running debit and credit totals."
        />
        <EmptyState
          variant="no-data"
          title="No journal entries"
          description="Import your General Ledger data to view journal entries."
          icon={<BookOpen className="h-12 w-12 text-[var(--text-muted)]" aria-hidden="true" />}
          action={
            <Button onClick={() => navigate('/data/gl-upload')} data-testid="journals-empty-import">
              Import Data
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" aria-labelledby="gl-journals-heading">
      {exportError && (
        // K30 four-states: shared ErrorState (role=alert) whose retry control
        // re-runs exactly the failed CSV export over the same filtered rows.
        <ErrorState
          title="Could not export journals"
          message={exportError}
          onRetry={exportJournals}
          retryLabel="Retry export"
          className="py-8"
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <PageHeader
            title="General Journal"
            titleId="gl-journals-heading"
            purpose="Every posted General Ledger line, filterable by date, account and text, with running debit and credit totals."
          />
          <p className="text-sm text-[var(--text-muted)] mt-1">
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
              <label
                htmlFor="from"
                className="block text-xs font-medium text-[var(--text-muted)] mb-1"
              >
                From
              </label>
              <input
                id="from"
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
              <label
                htmlFor="to"
                className="block text-xs font-medium text-[var(--text-muted)] mb-1"
              >
                To
              </label>
              <input
                id="to"
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
              <label
                htmlFor="account"
                className="block text-xs font-medium text-[var(--text-muted)] mb-1"
              >
                Account
              </label>
              <Select
                id="account"
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
              <label
                htmlFor="search"
                className="block text-xs font-medium text-[var(--text-muted)] mb-1"
              >
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
                <input
                  id="search"
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
                <tr className="text-left text-[var(--text-muted)] text-xs uppercase border-b border-slate-800">
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
              {/* K30 a11y: the in-flight filter dimming is mirrored to AT via
                  aria-busy so pending re-filtering is machine-readable, not
                  just visual opacity. */}
              <tbody
                className={`divide-y divide-slate-800 ${isPending ? 'opacity-60' : ''}`}
                aria-busy={isPending || undefined}
                data-testid="journals-tbody"
              >
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-[var(--text-muted)]">
                      <span role="status" aria-live="polite">
                        No entries match the current filters.
                      </span>
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
                        {e.debit > 0 ? fmt.currency0(e.debit) : ''}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-green-400">
                        {e.credit > 0 ? fmt.currency0(e.credit) : ''}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                        {e.reference || '-'}
                      </td>
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
                  <tr className="font-bold text-sm text-[var(--text-primary)]">
                    <td className="px-4 py-3" colSpan={3}>
                      Total ({filtered.length.toLocaleString()} entries)
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-blue-400">
                      {fmt.currency0(totals.debits)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-green-400">
                      {fmt.currency0(totals.credits)}
                    </td>
                    <td className="px-4 py-3" colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-muted)]">
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
