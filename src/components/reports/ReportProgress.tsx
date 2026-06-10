// =============================================================================
// REPORT PROGRESS — Batch generation progress tracking with ETA, parallel jobs
// =============================================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import type { GenerationProgress } from '@/engines/ReportBookEngine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReportJob {
  id: string;
  reportName: string;
  entityName: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface ReportProgressProps {
  progress: GenerationProgress;
  jobs?: ReportJob[];
  onCancel?: () => void;
  onRetryFailed?: () => void;
  parallelWorkers?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatElapsed(ms: number): string {
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remainSecs = secs % 60;
  return `${mins}m ${remainSecs}s`;
}

function formatETA(ms: number): string {
  if (ms <= 0) return 'Almost done';
  const secs = Math.ceil(ms / 1000);
  if (secs < 60) return `~${secs}s remaining`;
  const mins = Math.ceil(secs / 60);
  return `~${mins}m remaining`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StatusBadgeProps {
  status: ReportJob['status'];
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<ReportJob['status'], { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-slate-700', text: 'text-slate-400', label: 'Pending' },
    running: { bg: 'bg-blue-900/50', text: 'text-blue-400', label: 'Running' },
    completed: { bg: 'bg-green-900/50', text: 'text-green-400', label: 'Done' },
    error: { bg: 'bg-red-900/50', text: 'text-red-400', label: 'Failed' },
  };
  const c = config[status];
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${c.bg} ${c.text}`}>{c.label}</span>
  );
}

interface JobRowProps {
  job: ReportJob;
}

function JobRow({ job }: JobRowProps) {
  const duration =
    job.startedAt && job.completedAt
      ? formatElapsed(job.completedAt - job.startedAt)
      : job.startedAt
        ? formatElapsed(Date.now() - job.startedAt)
        : '';

  return (
    <div className="flex items-center gap-2 py-1 text-xs">
      <StatusBadge status={job.status} />
      <span className="flex-1 truncate text-slate-300">
        {job.reportName}
        <span className="text-slate-500"> &mdash; {job.entityName}</span>
      </span>
      {duration && <span className="text-slate-500 tabular-nums w-14 text-right">{duration}</span>}
      {job.error && (
        <span className="text-red-400 truncate max-w-[200px]" title={job.error}>
          {job.error}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ReportProgress({
  progress,
  jobs = [],
  onCancel,
  onRetryFailed,
  parallelWorkers = 1,
}: ReportProgressProps) {
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const isRunning = progress.status === 'running';

  useEffect(() => {
    if (!isRunning) return;
    startTimeRef.current = Date.now() - elapsed;
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  const eta = useMemo(() => {
    if (progress.completed === 0 || !isRunning) return 0;
    const avgTime = elapsed / progress.completed;
    const remaining = progress.total - progress.completed;
    return avgTime * remaining;
  }, [elapsed, progress.completed, progress.total, isRunning]);

  const failedJobs = useMemo(() => jobs.filter((j) => j.status === 'error'), [jobs]);
  const completedJobs = useMemo(() => jobs.filter((j) => j.status === 'completed'), [jobs]);

  return (
    <div className="space-y-4 rounded-lg border border-slate-700 bg-slate-900/80 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h4 className="text-sm font-semibold text-white">Batch Generation</h4>
          {isRunning && (
            <span className="flex items-center gap-1.5 text-xs text-blue-400">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              {parallelWorkers > 1 ? `${parallelWorkers} workers` : 'Running'}
            </span>
          )}
          {progress.status === 'complete' && (
            <span className="text-xs text-green-400">Complete</span>
          )}
          {progress.status === 'error' && (
            <span className="text-xs text-red-400">
              {failedJobs.length} error{failedJobs.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {failedJobs.length > 0 && onRetryFailed && (
            <button
              type="button"
              onClick={onRetryFailed}
              className="text-xs text-blue-400 hover:text-blue-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            >
              Retry failed
            </button>
          )}
          {isRunning && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-red-400 hover:text-red-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progress.status === 'error'
                ? 'bg-gradient-to-r from-red-600 to-red-500'
                : progress.status === 'complete'
                  ? 'bg-gradient-to-r from-green-600 to-green-500'
                  : 'bg-gradient-to-r from-blue-600 to-blue-400'
            }`}
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-500">
          <span>
            {progress.currentReport && isRunning
              ? `${progress.currentReport} - ${progress.currentEntity}`
              : `${completedJobs.length} of ${progress.total} complete`}
          </span>
          <span className="tabular-nums">
            {progress.completed}/{progress.total} ({pct}%)
          </span>
        </div>
      </div>

      {/* Timing */}
      <div className="flex items-center gap-4 text-[11px] text-slate-500">
        <span>Elapsed: {formatElapsed(elapsed)}</span>
        {isRunning && eta > 0 && <span>{formatETA(eta)}</span>}
      </div>

      {/* Error summary from engine progress */}
      {progress.errors.length > 0 && (
        <div className="rounded-md bg-red-950/30 border border-red-800/50 p-3"> role="alert"  role="alert" 
          <p className="text-xs font-medium text-red-400 mb-1">
            {progress.errors.length} error{progress.errors.length !== 1 ? 's' : ''}
          </p>
          <ul className="space-y-0.5 max-h-24 overflow-y-auto">
            {progress.errors.map((err, i) => (
              <li key={i} className="text-[11px] text-red-300/80">
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Job list (when available) */}
      {jobs.length > 0 && (
        <div className="max-h-48 overflow-y-auto border-t border-slate-800 pt-2 space-y-0.5">
          {jobs.map((job) => (
            <JobRow key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
