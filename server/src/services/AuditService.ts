import crypto from 'node:crypto';
import { db } from '../db/connection.js';

// =============================================================================
// Types
// =============================================================================

export type AuditCategory =
  | 'user_action'
  | 'data_change'
  | 'login_attempt'
  | 'permission_change'
  | 'system_event';

export type AuditSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'export'
  | 'import'
  | 'approve'
  | 'reject'
  | 'role_change'
  | 'permission_grant'
  | 'permission_revoke'
  | 'account_activate'
  | 'account_deactivate'
  | 'view'
  | 'search'
  | 'comment'
  | 'bulk_update'
  | 'bulk_delete'
  | 'system_start'
  | 'system_error'
  | 'config_change';

export type PermissionChangeType =
  | 'role_change'
  | 'entity_access_granted'
  | 'entity_access_revoked'
  | 'entity_role_change'
  | 'account_activated'
  | 'account_deactivated';

export type DataChangeType = 'insert' | 'update' | 'delete';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  category: AuditCategory;
  action: AuditAction;
  severity: AuditSeverity;
  userId: string | null;
  userName: string | null;
  userRole: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  sessionId: string | null;
  resourceType: string | null;
  resourceId: string | null;
  resourceName: string | null;
  oldValue: string | null;
  newValue: string | null;
  changeSummary: string | null;
  details: string | null;
  metadata: Record<string, unknown> | null;
  requestMethod: string | null;
  requestPath: string | null;
  responseStatus: number | null;
  durationMs: number | null;
  checksum: string;
  createdAt: string;
}

export interface LoginAttemptEntry {
  id: number;
  email: string;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  failureReason: string | null;
  attemptedAt: string;
}

export interface PermissionChangeEntry {
  id: string;
  timestamp: string;
  changedByUserId: string;
  changedByUserName: string | null;
  targetUserId: string;
  targetUserName: string | null;
  changeType: PermissionChangeType;
  oldValue: string | null;
  newValue: string | null;
  entityId: string | null;
  reason: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface DataChangeEntry {
  id: string;
  timestamp: string;
  userId: string | null;
  userName: string | null;
  tableName: string;
  recordId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changeType: DataChangeType;
  transactionId: string | null;
  reason: string | null;
  createdAt: string;
}

export interface AuditFilter {
  category?: AuditCategory;
  action?: AuditAction;
  severity?: AuditSeverity;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AuditStats {
  total: number;
  byCategory: Record<string, number>;
  byAction: Record<string, number>;
  bySeverity: Record<string, number>;
  byUser: Record<string, number>;
  recentErrors: AuditLogEntry[];
  loginStats: {
    totalAttempts: number;
    successfulLogins: number;
    failedLogins: number;
    uniqueEmails: number;
  };
  permissionStats: {
    totalChanges: number;
    byType: Record<string, number>;
  };
}

export interface RetentionConfig {
  auditLogDays: number;
  loginAttemptsDays: number;
  dataChangesDays: number;
}

// =============================================================================
// Prepared Statements (cached for performance)
// =============================================================================

const insertAuditLog = db.prepare(`
  INSERT INTO audit_log (
    id, timestamp, category, action, severity,
    user_id, user_name, user_role, ip_address, user_agent, session_id,
    resource_type, resource_id, resource_name,
    old_value, new_value, change_summary,
    details, metadata, request_method, request_path, response_status, duration_ms,
    checksum
  ) VALUES (
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?, ?, ?, ?,
    ?
  )
`);

const insertLoginAttempt = db.prepare(`
  INSERT INTO audit_login_attempts (email, ip_address, user_agent, success, failure_reason)
  VALUES (?, ?, ?, ?, ?)
`);

const insertPermissionChange = db.prepare(`
  INSERT INTO audit_permission_changes (
    id, changed_by_user_id, changed_by_user_name,
    target_user_id, target_user_name, change_type,
    old_value, new_value, entity_id, reason, ip_address
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertDataChange = db.prepare(`
  INSERT INTO audit_data_changes (
    id, user_id, user_name, table_name, record_id,
    field_name, old_value, new_value, change_type, transaction_id, reason
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// =============================================================================
// AuditService — Comprehensive audit logging engine
// =============================================================================

export class AuditService {
  private defaultRetention: RetentionConfig = {
    auditLogDays: 2555, // ~7 years for SOX compliance
    loginAttemptsDays: 90, // 90 days for login attempts
    dataChangesDays: 2555, // ~7 years for data changes
  };

  // ---------------------------------------------------------------------------
  // Core logging
  // ---------------------------------------------------------------------------

  /**
   * Log an audit event. This is the primary entry point for all audit logging.
   */
  log(entry: {
    category: AuditCategory;
    action: AuditAction;
    severity?: AuditSeverity;
    userId?: string | null;
    userName?: string | null;
    userRole?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    sessionId?: string | null;
    resourceType?: string | null;
    resourceId?: string | null;
    resourceName?: string | null;
    oldValue?: unknown;
    newValue?: unknown;
    changeSummary?: string | null;
    details?: string | null;
    metadata?: Record<string, unknown> | null;
    requestMethod?: string | null;
    requestPath?: string | null;
    responseStatus?: number | null;
    durationMs?: number | null;
  }): AuditLogEntry {
    const id = `audit-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date().toISOString();
    const severity = entry.severity ?? 'info';

    const oldValueStr =
      entry.oldValue !== undefined && entry.oldValue !== null
        ? JSON.stringify(entry.oldValue)
        : null;
    const newValueStr =
      entry.newValue !== undefined && entry.newValue !== null
        ? JSON.stringify(entry.newValue)
        : null;
    const metadataStr = entry.metadata ? JSON.stringify(entry.metadata) : null;

    const checksum = this.computeChecksum({
      id,
      timestamp,
      category: entry.category,
      action: entry.action,
      userId: entry.userId,
      resourceId: entry.resourceId,
      oldValue: oldValueStr,
      newValue: newValueStr,
    });

    insertAuditLog.run(
      id,
      timestamp,
      entry.category,
      entry.action,
      severity,
      entry.userId ?? null,
      entry.userName ?? null,
      entry.userRole ?? null,
      entry.ipAddress ?? null,
      entry.userAgent ?? null,
      entry.sessionId ?? null,
      entry.resourceType ?? null,
      entry.resourceId ?? null,
      entry.resourceName ?? null,
      oldValueStr,
      newValueStr,
      entry.changeSummary ?? null,
      entry.details ?? null,
      metadataStr,
      entry.requestMethod ?? null,
      entry.requestPath ?? null,
      entry.responseStatus ?? null,
      entry.durationMs ?? null,
      checksum
    );

    return this.mapAuditRow({
      id,
      timestamp,
      category: entry.category,
      action: entry.action,
      severity,
      user_id: entry.userId ?? null,
      user_name: entry.userName ?? null,
      user_role: entry.userRole ?? null,
      ip_address: entry.ipAddress ?? null,
      user_agent: entry.userAgent ?? null,
      session_id: entry.sessionId ?? null,
      resource_type: entry.resourceType ?? null,
      resource_id: entry.resourceId ?? null,
      resource_name: entry.resourceName ?? null,
      old_value: oldValueStr,
      new_value: newValueStr,
      change_summary: entry.changeSummary ?? null,
      details: entry.details ?? null,
      metadata: metadataStr,
      request_method: entry.requestMethod ?? null,
      request_path: entry.requestPath ?? null,
      response_status: entry.responseStatus ?? null,
      duration_ms: entry.durationMs ?? null,
      checksum,
      created_at: timestamp,
    });
  }

  // ---------------------------------------------------------------------------
  // Specialized logging methods
  // ---------------------------------------------------------------------------

  /**
   * Log a user action (create, update, delete, view, export, etc.)
   */
  logUserAction(params: {
    userId: string;
    userName: string;
    userRole?: string;
    action: AuditAction;
    resourceType: string;
    resourceId: string;
    resourceName?: string;
    oldValue?: unknown;
    newValue?: unknown;
    details?: string;
    ipAddress?: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
  }): AuditLogEntry {
    return this.log({
      category: 'user_action',
      action: params.action,
      severity: 'info',
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      resourceName: params.resourceName,
      oldValue: params.oldValue,
      newValue: params.newValue,
      changeSummary: `${params.action} ${params.resourceType}/${params.resourceId}`,
      details: params.details,
      ipAddress: params.ipAddress,
      sessionId: params.sessionId,
      metadata: params.metadata,
    });
  }

  /**
   * Log a data change with field-level tracking.
   */
  logDataChange(params: {
    userId: string;
    userName: string;
    tableName: string;
    recordId: string;
    changes: Array<{
      field: string;
      oldValue: unknown;
      newValue: unknown;
    }>;
    changeType: DataChangeType;
    transactionId?: string;
    reason?: string;
  }): DataChangeEntry[] {
    const entries: DataChangeEntry[] = [];
    const timestamp = new Date().toISOString();

    for (const change of params.changes) {
      const id = `dc-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      const oldValueStr =
        change.oldValue !== undefined && change.oldValue !== null
          ? JSON.stringify(change.oldValue)
          : null;
      const newValueStr =
        change.newValue !== undefined && change.newValue !== null
          ? JSON.stringify(change.newValue)
          : null;

      insertDataChange.run(
        id,
        params.userId,
        params.userName,
        params.tableName,
        params.recordId,
        change.field,
        oldValueStr,
        newValueStr,
        params.changeType,
        params.transactionId ?? null,
        params.reason ?? null
      );

      entries.push({
        id,
        timestamp,
        userId: params.userId,
        userName: params.userName,
        tableName: params.tableName,
        recordId: params.recordId,
        fieldName: change.field,
        oldValue: oldValueStr,
        newValue: newValueStr,
        changeType: params.changeType,
        transactionId: params.transactionId ?? null,
        reason: params.reason ?? null,
        createdAt: timestamp,
      });
    }

    // Also log to the main audit_log
    this.log({
      category: 'data_change',
      action:
        params.changeType === 'insert'
          ? 'create'
          : params.changeType === 'delete'
            ? 'delete'
            : 'update',
      severity: 'info',
      userId: params.userId,
      userName: params.userName,
      resourceType: params.tableName,
      resourceId: params.recordId,
      changeSummary: `${params.changeType} ${params.changes.length} field(s) in ${params.tableName}`,
      details: params.reason,
      metadata: {
        transactionId: params.transactionId,
        changedFields: params.changes.map((c) => c.field),
      },
    });

    return entries;
  }

  /**
   * Log a login attempt.
   */
  logLoginAttempt(params: {
    email: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    success: boolean;
    failureReason?: string;
    userId?: string;
    userName?: string;
  }): LoginAttemptEntry {
    insertLoginAttempt.run(
      params.email,
      params.ipAddress ?? null,
      params.userAgent ?? null,
      params.success ? 1 : 0,
      params.failureReason ?? null
    );

    // Also log to main audit_log
    this.log({
      category: 'login_attempt',
      action: params.success ? 'login' : 'login_failed',
      severity: params.success ? 'info' : 'warning',
      userId: params.userId ?? null,
      userName: params.userName ?? params.email,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      details: params.success
        ? `Successful login for ${params.email}`
        : `Failed login for ${params.email}: ${params.failureReason ?? 'invalid credentials'}`,
    });

    const row = db
      .prepare(
        'SELECT * FROM audit_login_attempts WHERE email = ? ORDER BY attempted_at DESC LIMIT 1'
      )
      .get(params.email) as Record<string, unknown>;

    return this.mapLoginAttemptRow(row);
  }

  /**
   * Log a permission change.
   */
  logPermissionChange(params: {
    changedByUserId: string;
    changedByUserName?: string;
    targetUserId: string;
    targetUserName?: string;
    changeType: PermissionChangeType;
    oldValue?: unknown;
    newValue?: unknown;
    entityId?: string;
    reason?: string;
    ipAddress?: string;
  }): PermissionChangeEntry {
    const id = `perm-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date().toISOString();
    const oldValueStr =
      params.oldValue !== undefined && params.oldValue !== null
        ? JSON.stringify(params.oldValue)
        : null;
    const newValueStr =
      params.newValue !== undefined && params.newValue !== null
        ? JSON.stringify(params.newValue)
        : null;

    insertPermissionChange.run(
      id,
      params.changedByUserId,
      params.changedByUserName ?? null,
      params.targetUserId,
      params.targetUserName ?? null,
      params.changeType,
      oldValueStr,
      newValueStr,
      params.entityId ?? null,
      params.reason ?? null,
      params.ipAddress ?? null
    );

    // Also log to main audit_log
    const actionMap: Record<PermissionChangeType, AuditAction> = {
      role_change: 'role_change',
      entity_access_granted: 'permission_grant',
      entity_access_revoked: 'permission_revoke',
      entity_role_change: 'role_change',
      account_activated: 'account_activate',
      account_deactivated: 'account_deactivate',
    };

    this.log({
      category: 'permission_change',
      action: actionMap[params.changeType],
      severity: 'warning',
      userId: params.changedByUserId,
      userName: params.changedByUserName,
      resourceType: 'user',
      resourceId: params.targetUserId,
      resourceName: params.targetUserName,
      oldValue: params.oldValue,
      newValue: params.newValue,
      changeSummary: `${params.changeType}: ${params.targetUserName ?? params.targetUserId}`,
      details: params.reason,
      ipAddress: params.ipAddress,
      metadata: { entityId: params.entityId },
    });

    return {
      id,
      timestamp,
      changedByUserId: params.changedByUserId,
      changedByUserName: params.changedByUserName ?? null,
      targetUserId: params.targetUserId,
      targetUserName: params.targetUserName ?? null,
      changeType: params.changeType,
      oldValue: oldValueStr,
      newValue: newValueStr,
      entityId: params.entityId ?? null,
      reason: params.reason ?? null,
      ipAddress: params.ipAddress ?? null,
      createdAt: timestamp,
    };
  }

  // ---------------------------------------------------------------------------
  // Query methods
  // ---------------------------------------------------------------------------

  /**
   * Query audit log entries with filters.
   */
  query(filter: AuditFilter = {}): { entries: AuditLogEntry[]; total: number } {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter.category) {
      conditions.push('category = ?');
      params.push(filter.category);
    }
    if (filter.action) {
      conditions.push('action = ?');
      params.push(filter.action);
    }
    if (filter.severity) {
      conditions.push('severity = ?');
      params.push(filter.severity);
    }
    if (filter.userId) {
      conditions.push('user_id = ?');
      params.push(filter.userId);
    }
    if (filter.resourceType) {
      conditions.push('resource_type = ?');
      params.push(filter.resourceType);
    }
    if (filter.resourceId) {
      conditions.push('resource_id = ?');
      params.push(filter.resourceId);
    }
    if (filter.startDate) {
      conditions.push('timestamp >= ?');
      params.push(filter.startDate);
    }
    if (filter.endDate) {
      conditions.push('timestamp <= ?');
      params.push(filter.endDate);
    }
    if (filter.search) {
      conditions.push('(details LIKE ? OR resource_name LIKE ? OR user_name LIKE ?)');
      const searchTerm = `%${filter.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filter.limit ?? 50;
    const offset = filter.offset ?? 0;

    const countRow = db
      .prepare(`SELECT COUNT(*) as count FROM audit_log ${whereClause}`)
      .get(...params) as { count: number };

    const rows = db
      .prepare(`SELECT * FROM audit_log ${whereClause} ORDER BY timestamp DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, offset) as Record<string, unknown>[];

    return {
      entries: rows.map((row) => this.mapAuditRow(row)),
      total: countRow.count,
    };
  }

  /**
   * Get login attempts with optional filtering.
   */
  getLoginAttempts(
    filter: {
      email?: string;
      ipAddress?: string;
      success?: boolean;
      startDate?: string;
      endDate?: string;
      limit?: number;
    } = {}
  ): LoginAttemptEntry[] {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter.email) {
      conditions.push('email = ?');
      params.push(filter.email);
    }
    if (filter.ipAddress) {
      conditions.push('ip_address = ?');
      params.push(filter.ipAddress);
    }
    if (filter.success !== undefined) {
      conditions.push('success = ?');
      params.push(filter.success ? 1 : 0);
    }
    if (filter.startDate) {
      conditions.push('attempted_at >= ?');
      params.push(filter.startDate);
    }
    if (filter.endDate) {
      conditions.push('attempted_at <= ?');
      params.push(filter.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filter.limit ?? 100;

    const rows = db
      .prepare(
        `SELECT * FROM audit_login_attempts ${whereClause} ORDER BY attempted_at DESC LIMIT ?`
      )
      .all(...params, limit) as Record<string, unknown>[];

    return rows.map((row) => this.mapLoginAttemptRow(row));
  }

  /**
   * Get permission changes with optional filtering.
   */
  getPermissionChanges(
    filter: {
      targetUserId?: string;
      changedByUserId?: string;
      changeType?: PermissionChangeType;
      entityId?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    } = {}
  ): PermissionChangeEntry[] {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter.targetUserId) {
      conditions.push('target_user_id = ?');
      params.push(filter.targetUserId);
    }
    if (filter.changedByUserId) {
      conditions.push('changed_by_user_id = ?');
      params.push(filter.changedByUserId);
    }
    if (filter.changeType) {
      conditions.push('change_type = ?');
      params.push(filter.changeType);
    }
    if (filter.entityId) {
      conditions.push('entity_id = ?');
      params.push(filter.entityId);
    }
    if (filter.startDate) {
      conditions.push('timestamp >= ?');
      params.push(filter.startDate);
    }
    if (filter.endDate) {
      conditions.push('timestamp <= ?');
      params.push(filter.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filter.limit ?? 100;

    const rows = db
      .prepare(
        `SELECT * FROM audit_permission_changes ${whereClause} ORDER BY timestamp DESC LIMIT ?`
      )
      .all(...params, limit) as Record<string, unknown>[];

    return rows.map((row) => this.mapPermissionChangeRow(row));
  }

  /**
   * Get data changes for a specific record.
   */
  getDataChanges(
    filter: {
      tableName?: string;
      recordId?: string;
      userId?: string;
      changeType?: DataChangeType;
      startDate?: string;
      endDate?: string;
      limit?: number;
    } = {}
  ): DataChangeEntry[] {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter.tableName) {
      conditions.push('table_name = ?');
      params.push(filter.tableName);
    }
    if (filter.recordId) {
      conditions.push('record_id = ?');
      params.push(filter.recordId);
    }
    if (filter.userId) {
      conditions.push('user_id = ?');
      params.push(filter.userId);
    }
    if (filter.changeType) {
      conditions.push('change_type = ?');
      params.push(filter.changeType);
    }
    if (filter.startDate) {
      conditions.push('timestamp >= ?');
      params.push(filter.startDate);
    }
    if (filter.endDate) {
      conditions.push('timestamp <= ?');
      params.push(filter.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filter.limit ?? 100;

    const rows = db
      .prepare(`SELECT * FROM audit_data_changes ${whereClause} ORDER BY timestamp DESC LIMIT ?`)
      .all(...params, limit) as Record<string, unknown>[];

    return rows.map((row) => this.mapDataChangeRow(row));
  }

  /**
   * Get a single audit entry by ID.
   */
  getById(id: string): AuditLogEntry | null {
    const row = db.prepare('SELECT * FROM audit_log WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined;
    return row ? this.mapAuditRow(row) : null;
  }

  /**
   * Get the full history for a specific resource.
   */
  getResourceHistory(resourceType: string, resourceId: string): AuditLogEntry[] {
    const rows = db
      .prepare(
        'SELECT * FROM audit_log WHERE resource_type = ? AND resource_id = ? ORDER BY timestamp DESC'
      )
      .all(resourceType, resourceId) as Record<string, unknown>[];
    return rows.map((row) => this.mapAuditRow(row));
  }

  /**
   * Get the full activity for a specific user.
   */
  getUserActivity(userId: string, limit = 100): AuditLogEntry[] {
    const rows = db
      .prepare('SELECT * FROM audit_log WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?')
      .all(userId, limit) as Record<string, unknown>[];
    return rows.map((row) => this.mapAuditRow(row));
  }

  // ---------------------------------------------------------------------------
  // Statistics
  // ---------------------------------------------------------------------------

  /**
   * Get comprehensive audit statistics.
   */
  getStats(dateRange?: { startDate?: string; endDate?: string }): AuditStats {
    const whereConditions: string[] = [];
    const whereParams: unknown[] = [];

    if (dateRange?.startDate) {
      whereConditions.push('timestamp >= ?');
      whereParams.push(dateRange.startDate);
    }
    if (dateRange?.endDate) {
      whereConditions.push('timestamp <= ?');
      whereParams.push(dateRange.endDate);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Total count
    const totalRow = db
      .prepare(`SELECT COUNT(*) as count FROM audit_log ${whereClause}`)
      .get(...whereParams) as { count: number };

    // By category
    const categoryRows = db
      .prepare(`SELECT category, COUNT(*) as count FROM audit_log ${whereClause} GROUP BY category`)
      .all(...whereParams) as Array<{ category: string; count: number }>;

    // By action
    const actionRows = db
      .prepare(`SELECT action, COUNT(*) as count FROM audit_log ${whereClause} GROUP BY action`)
      .all(...whereParams) as Array<{ action: string; count: number }>;

    // By severity
    const severityRows = db
      .prepare(`SELECT severity, COUNT(*) as count FROM audit_log ${whereClause} GROUP BY severity`)
      .all(...whereParams) as Array<{ severity: string; count: number }>;

    // By user
    const userWhereClause = whereClause
      ? `${whereClause} AND user_id IS NOT NULL`
      : 'WHERE user_id IS NOT NULL';
    const userRows = db
      .prepare(
        `SELECT user_id, COUNT(*) as count FROM audit_log ${userWhereClause} GROUP BY user_id ORDER BY count DESC LIMIT 10`
      )
      .all(...whereParams) as Array<{ user_id: string; count: number }>;

    // Recent errors
    const errorWhereClause = whereClause
      ? `${whereClause} AND severity IN ('error', 'critical')`
      : "WHERE severity IN ('error', 'critical')";
    const errorRows = db
      .prepare(`SELECT * FROM audit_log ${errorWhereClause} ORDER BY timestamp DESC LIMIT 10`)
      .all(...whereParams) as Record<string, unknown>[];

    // Login stats
    const loginWhereConditions: string[] = [];
    const loginWhereParams: unknown[] = [];
    if (dateRange?.startDate) {
      loginWhereConditions.push('attempted_at >= ?');
      loginWhereParams.push(dateRange.startDate);
    }
    if (dateRange?.endDate) {
      loginWhereConditions.push('attempted_at <= ?');
      loginWhereParams.push(dateRange.endDate);
    }
    const loginWhereClause =
      loginWhereConditions.length > 0 ? `WHERE ${loginWhereConditions.join(' AND ')}` : '';

    const loginTotalRow = db
      .prepare(`SELECT COUNT(*) as count FROM audit_login_attempts ${loginWhereClause}`)
      .get(...loginWhereParams) as { count: number };

    const loginSuccessWhereClause = loginWhereClause
      ? `${loginWhereClause} AND success = 1`
      : 'WHERE success = 1';
    const loginSuccessRow = db
      .prepare(`SELECT COUNT(*) as count FROM audit_login_attempts ${loginSuccessWhereClause}`)
      .get(...loginWhereParams) as { count: number };

    const loginUniqueRow = db
      .prepare(
        `SELECT COUNT(DISTINCT email) as count FROM audit_login_attempts ${loginWhereClause}`
      )
      .get(...loginWhereParams) as { count: number };

    // Permission stats
    const permTotalRow = db
      .prepare(`SELECT COUNT(*) as count FROM audit_permission_changes`)
      .get() as { count: number };

    const permTypeRows = db
      .prepare(
        `SELECT change_type, COUNT(*) as count FROM audit_permission_changes GROUP BY change_type`
      )
      .all() as Array<{ change_type: string; count: number }>;

    return {
      total: totalRow.count,
      byCategory: Object.fromEntries(categoryRows.map((r) => [r.category, r.count])),
      byAction: Object.fromEntries(actionRows.map((r) => [r.action, r.count])),
      bySeverity: Object.fromEntries(severityRows.map((r) => [r.severity, r.count])),
      byUser: Object.fromEntries(userRows.map((r) => [r.user_id, r.count])),
      recentErrors: errorRows.map((row) => this.mapAuditRow(row)),
      loginStats: {
        totalAttempts: loginTotalRow.count,
        successfulLogins: loginSuccessRow.count,
        failedLogins: loginTotalRow.count - loginSuccessRow.count,
        uniqueEmails: loginUniqueRow.count,
      },
      permissionStats: {
        totalChanges: permTotalRow.count,
        byType: Object.fromEntries(permTypeRows.map((r) => [r.change_type, r.count])),
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Retention & cleanup
  // ---------------------------------------------------------------------------

  /**
   * Prune old audit entries based on retention configuration.
   */
  prune(config?: Partial<RetentionConfig>): number {
    const cfg = { ...this.defaultRetention, ...config };
    let totalPruned = 0;

    const auditCutoff = new Date();
    auditCutoff.setDate(auditCutoff.getDate() - cfg.auditLogDays);
    const auditResult = db
      .prepare('DELETE FROM audit_log WHERE timestamp < ?')
      .run(auditCutoff.toISOString());
    totalPruned += auditResult.changes;

    const loginCutoff = new Date();
    loginCutoff.setDate(loginCutoff.getDate() - cfg.loginAttemptsDays);
    const loginResult = db
      .prepare('DELETE FROM audit_login_attempts WHERE attempted_at < ?')
      .run(loginCutoff.toISOString());
    totalPruned += loginResult.changes;

    const dataCutoff = new Date();
    dataCutoff.setDate(dataCutoff.getDate() - cfg.dataChangesDays);
    const dataResult = db
      .prepare('DELETE FROM audit_data_changes WHERE timestamp < ?')
      .run(dataCutoff.toISOString());
    totalPruned += dataResult.changes;

    return totalPruned;
  }

  /**
   * Get retention status for all audit tables.
   */
  getRetentionStatus(): {
    auditLog: { count: number; oldestEntry: string | null };
    loginAttempts: { count: number; oldestEntry: string | null };
    dataChanges: { count: number; oldestEntry: string | null };
    permissionChanges: { count: number; oldestEntry: string | null };
  } {
    const auditCount = (
      db.prepare('SELECT COUNT(*) as count FROM audit_log').get() as { count: number }
    ).count;
    const auditOldest = (
      db.prepare('SELECT MIN(timestamp) as oldest FROM audit_log').get() as {
        oldest: string | null;
      }
    ).oldest;

    const loginCount = (
      db.prepare('SELECT COUNT(*) as count FROM audit_login_attempts').get() as { count: number }
    ).count;
    const loginOldest = (
      db.prepare('SELECT MIN(attempted_at) as oldest FROM audit_login_attempts').get() as {
        oldest: string | null;
      }
    ).oldest;

    const dataCount = (
      db.prepare('SELECT COUNT(*) as count FROM audit_data_changes').get() as { count: number }
    ).count;
    const dataOldest = (
      db.prepare('SELECT MIN(timestamp) as oldest FROM audit_data_changes').get() as {
        oldest: string | null;
      }
    ).oldest;

    const permCount = (
      db.prepare('SELECT COUNT(*) as count FROM audit_permission_changes').get() as {
        count: number;
      }
    ).count;
    const permOldest = (
      db.prepare('SELECT MIN(timestamp) as oldest FROM audit_permission_changes').get() as {
        oldest: string | null;
      }
    ).oldest;

    return {
      auditLog: { count: auditCount, oldestEntry: auditOldest },
      loginAttempts: { count: loginCount, oldestEntry: loginOldest },
      dataChanges: { count: dataCount, oldestEntry: dataOldest },
      permissionChanges: { count: permCount, oldestEntry: permOldest },
    };
  }

  // ---------------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------------

  /**
   * Export audit log entries as CSV.
   */
  exportCSV(filter: AuditFilter = {}): string {
    const { entries } = this.query({ ...filter, limit: 100000 });

    const headers = [
      'id',
      'timestamp',
      'category',
      'action',
      'severity',
      'userId',
      'userName',
      'userRole',
      'ipAddress',
      'resourceType',
      'resourceId',
      'resourceName',
      'changeSummary',
      'details',
    ];

    const escapeCSV = (val: unknown): string => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = entries.map((e) =>
      headers.map((h) => escapeCSV(e[h as keyof AuditLogEntry])).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Export audit log as JSON.
   */
  exportJSON(filter: AuditFilter = {}): string {
    const { entries } = this.query({ ...filter, limit: 100000 });
    return JSON.stringify(entries, null, 2);
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private computeChecksum(data: Record<string, unknown>): string {
    const payload = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 16);
  }

  private mapAuditRow(row: Record<string, unknown>): AuditLogEntry {
    return {
      id: row.id as string,
      timestamp: row.timestamp as string,
      category: row.category as AuditCategory,
      action: row.action as AuditAction,
      severity: row.severity as AuditSeverity,
      userId: row.user_id as string | null,
      userName: row.user_name as string | null,
      userRole: row.user_role as string | null,
      ipAddress: row.ip_address as string | null,
      userAgent: row.user_agent as string | null,
      sessionId: row.session_id as string | null,
      resourceType: row.resource_type as string | null,
      resourceId: row.resource_id as string | null,
      resourceName: row.resource_name as string | null,
      oldValue: row.old_value as string | null,
      newValue: row.new_value as string | null,
      changeSummary: row.change_summary as string | null,
      details: row.details as string | null,
      metadata: row.metadata ? JSON.parse(row.metadata as string) : null,
      requestMethod: row.request_method as string | null,
      requestPath: row.request_path as string | null,
      responseStatus: row.response_status as number | null,
      durationMs: row.duration_ms as number | null,
      checksum: row.checksum as string,
      createdAt: row.created_at as string,
    };
  }

  private mapLoginAttemptRow(row: Record<string, unknown>): LoginAttemptEntry {
    return {
      id: row.id as number,
      email: row.email as string,
      ipAddress: row.ip_address as string | null,
      userAgent: row.user_agent as string | null,
      success: Boolean(row.success),
      failureReason: row.failure_reason as string | null,
      attemptedAt: row.attempted_at as string,
    };
  }

  private mapPermissionChangeRow(row: Record<string, unknown>): PermissionChangeEntry {
    return {
      id: row.id as string,
      timestamp: row.timestamp as string,
      changedByUserId: row.changed_by_user_id as string,
      changedByUserName: row.changed_by_user_name as string | null,
      targetUserId: row.target_user_id as string,
      targetUserName: row.target_user_name as string | null,
      changeType: row.change_type as PermissionChangeType,
      oldValue: row.old_value as string | null,
      newValue: row.new_value as string | null,
      entityId: row.entity_id as string | null,
      reason: row.reason as string | null,
      ipAddress: row.ip_address as string | null,
      createdAt: row.created_at as string,
    };
  }

  private mapDataChangeRow(row: Record<string, unknown>): DataChangeEntry {
    return {
      id: row.id as string,
      timestamp: row.timestamp as string,
      userId: row.user_id as string | null,
      userName: row.user_name as string | null,
      tableName: row.table_name as string,
      recordId: row.record_id as string,
      fieldName: row.field_name as string,
      oldValue: row.old_value as string | null,
      newValue: row.new_value as string | null,
      changeType: row.change_type as DataChangeType,
      transactionId: row.transaction_id as string | null,
      reason: row.reason as string | null,
      createdAt: row.created_at as string,
    };
  }
}

// Singleton instance
export const auditService = new AuditService();
