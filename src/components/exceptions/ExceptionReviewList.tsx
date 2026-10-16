import React, { useState, useMemo } from 'react';
import { Search, FileCheck } from 'lucide-react';
import { ExceptionReviewCard, type ExceptionReviewCandidate } from './ExceptionReviewCard';
import {
  useExceptionDispositionStore,
  type DispositionStatus,
} from '@/store/exceptionDispositionStore';
import { cn } from '@/utils/cn';

export interface ExceptionReviewListProps {
  readonly candidates: readonly ExceptionReviewCandidate[];
  readonly currentUserId?: string;
  readonly className?: string;
}

type StatusFilter = 'ALL' | 'PENDING' | DispositionStatus;
type SeverityFilter = 'ALL' | ExceptionReviewCandidate['severity'];

export const ExceptionReviewList: React.FC<ExceptionReviewListProps> = ({
  candidates,
  currentUserId = 'current-user',
  className,
}) => {
  const dispositions = useExceptionDispositionStore((s) => s.dispositions);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('ALL');

  // Compute disposition lookup map
  const dispositionMap = useMemo(() => {
    const map = new Map<string, DispositionStatus>();
    for (const d of dispositions) {
      map.set(d.exceptionId, d.disposition);
    }
    return map;
  }, [dispositions]);

  // Compute summary stats
  const stats = useMemo(() => {
    let pending = 0;
    let accepted = 0;
    let rejected = 0;
    let review = 0;
    let escalated = 0;

    for (const c of candidates) {
      const disp = dispositionMap.get(c.id);
      if (!disp) pending++;
      else if (disp === 'ACCEPT') accepted++;
      else if (disp === 'REJECT') rejected++;
      else if (disp === 'REVIEW') review++;
      else if (disp === 'ESCALATE') escalated++;
    }

    return {
      total: candidates.length,
      pending,
      accepted,
      rejected,
      review,
      escalated,
    };
  }, [candidates, dispositionMap]);

  // Filter candidates based on search, status, severity
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      // Severity filter
      if (severityFilter !== 'ALL' && c.severity !== severityFilter) {
        return false;
      }

      // Status filter
      const disp = dispositionMap.get(c.id);
      if (statusFilter === 'PENDING' && disp) {
        return false;
      }
      if (statusFilter !== 'ALL' && statusFilter !== 'PENDING' && disp !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = c.id.toLowerCase().includes(query);
        const matchesRule = c.ruleId.toLowerCase().includes(query);
        const matchesName = c.ruleName?.toLowerCase().includes(query) ?? false;
        const matchesDesc = c.evidence.description.toLowerCase().includes(query);
        if (!matchesId && !matchesRule && !matchesName && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [candidates, dispositionMap, severityFilter, statusFilter, searchQuery]);

  return (
    <div
      className={cn('space-y-4', className)}
      role="region"
      aria-label="Exception Review Candidate Queue"
      data-testid="exception-review-list"
    >
      {/* Header Metric Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-panel)] p-3 text-center"
          data-testid="stat-total"
        >
          <span className="block text-xl font-bold text-[var(--text-primary)]">{stats.total}</span>
          <span className="text-[11px] text-[var(--text-muted)]">Total Candidates</span>
        </div>
        <div
          className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-center"
          data-testid="stat-pending"
        >
          <span className="block text-xl font-bold text-amber-500">{stats.pending}</span>
          <span className="text-[11px] text-amber-600/80">Pending Review</span>
        </div>
        <div
          className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-center"
          data-testid="stat-accepted"
        >
          <span className="block text-xl font-bold text-red-500">{stats.accepted}</span>
          <span className="text-[11px] text-red-600/80">Confirmed Exceptions</span>
        </div>
        <div
          className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-center"
          data-testid="stat-rejected"
        >
          <span className="block text-xl font-bold text-emerald-500">{stats.rejected}</span>
          <span className="text-[11px] text-emerald-600/80">Dismissed (Benign)</span>
        </div>
        <div
          className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 text-center col-span-2 sm:col-span-1"
          data-testid="stat-escalated"
        >
          <span className="block text-xl font-bold text-purple-500">{stats.escalated}</span>
          <span className="text-[11px] text-purple-600/80">Escalated</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-panel)] p-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate ID, rule ID, or description..."
            className="w-full rounded border border-[var(--border-default)] bg-[var(--bg-base)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] transition-colors duration-150"
            data-testid="exception-search-input"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[var(--text-muted)]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded border border-[var(--border-default)] bg-[var(--bg-base)] px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] transition-colors duration-150"
              data-testid="status-filter-select"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="ACCEPT">Confirmed (ACCEPT)</option>
              <option value="REJECT">Dismissed (REJECT)</option>
              <option value="REVIEW">Under Review</option>
              <option value="ESCALATE">Escalated</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[var(--text-muted)]">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
              className="rounded border border-[var(--border-default)] bg-[var(--bg-base)] px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] transition-colors duration-150"
              data-testid="severity-filter-select"
            >
              <option value="ALL">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidate List */}
      <div className="space-y-3" data-testid="candidate-cards-container">
        {filteredCandidates.length === 0 ? (
          <div
            className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-panel)] p-8 text-center text-xs text-[var(--text-muted)]"
            data-testid="empty-candidates-notice"
          >
            <FileCheck className="w-8 h-8 mx-auto mb-2 text-[var(--text-muted)] opacity-60" />
            <p className="font-medium text-[var(--text-secondary)]">
              No review candidates match criteria
            </p>
            <p className="mt-1 text-[11px]">Try adjusting your search terms or filter selection.</p>
          </div>
        ) : (
          filteredCandidates.map((candidate) => (
            <ExceptionReviewCard
              key={candidate.id}
              candidate={candidate}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>
    </div>
  );
};
