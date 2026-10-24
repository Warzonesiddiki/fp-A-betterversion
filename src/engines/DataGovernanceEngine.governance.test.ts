import { describe, it, expect, beforeEach } from 'vitest';
import { DataGovernanceEngine } from './DataGovernanceEngine';
import type { DataAsset, DataLineageNode, DataQualityRule, DataQualityScore, RetentionPolicy } from './DataGovernanceEngine';

/**
 * GOVERNANCE EVIDENCE for cap:govern.data-governance
 *
 * The DataGovernanceEngine manages the data catalog, lineage tracking,
 * quality rules, classification, tagging, and retention policies. The
 * governance dimension here is DATA ACCOUNTABILITY — every data asset must
 * have an owner, sensitivity classification, quality score, and lineage
 * chain. Retention policies ensure data is not kept beyond its useful life.
 *
 * Tested dimensions:
 * 1. Data catalog (add, get, remove, search)
 * 2. Asset classification and tagging
 * 3. Data lineage (upstream/downstream)
 * 4. Quality rules and scoring
 * 5. Retention policies
 * 6. Determinism
 */

function makeAsset(overrides: Partial<DataAsset> = {}): DataAsset {
  return {
    id: 'asset-1',
    name: 'GL Balances',
    type: 'table',
    source: 'ERP',
    owner: 'controller',
    sensitivity: 'confidential',
    tags: ['finance', 'gl'],
    description: 'General ledger balances',
    lastUpdated: '2026-01-01',
    ...overrides,
  };
}

describe('DataGovernanceEngine — GOVERNANCE (govern.data-governance)', () => {

  let engine: DataGovernanceEngine;

  beforeEach(() => {
    engine = new DataGovernanceEngine();
  });

  describe('1. Data catalog', () => {

    it('addAsset and getAsset round-trip', () => {
      engine.addAsset(makeAsset());
      const asset = engine.getAsset('asset-1');
      expect(asset).toBeDefined();
      expect(asset!.name).toBe('GL Balances');
    });

    it('getAsset returns undefined for unknown asset', () => {
      expect(engine.getAsset('unknown')).toBeUndefined();
    });

    it('removeAsset removes an asset', () => {
      engine.addAsset(makeAsset());
      const removed = engine.removeAsset('asset-1');
      expect(removed).toBe(true);
      expect(engine.getAsset('asset-1')).toBeUndefined();
    });

    it('removeAsset returns false for unknown asset', () => {
      expect(engine.removeAsset('unknown')).toBe(false);
    });

    it('searchAssets finds assets by name', () => {
      engine.addAsset(makeAsset({ name: 'Revenue Report' }));
      engine.addAsset(makeAsset({ id: 'asset-2', name: 'Budget Table' }));
      const results = engine.searchAssets('Revenue');
      expect(results).toHaveLength(1);
      expect(results[0]!.name).toBe('Revenue Report');
    });

    it('getAssetsByOwner returns assets for a specific owner', () => {
      engine.addAsset(makeAsset({ id: 'a1', owner: 'controller' }));
      engine.addAsset(makeAsset({ id: 'a2', owner: 'analyst' }));
      engine.addAsset(makeAsset({ id: 'a3', owner: 'controller' }));
      const controllerAssets = engine.getAssetsByOwner('controller');
      expect(controllerAssets).toHaveLength(2);
    });

    it('getAssetsBySensitivity returns assets by sensitivity level', () => {
      engine.addAsset(makeAsset({ id: 'a1', sensitivity: 'public' }));
      engine.addAsset(makeAsset({ id: 'a2', sensitivity: 'restricted' }));
      engine.addAsset(makeAsset({ id: 'a3', sensitivity: 'restricted' }));
      const restricted = engine.getAssetsBySensitivity('restricted');
      expect(restricted).toHaveLength(2);
    });
  });

  describe('2. Asset classification and tagging', () => {

    it('classifyAsset updates sensitivity level', () => {
      engine.addAsset(makeAsset({ sensitivity: 'internal' }));
      const result = engine.classifyAsset('asset-1', 'restricted');
      expect(result).toBe(true);
      const asset = engine.getAsset('asset-1');
      expect(asset!.sensitivity).toBe('restricted');
    });

    it('classifyAsset returns false for unknown asset', () => {
      expect(engine.classifyAsset('unknown', 'restricted')).toBe(false);
    });

    it('tagAsset adds a tag', () => {
      engine.addAsset(makeAsset({ tags: ['finance'] }));
      engine.tagAsset('asset-1', 'sox');
      const asset = engine.getAsset('asset-1');
      expect(asset!.tags).toContain('sox');
    });

    it('untagAsset removes a tag', () => {
      engine.addAsset(makeAsset({ tags: ['finance', 'sox'] }));
      engine.untagAsset('asset-1', 'sox');
      const asset = engine.getAsset('asset-1');
      expect(asset!.tags).not.toContain('sox');
    });
  });

  describe('3. Data lineage', () => {

    it('addLineageNode and getLineage round-trip', () => {
      const node: DataLineageNode = {
        id: 'lineage-1',
        name: 'GL Export',
        type: 'source',
        children: ['transform-1'],
      };
      engine.addLineageNode(node);
      const result = engine.getLineage('lineage-1');
      expect(result).toBeDefined();
      expect(result!.name).toBe('GL Export');
    });

    it('getUpstream returns upstream dependencies', () => {
      const source: DataLineageNode = { id: 'src', name: 'Source', type: 'source', children: ['tr1'] };
      const transform: DataLineageNode = { id: 'tr1', name: 'Transform', type: 'transform', children: ['dest1'] };
      const dest: DataLineageNode = { id: 'dest1', name: 'Destination', type: 'destination', children: [] };
      engine.addLineageNode(source);
      engine.addLineageNode(transform);
      engine.addLineageNode(dest);
      const upstream = engine.getUpstream('dest1');
      expect(upstream).toContain('tr1');
    });

    it('getDownstream returns downstream dependencies', () => {
      const source: DataLineageNode = { id: 'src', name: 'Source', type: 'source', children: ['tr1'] };
      const transform: DataLineageNode = { id: 'tr1', name: 'Transform', type: 'transform', children: ['dest1'] };
      engine.addLineageNode(source);
      engine.addLineageNode(transform);
      const downstream = engine.getDownstream('src');
      expect(downstream).toContain('tr1');
    });
  });

  describe('4. Quality rules and scoring', () => {

    it('addQualityRule and removeQualityRule round-trip', () => {
      const rule: DataQualityRule = {
        id: 'rule-1',
        name: 'Completeness Check',
        dimension: 'completeness',
        target: 'GL Balances',
        condition: '> 95%',
        threshold: 95,
      };
      engine.addQualityRule(rule);
      const removed = engine.removeQualityRule('rule-1');
      expect(removed).toBe(true);
    });

    it('recordQualityScore and getQualityScores round-trip', () => {
      const score: DataQualityScore = {
        target: 'GL Balances',
        dimension: 'accuracy',
        score: 98.5,
        passed: true,
        details: 'All checks passed',
      };
      engine.recordQualityScore(score);
      const scores = engine.getQualityScores('GL Balances');
      expect(scores).toHaveLength(1);
      expect(scores[0]!.score).toBe(98.5);
    });

    it('getOverallQualityScore returns average score', () => {
      engine.recordQualityScore({ target: 'GL', dimension: 'completeness', score: 90, passed: true, details: '' });
      engine.recordQualityScore({ target: 'GL', dimension: 'accuracy', score: 95, passed: true, details: '' });
      const overall = engine.getOverallQualityScore('GL');
      expect(overall).toBeCloseTo(92.5, 1);
    });
  });

  describe('5. Retention policies', () => {

    it('addRetentionPolicy and removeRetentionPolicy round-trip', () => {
      const policy: RetentionPolicy = {
        id: 'policy-1',
        name: 'GL 7-Year Retention',
        targetType: 'table',
        retentionDays: 2555,
      };
      engine.addRetentionPolicy(policy);
      const removed = engine.removeRetentionPolicy('policy-1');
      expect(removed).toBe(true);
    });

    it('removeRetentionPolicy returns false for unknown policy', () => {
      expect(engine.removeRetentionPolicy('unknown')).toBe(false);
    });
  });

  describe('6. Determinism', () => {

    it('addAsset and getAsset are deterministic', () => {
      engine.addAsset(makeAsset());
      const r1 = engine.getAsset('asset-1');
      const r2 = engine.getAsset('asset-1');
      expect(r1).toEqual(r2);
    });

    it('searchAssets is deterministic', () => {
      engine.addAsset(makeAsset({ name: 'Revenue' }));
      const r1 = engine.searchAssets('Revenue');
      const r2 = engine.searchAssets('Revenue');
      expect(r1).toEqual(r2);
    });
  });
});
