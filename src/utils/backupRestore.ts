/**
 * Backup and restore (F-0010, KAV-12).
 *
 * ROOT-CAUSE HISTORY: the previous implementation read and wrote an IndexedDB
 * object store named 'stores'. The application does not persist there — all 36
 * Zustand stores go through `masterStorage` (sql.js in the browser, Tauri
 * SQLite on desktop). Backups therefore captured NOTHING of the user's ledger,
 * budgets, entities or FX rates, and still reported success. Restoring such a
 * file was a silent no-op. For a local-first financial product where the
 * backup file is the only disaster-recovery artefact, that is the most severe
 * class of data-integrity defect.
 *
 * This implementation reads and writes the SAME storage the application uses,
 * enumerates stores from an explicit registry that is test-locked against the
 * real `persist({ name })` calls, and verifies a SHA-256 checksum over
 * canonical JSON on both create and restore.
 *
 * Restore is atomic in effect: every store is validated and staged before any
 * write occurs, so a malformed file cannot leave the database half-restored.
 */
import { masterStorage } from './masterStorage';
import { BACKUP_STORE_KEYS, BACKUP_EXCLUDED_KEYS, PERSISTED_STORE_KEYS } from './persistedStores';
import { isTauri, tauriSqlStorage } from './tauriSqlStorage';
import { readEscrowRecord, type EscrowRecordV1 } from './keyEscrow';

/**
 * Bump when the on-disk backup shape changes incompatibly.
 *
 * v3 (2026-08-25): metadata optionally carries the key-escrow record
 * (scheme a — recovery code wrapping K_root) so an exported backup documents
 * which root key encrypted its payload and keeps the wrapped key available
 * off-device. v2 files remain fully readable (escrow field is simply absent).
 */
export const BACKUP_FORMAT_VERSION = 3;

/** Backup format versions this build reads without a version warning. */
const SUPPORTED_BACKUP_FORMAT_VERSIONS = [2, 3];

export interface EmergencyDumpEntry {
  key: string;
  value: string;
}

/**
 * Last-resort recovery artefact (F-B4-11). Raw backend bytes, NOT parsed or
 * decrypted through masterStorage — safe to produce even while the storage
 * layer that createBackupData depends on is failing.
 */
export interface RawEmergencyBackup {
  kind: 'finplan-emergency-dump';
  version: 1;
  capturedAt: string;
  entries: EmergencyDumpEntry[];
  errors: string[];
}

export interface BackupMetadata {
  /** Backup file format version, not the app version. */
  formatVersion: number;
  appVersion: string;
  exportedAt: string;
  /** Per-store payload byte length, for a quick human sanity check. */
  storeSizes: Record<string, number>;
  /** SHA-256 over the canonical JSON of `data`. */
  checksum: string;
  /**
   * v3: the enrolled key-escrow record (wrapped root storage key), if any.
   * Read from the RAW escrow store, never decrypted through masterStorage.
   * Restore does NOT auto-install it — it is archival/audit data.
   */
  escrow?: EscrowRecordV1 | null;
}

export interface BackupData {
  metadata: BackupMetadata;
  /** storeKey -> the persisted value, exactly as masterStorage returns it. */
  data: Record<string, unknown>;
}

export interface RestoreResult {
  success: boolean;
  restoredStores: string[];
  skippedStores: string[];
  errors: string[];
  warnings: string[];
}

export interface BackupIntegrityResult {
  ok: boolean;
  checkedAt: string;
  /** Store keys that hold data right now. */
  populatedStores: string[];
  /** Registered store keys that are currently empty. */
  emptyStores: string[];
  errors: string[];
  warnings: string[];
}

export class BackupIntegrityError extends Error {
  readonly expected: string;
  readonly actual: string;

  constructor(expected: string, actual: string) {
    super(
      'Backup integrity check failed: checksum mismatch. ' +
        'The file is corrupted or was modified after export. Restore aborted.'
    );
    this.name = 'BackupIntegrityError';
    this.expected = expected;
    this.actual = actual;
  }
}

/**
 * Deterministic JSON: object keys sorted at every level.
 *
 * `JSON.stringify` preserves insertion order, so two structurally identical
 * backups could hash differently and a valid file could be rejected as
 * corrupt. Canonicalisation makes the checksum a property of the DATA.
 */
export function canonicalJSON(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${canonicalJSON(v)}`);
  return `{${entries.join(',')}}`;
}

/** SHA-256 hex digest. Fails loudly if Web Crypto is unavailable. */
export async function computeChecksum(data: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    // The previous implementation silently fell back to a 32-bit djb2-style
    // hash, which is not collision-resistant and cannot detect tampering.
    // A backup whose integrity cannot be verified must not claim to be verified.
    throw new Error(
      'Cannot compute backup checksum: Web Crypto (crypto.subtle) is unavailable in this environment.'
    );
  }
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function isBackupData(value: unknown): value is BackupData {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<BackupData>;
  if (!candidate.metadata || typeof candidate.metadata !== 'object') return false;
  if (!candidate.data || typeof candidate.data !== 'object') return false;
  return typeof candidate.metadata.checksum === 'string';
}

export class BackupRestore {
  /**
   * Read every registered store from the live storage backend.
   * Stores with no data are omitted rather than written as null.
   */
  static async createBackupData(): Promise<BackupData> {
    const data: Record<string, unknown> = {};
    const storeSizes: Record<string, number> = {};

    for (const key of BACKUP_STORE_KEYS) {
      const value = await masterStorage.getItem(key);
      if (value === null || value === undefined) continue;
      data[key] = value;
      storeSizes[key] = canonicalJSON(value).length;
    }

    const checksum = await computeChecksum(canonicalJSON(data));

    return {
      metadata: {
        formatVersion: BACKUP_FORMAT_VERSION,
        appVersion: '1.0.0',
        exportedAt: new Date().toISOString(),
        storeSizes,
        checksum,
        escrow: readEscrowRecord(),
      },
      data,
    };
  }

  /** Serialize a backup to the JSON text written to disk. */
  static serialize(backup: BackupData): string {
    return JSON.stringify(backup, null, 2);
  }

  /** Create a backup and trigger a browser download. */
  static async exportBackup(): Promise<BackupData> {
    const backup = await BackupRestore.createBackupData();
    const blob = new Blob([BackupRestore.serialize(backup)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    try {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `finplan-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
      anchor.click();
    } finally {
      URL.revokeObjectURL(url);
    }
    return backup;
  }

  /**
   * Restore from parsed backup text.
   *
   * Validates format and checksum BEFORE writing anything, so a corrupt file
   * cannot partially overwrite good data.
   */
  static async restoreFromJSON(text: string): Promise<RestoreResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (cause) {
      return {
        success: false,
        restoredStores: [],
        skippedStores: [],
        errors: [`Failed to parse backup: ${cause instanceof Error ? cause.message : cause}`],
        warnings,
      };
    }

    if (!isBackupData(parsed)) {
      return {
        success: false,
        restoredStores: [],
        skippedStores: [],
        errors: ['Invalid backup format: missing metadata or data'],
        warnings,
      };
    }

    const backup = parsed;

    if (!SUPPORTED_BACKUP_FORMAT_VERSIONS.includes(backup.metadata.formatVersion)) {
      warnings.push(
        `Backup format version ${backup.metadata.formatVersion ?? 'unknown'} differs from the ` +
          `current version ${BACKUP_FORMAT_VERSION}. Restoring on a best-effort basis.`
      );
    } else if (backup.metadata.formatVersion < BACKUP_FORMAT_VERSION && backup.metadata.escrow) {
      // Defensive: v2 files cannot legitimately carry escrow metadata.
      warnings.push(
        'Backup declares a pre-v3 format but contains key-escrow metadata; ' +
          'the escrow record was ignored.'
      );
    }

    if (backup.metadata.escrow && backup.metadata.formatVersion === BACKUP_FORMAT_VERSION) {
      // Informational only: restore never auto-installs escrow records, so a
      // hostile backup cannot silently rebind this device's recovery target.
      warnings.push(
        `Backup contains a key-escrow record (keyId ${backup.metadata.escrow.keyId}). ` +
          'It is archived with the file; recovery enrollment on THIS device is unchanged.'
      );
    }

    // Integrity gate — fail closed before touching storage.
    const actual = await computeChecksum(canonicalJSON(backup.data));
    if (actual !== backup.metadata.checksum) {
      const error = new BackupIntegrityError(backup.metadata.checksum, actual);
      return {
        success: false,
        restoredStores: [],
        skippedStores: Object.keys(backup.data),
        errors: [error.message],
        warnings,
      };
    }

    // Stage: decide everything before writing anything.
    const staged: Array<[string, unknown]> = [];
    const skippedStores: string[] = [];
    for (const [key, value] of Object.entries(backup.data)) {
      if (BACKUP_EXCLUDED_KEYS.includes(key)) {
        skippedStores.push(key);
        warnings.push(`Skipped ${key}: session state is never restored from a backup.`);
        continue;
      }
      if (!BACKUP_STORE_KEYS.includes(key)) {
        skippedStores.push(key);
        warnings.push(`Skipped unknown store "${key}": not part of this application version.`);
        continue;
      }
      staged.push([key, value]);
    }

    const restoredStores: string[] = [];
    for (const [key, value] of staged) {
      try {
        await (masterStorage.setItem as (k: string, v: unknown) => Promise<void>)(key, value);
        restoredStores.push(key);
      } catch (cause) {
        // A write failure must be reported, never swallowed: the user would
        // otherwise believe a restore succeeded while a store is missing.
        errors.push(
          `Failed to restore ${key}: ${cause instanceof Error ? cause.message : String(cause)}`
        );
      }
    }

    return { success: errors.length === 0, restoredStores, skippedStores, errors, warnings };
  }

  /** Restore from an uploaded File. */
  static async importBackup(file: File): Promise<RestoreResult> {
    return BackupRestore.restoreFromJSON(await file.text());
  }

  /** Report which registered stores currently hold data. */
  static async checkIntegrity(): Promise<BackupIntegrityResult> {
    const checkedAt = new Date().toISOString();
    const populatedStores: string[] = [];
    const emptyStores: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const key of BACKUP_STORE_KEYS) {
      try {
        const value = await masterStorage.getItem(key);
        if (value === null || value === undefined) emptyStores.push(key);
        else populatedStores.push(key);
      } catch (cause) {
        errors.push(
          `Cannot read ${key}: ${cause instanceof Error ? cause.message : String(cause)}`
        );
      }
    }

    if (populatedStores.length === 0) {
      warnings.push('No persisted application data was found; a backup would be empty.');
    }

    return {
      ok: errors.length === 0,
      checkedAt,
      populatedStores,
      emptyStores,
      errors,
      warnings,
    };
  }
}

function describeEmergencyCause(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  return String(cause);
}

/**
 * F-B4-11 escape hatch for when masterStorage itself is failing.
 *
 * `createBackupData` reads THROUGH masterStorage, so a broken backend (failing
 * reads, decryption errors) also breaks the documented recovery path — the
 * banner told users to "export a backup now" with no way to do it. This dump
 * bypasses masterStorage entirely: no decryption, no parsing, no persist
 * envelope reconstruction. Whatever bytes are reachable are written out as-is;
 * a support engineer can reassemble them offline even without the app running.
 *
 * Browser backend: the whole sql.js database image lives in localStorage under
 * 'finplan-sqljs-db', alongside the device key ('finplan.storage-key.v1') and
 * any legacy/chunked leftovers — enumerating every localStorage entry captures
 * all of it raw. Desktop backend: each known store is read through the raw
 * tauriSqlStorage adapter (no decrypt), and per-key failures are collected
 * into `errors` instead of aborting the dump.
 *
 * Defensive by contract: this must never throw out of enumeration.
 */
export async function createRawEmergencyBackup(): Promise<RawEmergencyBackup> {
  const entries: EmergencyDumpEntry[] = [];
  const errors: string[] = [];

  const record = (key: string, value: unknown): void => {
    try {
      entries.push({
        key,
        value: typeof value === 'string' ? value : (JSON.stringify(value) ?? ''),
      });
    } catch (cause) {
      errors.push(`Failed to serialize "${key}": ${describeEmergencyCause(cause)}`);
    }
  };

  try {
    if (typeof localStorage !== 'undefined' && localStorage !== null) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key === null) continue;
        try {
          record(key, localStorage.getItem(key));
        } catch (cause) {
          errors.push(`Failed to read localStorage key "${key}": ${describeEmergencyCause(cause)}`);
        }
      }
    } else {
      errors.push('localStorage is unavailable in this environment.');
    }
  } catch (cause) {
    errors.push(`localStorage enumeration failed: ${describeEmergencyCause(cause)}`);
  }

  try {
    if (await isTauri()) {
      for (const key of PERSISTED_STORE_KEYS) {
        try {
          const value = await tauriSqlStorage.getItem(key);
          if (value !== null && value !== undefined) {
            record(`sqlite:stores/${key}`, value);
          }
        } catch (cause) {
          errors.push(`Failed to read SQLite store "${key}": ${describeEmergencyCause(cause)}`);
        }
      }
    }
  } catch (cause) {
    errors.push(`Desktop SQLite enumeration failed: ${describeEmergencyCause(cause)}`);
  }

  if (entries.length === 0 && errors.length === 0) {
    errors.push('No storage entries were found to dump.');
  }

  return {
    kind: 'finplan-emergency-dump',
    version: 1,
    capturedAt: new Date().toISOString(),
    entries,
    errors,
  };
}

/** Create a raw emergency dump and trigger a browser download. */
export async function downloadRawEmergencyBackup(): Promise<RawEmergencyBackup> {
  const dump = await createRawEmergencyBackup();
  const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `finplan-emergency-dump-${new Date().toISOString().split('T')[0]}.json`;
    anchor.click();
  } finally {
    URL.revokeObjectURL(url);
  }
  return dump;
}
