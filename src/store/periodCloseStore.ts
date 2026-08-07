// =============================================================================
// PERIOD CLOSE STORE (F-01 — month-end close client workflow)
// -----------------------------------------------------------------------------
// Offline-first client counterpart to server/src/routes/periods.ts. Owns the
// period close state machine (PeriodCloseStateMachine: open → soft-close →
// hard-close → locked), the close checklist (FinancialCloseEngine), and a
// SHA-256 chained audit log per period (same canonical hashing as
// AuditLogEngine so the panel can be verified end-to-end).
//
// RBAC (defense in depth):
//   1. The whole transition action is wrapped with enforce(PERIOD_CLOSE) —
//      the same PermissionError path the rest of the product uses.
//   2. reopen / force-reopen additionally require PERIOD_REOPEN (Admin-only,
//      mirrors server TRANSITION_ROLES) and return a clean error result when
//      missing, so the UI can render the reason instead of crashing.
// Read access is granted to every role.
//
// Persistence: zustand persist + masterStorage (chunked, encrypted) so close
// state survives restarts exactly like every other store. Server sync is
// optional/graceful — the client machine is the source of truth offline.
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { masterStorage } from '../utils/masterStorage';
import { randomId } from '@/utils/cryptoId';
import { enforce, Permissions, getCurrentUser } from '../utils/rbacEnforcer';
import {
  PeriodCloseStateMachine,
  type PeriodCloseEntry,
  type PeriodCloseState,
  type PeriodCloseTransition,
  type PeriodCloseAuditEvent,
  type TrialBalanceLine,
} from '@/engines/PeriodCloseStateMachine';
import {
  FinancialCloseEngine,
  type ClosePlan,
  type CloseTaskInstance,
  type CloseTaskStatus,
  type ClosePeriod,
} from '@/engines/FinancialCloseEngine';
import type { FiscalPeriod } from '@/types';
import { useBudgetStore } from './budgetStore';
import { useScenarioStore } from './scenarioStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A close audit event extended with its SHA-256 chain link (persisted). */
export interface CloseChainEntry {
  readonly id: string;
  readonly periodId: string;
  readonly event: PeriodCloseAuditEvent;
  readonly prevHash: string;
  readonly entryHash: string;
}

export interface PeriodChecklist {
  readonly plan: ClosePlan;
  readonly instances: readonly CloseTaskInstance[];
}

export interface PeriodCloseActionResult {
  readonly success: boolean;
  readonly newState: PeriodCloseState;
  readonly error?: string;
  readonly lockedLineItems?: number;
  readonly lockedScenarios?: number;
}

export interface ChainVerification {
  readonly ok: boolean;
  readonly totalEntries: number;
  readonly brokenAt?: number;
  readonly reason?: string;
  readonly checkedAt: string;
}

interface PeriodCloseStateShape {
  /** periodId → state-machine entry (persisted). */
  readonly entries: Record<string, PeriodCloseEntry>;
  /** periodId → close checklist (persisted). */
  readonly checklists: Record<string, PeriodChecklist>;
  /** Flat chained audit log for every close event (persisted). */
  readonly chain: readonly CloseChainEntry[];
  /** Whether entries have been seeded from the fiscal calendar. */
  readonly initialized: boolean;

  readonly initialize: (
    periods: readonly FiscalPeriod[],
    jurisdiction: string,
    entityId?: string
  ) => void;
  readonly transition: (
    periodId: string,
    transition: PeriodCloseTransition,
    reason?: string,
    trialBalance?: readonly TrialBalanceLine[],
    approvalId?: string
  ) => Promise<PeriodCloseActionResult>;
  readonly updateTaskStatus: (periodId: string, taskId: string, status: CloseTaskStatus) => boolean;
  readonly assignTask: (periodId: string, taskId: string, assignee: string) => boolean;
  readonly resetPeriod: (periodId: string) => void;
  readonly verifyChain: (periodId?: string) => Promise<ChainVerification>;
}

// ---------------------------------------------------------------------------
// SHA-256 chain helpers (canonical hashing aligned with AuditLogEngine so the
// verification panel is honest about the same chain the audit engine builds).
// ---------------------------------------------------------------------------

const EMPTY_HASH = '0'.repeat(64);

async function hashCloseEvent(event: PeriodCloseAuditEvent, prevHash: string): Promise<string> {
  const canonical = JSON.stringify({
    id: event.id,
    timestamp: event.timestamp,
    periodId: event.periodId,
    fromState: event.fromState,
    toState: event.toState,
    transition: event.transition,
    actorId: event.actorId,
    reason: event.reason ?? null,
    approvalId: event.approvalId ?? null,
    prevHash,
  });
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Recompute the hash chain over persisted entries and report integrity. */
export async function verifyCloseChain(
  entries: readonly CloseChainEntry[]
): Promise<ChainVerification> {
  const checkedAt = new Date().toISOString();
  if (entries.length === 0) {
    return { ok: true, totalEntries: 0, reason: 'EMPTY_CHAIN', checkedAt };
  }
  const ordered = [...entries].sort((a, b) => a.event.timestamp.localeCompare(b.event.timestamp));
  let prevHash = EMPTY_HASH;
  for (let i = 0; i < ordered.length; i++) {
    const stored = ordered[i]!;
    if (stored.prevHash !== prevHash) {
      return {
        ok: false,
        totalEntries: ordered.length,
        brokenAt: i,
        reason: 'BROKEN_PREV_HASH',
        checkedAt,
      };
    }
    const recomputed = await hashCloseEvent(stored.event, prevHash);
    if (recomputed !== stored.entryHash) {
      return {
        ok: false,
        totalEntries: ordered.length,
        brokenAt: i,
        reason: 'BROKEN_HASH_MISMATCH',
        checkedAt,
      };
    }
    prevHash = recomputed;
  }
  return { ok: true, totalEntries: ordered.length, checkedAt };
}

// ---------------------------------------------------------------------------
// Default checklist seeding — REAL tasks from FinancialCloseEngine (never
// invented per-page): bank recon, accruals, FX reval, IC recon, tax accrual,
// mgmt review, audit evidence, CFO approval, filing.
// ---------------------------------------------------------------------------

const CHECKLIST_PERIOD_TYPE: Record<string, ClosePeriod> = {
  Monthly: 'monthly',
  Quarterly: 'quarterly',
  Yearly: 'yearly',
};

function buildChecklist(period: FiscalPeriod, jurisdiction: string): PeriodChecklist {
  const periodType: ClosePeriod = CHECKLIST_PERIOD_TYPE[period.periodType] ?? 'monthly';
  const plan: ClosePlan = {
    id: `close-${period.id}-${period.year}`,
    period: periodType,
    fiscalYear: period.year,
    fiscalPeriod: period.periodNumber,
    jurisdiction,
    tasks: FinancialCloseEngine.generateChecklist(periodType, jurisdiction),
    deadline: period.endDate,
  };
  const instances: CloseTaskInstance[] = plan.tasks.map((t) => ({
    taskId: t.id,
    status: 'not-started' as const,
    assignee: null,
    startedAt: null,
    completedAt: null,
    notes: '',
  }));
  return { plan, instances };
}

function actorContext(): { id: string; role: string } {
  const user = getCurrentUser();
  // Role is lowercased for the state machine contract (PeriodCloseStateMachine
  // checks `actorRole !== 'admin'` for force-reopen); authStore stores 'Admin'.
  return { id: user?.id ?? 'unknown', role: (user?.role ?? 'unauthenticated').toLowerCase() };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const initialState = {
  entries: {},
  checklists: {},
  chain: [],
  initialized: false,
};

export const usePeriodCloseStore = create<PeriodCloseStateShape>()(
  persist(
    (set, get) => ({
      ...initialState,

      initialize: (periods, jurisdiction, entityId = 'entity-001') => {
        set((state) => {
          const entries = { ...state.entries };
          const checklists = { ...state.checklists };
          for (const p of periods) {
            if (!entries[p.id]) {
              entries[p.id] = PeriodCloseStateMachine.createEntry(p.id, entityId);
            }
            if (!checklists[p.id]) {
              checklists[p.id] = buildChecklist(p, jurisdiction);
            }
          }
          return { entries, checklists, initialized: true };
        });
      },

      transition: enforce(
        Permissions.PERIOD_CLOSE,
        'periodClose.transition',
        async (
          periodId: string,
          transition: PeriodCloseTransition,
          reason?: string,
          trialBalance?: readonly TrialBalanceLine[],
          approvalId?: string
        ): Promise<PeriodCloseActionResult> => {
          const state = get();
          const entry = state.entries[periodId];
          if (!entry) {
            return { success: false, newState: 'open', error: `Unknown period: ${periodId}` };
          }
          const actor = actorContext();

          // Reopen paths need the higher bar. Clean error (not a throw) so the
          // UI can surface "reopen requires Admin" as a readable reason.
          if (transition === 'reopen' || transition === 'force-reopen') {
            if (!actorRoleAllowsReopen(actor.role)) {
              return {
                success: false,
                newState: entry.state,
                error: `Insufficient permissions: '${Permissions.PERIOD_REOPEN}' required for ${transition} (Admin only).`,
              };
            }
            if (!approvalId) approvalId = randomId('reopen-approval');
          }

          const result = PeriodCloseStateMachine.transition(entry, transition, actor.id, {
            reason,
            approvalId,
            actorRole: actor.role,
            trialBalance,
          });

          if (!result.success || !result.auditEvent) {
            return { success: false, newState: entry.state, error: result.error };
          }

          const newEntry: PeriodCloseEntry = {
            ...entry,
            state: result.newState,
            auditEvents: [...entry.auditEvents, result.auditEvent],
            ...(result.newState !== 'open'
              ? { closedAt: new Date().toISOString(), closedBy: actor.id }
              : {
                  reopenedAt: new Date().toISOString(),
                  reopenedBy: actor.id,
                  reopenReason: reason,
                  reopenApprovalId: approvalId,
                }),
          };

          // Persist the event immediately; append the chain link once hashed.
          set((s) => ({ entries: { ...s.entries, [periodId]: newEntry } }));

          // Optional server-side sync when desktop server is present (graceful degradation offline)
          try {
            if (typeof fetch === 'function') {
              fetch(`/api/periods/${encodeURIComponent(periodId)}/transition`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  targetState: result.newState,
                  reason: reason ?? `Period transition to ${result.newState}`,
                  approvalId,
                }),
              }).catch(() => {
                // Offline fallback: client state machine is the local source of truth
              });
            }
          } catch {
            // Graceful degradation when network/fetch is unavailable
          }

          const prevHash =
            state.chain.filter((c) => c.periodId === periodId).at(-1)?.entryHash ?? EMPTY_HASH;
          const entryHash = await hashCloseEvent(result.auditEvent, prevHash);
          const chainEntry: CloseChainEntry = {
            id: result.auditEvent.id,
            periodId,
            event: result.auditEvent,
            prevHash,
            entryHash,
          };
          set((s) => ({ chain: [...s.chain, chainEntry] }));

          // Lock propagation (C-2): a hard lock freezes the period's budget
          // line items and the fiscal year's scenarios. Reported for the UI.
          if (result.newState === 'locked') {
            return propagateLock(periodId);
          }

          return { success: true, newState: result.newState };
        }
      ),

      updateTaskStatus: enforce(
        Permissions.PERIOD_CLOSE,
        'periodClose.updateTaskStatus',
        (periodId: string, taskId: string, status: CloseTaskStatus): boolean => {
          const checklist = get().checklists[periodId];
          if (!checklist) return false;
          const instance = checklist.instances.find((i) => i.taskId === taskId);
          if (!instance) return false;
          const updated = checklist.instances.map((i) =>
            i.taskId === taskId ? { ...i, status } : i
          );
          set((s) => ({
            checklists: {
              ...s.checklists,
              [periodId]: { ...checklist, instances: updated },
            },
          }));
          return true;
        }
      ),

      assignTask: enforce(
        Permissions.PERIOD_CLOSE,
        'periodClose.assignTask',
        (periodId: string, taskId: string, assignee: string): boolean => {
          const checklist = get().checklists[periodId];
          if (!checklist) return false;
          const instance = checklist.instances.find((i) => i.taskId === taskId);
          if (!instance) return false;
          const updated = checklist.instances.map((i) =>
            i.taskId === taskId ? FinancialCloseEngine.assignApprover(i, assignee) : i
          );
          set((s) => ({
            checklists: {
              ...s.checklists,
              [periodId]: { ...checklist, instances: updated },
            },
          }));
          return true;
        }
      ),

      resetPeriod: enforce(
        Permissions.PERIOD_CLOSE,
        'periodClose.resetPeriod',
        (periodId: string) => {
          const entry = get().entries[periodId];
          if (!entry) return;
          set((s) => {
            const fresh: PeriodCloseEntry = { ...entry, state: 'open' };
            return { entries: { ...s.entries, [periodId]: fresh } };
          });
        }
      ),

      verifyChain: async (periodId?: string) => {
        const entries = periodId ? get().chain.filter((c) => c.periodId === periodId) : get().chain;
        return verifyCloseChain(entries);
      },
    }),
    {
      name: 'period-close-store',
      storage: masterStorage,
      version: 1,
      partialize: (state) => ({
        entries: state.entries,
        checklists: state.checklists,
        chain: state.chain,
        initialized: state.initialized,
      }),
    }
  )
);

// ---------------------------------------------------------------------------
// Helpers — reopen permission + lock propagation (C-2)
// ---------------------------------------------------------------------------

/**
 * Reopen bar mirrors the server: Admin (and Compliance on the server) may
 * reopen; FP&A_Manager may close but NOT reopen a locked period.
 */
function actorRoleAllowsReopen(role: string): boolean {
  return role === 'admin';
}

/** Fiscal year of a period id, or null when not resolvable. */
function periodYearOf(periodId: string): number | null {
  const checklist = usePeriodCloseStore.getState().checklists[periodId];
  return checklist?.plan.fiscalYear ?? null;
}

/**
 * Hard-lock propagation: freeze the period's budget line items (periodId match
 * OR month+year match) and lock the fiscal year's scenarios so no plan edits
 * can slip into a locked period. Store-driven, never fabricated.
 */
function propagateLock(periodId: string): PeriodCloseActionResult {
  const budgetStore = useBudgetStore.getState();
  const scenarioStore = useScenarioStore.getState();

  const lineItems = budgetStore.lineItems ?? [];
  const budgets = budgetStore.budgets ?? [];
  const budgetYear = new Map<string, number>();
  for (const b of budgets) budgetYear.set(b.id, b.fiscalYear);

  const fiscalYear = periodYearOf(periodId);
  const periodNumber = Number(periodId.replace(/^P/, ''));
  const matched: string[] = [];
  for (const item of lineItems) {
    if (item.isLocked) continue;
    const samePeriodId = item.periodId === periodId;
    const sameMonthYear =
      fiscalYear !== null &&
      Number.isFinite(periodNumber) &&
      item.month === periodNumber &&
      budgetYear.get(item.budgetId) === fiscalYear;
    if (samePeriodId || sameMonthYear) {
      matched.push(item.id);
      budgetStore.updateLineItem(item.id, { isLocked: true });
    }
  }

  const scenarios = scenarioStore.scenarios ?? [];
  const budgetIdsByYear = new Set(
    budgets.filter((b) => b.fiscalYear === fiscalYear).map((b) => b.id)
  );
  let lockedScenarios = 0;
  for (const sc of scenarios) {
    if (sc.isLocked) continue;
    if (fiscalYear !== null && budgetIdsByYear.has(sc.baseBudgetId)) {
      scenarioStore.lockScenario(sc.id);
      lockedScenarios += 1;
    }
  }

  return {
    success: true,
    newState: 'locked',
    lockedLineItems: matched.length,
    lockedScenarios,
  };
}
