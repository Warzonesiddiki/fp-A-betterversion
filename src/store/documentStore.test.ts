import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentStore } from './documentStore';
import { actAs, expectPermissionDenied, signOut } from '@/test/rbacFixtures';

function resetStore() {
  // Merge mode (no replace flag) — actions must survive the reset.
  useDocumentStore.setState({ documents: [] });
}

beforeEach(() => {
  actAs('Admin');
  resetStore();
});

describe('documentStore', () => {
  it('addDocument stores a full metadata record and returns it', () => {
    const doc = useDocumentStore.getState().addDocument({
      name: '  Board pack August  ',
      category: 'report',
      size: 4096,
      mimeType: 'text/csv',
      tags: ['board', 'august'],
      entityId: 'entity-001',
      periodId: '2026-08',
      content: { source: 'upload' },
    });

    expect(useDocumentStore.getState().documents).toHaveLength(1);
    expect(doc.name).toBe('Board pack August');
    expect(doc.category).toBe('report');
    expect(doc.tags).toEqual(['board', 'august']);
    expect(doc.entityId).toBe('entity-001');
    expect(doc.periodId).toBe('2026-08');
    expect(doc.size).toBe(4096);
    expect(doc.mimeType).toBe('text/csv');
    expect(doc.contentRef).toEqual({ source: 'upload' });
    expect(doc.createdAt).toBe(doc.updatedAt);
  });

  it('rename/tag/link/remove round-trip mutates the record', () => {
    const doc = useDocumentStore.getState().addDocument({ name: 'Draft', category: 'forecast' });
    const s = useDocumentStore.getState();

    s.renameDocument(doc.id, 'Forecast v2');
    s.tagDocument(doc.id, 'q3');
    s.tagDocument(doc.id, 'q3'); // dedupe
    s.linkDocumentToEntity(doc.id, 'entity-002');
    s.linkDocumentToEntity(doc.id, null);

    let stored = useDocumentStore.getState().documents[0]!;
    expect(stored.name).toBe('Forecast v2');
    expect(stored.tags).toEqual(['q3']);
    expect(stored.entityId).toBeNull();
    expect(stored.updatedAt >= stored.createdAt).toBe(true);

    useDocumentStore.getState().removeDocument(doc.id);
    stored = useDocumentStore.getState().documents[0]!;
    expect(stored).toBeUndefined();
  });

  it('rejects invalid names and sizes', () => {
    const s = useDocumentStore.getState();
    expect(() => s.addDocument({ name: '   ', category: 'report' })).toThrow(
      'Document name must be a non-empty string'
    );
    expect(() => s.addDocument({ name: 'x'.repeat(201), category: 'report' })).toThrow(
      '200 characters or less'
    );
    expect(() => s.addDocument({ name: 'ok', category: 'report', size: -1 })).toThrow(
      'non-negative finite number'
    );
    expect(() => s.renameDocument('missing', '')).toThrow(
      'Document name must be a non-empty string'
    );
  });

  it('wires DocumentEngine versioning: initial snapshot + signing', () => {
    actAs('Admin', { id: 'test-user-admin' });
    const doc = useDocumentStore.getState().addDocument({
      name: 'Scenario pack',
      category: 'scenario',
      content: { growth: 0.05 },
    });

    const history = useDocumentStore.getState().getVersionHistory(doc.id);
    expect(history).toHaveLength(1);
    expect(history[0]!.version).toBe(1);
    expect(history[0]!.content).toEqual({ growth: 0.05 });
    expect(history[0]!.createdBy).toBe('test-user-admin');

    useDocumentStore.getState().signLatestVersion(doc.id);
    const signed = useDocumentStore.getState().getVersionHistory(doc.id)[0]!;
    expect(signed.signatures).toContain('test-user-admin');
  });

  describe('RBAC (real ROLE_PERMISSIONS matrix)', () => {
    it('Viewer cannot add documents', () => {
      actAs('Viewer');
      expectPermissionDenied(() =>
        useDocumentStore.getState().addDocument({ name: 'nope', category: 'report' })
      );
      expect(useDocumentStore.getState().documents).toHaveLength(0);
    });

    it('Analyst can add but cannot delete (import:delete is Admin-only)', () => {
      actAs('Analyst');
      const doc = useDocumentStore.getState().addDocument({ name: 'mine', category: 'budget' });
      expect(useDocumentStore.getState().documents).toHaveLength(1);

      expectPermissionDenied(() => useDocumentStore.getState().removeDocument(doc.id));
      expect(useDocumentStore.getState().documents).toHaveLength(1);
    });

    it('Department_Head is read-only: tagging and deleting are both denied', () => {
      actAs('Admin');
      const doc = useDocumentStore.getState().addDocument({ name: 'shared', category: 'budget' });
      actAs('Department_Head');

      expectPermissionDenied(() => useDocumentStore.getState().tagDocument(doc.id, 't1'));
      expectPermissionDenied(() => useDocumentStore.getState().removeDocument(doc.id));
      expect(useDocumentStore.getState().documents[0]!.tags).toEqual([]);
    });

    it('signed-out users are denied every write action', () => {
      signOut();
      const s = useDocumentStore.getState();
      expectPermissionDenied(() => s.addDocument({ name: 'x', category: 'report' }));
      expectPermissionDenied(() => s.removeDocument('doc-1'));
      expectPermissionDenied(() => s.renameDocument('doc-1', 'y'));
      expectPermissionDenied(() => s.tagDocument('doc-1', 't'));
      expectPermissionDenied(() => s.linkDocumentToEntity('doc-1', 'e1'));
    });
  });
});
