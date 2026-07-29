import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/connection.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const ClosePeriodSchema = z.object({
  reason: z.string().min(1, 'Reason is required for closing a period'),
});

const ReopenPeriodSchema = z.object({
  reason: z.string().min(1, 'Reason is required for reopening a period'),
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

// GET / — list fiscal periods
router.get('/', (req: Request, res: Response) => {
  try {
    const { year } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (year && typeof year === 'string') {
      conditions.push('year = ?');
      params.push(Number(year));
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

// POST /:id/close — close fiscal period
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

      if (period.is_closed === 1) {
        res.status(400).json({ error: 'Period is already closed' });
        return;
      }

      db.prepare(
        `UPDATE fiscal_periods SET is_closed = 1, closed_at = datetime('now'), closed_by = ?, updated_at = datetime('now') WHERE id = ?`
      ).run(req.user!.id, periodId);

      audit('CLOSE', 'fiscal_period', periodId, req.user!.id, {
        name: period.name,
        reason: parsed.data.reason,
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

    if (period.is_closed === 0) {
      res.status(400).json({ error: 'Period is already open' });
      return;
    }

    db.prepare(
      `UPDATE fiscal_periods SET is_closed = 0, closed_at = NULL, closed_by = NULL, updated_at = datetime('now') WHERE id = ?`
    ).run(periodId);

    audit('REOPEN', 'fiscal_period', periodId, req.user!.id, {
      name: period.name,
      reason: parsed.data.reason,
    });

    const updated = db.prepare('SELECT * FROM fiscal_periods WHERE id = ?').get(periodId);
    res.json(updated);
  } catch (err) {
    console.error('POST /periods/:id/reopen error:', err);
    res.status(500).json({ error: 'Failed to reopen fiscal period' });
  }
});

export default router;
