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

/**
 * Compute a simple SHA-256 hash of a string for integrity verification.
 */
async function computeChecksum(data: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback: simple hash for environments without crypto.subtle
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `fallback-${Math.abs(hash).toString(16)}`;
}

export class BackupRestore {
  static async exportBackup(): Promise<void> {
    const db = await openDB();
    const data: Record<string, unknown> = {};
    const storeCounts: Record<string, number> = {};
    const tx = db.transaction('stores', 'readonly');
    const req = tx.objectStore('stores').getAll();
    req.onsuccess = async () => {
      for (const item of req.result) {
        data[item.id] = item.value;
        storeCounts[item.id] = Array.isArray(item.value) ? item.value.length : 1;
      }
      const dataStr = JSON.stringify(data);
      const checksum = await computeChecksum(dataStr);
      const backup: BackupData = {
        metadata: {
          appVersion: '0.1.0',
          exportedAt: new Date().toISOString(),
          storeCounts,
          checksum,
        },
        data,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finplan-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };
  }

  static async importBackup(file: File): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    try {
      const text = await file.text();
      const backup = JSON.parse(text) as BackupData;
      if (!backup.metadata || !backup.data) {
        return { success: false, errors: ['Invalid backup format: missing metadata or data'] };
      }

      // Verify checksum integrity if present
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
      return new Promise((resolve) => {
        tx.oncomplete = () => resolve({ success: true, errors });
        tx.onerror = () => resolve({ success: false, errors: ['Database write failed'] });
      });
    } catch (e) {
      return { success: false, errors: [`Failed to parse backup: ${e}`] };
    }
  }
}
