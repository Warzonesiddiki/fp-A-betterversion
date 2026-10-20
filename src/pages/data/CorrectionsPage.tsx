import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ClipboardList, Download } from 'lucide-react';
import { useGLStore } from '@/store/glStore';
import { useExceptionDispositionStore } from '@/store/exceptionDispositionStore';
import { runExceptionRules } from '@/services/exceptions/runExceptionRules';
import { runAggregateRules } from '@/services/exceptions/runAggregateRules';
import { buildCorrectionList } from '@/services/corrections/buildCorrectionList';
import { proposeReverifications } from '@/services/corrections/proposeReverifications';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { nowISO } from '@/utils/clock';
import type { CorrectionAuditRecord, CorrectionStatus } from '@/types/exceptions';

/**
 * Phase 5 correction tracker (DEC-035, FR-010): the reviewer asks, the
 * accounts team fixes, a human confirms. Statuses move only on explicit
 * actions; the persisted event history records the authenticated actor/time.
 * Excel remains an optional export of the same in-tool records.
 */
export default function CorrectionsPage() {
  const navigate = useNavigate();
  const entries = useGLStore((s) => s.entries);

  const dispositions = useExceptionDispositionStore((s) => s.dispositions);
  const corrections = useExceptionDispositionStore((s) => s.corrections);
  const correctionAuditTrail = useExceptionDispositionStore((s) => s.correctionAuditTrail);
  const requestCorrection = useExceptionDispositionStore((s) => s.requestCorrection);
  const updateCorrectionStatus = useExceptionDispositionStore((s) => s.updateCorrectionStatus);

  const [selectedFinding, setSelectedFinding] = useState('');
  const [instruction, setInstruction] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<CorrectionStatus | 'ALL'>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');

  useEffect(() => {
    document.title = 'FinPlan Pro — Corrections';
  }, []);

  const findings = useMemo(() => {
    if (entries.length === 0) return [];
    return [...runExceptionRules(entries).findings, ...runAggregateRules(entries)].sort((a, b) =>
      a.findingKey.localeCompare(b.findingKey)
    );
  }, [entries]);

  const result = useMemo(() => (entries.length > 0 ? runExceptionRules(entries) : null), [entries]);

  const correctable = useMemo(() => {
    const corrected = new Set(corrections.map((c) => c.exceptionId));
    return dispositions.filter((d) => d.disposition === 'ACCEPT' && !corrected.has(d.exceptionId));
  }, [dispositions, corrections]);

  const proposals = useMemo(
    () => proposeReverifications(corrections, findings, result?.examinedEntries ?? entries.length),
    [corrections, findings, result, entries.length]
  );
  const proposalKeys = useMemo(() => new Set(proposals.map((p) => p.exceptionId)), [proposals]);
  const assignees = useMemo(
    () =>
      [...new Set(corrections.map((correction) => correction.assignee))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [corrections]
  );
  const filteredCorrections = useMemo(
    () =>
      corrections.filter(
        (correction) =>
          (statusFilter === 'ALL' || correction.status === statusFilter) &&
          (assigneeFilter === 'ALL' || correction.assignee === assigneeFilter)
      ),
    [corrections, statusFilter, assigneeFilter]
  );

  const handleCreate = () => {
    const findingKey = selectedFinding || correctable[0]?.exceptionId || '';
    if (!findingKey) return;
    try {
      const finding = findings.find((f) => f.findingKey === findingKey);
      const sourceRefs = (finding?.metadata?.sourceRefs as string[] | undefined) ?? [];
      requestCorrection({
        exceptionId: findingKey,
        ruleId: finding?.ruleId,
        instruction,
        assignee,
        dueDate: dueDate || null,
        source: sourceRefs[0] ?? null,
      });
      setInstruction('');
      setAssignee('');
      setDueDate('');
      setFormError(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not record the correction.');
    }
  };

  const handleExport = () => {
    const data = buildCorrectionList({ corrections, findings, entries });
    void ExportEngine.exportToExcel(data, { title: 'Correction_List' }).catch(reportExportFailure);
  };

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Corrections"
        purpose="Track correction requests, human status changes, and their history here. Excel export is optional."
        actions={
          <Button
            size="sm"
            variant="ghost"
            onClick={handleExport}
            aria-label="Export correction list to Excel"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Excel correction list
          </Button>
        }
      />

      {correctable.length > 0 && (
        <Card>
          <CardContent className="px-6 py-4 space-y-3">
            <h2 className="font-semibold">Request a correction</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm space-y-1">
                <span className="text-[var(--text-muted)]">Accepted finding</span>
                <select
                  value={selectedFinding || correctable[0]!.exceptionId}
                  onChange={(event) => setSelectedFinding(event.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1.5"
                  aria-label="Accepted finding"
                >
                  {correctable.map((d) => (
                    <option key={d.exceptionId} value={d.exceptionId}>
                      {d.exceptionId}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm space-y-1">
                <span className="text-[var(--text-muted)]">Assignee</span>
                <input
                  value={assignee}
                  onChange={(event) => setAssignee(event.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1.5"
                  aria-label="Assignee"
                  placeholder="Who in the accounts team fixes it"
                />
              </label>
              <label className="text-sm space-y-1 md:col-span-2">
                <span className="text-[var(--text-muted)]">Correction instruction</span>
                <input
                  value={instruction}
                  onChange={(event) => setInstruction(event.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1.5"
                  aria-label="Correction instruction"
                  placeholder="What has to change, in plain words"
                />
              </label>
              <label className="text-sm space-y-1">
                <span className="text-[var(--text-muted)]">Due date (optional)</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1.5"
                  aria-label="Due date"
                />
              </label>
            </div>
            {formError && (
              <p role="alert" className="text-sm text-[var(--text-negative)]">
                {formError}
              </p>
            )}
            <Button size="sm" onClick={handleCreate}>
              Request correction
            </Button>
          </CardContent>
        </Card>
      )}

      {proposals.length > 0 && (
        <Card>
          <CardContent className="px-6 py-4 space-y-2">
            <h2 className="font-semibold">Proposed re-verifications</h2>
            {proposals.map((proposal) => (
              <div key={proposal.exceptionId} className="flex flex-wrap items-center gap-3 text-sm">
                <span className="font-mono text-xs">{proposal.exceptionId}</span>
                <span className="text-[var(--text-secondary)]">{proposal.reason}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Confirm re-verified for ${proposal.exceptionId}`}
                  onClick={() => updateCorrectionStatus(proposal.exceptionId, 'REVERIFIED')}
                >
                  Confirm re-verified
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {corrections.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ClipboardList className="h-8 w-8 mx-auto mb-3 text-[var(--text-muted)]" />
            <h2 className="text-lg font-semibold mb-2">No corrections yet</h2>
            <p className="text-[var(--text-muted)] mb-4">
              Corrections start in the exception queue: review a candidate, accept it, then request
              the correction here.
            </p>
            <Button onClick={() => navigate('/data/exceptions')}>Open the exception queue</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-wrap items-end gap-3 border-b border-[var(--border-subtle)] px-6 py-4">
              <label className="grid gap-1 text-xs text-[var(--text-muted)]">
                <span>Status</span>
                <select
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as CorrectionStatus | 'ALL')
                  }
                  className="rounded border border-[var(--border-default)] bg-[var(--bg-elevated)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
                >
                  <option value="ALL">All statuses</option>
                  {(['REQUESTED', 'APPLIED', 'REVERIFIED', 'WITHDRAWN'] as const).map((status) => (
                    <option key={status} value={status}>
                      {displayCorrectionStatus(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs text-[var(--text-muted)]">
                <span>Assignee</span>
                <select
                  aria-label="Filter by assignee"
                  value={assigneeFilter}
                  onChange={(event) => setAssigneeFilter(event.target.value)}
                  className="rounded border border-[var(--border-default)] bg-[var(--bg-elevated)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
                >
                  <option value="ALL">All assignees</option>
                  {assignees.map((assignee) => (
                    <option key={assignee} value={assignee}>
                      {assignee}
                    </option>
                  ))}
                </select>
              </label>
              <p aria-live="polite" className="ml-auto text-xs text-[var(--text-muted)]">
                Showing {filteredCorrections.length} of {corrections.length} correction requests.
                Excel export includes all requests.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Correction requests">
                <thead>
                  <tr className="text-left text-[var(--text-muted)] text-xs uppercase border-b border-[var(--border-subtle)]">
                    <th className="px-6 py-3">Finding</th>
                    <th className="px-4 py-3">Instruction</th>
                    <th className="px-4 py-3">Assignee</th>
                    <th className="px-4 py-3">Due</th>
                    <th className="px-4 py-3">Age</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredCorrections.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-[var(--text-muted)]">
                        No correction requests match these filters.
                      </td>
                    </tr>
                  ) : (
                    filteredCorrections.map((correction) => (
                      <tr key={correction.exceptionId} className="hover:bg-[var(--bg-surface)]/50">
                        <td className="px-6 py-3 font-mono text-xs">{correction.exceptionId}</td>
                        <td className="px-4 py-3">{correction.instruction}</td>
                        <td className="px-4 py-3">{correction.assignee}</td>
                        <td className="px-4 py-3">{correction.dueDate ?? '—'}</td>
                        <td className="px-4 py-3">{ageInDays(correction.requestedAt)}d</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={correction.status} />
                          {proposalKeys.has(correction.exceptionId) && (
                            <span className="block text-xs text-[var(--warning)]">
                              re-verification proposed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <CorrectionActions
                            status={correction.status}
                            onStatus={(status) =>
                              updateCorrectionStatus(correction.exceptionId, status)
                            }
                          />
                          <CorrectionHistory
                            events={correctionAuditTrail
                              .filter((event) => event.exceptionId === correction.exceptionId)
                              .sort((a, b) => a.sequenceNumber - b.sequenceNumber)}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: CorrectionStatus }) {
  return <span className="font-mono text-xs">{displayCorrectionStatus(status)}</span>;
}

function CorrectionHistory({ events }: { events: readonly CorrectionAuditRecord[] }) {
  return (
    <details className="mt-2 text-xs">
      <summary className="cursor-pointer text-[var(--text-secondary)]">
        Correction history ({events.length})
      </summary>
      {events.length === 0 ? (
        <p className="mt-1 text-[var(--text-muted)]">No audit events recorded for this request.</p>
      ) : (
        <ol className="mt-1 space-y-1">
          {events.map((event) => (
            <li key={event.sequenceNumber} className="flex flex-wrap gap-x-2">
              <strong>{displayCorrectionStatus(event.status)}</strong>
              <span>{event.recordedAt ?? 'Time not recorded (legacy event)'}</span>
              <span>
                {event.recordedBy ? `by ${event.recordedBy}` : 'Actor not recorded (legacy event)'}
              </span>
            </li>
          ))}
        </ol>
      )}
    </details>
  );
}

function displayCorrectionStatus(status: CorrectionStatus): string {
  return status === 'REVERIFIED' ? 'RE-VERIFIED' : status;
}

function CorrectionActions({
  status,
  onStatus,
}: {
  status: CorrectionStatus;
  onStatus: (status: CorrectionStatus) => void;
}) {
  if (status === 'REQUESTED') {
    return (
      <span className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => onStatus('APPLIED')}>
          Mark applied
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onStatus('WITHDRAWN')}>
          Withdraw
        </Button>
      </span>
    );
  }
  if (status === 'APPLIED') {
    return (
      <span className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => onStatus('REVERIFIED')}>
          Confirm re-verified
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onStatus('WITHDRAWN')}>
          Withdraw
        </Button>
      </span>
    );
  }
  return <span className="text-[var(--text-muted)] text-xs">—</span>;
}

/** Whole days between the request instant and today (clock-injected). */
function ageInDays(requestedAt: string): number {
  const start = Date.parse(requestedAt.slice(0, 10));
  const today = Date.parse(nowISO().slice(0, 10));
  if (Number.isNaN(start) || Number.isNaN(today)) return 0;
  return Math.max(0, Math.round((today - start) / 86_400_000));
}
