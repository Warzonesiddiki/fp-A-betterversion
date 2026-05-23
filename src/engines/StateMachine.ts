/**
 * Entity State Machine — Financial data workflows, not CRUD
 *
 * Financial entities have lifecycles:
 * - Budget: Draft → Submitted → Approved → Locked → Archived
 * - Period: Open → Soft Close → Hard Close → Locked → Archived
 * - Forecast: Draft → Published → Superseded
 *
 * Each transition can have:
 * - Role guards (who can transition)
 * - Business guards (validation rules)
 * - Side effects (notifications, audit logging)
 */

export type TransitionContext = {
  userId: string;
  userRoles: string[];
  entity: Record<string, unknown>;
  comment?: string;
  timestamp: string;
};

export type Transition = {
  from: string;
  to: string;
  guard?: (context: TransitionContext) => boolean | string;
  sideEffect?: (context: TransitionContext) => Promise<void>;
  requiresRole?: string[];
};

export type TransitionResult = {
  success: boolean;
  from?: string;
  to?: string;
  error?: string;
  availableStates?: string[];
};

export class StateMachine {
  private transitions: Map<string, Transition[]> = new Map();

  constructor(
    private name: string,
    transitions: Transition[]
  ) {
    for (const t of transitions) {
      const existing = this.transitions.get(t.from) ?? [];
      existing.push(t);
      this.transitions.set(t.from, existing);
    }
  }

  getAvailableTransitions(currentState: string, context: TransitionContext): Transition[] {
    const transitions = this.transitions.get(currentState) ?? [];
    return transitions.filter((t) => {
      if (t.requiresRole) {
        const hasRole = t.requiresRole.some((r) => context.userRoles.includes(r));
        if (!hasRole) return false;
      }
      if (t.guard) {
        const result = t.guard(context);
        if (result !== true) return false;
      }
      return true;
    });
  }

  getTargetStates(currentState: string): string[] {
    return (this.transitions.get(currentState) ?? []).map((t) => t.to);
  }

  async transition(
    currentState: string,
    targetState: string,
    context: TransitionContext
  ): Promise<TransitionResult> {
    const available = this.transitions.get(currentState) ?? [];
    const match = available.find((t) => t.to === targetState);

    if (!match) {
      return {
        success: false,
        error: `Invalid transition: ${currentState} → ${targetState}`,
        availableStates: available.map((t) => t.to),
      };
    }

    if (match.requiresRole) {
      const hasRole = match.requiresRole.some((r) => context.userRoles.includes(r));
      if (!hasRole) {
        return {
          success: false,
          error: `Requires role: ${match.requiresRole.join(' or ')}`,
        };
      }
    }

    if (match.guard) {
      const result = match.guard(context);
      if (result !== true) {
        return { success: false, error: String(result) };
      }
    }

    if (match.sideEffect) {
      await match.sideEffect(context);
    }

    return { success: true, from: currentState, to: targetState };
  }

  getName(): string {
    return this.name;
  }
}

// ─── Budget State Machine ────────────────────────────────────

export const budgetStateMachine = new StateMachine('budget', [
  {
    from: 'draft',
    to: 'submitted',
    requiresRole: ['analyst', 'admin', 'cfo'],
    guard: (ctx) => {
      const budget = ctx.entity;
      if (!budget.lineItems?.length) return 'Cannot submit empty budget';
      if (budget.totalAmount === 0) return 'Budget total cannot be zero';
      return true;
    },
  },
  {
    from: 'submitted',
    to: 'approved',
    requiresRole: ['cfo', 'controller', 'admin'],
    guard: (ctx) => {
      if (ctx.entity.createdBy === ctx.userId) {
        return 'Cannot approve your own budget';
      }
      return true;
    },
  },
  {
    from: 'submitted',
    to: 'rejected',
    requiresRole: ['cfo', 'controller', 'admin'],
    guard: (ctx) => {
      if (!ctx.comment) return 'Rejection requires a comment';
      return true;
    },
  },
  {
    from: 'approved',
    to: 'locked',
    requiresRole: ['cfo', 'admin'],
  },
  {
    from: 'rejected',
    to: 'draft',
    requiresRole: ['analyst', 'admin'],
  },
  {
    from: 'locked',
    to: 'archived',
    requiresRole: ['admin'],
  },
]);

// ─── Period Close State Machine ──────────────────────────────

export const periodStateMachine = new StateMachine('period', [
  {
    from: 'open',
    to: 'soft_close',
    requiresRole: ['controller', 'admin'],
    guard: (ctx) => {
      const unposted = ctx.entity.unpostedJournals ?? 0;
      if (unposted > 0) return `${unposted} unposted journals remain`;
      return true;
    },
  },
  {
    from: 'soft_close',
    to: 'hard_close',
    requiresRole: ['controller', 'cfo', 'admin'],
    guard: (ctx) => {
      const unreconciled = ctx.entity.unreconciledAccounts ?? 0;
      if (unreconciled > 0) return `${unreconciled} accounts not reconciled`;
      return true;
    },
  },
  {
    from: 'soft_close',
    to: 'open',
    requiresRole: ['controller', 'admin'],
    guard: (ctx) => {
      if (!ctx.comment) return 'Must provide reason for reopening';
      return true;
    },
  },
  {
    from: 'hard_close',
    to: 'locked',
    requiresRole: ['cfo', 'admin'],
  },
]);

// ─── Forecast State Machine ──────────────────────────────────

export const forecastStateMachine = new StateMachine('forecast', [
  {
    from: 'draft',
    to: 'published',
    requiresRole: ['analyst', 'manager', 'admin'],
    guard: (ctx) => {
      if (!ctx.entity.assumptions?.length) return 'Must define assumptions before publishing';
      return true;
    },
  },
  {
    from: 'published',
    to: 'superseded',
    requiresRole: ['analyst', 'manager', 'admin'],
  },
  {
    from: 'published',
    to: 'locked',
    requiresRole: ['cfo', 'admin'],
  },
  {
    from: 'locked',
    to: 'archived',
    requiresRole: ['admin'],
  },
]);

// ─── Scenario State Machine ──────────────────────────────────

export const scenarioStateMachine = new StateMachine('scenario', [
  {
    from: 'draft',
    to: 'active',
    requiresRole: ['analyst', 'manager', 'admin'],
  },
  {
    from: 'active',
    to: 'compared',
    requiresRole: ['analyst', 'manager', 'admin'],
  },
  {
    from: 'compared',
    to: 'archived',
    requiresRole: ['admin'],
  },
  {
    from: 'active',
    to: 'archived',
    requiresRole: ['admin'],
  },
]);
