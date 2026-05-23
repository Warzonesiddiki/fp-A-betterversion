import { describe, it, expect, beforeEach } from 'vitest';
import { DataGovernanceEngine, type DataAsset } from './DataGovernanceEngine';

describe('DataGovernanceEngine', () => {
  let engine: DataGovernanceEngine;

  beforeEach(() => {
    engine = new DataGovernanceEngine();
  });

  it('should add and retrieve assets', () => {
    engine.addAsset({
      id: 'a1',
      name: 'Revenue Table',
      type: 'table',
      source: 'GL',
      owner: 'CFO',
      sensitivity: 'confidential',
      tags: ['finance'],
      description: 'Revenue data',
      lastUpdated: new Date().toISOString(),
    });
    expect(engine.getAsset('a1')?.name).toBe('Revenue Table');
  });

  it('should search assets', () => {
    engine.addAsset({
      id: 'a1',
      name: 'Revenue Table',
      type: 'table',
      source: 'GL',
      owner: 'CFO',
      sensitivity: 'confidential',
      tags: ['finance'],
      description: 'Revenue data',
      lastUpdated: new Date().toISOString(),
    });
    engine.addAsset({
      id: 'a2',
      name: 'Expense Report',
      type: 'report',
      source: 'Budget',
      owner: 'Controller',
      sensitivity: 'internal',
      tags: ['expense'],
      description: 'Expense report',
      lastUpdated: new Date().toISOString(),
    });
    expect(engine.searchAssets('revenue')).toHaveLength(1);
    expect(engine.searchAssets('expense')).toHaveLength(1);
  });

  it('should filter by owner', () => {
    engine.addAsset({
      id: 'a1',
      name: 'A',
      type: 'table',
      source: 'GL',
      owner: 'CFO',
      sensitivity: 'public',
      tags: [],
      description: '',
      lastUpdated: new Date().toISOString(),
    });
    engine.addAsset({
      id: 'a2',
      name: 'B',
      type: 'table',
      source: 'GL',
      owner: 'Controller',
      sensitivity: 'public',
      tags: [],
      description: '',
      lastUpdated: new Date().toISOString(),
    });
    expect(engine.getAssetsByOwner('CFO')).toHaveLength(1);
  });

  it('should classify assets', () => {
    engine.addAsset({
      id: 'a1',
      name: 'A',
      type: 'table',
      source: 'GL',
      owner: 'CFO',
      sensitivity: 'public',
      tags: [],
      description: '',
      lastUpdated: new Date().toISOString(),
    });
    engine.classifyAsset('a1', 'restricted');
    expect(engine.getAsset('a1')?.sensitivity).toBe('restricted');
  });

  it('should tag and untag assets', () => {
    engine.addAsset({
      id: 'a1',
      name: 'A',
      type: 'table',
      source: 'GL',
      owner: 'CFO',
      sensitivity: 'public',
      tags: [],
      description: '',
      lastUpdated: new Date().toISOString(),
    });
    engine.tagAsset('a1', 'finance');
    expect(engine.getAsset('a1')?.tags).toContain('finance');
    engine.untagAsset('a1', 'finance');
    expect(engine.getAsset('a1')?.tags).not.toContain('finance');
  });

  it('should track lineage', () => {
    engine.addLineageNode({ id: 'src1', name: 'GL Upload', type: 'source', children: ['t1'] });
    engine.addLineageNode({ id: 't1', name: 'Transform', type: 'transform', children: ['dest1'] });
    engine.addLineageNode({
      id: 'dest1',
      name: 'Revenue Report',
      type: 'destination',
      children: [],
    });
    expect(engine.getUpstream('dest1')).toContain('t1');
    expect(engine.getDownstream('src1')).toContain('dest1');
  });

  it('should manage quality rules', () => {
    engine.addQualityRule({
      id: 'r1',
      name: 'Not Null',
      dimension: 'completeness',
      target: 'revenue',
      condition: 'NOT NULL',
      threshold: 0.95,
    });
    expect(engine.getQualityScores('revenue')).toHaveLength(0);
    engine.recordQualityScore({
      target: 'revenue',
      dimension: 'completeness',
      score: 0.98,
      passed: true,
      details: '98% complete',
    });
    expect(engine.getOverallQualityScore('revenue')).toBe(0.98);
  });

  it('should manage retention policies', () => {
    engine.addRetentionPolicy({
      id: 'p1',
      name: '1 Year',
      targetType: 'table',
      retentionDays: 365,
    });
    engine.addAsset({
      id: 'a1',
      name: 'Old Table',
      type: 'table',
      source: 'GL',
      owner: 'CFO',
      sensitivity: 'public',
      tags: [],
      description: '',
      lastUpdated: '2020-01-01T00:00:00Z',
    });
    const expired = engine.getExpiredAssets();
    expect(expired.length).toBeGreaterThanOrEqual(1);
  });

  it('should log access', () => {
    engine.logAccess('user1', 'a1', 'read');
    engine.logAccess('user2', 'a1', 'write');
    expect(engine.getAccessLog({ userId: 'user1' })).toHaveLength(1);
    expect(engine.getAccessLog({ assetId: 'a1' })).toHaveLength(2);
  });

  it('should serialize and deserialize', () => {
    engine.addAsset({
      id: 'a1',
      name: 'Test',
      type: 'table',
      source: 'GL',
      owner: 'CFO',
      sensitivity: 'public',
      tags: [],
      description: '',
      lastUpdated: new Date().toISOString(),
    });
    const json = engine.serialize();
    const engine2 = new DataGovernanceEngine();
    engine2.deserialize(json);
    expect(engine2.getAsset('a1')?.name).toBe('Test');
  });

  it('should get stats', () => {
    engine.addAsset({
      id: 'a1',
      name: 'A',
      type: 'table',
      source: 'GL',
      owner: 'CFO',
      sensitivity: 'public',
      tags: [],
      description: '',
      lastUpdated: new Date().toISOString(),
    });
    engine.addAsset({
      id: 'a2',
      name: 'B',
      type: 'report',
      source: 'Budget',
      owner: 'CFO',
      sensitivity: 'confidential',
      tags: [],
      description: '',
      lastUpdated: new Date().toISOString(),
    });
    const stats = engine.getStats();
    expect(stats.totalAssets).toBe(2);
    expect(stats.bySensitivity.public).toBe(1);
    expect(stats.bySensitivity.confidential).toBe(1);
  });
});
