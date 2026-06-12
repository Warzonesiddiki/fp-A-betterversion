/* eslint-disable @typescript-eslint/no-unused-vars */
import { useParams, useNavigate, Link } from 'react-router-dom';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useBudgetStore } from '@/store/budgetStore';
import { useGLStore } from '@/store/glStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';

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
} from 'lucide-react';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function BudgetDetailPage() {
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
  } = useBudgetStore();
  const { accounts } = useGLStore();

  const budget = budgets.find((b) => b.id === id);

  useEffect(() => {
    if (id && id !== activeBudgetId) {
      setActiveBudget(id);
    }
  }, [id, activeBudgetId, setActiveBudget]);

  const [editCell, setEditCell] = useState<{ lineItemId: string; month: number } | null>(null);
  const [editValue, setEditValue] = useState('');

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
    return Array.from(map.entries()).map(([accountId, items]) => ({
      accountId,
      accountName:
        items[0]?.accountName || accounts.find((a) => a.id === accountId)?.name || accountId,
      accountCode: items[0]?.accountCode || accounts.find((a) => a.id === accountId)?.code || '',
      items: items.sort((a, b) => a.month - b.month),
      total: items.reduce((s, li) => s + li.amount, 0),
    }));
  }, [budgetLineItems, accounts]);

  const grandTotal = useMemo(
    () => groupedByAccount.reduce((s, g) => s + g.total, 0),
    [groupedByAccount]
  );

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleCellClick = useCallback((lineItemId: string, month: number, currentValue: number) => {
    setEditCell({ lineItemId, month });
    setEditValue(String(currentValue));
  }, []);

  const handleCellSave = useCallback(() => {
    if (editCell) {
      const val = parseFloat(editValue) || 0;
      updateLineItem(editCell.lineItemId, { amount: val });
      setEditCell(null);
    }
  }, [editCell, editValue, updateLineItem]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleCellSave();
      if (e.key === 'Escape') setEditCell(null);
    },
    [handleCellSave]
  );

  if (user?.role === 'Viewer') {
    return (
      <div className="p-12 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-slate-400 mb-6">Viewers cannot access the budget editor.</p>
        <Link to="/dashboard" className="text-blue-400 hover:underline font-medium">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  if (!budget) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-xl font-semibold mb-2">Budget Not Found</h2>
        <p className="text-slate-400 mb-4">
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
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">{budget.name}</h1>
              <button
                onClick={() => setHelpOpen(true)}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
                aria-label="Help"
              ></button>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              FY{budget.fiscalYear} · {budgetLineItems.length} line items ·{' '}
              {formatCurrency(grandTotal)}
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
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (window.confirm('Lock this budget? This prevents further edits.'))
                    updateBudget(budget.id, { status: 'Locked' });
                }}
                title="Lock budget"
              >
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                Lock
              </Button>
            </>
          )}
          {budget.status === 'InReview' && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (window.confirm('Approve this budget?')) approveBudget(budget.id);
                }}
                className="text-green-400"
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (window.confirm('Reject this budget?')) rejectBudget(budget.id);
                }}
                className="text-red-400"
              >
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-800">
                <th className="px-4 py-3 w-24 sticky left-0 bg-slate-900 z-10">Account</th>
                {months.map((m) => (
                  <th key={m} className="px-2 py-3 text-right w-24">
                    {m}
                  </th>
                ))}
                <th className="px-4 py-3 text-right w-28">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {groupedByAccount.length === 0 ? (
                <tr>
                  <td colSpan={14} className="text-center py-8 text-slate-500">
                    No line items in this budget yet.
                  </td>
                </tr>
              ) : (
                groupedByAccount.map((group) => (
                  <tr key={group.accountId} className="hover:bg-slate-900/50">
                    <td className="px-4 py-2 sticky left-0 bg-slate-900 z-10">
                      <div className="text-xs font-mono text-slate-400">{group.accountCode}</div>
                      <div className="text-sm truncate max-w-[160px]" title={group.accountName}>
                        {group.accountName}
                      </div>
                    </td>
                    {months.map((m, idx) => {
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
                              className="w-full bg-blue-900/30 border border-blue-500 rounded px-2 py-1 text-right text-sm tabular-nums focus:outline-none"
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
                                (li.isLocked ? 'text-slate-500' : 'text-slate-200')
                              }
                              onClick={() =>
                                !li.isLocked && handleCellClick(li.id, li.month, li.amount)
                              }
                              title={li.isLocked ? 'Locked' : 'Click to edit'}
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
                      {formatCurrency(group.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="border-t-2 border-slate-600">
              <tr className="font-bold text-sm">
                <td className="px-4 py-3 sticky left-0 bg-slate-900 z-10">Total</td>
                {months.map((m, idx) => {
                  const monthTotal = groupedByAccount.reduce(
                    (s, g) => s + (g.items[idx]?.amount || 0),
                    0
                  );
                  return (
                    <td key={m} className="px-2 py-3 text-right tabular-nums">
                      {formatCurrency(monthTotal)}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <History className="h-4 w-4 text-slate-400" />
              Version History
            </div>
            <p className="text-xs text-slate-500">
              {history.length} version snapshots · position {historyIndex + 1} of {history.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Lock className="h-4 w-4 text-slate-400" />
              Cell Locking
            </div>
            <p className="text-xs text-slate-500">
              {budgetLineItems.filter((li) => li.isLocked).length} cells locked · click locked cells
              to view
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-semibold mb-1">Approval</div>
            {budget.status === 'Draft' && (
              <p className="text-xs text-slate-500">Not yet submitted</p>
            )}
            {budget.status === 'InReview' && (
              <p className="text-xs text-yellow-400">Pending approval</p>
            )}
            {budget.status === 'Approved' && (
              <div>
                <p className="text-xs text-green-400">Approved</p>
                {budget.approvedAt && (
                  <p className="text-xs text-slate-500">
                    {new Date(budget.approvedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
            {budget.status === 'Rejected' && <p className="text-xs text-red-400">Rejected</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
