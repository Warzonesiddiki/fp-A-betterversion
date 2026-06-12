/* eslint-disable @typescript-eslint/no-unused-vars, jsx-a11y/label-has-associated-control */
import { useMemo, useState, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type {
  ApprovalRequest,
  ApprovalState,
  WorkflowStats,
  Delegation,
} from '@/engines/WorkflowEngine';

interface ApprovalDashboardProps {
  readonly requests: readonly ApprovalRequest[];
  readonly stats: WorkflowStats;
  readonly delegations: readonly Delegation[];
  readonly currentUser: string;
  readonly onApprove: (id: string, comment?: string) => void;
  readonly onReject: (id: string, comment?: string) => void;
  readonly onBulkApprove: (ids: readonly string[]) => void;
  readonly onDelegate: (id: string, toUser: string, comment?: string) => void;
  readonly onAddDelegation: (d: Delegation) => void;
  readonly onRemoveDelegation: (fromUser: string) => void;
  readonly className?: string;
}

const STATE_BADGE: Record<ApprovalState, string> = {
  draft:
    'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 dark:bg-gray-800 dark:text-gray-300',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  in_review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  locked: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
};

function formatTimeAgo(iso: string): string {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ApprovalDashboard({
  requests,
  stats,
  delegations,
  currentUser,
  onApprove,
  onReject,
  onBulkApprove,
  onDelegate,
  onAddDelegation,
  onRemoveDelegation,
  className,
}: ApprovalDashboardProps) {
  const [filterState, setFilterState] = useState<ApprovalState | 'all'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [commentMap, setCommentMap] = useState<Record<string, string>>({});
  const [showDelegationForm, setShowDelegationForm] = useState(false);
  const [delegateTo, setDelegateTo] = useState('');
  const [delegateReason, setDelegateReason] = useState('');

  const pending = useMemo(
    () => requests.filter((r) => ['submitted', 'in_review'].includes(r.state)),
    [requests]
  );

  const filtered = useMemo(
    () => (filterState === 'all' ? requests : requests.filter((r) => r.state === filterState)),
    [requests, filterState]
  );

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === filtered.length ? new Set() : new Set(filtered.map((r) => r.id))
    );
  }, [filtered]);

  const handleBulkApprove = useCallback(() => {
    onBulkApprove(Array.from(selected));
    setSelected(new Set());
  }, [selected, onBulkApprove]);

  const handleAddDelegation = useCallback(() => {
    if (!delegateTo.trim()) return;
    const now = new Date();
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    onAddDelegation({
      fromUser: currentUser,
      toUser: delegateTo.trim(),
      startDate: now.toISOString(),
      endDate: end.toISOString(),
      reason: delegateReason || undefined,
    });
    setDelegateTo('');
    setDelegateReason('');
    setShowDelegationForm(false);
  }, [currentUser, delegateTo, delegateReason, onAddDelegation]);

  const statCards = [
    {
      label: 'Pending',
      value: stats.pending,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20 dark:bg-blue-950',
    },
    {
      label: 'Approved',
      value: stats.approved,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20 dark:bg-green-950',
    },
    {
      label: 'Rejected',
      value: stats.rejected,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-900/20 dark:bg-red-950',
    },
    {
      label: 'Locked',
      value: stats.locked,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      label: 'Avg Time',
      value: stats.avgApprovalTimeHours > 0 ? `${stats.avgApprovalTimeHours.toFixed(1)}h` : 'N/A',
      color: 'text-slate-600',
      bg: 'bg-slate-50 dark:bg-slate-900',
    },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className={cn('rounded-lg p-3 text-center', card.bg)}>
            <p className={cn('text-2xl font-bold', card.color)}>{card.value}</p>
            <p className="text-xs text-[var(--text-muted)]">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Delegations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>Active Delegations</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDelegationForm(!showDelegationForm)}
            >
              {showDelegationForm ? 'Cancel' : '+ Add'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {showDelegationForm && (
            <div className="flex gap-2 items-end border-b pb-3">
              <div className="flex-1">
                <label className="text-xs font-medium">Delegate To</label>
                <input
                  type="text"
                  value={delegateTo}
                  onChange={(e) => setDelegateTo(e.target.value)}
                  placeholder="Username"
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium">Reason</label>
                <input
                  type="text"
                  value={delegateReason}
                  onChange={(e) => setDelegateReason(e.target.value)}
                  placeholder="Out of office..."
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <Button size="sm" onClick={handleAddDelegation} disabled={!delegateTo.trim()}>
                Save
              </Button>
            </div>
          )}
          {delegations.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No active delegations</p>
          ) : (
            <div className="space-y-2">
              {delegations.map((d) => (
                <div
                  key={`${d.fromUser}-${d.toUser}`}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    <span className="font-medium">{d.fromUser}</span>{' '}
                    <span className="text-[var(--text-muted)]">&rarr;</span>{' '}
                    <span className="font-medium">{d.toUser}</span>
                    {d.reason && (
                      <span className="ml-2 text-[var(--text-muted)]">({d.reason})</span>
                    )}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => onRemoveDelegation(d.fromUser)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>Approval Queue</span>
            {selected.size > 0 && (
              <Button size="sm" onClick={handleBulkApprove}>
                Bulk Approve ({selected.size})
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Filter Bar */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'submitted', 'in_review', 'approved', 'rejected', 'locked'] as const).map(
              (f) => (
                <button
                  key={f}
                  onClick={() => setFilterState(f)}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-full border transition-colors',
                    filterState === f
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)]'
                  )}
                >
                  {f === 'all' ? 'All' : f.replace('_', ' ')}
                </button>
              )
            )}
          </div>

          {pending.length > 0 && !['approved', 'rejected', 'locked'].includes(filterState) && (
            <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <input
                type="checkbox"
                checked={selected.size === filtered.length && filtered.length > 0}
                onChange={toggleAll}
              />
              Select all visible
            </label>
          )}

          {/* Request List */}
          <div className="space-y-2 max-h-[28rem] overflow-y-auto">
            {filtered.map((req) => {
              const isPending = ['submitted', 'in_review'].includes(req.state);
              return (
                <div key={req.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <input
                          type="checkbox"
                          checked={selected.has(req.id)}
                          onChange={() => toggleSelect(req.id)}
                          aria-label={`Select ${req.title}`}
                        />
                      )}
                      <span className="font-medium text-sm">{req.title}</span>
                      <span
                        className={cn('text-xs px-2 py-0.5 rounded-full', STATE_BADGE[req.state])}
                      >
                        {req.state.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      {req.requester} &middot; {formatTimeAgo(req.createdAt)}
                    </span>
                  </div>

                  {req.description && (
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                      {req.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                    {req.amount !== undefined && <span>${req.amount.toLocaleString()}</span>}
                    {req.entity && <span>{req.entity}</span>}
                    {req.period && <span>{req.period}</span>}
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={commentMap[req.id] ?? ''}
                        onChange={(e) => setCommentMap({ ...commentMap, [req.id]: e.target.value })}
                        placeholder="Comment..."
                        className="flex-1 border rounded px-2 py-1 text-xs"
                        aria-label={`Comment for ${req.title}`}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          onApprove(req.id, commentMap[req.id] || undefined);
                          setCommentMap({ ...commentMap, [req.id]: '' });
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onReject(req.id, commentMap[req.id] || undefined);
                          setCommentMap({ ...commentMap, [req.id]: '' });
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center py-6 text-sm text-[var(--text-muted)]">No requests found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {stats.slaBreaches.length > 0 && (
        <Card className="border-red-300 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-base text-red-600 flex items-center gap-2">
              SLA Breaches
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {stats.slaBreaches.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.slaBreaches.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between text-sm border-l-2 border-red-500 pl-2"
                >
                  <span className="font-medium">{req.title}</span>
                  <span className="text-xs text-red-500">Overdue</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
