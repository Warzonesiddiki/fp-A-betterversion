import { useCallback, useMemo, useState } from 'react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type {
  ApprovalRequest,
  ApprovalState,
  ApprovalEvent,
  WorkflowStep,
} from '@/engines/WorkflowEngine';

interface ApprovalWorkflowProps {
  readonly request: ApprovalRequest;
  readonly currentStep?: WorkflowStep;
  readonly currentUser: string;
  readonly currentUserRoles: readonly string[];
  readonly onApprove: (id: string, comment?: string) => void;
  readonly onReject: (id: string, comment?: string) => void;
  readonly onDelegate: (id: string, toUser: string, comment?: string) => void;
  readonly onLock: (id: string) => void;
  readonly className?: string;
}

type LifecycleNode = {
  readonly state: ApprovalState;
  readonly label: string;
  readonly color: string;
  readonly bgColor: string;
};

const LIFECYCLE_NODES: readonly LifecycleNode[] = [
  {
    state: 'draft',
    label: 'Draft',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
  {
    state: 'submitted',
    label: 'Submitted',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
  },
  {
    state: 'in_review',
    label: 'In Review',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900',
  },
  {
    state: 'approved',
    label: 'Approved',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
  },
  {
    state: 'rejected',
    label: 'Rejected',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900',
  },
  {
    state: 'locked',
    label: 'Locked',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
  },
] as const;

const STATE_BADGE: Record<ApprovalState, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  in_review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  locked: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
};

function getActiveIndex(state: ApprovalState): number {
  return LIFECYCLE_NODES.findIndex((n) => n.state === state);
}

function isApprover(currentStep: WorkflowStep | undefined, user: string): boolean {
  if (!currentStep) return false;
  return currentStep.approvers.includes(user) || (currentStep.delegateTo?.includes(user) ?? false);
}

export function ApprovalWorkflow({
  request = {
    id: 'preview',
    title: 'Preview Request',
    description: '',
    amount: 0,
    state: 'pending',
    requester: { id: 'u1', name: 'Preview User', email: 'preview@example.com' },
    steps: [],
    currentStepId: null,
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  currentStep,
  currentUser,
  onApprove = () => {},
  onReject = () => {},
  onDelegate = () => {},
  onLock = () => {},
  className,
}: ApprovalWorkflowProps) {
  const [comment, setComment] = useState('');
  const [delegateTarget, setDelegateTarget] = useState('');
  const [showDelegate, setShowDelegate] = useState(false);

  const activeIdx = useMemo(() => getActiveIndex(request.state), [request.state]);
  const canAct = useMemo(
    () =>
      ['submitted', 'in_review'].includes(request.state) && isApprover(currentStep, currentUser),
    [request.state, currentStep, currentUser]
  );
  const canLock = request.state === 'approved';

  const handleApprove = useCallback(() => {
    onApprove(request.id, comment || undefined);
    setComment('');
  }, [request.id, comment, onApprove]);

  const handleReject = useCallback(() => {
    onReject(request.id, comment || undefined);
    setComment('');
  }, [request.id, comment, onReject]);

  const handleDelegate = useCallback(() => {
    if (!delegateTarget.trim()) return;
    onDelegate(request.id, delegateTarget.trim(), comment || undefined);
    setDelegateTarget('');
    setComment('');
    setShowDelegate(false);
  }, [request.id, delegateTarget, comment, onDelegate]);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{request.title}</span>
          <span className={cn('text-xs px-2 py-0.5 rounded-full', STATE_BADGE[request.state])}>
            {request.state.replace('_', ' ')}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Lifecycle Visualization */}
        <div
          className="flex items-center justify-between"
          role="progressbar"
          aria-valuenow={activeIdx + 1}
          aria-valuemin={1}
          aria-valuemax={LIFECYCLE_NODES.length}
          aria-label={`Approval progress: ${request.state}`}
        >
          {LIFECYCLE_NODES.map((node, idx) => {
            const isActive = idx === activeIdx;
            const isPast = idx < activeIdx;
            const isRejected = node.state === 'rejected' && request.state === 'rejected';

            return (
              <div key={node.state} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                      isActive && !isRejected && 'border-current scale-110',
                      isPast && 'border-green-500 bg-green-500 text-white',
                      isRejected && 'border-red-500 bg-red-500 text-white',
                      !isActive && !isPast && !isRejected && 'border-gray-300 text-gray-400'
                    )}
                  >
                    {isPast ? '\u2713' : idx + 1}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] mt-1 text-center whitespace-nowrap',
                      isActive ? node.color : 'text-gray-400'
                    )}
                  >
                    {node.label}
                  </span>
                </div>
                {idx < LIFECYCLE_NODES.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-1',
                      isPast ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Request Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-[var(--text-muted)]">Requester</span>
            <p className="font-medium">{request.requester?.name || 'Unknown'}</p>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Submitted</span>
            <p className="font-medium">{new Date(request.createdAt).toLocaleDateString()}</p>
          </div>
          {request.amount !== undefined && (
            <div>
              <span className="text-[var(--text-muted)]">Amount</span>
              <p className="font-medium">${request.amount.toLocaleString()}</p>
            </div>
          )}
          {currentStep && (
            <div>
              <span className="text-[var(--text-muted)]">Current Step</span>
              <p className="font-medium">{currentStep.name}</p>
            </div>
          )}
        </div>

        {/* History Timeline */}
        {request.history.length > 0 && (
          <details className="border rounded-lg">
            <summary className="px-3 py-2 text-sm font-medium cursor-pointer hover:bg-[var(--bg-subtle)]">
              History ({request.history.length} events)
            </summary>
            <div className="px-3 pb-3 space-y-2 max-h-40 overflow-y-auto">
              {request.history.map((evt: ApprovalEvent) => (
                <div key={evt.id} className="flex items-start gap-2 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-medium">{evt.actor}</span>
                    <span className="mx-1 text-[var(--text-muted)]">{evt.action}</span>
                    {evt.comment && (
                      <span className="text-[var(--text-muted)]">&mdash; {evt.comment}</span>
                    )}
                    <span className="ml-1 text-[var(--text-muted)]">
                      {new Date(evt.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Actions */}
        {(canAct || canLock) && (
          <div className="space-y-3 border-t pt-3">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full border rounded px-3 py-2 text-sm resize-none h-16"
              aria-label="Approval comment"
            />

            {showDelegate && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={delegateTarget}
                  onChange={(e) => setDelegateTarget(e.target.value)}
                  placeholder="Delegate to (username)"
                  className="flex-1 border rounded px-3 py-1.5 text-sm"
                  aria-label="Delegate target user"
                />
                <Button size="sm" onClick={handleDelegate} disabled={!delegateTarget.trim()}>
                  Confirm
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowDelegate(false)}>
                  Cancel
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              {canAct && (
                <>
                  <Button size="sm" onClick={handleApprove}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleReject}>
                    Reject
                  </Button>
                  {!showDelegate && (
                    <Button size="sm" variant="ghost" onClick={() => setShowDelegate(true)}>
                      Delegate
                    </Button>
                  )}
                </>
              )}
              {canLock && (
                <Button size="sm" onClick={() => onLock(request.id)}>
                  Lock
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
