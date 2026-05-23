/**
 * IndexedDB Bulk Operations
 * Chunked read/write patterns for large datasets.
 * Transactional batch across multiple tables.
 */

import { openDB } from './indexedDBStorage';

export interface BulkOp {
  table: string;
  type: 'put' | 'delete';
  data?: unknown;
  key?: string;
}

const DEFAULT_CHUNK = 2000;

export class BulkOperations {
  /**
   * Bulk put with chunking. Writes records in batches to avoid quota issues.
   */
  static async bulkPut(
    table: string,
    records: unknown[],
    chunkSize = DEFAULT_CHUNK
  ): Promise<void> {
    const db = await openDB();
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(table, 'readwrite');
        const store = tx.objectStore(table);
        for (const record of chunk) {
          store.put(record);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
  }

  /**
   * Bulk get by IDs. Returns records in order requested.
   */
  static async bulkGet(table: string, ids: string[]): Promise<unknown[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(table, 'readonly');
      const store = tx.objectStore(table);
      const results: unknown[] = [];
      let completed = 0;

      for (const id of ids) {
        const req = store.get(id);
        req.onsuccess = () => {
          results.push(req.result);
          completed++;
          if (completed === ids.length) resolve(results);
        };
        req.onerror = () => {
          results.push(null);
          completed++;
          if (completed === ids.length) resolve(results);
        };
      }

      if (ids.length === 0) resolve([]);
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Transactional batch across multiple tables. All-or-nothing.
   */
  static async transactionalBatch(operations: BulkOp[]): Promise<void> {
    if (operations.length === 0) return;

    const db = await openDB();
    const tableNames = [...new Set(operations.map((op) => op.table))];

    return new Promise((resolve, reject) => {
      const tx = db.transaction(tableNames, 'readwrite');

      for (const op of operations) {
        const store = tx.objectStore(op.table);
        if (op.type === 'put' && op.data) {
          store.put(op.data);
        } else if (op.type === 'delete' && op.key) {
          store.delete(op.key);
        }
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Cleanup old records. Returns count of deleted records.
   */
  static async cleanupOldData(table: string, retentionDays: number): Promise<number> {
    const db = await openDB();
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    let deleted = 0;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(table, 'readwrite');
      const store = tx.objectStore(table);
      const req = store.openCursor();

      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) return;
        const record = cursor.value;
        const timestamp = record._importedAt || record.timestamp || record.createdAt || 0;
        if (timestamp < cutoff) {
          cursor.delete();
          deleted++;
        }
        cursor.continue();
      };

      tx.oncomplete = () => resolve(deleted);
      tx.onerror = () => reject(tx.error);
    });
  }
}
