/**
 * DataCatalogEngine.ext.test.ts — asset catalog search + lineage graph
 * (MISSION D wave 2, 2026-08-07).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { DataCatalogEngine, type DataAsset } from './DataCatalogEngine';

const gl: DataAsset = {
  id: 'gl',
  name: 'General Ledger',
  type: 'table',
  owner: 'finance',
  description: 'Raw journal entries',
  tags: ['gl', 'finance'],
  schema: [{ name: 'amount', type: 'number', description: 'posting amount' }],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

const tb: DataAsset = {
  id: 'tb',
  name: 'Trial Balance',
  type: 'view',
  owner: 'finance',
  description: 'Balanced by account',
  tags: ['reporting'],
  schema: [{ name: 'account', type: 'string' }],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

const board: DataAsset = {
  id: 'board',
  name: 'Board Dashboard',
  type: 'dashboard',
  owner: 'exec',
  description: 'Executive KPIs',
  tags: ['kpi', 'reporting'],
  schema: [],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('DataCatalogEngine — assets', () => {
  let e: DataCatalogEngine;
  beforeEach(() => {
    e = new DataCatalogEngine();
    e.addAsset(gl);
    e.addAsset(tb);
    e.addAsset(board);
  });

  it('CRUD + filters', () => {
    expect(e.getAsset('gl')?.name).toBe('General Ledger');
    expect(
      e
        .listAssets()
        .map((a) => a.id)
        .sort()
    ).toEqual(['board', 'gl', 'tb']);
    expect(e.listAssets({ type: 'dashboard' }).map((a) => a.id)).toEqual(['board']);
    expect(
      e
        .listAssets({ owner: 'finance' })
        .map((a) => a.id)
        .sort()
    ).toEqual(['gl', 'tb']);
    expect(
      e
        .listAssets({ tags: ['reporting'] })
        .map((a) => a.id)
        .sort()
    ).toEqual(['board', 'tb']);
    expect(e.listAssets({ tags: ['none'] })).toHaveLength(0);
    expect(e.removeAsset('board')).toBe(true);
    expect(e.removeAsset('board')).toBe(false);
    expect(e.getAsset('board')).toBeUndefined();
  });

  it('search ranks by field with matched-field reporting', () => {
    const results = e.search('reporting');
    expect(results.map((r) => r.asset.id).sort()).toEqual(['board', 'tb']);
    expect(results[0]!.relevance).toBeGreaterThan(0);
    expect(results[0]!.matchedFields).toContain('tags');
    // schema-level match
    const byField = e.search('amount');
    expect(byField.map((r) => r.asset.id)).toEqual(['gl']);
    expect(byField[0]!.matchedFields).toContain('schema.amount');
    // multi-term, no matches
    expect(e.search('zzz nope')).toHaveLength(0);
  });
});

describe('DataCatalogEngine — lineage', () => {
  let e: DataCatalogEngine;
  beforeEach(() => {
    e = new DataCatalogEngine();
    e.addAsset(gl);
    e.addAsset(tb);
    e.addAsset(board);
  });

  it('builds upstream and downstream graphs', () => {
    e.addLineage('gl', 'tb', 'aggregate');
    e.addLineage('tb', 'board', 'summarize');
    const tbLineage = e.getLineage('tb');
    expect(tbLineage.upstream.map((n) => n.assetId)).toEqual(['gl']);
    expect(tbLineage.upstream[0]!.direction).toBe('upstream');
    expect(tbLineage.downstream.map((n) => n.assetId)).toEqual(['board']);
    expect(tbLineage.downstream[0]!.type).toBe('dashboard');
    const boardLineage = e.getLineage('board');
    expect(boardLineage.upstream.map((n) => n.assetId).sort()).toEqual(['gl', 'tb']);
  });

  it('removeLineage and removeAsset clean edges', () => {
    e.addLineage('gl', 'tb');
    expect(e.removeLineage('gl', 'tb')).toBe(true);
    expect(e.removeLineage('gl', 'tb')).toBe(false);
    expect(e.getLineage('tb').upstream).toHaveLength(0);

    e.addLineage('gl', 'tb');
    e.removeAsset('gl');
    expect(e.getLineage('tb').upstream).toHaveLength(0);
  });

  it('getLineageGraph returns nodes and edges', () => {
    e.addLineage('gl', 'tb', 'rollup');
    const graph = e.getLineageGraph();
    expect(graph.nodes.map((n) => n.id).sort()).toEqual(['gl', 'tb']);
    expect(graph.edges[0]!.transformation).toBe('rollup');
  });

  it('serialize / deserialize round-trips assets and lineage', () => {
    e.addLineage('gl', 'tb');
    const json = e.serialize();
    const e2 = new DataCatalogEngine();
    e2.deserialize(json);
    expect(e2.listAssets()).toHaveLength(3);
    expect(e2.getLineage('tb').upstream).toHaveLength(1);
  });
});
