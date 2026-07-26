import { openDB } from './indexedDBStorage';

export interface BackupData {
  metadata: {
    appVersion: string;
    exportedAt: string;
    storeCounts: Record<string, number>;
    checksum: string;
  };
  data: Record<string, unknown>;
}

export interface BackupIntegrityResult {
  ok: boolean;
  checkedAt: string;
  stores: {
    stores: number;
    backups: number;
    metadata: number;
  };
  errors: string[];
  warnings: string[];
}

async function computeChecksum(data: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `fallback-${Math.abs(hash).toString(16)}`;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

async function countStore(db: IDBDatabase, storeName: string): Promise<number> {
  if (!db.objectStoreNames.contains(storeName)) return 0;
  const tx = db.transaction(storeName, 'readonly');
  return requestToPromise(tx.objectStore(storeName).count());
}

export class BackupRestore {
  static async createBackupData(): Promise<BackupData> {
    const db = await openDB();
    const tx = db.transaction('stores', 'readonly');
    const items = await requestToPromise(tx.objectStore('stores').getAll());
    await transactionDone(tx);

    const data: Record<string, unknown> = {};
    const storeCounts: Record<string, number> = {};
    for (const item of items as Array<{ id: string; value: unknown }>) {
      data[item.id] = item.value;
      storeCounts[item.id] = Array.isArray(item.value) ? item.value.length : 1;
    }

    const dataStr = JSON.stringify(data);
    const checksum = await computeChecksum(dataStr);
    return {
      metadata: {
        appVersion: '1.0.0',
        exportedAt: new Date().toISOString(),
        storeCounts,
        checksum,
      },
      data,
    };
  }

  static async exportBackup(): Promise<BackupData> {
    const backup = await BackupRestore.createBackupData();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finplan-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return backup;
  }

  static async importBackup(file: File): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    try {
      const text = await file.text();
      const backup = JSON.parse(text) as BackupData;
      if (!backup.metadata || !backup.data) {
        return { success: false, errors: ['Invalid backup format: missing metadata or data'] };
      }

      if (backup.metadata.checksum) {
        const dataStr = JSON.stringify(backup.data);
        const computedChecksum = await computeChecksum(dataStr);
        if (computedChecksum !== backup.metadata.checksum) {
          return {
            success: false,
            errors: [
              'Backup integrity check failed: checksum mismatch. File may be corrupted or tampered with.',
            ],
          };
        }
      } else {
        errors.push('Warning: Backup has no integrity checksum. Data may be unverified.');
      }

      const db = await openDB();
      const tx = db.transaction('stores', 'readwrite');
      for (const [key, value] of Object.entries(backup.data)) {
        tx.objectStore('stores').put({ id: key, value });
      }
      await transactionDone(tx);
      return { success: true, errors };
    } catch (e) {
      return { success: false, errors: [`Failed to parse backup: ${e}`] };
    }
  }

  static async checkIntegrity(): Promise<BackupIntegrityResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const checkedAt = new Date().toISOString();

    try {
      const db = await openDB();
      const stores = await countStore(db, 'stores');
      const backups = await countStore(db, 'backups');
      const metadata = await countStore(db, 'metadata');

      if (!db.objectStoreNames.contains('stores'))
        errors.push('Missing required IndexedDB object store: stores');
      if (!db.objectStoreNames.contains('backups'))
        warnings.push('Missing optional IndexedDB object store: backups');
      if (!db.objectStoreNames.contains('metadata'))
        warnings.push('Missing optional IndexedDB object store: metadata');
      if (stores === 0) warnings.push('No persisted application stores were found.');

      return {
        ok: errors.length === 0,
        checkedAt,
        stores: { stores, backups, metadata },
        errors,
        warnings,
      };
    } catch (error) {
      return {
        ok: false,
        checkedAt,
        stores: { stores: 0, backups: 0, metadata: 0 },
        errors: [error instanceof Error ? error.message : String(error)],
        warnings,
      };
    }
  }
}
