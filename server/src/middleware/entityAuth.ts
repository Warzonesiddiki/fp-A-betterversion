import type { Request, Response, NextFunction } from 'express';
import { db } from '../db/connection.js';
import type { SqliteDdl } from '../db/schema.js';

/**
 * Entity role hierarchy (least to most privileged):
 *   viewer < analyst < manager < admin
 *
 * Global Admin role (from JWT) bypasses all entity checks.
 */

type EntityRole = 'viewer' | 'analyst' | 'manager' | 'admin';

// Exported (W0.2c-hardening) for read-only reuse by route-level scope
// assertions in scenarios.ts. Additive only: the middleware factories below
// keep their exact prior behaviour.
export const WRITE_ROLES: EntityRole[] = ['analyst', 'manager', 'admin'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true if the global role is Admin (bypasses entity checks). */
function isGlobalAdmin(req: Request): boolean {
  return req.user?.role === 'Admin';
}

/**
 * Looks up the user's entity role from the user_entity_access table.
 * Falls back to the user's global role if no explicit entity access row exists.
 */
export function getEntityRole(userId: string, entityId: string): EntityRole | null {
  const row = db
    .prepare('SELECT role FROM user_entity_access WHERE user_id = ? AND entity_id = ?')
    .get(userId, entityId) as { role: string } | undefined;

  if (row) {
    return row.role as EntityRole;
  }

  // Fallback: if the user's global entity_id matches, use their global role
  const user = db.prepare('SELECT entity_id, role FROM users WHERE id = ?').get(userId) as
    | { entity_id: string | null; role: string }
    | undefined;

  if (user && user.entity_id === entityId) {
    // Map global roles to entity roles
    const globalToEntity: Record<string, EntityRole> = {
      Admin: 'admin',
      Manager: 'manager',
      Analyst: 'analyst',
      'Dept Head': 'analyst',
      Viewer: 'viewer',
    };
    return globalToEntity[user.role] ?? 'viewer';
  }

  return null;
}

/**
 * Returns an array of entity IDs the user has access to.
 * Admin users get access to all entities.
 */
export function getAccessibleEntityIds(userId: string, globalRole: string): string[] {
  if (globalRole === 'Admin') {
    const rows = db.prepare('SELECT id FROM entities').all() as { id: string }[];
    return rows.map((r) => r.id);
  }

  // Entities from user_entity_access table
  const accessRows = db
    .prepare('SELECT entity_id FROM user_entity_access WHERE user_id = ?')
    .all(userId) as { entity_id: string }[];

  const entityIds = new Set(accessRows.map((r) => r.entity_id));

  // Also include the user's own entity_id
  const user = db.prepare('SELECT entity_id FROM users WHERE id = ?').get(userId) as
    | { entity_id: string | null }
    | undefined;

  if (user?.entity_id) {
    entityIds.add(user.entity_id);
  }

  return Array.from(entityIds);
}

// ---------------------------------------------------------------------------
// Middleware Factories
// ---------------------------------------------------------------------------

/**
 * Middleware that checks the user has at least read access to the entity
 * associated with the resource being accessed.
 *
 * Works in two modes:
 * 1. **Route param mode** (`:id`): Looks up entity_id from the resource table.
 * 2. **Body mode** (POST /): Takes entity_id from req.body.
 *
 * @param resourceTable - The DB table to look up entity_id (e.g., 'budgets')
 * @param options.entityIdSource - 'params' (default) or 'body'
 */
export function requireEntityAccess(
  resourceTable: string,
  options: { entityIdSource?: 'params' | 'body' } = {}
) {
  const { entityIdSource = 'params' } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Global Admin bypasses entity checks
    if (isGlobalAdmin(req)) {
      next();
      return;
    }

    let entityId: string | null = null;

    if (entityIdSource === 'body') {
      entityId = req.body?.entity_id ?? null;
      if (!entityId) {
        // No entity_id in body — allow through (entity is optional for some resources)
        next();
        return;
      }
    } else {
      // Look up entity_id from the resource
      const resource = db
        .prepare(`SELECT entity_id FROM ${resourceTable} WHERE id = ?`)
        .get(req.params.id) as { entity_id: string | null } | undefined;

      if (!resource) {
        // Resource not found — let the route handler deal with 404
        next();
        return;
      }

      entityId = resource.entity_id;
    }

    // If the resource has no entity_id, allow access (entity-scoping is optional)
    if (!entityId) {
      next();
      return;
    }

    // Check if user has access to this entity
    const entityRole = getEntityRole(req.user.id, entityId);
    if (!entityRole) {
      // W0.2c-hardening (lane S9): `code` added additively so machine
      // consumers receive the stable registry id (errorCodes.ts FP-0201,
      // cross-entity scope denial). Legacy fields retained verbatim.
      res.status(403).json({
        error: 'Access denied',
        message: 'You do not have access to this entity',
        code: 'FP-0201',
      });
      return;
    }

    // Attach entity role to request for downstream use
    (req as unknown as Record<string, unknown>).entityRole = entityRole;
    next();
  };
}

/**
 * Middleware that checks the user has write access (analyst, manager, or admin)
 * to the entity associated with the resource being accessed.
 *
 * @param resourceTable - The DB table to look up entity_id
 * @param options.entityIdSource - 'params' (default) or 'body'
 */
export function requireEntityWriteAccess(
  resourceTable: string,
  options: { entityIdSource?: 'params' | 'body' } = {}
) {
  const { entityIdSource = 'params' } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Global Admin bypasses entity checks
    if (isGlobalAdmin(req)) {
      next();
      return;
    }

    let entityId: string | null = null;

    if (entityIdSource === 'body') {
      entityId = req.body?.entity_id ?? null;
      if (!entityId) {
        // No entity_id in body — allow through (entity is optional)
        next();
        return;
      }
    } else {
      // Look up entity_id from the resource
      const resource = db
        .prepare(`SELECT entity_id FROM ${resourceTable} WHERE id = ?`)
        .get(req.params.id) as { entity_id: string | null } | undefined;

      if (!resource) {
        next();
        return;
      }

      entityId = resource.entity_id;
    }

    if (!entityId) {
      next();
      return;
    }

    const entityRole = getEntityRole(req.user.id, entityId);
    if (!entityRole) {
      // W0.2c-hardening (lane S9): additive `code` — see requireEntityAccess.
      res.status(403).json({
        error: 'Access denied',
        message: 'You do not have access to this entity',
        code: 'FP-0201',
      });
      return;
    }

    if (!WRITE_ROLES.includes(entityRole)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        message: 'Write access requires analyst role or higher for this entity',
        required: WRITE_ROLES,
        current: entityRole,
      });
      return;
    }

    (req as unknown as Record<string, unknown>).entityRole = entityRole;
    next();
  };
}

/**
 * Middleware that filters list endpoints to only return resources
 * from entities the user has access to.
 *
 * Adds a `entityFilter` property to the request with accessible entity IDs.
 */
export function filterByEntityAccess(_req: Request, _res: Response, next: NextFunction): void {
  const req = _req;
  if (!req.user) {
    next();
    return;
  }

  if (isGlobalAdmin(req)) {
    (req as unknown as Record<string, unknown>).entityFilter = null; // null = no filter
    next();
    return;
  }

  const entityIds = getAccessibleEntityIds(req.user.id, req.user.role);
  (req as unknown as Record<string, unknown>).entityFilter = entityIds;
  next();
}

/**
 * Middleware for line-item routes that checks entity access through
 * the parent resource (budget, forecast, scenario).
 *
 * @param parentTable - Parent resource table (e.g., 'budgets')
 * @param parentForeignKey - FK column on the line item table (e.g., 'budget_id')
 */
export function requireParentEntityAccess(parentTable: string, parentForeignKey: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (isGlobalAdmin(req)) {
      next();
      return;
    }

    // For line item routes, the parent ID is either in req.params.id or
    // looked up from the line item itself
    let parentId = req.params.id;

    // For PUT/DELETE on /items/:itemId, look up the parent from the line item
    if (req.params.itemId && !parentId) {
      const lineItem = db
        .prepare(
          `SELECT ${parentForeignKey} FROM ${parentTable === 'budgets' ? 'budget_line_items' : parentTable === 'forecasts' ? 'forecast_line_items' : 'scenario_line_items'} WHERE id = ?`
        )
        .get(req.params.itemId) as Record<string, string> | undefined;

      if (lineItem) {
        parentId = lineItem[parentForeignKey];
      }
    }

    if (!parentId) {
      next();
      return;
    }

    const parent = db.prepare(`SELECT entity_id FROM ${parentTable} WHERE id = ?`).get(parentId) as
      | { entity_id: string | null }
      | undefined;

    if (!parent || !parent.entity_id) {
      next();
      return;
    }

    const entityRole = getEntityRole(req.user.id, parent.entity_id);
    if (!entityRole) {
      // W0.2c-hardening (lane S9): additive `code` — see requireEntityAccess.
      res.status(403).json({
        error: 'Access denied',
        message: 'You do not have access to this entity',
        code: 'FP-0201',
      });
      return;
    }

    // For write operations (POST, PUT, DELETE), require write access
    const method = req.method.toUpperCase();
    if (['POST', 'PUT', 'DELETE'].includes(method) && !WRITE_ROLES.includes(entityRole)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        message: 'Write access requires analyst role or higher for this entity',
        required: WRITE_ROLES,
        current: entityRole,
      });
      return;
    }

    (req as unknown as Record<string, unknown>).entityRole = entityRole;
    next();
  };
}

// ---------------------------------------------------------------------------
// Migration Helper
// ---------------------------------------------------------------------------

/** Creates the user_entity_access table if it doesn't exist. */
export function ensureEntityAccessTable(db: SqliteDdl): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_entity_access (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'analyst', 'manager', 'admin')),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, entity_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_user_entity_access_user
      ON user_entity_access(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_entity_access_entity
      ON user_entity_access(entity_id);
  `);

  // Seed existing user-entity relationships from users.entity_id
  db.exec(`
    INSERT OR IGNORE INTO user_entity_access (id, user_id, entity_id, role)
    SELECT
      hex(randomblob(16)) AS id,
      u.id AS user_id,
      u.entity_id AS entity_id,
      CASE u.role
        WHEN 'Admin' THEN 'admin'
        WHEN 'Manager' THEN 'manager'
        WHEN 'Analyst' THEN 'analyst'
        WHEN 'Dept Head' THEN 'analyst'
        ELSE 'viewer'
      END AS role
    FROM users u
    WHERE u.entity_id IS NOT NULL;
  `);
}
