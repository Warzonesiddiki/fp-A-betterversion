import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useBudgetStore } from '@/store/budgetStore';
import { useGLStore } from '@/store/glStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { FinPlanGrid } from '@/components/ui/FinPlanGrid';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Lock,
  Unlock,
  Save,
  Send,
  CheckCircle,
  XCircle,
  History,
  MessageSquare,
  Table as TableIcon,
  Grid3X3,
  Camera,
  RotateCcw,
} from 'lucide-react';
import { roundTo, sumMoney } from '@/utils/money';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';

/**
 * GAP-1 (F-0006) — exact-decimal budget-detail totals.
 *
 * Per-account-group totals, the grand total, and per-month column totals
 * were raw float reduce; they feed the header grand total, the per-group
 * "Total" column, and the tfoot row. Counts/flags stay integer.
 */
export interface BudgetLineLike {
  amount: number;
}
export function sumLineItems<T extends BudgetLineLike>(items: readonly T[]): number {
  return roundTo(sumMoney(items.map((li) => li.amount)));
}
export function computeMonthColumnTotal(
  groups: readonly { items: readonly BudgetLineLike[] }[],
  monthIdx: number
): number {
  return roundTo(sumMoney(groups.map((g) => g.items[monthIdx]?.amount ?? 0)));
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Snapshot {
  id: string;
  name: string;
  timestamp: string;
  data: unknown;
}

interface CommentEntry {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  cellId?: string;
}

interface AuditEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string;
}

export default function BudgetDetailPage() {
  const fmt = useCurrencyFormatter();
  const [_helpOpen, setHelpOpen] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    document.title = 'FinPlan Pro — Budget Detail';
  }, []);

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    budgets,
    lineItems,
    activeBudgetId,
    setActiveBudget,
    updateLineItem,
    updateBudget,
    undo,
    redo,
    historyIndex,
    history,
    submitBudget,
    approveBudget,
    rejectBudget,
    // W-K30-001 (2): gate the not-found flash while the store hydrates.
    isLoading: budgetLoading,
  } = useBudgetStore();
  // W-K30-001 (2): the only error channel exposed by the underlying stores is
  // the GL import error (budgetStore persists no error field); a failed GL
  // import strips account names/codes from this workspace, so it is surfaced.
  const { accounts, importError } = useGLStore();

  const budget = budgets.find((b) => b.id === id);

  useEffect(() => {
    if (id && id !== activeBudgetId) {
      setActiveBudget(id);
    }
  }, [id, activeBudgetId, setActiveBudget]);

  const [editCell, setEditCell] = useState<{ lineItemId: string; month: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showSnapshotsModal, setShowSnapshotsModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'comments' | 'audit'>('comments');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [snapshotName, setSnapshotName] = useState('');
  const [comments, setComments] = useState<CommentEntry[]>([]);
  const [newComment, setNewComment] = useState('');
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([
    { id: 'a1', action: 'Budget created', user: 'Admin', timestamp: new Date().toISOString() },
  ]);

  const budgetLineItems = useMemo(() => {
    return lineItems.filter((li) => li.budgetId === id);
  }, [lineItems, id]);

  const groupedByAccount = useMemo(() => {
    const map = new Map<string, typeof lineItems>();
    for (const li of budgetLineItems) {
      const existing = map.get(li.accountId) || [];
      existing.push(li);
      map.set(li.accountId, existing);
    }
    return Array.from(map.entries()).map(([accountId, items]) => {
      const sorted = [...items].sort((a, b) => a.month - b.month);
      return {
        accountId,
        accountName:
          sorted[0]?.accountName || accounts.find((a) => a.id === accountId)?.name || accountId,
        accountCode: sorted[0]?.accountCode || accounts.find((a) => a.id === accountId)?.code || '',
        items: sorted,
        total: sumLineItems(sorted),
      };
    });
  }, [budgetLineItems, accounts]);

  const grandTotal = useMemo(
    () => roundTo(sumMoney(groupedByAccount.map((g) => g.total))),
    [groupedByAccount]
  );

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const isLocked = budget?.status === 'Locked' || budget?.status === 'Approved';
  const isAdmin = user?.role === 'Admin';

  const handleCellClick = useCallback((lineItemId: string, month: number, currentValue: number) => {
    setEditCell({ lineItemId, month });
    setEditValue(String(currentValue));
  }, []);

  const handleCellSave = useCallback(() => {
    if (editCell) {
      const val = parseFloat(editValue) || 0;
      updateLineItem(editCell.lineItemId, { amount: val });
      setAuditLog((prev) => [
        ...prev,
        {
          id: `audit-${Date.now()}`,
          action: `Edited cell ${editCell.lineItemId} → ${val}`,
          user: user?.firstName || 'User',
          timestamp: new Date().toISOString(),
        },
      ]);
      setEditCell(null);
    }
  }, [editCell, editValue, updateLineItem, user]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleCellSave();
      if (e.key === 'Escape') setEditCell(null);
    },
    [handleCellSave]
  );

  const handleCreateSnapshot = useCallback(() => {
    if (!snapshotName.trim()) return;
    const snap: Snapshot = {
      id: `snap-${Date.now()}`,
      name: snapshotName.trim(),
      timestamp: new Date().toISOString(),
      data: JSON.parse(JSON.stringify(budgetLineItems)),
    };
    setSnapshots((prev) => [snap, ...prev]);
    setSnapshotName('');
    setAuditLog((prev) => [
      ...prev,
      {
        id: `audit-${Date.now()}`,
        action: `Created snapshot "${snap.name}"`,
        user: user?.firstName || 'User',
        timestamp: new Date().toISOString(),
      },
    ]);
  }, [snapshotName, budgetLineItems, user]);

  const handleRestoreSnapshot = useCallback(
    (snapId: string) => {
      const snap = snapshots.find((s) => s.id === snapId);
      if (!snap) return;
      const data = snap.data as typeof budgetLineItems;
      data.forEach((li) => {
        updateLineItem(li.id, { amount: li.amount });
      });
      setAuditLog((prev) => [
        ...prev,
        {
          id: `audit-${Date.now()}`,
          action: `Restored snapshot "${snap.name}"`,
          user: user?.firstName || 'User',
          timestamp: new Date().toISOString(),
        },
      ]);
      setShowSnapshotsModal(false);
    },
    [snapshots, updateLineItem, user]
  );

  const handleAddComment = useCallback(() => {
    if (!newComment.trim()) return;
    setComments((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        text: newComment.trim(),
        author: user?.firstName || 'User',
        timestamp: new Date().toISOString(),
      },
    ]);
    setNewComment('');
  }, [newComment, user]);

  const handleApprove = useCallback(() => {
    if (!budget) return;
    approveBudget(budget.id);
    // Auto-lock on approval
    updateBudget(budget.id, { status: 'Approved' } as never);
    setAuditLog((prev) => [
      ...prev,
      {
        id: `audit-${Date.now()}`,
        action: 'Approved budget (auto-locked)',
        user: user?.firstName || 'User',
        timestamp: new Date().toISOString(),
      },
    ]);
  }, [budget, approveBudget, updateBudget, user]);

  const handleRejectConfirm = useCallback(() => {
    if (!budget || !rejectReason.trim()) return;
    rejectBudget(budget.id);
    setComments((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        text: `Rejected: ${rejectReason.trim()}`,
        author: user?.firstName || 'User',
        timestamp: new Date().toISOString(),
      },
    ]);
    setAuditLog((prev) => [
      ...prev,
      {
        id: `audit-${Date.now()}`,
        action: `Rejected: ${rejectReason.trim()}`,
        user: user?.firstName || 'User',
        timestamp: new Date().toISOString(),
      },
    ]);
    setShowRejectModal(false);
    setRejectReason('');
  }, [budget, rejectBudget, rejectReason, user]);

  const handleLockToggle = useCallback(() => {
    if (!budget || !isAdmin) return;
    const newStatus = budget.status === 'Locked' ? 'Approved' : 'Locked';
    updateBudget(budget.id, { status: newStatus } as never);
    setAuditLog((prev) => [
      ...prev,
      {
        id: `audit-${Date.now()}`,
        action: newStatus === 'Locked' ? 'Locked budget' : 'Unlocked budget',
        user: user?.firstName || 'User',
        timestamp: new Date().toISOString(),
      },
    ]);
  }, [budget, isAdmin, updateBudget, user]);

  const gridColumns = useMemo(
    () => [
      {
        field: 'account',
        headerName: 'Account',
        pinned: 'left' as const,
        width: 200,
        editable: false,
        type: 'text' as const,
      },
      ...MONTHS.map((m) => ({
        field: m.toLowerCase(),
        headerName: m,
        type: 'currency' as const,
        width: 110,
        editable: !isLocked,
      })),
      {
        field: 'total',
        headerName: 'Total',
        type: 'currency' as const,
        width: 130,
        editable: false,
      },
    ],
    [isLocked]
  );

  const gridRows = useMemo(() => {
    return groupedByAccount.map((group) => {
      const row: Record<string, unknown> = {
        id: group.accountId,
        account: `${group.accountCode} ${group.accountName}`,
        accountId: group.accountId,
        total: group.total,
      };
      MONTHS.forEach((m, idx) => {
        const li = group.items[idx];
        row[m.toLowerCase()] = li?.amount ?? 0;
        row[`${m.toLowerCase()}Id`] = li?.id ?? `${group.accountId}-${idx}`;
      });
      return row;
    });
  }, [groupedByAccount]);

  const handleGridCellChanged = useCallback(
    (event: { data: Record<string, unknown>; colDef: { field?: string }; newValue: unknown }) => {
      const field = event.colDef.field;
      if (!field || field === 'account' || field === 'total') return;
      const lineItemId = event.data[`${field}Id`] as string;
      const newVal =
        typeof event.newValue === 'number'
          ? event.newValue
          : parseFloat(String(event.newValue)) || 0;
      if (lineItemId && !lineItemId.includes('-')) {
        // ignore synthetic ids
      }
      // Find matching lineItem by id if it's a real id
      const targetId = event.data[`${field}Id`] as string;
      if (targetId) {
        updateLineItem(targetId, { amount: newVal });
        setAuditLog((prev) => [
          ...prev,
          {
            id: `audit-${Date.now()}`,
            action: `Grid edit ${field} → ${newVal}`,
            user: user?.firstName || 'User',
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    },
    [updateLineItem, user]
  );

  if (user?.role === 'Viewer') {
    return (
      <div className="p-12 text-center">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Access Restricted</h2>
        <p className="text-[var(--text-muted)] mb-6">Viewers cannot access the budget editor.</p>
        <Link to="/dashboard" className="text-blue-400 hover:underline font-medium">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (budgetLoading) {
    // W-K30-001 (2): skeleton while the budget store hydrates, so a cold
    // start does not flash "Budget Not Found" for an existing id. The static
    // PageHeader keeps an h1 in the document during this branch.
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Budget Detail" purpose="Budget line-item editor" />
        <div data-testid="budget-detail-loading" className="space-y-4">
          <Skeleton count={1} height="40px" width="40%" />
          <Skeleton count={1} variant="card" height="160px" />
          <Skeleton count={4} variant="text" height="24px" />
        </div>
      </div>
    );
  }

  if (importError) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Budget Detail" purpose="Budget line-item editor" />
        <ErrorState
          title="Failed to load budget workspace"
          message={importError}
          errorCode="GL-IMPORT-ERROR"
          onRetry={() => window.location.reload()}
          retryLabel="Retry"
          secondaryAction={{ label: 'Back to Budgets', onClick: () => navigate('/budgets') }}
        />
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-xl font-semibold mb-2">Budget Not Found</h2>
        <p className="text-[var(--text-muted)] mb-4">
          The budget you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button onClick={() => navigate('/budgets')}>Back to Budgets</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/budgets')}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
            aria-label="Back to budgets"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <PageHeader
              title={budget.name}
              actions={
                <button
                  onClick={() => setHelpOpen(true)}
                  className="p-2 hover:bg-slate-800 rounded-full text-[var(--text-muted)] hover:text-white transition-colors"
                  aria-label="Help"
                ></button>
              }
            />
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              FY{budget.fiscalYear} · {budgetLineItems.length} line items ·{' '}
              {fmt.currency0(grandTotal)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              budget.status === 'Approved'
                ? 'default'
                : budget.status === 'InReview'
                  ? 'secondary'
                  : budget.status === 'Rejected'
                    ? 'destructive'
                    : 'outline'
            }
          >
            {budget.status}
          </Badge>
          <button
            onClick={undo}
            disabled={!canUndo}
            className={
              'p-2 rounded-lg transition-colors ' +
              (canUndo ? 'hover:bg-slate-800 text-slate-400' : 'text-slate-700 cursor-not-allowed')
            }
            title="Undo"
            aria-label="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={
              'p-2 rounded-lg transition-colors ' +
              (canRedo ? 'hover:bg-slate-800 text-slate-400' : 'text-slate-700 cursor-not-allowed')
            }
            title="Redo"
            aria-label="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </button>
          {budget.status === 'Draft' && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (window.confirm('Submit this budget for approval?')) submitBudget(budget.id);
                }}
                title="Submit for approval"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Submit
              </Button>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleLockToggle}
                  title={isLocked ? 'Unlock budget' : 'Lock budget'}
                  data-testid="lock-toggle"
                >
                  {isLocked ? (
                    <Unlock className="h-3.5 w-3.5 mr-1.5" />
                  ) : (
                    <Lock className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {isLocked ? 'Unlock' : 'Lock'}
                </Button>
              )}
            </>
          )}
          {budget.status === 'InReview' && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleApprove}
                className="text-green-400"
                data-testid="approve-budget"
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowRejectModal(true)}
                className="text-red-400"
                data-testid="reject-budget"
              >
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                Reject
              </Button>
            </>
          )}
          {(budget.status === 'Approved' || budget.status === 'Locked') && isAdmin && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleLockToggle}
              data-testid="lock-toggle"
              aria-label={budget.status === 'Locked' ? 'Unlock budget' : 'Lock budget'}
            >
              {budget.status === 'Locked' ? (
                <>
                  <Unlock className="h-3.5 w-3.5 mr-1.5" /> Unlock
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5 mr-1.5" /> Lock
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div
          className="inline-flex rounded-lg border border-slate-700 p-1 bg-slate-900"
          role="group"
          aria-label="View mode"
        >
          <button
            onClick={() => setViewMode('grid')}
            aria-pressed={viewMode === 'grid'}
            data-testid="view-mode-grid"
            className={
              'px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 transition-colors ' +
              (viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white')
            }
          >
            <Grid3X3 className="h-4 w-4" /> Grid Editor
          </button>
          <button
            onClick={() => setViewMode('table')}
            aria-pressed={viewMode === 'table'}
            data-testid="view-mode-table"
            className={
              'px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 transition-colors ' +
              (viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white')
            }
          >
            <TableIcon className="h-4 w-4" /> Table
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowSnapshotsModal(true)}
            data-testid="open-snapshots"
          >
            <Camera className="h-4 w-4 mr-1.5" /> Snapshots ({snapshots.length})
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowSidebar((v) => !v)}
            data-testid="toggle-sidebar"
            aria-expanded={showSidebar}
          >
            <MessageSquare className="h-4 w-4 mr-1.5" /> {showSidebar ? 'Hide' : 'Comments & Audit'}
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0 space-y-6">
          {viewMode === 'grid' ? (
            <Card>
              <CardContent className="p-0">
                <div className="p-3 flex items-center justify-between border-b border-slate-800">
                  <span className="text-sm font-semibold text-[var(--text-secondary)]">
                    Professional Grid Editor
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    AG Grid · editable currency cells · drag-fill · Ctrl+C/V · F2 to edit
                  </span>
                </div>
                <FinPlanGrid
                  preset="spreadsheet"
                  columns={gridColumns}
                  rows={gridRows}
                  onCellValueChanged={handleGridCellChanged as never}
                  showToolbar
                  showFormulaBar
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm" aria-label="Budget detail line items">
                  <caption className="sr-only">
                    Detailed breakdown of budget detail line items
                  </caption>
                  <thead>
                    <tr className="text-left text-[var(--text-muted)] text-xs uppercase border-b border-slate-800">
                      <th scope="col" className="px-4 py-3 w-24 sticky left-0 bg-slate-900 z-10">
                        Account
                      </th>
                      {MONTHS.map((m) => (
                        <th key={m} className="px-2 py-3 text-right w-24" scope="col">
                          {m}
                        </th>
                      ))}
                      <th scope="col" className="px-4 py-3 text-right w-28">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {groupedByAccount.length === 0 ? (
                      <tr>
                        <td colSpan={14}>
                          {/* W-K30-001 (2): was a bare "No line items…" cell.
                              The page h1 comes from PageHeader above, so the
                              EmptyState h3 keeps heading order intact. */}
                          <EmptyState
                            variant="no-data"
                            title="No line items yet"
                            description="This budget has no line items yet. Open the grid editor to add your first row."
                            action={
                              <Button
                                size="sm"
                                onClick={() => setViewMode('grid')}
                                data-testid="add-first-line-item"
                              >
                                Add first line item
                              </Button>
                            }
                          />
                        </td>
                      </tr>
                    ) : (
                      groupedByAccount.map((group) => (
                        <tr key={group.accountId} className="hover:bg-slate-900/50">
                          <td className="px-4 py-2 sticky left-0 bg-slate-900 z-10">
                            <div className="text-xs font-mono text-slate-400">
                              {group.accountCode}
                            </div>
                            <div
                              className="text-sm truncate max-w-[160px]"
                              title={group.accountName}
                            >
                              {group.accountName}
                            </div>
                          </td>
                          {MONTHS.map((m, idx) => {
                            const li = group.items[idx];
                            if (!li)
                              return (
                                <td key={m} className="px-2 py-2 text-right text-slate-600">
                                  -
                                </td>
                              );
                            const isEditing =
                              editCell?.lineItemId === li.id && editCell?.month === li.month;
                            return (
                              <td key={m} className="px-2 py-2 text-right">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    className="w-full bg-blue-900/30 border border-blue-500 rounded px-2 py-1 text-right text-sm tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={handleCellSave}
                                    onKeyDown={handleKeyDown}
                                    // eslint-disable-next-line jsx-a11y/no-autofocus -- intentional: inline cell editing
                                    autoFocus
                                  />
                                ) : (
                                  <button
                                    className={
                                      'w-full text-right px-2 py-1 rounded tabular-nums hover:bg-blue-900/20 transition-colors ' +
                                      (li.isLocked || isLocked
                                        ? 'text-[var(--text-muted)]'
                                        : 'text-[var(--text-primary)]')
                                    }
                                    onClick={() =>
                                      !(li.isLocked || isLocked) &&
                                      handleCellClick(li.id, li.month, li.amount)
                                    }
                                    title={li.isLocked || isLocked ? 'Locked' : 'Click to edit'}
                                  >
                                    {li.amount
                                      ? new Intl.NumberFormat('en-US', {
                                          minimumFractionDigits: 0,
                                        }).format(li.amount)
                                      : '-'}
                                  </button>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-4 py-2 text-right font-medium tabular-nums">
                            {fmt.currency0(group.total)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-600">
                    <tr className="font-bold text-sm">
                      <td className="px-4 py-3 sticky left-0 bg-slate-900 z-10">Total</td>
                      {MONTHS.map((m, idx) => {
                        const monthTotal = computeMonthColumnTotal(groupedByAccount, idx);
                        return (
                          <td key={m} className="px-2 py-3 text-right tabular-nums">
                            {fmt.currency0(monthTotal)}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right tabular-nums">
                        {fmt.currency0(grandTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <History className="h-4 w-4 text-[var(--text-muted)]" />
                  Version History
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  {history.length} version snapshots · position {historyIndex + 1} of{' '}
                  {history.length}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2"
                  onClick={() => setShowSnapshotsModal(true)}
                  data-testid="view-snapshots"
                >
                  Manage Snapshots
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <Lock className="h-4 w-4 text-[var(--text-muted)]" />
                  Cell Locking
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  {budgetLineItems.filter((li) => li.isLocked).length} cells locked ·{' '}
                  {isLocked ? 'budget locked' : 'editing enabled'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-semibold mb-1">Approval</div>
                {budget.status === 'Draft' && (
                  <p className="text-xs text-[var(--text-muted)]">Not yet submitted</p>
                )}
                {budget.status === 'InReview' && (
                  <p className="text-xs text-yellow-400">Pending approval</p>
                )}
                {budget.status === 'Approved' && (
                  <div>
                    <p className="text-xs text-green-400">Approved (Locked)</p>
                    {budget.approvedAt && (
                      <p className="text-xs text-[var(--text-muted)]">
                        {new Date(budget.approvedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
                {budget.status === 'Rejected' && <p className="text-xs text-red-400">Rejected</p>}
                {budget.status === 'Locked' && <p className="text-xs text-orange-400">Locked</p>}
              </CardContent>
            </Card>
          </div>
        </div>

        {showSidebar && (
          <div
            className="w-80 border-l border-slate-800 bg-slate-900/50 p-4 space-y-4"
            data-testid="budget-sidebar"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Cell Comments & Audit Trail</h3>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-1 hover:bg-slate-800 rounded"
                aria-label="Close sidebar"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setSidebarTab('comments')}
                data-testid="tab-comments"
                className={
                  'px-3 py-1 text-xs rounded ' +
                  (sidebarTab === 'comments'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400')
                }
              >
                Comments
              </button>
              <button
                onClick={() => setSidebarTab('audit')}
                data-testid="tab-audit"
                className={
                  'px-3 py-1 text-xs rounded ' +
                  (sidebarTab === 'audit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400')
                }
              >
                Audit Trail
              </button>
            </div>
            {sidebarTab === 'comments' ? (
              <div className="space-y-3" data-testid="comments-tab">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {comments.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)]">No comments yet.</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="p-2 bg-slate-800 rounded text-xs">
                        <div className="font-semibold">{c.author}</div>
                        <div className="text-slate-300">{c.text}</div>
                        <div className="text-[var(--text-muted)] text-[10px]">
                          {new Date(c.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
                    data-testid="comment-input"
                  />
                  <Button size="sm" onClick={handleAddComment} data-testid="add-comment">
                    Add
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto" data-testid="audit-tab">
                {auditLog.map((entry) => (
                  <div key={entry.id} className="p-2 bg-slate-800 rounded text-xs">
                    <div className="text-slate-300">{entry.action}</div>
                    <div className="text-[var(--text-muted)] text-[10px]">
                      {entry.user} · {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showSnapshotsModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          data-testid="snapshots-modal"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Camera className="h-5 w-5" /> Version Snapshots & Restore
              </h3>
              <button
                onClick={() => setShowSnapshotsModal(false)}
                className="p-1 hover:bg-slate-800 rounded"
                aria-label="Close snapshots"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                placeholder="Snapshot name..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
                data-testid="snapshot-name-input"
              />
              <Button onClick={handleCreateSnapshot} data-testid="create-snapshot">
                <Save className="h-4 w-4 mr-1" /> Save
              </Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {snapshots.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">
                  No snapshots yet.
                </p>
              ) : (
                snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="flex items-center justify-between p-3 bg-slate-800 rounded"
                  >
                    <div>
                      <div className="font-medium text-sm">{snap.name}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {new Date(snap.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRestoreSnapshot(snap.id)}
                      data-testid={`restore-${snap.id}`}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" /> Restore
                    </Button>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setShowSnapshotsModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          data-testid="reject-modal"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-lg">Reject Budget</h3>
            <p className="text-sm text-slate-400">
              Comments are required when rejecting a budget in review.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm min-h-[80px]"
              data-testid="reject-reason-input"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim()}
                data-testid="confirm-reject"
                className="bg-red-600 hover:bg-red-700"
              >
                Reject Budget
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
