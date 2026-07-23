import { describe, it, expect, beforeEach } from 'vitest';
import { useGLStore } from './glStore';

describe('Phase 1 GL Smoke', () => {
  beforeEach(() => {
    useGLStore.setState({ entries: [], importStatus: 'idle', importProgress: 0, lastImportEntryIds: [] });
  });

  it('validateEntries works', () => {
    const store = useGLStore.getState();
    const res = store.validateEntries([{ accountCode: '4000', date: '2026-01-01', debit: 100 }]);
    expect(res.isValid).toBe(true);
  });

  it('importGLData imports cleanly', () => {
    const store = useGLStore.getState();
    const result = store.importGLData([
      { accountCode: '4100', date: '2026-01-15', debit: 500, credit: 0 }
    ], 'test.csv');

    expect(result.success).toBe(true);
    expect(useGLStore.getState().entries.length).toBeGreaterThan(0);
  });
});
