import { describe, it, expect, beforeEach } from 'vitest';
import {
  DataQualityEngine,
  createCompletenessRule,
  createNumericRule,
  createRangeRule,
  createUniqueRule,
} from './DataQualityEngine';

describe('DataQualityEngine', () => {
  let engine: DataQualityEngine;

  beforeEach(() => {
    engine = new DataQualityEngine();
  });

  it('should initialize with empty rules', () => {
    expect(engine.getRules()).toEqual([]);
  });

  it('should add a rule', () => {
    const rule = createCompletenessRule('name');
    engine.addRule(rule);
    expect(engine.getRules().length).toBe(1);
  });

  it('should remove a rule', () => {
    const rule = createCompletenessRule('name');
    engine.addRule(rule);
    expect(engine.removeRule(rule.id)).toBe(true);
    expect(engine.getRules()).toEqual([]);
  });

  it('should return false when removing non-existent rule', () => {
    expect(engine.removeRule('nonexistent')).toBe(false);
  });

  it('should get rules by dimension', () => {
    engine.addRule(createCompletenessRule('name'));
    engine.addRule(createNumericRule('age'));
    expect(engine.getRulesByDimension('completeness').length).toBe(1);
    expect(engine.getRulesByDimension('validity').length).toBe(1);
  });

  it('should profile data', () => {
    const data = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: null },
      { name: '', age: 25 },
    ];
    const profile = engine.profile(data);
    expect(profile.name.total).toBe(3);
    expect(profile.name.nulls).toBe(1);
    expect(profile.name.completeness).toBeCloseTo(2 / 3);
    expect(profile.age.total).toBe(3);
    expect(profile.age.nulls).toBe(1);
  });

  it('should return empty profile for empty data', () => {
    expect(engine.profile([])).toEqual({});
  });

  it('should validate with completeness rule', () => {
    engine.addRule(createCompletenessRule('name'));
    const data = [{ name: 'Alice' }, { name: '' }, { name: 'Charlie' }];
    const report = engine.validate(data);
    expect(report.overallScore).toBeCloseTo(2 / 3);
    expect(report.summary.passed).toBe(2);
    expect(report.summary.failed).toBe(1);
    expect(report.results[0].failedRows).toEqual([1]);
  });

  it('should validate with numeric rule', () => {
    engine.addRule(createNumericRule('age', 0, 150));
    const data = [{ age: 30 }, { age: -5 }, { age: 200 }, { age: 'not a number' }];
    const report = engine.validate(data);
    expect(report.summary.passed).toBe(1);
    expect(report.summary.failed).toBe(3);
  });

  it('should validate with range rule', () => {
    engine.addRule(createRangeRule('score', 0, 100));
    const data = [{ score: 85 }, { score: 0 }, { score: 100 }, { score: -1 }, { score: 101 }];
    const report = engine.validate(data);
    expect(report.summary.passed).toBe(3);
    expect(report.summary.failed).toBe(2);
  });

  it('should validate with uniqueness rule', () => {
    engine.addRule(createUniqueRule('email'));
    const data = [{ email: 'a@test.com' }, { email: 'b@test.com' }, { email: 'a@test.com' }];
    const report = engine.validate(data);
    // Only the duplicate (third row) fails, not the first occurrence
    expect(report.summary.failed).toBe(1);
    expect(report.results[0].failedRows).toEqual([2]);
  });

  it('should calculate dimension scores', () => {
    engine.addRule(createCompletenessRule('name'));
    engine.addRule(createNumericRule('age'));
    const data = [
      { name: 'Alice', age: 30 },
      { name: '', age: 'invalid' },
    ];
    const report = engine.validate(data);
    expect(report.dimensionScores.completeness).toBeCloseTo(0.5);
    expect(report.dimensionScores.validity).toBeCloseTo(0.5);
  });

  it('should calculate field scores', () => {
    engine.addRule(createCompletenessRule('name'));
    engine.addRule(createNumericRule('name'));
    const data = [{ name: 'Alice' }, { name: '' }];
    const report = engine.validate(data);
    expect(report.fieldScores.name).toBeDefined();
  });

  it('should detect critical failures', () => {
    engine.addRule(createCompletenessRule('id', 'critical'));
    const data = [{ id: '1' }, { id: '' }];
    const report = engine.validate(data);
    expect(report.summary.criticalFailures).toBe(1);
  });

  it('should handle empty data', () => {
    engine.addRule(createCompletenessRule('name'));
    const report = engine.validate([]);
    expect(report.overallScore).toBe(1);
    expect(report.summary.totalChecks).toBe(0);
  });
});
