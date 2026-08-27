import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/connection.js';
import { resolveTenantId } from '../db/tenancy.js';
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

const CreateForecastSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  fiscal_year: z.number().int().min(2000).max(2100),
  method: z.enum(['linear', 'seasonal', 'manual', 'ai']).optional(),
  entity_id: z.string().uuid().optional(),
  budget_id: z.string().uuid().optional(),
  status: z.enum(['Draft', 'Active', 'Archived']).optional(),
});

const UpdateForecastSchema = CreateForecastSchema.partial();

const CreatePeriodSchema = z.object({
  period_number: z.number().int().min(1).max(12),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  label: z.string().optional(),
});

const CreateForecastLineItemSchema = z.object({
  account_id: z.string().uuid('account_id is required'),
  period_id: z.string().uuid('period_id is required'),
  amount: z.number(),
  department_id: z.string().uuid().optional(),
  notes: z.string().optional(),
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

// API-facing statuses are TitleCase; the schema CHECK on forecasts.status
// only permits the lowercase set ('draft'|'active'|'archived'|'locked').
function toDbStatus(status?: string): string | undefined {
  if (status === undefined) return undefined;
  return status.toLowerCase();
}

// --- Routes ---

// GET / — list forecasts with optional status/year filter
router.get('/', filterByEntityAccess, (req: Request, res: Response) => {
  try {
    const { status, fiscal_year, limit = '50', offset = '0' } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];

    // Tenant scope (W0.2b)
    conditions.push('f.tenant_id = ?');
    params.push(resolveTenantId(req.user));

    // Entity-level access filter
    const entityFilter = (req as unknown as Record<string, unknown>).entityFilter as
      | string[]
      | null;
    if (entityFilter !== null && entityFilter.length > 0) {
      conditions.push(`f.entity_id IN (${entityFilter.map(() => '?').join(', ')})`);
      params.push(...entityFilter);
    } else if (entityFilter !== null && entityFilter.length === 0) {
      res.json({ data: [], total: 0, limit: Number(limit), offset: Number(offset) });
      return;
    }

    if (status && typeof status === 'string') {
      conditions.push('f.status = ?');
      params.push(status);
    }
    if (fiscal_year && typeof fiscal_year === 'string') {
      conditions.push('f.fiscal_year = ?');
      params.push(Number(fiscal_year));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db
      .prepare(`SELECT COUNT(*) AS count FROM forecasts f ${whereClause}`)
      .get(...params) as { count: number } | undefined;

    params.push(Number(limit), Number(offset));

    const rows = db
      .prepare(
        `SELECT f.*, e.name AS entity_name
       FROM forecasts f
       LEFT JOIN entities e ON e.id = f.entity_id
       ${whereClause}
       ORDER BY f.created_at DESC
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
    console.error('GET /forecasts error:', err);
    res.status(500).json({ error: 'Failed to fetch forecasts' });
  }
});

// GET /:id — get forecast with periods and line items
router.get('/:id', requireEntityAccess('forecasts'), (req: Request, res: Response) => {
  try {
    const forecast = db
      .prepare(
        `SELECT f.*, e.name AS entity_name
       FROM forecasts f
       LEFT JOIN entities e ON e.id = f.entity_id
       WHERE f.id = ? AND f.tenant_id = ?`
      )
      .get(String(req.params.id), resolveTenantId(req.user));

    if (!forecast) {
      res.status(404).json({ error: 'Forecast not found' });
      return;
    }

    const periods = db
      .prepare(
        'SELECT * FROM forecast_periods WHERE forecast_id = ? AND tenant_id = ? ORDER BY period_number'
      )
      .all(String(req.params.id), resolveTenantId(req.user));

    const lineItems = db
      .prepare(
        `SELECT fli.*, a.name AS account_name, a.code AS account_code,
              fp.period_number, fp.label AS period_label,
              d.name AS department_name
       FROM forecast_line_items fli
       LEFT JOIN accounts a ON a.id = fli.account_id
       LEFT JOIN forecast_periods fp ON fp.id = fli.period_id
       LEFT JOIN departments d ON d.id = fli.department_id
       WHERE fli.forecast_id = ? AND fli.tenant_id = ?
       ORDER BY fp.period_number, a.code`
      )
      .all(String(req.params.id), resolveTenantId(req.user));

    res.json({ ...(forecast as Record<string, unknown>), periods, line_items: lineItems });
  } catch (err) {
    console.error('GET /forecasts/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch forecast' });
  }
});

// POST / — create forecast
router.post(
  '/',
  requireEntityWriteAccess('forecasts', { entityIdSource: 'body' }),
  (req: Request, res: Response) => {
    try {
      const parsed = CreateForecastSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
        return;
      }

      const { name, description, fiscal_year, method, entity_id, budget_id, status } = parsed.data;
      const id = uuidv4();

      db.prepare(
        `INSERT INTO forecasts (id, tenant_id, name, description, fiscal_year, method, entity_id, budget_id, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      ).run(
        id,
        resolveTenantId(req.user),
        name,
        description ?? null,
        fiscal_year,
        method ?? 'manual',
        entity_id ?? null,
        budget_id ?? null,
        status ?? 'draft',
        req.user!.id
      );

      audit('CREATE', 'forecast', id, req.user!.id, resolveTenantId(req.user), {
        name,
        fiscal_year,
      });

      const forecast = db.prepare('SELECT * FROM forecasts WHERE id = ?').get(id);
      res.status(201).json(forecast);
    } catch (err) {
      console.error('POST /forecasts error:', err);
      res.status(500).json({ error: 'Failed to create forecast' });
    }
  }
);

// PUT /:id — update forecast
router.put('/:id', requireEntityWriteAccess('forecasts'), (req: Request, res: Response) => {
  try {
    // W0.2b-fixes (LOW-2): status changes are workflow-gated (explicit
    // submit/approve/reject/transition endpoints); direct status assignment
    // via PUT would bypass those gates.
    if ('status' in req.body) {
      res.status(400).json({ error: 'Status changes must use the dedicated workflow endpoints' });
      return;
    }
    const parsed = UpdateForecastSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const existing = db
      .prepare('SELECT id FROM forecasts WHERE id = ? AND tenant_id = ?')
      .get(String(req.params.id), resolveTenantId(req.user));

    if (!existing) {
      res.status(404).json({ error: 'Forecast not found' });
      return;
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

    db.prepare(`UPDATE forecasts SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`).run(
      ...values,
      resolveTenantId(req.user)
    );

    audit(
      'UPDATE',
      'forecast',
      String(req.params.id),
      req.user!.id,
      resolveTenantId(req.user),
      parsed.data
    );

    const forecast = db
      .prepare('SELECT * FROM forecasts WHERE id = ? AND tenant_id = ?')
      .get(String(req.params.id), resolveTenantId(req.user));
    res.json(forecast);
  } catch (err) {
    console.error('PUT /forecasts/:id error:', err);
    res.status(500).json({ error: 'Failed to update forecast' });
  }
});

// DELETE /:id — delete forecast
router.delete('/:id', requireEntityWriteAccess('forecasts'), (req: Request, res: Response) => {
  try {
    const existing = db
      .prepare('SELECT id FROM forecasts WHERE id = ? AND tenant_id = ?')
      .get(String(req.params.id), resolveTenantId(req.user));

    if (!existing) {
      res.status(404).json({ error: 'Forecast not found' });
      return;
    }

    const deleteForecast = db.transaction((forecastId: string) => {
      db.prepare('DELETE FROM forecast_line_items WHERE forecast_id = ? AND tenant_id = ?').run(
        forecastId,
        resolveTenantId(req.user)
      );
      db.prepare('DELETE FROM forecast_periods WHERE forecast_id = ? AND tenant_id = ?').run(
        forecastId,
        resolveTenantId(req.user)
      );
      db.prepare('DELETE FROM forecasts WHERE id = ? AND tenant_id = ?').run(
        forecastId,
        resolveTenantId(req.user)
      );
    });

    deleteForecast(String(req.params.id));

    audit('DELETE', 'forecast', String(req.params.id), req.user!.id, resolveTenantId(req.user));

    res.status(204).send();
  } catch (err) {
    console.error('DELETE /forecasts/:id error:', err);
    res.status(500).json({ error: 'Failed to delete forecast' });
  }
});

// GET /:id/periods — list periods
router.get('/:id/periods', requireEntityAccess('forecasts'), (req: Request, res: Response) => {
  try {
    const forecast = db
      .prepare('SELECT id FROM forecasts WHERE id = ? AND tenant_id = ?')
      .get(String(req.params.id), resolveTenantId(req.user));

    if (!forecast) {
      res.status(404).json({ error: 'Forecast not found' });
      return;
    }

    const periods = db
      .prepare(
        'SELECT * FROM forecast_periods WHERE forecast_id = ? AND tenant_id = ? ORDER BY period_number'
      )
      .all(String(req.params.id), resolveTenantId(req.user));

    res.json(periods);
  } catch (err) {
    console.error('GET /forecasts/:id/periods error:', err);
    res.status(500).json({ error: 'Failed to fetch periods' });
  }
});

// POST /:id/periods — add period
router.post(
  '/:id/periods',
  requireEntityWriteAccess('forecasts'),
  (req: Request, res: Response) => {
    try {
      const parsed = CreatePeriodSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
        return;
      }

      const forecast = db
        .prepare('SELECT id FROM forecasts WHERE id = ? AND tenant_id = ?')
        .get(String(req.params.id), resolveTenantId(req.user));

      if (!forecast) {
        res.status(404).json({ error: 'Forecast not found' });
        return;
      }

      const { period_number, start_date, end_date, label } = parsed.data;
      const id = uuidv4();

      // The base schema requires NOT NULL period_id/period_name on
      // forecast_periods; the route-level shape (period_number/start/end/
      // label) is additive via ensureServerColumns.
      db.prepare(
        `INSERT INTO forecast_periods (id, tenant_id, forecast_id, period_id, period_name, period_number, start_date, end_date, label, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      ).run(
        id,
        resolveTenantId(req.user),
        String(req.params.id),
        uuidv4(),
        label ?? `${start_date}..${end_date}`,
        period_number,
        start_date,
        end_date,
        label ?? null
      );

      audit('CREATE', 'forecast_period', id, req.user!.id, resolveTenantId(req.user), {
        forecast_id: String(req.params.id),
        period_number,
      });

      const period = db.prepare('SELECT * FROM forecast_periods WHERE id = ?').get(id);
      res.status(201).json(period);
    } catch (err) {
      console.error('POST /forecasts/:id/periods error:', err);
      res.status(500).json({ error: 'Failed to create period' });
    }
  }
);

// GET /:id/items — list line items
router.get(
  '/:id/items',
  requireParentEntityAccess('forecasts', 'forecast_id'),
  (req: Request, res: Response) => {
    try {
      const forecast = db
        .prepare('SELECT id FROM forecasts WHERE id = ? AND tenant_id = ?')
        .get(String(req.params.id), resolveTenantId(req.user));

      if (!forecast) {
        res.status(404).json({ error: 'Forecast not found' });
        return;
      }

      const items = db
        .prepare(
          `SELECT fli.*, a.name AS account_name, a.code AS account_code,
              fp.period_number, fp.label AS period_label,
              d.name AS department_name
       FROM forecast_line_items fli
       LEFT JOIN accounts a ON a.id = fli.account_id
       LEFT JOIN forecast_periods fp ON fp.id = fli.period_id
       LEFT JOIN departments d ON d.id = fli.department_id
       WHERE fli.forecast_id = ? AND fli.tenant_id = ?
       ORDER BY fp.period_number, a.code`
        )
        .all(String(req.params.id), resolveTenantId(req.user));

      res.json(items);
    } catch (err) {
      console.error('GET /forecasts/:id/items error:', err);
      res.status(500).json({ error: 'Failed to fetch line items' });
    }
  }
);

// POST /:id/items — add line item
router.post(
  '/:id/items',
  requireParentEntityAccess('forecasts', 'forecast_id'),
  (req: Request, res: Response) => {
    try {
      const parsed = CreateForecastLineItemSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
        return;
      }

      const forecast = db
        .prepare('SELECT id FROM forecasts WHERE id = ? AND tenant_id = ?')
        .get(String(req.params.id), resolveTenantId(req.user));

      if (!forecast) {
        res.status(404).json({ error: 'Forecast not found' });
        return;
      }

      const { account_id, period_id, amount, department_id, notes } = parsed.data;

      // W0.2b-fixes (LOW-1): the referenced period must belong to THIS
      // forecast in THIS tenant — rejects dangling and cross-tenant FKs.
      const period = db
        .prepare(
          'SELECT id FROM forecast_periods WHERE id = ? AND forecast_id = ? AND tenant_id = ?'
        )
        .get(period_id, String(req.params.id), resolveTenantId(req.user));

      if (!period) {
        res.status(404).json({ error: 'Period not found for this forecast' });
        return;
      }

      const id = uuidv4();

      db.prepare(
        `INSERT INTO forecast_line_items (id, tenant_id, forecast_id, account_id, period_id, amount, department_id, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      ).run(
        id,
        resolveTenantId(req.user),
        String(req.params.id),
        account_id,
        period_id,
        amount,
        department_id ?? null,
        notes ?? null
      );

      audit('CREATE', 'forecast_line_item', id, req.user!.id, resolveTenantId(req.user), {
        forecast_id: String(req.params.id),
        account_id,
        period_id,
        amount,
      });

      const item = db.prepare('SELECT * FROM forecast_line_items WHERE id = ?').get(id);
      res.status(201).json(item);
    } catch (err) {
      console.error('POST /forecasts/:id/items error:', err);
      res.status(500).json({ error: 'Failed to create line item' });
    }
  }
);

export default router;
