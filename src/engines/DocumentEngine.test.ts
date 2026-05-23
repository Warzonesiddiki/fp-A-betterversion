import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentEngine, type FinanceDocument } from './DocumentEngine';

describe('DocumentEngine', () => {
  let engine: DocumentEngine;

  beforeEach(() => {
    engine = new DocumentEngine();
  });

  const doc: FinanceDocument = {
    id: 'doc-1',
    name: 'Budget 2024',
    type: 'budget',
    content: { revenue: 100000, cost: 80000 },
  };

  describe('createVersion', () => {
    it('should create version 1 for new document', () => {
      const version = engine.createVersion(doc, 'Alice');
      expect(version.version).toBe(1);
      expect(version.createdBy).toBe('Alice');
    });

    it('should increment version number', () => {
      engine.createVersion(doc, 'Alice');
      const v2 = engine.createVersion(doc, 'Bob');
      expect(v2.version).toBe(2);
    });

    it('should deep-clone content', () => {
      const version = engine.createVersion(doc, 'Alice');
      doc.content.revenue = 999999;
      expect(version.content.revenue).toBe(100000);
    });
  });

  describe('getVersionHistory', () => {
    it('should return versions sorted descending', () => {
      engine.createVersion(doc, 'Alice');
      engine.createVersion(doc, 'Bob');
      const history = engine.getVersionHistory('doc-1');
      expect(history).toHaveLength(2);
      expect(history[0].version).toBe(2);
    });

    it('should return empty for unknown document', () => {
      expect(engine.getVersionHistory('unknown')).toEqual([]);
    });
  });

  describe('compareVersions', () => {
    it('should detect differences between versions', () => {
      const doc2 = { ...doc, content: { revenue: 110000, cost: 85000 } };
      const v1 = engine.createVersion(doc, 'Alice');
      const v2 = engine.createVersion(doc2, 'Bob');
      const diff = engine.compareVersions(v1.id, v2.id);
      expect(diff.changeCount).toBeGreaterThan(0);
      expect(diff.version1).toBe(1);
      expect(diff.version2).toBe(2);
    });

    it('should return empty diff for unknown versions', () => {
      const diff = engine.compareVersions('unknown-1', 'unknown-2');
      expect(diff.changeCount).toBe(0);
    });
  });

  describe('signDocument', () => {
    it('should add signature to version', () => {
      const version = engine.createVersion(doc, 'Alice');
      engine.signDocument(version.id, 'Bob');
      const history = engine.getVersionHistory('doc-1');
      expect(history[0].signatures).toContain('Bob');
    });

    it('should not duplicate signatures', () => {
      const version = engine.createVersion(doc, 'Alice');
      engine.signDocument(version.id, 'Bob');
      engine.signDocument(version.id, 'Bob');
      const history = engine.getVersionHistory('doc-1');
      expect(history[0].signatures).toHaveLength(1);
    });
  });
});
