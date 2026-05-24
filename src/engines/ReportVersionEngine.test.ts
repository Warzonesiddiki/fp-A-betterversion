import { describe, it, expect, beforeEach } from 'vitest';
import { ReportVersionEngine } from './ReportVersionEngine';

describe('ReportVersionEngine', () => {
  let engine: ReportVersionEngine;

  beforeEach(() => {
    engine = new ReportVersionEngine();
  });

  const sampleData = {
    cells: { A1: 'Revenue', B1: '1000' },
    formatting: { bold: true },
    metadata: { title: 'Q1 Report' },
  };

  describe('commitVersion', () => {
    it('should commit a new version', () => {
      const version = engine.commitVersion(
        'report-1',
        'Initial version',
        'First commit',
        sampleData,
        'user@test.com'
      );
      expect(version.id).toBeDefined();
      expect(version.reportId).toBe('report-1');
      expect(version.name).toBe('Initial version');
    });

    it('should increment version numbers', () => {
      engine.commitVersion('report-1', 'v1', '', sampleData, 'user@test.com');
      const v2 = engine.commitVersion('report-1', 'v2', '', sampleData, 'user@test.com');
      expect(v2.version).toBe(2);
    });
  });

  describe('getVersion', () => {
    it('should get specific version', () => {
      const v1 = engine.commitVersion('report-1', 'v1', '', sampleData, 'user@test.com');
      const retrieved = engine.getVersion('report-1', 1);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(v1.id);
    });

    it('should return undefined for non-existent version', () => {
      expect(engine.getVersion('report-1', 999)).toBeUndefined();
    });
  });

  describe('getVersionHistory', () => {
    it('should return version history', () => {
      engine.commitVersion('report-1', 'v1', '', sampleData, 'user@test.com');
      engine.commitVersion('report-1', 'v2', '', sampleData, 'user@test.com');
      const history = engine.getVersionHistory('report-1');
      expect(history).toHaveLength(2);
      expect(history[0].version).toBe(1);
      expect(history[1].version).toBe(2);
    });

    it('should return empty for report with no versions', () => {
      expect(engine.getVersionHistory('nonexistent')).toEqual([]);
    });
  });

  describe('compareVersions', () => {
    it('should diff two versions', () => {
      engine.commitVersion(
        'report-1',
        'v1',
        '',
        { cells: { A1: 'Revenue', B1: '1000' } },
        'user@test.com'
      );
      engine.commitVersion(
        'report-1',
        'v2',
        '',
        { cells: { A1: 'Revenue', B1: '2000' } },
        'user@test.com'
      );
      const diff = engine.compareVersions('report-1', 1, 2);
      expect(diff).toBeDefined();
      expect(diff.modified).toBeDefined();
    });
  });

  describe('createBranch', () => {
    it('should create a branch', () => {
      engine.commitVersion('report-1', 'v1', '', sampleData, 'user@test.com');
      const branch = engine.createBranch('report-1', 'test-branch');
      expect(branch).not.toBeNull();
      expect(branch!.name).toBe('test-branch');
      expect(branch!.baseVersion).toBe(1);
    });
  });

  describe('mergeBranch', () => {
    it('should merge branch into main', () => {
      engine.commitVersion('report-1', 'v1', '', sampleData, 'user@test.com');
      const branch = engine.createBranch('report-1', 'test-branch');
      expect(branch).not.toBeNull();
      const branchVersion = engine.commitVersion(
        'report-1',
        'branch-v1',
        '',
        sampleData,
        'user@test.com'
      );
      const branchRef = engine.getBranches('report-1').find((b) => b.id === branch!.id);
      if (branchRef) branchRef.versions.push(branchVersion);
      const result = engine.mergeBranch('report-1', branchRef!.id);
      expect(result).not.toBeNull();
      expect(result!.reportId).toBe('report-1');
    });
  });
});
