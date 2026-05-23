import { describe, it, expect, beforeEach } from 'vitest';
import {
  evaluateRule,
  evaluateRules,
  reorderRules,
  createVarianceHighlightRule,
  createNegativeVarianceRule,
  createGrowthRateRule,
  createBudgetVsActualRule,
  DEFAULT_RULES,
  type ConditionalFormatRule,
} from './ConditionalFormattingEngine';

describe('ConditionalFormattingEngine', () => {
  it('should have default rules', () => {
    expect(DEFAULT_RULES.length).toBe(4);
  });

  it('should create variance highlight rule', () => {
    const rule = createVarianceHighlightRule();
    expect(rule.id).toBe('variance-highlight');
    expect(rule.name).toBe('Variance Highlighting');
    expect(rule.enabled).toBe(true);
  });

  it('should create negative variance rule', () => {
    const rule = createNegativeVarianceRule();
    expect(rule.id).toBe('variance-negative');
    expect(rule.condition.operator).toBe('lessThan');
  });

  it('should evaluate cellValue rule - greaterThan', () => {
    const rule: ConditionalFormatRule = {
      id: 'test-1',
      name: 'High',
      enabled: true,
      priority: 100,
      condition: { ruleType: 'cellValue', operator: 'greaterThan', value: 50 },
      visualType: 'backgroundColor',
      style: { backgroundColor: '#ff0000' },
    };
    const result = evaluateRule(rule, 100);
    expect(result.matched).toBe(true);
  });

  it('should evaluate cellValue rule - lessThan', () => {
    const rule: ConditionalFormatRule = {
      id: 'test-2',
      name: 'Low',
      enabled: true,
      priority: 100,
      condition: { ruleType: 'cellValue', operator: 'lessThan', value: 10 },
      visualType: 'backgroundColor',
      style: { backgroundColor: '#00ff00' },
    };
    expect(evaluateRule(rule, 5).matched).toBe(true);
    expect(evaluateRule(rule, 50).matched).toBe(false);
  });

  it('should evaluate cellValue rule - between', () => {
    const rule: ConditionalFormatRule = {
      id: 'test-3',
      name: 'Mid',
      enabled: true,
      priority: 100,
      condition: { ruleType: 'cellValue', operator: 'between', value: 10, value2: 20 },
      visualType: 'backgroundColor',
      style: { backgroundColor: '#ffff00' },
    };
    expect(evaluateRule(rule, 15).matched).toBe(true);
    expect(evaluateRule(rule, 5).matched).toBe(false);
    expect(evaluateRule(rule, 25).matched).toBe(false);
  });

  it('should evaluate text rule - contains', () => {
    const rule: ConditionalFormatRule = {
      id: 'test-4',
      name: 'Contains',
      enabled: true,
      priority: 100,
      condition: { ruleType: 'text', operator: 'contains', text: 'error' },
      visualType: 'textColor',
      style: { textColor: '#ff0000' },
    };
    expect(evaluateRule(rule, 'This has an error').matched).toBe(true);
    expect(evaluateRule(rule, 'Fine').matched).toBe(false);
  });

  it('should not match disabled rules', () => {
    const rule: ConditionalFormatRule = {
      id: 'test-5',
      name: 'Disabled',
      enabled: false,
      priority: 100,
      condition: { ruleType: 'cellValue', operator: 'greaterThan', value: 0 },
      visualType: 'backgroundColor',
      style: { backgroundColor: '#ff0000' },
    };
    expect(evaluateRule(rule, 100).matched).toBe(false);
  });

  it('should reorder rules by priority', () => {
    const r1: ConditionalFormatRule = {
      id: 'r1',
      name: 'First',
      enabled: true,
      priority: 10,
      condition: { ruleType: 'cellValue', operator: 'greaterThan', value: 0 },
      visualType: 'backgroundColor',
    };
    const r2: ConditionalFormatRule = {
      id: 'r2',
      name: 'Second',
      enabled: true,
      priority: 100,
      condition: { ruleType: 'cellValue', operator: 'lessThan', value: 100 },
      visualType: 'backgroundColor',
    };
    const reordered = reorderRules([r1, r2]);
    expect(reordered[0].name).toBe('Second');
  });

  it('should evaluate multiple rules and return highest priority match', () => {
    const rules: ConditionalFormatRule[] = [
      {
        id: 'low',
        name: 'Low',
        enabled: true,
        priority: 10,
        condition: { ruleType: 'cellValue', operator: 'greaterThan', value: 0 },
        visualType: 'backgroundColor',
        style: { backgroundColor: '#00ff00' },
      },
      {
        id: 'high',
        name: 'High',
        enabled: true,
        priority: 100,
        condition: { ruleType: 'cellValue', operator: 'greaterThan', value: 50 },
        visualType: 'backgroundColor',
        style: { backgroundColor: '#ff0000' },
      },
    ];
    const result = evaluateRules(rules, 100);
    expect(result).not.toBeNull();
    expect(result!.ruleId).toBe('high');
  });

  it('should return null when no rules match', () => {
    const rules: ConditionalFormatRule[] = [
      {
        id: 'test',
        name: 'Test',
        enabled: true,
        priority: 100,
        condition: { ruleType: 'cellValue', operator: 'greaterThan', value: 1000 },
        visualType: 'backgroundColor',
      },
    ];
    expect(evaluateRules(rules, 5)).toBeNull();
  });

  it('should have presets in default rules', () => {
    expect(DEFAULT_RULES.length).toBeGreaterThanOrEqual(4);
    expect(DEFAULT_RULES.some((r) => r.name.includes('Variance'))).toBe(true);
  });
});
