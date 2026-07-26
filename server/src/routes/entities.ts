import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/connection.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { filterByEntityAccess, requireEntityAccess } from '../middleware/entityAuth.js';

const router = Router();
router.use(authMiddleware);

// --- Zod schemas ---

const CreateEntitySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  code: z.string().min(1, 'Code is required').max(50),
  type: z.enum(['company', 'division', 'subsidiary', 'branch']).optional(),
  base_currency: z.string().length(3).optional(),
  fiscal_year_start: z.number().int().min(1).max(12).optional(),
  parent_id: z.string().uuid().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});

const UpdateEntitySchema = CreateEntitySchema.partial();

const CreateDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  code: z.string().min(1, 'Code is required').max(50),
  entity_id: z.string().uuid('entity_id is required'),
  parent_id: z.string().uuid().optional(),
  manager_id: z.string().uuid().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
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

// --- Entity Routes ---

// GET / — list entities
router.get('/', filterByEntityAccess, (req: Request, res: Response) => {
  try {
    // Entity-level access filter
    const entityFilter = (req as unknown as Record<string, unknown>).entityFilter as
      | string[]
      | null;
    let query = `SELECT e.*, pe.name AS parent_name
       FROM entities e
       LEFT JOIN entities pe ON pe.id = e.parent_id`;
    const params: unknown[] = [];

    if (entityFilter !== null && entityFilter.length > 0) {
      query += ` WHERE e.id IN (${entityFilter.map(() => '?').join(', ')})`;
      params.push(...entityFilter);
    } else if (entityFilter !== null && entityFilter.length === 0) {
      res.json([]);
      return;
    }

    query += ' ORDER BY e.name';

    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('GET /entities error:', err);
    res.status(500).json({ error: 'Failed to fetch entities' });
  }
});

// GET /:id — get entity
router.get('/:id', requireEntityAccess('entities'), (req: Request, res: Response) => {
  try {
    const entity = db
      .prepare(
        `SELECT e.*, pe.name AS parent_name
       FROM entities e
       LEFT JOIN entities pe ON pe.id = e.parent_id
       WHERE e.id = ?`
      )
      .get(String(req.params.id));

    if (!entity) {
      res.status(404).json({ error: 'Entity not found' });
      return;
    }

    res.json(entity);
  } catch (err) {
    console.error('GET /entities/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch entity' });
  }
});

// POST / — create entity (Admin only)
router.post('/', requireRole('Admin'), (req: Request, res: Response) => {
  try {
    const parsed = CreateEntitySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const {
      name,
      code,
      type,
      base_currency,
      fiscal_year_start,
      parent_id,
      description,
      is_active,
    } = parsed.data;

    // Check unique code
    const duplicate = db.prepare('SELECT id FROM entities WHERE code = ?').get(code);

    if (duplicate) {
      res.status(400).json({ error: 'Entity code already exists' });
      return;
    }

    const id = uuidv4();

    db.prepare(
      `INSERT INTO entities (id, name, code, type, base_currency, fiscal_year_start, parent_id, description, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(
      id,
      name,
      code,
      type ?? 'company',
      base_currency ?? 'USD',
      fiscal_year_start ?? 1,
      parent_id ?? null,
      description ?? null,
      (is_active ?? true) ? 1 : 0
    );

    audit('CREATE', 'entity', id, req.user!.id, { name, code, type });

    const entity = db.prepare('SELECT * FROM entities WHERE id = ?').get(id);
    res.status(201).json(entity);
  } catch (err) {
    console.error('POST /entities error:', err);
    res.status(500).json({ error: 'Failed to create entity' });
  }
});

// PUT /:id — update entity (Admin only)
router.put('/:id', requireRole('Admin'), (req: Request, res: Response) => {
  try {
    const parsed = UpdateEntitySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const existing = db.prepare('SELECT id FROM entities WHERE id = ?').get(String(req.params.id));

    if (!existing) {
      res.status(404).json({ error: 'Entity not found' });
      return;
    }

    // Check unique code if code is being changed
    if (parsed.data.code) {
      const duplicate = db
        .prepare('SELECT id FROM entities WHERE code = ? AND id != ?')
        .get(parsed.data.code, String(req.params.id));

      if (duplicate) {
        res.status(400).json({ error: 'Entity code already exists' });
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
    values.push(String(req.params.id));

    db.prepare(`UPDATE entities SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    audit('UPDATE', 'entity', String(req.params.id), req.user!.id, parsed.data);

    const entity = db.prepare('SELECT * FROM entities WHERE id = ?').get(String(req.params.id));
    res.json(entity);
  } catch (err) {
    console.error('PUT /entities/:id error:', err);
    res.status(500).json({ error: 'Failed to update entity' });
  }
});

// --- Department Routes ---

// GET /departments — list departments
router.get('/departments/list', (req: Request, res: Response) => {
  try {
    const { entity_id } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (entity_id && typeof entity_id === 'string') {
      conditions.push('d.entity_id = ?');
      params.push(entity_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = db
      .prepare(
        `SELECT d.*, e.name AS entity_name, pd.name AS parent_name,
              u.email AS manager_email
       FROM departments d
       LEFT JOIN entities e ON e.id = d.entity_id
       LEFT JOIN departments pd ON pd.id = d.parent_id
       LEFT JOIN users u ON u.id = d.manager_id
       ${whereClause}
       ORDER BY d.name`
      )
      .all(...params);

    res.json(rows);
  } catch (err) {
    console.error('GET /departments error:', err);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// POST /departments — create department (Admin only)
router.post('/departments', requireRole('Admin'), (req: Request, res: Response) => {
  try {
    const parsed = CreateDepartmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const { name, code, entity_id, parent_id, manager_id, description, is_active } = parsed.data;
    const id = uuidv4();

    db.prepare(
      `INSERT INTO departments (id, name, code, entity_id, parent_id, manager_id, description, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).run(
      id,
      name,
      code,
      entity_id,
      parent_id ?? null,
      manager_id ?? null,
      description ?? null,
      (is_active ?? true) ? 1 : 0
    );

    audit('CREATE', 'department', id, req.user!.id, { name, code, entity_id });

    const department = db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
    res.status(201).json(department);
  } catch (err) {
    console.error('POST /departments error:', err);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// --- User Routes ---

// GET /users — list users (Admin only)
router.get('/users/list', requireRole('Admin'), (req: Request, res: Response) => {
  try {
    const { role, entity_id, limit = '50', offset = '0' } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (role && typeof role === 'string') {
      conditions.push('u.role = ?');
      params.push(role);
    }
    if (entity_id && typeof entity_id === 'string') {
      conditions.push('u.entity_id = ?');
      params.push(entity_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db
      .prepare(`SELECT COUNT(*) AS count FROM users u ${whereClause}`)
      .get(...params) as { count: number } | undefined;

    params.push(Number(limit), Number(offset));

    const rows = db
      .prepare(
        `SELECT u.id, u.email, u.name, u.role, u.entity_id, u.department_id,
              u.is_active, u.created_at, u.last_login,
              e.name AS entity_name, d.name AS department_name
       FROM users u
       LEFT JOIN entities e ON e.id = u.entity_id
       LEFT JOIN departments d ON d.id = u.department_id
       ${whereClause}
       ORDER BY u.name
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
    console.error('GET /users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /users/:id — get user
router.get('/users/:id', (req: Request, res: Response) => {
  try {
    // Users can view their own profile; Admins can view any
    if (req.user!.id !== String(req.params.id) && req.user!.role !== 'Admin') {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const user = db
      .prepare(
        `SELECT u.id, u.email, u.name, u.role, u.entity_id, u.department_id,
              u.is_active, u.created_at, u.last_login,
              e.name AS entity_name, d.name AS department_name
       FROM users u
       LEFT JOIN entities e ON e.id = u.entity_id
       LEFT JOIN departments d ON d.id = u.department_id
       WHERE u.id = ?`
      )
      .get(String(req.params.id));

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (err) {
    console.error('GET /users/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
