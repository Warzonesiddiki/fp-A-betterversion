import { describe, it, expect, vi } from 'vitest';
import { BackupRestore } from '../backupRestore';

vi.mock('../indexedDBStorage', () => ({
  openDB: vi.fn().mockRejectedValue(new Error('IndexedDB not available')),
}));

describe('BackupRestore', () => {
  it('importBackup returns error for invalid JSON', async () => {
    const file = new File(['not json'], 'backup.json', { type: 'application/json' });
    const result = await BackupRestore.importBackup(file);
    expect(result.success).toBe(false);
    expect(result.errors.some((e: string) => e.includes('parse'))).toBe(true);
  });

  it('importBackup returns error for missing metadata', async () => {
    const file = new File(['{}'], 'backup.json', { type: 'application/json' });
    const result = await BackupRestore.importBackup(file);
    expect(result.success).toBe(false);
  });
});
