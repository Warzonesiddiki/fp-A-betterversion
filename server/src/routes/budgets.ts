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

const CreateBudgetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  fiscal_year: z.number().int().min(2000).max(2100),
  base_currency: z.string().length(3, 'Currency must be 3-letter ISO code'),
  entity_id: z.string().uuid().optional(),
  status: z.enum(['Draft', 'InReview', 'Approved', 'Locked']).optional(),
});

const UpdateBudgetSchema = CreateBudgetSchema.partial();

const CreateLineItemSchema = z.object({
  account_id: z.string().uuid('account_id is required'),
  month: z.number().int().min(1).max(12),
  amount: z.number(),
  department_id: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const UpdateLineItemSchema = CreateLineItemSchema.partial();

const WorkflowSchema = z.object({
  comment: z.string().optional(),
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

// GET / — list budgets with optional status filter and pagination
router.get('/', filterByEntityAccess, (req: Request, res: Response) => {
  try {
    const { status, limit = '50', offset = '0' } = req.query;
    const conditions: string[] = ['b.deleted_at IS NULL'];
    const params: unknown[] = [];

    // Entity-level access filter
    const entityFilter = (req as unknown as Record<string, unknown>).entityFilter as
      | string[]
      | null;
    if (entityFilter !== null && entityFilter.length > 0) {
      conditions.push(`b.entity_id IN (${entityFilter.map(() => '?').join(', ')})`);
      params.push(...entityFilter);
    } else if (entityFilter !== null && entityFilter.length === 0) {
      // User has no entity access — return empty
      res.json({ data: [], total: 0, limit: Number(limit), offset: Number(offset) });
      return;
    }

    if (status && typeof status === 'string') {
      conditions.push('b.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db
      .prepare(`SELECT COUNT(*) AS count FROM budgets b ${whereClause}`)
      .get(...params) as { count: number } | undefined;

    params.push(Number(limit), Number(offset));

    const rows = db
      .prepare(
        `SELECT b.*, e.name AS entity_name
       FROM budgets b
       LEFT JOIN entities e ON e.id = b.entity_id
       ${whereClause}
       ORDER BY b.created_at DESC
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
    console.error('GET /budgets error:', err);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// GET /:id — get budget with line items
router.get('/:id', requireEntityAccess('budgets'), (req: Request, res: Response) => {
  try {
    const budget = db
      .prepare(
        `SELECT b.*, e.name AS entity_name
       FROM budgets b
       LEFT JOIN entities e ON e.id = b.entity_id
       WHERE b.id = ? AND b.deleted_at IS NULL`
      )
      .get(String(req.params.id));

    if (!budget) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }

    const lineItems = db
      .prepare(
        `SELECT bli.*, a.name AS account_name, a.code AS account_code,
              d.name AS department_name
       FROM budget_line_items bli
       LEFT JOIN accounts a ON a.id = bli.account_id
       LEFT JOIN departments d ON d.id = bli.department_id
       WHERE bli.budget_id = ?
       ORDER BY bli.month, a.code`
      )
      .all(String(req.params.id));

    res.json({ ...(budget as Record<string, unknown>), line_items: lineItems });
  } catch (err) {
    console.error('GET /budgets/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
});

// POST / — create budget
router.post(
  '/',
  requireEntityWriteAccess('budgets', { entityIdSource: 'body' }),
  (req: Request, res: Response) => {
    try {
      const parsed = CreateBudgetSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
        return;
      }

      const { name, description, fiscal_year, base_currency, entity_id, status } = parsed.data;
      const id = uuidv4();

      db.prepare(
        `INSERT INTO budgets (id, name, description, fiscal_year, base_currency, entity_id, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      ).run(
        id,
        name,
        description ?? null,
        fiscal_year,
        base_currency,
        entity_id ?? null,
        status ?? 'Draft',
        req.user!.id
      );

      audit('CREATE', 'budget', id, req.user!.id, { name, fiscal_year });

      const budget = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id);
      res.status(201).json(budget);
    } catch (err) {
      console.error('POST /budgets error:', err);
      res.status(500).json({ error: 'Failed to create budget' });
    }
  }
);

// PUT /:id — update budget
router.put('/:id', requireEntityWriteAccess('budgets'), (req: Request, res: Response) => {
  try {
    const parsed = UpdateBudgetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const existing = db
      .prepare('SELECT id, status FROM budgets WHERE id = ? AND deleted_at IS NULL')
      .get(String(req.params.id)) as { id: string; status: string } | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }

    if (existing.status === 'Locked') {
      res.status(400).json({ error: 'Cannot edit a locked budget' });
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
    values.push(String(req.params.id));

    db.prepare(`UPDATE budgets SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    audit('UPDATE', 'budget', String(req.params.id), req.user!.id, parsed.data);

    const budget = db.prepare('SELECT * FROM budgets WHERE id = ?').get(String(req.params.id));
    res.json(budget);
  } catch (err) {
    console.error('PUT /budgets/:id error:', err);
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

// DELETE /:id — soft delete
router.delete('/:id', requireEntityWriteAccess('budgets'), (req: Request, res: Response) => {
  try {
    const existing = db
      .prepare('SELECT id FROM budgets WHERE id = ? AND deleted_at IS NULL')
      .get(String(req.params.id));

    if (!existing) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }

    db.prepare(
      "UPDATE budgets SET status = 'Cancelled', deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
    ).run(String(req.params.id));

    audit('DELETE', 'budget', String(req.params.id), req.user!.id);
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /budgets/:id error:', err);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

// POST /:id/submit — set status to InReview
router.post('/:id/submit', requireEntityWriteAccess('budgets'), (req: Request, res: Response) => {
  try {
    const existing = db
      .prepare('SELECT id, status FROM budgets WHERE id = ? AND deleted_at IS NULL')
      .get(String(req.params.id)) as { id: string; status: string } | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }

    if (existing.status !== 'Draft' && existing.status !== 'Rejected') {
      res.status(400).json({ error: `Cannot submit a budget with status '${existing.status}'` });
      return;
    }

    db.prepare(
      "UPDATE budgets SET status = 'InReview', updated_at = datetime('now') WHERE id = ?"
    ).run(String(req.params.id));

    audit('SUBMIT', 'budget', String(req.params.id), req.user!.id, {
      from: existing.status,
      to: 'InReview',
    });

    const budget = db.prepare('SELECT * FROM budgets WHERE id = ?').get(String(req.params.id));
    res.json(budget);
  } catch (err) {
    console.error('POST /budgets/:id/submit error:', err);
    res.status(500).json({ error: 'Failed to submit budget' });
  }
});

// POST /:id/approve — set status to Approved
router.post('/:id/approve', requireEntityWriteAccess('budgets'), (req: Request, res: Response) => {
  try {
    const existing = db
      .prepare('SELECT id, status FROM budgets WHERE id = ? AND deleted_at IS NULL')
      .get(String(req.params.id)) as { id: string; status: string } | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }

    if (existing.status !== 'InReview') {
      res.status(400).json({ error: 'Only budgets in review can be approved' });
      return;
    }

    db.prepare(
      "UPDATE budgets SET status = 'Approved', approved_by = ?, approved_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
    ).run(req.user!.id, String(req.params.id));

    audit('APPROVE', 'budget', String(req.params.id), req.user!.id, {
      from: existing.status,
      to: 'Approved',
    });

    const budget = db.prepare('SELECT * FROM budgets WHERE id = ?').get(String(req.params.id));
    res.json(budget);
  } catch (err) {
    console.error('POST /budgets/:id/approve error:', err);
    res.status(500).json({ error: 'Failed to approve budget' });
  }
});

// POST /:id/reject — set status to Rejected
router.post('/:id/reject', requireEntityWriteAccess('budgets'), (req: Request, res: Response) => {
  try {
    const parsed = WorkflowSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const existing = db
      .prepare('SELECT id, status FROM budgets WHERE id = ? AND deleted_at IS NULL')
      .get(String(req.params.id)) as { id: string; status: string } | undefined;

    if (!existing) {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }

    if (existing.status !== 'InReview') {
      res.status(400).json({ error: 'Only budgets in review can be rejected' });
      return;
    }

    db.prepare(
      "UPDATE budgets SET status = 'Rejected', rejection_reason = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(parsed.data.comment ?? null, String(req.params.id));

    audit('REJECT', 'budget', String(req.params.id), req.user!.id, {
      from: existing.status,
      to: 'Rejected',
      reason: parsed.data.comment,
    });

    const budget = db.prepare('SELECT * FROM budgets WHERE id = ?').get(String(req.params.id));
    res.json(budget);
  } catch (err) {
    console.error('POST /budgets/:id/reject error:', err);
    res.status(500).json({ error: 'Failed to reject budget' });
  }
});

// GET /:id/items — list line items for budget
router.get(
  '/:id/items',
  requireParentEntityAccess('budgets', 'budget_id'),
  (req: Request, res: Response) => {
    try {
      const budget = db
        .prepare('SELECT id FROM budgets WHERE id = ? AND deleted_at IS NULL')
        .get(String(req.params.id));

      if (!budget) {
        res.status(404).json({ error: 'Budget not found' });
        return;
      }

      const items = db
        .prepare(
          `SELECT bli.*, a.name AS account_name, a.code AS account_code,
              d.name AS department_name
       FROM budget_line_items bli
       LEFT JOIN accounts a ON a.id = bli.account_id
       LEFT JOIN departments d ON d.id = bli.department_id
       WHERE bli.budget_id = ?
       ORDER BY bli.month, a.code`
        )
        .all(String(req.params.id));

      res.json(items);
    } catch (err) {
      console.error('GET /budgets/:id/items error:', err);
      res.status(500).json({ error: 'Failed to fetch line items' });
    }
  }
);

// POST /:id/items — create line item
router.post(
  '/:id/items',
  requireParentEntityAccess('budgets', 'budget_id'),
  (req: Request, res: Response) => {
    try {
      const parsed = CreateLineItemSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
        return;
      }

      const budget = db
        .prepare('SELECT id, status FROM budgets WHERE id = ? AND deleted_at IS NULL')
        .get(String(req.params.id)) as { id: string; status: string } | undefined;

      if (!budget) {
        res.status(404).json({ error: 'Budget not found' });
        return;
      }

      if (budget.status === 'Locked') {
        res.status(400).json({ error: 'Cannot add items to a locked budget' });
        return;
      }

      const { account_id, month, amount, department_id, notes } = parsed.data;
      const id = uuidv4();

      db.prepare(
        `INSERT INTO budget_line_items (id, budget_id, account_id, month, amount, department_id, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      ).run(
        id,
        String(req.params.id),
        account_id,
        month,
        amount,
        department_id ?? null,
        notes ?? null
      );

      audit('CREATE', 'budget_line_item', id, req.user!.id, {
        budget_id: String(req.params.id),
        account_id,
        month,
        amount,
      });

      const item = db.prepare('SELECT * FROM budget_line_items WHERE id = ?').get(id);
      res.status(201).json(item);
    } catch (err) {
      console.error('POST /budgets/:id/items error:', err);
      res.status(500).json({ error: 'Failed to create line item' });
    }
  }
);

// PUT /items/:itemId — update line item
router.put(
  '/items/:itemId',
  requireParentEntityAccess('budgets', 'budget_id'),
  (req: Request, res: Response) => {
    try {
      const parsed = UpdateLineItemSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
        return;
      }

      const existing = db
        .prepare(
          `SELECT bli.id, bli.budget_id, b.status
       FROM budget_line_items bli
       JOIN budgets b ON b.id = bli.budget_id
       WHERE bli.id = ? AND b.deleted_at IS NULL`
        )
        .get(String(req.params.itemId)) as
        | { id: string; budget_id: string; status: string }
        | undefined;

      if (!existing) {
        res.status(404).json({ error: 'Line item not found' });
        return;
      }

      if (existing.status === 'Locked') {
        res.status(400).json({ error: 'Cannot edit items in a locked budget' });
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
      values.push(String(req.params.itemId));

      db.prepare(`UPDATE budget_line_items SET ${fields.join(', ')} WHERE id = ?`).run(...values);

      audit('UPDATE', 'budget_line_item', String(req.params.itemId), req.user!.id, parsed.data);

      const item = db
        .prepare('SELECT * FROM budget_line_items WHERE id = ?')
        .get(String(req.params.itemId));
      res.json(item);
    } catch (err) {
      console.error('PUT /budgets/items/:itemId error:', err);
      res.status(500).json({ error: 'Failed to update line item' });
    }
  }
);

// DELETE /items/:itemId — delete line item
router.delete(
  '/items/:itemId',
  requireParentEntityAccess('budgets', 'budget_id'),
  (req: Request, res: Response) => {
    try {
      const existing = db
        .prepare(
          `SELECT bli.id, bli.budget_id, b.status
       FROM budget_line_items bli
       JOIN budgets b ON b.id = bli.budget_id
       WHERE bli.id = ? AND b.deleted_at IS NULL`
        )
        .get(String(req.params.itemId)) as
        | { id: string; budget_id: string; status: string }
        | undefined;

      if (!existing) {
        res.status(404).json({ error: 'Line item not found' });
        return;
      }

      if (existing.status === 'Locked') {
        res.status(400).json({ error: 'Cannot delete items from a locked budget' });
        return;
      }

      db.prepare('DELETE FROM budget_line_items WHERE id = ?').run(String(req.params.itemId));

      audit('DELETE', 'budget_line_item', String(req.params.itemId), req.user!.id);

      res.status(204).send();
    } catch (err) {
      console.error('DELETE /budgets/items/:itemId error:', err);
      res.status(500).json({ error: 'Failed to delete line item' });
    }
  }
);

export default router;
