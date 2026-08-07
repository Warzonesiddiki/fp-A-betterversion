import { describe, it, expect, beforeEach } from 'vitest';
import { DrillThroughEngine, type DrillHandler, type DrillContext } from './DrillThroughEngine';
import type { LineageGraph } from './DataLineageEngine';

describe('DrillThroughEngine', () => {
  let engine: DrillThroughEngine;

  beforeEach(() => {
    engine = new DrillThroughEngine();
  });

  it('should initialize with empty path', () => {
    expect(engine.getCurrentPath()).toEqual([]);
    expect(engine.getCurrentLevel()).toBeNull();
  });

  it('should register a handler and unsubscribe', () => {
    const handler: DrillHandler = {
      level: 'summary',
      canHandle: () => true,
      render: () => 'rendered',
    };
    const unsubscribe = engine.registerHandler(handler);
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });

  it('should drill down through levels and format breadcrumbs correctly', () => {
    engine.registerHandler({ level: 'summary', canHandle: () => true, render: () => 'summary' });
    engine.registerHandler({ level: 'detail', canHandle: () => true, render: () => 'detail' });
    engine.registerHandler({
      level: 'journal-entry',
      canHandle: () => true,
      render: () => 'journal',
    });
    engine.registerHandler({
      level: 'source-document',
      canHandle: () => true,
      render: () => 'source',
    });

    const context: DrillContext = {
      cellValue: 100,
      entity: 'ACME',
      metric: 'Revenue',
      account: '4000',
      period: '2026-Q1',
      rowId: 'JE-99',
      extra: { documentId: 'INV-1234' },
    };

    const res1 = engine.drillDown(context);
    expect(res1).toBe('summary');
    expect(engine.getCurrentLevel()).toBe('summary');
    expect(engine.getCurrentPath()[0]!.label).toBe('Revenue');

    const res2 = engine.drillDown(context);
    expect(res2).toBe('detail');
    expect(engine.getCurrentLevel()).toBe('detail');
    expect(engine.getCurrentPath()[1]!.label).toContain('4000');

    const res3 = engine.drillDown(context);
    expect(res3).toBe('journal');
    expect(engine.getCurrentLevel()).toBe('journal-entry');
    expect(engine.getCurrentPath()[2]!.label).toContain('JE-99');

    const res4 = engine.drillDown(context);
    expect(res4).toBe('source');
    expect(engine.getCurrentLevel()).toBe('source-document');
    expect(engine.getCurrentPath()[3]!.label).toContain('INV-1234');
  });

  it('should navigate directly to target level with drillToLevel', () => {
    engine.registerHandler({ level: 'summary', canHandle: () => true, render: () => 'summary' });
    engine.registerHandler({ level: 'detail', canHandle: () => true, render: () => 'detail' });
    engine.registerHandler({
      level: 'journal-entry',
      canHandle: () => true,
      render: () => 'journal',
    });

    engine.drillDown({ cellValue: 100 });
    engine.drillDown({ cellValue: 100 });
    engine.drillDown({ cellValue: 100 });
    expect(engine.getCurrentLevel()).toBe('journal-entry');

    engine.drillToLevel('summary');
    expect(engine.getCurrentLevel()).toBe('summary');
    expect(engine.getCurrentPath()).toHaveLength(1);
  });

  it('should resolve lineage hierarchy into drill breadcrumbs', () => {
    const graph: LineageGraph = {
      nodes: [
        { id: 'node-1', name: 'GL Account 4000', type: 'transformation' },
        { id: 'node-2', name: 'Monthly Journal Entry', type: 'source' },
      ],
      edges: [{ id: 'edge-1', from: 'node-2', to: 'node-1', type: 'derivation' }],
    };

    const crumbs = engine.resolveFromLineage('node-1', graph, { cellValue: 5000 });
    expect(crumbs.length).toBeGreaterThan(0);
    expect(crumbs[0]!.label).toBe('GL Account 4000');
  });

  it('should navigate back and reset path', () => {
    engine.registerHandler({ level: 'summary', canHandle: () => true, render: () => 'summary' });
    engine.registerHandler({ level: 'detail', canHandle: () => true, render: () => 'detail' });

    engine.drillDown({ cellValue: 100 });
    engine.drillDown({ cellValue: 100 });
    expect(engine.getCurrentLevel()).toBe('detail');

    engine.goBack();
    expect(engine.getCurrentLevel()).toBe('summary');

    engine.reset();
    expect(engine.getCurrentPath()).toEqual([]);
    expect(engine.getCurrentLevel()).toBeNull();
  });
});
