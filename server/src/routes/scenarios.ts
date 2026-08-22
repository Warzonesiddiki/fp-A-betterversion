import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/connection.js';
import { resolveTenantId } from '../db/tenancy.js';
import { authMiddleware, type JwtPayload } from '../middleware/auth.js';
import {
  requireEntityAccess,
  requireEntityWriteAccess,
  filterByEntityAccess,
  requireParentEntityAccess,
  getAccessibleEntityIds,
  getEntityRole,
  WRITE_ROLES,
} from '../middleware/entityAuth.js';
import { errors } from '../types/errorCodes.js';

const router = Router();
router.use(authMiddleware);

// --- Zod schemas ---

const CreateScenarioSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  type: z.enum(['optimistic', 'pessimistic', 'baseline', 'custom']).optional(),
  fiscal_year: z.number().int().min(2000).max(2100).optional(),
  entity_id: z.string().uuid().optional(),
  budget_id: z.string().uuid().optional(),
  status: z.enum(['Draft', 'Active', 'Archived']).optional(),
});

const UpdateScenarioSchema = CreateScenarioSchema.partial();

const CreateScenarioLineItemSchema = z.object({
  account_id: z.string().uuid('account_id is required'),
  month: z.number().int().min(1).max(12),
  base_amount: z.number(),
  adjusted_amount: z.number(),
  adjustment_pct: z.number().optional(),
  department_id: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const ApplyScenarioSchema = z.object({
  target: z.enum(['budget', 'forecast']),
  target_id: z.string().uuid().optional(),
  apply_adjustments: z.boolean().optional(),
});

// --- Helpers ---

function audit(
  action: string,
  entityType: string,
  entityId: string,
  userId: string,
  tenantId?: string,
  details?: Record<string, unknown>
) {
  db.prepare(
    `INSERT INTO audit_trail (id, tenant_id, action, entity_type, entity_id, user_id, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  ).run(
    uuidv4(),
    tenantId ?? 'default',
    action,
    entityType,
    entityId,
    userId,
    JSON.stringify(details ?? {})
  );
}

// API-facing statuses are TitleCase; the schema CHECK on scenarios.status
// only permits the lowercase set ('draft'|'active'|'archived'|'locked').
function toDbStatus(status?: string): string | undefined {
  if (status === undefined) return undefined;
  return status.toLowerCase();
}

// --- Entity-scope assertions (W0.2c-hardening) ------------------------------
//
// The shared entityAuth middleware is deliberately permissive when a resource
// carries no resolvable entity_id (entity scoping is optional for several of
// the resources it guards). Scenario surfaces are entity-scoped by contract,
// so every scenario route re-asserts here that the caller's scope RESOLVES and
// COVERS every entity the request touches — the scenario's own base entity AND
// any target budget/forecast/entity referenced in the payload (defect 1:
// entity-crossing on apply/read). Unresolvable or out-of-scope contexts are
// rejected with FP-0201 ("cross-tenant entity scope denied", HTTP 403) from
// the stable error-code registry — never a silently-allowed request (defect 2:
// allow-through). Global Admins bypass exactly as they do in the shared
// middleware; K25/K27 write semantics downstream are untouched.

/** null = Global Admin (unrestricted, mirrors isGlobalAdmin); otherwise the
 *  concrete set of entity ids the principal may act on. */
function entityScopeOf(user: JwtPayload): string[] | null {
  if (user.role === 'Admin') return null;
  return getAccessibleEntityIds(user.id, user.role);
}

/** Typed FP-0201 rejection payload for every scenario-route scope failure. */
function denyCrossEntityScope(res: Response, details: Record<string, unknown>): void {
  res
    .status(403)
    .json(
      errors.crossTenantScope('Cross-entity access denied for this scenario operation', details)
    );
}

/**
 * True only when the caller's scope resolves AND grants at least the required
 * role level on entityId. Fail-closed: a missing/unresolvable entity context
 * NEVER passes for scoped (non-Global-Admin) callers.
 */
function scopeCovers(
  scope: string[] | null,
  user: JwtPayload,
  entityId: string | null | undefined,
  need: 'read' | 'write'
): boolean {
  if (scope === null) return true;
  if (!entityId) return false;
  if (!scope.includes(entityId)) return false;
  const role = getEntityRole(user.id, entityId);
  if (!role) return false;
  return need === 'read' ? true : WRITE_ROLES.includes(role);
}

// --- Routes ---

// GET / — list scenarios
router.get('/', filterByEntityAccess, (req: Request, res: Response) => {
  try {
    const { type, status, fiscal_year, limit = '50', offset = '0' } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];

    // Tenant scope (W0.2b)
    conditions.push('s.tenant_id = ?');
    params.push(resolveTenantId(req.user));

    // Entity-level access filter (fail closed, W0.2c): `null` is the reserved
    // Global-Admin marker set by filterByEntityAccess ("no filter"). An ABSENT
    // (undefined) filter means the guard never ran — return an empty page
    // instead of falling through to an unfiltered, entity-crossing result.
    const entityFilter = (req as unknown as Record<string, unknown>).entityFilter as
      | string[]
      | null
      | undefined;
    if (entityFilter === undefined) {
      res.json({ data: [], total: 0, limit: Number(limit), offset: Number(offset) });
      return;
    }
    if (entityFilter !== null && entityFilter.length === 0) {
      res.json({ data: [], total: 0, limit: Number(limit), offset: Number(offset) });
      return;
    }
    if (entityFilter !== null) {
      conditions.push(`s.entity_id IN (${entityFilter.map(() => '?').join(', ')})`);
      params.push(...entityFilter);
    }

    if (type && typeof type === 'string') {
      conditions.push('s.type = ?');
      params.push(type);
    }
    if (status && typeof status === 'string') {
      conditions.push('s.status = ?');
      params.push(status);
    }
    if (fiscal_year && typeof fiscal_year === 'string') {
      conditions.push('s.fiscal_year = ?');
      params.push(Number(fiscal_year));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db
      .prepare(`SELECT COUNT(*) AS count FROM scenarios s ${whereClause}`)
      .get(...params) as { count: number } | undefined;

    params.push(Number(limit), Number(offset));

    const rows = db
      .prepare(
        `SELECT s.*, e.name AS entity_name, b.name AS budget_name
       FROM scenarios s
       LEFT JOIN entities e ON e.id = s.entity_id
       LEFT JOIN budgets b ON b.id = s.budget_id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`
      )
      .all(...params);

    res.json({
      data: rows,
      total: countRow?.count ?? 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (err) {
    console.error('GET /scenarios error:', err);
    res.status(500).json({ error: 'Failed to fetch scenarios' });
  }
});

// GET /:id — get scenario with line items
router.get('/:id', requireEntityAccess('scenarios'), (req: Request, res: Response) => {
  try {
    const scenario = db
      .prepare(
        `SELECT s.*, e.name AS entity_name, b.name AS budget_name
       FROM scenarios s
       LEFT JOIN entities e ON e.id = s.entity_id
       LEFT JOIN budgets b ON b.id = s.budget_id
       WHERE s.id = ? AND s.tenant_id = ?`
      )
      .get(String(req.params.id), resolveTenantId(req.user));

    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found' });
      return;
    }

    // W0.2c-hardening: the scenario's base entity must resolve and sit inside
    // the caller's scope (fail closed when entity_id is unresolvable).
    if (
      !scopeCovers(
        entityScopeOf(req.user!),
        req.user!,
        (scenario as Record<string, unknown>).entity_id as string | null,
        'read'
      )
    ) {
      denyCrossEntityScope(res, {
        resource: 'scenario',
        scenario_id: String(req.params.id),
        required: 'read',
      });
      return;
    }

    const lineItems = db
      .prepare(
        `SELECT sli.*, a.name AS account_name, a.code AS account_code,
              d.name AS department_name
       FROM scenario_line_items sli
       LEFT JOIN accounts a ON a.id = sli.account_id
       LEFT JOIN departments d ON d.id = sli.department_id
       WHERE sli.scenario_id = ? AND sli.tenant_id = ?
       ORDER BY sli.month, a.code`
      )
      .all(String(req.params.id), resolveTenantId(req.user));

    res.json({ ...(scenario as Record<string, unknown>), line_items: lineItems });
  } catch (err) {
    console.error('GET /scenarios/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch scenario' });
  }
});

// POST / — create scenario
router.post(
  '/',
  requireEntityWriteAccess('scenarios', { entityIdSource: 'body' }),
  (req: Request, res: Response) => {
    try {
      const parsed = CreateScenarioSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
        return;
      }

      const { name, description, type, fiscal_year, entity_id, budget_id, status } = parsed.data;
      const id = uuidv4();

      // W0.2c-hardening: a payload-referenced budget must exist within the
      // tenant AND sit inside the caller's entity scope (write). Blocks
      // creating a scenario that re-parents another entity's budget.
      if (budget_id) {
        const budget = db
          .prepare('SELECT id, entity_id FROM budgets WHERE id = ? AND tenant_id = ?')
          .get(budget_id, resolveTenantId(req.user)) as
          | { id: string; entity_id: string | null }
          | undefined;

        if (!budget) {
          res.status(404).json({ error: 'Budget not found' });
          return;
        }

        if (!scopeCovers(entityScopeOf(req.user!), req.user!, budget.entity_id, 'write')) {
          denyCrossEntityScope(res, {
            resource: 'budget',
            budget_id,
            required: 'write',
          });
          return;
        }
      }

      db.prepare(
        `INSERT INTO scenarios (id, tenant_id, name, description, type, fiscal_year, entity_id, budget_id, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      ).run(
        id,
        resolveTenantId(req.user),
        name,
        description ?? null,
        type ?? 'custom',
        fiscal_year ?? null,
        entity_id ?? null,
        budget_id ?? null,
        status ?? 'draft',
        req.user!.id
      );

      audit('CREATE', 'scenario', id, req.user!.id, resolveTenantId(req.user), { name, type });

      const scenario = db.prepare('SELECT * FROM scenarios WHERE id = ?').get(id);
      res.status(201).json(scenario);
    } catch (err) {
      console.error('POST /scenarios error:', err);
      res.status(500).json({ error: 'Failed to create scenario' });
    }
  }
);

// PUT /:id — update scenario
router.put('/:id', requireEntityWriteAccess('scenarios'), (req: Request, res: Response) => {
  try {
    // W0.2b-fixes (LOW-2): status changes are workflow-gated (explicit
    // submit/approve/reject/transition endpoints); direct status assignment
    // via PUT would bypass those gates.
    if ('status' in req.body) {
      res.status(400).json({ error: 'Status changes must use the dedicated workflow endpoints' });
      return;
    }
    const parsed = UpdateScenarioSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const existing = db
      .prepare('SELECT id, entity_id FROM scenarios WHERE id = ? AND tenant_id = ?')
      .get(String(req.params.id), resolveTenantId(req.user)) as
      | { id: string; entity_id: string | null }
      | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Scenario not found' });
      return;
    }

    // W0.2c-hardening: writes require a resolvable, in-scope entity on the
    // scenario itself...
    if (!scopeCovers(entityScopeOf(req.user!), req.user!, existing.entity_id, 'write')) {
      denyCrossEntityScope(res, {
        resource: 'scenario',
        scenario_id: String(req.params.id),
        required: 'write',
      });
      return;
    }

    // ...and any entity/budget the payload re-points to must equally sit
    // inside the caller's scope (blocks cross-entity re-parenting).
    if (
      parsed.data.entity_id !== undefined &&
      !scopeCovers(entityScopeOf(req.user!), req.user!, parsed.data.entity_id, 'write')
    ) {
      denyCrossEntityScope(res, {
        resource: 'entity',
        entity_id: parsed.data.entity_id,
        required: 'write',
      });
      return;
    }
    if (parsed.data.budget_id !== undefined) {
      const budget = db
        .prepare('SELECT id, entity_id FROM budgets WHERE id = ? AND tenant_id = ?')
        .get(parsed.data.budget_id, resolveTenantId(req.user)) as
        | { id: string; entity_id: string | null }
        | undefined;

      if (!budget) {
        res.status(404).json({ error: 'Budget not found' });
        return;
      }

      if (!scopeCovers(entityScopeOf(req.user!), req.user!, budget.entity_id, 'write')) {
        denyCrossEntityScope(res, {
          resource: 'budget',
          budget_id: parsed.data.budget_id,
          required: 'write',
        });
        return;
      }
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(key === 'status' ? toDbStatus(String(value)) : value);
      }
    }

    if (fields.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    fields.push("updated_at = datetime('now')");
    values.push(String(req.params.id));

    db.prepare(`UPDATE scenarios SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`).run(
      ...values,
      resolveTenantId(req.user)
    );

    audit(
      'UPDATE',
      'scenario',
      String(req.params.id),
      req.user!.id,
      resolveTenantId(req.user),
      parsed.data
    );

    const scenario = db
      .prepare('SELECT * FROM scenarios WHERE id = ? AND tenant_id = ?')
      .get(String(req.params.id), resolveTenantId(req.user));
    res.json(scenario);
  } catch (err) {
    console.error('PUT /scenarios/:id error:', err);
    res.status(500).json({ error: 'Failed to update scenario' });
  }
});

// DELETE /:id — delete scenario
router.delete('/:id', requireEntityWriteAccess('scenarios'), (req: Request, res: Response) => {
  try {
    const existing = db
      .prepare('SELECT id, entity_id FROM scenarios WHERE id = ? AND tenant_id = ?')
      .get(String(req.params.id), resolveTenantId(req.user)) as
      | { id: string; entity_id: string | null }
      | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Scenario not found' });
      return;
    }

    // W0.2c-hardening: deletes require a resolvable, in-scope entity on the
    // scenario (fail closed when entity_id is unresolvable).
    if (!scopeCovers(entityScopeOf(req.user!), req.user!, existing.entity_id, 'write')) {
      denyCrossEntityScope(res, {
        resource: 'scenario',
        scenario_id: String(req.params.id),
        required: 'write',
      });
      return;
    }

    const deleteScenario = db.transaction((scenarioId: string) => {
      db.prepare('DELETE FROM scenario_line_items WHERE scenario_id = ? AND tenant_id = ?').run(
        scenarioId,
        resolveTenantId(req.user)
      );
      db.prepare('DELETE FROM scenarios WHERE id = ? AND tenant_id = ?').run(
        scenarioId,
        resolveTenantId(req.user)
      );
    });

    deleteScenario(String(req.params.id));

    audit('DELETE', 'scenario', String(req.params.id), req.user!.id, resolveTenantId(req.user));

    res.status(204).send();
  } catch (err) {
    console.error('DELETE /scenarios/:id error:', err);
    res.status(500).json({ error: 'Failed to delete scenario' });
  }
});

// GET /:id/items — list line items
router.get(
  '/:id/items',
  requireParentEntityAccess('scenarios', 'scenario_id'),
  (req: Request, res: Response) => {
    try {
      const scenario = db
        .prepare('SELECT id, entity_id FROM scenarios WHERE id = ? AND tenant_id = ?')
        .get(String(req.params.id), resolveTenantId(req.user)) as
        | { id: string; entity_id: string | null }
        | undefined;

      if (!scenario) {
        res.status(404).json({ error: 'Scenario not found' });
        return;
      }

      // W0.2c-hardening: the parent scenario's entity must resolve and sit in
      // the caller's scope (fail closed when unresolvable).
      if (!scopeCovers(entityScopeOf(req.user!), req.user!, scenario.entity_id, 'read')) {
        denyCrossEntityScope(res, {
          resource: 'scenario',
          scenario_id: String(req.params.id),
          required: 'read',
        });
        return;
      }

      const items = db
        .prepare(
          `SELECT sli.*, a.name AS account_name, a.code AS account_code,
              d.name AS department_name
       FROM scenario_line_items sli
       LEFT JOIN accounts a ON a.id = sli.account_id
       LEFT JOIN departments d ON d.id = sli.department_id
       WHERE sli.scenario_id = ? AND sli.tenant_id = ?
       ORDER BY sli.month, a.code`
        )
        .all(String(req.params.id), resolveTenantId(req.user));

      res.json(items);
    } catch (err) {
      console.error('GET /scenarios/:id/items error:', err);
      res.status(500).json({ error: 'Failed to fetch line items' });
    }
  }
);

// POST /:id/items — add line item
router.post(
  '/:id/items',
  requireParentEntityAccess('scenarios', 'scenario_id'),
  (req: Request, res: Response) => {
    try {
      const parsed = CreateScenarioLineItemSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
        return;
      }

      const scenario = db
        .prepare('SELECT id, entity_id FROM scenarios WHERE id = ? AND tenant_id = ?')
        .get(String(req.params.id), resolveTenantId(req.user)) as
        | { id: string; entity_id: string | null }
        | undefined;

      if (!scenario) {
        res.status(404).json({ error: 'Scenario not found' });
        return;
      }

      // W0.2c-hardening: adding items requires a resolvable, in-scope entity
      // on the parent scenario (fail closed when unresolvable).
      if (!scopeCovers(entityScopeOf(req.user!), req.user!, scenario.entity_id, 'write')) {
        denyCrossEntityScope(res, {
          resource: 'scenario',
          scenario_id: String(req.params.id),
          required: 'write',
        });
        return;
      }

      const {
        account_id,
        month,
        base_amount,
        adjusted_amount,
        adjustment_pct,
        department_id,
        notes,
      } = parsed.data;
      const id = uuidv4();

      db.prepare(
        `INSERT INTO scenario_line_items (id, tenant_id, scenario_id, account_id, month, base_amount, adjusted_amount, adjustment_pct, department_id, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      ).run(
        id,
        resolveTenantId(req.user),
        String(req.params.id),
        account_id,
        month,
        base_amount,
        adjusted_amount,
        adjustment_pct ?? null,
        department_id ?? null,
        notes ?? null
      );

      audit('CREATE', 'scenario_line_item', id, req.user!.id, resolveTenantId(req.user), {
        scenario_id: String(req.params.id),
        account_id,
        month,
        base_amount,
        adjusted_amount,
      });

      const item = db.prepare('SELECT * FROM scenario_line_items WHERE id = ?').get(id);
      res.status(201).json(item);
    } catch (err) {
      console.error('POST /scenarios/:id/items error:', err);
      res.status(500).json({ error: 'Failed to create line item' });
    }
  }
);

// POST /:id/apply — apply scenario adjustments to base data
router.post('/:id/apply', requireEntityWriteAccess('scenarios'), (req: Request, res: Response) => {
  try {
    const parsed = ApplyScenarioSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const scenario = db
      .prepare('SELECT * FROM scenarios WHERE id = ? AND tenant_id = ?')
      .get(String(req.params.id), resolveTenantId(req.user)) as Record<string, unknown> | undefined;

    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found' });
      return;
    }

    // W0.2c-hardening (defect 1): applying requires write access to the
    // scenario's BASE entity, resolvable and in scope (fail closed when
    // entity_id is unresolvable).
    if (
      !scopeCovers(
        entityScopeOf(req.user!),
        req.user!,
        scenario.entity_id as string | null,
        'write'
      )
    ) {
      denyCrossEntityScope(res, {
        resource: 'scenario',
        scenario_id: String(req.params.id),
        required: 'write',
      });
      return;
    }

    const { target, target_id, apply_adjustments } = parsed.data;

    const lineItems = db
      .prepare('SELECT * FROM scenario_line_items WHERE scenario_id = ? AND tenant_id = ?')
      .all(String(req.params.id), resolveTenantId(req.user)) as Record<string, unknown>[];

    if (lineItems.length === 0) {
      res.status(400).json({ error: 'Scenario has no line items to apply' });
      return;
    }

    let appliedCount = 0;

    if (target === 'budget') {
      // Apply adjustments to budget line items
      const budgetId = target_id ?? scenario.budget_id;
      if (!budgetId) {
        res.status(400).json({ error: 'No target budget specified' });
        return;
      }

      const budget = db
        .prepare(
          'SELECT id, entity_id, status FROM budgets WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL'
        )
        .get(budgetId as string, resolveTenantId(req.user)) as
        | { id: string; entity_id: string | null; status: string }
        | undefined;

      if (!budget) {
        res.status(404).json({ error: 'Target budget not found' });
        return;
      }

      // W0.2c-hardening (defect 1): the TARGET budget's entity must also
      // resolve and sit inside the caller's scope with write access — a user
      // scoped to entity X must never push scenario numbers into another
      // entity's budget.
      if (!scopeCovers(entityScopeOf(req.user!), req.user!, budget.entity_id, 'write')) {
        denyCrossEntityScope(res, {
          resource: 'budget',
          budget_id: String(budgetId),
          required: 'write',
        });
        return;
      }

      if (budget.status === 'Locked') {
        res.status(400).json({ error: 'Cannot apply to a locked budget' });
        return;
      }

      // W0.2c-hardening: plain INSERT (no ON CONFLICT) — the schema defines
      // no UNIQUE(budget_id, account_id, month) target for that clause, so
      // the previous statement always failed against real SQLite. The
      // transaction below already existence-checks each row and takes the
      // UPDATE branch on hits (K27 money-safe: same single-connection,
      // serialized semantics as before).
      const insertItem = db.prepare(
        `INSERT INTO budget_line_items (id, tenant_id, budget_id, account_id, month, amount, department_id, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      );

      const applyToBudget = db.transaction((items: Record<string, unknown>[]) => {
        for (const item of items) {
          const amount =
            apply_adjustments !== false ? Number(item.adjusted_amount) : Number(item.base_amount);
          const existingItem = db
            .prepare(
              'SELECT id FROM budget_line_items WHERE budget_id = ? AND tenant_id = ? AND account_id = ? AND month = ?'
            )
            .get(budgetId, resolveTenantId(req.user), item.account_id, item.month) as
            | { id: string }
            | undefined;

          if (existingItem) {
            db.prepare(
              "UPDATE budget_line_items SET amount = ?, notes = ?, updated_at = datetime('now') WHERE id = ? AND tenant_id = ?"
            ).run(amount, item.notes ?? null, existingItem.id, resolveTenantId(req.user));
          } else {
            insertItem.run(
              uuidv4(),
              resolveTenantId(req.user),
              budgetId,
              item.account_id,
              item.month,
              amount,
              item.department_id ?? null,
              item.notes ?? null
            );
          }
          appliedCount++;
        }
      });

      applyToBudget(lineItems);
    } else if (target === 'forecast') {
      // Apply adjustments to forecast line items
      const forecastId = target_id;
      if (!forecastId) {
        res.status(400).json({ error: 'No target forecast specified' });
        return;
      }

      const forecast = db
        .prepare('SELECT id, entity_id FROM forecasts WHERE id = ? AND tenant_id = ?')
        .get(forecastId, resolveTenantId(req.user)) as
        | { id: string; entity_id: string | null }
        | undefined;

      if (!forecast) {
        res.status(404).json({ error: 'Target forecast not found' });
        return;
      }

      // W0.2c-hardening (defect 1): the TARGET forecast's entity must also
      // resolve and sit inside the caller's scope with write access — same
      // entity-crossing guard as the budget target.
      if (!scopeCovers(entityScopeOf(req.user!), req.user!, forecast.entity_id, 'write')) {
        denyCrossEntityScope(res, {
          resource: 'forecast',
          forecast_id: String(forecastId),
          required: 'write',
        });
        return;
      }

      // Get periods for the forecast to map months to period IDs
      const periods = db
        .prepare(
          'SELECT * FROM forecast_periods WHERE forecast_id = ? AND tenant_id = ? ORDER BY period_number'
        )
        .all(forecastId, resolveTenantId(req.user)) as Record<string, unknown>[];

      const periodMap = new Map<number, string>();
      for (const p of periods) {
        periodMap.set(p.period_number as number, p.id as string);
      }

      const applyToForecast = db.transaction((items: Record<string, unknown>[]) => {
        for (const item of items) {
          const periodId = periodMap.get(item.month as number);
          if (!periodId) continue;

          const amount =
            apply_adjustments !== false ? Number(item.adjusted_amount) : Number(item.base_amount);

          const existingItem = db
            .prepare(
              'SELECT id FROM forecast_line_items WHERE forecast_id = ? AND tenant_id = ? AND account_id = ? AND period_id = ?'
            )
            .get(forecastId, resolveTenantId(req.user), item.account_id, periodId) as
            | { id: string }
            | undefined;

          if (existingItem) {
            db.prepare(
              "UPDATE forecast_line_items SET amount = ?, notes = ?, updated_at = datetime('now') WHERE id = ? AND tenant_id = ?"
            ).run(amount, item.notes ?? null, existingItem.id, resolveTenantId(req.user));
          } else {
            db.prepare(
              `INSERT INTO forecast_line_items (id, tenant_id, forecast_id, account_id, period_id, amount, department_id, notes, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
            ).run(
              uuidv4(),
              resolveTenantId(req.user),
              forecastId,
              item.account_id,
              periodId,
              amount,
              item.department_id ?? null,
              item.notes ?? null
            );
          }
          appliedCount++;
        }
      });

      applyToForecast(lineItems);
    }

    audit('APPLY', 'scenario', String(req.params.id), req.user!.id, resolveTenantId(req.user), {
      target,
      target_id,
      applied_count: appliedCount,
      apply_adjustments: apply_adjustments ?? true,
    });

    res.json({
      message: `Applied ${appliedCount} line items to ${target}`,
      applied_count: appliedCount,
      target,
      target_id: target_id ?? (target === 'budget' ? scenario.budget_id : undefined),
    });
  } catch (err) {
    console.error('POST /scenarios/:id/apply error:', err);
    res.status(500).json({ error: 'Failed to apply scenario' });
  }
});

export default router;
