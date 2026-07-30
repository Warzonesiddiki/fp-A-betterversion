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
    options?: { reason?: string; approvalId?: string; actorRole?: string }
  ): PeriodCloseTransitionResult {
    const { reason, approvalId, actorRole } = options ?? {};

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
