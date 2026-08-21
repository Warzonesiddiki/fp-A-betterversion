// =============================================================================
// PERIOD CLOSE PAGE (F-01) — month-end close workflow client UI
// -----------------------------------------------------------------------------
// The forensic audit (ZCFA-2026-08-07-003, F-01) named period close as the ONE
// capability with no client surface: engines + server API existed, users could
// not close a period from the UI. This page is that surface, built on the
// tested foundation:
//   - fiscal periods from buildFiscalPeriods() (real FiscalCalendar + org cfg)
//   - close state machine from PeriodCloseStateMachine (persisted offline)
//   - close checklist from FinancialCloseEngine (never invented per-page)
//   - pre-close validation via evaluateCloseReadiness (money-exact TB check)
//   - chained SHA-256 audit panel (verifyCloseChain — same canonical hashing
//     as AuditLogEngine)
//   - post-close report pack via reportDataBuilder + ExportEngine (real GL)
// RBAC: read-only for every role; close/reopen gated by period:close /
// period:reopen (Admin, FP&A_Manager) — mirrors server TRANSITION_ROLES.
// =============================================================================

import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Lock,
  Unlock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileDown,
  Link2,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LiveRegion } from '@/components/ui/LiveRegion';
import { useGLStore } from '@/store/glStore';
import { useBudgetStore } from '@/store/budgetStore';
import { useSettingsStore } from '@/store/settingsStore';
import { usePeriodCloseStore, type CloseChainEntry } from '@/store/periodCloseStore';
import { hasPermission, useAuthStore } from '@/store/authStore';
import { Permissions } from '@/utils/rbacEnforcer';
import { buildFiscalPeriods } from '@/utils/fiscalPeriods';
import {
  evaluateCloseReadiness,
  isTransitionAllowed,
  entriesForPeriod,
  type CloseTransition,
} from '@/utils/periodCloseReadiness';
import { PeriodCloseStateMachine } from '@/engines/PeriodCloseStateMachine';
import { FinancialCloseEngine } from '@/engines/FinancialCloseEngine';
import { buildReportData } from '@/engines/reportDataBuilder';
import { ExportEngine } from '@/engines/ExportEngine';
import { formatMoney } from '@/utils/money';
import { formatNumber } from '@/utils/financialFormatting';

// Deterministic default jurisdiction for the close checklist (US-GAAP).
// The org settings store does not yet carry a jurisdiction field; this is a
// labeled default, replaced when org settings expose one.
const DEFAULT_JURISDICTION = 'US-GAAP';

const STATE_BADGE: Record<string, { label: string; className: string }> = {
  open: {
    label: 'Open',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  'soft-close': {
    label: 'Soft Close',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  },
  'hard-close': {
    label: 'Hard Close',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  },
  locked: {
    label: 'Locked',
    className: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  },
};

const TASK_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  'not-started': {
    label: 'Not started',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  },
  'in-progress': {
    label: 'In progress',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  },
  blocked: {
    label: 'Blocked',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  },
  complete: {
    label: 'Complete',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  },
};

const TASK_PRIORITY_BADGE: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  medium: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  high: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

function stateBadge(state: string) {
  return (
    STATE_BADGE[state] ?? {
      label: 'Open',
      className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    }
  );
}

export default function PeriodClosePage() {
  const user = useAuthStore((s) => s.user);
  const {
    entries,
    checklists,
    chain,
    initialized,
    initialize,
    transition: transitionAction,
    updateTaskStatus,
    assignTask,
    verifyChain,
  } = usePeriodCloseStore();
  const glEntries = useGLStore((s) => s.entries);
  const budgets = useBudgetStore((s) => s.budgets);
  const organization = useSettingsStore((s) => s.organization);

  const periods = useMemo(() => buildFiscalPeriods(), []);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [chainVerified, setChainVerified] = useState<{ ok: boolean; total: number } | null>(null);
  const [liveMessage, setLiveMessage] = useState('');

  useEffect(() => {
    document.title = 'FinPlan Pro — Period Close';
  }, []);

  useEffect(() => {
    if (!initialized) {
      initialize(periods, DEFAULT_JURISDICTION);
    }
  }, [initialized, initialize, periods]);

  // Default selection: current fiscal period (today within start/end), else P01.
  const currentPeriod = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (
      periods.find((p) => p.startDate.slice(0, 10) <= today && p.endDate.slice(0, 10) >= today) ??
      periods[0] ??
      null
    );
  }, [periods]);

  useEffect(() => {
    if (selectedId === null && currentPeriod) setSelectedId(currentPeriod.id);
  }, [currentPeriod, selectedId]);

  useEffect(() => {
    let cancelled = false;
    verifyChain().then((v) => {
      if (!cancelled) setChainVerified({ ok: v.ok, total: v.totalEntries });
    });
    return () => {
      cancelled = true;
    };
  }, [chain.length, verifyChain]);

  const selected = periods.find((p) => p.id === selectedId) ?? currentPeriod;
  const entry = selected ? entries[selected.id] : undefined;
  const checklist = selected ? checklists[selected.id] : undefined;

  const readiness = useMemo(() => {
    if (!selected) return null;
    return evaluateCloseReadiness(selected, glEntries, budgets, checklist);
  }, [selected, glEntries, budgets, checklist]);

  const canClose = hasPermission(user, Permissions.PERIOD_CLOSE);
  const canReopen = hasPermission(user, Permissions.PERIOD_REOPEN);
  const isAdmin = user?.role === 'Admin';
  const canSoftClose = readiness ? isTransitionAllowed(readiness, 'soft-close') : false;
  const canHardClose = readiness ? isTransitionAllowed(readiness, 'hard-close') : false;
  const canLock = readiness ? isTransitionAllowed(readiness, 'lock') : false;

  // K32-8: the blocking reason for the selected entry's primary action,
  // exposed via aria-describedby + a polite live region instead of a
  // title-only tooltip (tooltips are invisible to keyboard and many SRs).
  const blockReason: string | null = (() => {
    if (busy !== null) return `Waiting for "${busy}" to finish.`;
    if (!entry) return null;
    if (entry.state === 'open' && canClose && !canSoftClose)
      return 'Blocked: GL data or trial balance checks fail.';
    if (entry.state === 'soft-close' && canClose && !canHardClose)
      return 'Blocked: see pre-close validation.';
    if (entry.state === 'hard-close' && canClose && !canLock)
      return 'Blocked: see pre-close validation.';
    if (
      (entry.state === 'soft-close' || entry.state === 'hard-close') &&
      canReopen &&
      reason.trim().length === 0
    )
      return 'A reason is required to reopen.';
    if (entry.state === 'locked' && isAdmin && reason.trim().length === 0)
      return 'A reason is required to force-reopen.';
    return null;
  })();

  // Live region: announce status changes so screen-reader users are told when
  // a period's state changes (a11y Q5.4 pattern).
  useEffect(() => {
    if (selected && entry) {
      setLiveMessage(
        `${selected.name} ${selected.year} is ${PeriodCloseStateMachine.getStateLabel(entry.state)}`
      );
    }
  }, [selected, entry]);

  if (!selected || !entry) {
    return <PageHeader title="Period Close" purpose="No fiscal periods available." />;
  }

  const runTransition = async (transition: CloseTransition) => {
    if (!selected || busy) return;
    setBusy(transition);
    setActionError(null);
    const trialBalance =
      transition === 'hard-close' || transition === 'lock'
        ? entriesForPeriod(glEntries, selected).map((e) => ({
            accountId: e.accountId,
            debit: e.debit,
            credit: e.credit,
          }))
        : undefined;
    const result = await transitionAction(
      selected.id,
      transition,
      reason.trim() || undefined,
      trialBalance
    );
    setBusy(null);
    if (!result.success) {
      setActionError(result.error ?? 'Transition failed');
      setLiveMessage(`Cannot ${transition} ${selected.name}: ${result.error ?? 'failed'}`);
      return;
    }
    setLiveMessage(
      `${selected.name} ${selected.year} ${transition.replace('-', ' ')} — state is now ${PeriodCloseStateMachine.getStateLabel(result.newState)}`
    );
    setReason('');
    if (transition === 'lock') {
      const locked = [result.lockedLineItems ?? 0, result.lockedScenarios ?? 0];
      setLiveMessage(
        `${selected.name} locked — ${locked[0]} budget line items and ${locked[1]} scenarios frozen`
      );
    }
  };

  const exportStatement = async (preset: 'preset-pl' | 'preset-bs' | 'preset-cf') => {
    if (!selected) return;
    const periodEntries = entriesForPeriod(glEntries, selected);
    const data = buildReportData(
      {
        entries: periodEntries,
        budgetItems: [],
        entityName: 'Default Entity',
        currency: organization.baseCurrency || 'USD',
        periodLabel: `${selected.name} ${selected.year}`,
      },
      preset
    );
    const title =
      preset === 'preset-pl'
        ? `P&L ${selected.name} ${selected.year}`
        : preset === 'preset-bs'
          ? `Balance Sheet ${selected.name} ${selected.year}`
          : `Cash Flow ${selected.name} ${selected.year}`;
    await ExportEngine.exportToPDF(data, {
      title,
      companyName: organization.name || 'FinPlan Pro',
      orientation: 'landscape',
    });
  };

  const stateLabel = PeriodCloseStateMachine.getStateLabel(entry.state);
  const progress = checklist
    ? FinancialCloseEngine.computeProgress(checklist.plan, checklist.instances)
    : null;
  const periodChain = chain.filter((c) => c.periodId === selected.id);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <LiveRegion message={liveMessage} />

      {/* Header */}
      <PageHeader
        icon={<CalendarCheck className="w-6 h-6" aria-hidden="true" />}
        title="Period Close"
        purpose={
          <>
            Month-end close workflow — state machine, checklist, validation and audit trail. Base
            currency: {organization.baseCurrency || 'USD'}
          </>
        }
        actions={
          <div className="flex items-center gap-2">
            {chainVerified && (
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md ${
                  chainVerified.ok
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                {chainVerified.ok
                  ? `Audit chain verified (${chainVerified.total} event${chainVerified.total === 1 ? '' : 's'})`
                  : 'Audit chain BROKEN — investigate'}
              </span>
            )}
            <Link
              to="/audit/sox"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
              SOX Compliance
            </Link>
          </div>
        }
      />

      {/* Period grid */}
      <section aria-label="Fiscal periods">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {periods.map((p) => {
            const e = entries[p.id];
            const st = e?.state ?? 'open';
            const badge = stateBadge(st);
            const isCurrent = currentPeriod?.id === p.id;
            const isSelected = selected.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                aria-pressed={isSelected}
                aria-label={`${p.name} ${p.year} — ${badge.label}${isCurrent ? ', current period' : ''}`}
                className={`text-left rounded-xl border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isSelected
                    ? 'border-blue-500 ring-1 ring-blue-500'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                } ${isCurrent ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-card dark:bg-gray-800'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{p.name}</span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{p.year}</p>
                <p className="text-[10px] text-muted-foreground">
                  {p.startDate.slice(0, 10)} → {p.endDate.slice(0, 10)}
                </p>
                {isCurrent && (
                  <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 mt-1">
                    Current period
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: state + readiness + actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selected.name} {selected.year}
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded ${stateBadge(entry.state).className}`}
                >
                  {stateLabel}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Period</dt>
                  <dd>
                    {selected.startDate.slice(0, 10)} → {selected.endDate.slice(0, 10)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Closed by</dt>
                  <dd>{entry.closedBy ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Closed at</dt>
                  <dd>{entry.closedAt ? new Date(entry.closedAt).toLocaleString() : '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Reopened</dt>
                  <dd>
                    {entry.reopenedAt
                      ? `${entry.reopenedBy ?? ''} ${new Date(entry.reopenedAt).toLocaleString()}`
                      : '—'}
                  </dd>
                </div>
              </dl>

              {/* Readiness checklist (blocked-state UX: explicit reasons) */}
              <div aria-label="Close readiness checks">
                <h3 className="text-sm font-semibold mb-2">Pre-close validation</h3>
                {readiness && (
                  <ul className="space-y-2">
                    {readiness.checks.map((c) => (
                      <li key={c.id} className="flex items-start gap-2 text-sm">
                        {c.ok ? (
                          <CheckCircle2
                            className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0"
                            aria-hidden="true"
                          />
                        ) : (
                          <XCircle
                            className="w-4 h-4 text-red-600 mt-0.5 shrink-0"
                            aria-hidden="true"
                          />
                        )}
                        <div>
                          <span className="font-medium">{c.label}</span>
                          <span className="block text-xs text-muted-foreground">{c.detail}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {readiness && readiness.entryCount > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-muted-foreground space-y-0.5">
                    <p>
                      Debits{' '}
                      {formatMoney(readiness.totalDebits, {
                        currency: organization.baseCurrency || 'USD',
                      })}
                    </p>
                    <p>
                      Credits{' '}
                      {formatMoney(readiness.totalCredits, {
                        currency: organization.baseCurrency || 'USD',
                      })}
                    </p>
                    <p>
                      Difference{' '}
                      {formatMoney(readiness.difference, {
                        currency: organization.baseCurrency || 'USD',
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {canClose || canReopen ? (
                <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold">Actions</h3>
                  <div>
                    <label htmlFor="close-reason" className="sr-only">
                      Reason for close or reopen
                    </label>
                    <input
                      id="close-reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Reason (required for reopen, recommended for close)"
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {entry.state === 'open' && canClose && (
                      <Button
                        size="sm"
                        onClick={() => void runTransition('soft-close')}
                        disabled={busy !== null || !canSoftClose}
                        aria-disabled={busy !== null || !canSoftClose}
                        aria-describedby={
                          busy !== null || !canSoftClose ? 'period-close-block-reason' : undefined
                        }
                      >
                        {busy === 'soft-close' ? 'Closing…' : 'Start soft close'}
                      </Button>
                    )}
                    {entry.state === 'soft-close' && canClose && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void runTransition('hard-close')}
                        disabled={busy !== null || !canHardClose}
                        aria-disabled={busy !== null || !canHardClose}
                        aria-describedby={
                          busy !== null || !canHardClose ? 'period-close-block-reason' : undefined
                        }
                      >
                        {busy === 'hard-close' ? 'Closing…' : 'Hard close'}
                      </Button>
                    )}
                    {entry.state === 'hard-close' && canClose && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void runTransition('lock')}
                        disabled={busy !== null || !canLock}
                        aria-disabled={busy !== null || !canLock}
                        aria-describedby={
                          busy !== null || !canLock ? 'period-close-block-reason' : undefined
                        }
                      >
                        <Lock className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                        {busy === 'lock' ? 'Locking…' : 'Lock period'}
                      </Button>
                    )}
                    {(entry.state === 'soft-close' || entry.state === 'hard-close') &&
                      canReopen && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void runTransition('reopen')}
                          disabled={busy !== null || reason.trim().length === 0}
                          aria-disabled={busy !== null || reason.trim().length === 0}
                          aria-describedby={
                            busy !== null || reason.trim().length === 0
                              ? 'period-close-block-reason'
                              : undefined
                          }
                        >
                          <Unlock className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                          {busy === 'reopen' ? 'Reopening…' : 'Reopen period'}
                        </Button>
                      )}
                    {entry.state === 'locked' && isAdmin && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => void runTransition('force-reopen')}
                        disabled={busy !== null || reason.trim().length === 0}
                        aria-disabled={busy !== null || reason.trim().length === 0}
                        aria-describedby={
                          busy !== null || reason.trim().length === 0
                            ? 'period-close-block-reason'
                            : undefined
                        }
                      >
                        <Unlock className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                        {busy === 'force-reopen' ? 'Reopening…' : 'Force reopen (Admin)'}
                      </Button>
                    )}
                  </div>
                  {/* K32-8: blocking reason exposed as visible, programmatically
                      associated text (polite live region) instead of title-only tooltip */}
                  <p
                    id="period-close-block-reason"
                    aria-live="polite"
                    data-testid="period-close-block-reason"
                    className="text-xs text-[var(--text-muted)] min-h-4"
                  >
                    {blockReason ?? ''}
                  </p>
                  {actionError && (
                    <p
                      role="alert"
                      className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                      {actionError}
                    </p>
                  )}
                  {!canClose && !canReopen && (
                    <p className="text-xs text-muted-foreground">
                      Read-only view — your role cannot close or reopen periods.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground pt-2 border-t border-gray-200 dark:border-gray-700">
                  Read-only view — your role cannot close or reopen periods.
                </p>
              )}

              {/* Post-close report pack */}
              {(entry.state === 'hard-close' || entry.state === 'locked') && (
                <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <FileDown className="w-4 h-4" aria-hidden="true" />
                    Post-close report pack
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Generated from real GL entries for {selected.name} {selected.year}.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void exportStatement('preset-pl')}
                    >
                      Export P&amp;L (PDF)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void exportStatement('preset-bs')}
                    >
                      Export Balance Sheet (PDF)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void exportStatement('preset-cf')}
                    >
                      Export Cash Flow (PDF)
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: checklist + audit trail */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Close checklist
                {progress && (
                  <span className="text-xs font-normal text-muted-foreground ml-auto">
                    {progress.percentComplete}% complete
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checklist ? (
                <div className="space-y-3">
                  <div
                    role="progressbar"
                    aria-valuenow={progress?.percentComplete ?? 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Close checklist progress"
                    className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
                  >
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${progress?.percentComplete ?? 0}%` }}
                    />
                  </div>
                  <ul className="space-y-2">
                    {checklist.plan.tasks.map((task) => {
                      const instance = checklist.instances.find((i) => i.taskId === task.id);
                      const status = instance?.status ?? 'not-started';
                      const badge = TASK_STATUS_BADGE[status] ?? { label: status, className: '' };
                      const priority =
                        TASK_PRIORITY_BADGE[task.priority] ??
                        TASK_PRIORITY_BADGE.low ??
                        'bg-gray-100 text-gray-600';
                      return (
                        <li
                          key={task.id}
                          className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">{task.name}</p>
                              <p className="text-xs text-muted-foreground">{task.description}</p>
                            </div>
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${priority}`}
                            >
                              {task.priority}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{task.category}</span>
                            <span>·</span>
                            <span>Role: {task.assigneeRole}</span>
                            <span>·</span>
                            <span>{task.estimatedHours}h</span>
                            {task.regulatoryFlag && (
                              <span className="text-amber-600 dark:text-amber-400">regulatory</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {canClose ? (
                              <>
                                <select
                                  aria-label={`Status for ${task.name}`}
                                  value={status}
                                  onChange={(e) => {
                                    void updateTaskStatus(
                                      selected.id,
                                      task.id,
                                      e.target.value as typeof status
                                    );
                                  }}
                                  className="text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                >
                                  {Object.keys(TASK_STATUS_BADGE).map((s) => (
                                    <option key={s} value={s}>
                                      {TASK_STATUS_BADGE[s]?.label ?? s}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  aria-label={`Assignee for ${task.name}`}
                                  value={instance?.assignee ?? ''}
                                  onChange={(e) => {
                                    if (e.target.value)
                                      void assignTask(selected.id, task.id, e.target.value);
                                  }}
                                  placeholder="Assignee"
                                  className="text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                />
                              </>
                            ) : (
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badge.className}`}
                              >
                                {badge.label}
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Checklist not initialized.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                Close audit trail
                <button
                  type="button"
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  onClick={() => {
                    void verifyChain(selected.id).then((v) =>
                      setChainVerified({ ok: v.ok, total: v.totalEntries })
                    );
                  }}
                  aria-label="Re-verify audit chain"
                >
                  <RefreshCw className="w-3 h-3" aria-hidden="true" />
                  Verify
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {periodChain.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No close events recorded for {selected.name} {selected.year}.
                </p>
              ) : (
                <ol className="space-y-2">
                  {[...periodChain]
                    .sort((a, b) => b.event.timestamp.localeCompare(a.event.timestamp))
                    .map((c: CloseChainEntry) => (
                      <li
                        key={c.id}
                        className="rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">
                            {c.event.fromState}{' '}
                            <ChevronRight className="w-3 h-3 inline" aria-hidden="true" />{' '}
                            {c.event.toState}
                          </p>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(c.event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {c.event.transition} · actor {c.event.actorId}
                          {c.event.reason ? ` · ${c.event.reason}` : ''}
                          {c.event.approvalId
                            ? ` · approval ${c.event.approvalId.slice(0, 8)}…`
                            : ''}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground mt-1 truncate">
                          {c.entryHash}
                        </p>
                      </li>
                    ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['open', 'soft-close', 'hard-close', 'locked'] as const).map((st) => {
          const count = periods.filter((p) => (entries[p.id]?.state ?? 'open') === st).length;
          return (
            <div key={st} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
              <p className="text-2xl font-bold">{formatNumber(count)}</p>
              <p className="text-xs text-muted-foreground">
                {PeriodCloseStateMachine.getStateLabel(st)} periods
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
