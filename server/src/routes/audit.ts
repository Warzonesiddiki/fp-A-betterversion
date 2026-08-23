import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { filterByEntityAccess } from '../middleware/entityAuth.js';
import { auditService } from '../services/AuditService.js';
import { db } from '../db/connection.js';
import { resolveTenantId } from '../db/tenancy.js';
import { AUDIT_HMAC_SECRET } from '../config/env.js';
import type { AuditCategory, AuditSeverity, AuditAction } from '../services/AuditService.js';

const router = Router();

// All audit routes require authentication
router.use(authMiddleware);

// Only Admin and Manager can access audit logs
router.use(requireRole('Admin', 'Manager'));

// Apply entity scoping to all audit routes
// Admin sees all entities; non-admin sees only their entity's audit data
router.use(filterByEntityAccess);

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const _querySchema = z.object({
  category: z
    .enum(['user_action', 'data_change', 'login_attempt', 'permission_change', 'system_event'])
    .optional(),
  action: z.string().optional(),
  severity: z.enum(['debug', 'info', 'warning', 'error', 'critical']).optional(),
  userId: z.string().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});
type QueryFilter = z.infer<typeof _querySchema>;

const _loginAttemptsSchema = z.object({
  email: z.string().optional(),
  ipAddress: z.string().optional(),
  success: z.coerce.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
});
type LoginAttemptsFilter = z.infer<typeof _loginAttemptsSchema>;

const _permissionChangesSchema = z.object({
  targetUserId: z.string().optional(),
  changedByUserId: z.string().optional(),
  changeType: z
    .enum([
      'role_change',
      'entity_access_granted',
      'entity_access_revoked',
      'entity_role_change',
      'account_activated',
      'account_deactivated',
    ])
    .optional(),
  entityId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
});
type PermissionChangesFilter = z.infer<typeof _permissionChangesSchema>;

const _dataChangesSchema = z.object({
  tableName: z.string().optional(),
  recordId: z.string().optional(),
  userId: z.string().optional(),
  changeType: z.enum(['insert', 'update', 'delete']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
});
type DataChangesFilter = z.infer<typeof _dataChangesSchema>;

const _exportSchema = z.object({
  format: z.enum(['csv', 'json']).default('csv'),
  category: z
    .enum(['user_action', 'data_change', 'login_attempt', 'permission_change', 'system_event'])
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  userId: z.string().optional(),
});
type ExportFilter = z.infer<typeof _exportSchema>;

// ---------------------------------------------------------------------------
// GET / — Query audit log entries
// ---------------------------------------------------------------------------

router.get('/', (req, res) => {
  try {
    const filter = req.query as QueryFilter;
    const result = auditService.query({
      tenantId: resolveTenantId(req.user),
      category: filter.category as AuditCategory | undefined,
      action: filter.action as AuditAction | undefined,
      severity: filter.severity as AuditSeverity | undefined,
      userId: filter.userId,
      resourceType: filter.resourceType,
      resourceId: filter.resourceId,
      startDate: filter.startDate,
      endDate: filter.endDate,
      search: filter.search,
      limit: filter.limit,
      offset: filter.offset,
    });

    res.json({
      entries: result.entries,
      total: result.total,
      limit: filter.limit ?? 50,
      offset: filter.offset ?? 0,
    });
  } catch (err) {
    console.error('[audit] Query error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /stats — Get audit statistics
// ---------------------------------------------------------------------------

router.get('/stats', (req, res) => {
  try {
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const stats = auditService.getStats(
      {
        startDate,
        endDate,
      },
      resolveTenantId(req.user)
    );
    res.json(stats);
  } catch (err) {
    console.error('[audit] Stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /login-attempts — Query login attempts
// ---------------------------------------------------------------------------

router.get('/login-attempts', (req, res) => {
  try {
    const filter = req.query as LoginAttemptsFilter;
    const entries = auditService.getLoginAttempts({
      email: filter.email,
      ipAddress: filter.ipAddress,
      success: filter.success,
      startDate: filter.startDate,
      endDate: filter.endDate,
      limit: filter.limit,
    });

    res.json({ entries, total: entries.length });
  } catch (err) {
    console.error('[audit] Login attempts query error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /permission-changes — Query permission changes
// ---------------------------------------------------------------------------

router.get('/permission-changes', (req, res) => {
  try {
    const filter = req.query as PermissionChangesFilter;
    const entries = auditService.getPermissionChanges({
      targetUserId: filter.targetUserId,
      changedByUserId: filter.changedByUserId,
      changeType: filter.changeType,
      entityId: filter.entityId,
      startDate: filter.startDate,
      endDate: filter.endDate,
      limit: filter.limit,
    });

    res.json({ entries, total: entries.length });
  } catch (err) {
    console.error('[audit] Permission changes query error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /data-changes — Query data changes
// ---------------------------------------------------------------------------

router.get('/data-changes', (req, res) => {
  try {
    const filter = req.query as DataChangesFilter;
    const entries = auditService.getDataChanges({
      tableName: filter.tableName,
      recordId: filter.recordId,
      userId: filter.userId,
      changeType: filter.changeType,
      startDate: filter.startDate,
      endDate: filter.endDate,
      limit: filter.limit,
    });

    res.json({ entries, total: entries.length });
  } catch (err) {
    console.error('[audit] Data changes query error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /resource/:type/:id — Get resource history
// ---------------------------------------------------------------------------

router.get('/resource/:type/:id', (req, res) => {
  try {
    const { type, id } = req.params;
    const entries = auditService.getResourceHistory(type, id, resolveTenantId(req.user));
    res.json({ entries, total: entries.length });
  } catch (err) {
    console.error('[audit] Resource history error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /user/:userId — Get user activity
// ---------------------------------------------------------------------------

router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt((req.query.limit as string) ?? '100', 10);
    const entries = auditService.getUserActivity(userId, limit, resolveTenantId(req.user));
    res.json({ entries, total: entries.length });
  } catch (err) {
    console.error('[audit] User activity error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /entry/:id — Get single entry by ID
// ---------------------------------------------------------------------------

router.get('/entry/:id', (req, res) => {
  try {
    const entry = auditService.getById(String(req.params.id), resolveTenantId(req.user));
    if (!entry) {
      res.status(404).json({ error: 'Audit entry not found' });
      return;
    }
    res.json(entry);
  } catch (err) {
    console.error('[audit] Get entry error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /retention — Get retention status
// ---------------------------------------------------------------------------

router.get('/retention', (req, res) => {
  try {
    const status = auditService.getRetentionStatus();
    res.json(status);
  } catch (err) {
    console.error('[audit] Retention status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /batch — Client audit-trail ingestion (PERSISTENCE_MAP R43)
// ---------------------------------------------------------------------------

const BatchEntrySchema = z.object({
  action: z.string().min(1).max(120),
  entityType: z.string().min(1).max(120),
  entityId: z.string().min(1).max(255),
  /** ISO-8601 timestamp; canonicalized to UTC before storage/checksum. */
  ts: z.string().datetime({ offset: true }),
  /** Optional free-form payload (object or string) stored in details. */
  details: z.union([z.record(z.unknown()), z.string()]).optional(),
});

const BatchSchema = z.object({
  batchId: z.string().min(1).max(200),
  entries: z.array(BatchEntrySchema).min(1).max(500),
});

router.post('/batch', (req, res) => {
  try {
    const parsed = BatchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const { batchId } = parsed.data;
    // JWT-scoped: actor and tenant ALWAYS come from the token, never the body.
    const tenantId = resolveTenantId(req.user);
    const userId = req.user!.id;
    const userName = req.user!.email;
    const userRole = req.user!.role;

    // Deterministic marker id embeds the tenant so identical client-supplied
    // batchIds in different tenants can never collide (audit_log.id PK is the
    // uniqueness enforcement; claim-check happens INSIDE the transaction,
    // mirroring the gl_entries K27 idempotency pattern).
    const markerId = `audit-batch-${tenantId}-${batchId}`;

    const result = db.transaction(() => {
      const existing = db
        .prepare('SELECT id, timestamp FROM audit_log WHERE id = ?')
        .get(markerId) as { id: string; timestamp: string } | undefined;

      if (existing) {
        return { replayed: true as const, committedAt: existing.timestamp };
      }

      const ids: string[] = [];
      const insertStmt = db.prepare(
        `INSERT INTO audit_log (
          id, tenant_id, timestamp, category, action, severity,
          user_id, user_name, user_role,
          resource_type, resource_id,
          details, metadata, checksum
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      for (const item of parsed.data.entries) {
        const id = `audit-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        // Canonicalize to UTC ISO so equal logical timestamps yield equal
        // stored values AND equal checksums across retries.
        const timestamp = new Date(item.ts).toISOString();
        const detailsStr =
          item.details === undefined
            ? null
            : typeof item.details === 'string'
              ? item.details
              : JSON.stringify(item.details);
        const metadataStr = JSON.stringify({ batchId, source: 'client-batch' });

        // Same integrity semantics as AuditService.log(): HMAC-SHA256 over
        // the sorted-key field set, sliced to 16 hex chars. No new columns —
        // the existing NOT NULL checksum column carries the chain.
        const checksumPayload = JSON.stringify(
          {
            id,
            timestamp,
            category: 'user_action',
            action: item.action,
            userId,
            resourceId: item.entityId,
            oldValue: null,
            newValue: null,
          },
          Object.keys({
            id: 0,
            timestamp: 0,
            category: 0,
            action: 0,
            userId: 0,
            resourceId: 0,
            oldValue: 0,
            newValue: 0,
          }).sort()
        );
        const checksum = crypto
          .createHmac('sha256', AUDIT_HMAC_SECRET)
          .update(checksumPayload)
          .digest('hex')
          .slice(0, 16);

        insertStmt.run(
          id,
          tenantId,
          timestamp,
          'user_action',
          item.action,
          'info',
          userId,
          userName,
          userRole,
          item.entityType,
          item.entityId,
          detailsStr,
          metadataStr,
          checksum
        );
        ids.push(id);
      }

      // Commit marker doubles as the SOX-visible ingestion record.
      const committedAt = new Date().toISOString();
      const markerChecksum = crypto
        .createHmac('sha256', AUDIT_HMAC_SECRET)
        .update(
          JSON.stringify(
            {
              action: 'audit_batch_commit',
              category: 'system_event',
              id: markerId,
              newValue: null,
              oldValue: null,
              resourceId: batchId,
              timestamp: committedAt,
              userId,
            },
            ['action', 'category', 'id', 'newValue', 'oldValue', 'resourceId', 'timestamp', 'userId'].sort()
          )
        )
        .digest('hex')
        .slice(0, 16);

      db.prepare(
        `INSERT INTO audit_log (
          id, tenant_id, timestamp, category, action, severity,
          user_id, user_name, user_role,
          resource_type, resource_id,
          details, metadata, checksum
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        markerId,
        tenantId,
        committedAt,
        'system_event',
        'audit_batch_commit',
        'info',
        userId,
        userName,
        userRole,
        'audit_batch',
        batchId,
        JSON.stringify({ batchId, count: ids.length }),
        JSON.stringify({ batchId, source: 'client-batch' }),
        markerChecksum
      );

      return { replayed: false as const, ids, count: ids.length, committedAt };
    })();

    if (result.replayed) {
      res.status(200).json({
        replayed: true,
        batchId,
        committedAt: result.committedAt,
      });
      return;
    }

    res.status(201).json({
      inserted: result.count,
      ids: result.ids,
      batchId,
      replayed: false,
    });
  } catch (err) {
    console.error('[audit] Batch ingestion error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /export — Export audit data
// ---------------------------------------------------------------------------

router.post('/export', (req, res) => {
  try {
    const { format, ...filter } = req.body as ExportFilter;

    if (format === 'csv') {
      const csv = auditService.exportCSV({
        tenantId: resolveTenantId(req.user),
        category: filter.category as AuditCategory | undefined,
        startDate: filter.startDate,
        endDate: filter.endDate,
        userId: filter.userId,
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit-export-${Date.now()}.csv"`);
      res.send(csv);
    } else {
      const json = auditService.exportJSON({
        tenantId: resolveTenantId(req.user),
        category: filter.category as AuditCategory | undefined,
        startDate: filter.startDate,
        endDate: filter.endDate,
        userId: filter.userId,
      });
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="audit-export-${Date.now()}.json"`
      );
      res.send(json);
    }
  } catch (err) {
    console.error('[audit] Export error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /prune — Prune old audit entries (Admin only)
// ---------------------------------------------------------------------------

router.post('/prune', requireRole('Admin'), (req, res) => {
  try {
    const { auditLogDays, loginAttemptsDays, dataChangesDays } = req.body as {
      auditLogDays?: number;
      loginAttemptsDays?: number;
      dataChangesDays?: number;
    };

    const pruned = auditService.prune({
      auditLogDays,
      loginAttemptsDays,
      dataChangesDays,
    });

    // Log the prune action itself
    auditService.log({
      category: 'system_event',
      action: 'config_change',
      severity: 'info',
      userId: req.user!.id,
      userName: req.user!.email,
      details: `Pruned ${pruned} old audit entries`,
      metadata: { auditLogDays, loginAttemptsDays, dataChangesDays },
    });

    res.json({ pruned });
  } catch (err) {
    console.error('[audit] Prune error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
