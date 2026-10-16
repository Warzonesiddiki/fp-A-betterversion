import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  ChevronDown,
  ChevronUp,
  Flag,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  useExceptionDispositionStore,
  type DispositionStatus,
} from '@/store/exceptionDispositionStore';
import { cn } from '@/utils/cn';

export interface ExceptionEvidenceDetails {
  readonly description: string;
  readonly formula?: string;
  readonly metric?: string;
  readonly actualValue?: string | number;
  readonly expectedValue?: string | number;
  readonly deviation?: string | number;
  readonly sourceRowId?: string;
  readonly context?: Record<string, unknown>;
}

export interface ExceptionReviewCandidate {
  readonly id: string; // stable findingKey or exception id
  readonly ruleId: string; // versioned rule id, e.g. "RULE-D365-001@v1"
  readonly ruleName?: string;
  readonly version?: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly evidence: ExceptionEvidenceDetails;
  readonly recommendedAction?: string;
}

export interface ExceptionReviewCardProps {
  readonly candidate: ExceptionReviewCandidate;
  readonly currentUserId?: string;
  readonly onDispositionChange?: (disposition: DispositionStatus, rationale: string) => void;
  readonly className?: string;
}

const severityConfig: Record<
  ExceptionReviewCandidate['severity'],
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  low: {
    label: 'Low Severity',
    badgeClass: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30',
    icon: Info,
  },
  medium: {
    label: 'Medium Severity',
    badgeClass: 'bg-amber-500/10 text-amber-500 border border-amber-500/30',
    icon: AlertCircle,
  },
  high: {
    label: 'High Severity',
    badgeClass: 'bg-orange-500/10 text-orange-500 border border-orange-500/30',
    icon: AlertTriangle,
  },
  critical: {
    label: 'Critical Severity',
    badgeClass: 'bg-red-500/10 text-red-500 border border-red-500/30',
    icon: AlertTriangle,
  },
};

const dispositionStatusConfig: Record<
  DispositionStatus,
  {
    label: string;
    description: string;
    badgeClass: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  ACCEPT: {
    label: 'Confirmed Exception',
    description: 'Confirmed as a valid exception by human review',
    badgeClass: 'bg-red-500/15 text-red-500 border border-red-500/30',
    icon: CheckCircle2,
  },
  REJECT: {
    label: 'Dismissed (Benign)',
    description: 'Dismissed as false positive or acceptable variance',
    badgeClass: 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30',
    icon: XCircle,
  },
  REVIEW: {
    label: 'Under Active Review',
    description: 'Flagged for detailed secondary investigation',
    badgeClass: 'bg-blue-500/15 text-blue-500 border border-blue-500/30',
    icon: Clock,
  },
  ESCALATE: {
    label: 'Escalated',
    description: 'Escalated to management or controller signoff',
    badgeClass: 'bg-purple-500/15 text-purple-500 border border-purple-500/30',
    icon: Flag,
  },
};

export const ExceptionReviewCard: React.FC<ExceptionReviewCardProps> = ({
  candidate,
  currentUserId = 'current-user',
  onDispositionChange,
  className,
}) => {
  const dispositions = useExceptionDispositionStore((s) => s.dispositions);
  const auditTrail = useExceptionDispositionStore((s) => s.auditTrail);
  const setDisposition = useExceptionDispositionStore((s) => s.setDisposition);

  const storeDisposition = useMemo(
    () => dispositions.find((d) => d.exceptionId === candidate.id),
    [dispositions, candidate.id]
  );
  const auditHistory = useMemo(
    () => auditTrail.filter((a) => a.exceptionId === candidate.id),
    [auditTrail, candidate.id]
  );

  const [rationale, setRationale] = useState<string>('');
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const currentStatus: DispositionStatus | null = storeDisposition?.disposition ?? null;
  const sevConfig = severityConfig[candidate.severity];
  const SevIcon = sevConfig.icon;

  const handleApplyDisposition = (status: DispositionStatus) => {
    const trimmedRationale = rationale.trim();
    if (!trimmedRationale) {
      setValidationError(
        'Please provide a review rationale note before applying disposition (FR-009).'
      );
      return;
    }

    setValidationError(null);

    setDisposition({
      exceptionId: candidate.id,
      disposition: status,
      rationale: trimmedRationale,
      ruleId: candidate.ruleId,
      recordedBy: currentUserId,
    });

    if (onDispositionChange) {
      onDispositionChange(status, trimmedRationale);
    }

    setRationale('');
  };

  return (
    <article
      className={cn(
        'rounded-lg border border-[var(--border-default)] bg-[var(--surface-panel)] p-4 shadow-sm transition-colors duration-150',
        className
      )}
      role="region"
      aria-label={`Exception Review Candidate ${candidate.id}`}
      data-testid="exception-review-card"
    >
      {/* Top Bar: Rule ID, Finding Key, Severity, Disposition State */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Versioned Rule ID */}
          <span
            className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]"
            data-testid="exception-rule-id"
          >
            {candidate.ruleId}
            {candidate.version && ` (v${candidate.version})`}
          </span>

          {/* Finding Key / Unique ID */}
          <span
            className="font-mono text-xs text-[var(--text-muted)]"
            data-testid="exception-finding-key"
          >
            ID: {candidate.id}
          </span>

          {/* Severity Badge */}
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium',
              sevConfig.badgeClass
            )}
            data-testid="exception-severity-badge"
          >
            <SevIcon className="w-3.5 h-3.5" />
            {sevConfig.label}
          </span>
        </div>

        {/* Current Disposition Status Badge */}
        <div>
          {currentStatus ? (
            (() => {
              const statusCfg = dispositionStatusConfig[currentStatus];
              const StatusIcon = statusCfg.icon;
              return (
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                    statusCfg.badgeClass
                  )}
                  data-testid="exception-status-badge"
                >
                  <StatusIcon className="w-3.5 h-3.5" />
                  {statusCfg.label}
                </span>
              );
            })()
          ) : (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/30"
              data-testid="exception-status-badge"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Review Candidate (Pending)
            </span>
          )}
        </div>
      </div>

      {/* Non-negotiable Rule 7 Notice Banner */}
      {!currentStatus && (
        <div
          className="mt-3 flex items-start gap-2 rounded bg-[var(--surface-subtle)] p-2.5 text-xs text-[var(--text-secondary)] border border-[var(--border-subtle)]"
          data-testid="rule-7-banner"
        >
          <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[var(--text-primary)]">
              Rule 7 Review Candidate:
            </span>{' '}
            Potential exceptions are flagged candidates awaiting human review. No flag is labeled a
            confirmed error without formal human disposition.
          </div>
        </div>
      )}

      {/* Candidate Name & Evidence Body (FR-008) */}
      <div className="mt-3 space-y-2">
        {candidate.ruleName && (
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">{candidate.ruleName}</h4>
        )}

        <p
          className="text-xs text-[var(--text-secondary)] leading-relaxed"
          data-testid="exception-description"
        >
          {candidate.evidence.description}
        </p>

        {/* Formula / Criteria if available */}
        {candidate.evidence.formula && (
          <div className="rounded bg-[var(--bg-elevated)] p-2 font-mono text-[11px] text-[var(--text-muted)] border border-[var(--border-subtle)]">
            <span className="font-semibold text-[var(--text-secondary)]">Rule Formula:</span>{' '}
            {candidate.evidence.formula}
          </div>
        )}

        {/* Metric Comparisons (Expected vs Actual) */}
        {(candidate.evidence.actualValue !== undefined ||
          candidate.evidence.expectedValue !== undefined) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {candidate.evidence.metric && (
              <div className="rounded border border-[var(--border-subtle)] p-2 text-xs">
                <span className="text-[var(--text-muted)] block text-[10px] uppercase tracking-wider">
                  Metric
                </span>
                <span className="font-medium text-[var(--text-primary)]">
                  {candidate.evidence.metric}
                </span>
              </div>
            )}
            {candidate.evidence.actualValue !== undefined && (
              <div className="rounded border border-[var(--border-subtle)] p-2 text-xs">
                <span className="text-[var(--text-muted)] block text-[10px] uppercase tracking-wider">
                  Actual Value
                </span>
                <span className="font-mono font-medium text-[var(--text-primary)]">
                  {String(candidate.evidence.actualValue)}
                </span>
              </div>
            )}
            {candidate.evidence.expectedValue !== undefined && (
              <div className="rounded border border-[var(--border-subtle)] p-2 text-xs">
                <span className="text-[var(--text-muted)] block text-[10px] uppercase tracking-wider">
                  Expected Value
                </span>
                <span className="font-mono font-medium text-[var(--text-primary)]">
                  {String(candidate.evidence.expectedValue)}
                </span>
              </div>
            )}
          </div>
        )}

        {candidate.recommendedAction && (
          <div className="text-xs text-[var(--text-muted)] pt-1">
            <span className="font-medium text-[var(--text-secondary)]">Recommended Action:</span>{' '}
            {candidate.recommendedAction}
          </div>
        )}
      </div>

      {/* Active Disposition Info (if already reviewed) */}
      {storeDisposition && (
        <div
          className="mt-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 text-xs"
          data-testid="current-disposition-summary"
        >
          <div className="flex items-center justify-between font-medium text-[var(--text-primary)]">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              Reviewed by {storeDisposition.recordedBy}
            </span>
            <span className="text-[var(--text-muted)] text-[11px]">
              {storeDisposition.recordedAt}
            </span>
          </div>
          <div className="mt-1.5 text-[var(--text-secondary)] italic">
            &ldquo;{storeDisposition.rationale}&rdquo;
          </div>
        </div>
      )}

      {/* Disposition Action Form (FR-009) */}
      <div className="mt-4 border-t border-[var(--border-subtle)] pt-3">
        <label
          htmlFor={`rationale-${candidate.id}`}
          className="block text-xs font-semibold text-[var(--text-primary)] mb-1"
        >
          Review Disposition & Rationale (FR-009)
        </label>
        <textarea
          id={`rationale-${candidate.id}`}
          rows={2}
          value={rationale}
          onChange={(e) => {
            setRationale(e.target.value);
            if (validationError) setValidationError(null);
          }}
          placeholder="Document the review justification, investigation evidence, and rationale..."
          className="w-full rounded border border-[var(--border-default)] bg-[var(--bg-base)] p-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] transition-colors duration-150"
          data-testid="disposition-rationale-input"
        />

        {validationError && (
          <p className="mt-1 text-[11px] text-red-500" data-testid="rationale-error">
            {validationError}
          </p>
        )}

        {/* Action Buttons */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleApplyDisposition('ACCEPT')}
              className="cursor-pointer text-xs h-8 border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors duration-150"
              data-testid="btn-disposition-accept"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Confirm Exception
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleApplyDisposition('REJECT')}
              className="cursor-pointer text-xs h-8 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 transition-colors duration-150"
              data-testid="btn-disposition-reject"
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              Dismiss (Benign)
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleApplyDisposition('REVIEW')}
              className="cursor-pointer text-xs h-8 border-blue-500/30 text-blue-600 hover:bg-blue-500/10 transition-colors duration-150"
              data-testid="btn-disposition-review"
            >
              <Clock className="w-3.5 h-3.5 mr-1" />
              Flag for Review
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleApplyDisposition('ESCALATE')}
              className="cursor-pointer text-xs h-8 border-purple-500/30 text-purple-600 hover:bg-purple-500/10 transition-colors duration-150"
              data-testid="btn-disposition-escalate"
            >
              <Flag className="w-3.5 h-3.5 mr-1" />
              Escalate
            </Button>
          </div>

          {/* Audit History Toggle */}
          {auditHistory.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors duration-150"
              data-testid="toggle-audit-history"
            >
              <History className="w-3.5 h-3.5" />
              Audit Log ({auditHistory.length})
              {showHistory ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Audit History (FR-009) */}
      {showHistory && auditHistory.length > 0 && (
        <div
          className="mt-3 rounded border border-[var(--border-subtle)] bg-[var(--surface-subtle)] p-3 text-xs space-y-2"
          data-testid="audit-history-list"
        >
          <div className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5 pb-1 border-b border-[var(--border-subtle)]">
            <History className="w-3.5 h-3.5" />
            Audit Trail & History Log
          </div>
          {auditHistory.map((entry) => (
            <div
              key={`${entry.exceptionId}-${entry.sequenceNumber}`}
              className="border-b border-[var(--border-subtle)] last:border-b-0 pb-2 last:pb-0 text-[11px]"
              data-testid="audit-history-entry"
            >
              <div className="flex items-center justify-between text-[var(--text-muted)]">
                <span className="font-medium text-[var(--text-secondary)]">
                  #{entry.sequenceNumber} - {entry.disposition}
                  {entry.previousDisposition && ` (was ${entry.previousDisposition})`}
                </span>
                <span>{entry.recordedAt}</span>
              </div>
              <div className="mt-0.5 text-[var(--text-primary)]">
                &ldquo;{entry.rationale}&rdquo;
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                By: {entry.recordedBy}
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
};
