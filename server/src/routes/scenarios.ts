import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  requireEntityAccess,
  requireEntityWriteAccess,
  filterByEntityAccess,
  requireParentEntityAccess,
} from '../middleware/entityAuth.js';

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
  details?: Record<string, unknown>
) {
  db.prepare(
    `INSERT INTO audit_trail (id, action, entity_type, entity_id, user_id, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
  ).run(uuidv4(), action, entityType, entityId, userId, JSON.stringify(details ?? {}));
}

// --- Routes ---

// GET / — list scenarios
router.get('/', filterByEntityAccess, (req: Request, res: Response) => {
  try {
    const { type, status, fiscal_year, limit = '50', offset = '0' } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];

    // Entity-level access filter
    const entityFilter = (req as unknown as Record<string, unknown>).entityFilter as string[] | null;
    if (entityFilter !== null && entityFilter.length > 0) {
      conditions.push(`s.entity_id IN (${entityFilter.map(() => '?').join(', ')})`);
      params.push(...entityFilter);
    } else if (entityFilter !== null && entityFilter.length === 0) {
      res.json({ data: [], total: 0, limit: Number(limit), offset: Number(offset) });
      return;
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

    const countRow = db.prepare(
      `SELECT COUNT(*) AS count FROM scenarios s ${whereClause}`
    ).get(...params) as { count: number } | undefined;

    params.push(Number(limit), Number(offset));

    const rows = db.prepare(
      `SELECT s.*, e.name AS entity_name, b.name AS budget_name
       FROM scenarios s
       LEFT JOIN entities e ON e.id = s.entity_id
       LEFT JOIN budgets b ON b.id = s.budget_id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`
    ).all(...params);

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
    const scenario = db.prepare(
      `SELECT s.*, e.name AS entity_name, b.name AS budget_name
       FROM scenarios s
       LEFT JOIN entities e ON e.id = s.entity_id
       LEFT JOIN budgets b ON b.id = s.budget_id
       WHERE s.id = ?`
    ).get(req.params.id);

    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found' });
      return;
    }

    const lineItems = db.prepare(
      `SELECT sli.*, a.name AS account_name, a.code AS account_code,
              d.name AS department_name
       FROM scenario_line_items sli
       LEFT JOIN accounts a ON a.id = sli.account_id
       LEFT JOIN departments d ON d.id = sli.department_id
       WHERE sli.scenario_id = ?
       ORDER BY sli.month, a.code`
    ).all(req.params.id);

    res.json({ ...(scenario as Record<string, unknown>), line_items: lineItems });
  } catch (err) {
    console.error('GET /scenarios/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch scenario' });
  }
});

// POST / — create scenario
router.post('/', requireEntityWriteAccess('scenarios', { entityIdSource: 'body' }), (req: Request, res: Response) => {
  try {
    const parsed = CreateScenarioSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const { name, description, type, fiscal_year, entity_id, budget_id, status } = parsed.data;
    const id = uuidv4();

    db.prepare(
      `INSERT INTO scenarios (id, name, description, type, fiscal_year, entity_id, budget_id, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(id, name, description ?? null, type ?? 'custom', fiscal_year ?? null, entity_id ?? null, budget_id ?? null, status ?? 'Draft', req.user!.id);

    audit('CREATE', 'scenario', id, req.user!.id, { name, type });

    const scenario = db.prepare('SELECT * FROM scenarios WHERE id = ?').get(id);
    res.status(201).json(scenario);
  } catch (err) {
    console.error('POST /scenarios error:', err);
    res.status(500).json({ error: 'Failed to create scenario' });
  }
});

// PUT /:id — update scenario
router.put('/:id', requireEntityWriteAccess('scenarios'), (req: Request, res: Response) => {
  try {
    const parsed = UpdateScenarioSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const existing = db.prepare(
      'SELECT id FROM scenarios WHERE id = ?'
    ).get(req.params.id);

    if (!existing) {
      res.status(404).json({ error: 'Scenario not found' });
      return;
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    fields.push("updated_at = datetime('now')");
    values.push(req.params.id);

    db.prepare(
      `UPDATE scenarios SET ${fields.join(', ')} WHERE id = ?`
    ).run(...values);

    audit('UPDATE', 'scenario', req.params.id, req.user!.id, parsed.data);

    const scenario = db.prepare('SELECT * FROM scenarios WHERE id = ?').get(req.params.id);
    res.json(scenario);
  } catch (err) {
    console.error('PUT /scenarios/:id error:', err);
    res.status(500).json({ error: 'Failed to update scenario' });
  }
});

// DELETE /:id — delete scenario
router.delete('/:id', requireEntityWriteAccess('scenarios'), (req: Request, res: Response) => {
  try {
    const existing = db.prepare(
      'SELECT id FROM scenarios WHERE id = ?'
    ).get(req.params.id);

    if (!existing) {
      res.status(404).json({ error: 'Scenario not found' });
      return;
    }

    const deleteScenario = db.transaction((scenarioId: string) => {
      db.prepare('DELETE FROM scenario_line_items WHERE scenario_id = ?').run(scenarioId);
      db.prepare('DELETE FROM scenarios WHERE id = ?').run(scenarioId);
    });

    deleteScenario(req.params.id);

    audit('DELETE', 'scenario', req.params.id, req.user!.id);

    res.status(204).send();
  } catch (err) {
    console.error('DELETE /scenarios/:id error:', err);
    res.status(500).json({ error: 'Failed to delete scenario' });
  }
});

// GET /:id/items — list line items
router.get('/:id/items', requireParentEntityAccess('scenarios', 'scenario_id'), (req: Request, res: Response) => {
  try {
    const scenario = db.prepare(
      'SELECT id FROM scenarios WHERE id = ?'
    ).get(req.params.id);

    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found' });
      return;
    }

    const items = db.prepare(
      `SELECT sli.*, a.name AS account_name, a.code AS account_code,
              d.name AS department_name
       FROM scenario_line_items sli
       LEFT JOIN accounts a ON a.id = sli.account_id
       LEFT JOIN departments d ON d.id = sli.department_id
       WHERE sli.scenario_id = ?
       ORDER BY sli.month, a.code`
    ).all(req.params.id);

    res.json(items);
  } catch (err) {
    console.error('GET /scenarios/:id/items error:', err);
    res.status(500).json({ error: 'Failed to fetch line items' });
  }
});

// POST /:id/items — add line item
router.post('/:id/items', requireParentEntityAccess('scenarios', 'scenario_id'), (req: Request, res: Response) => {
  try {
    const parsed = CreateScenarioLineItemSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const scenario = db.prepare(
      'SELECT id FROM scenarios WHERE id = ?'
    ).get(req.params.id);

    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found' });
      return;
    }

    const { account_id, month, base_amount, adjusted_amount, adjustment_pct, department_id, notes } = parsed.data;
    const id = uuidv4();

    db.prepare(
      `INSERT INTO scenario_line_items (id, scenario_id, account_id, month, base_amount, adjusted_amount, adjustment_pct, department_id, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(id, req.params.id, account_id, month, base_amount, adjusted_amount, adjustment_pct ?? null, department_id ?? null, notes ?? null);

    audit('CREATE', 'scenario_line_item', id, req.user!.id, { scenario_id: req.params.id, account_id, month, base_amount, adjusted_amount });

    const item = db.prepare('SELECT * FROM scenario_line_items WHERE id = ?').get(id);
    res.status(201).json(item);
  } catch (err) {
    console.error('POST /scenarios/:id/items error:', err);
    res.status(500).json({ error: 'Failed to create line item' });
  }
});

// POST /:id/apply — apply scenario adjustments to base data
router.post('/:id/apply', requireEntityWriteAccess('scenarios'), (req: Request, res: Response) => {
  try {
    const parsed = ApplyScenarioSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const scenario = db.prepare(
      'SELECT * FROM scenarios WHERE id = ?'
    ).get(req.params.id) as Record<string, unknown> | undefined;

    if (!scenario) {
      res.status(404).json({ error: 'Scenario not found' });
      return;
    }

    const { target, target_id, apply_adjustments } = parsed.data;

    const lineItems = db.prepare(
      'SELECT * FROM scenario_line_items WHERE scenario_id = ?'
    ).all(req.params.id) as Record<string, unknown>[];

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

      const budget = db.prepare(
        'SELECT id, status FROM budgets WHERE id = ? AND deleted_at IS NULL'
      ).get(budgetId as string) as { id: string; status: string } | undefined;

      if (!budget) {
        res.status(404).json({ error: 'Target budget not found' });
        return;
      }

      if (budget.status === 'Locked') {
        res.status(400).json({ error: 'Cannot apply to a locked budget' });
        return;
      }

      const upsertItem = db.prepare(
        `INSERT INTO budget_line_items (id, budget_id, account_id, month, amount, department_id, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
         ON CONFLICT(budget_id, account_id, month) DO UPDATE SET
           amount = excluded.amount, notes = excluded.notes, updated_at = datetime('now')`
      );

      const applyToBudget = db.transaction((items: Record<string, unknown>[]) => {
        for (const item of items) {
          const amount = apply_adjustments !== false
            ? Number(item.adjusted_amount)
            : Number(item.base_amount);
          const existingItem = db.prepare(
            'SELECT id FROM budget_line_items WHERE budget_id = ? AND account_id = ? AND month = ?'
          ).get(budgetId, item.account_id, item.month) as { id: string } | undefined;

          if (existingItem) {
            db.prepare(
              "UPDATE budget_line_items SET amount = ?, notes = ?, updated_at = datetime('now') WHERE id = ?"
            ).run(amount, item.notes ?? null, existingItem.id);
          } else {
            upsertItem.run(
              uuidv4(), budgetId, item.account_id, item.month,
              amount, item.department_id ?? null, item.notes ?? null
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

      const forecast = db.prepare(
        'SELECT id FROM forecasts WHERE id = ?'
      ).get(forecastId);

      if (!forecast) {
        res.status(404).json({ error: 'Target forecast not found' });
        return;
      }

      // Get periods for the forecast to map months to period IDs
      const periods = db.prepare(
        'SELECT * FROM forecast_periods WHERE forecast_id = ? ORDER BY period_number'
      ).all(forecastId) as Record<string, unknown>[];

      const periodMap = new Map<number, string>();
      for (const p of periods) {
        periodMap.set(p.period_number as number, p.id as string);
      }

      const applyToForecast = db.transaction((items: Record<string, unknown>[]) => {
        for (const item of items) {
          const periodId = periodMap.get(item.month as number);
          if (!periodId) continue;

          const amount = apply_adjustments !== false
            ? Number(item.adjusted_amount)
            : Number(item.base_amount);

          const existingItem = db.prepare(
            'SELECT id FROM forecast_line_items WHERE forecast_id = ? AND account_id = ? AND period_id = ?'
          ).get(forecastId, item.account_id, periodId) as { id: string } | undefined;

          if (existingItem) {
            db.prepare(
              "UPDATE forecast_line_items SET amount = ?, notes = ?, updated_at = datetime('now') WHERE id = ?"
            ).run(amount, item.notes ?? null, existingItem.id);
          } else {
            db.prepare(
              `INSERT INTO forecast_line_items (id, forecast_id, account_id, period_id, amount, department_id, notes, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
            ).run(uuidv4(), forecastId, item.account_id, periodId, amount, item.department_id ?? null, item.notes ?? null);
          }
          appliedCount++;
        }
      });

      applyToForecast(lineItems);
    }

    audit('APPLY', 'scenario', req.params.id, req.user!.id, {
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
