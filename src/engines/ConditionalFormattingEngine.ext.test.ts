/**
 * ConditionalFormattingEngine.ext.test.ts — rule evaluation known answers
 * (MISSION D wave 2, 2026-08-07): comparison operators, rank/average rules,
 * data bars, icon sets, color scales, priority ordering, presets.
 */
import { describe, expect, it } from 'vitest';
import {
  buildStyleFromFormat,
  createBudgetVsActualRule,
  createGrowthRateRule,
  createNegativeVarianceRule,
  createVarianceHighlightRule,
  DEFAULT_RULES,
  evaluateRule,
  evaluateRules,
  generateRuleId,
  reorderRules,
  type ConditionalFormatRule,
} from './ConditionalFormattingEngine';

const baseRule = (over: Partial<ConditionalFormatRule>): ConditionalFormatRule =>
  ({
    id: 'r',
    name: 'R',
    enabled: true,
    priority: 50,
    condition: { ruleType: 'cellValue', operator: 'greaterThan', value: 0 },
    visualType: 'backgroundColor',
    style: { backgroundColor: '#fff', textColor: '#000' },
    ...over,
  }) as ConditionalFormatRule;

describe('ConditionalFormattingEngine — comparison operators', () => {
  it('greaterThan / greaterThanOrEqual / lessThan / lessThanOrEqual / between', () => {
    expect(
      evaluateRule(
        baseRule({ condition: { ruleType: 'cellValue', operator: 'greaterThan', value: 10 } }),
        11
      ).matched
    ).toBe(true);
    expect(
      evaluateRule(
        baseRule({ condition: { ruleType: 'cellValue', operator: 'greaterThan', value: 10 } }),
        10
      ).matched
    ).toBe(false);
    expect(
      evaluateRule(
        baseRule({
          condition: { ruleType: 'cellValue', operator: 'greaterThanOrEqual', value: 10 },
        }),
        10
      ).matched
    ).toBe(true);
    expect(
      evaluateRule(
        baseRule({ condition: { ruleType: 'cellValue', operator: 'lessThan', value: 10 } }),
        9
      ).matched
    ).toBe(true);
    expect(
      evaluateRule(
        baseRule({ condition: { ruleType: 'cellValue', operator: 'lessThanOrEqual', value: 10 } }),
        10
      ).matched
    ).toBe(true);
    expect(
      evaluateRule(
        baseRule({
          condition: { ruleType: 'cellValue', operator: 'between', value: 5, value2: 10 },
        }),
        7
      ).matched
    ).toBe(true);
    expect(
      evaluateRule(
        baseRule({
          condition: { ruleType: 'cellValue', operator: 'between', value: 5, value2: 10 },
        }),
        11
      ).matched
    ).toBe(false);
    expect(
      evaluateRule(
        baseRule({ condition: { ruleType: 'cellValue', operator: 'greaterThan', value: 1 } }),
        null
      ).matched
    ).toBe(false);
  });

  it('equal / notEqual with text and numbers', () => {
    expect(
      evaluateRule(
        baseRule({ condition: { ruleType: 'text', operator: 'equal', text: 'Closed' } }),
        'closed'
      ).matched
    ).toBe(true);
    expect(
      evaluateRule(
        baseRule({ condition: { ruleType: 'text', operator: 'notEqual', text: 'Closed' } }),
        'open'
      ).matched
    ).toBe(true);
    expect(
      evaluateRule(
        baseRule({ condition: { ruleType: 'cellValue', operator: 'equal', value: 5 } }),
        5
      ).matched
    ).toBe(true);
    expect(
      evaluateRule(
        baseRule({ condition: { ruleType: 'cellValue', operator: 'equal', value: 5 } }),
        6
      ).matched
    ).toBe(false);
  });

  it('contains / startsWith / endsWith', () => {
    expect(
      evaluateRule(
        baseRule({ condition: { ruleType: 'text', operator: 'contains', text: 'rev' } }),
        'Revenue'
      ).matched
    ).toBe(true);
    expect(
      evaluateRule(
        baseRule({ condition: { ruleType: 'text', operator: 'startsWith', text: 'rev' } }),
        'Revenue'
      ).matched
    ).toBe(true);
    expect(
      evaluateRule(
        baseRule({ condition: { ruleType: 'text', operator: 'endsWith', text: 'nue' } }),
        'Revenue'
      ).matched
    ).toBe(true);
    expect(
      evaluateRule(
        baseRule({ condition: { ruleType: 'text', operator: 'startsWith', text: 'cost' } }),
        'Revenue'
      ).matched
    ).toBe(false);
  });

  it('topN / bottomN against all values', () => {
    const values = [10, 20, 30, 40, 50];
    expect(
      evaluateRule(
        baseRule({ condition: { ruleType: 'rank', operator: 'topN', rankValue: 3 } }),
        40,
        values
      ).matched
    ).toBe(true);
    expect(
      evaluateRule(
        baseRule({ condition: { ruleType: 'rank', operator: 'topN', rankValue: 3 } }),
        10,
        values
      ).matched
    ).toBe(false);
    expect(
      evaluateRule(
        baseRule({ condition: { ruleType: 'rank', operator: 'bottomN', rankValue: 2 } }),
        10,
        values
      ).matched
    ).toBe(true);
    expect(
      evaluateRule(
        baseRule({ condition: { ruleType: 'rank', operator: 'topN', rankValue: 3 } }),
        40,
        []
      ).matched
    ).toBe(false);
  });

  it('aboveAverage / belowAverage', () => {
    const values = [1, 2, 3, 4, 100];
    expect(
      evaluateRule(
        baseRule({ condition: { ruleType: 'average', operator: 'aboveAverage' } }),
        50,
        values
      ).matched
    ).toBe(true);
    expect(
      evaluateRule(
        baseRule({ condition: { ruleType: 'average', operator: 'aboveAverage' } }),
        5,
        values
      ).matched
    ).toBe(false);
    expect(
      evaluateRule(
        baseRule({ condition: { ruleType: 'average', operator: 'belowAverage' } }),
        5,
        values
      ).matched
    ).toBe(true);
  });
});

describe('ConditionalFormattingEngine — visuals', () => {
  it('dataBar computes percentage with clamping', () => {
    const rule = baseRule({
      condition: { ruleType: 'cellValue', operator: 'greaterThan', value: -Infinity },
      visualType: 'dataBar',
      dataBar: { minimum: 0, maximum: 100, color: '#3b82f6', style: 'solid' },
    });
    expect(evaluateRule(rule, 50, [0, 100]).dataBar!.percentage).toBeCloseTo(0.5, 6);
    expect(evaluateRule(rule, 200, [0, 100]).dataBar!.percentage).toBe(1);
    expect(evaluateRule(rule, -10, [0, 100]).dataBar!.percentage).toBe(0);
    // auto min/max: defaults floor at 0 (min of allValues ∪ {0}) and max of allValues ∪ {1}
    const auto = baseRule({
      condition: { ruleType: 'cellValue', operator: 'greaterThan', value: -Infinity },
      visualType: 'dataBar',
      dataBar: { color: '#3b82f6', style: 'solid' },
    });
    expect(evaluateRule(auto, 30, [10, 20, 30, 40]).dataBar!.percentage).toBeCloseTo(0.75, 6);
  });

  it('iconSet assigns buckets and honors reverse', () => {
    const values = [10, 20, 30];
    const rule = baseRule({
      condition: { ruleType: 'cellValue', operator: 'greaterThan', value: -Infinity },
      visualType: 'iconSet',
      iconSet: { type: '3-arrows', reverse: false, showIconOnly: false },
    });
    expect(evaluateRule(rule, 10, values).iconSet!.iconIndex).toBe(0); // smallest → ↓
    expect(evaluateRule(rule, 30, values).iconSet!.iconIndex).toBe(2); // largest → ↑
    const reversed = baseRule({
      condition: { ruleType: 'cellValue', operator: 'greaterThan', value: -Infinity },
      visualType: 'iconSet',
      iconSet: { type: '3-arrows', reverse: true, showIconOnly: false },
    });
    expect(evaluateRule(reversed, 30, values).iconSet!.iconIndex).toBe(0);
  });

  it('colorScale interpolates 2-color and 3-color', () => {
    const two = baseRule({
      condition: { ruleType: 'cellValue', operator: 'greaterThan', value: -Infinity },
      visualType: 'colorScale',
      colorScale: {
        type: '2-color',
        minColor: '#000000',
        maxColor: '#ffffff',
        minimum: 0,
        maximum: 100,
      },
    });
    expect(evaluateRule(two, 50, [0, 100]).colorScale!.interpolatedColor).toBe('#808080');
    const three = baseRule({
      condition: { ruleType: 'cellValue', operator: 'greaterThan', value: -Infinity },
      visualType: 'colorScale',
      colorScale: {
        type: '3-color',
        minColor: '#ff0000',
        midColor: '#ffff00',
        maxColor: '#00ff00',
        minimum: 0,
        midpoint: 50,
        maximum: 100,
      },
    });
    expect(evaluateRule(three, 50, [0, 100]).colorScale!.interpolatedColor).toBe('#ffff00');
  });

  it('formula rules always match (delegated)', () => {
    const r = evaluateRule(
      baseRule({ condition: { ruleType: 'formula', operator: 'greaterThan', value: 0 } }),
      'whatever'
    );
    expect(r.matched).toBe(true);
  });

  it('disabled rules never match', () => {
    const r = evaluateRule(baseRule({ enabled: false }), 100);
    expect(r.matched).toBe(false);
    expect(r.ruleId).toBe('r');
  });
});

describe('ConditionalFormattingEngine — rule sets', () => {
  it('evaluateRules returns the highest-priority match', () => {
    const rules = [createNegativeVarianceRule(), createVarianceHighlightRule()];
    const pos = evaluateRules(rules, 5)!;
    expect(pos.ruleId).toBe('variance-highlight'); // priority 100
    const neg = evaluateRules(rules, -5)!;
    expect(neg.ruleId).toBe('variance-negative');
    expect(evaluateRules(rules, 5, [])).not.toBeNull();
    expect(
      evaluateRules(
        [
          { ...rules[0]!, enabled: false },
          { ...rules[1]!, enabled: false },
        ],
        5
      )
    ).toBeNull();
  });

  it('reorderRules sorts by priority descending', () => {
    const rules = [
      createNegativeVarianceRule(),
      createGrowthRateRule(),
      createVarianceHighlightRule(),
    ];
    const sorted = reorderRules(rules);
    expect(sorted.map((r) => r.priority)).toEqual([100, 99, 90]);
  });

  it('preset factories produce the documented rule shapes', () => {
    expect(createVarianceHighlightRule().style!.backgroundColor).toBe('#dcfce7');
    expect(createNegativeVarianceRule().condition.operator).toBe('lessThan');
    expect(createGrowthRateRule().colorScale!.type).toBe('3-color');
    expect(createBudgetVsActualRule().iconSet!.type).toBe('3-arrows');
    expect(DEFAULT_RULES).toHaveLength(4);
    expect(generateRuleId()).toMatch(/^cf-rule-/);
    expect(generateRuleId()).not.toBe(generateRuleId());
  });

  it('buildStyleFromFormat maps style and colorScale', () => {
    const style = buildStyleFromFormat({
      matched: true,
      ruleId: 'r',
      style: {
        backgroundColor: '#fee2e2',
        textColor: '#991b1b',
        fontWeight: 'bold',
        border: '1px solid',
      },
    });
    expect(style.backgroundColor).toBe('#fee2e2');
    expect(style.color).toBe('#991b1b');
    expect(style.fontWeight).toBe('bold');
    expect(style.border).toBe('1px solid');
    const scale = buildStyleFromFormat({
      matched: true,
      ruleId: 'r',
      colorScale: {
        type: '2-color',
        minColor: '#000',
        maxColor: '#fff',
        interpolatedColor: '#123456',
      },
    });
    expect(scale.backgroundColor).toBe('#123456');
    expect(buildStyleFromFormat({ matched: false, ruleId: 'r' })).toEqual({});
  });
});
