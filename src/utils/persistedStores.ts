/**
 * Registry of every persisted store key (F-0010).
 *
 * The backup feature previously read a DIFFERENT database from the one the app
 * writes to: `BackupRestore` enumerated an IndexedDB object store, while all 36
 * Zustand stores persist through `masterStorage` (sql.js in the browser, Tauri
 * SQLite on desktop). A user who clicked "Export Backup" received a file
 * containing none of their financial data, and the export reported success.
 *
 * `masterStorage` is a key/value façade with no key enumeration, so backup needs
 * an explicit list. An explicit list can drift, so
 * src/utils/backupRestore.test.ts cross-checks this registry against every
 * `name:` passed to zustand `persist()` in src/store and fails if they diverge
 * in either direction.
 */

/**
 * Persist keys, exactly as passed to zustand's `persist({ name })`.
 * Keep alphabetically sorted.
 */
export const PERSISTED_STORE_KEYS: readonly string[] = [
  'analytics-store',
  'audit-trail-store',
  'auth-store',
  'budget-store',
  'capex-store',
  'cell-lineage-store',
  'collaboration-store',
  'construction-store',
  'cube-store',
  'dashboard-store',
  'data-store',
  'debt-store',
  'driver-store',
  'education-store',
  'energy-store',
  'entity-store',
  'esg-store',
  'forecast-store',
  'fx-rate-store',
  'gl-store',
  'gl-trialbalance-store',
  'gl-upload-store',
  'government-store',
  'healthcare-store',
  'insurance-store',
  'lease-store',
  'logistics-store',
  'notification-store',
  'period-close-store',
  'realestate-store',
  'report-store',
  'retail-store',
  'scenario-store',
  'settings-store',
  'telecom-store',
  'tour-store',
  'ui-store',
  'variance-store',
  'workflow-store',
  'workforce-store',
] as const;

/**
 * Keys that must NEVER be written into a backup file.
 *
 * `auth-store` holds the session and, on restore into a different install,
 * would either grant a stale session or clobber the operator's own. Restores
 * therefore preserve the current session rather than importing one.
 */
export const BACKUP_EXCLUDED_KEYS: readonly string[] = ['auth-store'];

/** Keys actually written to, and restored from, a backup file. */
export const BACKUP_STORE_KEYS: readonly string[] = PERSISTED_STORE_KEYS.filter(
  (key) => !BACKUP_EXCLUDED_KEYS.includes(key)
);
