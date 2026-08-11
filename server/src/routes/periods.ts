import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/connection.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { filterByEntityAccess } from '../middleware/entityAuth.js';

const router = Router();
router.use(authMiddleware);

// ---------------------------------------------------------------------------
// Period Close State Machine — Server Integration
// ---------------------------------------------------------------------------
// The client-side PeriodCloseStateMachine defines the canonical state model:
//   open → soft-close → hard-close → locked
// This server route enforces the same state machine, stores transitions in
// the period_close_audit table, and uses the close_state column (not the
// binary is_closed flag) for period status.
// ---------------------------------------------------------------------------

type CloseState = 'open' | 'soft-close' | 'hard-close' | 'locked';

const VALID_TRANSITIONS: Record<CloseState, CloseState[]> = {
  open: ['soft-close'],
  'soft-close': ['hard-close', 'open'],
  'hard-close': ['locked', 'open'],
  locked: ['open'],
};

const TRANSITION_ROLES: Record<string, string[]> = {
  'soft-close': ['Admin', 'FP&A_Manager', 'Manager'],
  'hard-close': ['Admin', 'FP&A_Manager'],
  lock: ['Admin'],
  reopen: ['Admin', 'Compliance'],
  'force-reopen': ['Admin'],
};

// --- Schemas ---

const ClosePeriodSchema = z.object({
  targetState: z.enum(['soft-close', 'hard-close', 'locked']).optional(),
  reason: z.string().min(1, 'Reason is required for closing a period'),
});

const ReopenPeriodSchema = z.object({
  reason: z.string().min(1, 'Reason is required for reopening a period'),
  approvalId: z.string().optional(),
});

const TransitionSchema = z.object({
  targetState: z.enum(['soft-close', 'hard-close', 'locked']),
  reason: z.string().min(1, 'Reason is required for state transitions'),
  approvalId: z.string().optional(),
});

function audit(
  action: string,
  entityType: string,
  entityId: string,
  userId: string,
  details?: Record<string, unknown>
) {
  db.prepare(
    `INSERT INTO audit_trail (id, action, entity_type, entity_id, user_id, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
  ).run(uuidv4(), action, entityType, entityId, userId, JSON.stringify(details ?? {}));
}

function auditPeriodClose(
  periodId: string,
  fromState: string,
  toState: string,
  userId: string,
  reason?: string,
  approvalId?: string
) {
  const id = uuidv4();
  db.prepare(
    `INSERT INTO period_close_audit (id, period_id, from_state, to_state, actor_id, reason, approval_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  ).run(id, periodId, fromState, toState, userId, reason ?? null, approvalId ?? null);
}

function _getCloseState(periodId: string): CloseState {
  const row = db.prepare('SELECT close_state FROM fiscal_periods WHERE id = ?').get(periodId) as
    | { close_state: string | null }
    | undefined;
  if (!row || !row.close_state) return 'open';
  return row.close_state as CloseState;
}

/**
 * PRODUCT DECISION (2026-08-03, GAP-4): a SOFT close permits adjusting
 * entries. That is its accounting purpose — it marks the books as closed for
 * routine entry while still allowing authorized adjustments until the hard
 * close. Therefore the binary `is_closed` gate (which the GL route checks)
 * is 1 ONLY for hard-close and locked; soft-close keeps the period open to
 * posting. `canPost()` and `isClosedState()` are the two sides of the same
 * policy and must stay in sync:
 *   canPost(state)     === !isClosedState(state)
 */
function isClosedState(state: CloseState): boolean {
  return state === 'hard-close' || state === 'locked';
}

function canPost(state: CloseState): boolean {
  return state === 'open' || state === 'soft-close';
}

// GET / — list fiscal periods (entity-scoped)
router.get('/', filterByEntityAccess, (req: Request, res: Response) => {
  try {
    const { year } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (year && typeof year === 'string') {
      conditions.push('year = ?');
      params.push(Number(year));
    }

    // Entity scoping
    const entityFilter = (req as unknown as Record<string, unknown>).entityFilter as
      | string[]
      | null;
    if (entityFilter && entityFilter.length > 0) {
      const placeholders = entityFilter.map(() => '?').join(',');
      conditions.push(`entity_id IN (${placeholders})`);
      params.push(...entityFilter);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = db
      .prepare(`SELECT * FROM fiscal_periods ${whereClause} ORDER BY year, period_number`)
      .all(...params);
    res.json(rows);
  } catch (err) {
    console.error('GET /periods error:', err);
    res.status(500).json({ error: 'Failed to fetch fiscal periods' });
  }
});

// GET /:id/state — get period close state
router.get('/:id/state', (req: Request, res: Response) => {
  try {
    const periodId = String(req.params.id);
    const period = db
      .prepare('SELECT id, close_state, is_closed FROM fiscal_periods WHERE id = ?')
      .get(periodId) as Record<string, unknown> | undefined;

    if (!period) {
      res.status(404).json({ error: 'Fiscal period not found' });
      return;
    }

    const state = (period.close_state as CloseState) ?? 'open';
    res.json({
      id: period.id,
      closeState: state,
      isClosed: isClosedState(state),
      canPost: canPost(state),
      validTransitions: VALID_TRANSITIONS[state] ?? [],
    });
  } catch (err) {
    console.error('GET /periods/:id/state error:', err);
    res.status(500).json({ error: 'Failed to get period state' });
  }
});

// POST /:id/transition — state machine transition (primary API)
router.post(
  '/:id/transition',
  requireRole('Admin', 'FP&A_Manager', 'Manager'),
  (req: Request, res: Response) => {
    try {
      const parsed = TransitionSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
        return;
      }

      const periodId = String(req.params.id);
      const period = db.prepare('SELECT * FROM fiscal_periods WHERE id = ?').get(periodId) as
        | Record<string, unknown>
        | undefined;

      if (!period) {
        res.status(404).json({ error: 'Fiscal period not found' });
        return;
      }

      const currentState = (period.close_state as CloseState) ?? 'open';
      const targetState = parsed.data.targetState as CloseState;

      // Validate transition
      const allowed = VALID_TRANSITIONS[currentState];
      if (!allowed || !allowed.includes(targetState)) {
        res.status(400).json({
          error: `Invalid transition from '${currentState}' to '${targetState}'. Allowed: ${allowed?.join(', ') ?? 'none'}`,
          currentState,
          allowedTransitions: allowed ?? [],
        });
        return;
      }

      // Check role authorization for this transition
      const transitionKey = targetState === 'open' ? 'reopen' : targetState;
      const requiredRoles = TRANSITION_ROLES[transitionKey] ?? ['Admin'];
      const userRole = req.user!.role;
      if (!requiredRoles.includes(userRole)) {
        res.status(403).json({
          error: `Insufficient permissions for ${transitionKey}. Required: ${requiredRoles.join(', ')}`,
          required: requiredRoles,
          current: userRole,
        });
        return;
      }

      // For reopen transitions, require approval (except for Admin)
      if (targetState === 'open' && currentState !== 'open') {
        if (userRole !== 'Admin' && !parsed.data.approvalId) {
          res.status(400).json({
            error: 'Reopen requires approval. Provide an approvalId from an authorized approver.',
          });
          return;
        }
      }

      // For force-reopen from locked, require Admin
      if (currentState === 'locked' && userRole !== 'Admin') {
        res.status(403).json({
          error: 'Force-reopen of a locked period requires Admin role.',
        });
        return;
      }

      // Execute transition
      const isClosed = isClosedState(targetState);
      const closedAt = isClosed ? "datetime('now')" : 'NULL';

      // closedAt is a fixed whitelist of two SQL literals (datetime('now') /
      // NULL) so it stays inline; closedBy is always bound as a parameter —
      // interpolating the raw actor id produced broken SQL (e.g.
      // "closed_by = admin-id" -> no such column) on real SQLite.
      db.prepare(
        `UPDATE fiscal_periods
         SET close_state = ?, is_closed = ?, closed_at = ${closedAt}, closed_by = ?, updated_at = datetime('now')
         WHERE id = ?`
      ).run(targetState, isClosed ? 1 : 0, isClosed ? req.user!.id : null, periodId);

      // Audit the transition
      auditPeriodClose(
        periodId,
        currentState,
        targetState,
        req.user!.id,
        parsed.data.reason,
        parsed.data.approvalId
      );

      audit('PERIOD_TRANSITION', 'fiscal_period', periodId, req.user!.id, {
        fromState: currentState,
        toState: targetState,
        reason: parsed.data.reason,
        approvalId: parsed.data.approvalId,
      });

      const updated = db.prepare('SELECT * FROM fiscal_periods WHERE id = ?').get(periodId);
      res.json({
        ...updated,
        closeState: targetState,
        canPost: canPost(targetState),
        validTransitions: VALID_TRANSITIONS[targetState] ?? [],
      });
    } catch (err) {
      console.error('POST /periods/:id/transition error:', err);
      res.status(500).json({ error: 'Failed to transition period state' });
    }
  }
);

// POST /:id/close — close fiscal period (legacy, now uses state machine)
router.post(
  '/:id/close',
  requireRole('Admin', 'FP&A_Manager', 'Manager'),
  (req: Request, res: Response) => {
    try {
      const parsed = ClosePeriodSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
        return;
      }

      const periodId = String(req.params.id);
      const period = db.prepare('SELECT * FROM fiscal_periods WHERE id = ?').get(periodId) as
        | Record<string, unknown>
        | undefined;

      if (!period) {
        res.status(404).json({ error: 'Fiscal period not found' });
        return;
      }

      const currentState = (period.close_state as CloseState) ?? 'open';

      // If already in a non-open state, reject
      if (currentState !== 'open') {
        res.status(400).json({
          error: `Period is already in '${currentState}' state. Use the /transition endpoint for state changes.`,
          currentState,
        });
        return;
      }

      // Determine target state (default: soft-close for backward compatibility)
      const targetState: CloseState = parsed.data.targetState ?? 'soft-close';

      // Validate transition
      const allowed = VALID_TRANSITIONS[currentState];
      if (!allowed || !allowed.includes(targetState)) {
        res.status(400).json({
          error: `Invalid transition from '${currentState}' to '${targetState}'. Allowed: ${allowed?.join(', ') ?? 'none'}`,
        });
        return;
      }

      // Execute transition
      const isClosed = isClosedState(targetState);
      const closedAt = isClosed ? "datetime('now')" : 'NULL';

      db.prepare(
        `UPDATE fiscal_periods SET close_state = ?, is_closed = ?, closed_at = ${closedAt}, closed_by = ?, updated_at = datetime('now') WHERE id = ?`
      ).run(targetState, isClosed ? 1 : 0, isClosed ? req.user!.id : null, periodId);

      // Audit the transition
      auditPeriodClose(periodId, currentState, targetState, req.user!.id, parsed.data.reason);

      audit('CLOSE', 'fiscal_period', periodId, req.user!.id, {
        name: period.name,
        reason: parsed.data.reason,
        targetState,
      });

      const updated = db.prepare('SELECT * FROM fiscal_periods WHERE id = ?').get(periodId);
      res.json(updated);
    } catch (err) {
      console.error('POST /periods/:id/close error:', err);
      res.status(500).json({ error: 'Failed to close fiscal period' });
    }
  }
);

// POST /:id/reopen — reopen fiscal period (Admin only, reason required)
router.post('/:id/reopen', requireRole('Admin'), (req: Request, res: Response) => {
  try {
    const parsed = ReopenPeriodSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const periodId = String(req.params.id);
    const period = db.prepare('SELECT * FROM fiscal_periods WHERE id = ?').get(periodId) as
      | Record<string, unknown>
      | undefined;

    if (!period) {
      res.status(404).json({ error: 'Fiscal period not found' });
      return;
    }

    const currentState = (period.close_state as CloseState) ?? 'open';

    if (currentState === 'open') {
      res.status(400).json({ error: 'Period is already open' });
      return;
    }

    // Validate transition to open
    const allowed = VALID_TRANSITIONS[currentState];
    if (!allowed || !allowed.includes('open')) {
      res.status(400).json({
        error: `Cannot reopen from '${currentState}' state. Use force-reopen for locked periods.`,
        currentState,
      });
      return;
    }

    // For locked periods, require Admin (already enforced by requireRole)
    if (currentState === 'locked' && !parsed.data.approvalId) {
      res.status(400).json({
        error: 'Force-reopen of a locked period requires admin approval. Provide an approvalId.',
      });
      return;
    }

    // Execute reopen
    db.prepare(
      `UPDATE fiscal_periods SET close_state = 'open', is_closed = 0, closed_at = NULL, closed_by = NULL, updated_at = datetime('now') WHERE id = ?`
    ).run(periodId);

    // Audit the transition
    auditPeriodClose(
      periodId,
      currentState,
      'open',
      req.user!.id,
      parsed.data.reason,
      parsed.data.approvalId
    );

    audit('REOPEN', 'fiscal_period', periodId, req.user!.id, {
      name: period.name,
      reason: parsed.data.reason,
      fromState: currentState,
      approvalId: parsed.data.approvalId,
    });

    const updated = db.prepare('SELECT * FROM fiscal_periods WHERE id = ?').get(periodId);
    res.json(updated);
  } catch (err) {
    console.error('POST /periods/:id/reopen error:', err);
    res.status(500).json({ error: 'Failed to reopen fiscal period' });
  }
});

// GET /:id/audit — get period close audit trail
router.get('/:id/audit', (req: Request, res: Response) => {
  try {
    const periodId = String(req.params.id);
    const rows = db
      .prepare(`SELECT * FROM period_close_audit WHERE period_id = ? ORDER BY created_at DESC`)
      .all(periodId);
    res.json(rows);
  } catch (err) {
    console.error('GET /periods/:id/audit error:', err);
    res.status(500).json({ error: 'Failed to fetch period close audit trail' });
  }
});

export default router;
