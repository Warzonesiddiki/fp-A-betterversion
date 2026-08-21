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
} from '../middleware/entityAuth.js';

const router = Router();
router.use(authMiddleware);

// --- Zod schemas ---

const CreateReportSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  report_type: z.enum([
    'income_statement',
    'balance_sheet',
    'cash_flow',
    'trial_balance',
    'budget_vs_actual',
    'variance',
    'custom',
  ]),
  description: z.string().optional(),
  entity_id: z.string().uuid().optional(),
  fiscal_year: z.number().int().min(2000).max(2100).optional(),
  period: z.string().optional(),
  filters: z.record(z.unknown()).optional(),
  status: z.enum(['Draft', 'Published', 'Archived']).optional(),
});

const UpdateReportSchema = CreateReportSchema.partial();

const CreateTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  report_type: z.enum([
    'income_statement',
    'balance_sheet',
    'cash_flow',
    'trial_balance',
    'budget_vs_actual',
    'variance',
    'custom',
  ]),
  template_config: z.record(z.unknown()),
  is_default: z.boolean().optional(),
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

// API-facing statuses are TitleCase; the schema CHECK on reports.status only
// permits the lowercase set ('draft'|'active'|'archived'|'locked').
function toDbStatus(status?: string): string | undefined {
  if (status === undefined) return undefined;
  if (status === 'Published') return 'active';
  return status.toLowerCase();
}

// --- Report Routes ---

// GET / — list reports, optional type/status filter
router.get('/', filterByEntityAccess, (req: Request, res: Response) => {
  try {
    const { report_type, status, entity_id, limit = '50', offset = '0' } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];

    // Tenant scope (W0.2b)
    conditions.push('r.tenant_id = ?');
    params.push(resolveTenantId(req.user));

    // Entity-level access filter
    const entityFilter = (req as unknown as Record<string, unknown>).entityFilter as
      | string[]
      | null;
    if (entityFilter !== null && entityFilter.length > 0) {
      conditions.push(`r.entity_id IN (${entityFilter.map(() => '?').join(', ')})`);
      params.push(...entityFilter);
    } else if (entityFilter !== null && entityFilter.length === 0) {
      res.json({ data: [], total: 0, limit: Number(limit), offset: Number(offset) });
      return;
    }

    if (report_type && typeof report_type === 'string') {
      conditions.push('r.report_type = ?');
      params.push(report_type);
    }
    if (status && typeof status === 'string') {
      conditions.push('r.status = ?');
      params.push(status);
    }
    if (entity_id && typeof entity_id === 'string') {
      conditions.push('r.entity_id = ?');
      params.push(entity_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db
      .prepare(`SELECT COUNT(*) AS count FROM reports r ${whereClause}`)
      .get(...params) as { count: number } | undefined;

    params.push(Number(limit), Number(offset));

    const rows = db
      .prepare(
        `SELECT r.*, e.name AS entity_name
       FROM reports r
       LEFT JOIN entities e ON e.id = r.entity_id
       ${whereClause}
       ORDER BY r.created_at DESC
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
    console.error('GET /reports error:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// GET /templates — list report templates
router.get('/templates', (req: Request, res: Response) => {
  try {
    const { report_type } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];

    // Tenant scope (W0.2b)
    conditions.push('rt.tenant_id = ?');
    params.push(resolveTenantId(req.user));

    if (report_type && typeof report_type === 'string') {
      conditions.push('rt.report_type = ?');
      params.push(report_type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = db
      .prepare(`SELECT rt.* FROM report_templates rt ${whereClause} ORDER BY rt.name`)
      .all(...params);

    res.json(rows);
  } catch (err) {
    console.error('GET /reports/templates error:', err);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// POST /templates — create template
router.post('/templates', (req: Request, res: Response) => {
  try {
    const parsed = CreateTemplateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const { name, description, report_type, template_config, is_default } = parsed.data;
    const id = uuidv4();

    // The base schema's NOT NULL columns (template_type/config/layout) are
    // populated from the API payload; report_type/is_default are additive
    // columns reconciled by ensureServerColumns.
    db.prepare(
      `INSERT INTO report_templates (id, tenant_id, name, description, report_type, template_config, is_default, template_type, config, layout, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(
      id,
      resolveTenantId(req.user),
      name,
      description ?? null,
      report_type,
      JSON.stringify(template_config),
      is_default ? 1 : 0,
      'custom',
      JSON.stringify(template_config),
      '{}',
      req.user!.id
    );

    audit('CREATE', 'report_template', id, req.user!.id, resolveTenantId(req.user), {
      name,
      report_type,
    });

    const template = db.prepare('SELECT * FROM report_templates WHERE id = ?').get(id);
    res.status(201).json(template);
  } catch (err) {
    console.error('POST /reports/templates error:', err);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// GET /:id — get report
router.get('/:id', requireEntityAccess('reports'), (req: Request, res: Response) => {
  try {
    const report = db
      .prepare(
        `SELECT r.*, e.name AS entity_name
       FROM reports r
       LEFT JOIN entities e ON e.id = r.entity_id
       WHERE r.id = ? AND r.tenant_id = ?`
      )
      .get(String(req.params.id), resolveTenantId(req.user));

    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    res.json(report);
  } catch (err) {
    console.error('GET /reports/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// POST / — create report
router.post(
  '/',
  requireEntityWriteAccess('reports', { entityIdSource: 'body' }),
  (req: Request, res: Response) => {
    try {
      const parsed = CreateReportSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
        return;
      }

      const { name, report_type, description, entity_id, fiscal_year, period, filters, status } =
        parsed.data;
      const id = uuidv4();

      db.prepare(
        `INSERT INTO reports (id, tenant_id, name, report_type, description, entity_id, fiscal_year, period, filters, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      ).run(
        id,
        resolveTenantId(req.user),
        name,
        report_type,
        description ?? null,
        entity_id ?? null,
        fiscal_year ?? null,
        period ?? null,
        filters ? JSON.stringify(filters) : null,
        toDbStatus(status) ?? 'draft',
        req.user!.id
      );

      audit('CREATE', 'report', id, req.user!.id, resolveTenantId(req.user), { name, report_type });

      const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
      res.status(201).json(report);
    } catch (err) {
      console.error('POST /reports error:', err);
      res.status(500).json({ error: 'Failed to create report' });
    }
  }
);

// PUT /:id — update report
router.put('/:id', requireEntityWriteAccess('reports'), (req: Request, res: Response) => {
  try {
    // W0.2b-fixes (LOW-2): status changes are workflow-gated (explicit
    // submit/approve/reject/transition endpoints); direct status assignment
    // via PUT would bypass those gates.
    if ('status' in req.body) {
      res.status(400).json({ error: 'Status changes must use the dedicated workflow endpoints' });
      return;
    }
    const parsed = UpdateReportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const existing = db
      .prepare('SELECT id FROM reports WHERE id = ? AND tenant_id = ?')
      .get(String(req.params.id), resolveTenantId(req.user));

    if (!existing) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(
          key === 'filters'
            ? JSON.stringify(value)
            : key === 'status'
              ? toDbStatus(String(value))
              : value
        );
      }
    }

    if (fields.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    fields.push("updated_at = datetime('now')");
    values.push(String(req.params.id));

    db.prepare('UPDATE reports SET ' + fields.join(', ') + ' WHERE id = ? AND tenant_id = ?').run(
      ...values,
      resolveTenantId(req.user)
    );

    audit(
      'UPDATE',
      'report',
      String(req.params.id),
      req.user!.id,
      resolveTenantId(req.user),
      parsed.data
    );

    const report = db
      .prepare('SELECT * FROM reports WHERE id = ? AND tenant_id = ?')
      .get(String(req.params.id), resolveTenantId(req.user));
    res.json(report);
  } catch (err) {
    console.error('PUT /reports/:id error:', err);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// DELETE /:id — delete report
router.delete('/:id', requireEntityWriteAccess('reports'), (req: Request, res: Response) => {
  try {
    const existing = db
      .prepare('SELECT id FROM reports WHERE id = ? AND tenant_id = ?')
      .get(String(req.params.id), resolveTenantId(req.user));

    if (!existing) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    db.prepare('DELETE FROM reports WHERE id = ? AND tenant_id = ?').run(
      String(req.params.id),
      resolveTenantId(req.user)
    );

    audit('DELETE', 'report', String(req.params.id), req.user!.id, resolveTenantId(req.user));

    res.status(204).send();
  } catch (err) {
    console.error('DELETE /reports/:id error:', err);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

export default router;
