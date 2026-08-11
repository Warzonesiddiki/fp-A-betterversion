import { db } from './connection.js';
import type { SqliteDdl } from './schema.js';

/**
 * Creates all audit-related tables and indexes.
 * Called during server startup migrations.
 */
export function createAuditTables(db: SqliteDdl): void {
  db.exec(`
    -- =============================================================================
    -- AUDIT LOG — Unified audit trail for all system events
    -- Tracks: user actions, data changes, login attempts, permission changes
    -- SOX compliance: 7-year retention, immutable entries
    -- =============================================================================

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      category TEXT NOT NULL CHECK (category IN (
        'user_action', 'data_change', 'login_attempt', 'permission_change', 'system_event'
      )),
      action TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),

      -- Actor (who performed the action)
      user_id TEXT,
      user_name TEXT,
      user_role TEXT,
      ip_address TEXT,
      user_agent TEXT,
      session_id TEXT,

      -- Target (what was acted upon)
      resource_type TEXT,
      resource_id TEXT,
      resource_name TEXT,

      -- Change tracking
      old_value TEXT,
      new_value TEXT,
      change_summary TEXT,

      -- Context
      details TEXT,
      metadata TEXT,
      request_method TEXT,
      request_path TEXT,
      response_status INTEGER,
      duration_ms INTEGER,

      -- Immutability & integrity
      checksum TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Performance indexes for common query patterns
    CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_log_category ON audit_log(category);
    CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
    CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_severity ON audit_log(severity);
    CREATE INDEX IF NOT EXISTS idx_audit_log_session ON audit_log(session_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_category_timestamp ON audit_log(category, timestamp);

    -- =============================================================================
    -- LOGIN ATTEMPTS — Dedicated table for brute-force detection
    -- =============================================================================

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
    CREATE INDEX IF NOT EXISTS idx_audit_login_ip ON audit_login_attempts(ip_address, attempted_at);

    -- =============================================================================
    -- PERMISSION CHANGES — Dedicated table for role/permission audit
    -- =============================================================================

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

    CREATE INDEX IF NOT EXISTS idx_audit_perm_target ON audit_permission_changes(target_user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_perm_actor ON audit_permission_changes(changed_by_user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_perm_timestamp ON audit_permission_changes(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_perm_type ON audit_permission_changes(change_type);

    -- =============================================================================
    -- DATA CHANGE HISTORY — Dedicated table for field-level change tracking
    -- =============================================================================

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
    CREATE INDEX IF NOT EXISTS idx_audit_data_user ON audit_data_changes(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_data_timestamp ON audit_data_changes(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_data_transaction ON audit_data_changes(transaction_id);
  `);
}
