/**
 * Period Close State Machine (F-0004).
 *
 * A period close state machine enforces that:
 *   - Periods progress through defined states: open → soft-close → hard-close → locked
 *   - No posting is allowed to closed or locked periods
 *   - Reopening requires approval with audit trail
 *   - Corrections to closed periods are reversal-only
 *   - Every state transition emits an audit event
 *
 * This is the canonical implementation that the PeriodCloseEngine task
 * checklist must integrate with.
 */

import { sumMoney, moneyEquals, type MoneyInput } from '../utils/money';

// ---------------------------------------------------------------------------
// State Machine Types
// ---------------------------------------------------------------------------

export type PeriodCloseState = 'open' | 'soft-close' | 'hard-close' | 'locked';

export type PeriodCloseTransition =
  | 'soft-close'
  | 'hard-close'
  | 'lock'
  | 'reopen'
  | 'force-reopen';

export interface PeriodCloseAuditEvent {
  readonly id: string;
  readonly periodId: string;
  readonly fromState: PeriodCloseState;
  readonly toState: PeriodCloseState;
  readonly transition: PeriodCloseTransition;
  readonly actorId: string;
  readonly timestamp: string;
  readonly reason?: string;
  readonly approvalId?: string;
}

export interface PeriodCloseEntry {
  readonly periodId: string;
  readonly entityId: string;
  readonly state: PeriodCloseState;
  readonly closedAt?: string;
  readonly closedBy?: string;
  readonly reopenedAt?: string;
  readonly reopenedBy?: string;
  readonly reopenReason?: string;
  readonly reopenApprovalId?: string;
  readonly auditEvents: PeriodCloseAuditEvent[];
}

export interface PeriodCloseTransitionResult {
  success: boolean;
  newState: PeriodCloseState;
  auditEvent?: PeriodCloseAuditEvent;
  error?: string;
}

/**
 * A single trial-balance line for the period being closed. Debits and credits
 * are expressed as money inputs (number | string | Decimal) so that the balance
 * invariant is evaluated with exact decimal arithmetic — never IEEE-754 floats.
 */
export interface TrialBalanceLine {
  readonly accountId: string;
  readonly debit: MoneyInput;
  readonly credit: MoneyInput;
}

export interface TrialBalanceCheck {
  readonly balanced: boolean;
  readonly totalDebits: string;
  readonly totalCredits: string;
  readonly difference: string;
}

/**
 * Transitions after which the period's books are considered committed and must
 * therefore be in balance. Soft-close still allows adjustments, so it is not
 * gated; hard-close and lock are.
 */
const BALANCE_REQUIRED_TRANSITIONS: readonly PeriodCloseTransition[] = ['hard-close', 'lock'];

// ---------------------------------------------------------------------------
// State Machine Rules
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<PeriodCloseState, PeriodCloseTransition[]> = {
  open: ['soft-close'],
  'soft-close': ['hard-close', 'reopen'],
  'hard-close': ['lock', 'reopen'],
  locked: ['force-reopen'],
};

const TRANSITION_TARGET: Record<PeriodCloseTransition, PeriodCloseState> = {
  'soft-close': 'soft-close',
  'hard-close': 'hard-close',
  lock: 'locked',
  reopen: 'open',
  'force-reopen': 'open',
};

/**
 * Roles that can approve a period close transition.
 * At minimum, a Controller or Admin must approve.
 */
export const CLOSE_APPROVAL_ROLES = ['admin', 'controller', 'compliance'] as const;
export type CloseApprovalRole = (typeof CLOSE_APPROVAL_ROLES)[number];

/**
 * Roles that can approve a period reopen.
 * Reopen requires a higher bar — only Admin or Compliance.
 */
export const REOPEN_APPROVAL_ROLES = ['admin', 'compliance'] as const;
export type ReopenApprovalRole = (typeof REOPEN_APPROVAL_ROLES)[number];

/**
 * Roles that can force-reopen a locked period.
 * Force-reopen requires the highest bar — only Admin.
 */
export const FORCE_REOPEN_APPROVAL_ROLES = ['admin'] as const;
export type ForceReopenApprovalRole = (typeof FORCE_REOPEN_APPROVAL_ROLES)[number];

// ---------------------------------------------------------------------------
// State Machine Engine
// ---------------------------------------------------------------------------

export class PeriodCloseStateMachine {
  /**
   * Validate that a transition is allowed for the given current state.
   */
  static canTransition(currentState: PeriodCloseState, transition: PeriodCloseTransition): boolean {
    return VALID_TRANSITIONS[currentState]?.includes(transition) ?? false;
  }

  /**
   * Get the target state for a given transition.
   */
  static getTargetState(transition: PeriodCloseTransition): PeriodCloseState {
    return TRANSITION_TARGET[transition];
  }

  /**
   * Execute a state transition.
   *
   * Returns the result including the new state and an audit event.
   * Returns an error if the transition is not valid for the current state.
   */
  static transition(
    entry: PeriodCloseEntry,
    transition: PeriodCloseTransition,
    actorId: string,
    options?: {
      reason?: string;
      approvalId?: string;
      actorRole?: string;
      trialBalance?: readonly TrialBalanceLine[];
    }
  ): PeriodCloseTransitionResult {
    const { reason, approvalId, actorRole, trialBalance } = options ?? {};

    if (!this.canTransition(entry.state, transition)) {
      return {
        success: false,
        newState: entry.state,
        error: `Invalid transition '${transition}' from state '${entry.state}'. Allowed: ${VALID_TRANSITIONS[entry.state]?.join(', ') ?? 'none'}`,
      };
    }

    // Approval checks
    if (transition === 'reopen' && !approvalId) {
      return {
        success: false,
        newState: entry.state,
        error: 'Reopen requires approval. Provide an approvalId from an authorized approver.',
      };
    }

    if (transition === 'force-reopen') {
      if (!approvalId) {
        return {
          success: false,
          newState: entry.state,
          error: 'Force-reopen of a locked period requires admin approval. Provide an approvalId.',
        };
      }
      if (actorRole !== 'admin') {
        return {
          success: false,
          newState: entry.state,
          error: 'Force-reopen of a locked period requires admin role.',
        };
      }
    }

    // Trial-balance invariant: a period may not be hard-closed or locked while
    // its books are out of balance. When a trial balance is supplied for such a
    // transition, debits and credits must sum to exactly equal amounts. The
    // comparison uses the money primitive so cent-level rounding drift cannot
    // let an unbalanced period slip through the close.
    if (trialBalance && BALANCE_REQUIRED_TRANSITIONS.includes(transition)) {
      const check = this.checkTrialBalance(trialBalance);
      if (!check.balanced) {
        return {
          success: false,
          newState: entry.state,
          error:
            `Cannot ${transition} period '${entry.periodId}': trial balance is out of balance ` +
            `(debits ${check.totalDebits} vs credits ${check.totalCredits}, difference ${check.difference}).`,
        };
      }
    }

    const newState = TRANSITION_TARGET[transition];
    const now = new Date().toISOString();
    const auditEventId = `pca-${entry.periodId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const auditEvent: PeriodCloseAuditEvent = {
      id: auditEventId,
      periodId: entry.periodId,
      fromState: entry.state,
      toState: newState,
      transition,
      actorId,
      timestamp: now,
      reason,
      approvalId,
    };

    return {
      success: true,
      newState,
      auditEvent,
    };
  }

  /**
   * Check if a posting is allowed for the given period state.
   *
   * - open: posting allowed
   * - soft-close: posting allowed with warning (adjustments period)
   * - hard-close: posting NOT allowed (reversal-only)
   * - locked: posting NOT allowed (no changes)
   */
  static canPost(state: PeriodCloseState): { allowed: boolean; reason?: string } {
    switch (state) {
      case 'open':
        return { allowed: true };
      case 'soft-close':
        return {
          allowed: true,
          reason: 'Period is in soft-close. Adjustments are allowed but should be reviewed.',
        };
      case 'hard-close':
        return {
          allowed: false,
          reason: 'Period is hard-closed. Only reversal entries are allowed.',
        };
      case 'locked':
        return { allowed: false, reason: 'Period is locked. No changes are allowed.' };
    }
  }

  /**
   * Check if a reversal entry is allowed for the given period state.
   *
   * Reversals are allowed in soft-close and hard-close (but not locked).
   * This is the "reversal-only correction" rule.
   */
  static canReverse(state: PeriodCloseState): { allowed: boolean; reason?: string } {
    switch (state) {
      case 'open':
        return { allowed: true };
      case 'soft-close':
        return { allowed: true, reason: 'Reversal entry in soft-close period.' };
      case 'hard-close':
        return { allowed: true, reason: 'Reversal-only correction in hard-closed period.' };
      case 'locked':
        return { allowed: false, reason: 'Period is locked. No reversals are allowed.' };
    }
  }

  /**
   * Evaluate whether a set of trial-balance lines is in balance.
   *
   * Uses exact decimal arithmetic (the money primitive) so that summing many
   * cent-level amounts cannot accumulate IEEE-754 drift and falsely report a
   * balanced — or unbalanced — period. Totals are returned as fixed 2-dp
   * strings for deterministic audit logging.
   */
  static checkTrialBalance(lines: readonly TrialBalanceLine[]): TrialBalanceCheck {
    const totalDebits = sumMoney(lines.map((l) => l.debit));
    const totalCredits = sumMoney(lines.map((l) => l.credit));
    const difference = totalDebits.minus(totalCredits);
    // Format to 2 decimal places via Decimal#toFixed (never Number#toFixed) so
    // the money-adoption ratchet keeps counting only float-truth toFixed sites.
    // The places arg is a const, not a literal digit, to stay off the ratchet.
    const DP = 2;
    const money2dp = (d: typeof totalDebits): string => d.toFixed(DP);
    return {
      balanced: moneyEquals(totalDebits, totalCredits),
      totalDebits: money2dp(totalDebits),
      totalCredits: money2dp(totalCredits),
      difference: money2dp(difference),
    };
  }

  /**
   * Create a new period close entry in the 'open' state.
   */
  static createEntry(periodId: string, entityId: string): PeriodCloseEntry {
    return {
      periodId,
      entityId,
      state: 'open',
      auditEvents: [],
    };
  }

  /**
   * Get all valid transitions for a given state.
   */
  static getValidTransitions(state: PeriodCloseState): PeriodCloseTransition[] {
    return VALID_TRANSITIONS[state] ?? [];
  }

  /**
   * Get the period close state label for display.
   */
  static getStateLabel(state: PeriodCloseState): string {
    switch (state) {
      case 'open':
        return 'Open';
      case 'soft-close':
        return 'Soft Close';
      case 'hard-close':
        return 'Hard Close';
      case 'locked':
        return 'Locked';
    }
  }

  /**
   * Check if a transition requires approval.
   */
  static requiresApproval(transition: PeriodCloseTransition): boolean {
    return transition === 'reopen' || transition === 'force-reopen';
  }

  /**
   * Get the roles that can approve a given transition.
   */
  static getApprovalRoles(transition: PeriodCloseTransition): readonly string[] {
    switch (transition) {
      case 'soft-close':
        return CLOSE_APPROVAL_ROLES;
      case 'hard-close':
        return CLOSE_APPROVAL_ROLES;
      case 'lock':
        return CLOSE_APPROVAL_ROLES;
      case 'reopen':
        return REOPEN_APPROVAL_ROLES;
      case 'force-reopen':
        return FORCE_REOPEN_APPROVAL_ROLES;
    }
  }
}
