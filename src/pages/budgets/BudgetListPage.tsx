import { useEffect, useMemo, useState } from 'react';

import { useNavigate, useLocation } from 'react-router-dom';
import { useBudgetStore } from '@/store/budgetStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

import { Card, CardContent } from '@/components/ui/Card';
import { Plus, Search, Copy, Trash2, Eye, Send, CheckCircle, XCircle } from 'lucide-react';
import { AICopilotPanel } from '@/components/ai/AICopilotPanel';
// CHRONOS 2026-06-15: replaced local formatRelativeTime (BUG-CHR-D-1) with
// canonical import. Uses 30-day cap (matches old behavior), "Just now" cap.
import { formatRelativeTimeBudget as formatRelativeTime } from '@/engines/temporal';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';

export default function BudgetListPage() {
  const fmt = useCurrencyFormatter();
  const [_helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — Budget List';
  }, []);

  const { budgets, submitBudget, approveBudget, rejectBudget, deleteBudget, duplicateBudget } =
    useBudgetStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = budgets;
    if (statusFilter !== 'all') list = list.filter((b) => b.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((b) => b.name.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [budgets, statusFilter, search]);

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'default' as const;
      case 'InReview':
        return 'secondary' as const;
      case 'Rejected':
        return 'destructive' as const;
      case 'Locked':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  if (budgets.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-2">No Budgets Yet</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Create your first budget to start planning and tracking financial performance.
        </p>
        <Button onClick={() => navigate('/budgets/create')} aria-label="Create new budget">
          <Plus className="h-4 w-4 mr-2" />
          Create Budget
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Budgets</h1>
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
              aria-label="Help"
            ></button>
          </div>
          <p className="text-sm text-[var(--text-muted)] mt-1">{budgets.length} budgets</p>
        </div>
        <Button onClick={() => navigate('/budgets/create')} aria-label="Create new budget">
          <Plus className="h-4 w-4 mr-2" />
          Create Budget
        </Button>
      </div>

      <div
        className="flex gap-2 items-center flex-wrap"
        role="toolbar"
        aria-label="Filters and search"
      >
        <div className="flex gap-1" role="group" aria-label="Filter by status">
          {['all', 'Draft', 'InReview', 'Approved', 'Locked', 'Rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              aria-pressed={statusFilter === s}
              className={
                'px-2.5 py-1.5 rounded text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ' +
                (statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700')
              }
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500"
            aria-hidden="true"
          />
          <input
            className="w-48 pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search budgets by name"
          />
        </div>
      </div>

      <AICopilotPanel pathname={pathname} defaultCollapsed />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="grid" aria-label="Budgets list">
              <thead>
                <tr
                  className="text-left text-[var(--text-muted)] text-xs uppercase border-b border-slate-800"
                  role="row"
                >
                  <th className="px-4 py-3" role="columnheader" scope="col">
                    Name
                  </th>
                  <th className="px-4 py-3 w-16" role="columnheader" scope="col">
                    Year
                  </th>
                  <th className="px-4 py-3 w-20" role="columnheader" scope="col">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right w-32" role="columnheader" scope="col">
                    Total Amount
                  </th>
                  <th className="px-4 py-3 w-40" role="columnheader" scope="col">
                    Departments
                  </th>
                  <th className="px-4 py-3 w-24" role="columnheader" scope="col">
                    Modified
                  </th>
                  <th className="px-4 py-3 w-44" role="columnheader" scope="col">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.length === 0 ? (
                  <tr role="row">
                    <td colSpan={7} className="text-center py-8 text-slate-500" role="gridcell">
                      {search
                        ? 'No budgets matching "' + search + '"'
                        : 'No budgets with status "' + statusFilter + '"'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-900/50 cursor-pointer"
                      onClick={() => navigate('/budgets/' + b.id)}
                      role="row"
                    >
                      <td className="px-4 py-3 font-medium" role="gridcell">
                        <div className="truncate max-w-[240px]" title={b.name}>
                          {b.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400" role="gridcell">
                        {b.fiscalYear}
                      </td>
                      <td className="px-4 py-3" role="gridcell">
                        <Badge variant={statusBadgeVariant(b.status)} className="text-[10px]">
                          {b.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium" role="gridcell">
                        {fmt.currency0(b.totalAmount || 0)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400" role="gridcell">
                        {(b.departments || []).join(', ') || '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500" role="gridcell">
                        {formatRelativeTime(b.updatedAt)}
                      </td>
                      <td className="px-4 py-3" role="gridcell">
                        <div
                          className="flex gap-1"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          role="presentation"
                        >
                          <button
                            onClick={() => navigate('/budgets/' + b.id)}
                            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                            aria-label="View budget details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {b.status === 'Draft' && (
                            <button
                              onClick={() => {
                                if (window.confirm('Submit this budget for approval?'))
                                  submitBudget(b.id);
                              }}
                              className="p-1.5 rounded hover:bg-blue-700/30 text-slate-400 hover:text-blue-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                              aria-label="Submit budget for approval"
                            >
                              <Send className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {b.status === 'InReview' && (
                            <>
                              <button
                                onClick={() => {
                                  if (window.confirm('Approve this budget?')) approveBudget(b.id);
                                }}
                                className="p-1.5 rounded hover:bg-green-700/30 text-slate-400 hover:text-green-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                                aria-label="Approve budget"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('Reject this budget?')) rejectBudget(b.id);
                                }}
                                className="p-1.5 rounded hover:bg-red-700/30 text-slate-400 hover:text-red-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                                aria-label="Reject budget"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => duplicateBudget(b.id)}
                            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                            aria-label="Duplicate budget"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(b.id)}
                            className="p-1.5 rounded hover:bg-red-700/30 text-slate-400 hover:text-red-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                            aria-label="Delete budget"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="bg-slate-900 rounded-lg p-6 max-w-sm mx-4 border border-slate-700 shadow-xl">
            <h3 className="font-semibold mb-2" id="delete-dialog-title">
              Delete Budget
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Are you sure you want to delete this budget? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteBudget(deleteConfirm);
                  setDeleteConfirm(null);
                }}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
