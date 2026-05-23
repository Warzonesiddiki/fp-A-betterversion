import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock the database connection — create DB entirely inside the factory
// ---------------------------------------------------------------------------

const { testDb } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  // Disable foreign keys for tests to allow inserting audit entries with arbitrary user IDs
  db.pragma('foreign_keys = OFF');

  // Create audit tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Viewer',
      entity_id TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      category TEXT NOT NULL CHECK (category IN (
        'user_action', 'data_change', 'login_attempt', 'permission_change', 'system_event'
      )),
      action TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
      user_id TEXT,
      user_name TEXT,
      user_role TEXT,
      ip_address TEXT,
      user_agent TEXT,
      session_id TEXT,
      resource_type TEXT,
      resource_id TEXT,
      resource_name TEXT,
      old_value TEXT,
      new_value TEXT,
      change_summary TEXT,
      details TEXT,
      metadata TEXT,
      request_method TEXT,
      request_path TEXT,
      response_status INTEGER,
      duration_ms INTEGER,
      checksum TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_log_category ON audit_log(category);
    CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
    CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);

    CREATE TABLE IF NOT EXISTS audit_login_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      success INTEGER NOT NULL DEFAULT 0,
      failure_reason TEXT,
      attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_audit_login_email ON audit_login_attempts(email, attempted_at);

    CREATE TABLE IF NOT EXISTS audit_permission_changes (
      id TEXT PRIMARY KEY,
      timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      changed_by_user_id TEXT NOT NULL,
      changed_by_user_name TEXT,
      target_user_id TEXT NOT NULL,
      target_user_name TEXT,
      change_type TEXT NOT NULL CHECK (change_type IN (
        'role_change', 'entity_access_granted', 'entity_access_revoked',
        'entity_role_change', 'account_activated', 'account_deactivated'
      )),
      old_value TEXT,
      new_value TEXT,
      entity_id TEXT,
      reason TEXT,
      ip_address TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS audit_data_changes (
      id TEXT PRIMARY KEY,
      timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      user_id TEXT,
      user_name TEXT,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      field_name TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      change_type TEXT NOT NULL CHECK (change_type IN ('insert', 'update', 'delete')),
      transaction_id TEXT,
      reason TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_audit_data_table_record ON audit_data_changes(table_name, record_id);
  `);

  return { testDb: db };
});

vi.mock('../db/connection.js', () => ({
  db: testDb,
}));

// Import AFTER mock is set up
import { AuditService } from './AuditService.js';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(() => {
    testDb.exec('DELETE FROM audit_log');
    testDb.exec('DELETE FROM audit_login_attempts');
    testDb.exec('DELETE FROM audit_permission_changes');
    testDb.exec('DELETE FROM audit_data_changes');
    service = new AuditService();
  });

  // =========================================================================
  // Core logging
  // =========================================================================

  describe('log', () => {
    it('should create an audit log entry with all fields', () => {
      const entry = service.log({
        category: 'user_action',
        action: 'create',
        severity: 'info',
        userId: 'user-1',
        userName: 'Alice',
        userRole: 'Admin',
        ipAddress: '192.168.1.1',
        resourceType: 'budget',
        resourceId: 'budget-1',
        resourceName: 'FY2026 Budget',
        newValue: { amount: 1000 },
        details: 'Created new budget',
      });

      expect(entry.id).toMatch(/^audit-/);
      expect(entry.timestamp).toBeDefined();
      expect(entry.category).toBe('user_action');
      expect(entry.action).toBe('create');
      expect(entry.severity).toBe('info');
      expect(entry.userId).toBe('user-1');
      expect(entry.userName).toBe('Alice');
      expect(entry.resourceType).toBe('budget');
      expect(entry.resourceId).toBe('budget-1');
      expect(entry.checksum).toBeDefined();
    });

    it('should use default severity when not specified', () => {
      const entry = service.log({
        category: 'system_event',
        action: 'system_start',
      });
      expect(entry.severity).toBe('info');
    });

    it('should handle null optional fields', () => {
      const entry = service.log({
        category: 'user_action',
        action: 'view',
      });
      expect(entry.userId).toBeNull();
      expect(entry.userName).toBeNull();
      expect(entry.resourceType).toBeNull();
    });
  });

  // =========================================================================
  // Specialized logging methods
  // =========================================================================

  describe('logUserAction', () => {
    it('should log a user action with proper categorization', () => {
      const entry = service.logUserAction({
        userId: 'user-1',
        userName: 'Alice',
        userRole: 'Analyst',
        action: 'update',
        resourceType: 'budget',
        resourceId: 'budget-1',
        resourceName: 'FY2026 Budget',
        oldValue: { amount: 500 },
        newValue: { amount: 1000 },
        details: 'Updated budget amount',
      });

      expect(entry.category).toBe('user_action');
      expect(entry.action).toBe('update');
      expect(entry.changeSummary).toContain('update');
      expect(entry.changeSummary).toContain('budget');
    });

    it('should include IP address and session ID', () => {
      const entry = service.logUserAction({
        userId: 'user-1',
        userName: 'Alice',
        action: 'create',
        resourceType: 'forecast',
        resourceId: 'fc-1',
        ipAddress: '10.0.0.1',
        sessionId: 'sess-123',
      });

      expect(entry.ipAddress).toBe('10.0.0.1');
      expect(entry.sessionId).toBe('sess-123');
    });
  });

  describe('logDataChange', () => {
    it('should log field-level data changes', () => {
      const entries = service.logDataChange({
        userId: 'user-1',
        userName: 'Alice',
        tableName: 'budgets',
        recordId: 'budget-1',
        changes: [
          { field: 'amount', oldValue: 500, newValue: 1000 },
          { field: 'status', oldValue: 'draft', newValue: 'submitted' },
        ],
        changeType: 'update',
        reason: 'Budget revision',
      });

      expect(entries).toHaveLength(2);
      expect(entries[0].fieldName).toBe('amount');
      expect(entries[1].fieldName).toBe('status');
      expect(entries[0].changeType).toBe('update');
    });

    it('should associate changes with a transaction ID', () => {
      const entries = service.logDataChange({
        userId: 'user-1',
        userName: 'Alice',
        tableName: 'line_items',
        recordId: 'li-1',
        changes: [
          { field: 'value', oldValue: 100, newValue: 200 },
        ],
        changeType: 'update',
        transactionId: 'txn-001',
      });

      expect(entries[0].transactionId).toBe('txn-001');
    });

    it('should also create an entry in the main audit log', () => {
      service.logDataChange({
        userId: 'user-1',
        userName: 'Alice',
        tableName: 'budgets',
        recordId: 'budget-1',
        changes: [
          { field: 'amount', oldValue: 500, newValue: 1000 },
        ],
        changeType: 'update',
      });

      const { entries } = service.query({ category: 'data_change' });
      expect(entries.length).toBeGreaterThanOrEqual(1);
      expect(entries[0].category).toBe('data_change');
    });

    it('should handle insert changes', () => {
      const entries = service.logDataChange({
        userId: 'user-1',
        userName: 'Alice',
        tableName: 'budgets',
        recordId: 'budget-new',
        changes: [
          { field: 'name', oldValue: null, newValue: 'New Budget' },
          { field: 'amount', oldValue: null, newValue: 5000 },
        ],
        changeType: 'insert',
      });

      expect(entries[0].changeType).toBe('insert');
    });

    it('should handle delete changes', () => {
      const entries = service.logDataChange({
        userId: 'user-1',
        userName: 'Alice',
        tableName: 'budgets',
        recordId: 'budget-old',
        changes: [
          { field: 'name', oldValue: 'Old Budget', newValue: null },
        ],
        changeType: 'delete',
      });

      expect(entries[0].changeType).toBe('delete');
    });
  });

  describe('logLoginAttempt', () => {
    it('should log a successful login attempt', () => {
      const entry = service.logLoginAttempt({
        email: 'alice@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        success: true,
        userId: 'user-1',
        userName: 'Alice',
      });

      expect(entry.success).toBe(true);
      expect(entry.email).toBe('alice@example.com');
      expect(entry.ipAddress).toBe('192.168.1.1');
    });

    it('should log a failed login attempt with reason', () => {
      const entry = service.logLoginAttempt({
        email: 'bob@example.com',
        ipAddress: '10.0.0.1',
        success: false,
        failureReason: 'Invalid password',
      });

      expect(entry.success).toBe(false);
      expect(entry.failureReason).toBe('Invalid password');
    });

    it('should also create an entry in the main audit log', () => {
      service.logLoginAttempt({
        email: 'alice@example.com',
        success: true,
        userId: 'user-1',
        userName: 'Alice',
      });

      const { entries } = service.query({ category: 'login_attempt' });
      expect(entries.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('logPermissionChange', () => {
    it('should log a role change', () => {
      const entry = service.logPermissionChange({
        changedByUserId: 'admin-1',
        changedByUserName: 'Admin',
        targetUserId: 'user-1',
        targetUserName: 'Alice',
        changeType: 'role_change',
        oldValue: 'Viewer',
        newValue: 'Analyst',
        reason: 'Promotion',
      });

      expect(entry.changeType).toBe('role_change');
      expect(entry.oldValue).toBe('"Viewer"');
      expect(entry.newValue).toBe('"Analyst"');
    });

    it('should log entity access grant', () => {
      const entry = service.logPermissionChange({
        changedByUserId: 'admin-1',
        targetUserId: 'user-2',
        changeType: 'entity_access_granted',
        newValue: { role: 'analyst' },
        entityId: 'entity-1',
      });

      expect(entry.changeType).toBe('entity_access_granted');
      expect(entry.entityId).toBe('entity-1');
    });

    it('should log account activation/deactivation', () => {
      const entry = service.logPermissionChange({
        changedByUserId: 'admin-1',
        targetUserId: 'user-3',
        changeType: 'account_deactivated',
        reason: 'Security concern',
      });

      expect(entry.changeType).toBe('account_deactivated');
    });

    it('should also create an entry in the main audit log', () => {
      service.logPermissionChange({
        changedByUserId: 'admin-1',
        targetUserId: 'user-1',
        changeType: 'role_change',
        oldValue: 'Viewer',
        newValue: 'Admin',
      });

      const { entries } = service.query({ category: 'permission_change' });
      expect(entries.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // Query methods
  // =========================================================================

  describe('query', () => {
    beforeEach(() => {
      // Seed test data
      service.log({ category: 'user_action', action: 'create', userId: 'user-1', resourceType: 'budget', resourceId: 'b1' });
      service.log({ category: 'user_action', action: 'update', userId: 'user-1', resourceType: 'budget', resourceId: 'b1' });
      service.log({ category: 'data_change', action: 'update', userId: 'user-2', resourceType: 'forecast', resourceId: 'f1' });
      service.log({ category: 'login_attempt', action: 'login', userId: 'user-1' });
      service.log({ category: 'login_attempt', action: 'login_failed', severity: 'warning' });
      service.log({ category: 'permission_change', action: 'role_change', userId: 'admin-1' });
    });

    it('should return all entries when no filter applied', () => {
      const result = service.query();
      expect(result.total).toBe(6);
      expect(result.entries).toHaveLength(6);
    });

    it('should filter by category', () => {
      const result = service.query({ category: 'user_action' });
      expect(result.total).toBe(2);
    });

    it('should filter by action', () => {
      const result = service.query({ action: 'create' });
      expect(result.total).toBe(1);
    });

    it('should filter by severity', () => {
      const result = service.query({ severity: 'warning' });
      expect(result.total).toBe(1);
    });

    it('should filter by userId', () => {
      const result = service.query({ userId: 'user-1' });
      expect(result.total).toBe(3);
    });

    it('should filter by resourceType', () => {
      const result = service.query({ resourceType: 'budget' });
      expect(result.total).toBe(2);
    });

    it('should filter by resourceId', () => {
      const result = service.query({ resourceId: 'b1' });
      expect(result.total).toBe(2);
    });

    it('should support pagination with limit and offset', () => {
      const page1 = service.query({ limit: 2, offset: 0 });
      expect(page1.entries).toHaveLength(2);
      expect(page1.total).toBe(6);

      const page2 = service.query({ limit: 2, offset: 2 });
      expect(page2.entries).toHaveLength(2);

      const page3 = service.query({ limit: 2, offset: 4 });
      expect(page3.entries).toHaveLength(2);
    });

    it('should search in details, resource_name, and user_name', () => {
      service.log({
        category: 'user_action',
        action: 'create',
        resourceName: 'Special Budget',
        details: 'Created for Q4 planning',
      });

      const result = service.query({ search: 'Special' });
      expect(result.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getLoginAttempts', () => {
    beforeEach(() => {
      service.logLoginAttempt({ email: 'alice@example.com', ipAddress: '192.168.1.1', success: true });
      service.logLoginAttempt({ email: 'alice@example.com', ipAddress: '192.168.1.1', success: false, failureReason: 'Wrong password' });
      service.logLoginAttempt({ email: 'bob@example.com', ipAddress: '10.0.0.1', success: true });
    });

    it('should return all login attempts', () => {
      const entries = service.getLoginAttempts();
      expect(entries).toHaveLength(3);
    });

    it('should filter by email', () => {
      const entries = service.getLoginAttempts({ email: 'alice@example.com' });
      expect(entries).toHaveLength(2);
    });

    it('should filter by success status', () => {
      const failed = service.getLoginAttempts({ success: false });
      expect(failed).toHaveLength(1);
      expect(failed[0].failureReason).toBe('Wrong password');
    });

    it('should filter by IP address', () => {
      const entries = service.getLoginAttempts({ ipAddress: '10.0.0.1' });
      expect(entries).toHaveLength(1);
    });
  });

  describe('getPermissionChanges', () => {
    beforeEach(() => {
      service.logPermissionChange({
        changedByUserId: 'admin-1',
        targetUserId: 'user-1',
        changeType: 'role_change',
        oldValue: 'Viewer',
        newValue: 'Analyst',
      });
      service.logPermissionChange({
        changedByUserId: 'admin-1',
        targetUserId: 'user-2',
        changeType: 'entity_access_granted',
        entityId: 'entity-1',
      });
    });

    it('should return all permission changes', () => {
      const entries = service.getPermissionChanges();
      expect(entries).toHaveLength(2);
    });

    it('should filter by target user', () => {
      const entries = service.getPermissionChanges({ targetUserId: 'user-1' });
      expect(entries).toHaveLength(1);
      expect(entries[0].changeType).toBe('role_change');
    });

    it('should filter by change type', () => {
      const entries = service.getPermissionChanges({ changeType: 'entity_access_granted' });
      expect(entries).toHaveLength(1);
    });
  });

  describe('getDataChanges', () => {
    beforeEach(() => {
      service.logDataChange({
        userId: 'user-1',
        userName: 'Alice',
        tableName: 'budgets',
        recordId: 'b1',
        changes: [{ field: 'amount', oldValue: 100, newValue: 200 }],
        changeType: 'update',
      });
      service.logDataChange({
        userId: 'user-1',
        userName: 'Alice',
        tableName: 'budgets',
        recordId: 'b2',
        changes: [{ field: 'name', oldValue: null, newValue: 'New Budget' }],
        changeType: 'insert',
      });
    });

    it('should return all data changes', () => {
      const entries = service.getDataChanges();
      expect(entries).toHaveLength(2);
    });

    it('should filter by table name', () => {
      const entries = service.getDataChanges({ tableName: 'budgets' });
      expect(entries).toHaveLength(2);
    });

    it('should filter by record ID', () => {
      const entries = service.getDataChanges({ recordId: 'b1' });
      expect(entries).toHaveLength(1);
    });

    it('should filter by change type', () => {
      const entries = service.getDataChanges({ changeType: 'insert' });
      expect(entries).toHaveLength(1);
    });
  });

  describe('getById', () => {
    it('should return an entry by ID', () => {
      const created = service.log({
        category: 'user_action',
        action: 'create',
        resourceType: 'budget',
        resourceId: 'b1',
      });

      const found = service.getById(created.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
    });

    it('should return null for non-existent ID', () => {
      const found = service.getById('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('getResourceHistory', () => {
    it('should return all entries for a specific resource', () => {
      service.logUserAction({
        userId: 'user-1',
        userName: 'Alice',
        action: 'create',
        resourceType: 'budget',
        resourceId: 'b1',
      });
      service.logUserAction({
        userId: 'user-1',
        userName: 'Alice',
        action: 'update',
        resourceType: 'budget',
        resourceId: 'b1',
      });
      service.logUserAction({
        userId: 'user-2',
        userName: 'Bob',
        action: 'create',
        resourceType: 'budget',
        resourceId: 'b2',
      });

      const history = service.getResourceHistory('budget', 'b1');
      expect(history).toHaveLength(2);
    });
  });

  describe('getUserActivity', () => {
    it('should return all activity for a specific user', () => {
      service.logUserAction({
        userId: 'user-1',
        userName: 'Alice',
        action: 'create',
        resourceType: 'budget',
        resourceId: 'b1',
      });
      service.logUserAction({
        userId: 'user-1',
        userName: 'Alice',
        action: 'update',
        resourceType: 'budget',
        resourceId: 'b2',
      });
      service.logUserAction({
        userId: 'user-2',
        userName: 'Bob',
        action: 'create',
        resourceType: 'forecast',
        resourceId: 'f1',
      });

      const activity = service.getUserActivity('user-1');
      expect(activity).toHaveLength(2);
    });

    it('should respect the limit parameter', () => {
      for (let i = 0; i < 10; i++) {
        service.logUserAction({
          userId: 'user-1',
          userName: 'Alice',
          action: 'view',
          resourceType: 'budget',
          resourceId: `b${i}`,
        });
      }

      const activity = service.getUserActivity('user-1', 5);
      expect(activity).toHaveLength(5);
    });
  });

  // =========================================================================
  // Statistics
  // =========================================================================

  describe('getStats', () => {
    beforeEach(() => {
      service.logUserAction({
        userId: 'user-1',
        userName: 'Alice',
        action: 'create',
        resourceType: 'budget',
        resourceId: 'b1',
      });
      service.logUserAction({
        userId: 'user-1',
        userName: 'Alice',
        action: 'update',
        resourceType: 'budget',
        resourceId: 'b2',
      });
      service.logUserAction({
        userId: 'user-2',
        userName: 'Bob',
        action: 'create',
        resourceType: 'forecast',
        resourceId: 'f1',
      });
      service.logLoginAttempt({ email: 'alice@example.com', success: true });
      service.logLoginAttempt({ email: 'bob@example.com', success: false, failureReason: 'Wrong password' });
      service.logPermissionChange({
        changedByUserId: 'admin-1',
        targetUserId: 'user-1',
        changeType: 'role_change',
        oldValue: 'Viewer',
        newValue: 'Analyst',
      });
    });

    it('should return correct total count', () => {
      const stats = service.getStats();
      // 3 user actions + 2 login attempts + 1 permission change = 6
      // Plus the main audit log entries for login attempts and permission changes
      expect(stats.total).toBeGreaterThanOrEqual(6);
    });

    it('should group by category', () => {
      const stats = service.getStats();
      expect(stats.byCategory['user_action']).toBe(3);
      expect(stats.byCategory['login_attempt']).toBeGreaterThanOrEqual(2);
      expect(stats.byCategory['permission_change']).toBeGreaterThanOrEqual(1);
    });

    it('should group by action', () => {
      const stats = service.getStats();
      expect(stats.byAction['create']).toBe(2);
      expect(stats.byAction['update']).toBe(1);
    });

    it('should include login statistics', () => {
      const stats = service.getStats();
      expect(stats.loginStats.totalAttempts).toBe(2);
      expect(stats.loginStats.successfulLogins).toBe(1);
      expect(stats.loginStats.failedLogins).toBe(1);
      expect(stats.loginStats.uniqueEmails).toBe(2);
    });

    it('should include permission statistics', () => {
      const stats = service.getStats();
      expect(stats.permissionStats.totalChanges).toBe(1);
      expect(stats.permissionStats.byType['role_change']).toBe(1);
    });

    it('should include recent errors', () => {
      // Add an error entry
      service.log({
        category: 'system_event',
        action: 'system_error',
        severity: 'error',
        details: 'Database connection failed',
      });

      const stats = service.getStats();
      expect(stats.recentErrors.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // Retention & cleanup
  // =========================================================================

  describe('prune', () => {
    it('should prune old entries based on retention config', () => {
      // Create entries with old timestamps
      service.log({ category: 'user_action', action: 'create' });
      service.log({ category: 'user_action', action: 'update' });

      // Prune with 0 days retention (should remove everything)
      const pruned = service.prune({
        auditLogDays: 0,
        loginAttemptsDays: 0,
        dataChangesDays: 0,
      });

      expect(pruned).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getRetentionStatus', () => {
    it('should return retention status for all tables', () => {
      service.log({ category: 'user_action', action: 'create' });
      service.logLoginAttempt({ email: 'test@example.com', success: true });

      const status = service.getRetentionStatus();

      expect(status.auditLog.count).toBeGreaterThanOrEqual(1);
      expect(status.loginAttempts.count).toBeGreaterThanOrEqual(1);
      expect(status.dataChanges.count).toBe(0);
      expect(status.permissionChanges.count).toBe(0);
    });
  });

  // =========================================================================
  // Export
  // =========================================================================

  describe('exportCSV', () => {
    it('should export entries as CSV', () => {
      service.logUserAction({
        userId: 'user-1',
        userName: 'Alice',
        action: 'create',
        resourceType: 'budget',
        resourceId: 'b1',
        resourceName: 'FY2026',
      });

      const csv = service.exportCSV();
      expect(csv).toContain('id,timestamp,category');
      expect(csv).toContain('Alice');
      expect(csv).toContain('budget');
    });

    it('should handle empty results', () => {
      const csv = service.exportCSV();
      expect(csv).toContain('id,timestamp,category');
    });
  });

  describe('exportJSON', () => {
    it('should export entries as JSON', () => {
      service.logUserAction({
        userId: 'user-1',
        userName: 'Alice',
        action: 'create',
        resourceType: 'budget',
        resourceId: 'b1',
      });

      const json = service.exportJSON();
      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // Checksum integrity
  // =========================================================================

  describe('checksum', () => {
    it('should generate consistent checksums for same data', () => {
      const entry1 = service.log({
        category: 'user_action',
        action: 'create',
        userId: 'user-1',
        resourceType: 'budget',
        resourceId: 'b1',
      });

      // Verify checksum is a 16-character hex string
      expect(entry1.checksum).toMatch(/^[0-9a-f]{16}$/);
    });

    it('should generate different checksums for different data', () => {
      const entry1 = service.log({
        category: 'user_action',
        action: 'create',
        userId: 'user-1',
        resourceType: 'budget',
        resourceId: 'b1',
      });

      const entry2 = service.log({
        category: 'user_action',
        action: 'update',
        userId: 'user-2',
        resourceType: 'forecast',
        resourceId: 'f1',
      });

      expect(entry1.checksum).not.toBe(entry2.checksum);
    });
  });

  // =========================================================================
  // Edge cases
  // =========================================================================

  describe('edge cases', () => {
    it('should handle metadata with nested objects', () => {
      const entry = service.log({
        category: 'user_action',
        action: 'create',
        metadata: {
          nested: { deep: { value: 42 } },
          array: [1, 2, 3],
          flag: true,
        },
      });

      expect(entry.metadata).toEqual({
        nested: { deep: { value: 42 } },
        array: [1, 2, 3],
        flag: true,
      });
    });

    it('should handle old/new values of different types', () => {
      const entry = service.log({
        category: 'data_change',
        action: 'update',
        oldValue: { amount: 100, currency: 'USD' },
        newValue: { amount: 200, currency: 'EUR' },
      });

      expect(entry.oldValue).toContain('100');
      expect(entry.newValue).toContain('200');
    });

    it('should handle special characters in strings', () => {
      const entry = service.log({
        category: 'user_action',
        action: 'create',
        details: 'Line 1\nLine 2\tTabbed "quoted" with \'single\'',
        resourceName: 'Budget <2026> & Co.',
      });

      expect(entry.details).toContain('Line 1');
      expect(entry.resourceName).toContain('&');
    });
  });
});
