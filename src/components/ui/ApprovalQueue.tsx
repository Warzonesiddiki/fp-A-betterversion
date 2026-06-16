/* eslint-disable jsx-a11y/label-has-associated-control */
import { memo, useCallback, useMemo, useState } from 'react';
import { cn } from '@/utils/cn';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Input } from './Input';
import type { ApprovalRequest, ApprovalState, ApprovalEvent } from '@/engines/WorkflowEngine';

interface Props {
  requests: ApprovalRequest[];
  onApprove: (id: string, comment?: string) => void;
  onReject: (id: string, comment?: string) => void;
  onBulkApprove: (ids: string[]) => void;
  currentUser: string;
  className?: string;
}

const STATE_BADGES: Record<ApprovalState, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:text-gray-300',
  submitted: 'bg-blue-100 text-blue-700',
  in_review: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  locked: 'bg-purple-100 text-purple-700',
};

export const ApprovalQueue = memo(function ApprovalQueue({
  requests,
  onApprove,
  onReject,
  onBulkApprove,
  currentUser: _currentUser,
  className,
}: Props) {
  const [filterState, setFilterState] = useState<ApprovalState | 'all'>('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterRequester, setFilterRequester] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [commentMap, setCommentMap] = useState<Record<string, string>>({});
  const [showHistory, setShowHistory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (filterState !== 'all' && r.state !== filterState) return false;
      if (filterDate && !r.createdAt.startsWith(filterDate)) return false;
      if (filterRequester && !r.requester.toLowerCase().includes(filterRequester.toLowerCase()))
        return false;
      return true;
    });
  }, [requests, filterState, filterDate, filterRequester]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === filtered.length) return new Set();
      return new Set(filtered.map((r) => r.id));
    });
  }, [filtered]);

  const pending = filtered.filter((r) => ['submitted', 'in_review'].includes(r.state));
  const showBulk = pending.length > 0 && selected.size > 0;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Approval Queue</span>
          {showBulk && (
            <Button
              size="sm"
              onClick={() => {
                onBulkApprove(Array.from(selected));
                setSelected(new Set());
              }}
            >
              Bulk Approve ({selected.size})
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="approval-status-filter" className="text-xs font-medium">
              Status
            </label>
            <select
              id="approval-status-filter"
              value={filterState}
              onChange={(e) => setFilterState(e.target.value as ApprovalState | 'all')}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              <option value="all">All</option>
              <option value="submitted">Submitted</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="locked">Locked</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium">Date</label>
            <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium">Requester</label>
            <Input
              value={filterRequester}
              onChange={(e) => setFilterRequester(e.target.value)}
              placeholder="Search..."
            />
          </div>
        </div>

        {/* Select All */}
        {pending.length > 0 && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.size === filtered.length && filtered.length > 0}
              onChange={toggleAll}
            />
            Select all pending
          </label>
        )}

        {/* Request List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filtered.map((req) => (
            <div key={req.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {['submitted', 'in_review'].includes(req.state) && (
                    <input
                      type="checkbox"
                      checked={selected.has(req.id)}
                      onChange={() => toggleSelect(req.id)}
                    />
                  )}
                  <span className="font-medium">{req.title}</span>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', STATE_BADGES[req.state])}>
                    {req.state.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex gap-1 text-xs text-[var(--text-muted)]">
                  <span>{req.requester}</span>
                  <span>&middot;</span>
                  <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {req.description && (
                <p className="text-sm text-[var(--text-secondary)]">{req.description}</p>
              )}

              {req.amount !== undefined && (
                <p className="text-sm font-medium">Amount: ${req.amount.toLocaleString()}</p>
              )}

              {/* Actions for pending (HERA v0.4 Hermes H3 HIGH #1: Approve LAST — irreversible action) */}
              {['submitted', 'in_review'].includes(req.state) && (
                <div className="flex items-center gap-2">
                  <Input
                    size={200}
                    value={commentMap[req.id] ?? ''}
                    onChange={(e) => setCommentMap({ ...commentMap, [req.id]: e.target.value })}
                    placeholder="Comment (optional)"
                    className="flex-1"
                    aria-label={`Comment for ${req.title}`}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onReject(req.id, commentMap[req.id]);
                      setCommentMap({ ...commentMap, [req.id]: '' });
                    }}
                    aria-label={`Reject ${req.title}`}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      onApprove(req.id, commentMap[req.id]);
                      setCommentMap({ ...commentMap, [req.id]: '' });
                    }}
                    aria-label={`Approve ${req.title} (irreversible)`}
                  >
                    Approve
                  </Button>
                </div>
              )}

              {/* History Toggle */}
              <button
                onClick={() => setShowHistory(showHistory === req.id ? null : req.id)}
                className="text-xs text-blue-500 hover:text-blue-700"
              >
                {showHistory === req.id ? 'Hide' : 'Show'} History ({req.history.length} events)
              </button>

              {showHistory === req.id && (
                <div className="pl-4 border-l-2 border-[var(--border-subtle)] space-y-1">
                  {req.history.map((evt: ApprovalEvent) => (
                    <div key={evt.id} className="text-xs text-[var(--text-secondary)]">
                      <span className="font-medium">{evt.actor}</span>
                      <span className="mx-1">&middot;</span>
                      <span>{evt.action}</span>
                      {evt.comment && (
                        <span className="ml-1 text-[var(--text-muted)]">- {evt.comment}</span>
                      )}
                      <span className="ml-1 text-[var(--text-muted)]">
                        {new Date(evt.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-8 text-[var(--text-muted)]">
              <p>No requests match your filters.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
