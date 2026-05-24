import { describe, it, expect, vi } from 'vitest';

vi.mock('../indexedDBStorage', () => ({
  openDB: vi.fn().mockRejectedValue(new Error('IndexedDB not available')),
}));

describe('BulkOperations', () => {
  it('exports the module', async () => {
    const mod = await import('../bulkOperations');
    expect(mod.BulkOperations).toBeDefined();
    expect(mod.BulkOperations.bulkPut).toBeDefined();
    expect(mod.BulkOperations.bulkGet).toBeDefined();
    expect(mod.BulkOperations.transactionalBatch).toBeDefined();
    expect(mod.BulkOperations.cleanupOldData).toBeDefined();
  });
});
