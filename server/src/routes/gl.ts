import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/connection.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  requireEntityAccess,
  requireEntityWriteAccess,
  filterByEntityAccess,
} from '../middleware/entityAuth.js';

const router = Router();
router.use(authMiddleware);

// --- Zod schemas ---

const CreateGLEntrySchema = z.object({
  account_id: z.string().uuid('account_id is required'),
  entity_id: z.string().uuid('entity_id is required'),
  post_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  amount: z.number(),
  debit: z.number().min(0),
  credit: z.number().min(0),
  description: z.string().optional(),
  reference: z.string().optional(),
  department_id: z.string().uuid().optional(),
}).refine((data) => data.debit > 0 || data.credit > 0, {
  message: 'Either debit or credit must be greater than 0',
});

const BulkGLEntrySchema = z.object({
  entries: z.array(CreateGLEntrySchema).min(1, 'At least one entry is required'),
});

const CreateAccountSchema = z.object({
  code: z.string().min(1, 'Account code is required').max(50),
  name: z.string().min(1, 'Account name is required').max(255),
  type: z.enum(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']),
  parent_id: z.string().uuid().optional(),
  entity_id: z.string().uuid().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});

const UpdateAccountSchema = CreateAccountSchema.partial();

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

// --- GL Entry Routes ---

// GET /entries — list GL entries with filters
router.get('/entries', filterByEntityAccess, (req: Request, res: Response) => {
  try {
    const { account_id, entity_id, date_from, date_to, limit = '50', offset = '0' } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];

    // Entity-level access filter
    const entityFilter = (req as unknown as Record<string, unknown>).entityFilter as string[] | null;
    if (entityFilter !== null && entityFilter.length > 0) {
      conditions.push(`ge.entity_id IN (${entityFilter.map(() => '?').join(', ')})`);
      params.push(...entityFilter);
    } else if (entityFilter !== null && entityFilter.length === 0) {
      res.json({ data: [], total: 0, limit: Number(limit), offset: Number(offset) });
      return;
    }

    if (account_id && typeof account_id === 'string') {
      conditions.push('ge.account_id = ?');
      params.push(account_id);
    }
    if (entity_id && typeof entity_id === 'string') {
      conditions.push('ge.entity_id = ?');
      params.push(entity_id);
    }
    if (date_from && typeof date_from === 'string') {
      conditions.push('ge.post_date >= ?');
      params.push(date_from);
    }
    if (date_to && typeof date_to === 'string') {
      conditions.push('ge.post_date <= ?');
      params.push(date_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db.prepare(
      `SELECT COUNT(*) AS count FROM gl_entries ge ${whereClause}`
    ).get(...params) as { count: number } | undefined;

    params.push(Number(limit), Number(offset));

    const rows = db.prepare(
      `SELECT ge.*, a.name AS account_name, a.code AS account_code,
              e.name AS entity_name, d.name AS department_name
       FROM gl_entries ge
       LEFT JOIN accounts a ON a.id = ge.account_id
       LEFT JOIN entities e ON e.id = ge.entity_id
       LEFT JOIN departments d ON d.id = ge.department_id
       ${whereClause}
       ORDER BY ge.post_date DESC, ge.created_at DESC
       LIMIT ? OFFSET ?`
    ).all(...params);

    res.json({
      data: rows,
      total: countRow?.count ?? 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (err) {
    console.error('GET /gl/entries error:', err);
    res.status(500).json({ error: 'Failed to fetch GL entries' });
  }
});

// POST /entries — create GL entry
router.post('/entries', requireEntityWriteAccess('gl_entries', { entityIdSource: 'body' }), (req: Request, res: Response) => {
  try {
    const parsed = CreateGLEntrySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const { account_id, entity_id, post_date, amount, debit, credit, description, reference, department_id } = parsed.data;
    const id = uuidv4();

    db.prepare(
      `INSERT INTO gl_entries (id, account_id, entity_id, post_date, amount, debit, credit, description, reference, department_id, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).run(id, account_id, entity_id, post_date, amount, debit, credit, description ?? null, reference ?? null, department_id ?? null, req.user!.id);

    audit('CREATE', 'gl_entry', id, req.user!.id, { account_id, entity_id, post_date, amount, debit, credit });

    const entry = db.prepare('SELECT * FROM gl_entries WHERE id = ?').get(id);
    res.status(201).json(entry);
  } catch (err) {
    console.error('POST /gl/entries error:', err);
    res.status(500).json({ error: 'Failed to create GL entry' });
  }
});

// POST /entries/bulk — bulk insert GL entries
router.post('/entries/bulk', requireEntityWriteAccess('gl_entries', { entityIdSource: 'body' }), (req: Request, res: Response) => {
  try {
    const parsed = BulkGLEntrySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const insertStmt = db.prepare(
      `INSERT INTO gl_entries (id, account_id, entity_id, post_date, amount, debit, credit, description, reference, department_id, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    );

    const ids: string[] = [];
    const insertMany = db.transaction((entries: z.infer<typeof BulkGLEntrySchema>['entries']) => {
      for (const entry of entries) {
        const id = uuidv4();
        ids.push(id);
        insertStmt.run(
          id, entry.account_id, entry.entity_id, entry.post_date,
          entry.amount, entry.debit, entry.credit,
          entry.description ?? null, entry.reference ?? null,
          entry.department_id ?? null, req.user!.id
        );
      }
    });

    insertMany(parsed.data.entries);

    audit('BULK_CREATE', 'gl_entry', ids.join(','), req.user!.id, { count: ids.length });

    res.status(201).json({ message: `Created ${ids.length} entries`, ids });
  } catch (err) {
    console.error('POST /gl/entries/bulk error:', err);
    res.status(500).json({ error: 'Failed to bulk create GL entries' });
  }
});

// DELETE /entries/:id — delete GL entry
router.delete('/entries/:id', requireEntityWriteAccess('gl_entries'), (req: Request, res: Response) => {
  try {
    const existing = db.prepare(
      'SELECT id FROM gl_entries WHERE id = ?'
    ).get(req.params.id);

    if (!existing) {
      res.status(404).json({ error: 'GL entry not found' });
      return;
    }

    db.prepare('DELETE FROM gl_entries WHERE id = ?').run(req.params.id);

    audit('DELETE', 'gl_entry', req.params.id, req.user!.id);

    res.status(204).send();
  } catch (err) {
    console.error('DELETE /gl/entries/:id error:', err);
    res.status(500).json({ error: 'Failed to delete GL entry' });
  }
});

// --- Chart of Accounts Routes ---

// GET /accounts — list chart of accounts, optional entity_id filter, hierarchical
router.get('/accounts', (req: Request, res: Response) => {
  try {
    const { entity_id } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (entity_id && typeof entity_id === 'string') {
      conditions.push('a.entity_id = ?');
      params.push(entity_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = db.prepare(
      `SELECT a.*, pa.code AS parent_code, pa.name AS parent_name
       FROM accounts a
       LEFT JOIN accounts pa ON pa.id = a.parent_id
       ${whereClause}
       ORDER BY a.code`
    ).all(...params) as (Record<string, unknown> & { children: Record<string, unknown>[] })[];

    // Build hierarchical tree
    const accountMap = new Map<string, typeof rows[0]>();
    const roots: typeof rows = [];

    for (const row of rows) {
      const acct = { ...row, children: [] as Record<string, unknown>[] };
      accountMap.set(acct.id as string, acct);
    }

    for (const acct of accountMap.values()) {
      const parentId = acct.parent_id as string | null;
      if (parentId && accountMap.has(parentId)) {
        accountMap.get(parentId)!.children.push(acct);
      } else {
        roots.push(acct);
      }
    }

    res.json(roots);
  } catch (err) {
    console.error('GET /gl/accounts error:', err);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// POST /accounts — create account
router.post('/accounts', (req: Request, res: Response) => {
  try {
    const parsed = CreateAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const { code, name, type, parent_id, entity_id, description, is_active } = parsed.data;

    // Check unique code
    const duplicate = db.prepare(
      'SELECT id FROM accounts WHERE code = ?'
    ).get(code);

    if (duplicate) {
      res.status(400).json({ error: 'Account code already exists' });
      return;
    }

    const id = uuidv4();

    db.prepare(
      `INSERT INTO accounts (id, code, name, type, parent_id, entity_id, description, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(id, code, name, type, parent_id ?? null, entity_id ?? null, description ?? null, is_active ?? true ? 1 : 0);

    audit('CREATE', 'account', id, req.user!.id, { code, name, type });

    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
    res.status(201).json(account);
  } catch (err) {
    console.error('POST /gl/accounts error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// PUT /accounts/:id — update account
router.put('/accounts/:id', (req: Request, res: Response) => {
  try {
    const parsed = UpdateAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const existing = db.prepare(
      'SELECT id FROM accounts WHERE id = ?'
    ).get(req.params.id);

    if (!existing) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    // Check unique code if code is being changed
    if (parsed.data.code) {
      const duplicate = db.prepare(
        'SELECT id FROM accounts WHERE code = ? AND id != ?'
      ).get(parsed.data.code, req.params.id);

      if (duplicate) {
        res.status(400).json({ error: 'Account code already exists' });
        return;
      }
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(key === 'is_active' ? (value ? 1 : 0) : value);
      }
    }

    if (fields.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    fields.push("updated_at = datetime('now')");
    values.push(req.params.id);

    db.prepare(
      `UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`
    ).run(...values);

    audit('UPDATE', 'account', req.params.id, req.user!.id, parsed.data);

    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
    res.json(account);
  } catch (err) {
    console.error('PUT /gl/accounts/:id error:', err);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// GET /trial-balance — compute trial balance
router.get('/trial-balance', filterByEntityAccess, (req: Request, res: Response) => {
  try {
    const { entity_id, date_from, date_to } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];

    // Entity-level access filter
    const entityFilter = (req as unknown as Record<string, unknown>).entityFilter as string[] | null;
    if (entityFilter !== null && entityFilter.length > 0) {
      conditions.push(`ge.entity_id IN (${entityFilter.map(() => '?').join(', ')})`);
      params.push(...entityFilter);
    } else if (entityFilter !== null && entityFilter.length === 0) {
      res.json({ accounts: [], totals: { debits: 0, credits: 0, balance: 0 } });
      return;
    }

    if (entity_id && typeof entity_id === 'string') {
      conditions.push('ge.entity_id = ?');
      params.push(entity_id);
    }
    if (date_from && typeof date_from === 'string') {
      conditions.push('ge.post_date >= ?');
      params.push(date_from);
    }
    if (date_to && typeof date_to === 'string') {
      conditions.push('ge.post_date <= ?');
      params.push(date_to);
    }

    const joinCondition = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    const rows = db.prepare(
      `SELECT
         a.id AS account_id,
         a.code AS account_code,
         a.name AS account_name,
         a.type AS account_type,
         COALESCE(SUM(ge.debit), 0) AS total_debit,
         COALESCE(SUM(ge.credit), 0) AS total_credit,
         COALESCE(SUM(ge.debit), 0) - COALESCE(SUM(ge.credit), 0) AS balance
       FROM accounts a
       LEFT JOIN gl_entries ge ON ge.account_id = a.id ${joinCondition}
       GROUP BY a.id, a.code, a.name, a.type
       ORDER BY a.code`
    ).all(...params) as Record<string, unknown>[];

    let totalDebit = 0;
    let totalCredit = 0;
    for (const row of rows) {
      totalDebit += Number(row.total_debit);
      totalCredit += Number(row.total_credit);
    }

    res.json({
      accounts: rows,
      totals: {
        debit: totalDebit,
        credit: totalCredit,
        difference: totalDebit - totalCredit,
        balanced: Math.abs(totalDebit - totalCredit) < 0.01,
      },
    });
  } catch (err) {
    console.error('GET /gl/trial-balance error:', err);
    res.status(500).json({ error: 'Failed to compute trial balance' });
  }
});

export default router;
