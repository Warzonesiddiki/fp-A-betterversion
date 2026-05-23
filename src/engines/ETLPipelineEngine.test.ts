import { describe, it, expect, beforeEach } from 'vitest';
import { ETLPipelineEngine, type FieldMapping } from './ETLPipelineEngine';

describe('ETLPipelineEngine', () => {
  let engine: ETLPipelineEngine;

  beforeEach(() => {
    engine = new ETLPipelineEngine();
  });

  it('should auto-detect field mappings', () => {
    const mappings = engine.autoDetectMappings(['First Name', 'Last Name', 'Amount']);
    expect(mappings).toHaveLength(3);
    expect(mappings[0].targetField).toBe('first_name');
  });

  it('should validate required fields', () => {
    engine.setMappings([
      { sourceField: 'name', targetField: 'name', fieldType: 'string', required: true },
      { sourceField: 'amount', targetField: 'amount', fieldType: 'number', required: true },
    ]);
    const result = engine.validate([{ name: 'Test', amount: null }]);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should validate field types', () => {
    engine.setMappings([
      { sourceField: 'amount', targetField: 'amount', fieldType: 'number', required: true },
    ]);
    const result = engine.validate([{ amount: 'not a number' }]);
    expect(result.valid).toBe(false);
  });

  it('should pass valid data', () => {
    engine.setMappings([
      { sourceField: 'name', targetField: 'name', fieldType: 'string', required: true },
      { sourceField: 'amount', targetField: 'amount', fieldType: 'number', required: true },
    ]);
    const result = engine.validate([{ name: 'Test', amount: 100 }]);
    expect(result.valid).toBe(true);
  });

  it('should profile data', () => {
    const data = [
      { name: 'A', amount: 100 },
      { name: 'B', amount: 200 },
      { name: 'C', amount: null },
    ];
    const stats = engine.profile(data);
    expect(stats).toHaveLength(2);
    expect(stats.find((s) => s.name === 'name')?.distinctCount).toBe(3);
    expect(stats.find((s) => s.name === 'amount')?.nullCount).toBe(1);
  });

  it('should cleanse data', () => {
    const data = [
      { name: '  Test  ', amount: '' },
      { name: 'Test2', amount: 100 },
    ];
    const cleaned = engine.cleanse(data);
    expect(cleaned[0].name).toBe('Test');
    expect(cleaned[0].amount).toBeNull();
  });

  it('should filter data', () => {
    engine.addTransform({
      id: 't1',
      name: 'Filter',
      type: 'filter',
      config: { field: 'amount', operator: 'gt', value: 100 },
    });
    const data = [{ amount: 50 }, { amount: 150 }, { amount: 200 }];
    const result = engine.executeTransforms(data);
    expect(result).toHaveLength(2);
  });

  it('should sort data', () => {
    engine.addTransform({
      id: 't1',
      name: 'Sort',
      type: 'sort',
      config: { field: 'amount', direction: 'desc' },
    });
    const data = [{ amount: 100 }, { amount: 300 }, { amount: 200 }];
    const result = engine.executeTransforms(data);
    expect(result[0].amount).toBe(300);
  });

  it('should aggregate data', () => {
    engine.addTransform({
      id: 't1',
      name: 'Aggregate',
      type: 'aggregate',
      config: { groupBy: 'category', field: 'amount', function: 'sum' },
    });
    const data = [
      { category: 'A', amount: 100 },
      { category: 'A', amount: 200 },
      { category: 'B', amount: 300 },
    ];
    const result = engine.executeTransforms(data);
    expect(result).toHaveLength(2);
  });

  it('should track import history', () => {
    engine.recordImport({
      success: true,
      recordsImported: 100,
      recordsRejected: 5,
      errors: [],
      warnings: [],
      duration: 1500,
    });
    expect(engine.getImportHistory()).toHaveLength(1);
    expect(engine.getLastImport()?.recordsImported).toBe(100);
  });

  it('should remove transforms', () => {
    engine.addTransform({ id: 't1', name: 'Test', type: 'filter', config: {} });
    expect(engine.getTransforms()).toHaveLength(1);
    engine.removeTransform('t1');
    expect(engine.getTransforms()).toHaveLength(0);
  });
});
