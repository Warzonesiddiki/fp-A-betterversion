import { describe, it, expect, beforeEach } from 'vitest';
import { DrillThroughEngine, type DrillHandler, type DrillContext } from './DrillThroughEngine';

describe('DrillThroughEngine', () => {
  let engine: DrillThroughEngine;

  beforeEach(() => {
    engine = new DrillThroughEngine();
  });

  it('should initialize with empty path', () => {
    expect(engine.getCurrentPath()).toEqual([]);
    expect(engine.getCurrentLevel()).toBeNull();
  });

  it('should register a handler', () => {
    const handler: DrillHandler = {
      level: 'summary',
      canHandle: () => true,
      render: () => 'rendered',
    };
    const unsubscribe = engine.registerHandler(handler);
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });

  it('should drill down through levels', () => {
    engine.registerHandler({ level: 'summary', canHandle: () => true, render: () => 'summary' });
    engine.registerHandler({ level: 'detail', canHandle: () => true, render: () => 'detail' });

    const context: DrillContext = { cellValue: 100, entity: 'ACME' };
    const result = engine.drillDown(context);
    expect(result).toBe('summary');
    expect(engine.getCurrentLevel()).toBe('summary');

    const result2 = engine.drillDown(context);
    expect(result2).toBe('detail');
    expect(engine.getCurrentLevel()).toBe('detail');
  });

  it('should navigate back', () => {
    engine.registerHandler({ level: 'summary', canHandle: () => true, render: () => 'summary' });
    engine.registerHandler({ level: 'detail', canHandle: () => true, render: () => 'detail' });

    engine.drillDown({ cellValue: 100 });
    engine.drillDown({ cellValue: 100 });
    expect(engine.getCurrentLevel()).toBe('detail');

    engine.goBack();
    expect(engine.getCurrentLevel()).toBe('summary');
  });

  it('should reset path', () => {
    engine.registerHandler({ level: 'summary', canHandle: () => true, render: () => 'summary' });
    engine.drillDown({ cellValue: 100 });
    engine.reset();
    expect(engine.getCurrentPath()).toEqual([]);
    expect(engine.getCurrentLevel()).toBeNull();
  });

  it('should check if drill down is possible', () => {
    engine.registerHandler({ level: 'summary', canHandle: () => true, render: () => 'summary' });
    expect(engine.canDrillDown({ cellValue: 100 })).toBe(true);
  });

  it('should return false when no handlers for next level', () => {
    expect(engine.canDrillDown({ cellValue: 100 })).toBe(false);
  });

  it('should subscribe and notify listeners', () => {
    let notified = false;
    const unsubscribe = engine.subscribe(() => {
      notified = true;
    });

    engine.registerHandler({ level: 'summary', canHandle: () => true, render: () => 'summary' });
    engine.drillDown({ cellValue: 100 });

    expect(notified).toBe(true);
    unsubscribe();
  });

  it('should return null when at max depth', () => {
    engine.registerHandler({ level: 'summary', canHandle: () => true, render: () => 's' });
    engine.registerHandler({ level: 'detail', canHandle: () => true, render: () => 'd' });
    engine.registerHandler({ level: 'journal-entry', canHandle: () => true, render: () => 'j' });
    engine.registerHandler({ level: 'source-document', canHandle: () => true, render: () => 'sd' });

    engine.drillDown({ cellValue: 1 });
    engine.drillDown({ cellValue: 2 });
    engine.drillDown({ cellValue: 3 });
    engine.drillDown({ cellValue: 4 });
    const result = engine.drillDown({ cellValue: 5 });
    expect(result).toBeNull();
  });
});
