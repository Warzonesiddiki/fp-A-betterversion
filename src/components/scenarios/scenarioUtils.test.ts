import { describe, it, expect } from 'vitest';
import {
  METRICS,
  CATEGORIZED_METRICS,
  CATEGORY_LABELS,
  BAR_COLORS,
  TYPE_BADGE,
  STRATEGY_LABELS,
  fmtValue,
  variancePct,
  isFavorable,
  barWidth,
  pickBest,
  pickWorst,
  averageValue,
  severityOf,
  severityColor,
  type MergeStrategy,
} from './scenarioUtils';
import type { Scenario } from '@/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeScenario(
  id: string,
  metrics: Partial<Scenario['calculatedMetrics']>,
  type: Scenario['type'] = 'Base'
): Scenario {
  return {
    id,
    name: `Scenario ${id}`,
    description: '',
    baseBudgetId: 'b1',
    baseBudgetName: 'Budget',
    type,
    probability: 0.5,
    isActive: true,
    isLocked: false,
    assumptions: [],
    createdBy: 'u1',
    createdByName: 'User',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    calculatedMetrics: {
      revenue: 1000,
      ebitda: 200,
      netIncome: 100,
      cashFlow: 150,
      headcount: 50,
      burnRate: 30,
      runway: 12,
      grossMargin: 0.4,
      ebitdaMargin: 0.2,
      ...metrics,
    },
  };
}

const sLow = makeScenario('s1', { revenue: 1000, burnRate: 20 });
const sMid = makeScenario('s2', { revenue: 1500, burnRate: 30 });
const sHigh = makeScenario('s3', { revenue: 2000, burnRate: 10 });

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('scenarioUtils constants', () => {
  it('METRICS exposes the nine standard scenario metrics with unique keys', () => {
    expect(METRICS).toHaveLength(9);
    const keys = METRICS.map((m) => m.key);
    expect(new Set(keys).size).toBe(9);
    expect(keys).toEqual(
      expect.arrayContaining([
        'revenue',
        'ebitda',
        'netIncome',
        'cashFlow',
        'grossMargin',
        'ebitdaMargin',
        'headcount',
        'burnRate',
        'runway',
      ])
    );
  });

  it('METRICS flags burnRate as lower-is-better and the rest as higher-is-better', () => {
    const burn = METRICS.find((m) => m.key === 'burnRate');
    expect(burn?.higherIsBetter).toBe(false);
    for (const m of METRICS.filter((x) => x.key !== 'burnRate')) {
      expect(m.higherIsBetter).toBe(true);
    }
  });

  it('METRICS assigns a format to every metric', () => {
    for (const m of METRICS) {
      expect(['currency', 'percent', 'number']).toContain(m.format);
    }
    expect(METRICS.find((m) => m.key === 'revenue')?.format).toBe('currency');
    expect(METRICS.find((m) => m.key === 'grossMargin')?.format).toBe('percent');
    expect(METRICS.find((m) => m.key === 'headcount')?.format).toBe('number');
  });

  it('CATEGORIZED_METRICS covers every METRICS key with a valid category', () => {
    const catKeys = CATEGORIZED_METRICS.map((m) => m.key);
    expect(catKeys).toEqual(METRICS.map((m) => m.key));
    for (const m of CATEGORIZED_METRICS) {
      expect(['profitability', 'liquidity', 'efficiency']).toContain(m.category);
    }
    // spot-check category assignments
    expect(CATEGORIZED_METRICS.find((m) => m.key === 'revenue')?.category).toBe('profitability');
    expect(CATEGORIZED_METRICS.find((m) => m.key === 'cashFlow')?.category).toBe('liquidity');
    expect(CATEGORIZED_METRICS.find((m) => m.key === 'headcount')?.category).toBe('efficiency');
  });

  it('exposes category labels, bar colors and type badges', () => {
    expect(CATEGORY_LABELS.profitability).toBe('Profitability');
    expect(CATEGORY_LABELS.liquidity).toBe('Liquidity');
    expect(CATEGORY_LABELS.efficiency).toBe('Efficiency');
    expect(BAR_COLORS).toHaveLength(4);
    expect(new Set(BAR_COLORS).size).toBe(4);
    expect(TYPE_BADGE.Base).toContain('gray');
    expect(TYPE_BADGE.Optimistic).toContain('green');
    expect(TYPE_BADGE.Pessimistic).toContain('red');
    expect(TYPE_BADGE.Custom).toContain('blue');
  });

  it('STRATEGY_LABELS maps every merge strategy', () => {
    const strategies: MergeStrategy[] = ['best', 'average', 'worst'];
    for (const s of strategies) {
      expect(STRATEGY_LABELS[s]).toBeTruthy();
    }
    expect(STRATEGY_LABELS.best).toContain('Best');
    expect(STRATEGY_LABELS.worst).toContain('Worst');
    expect(STRATEGY_LABELS.average).toContain('Average');
  });
});

// ---------------------------------------------------------------------------
// fmtValue
// ---------------------------------------------------------------------------

describe('fmtValue', () => {
  it('formats currency values with compact USD notation', () => {
    expect(fmtValue(10500, 'currency')).toBe('$10.5K');
    expect(fmtValue(0, 'currency')).toBe('$0.0');
    expect(fmtValue(1234567, 'currency')).toBe('$1.2M');
    expect(fmtValue(-999999, 'currency')).toBe('-$1.0M');
    expect(fmtValue(1_000_000_000, 'currency')).toBe('$1.0B');
    expect(fmtValue(1500, 'currency')).toBe('$1.5K');
  });

  it('formats percent values using formatPercent with 1 decimal', () => {
    expect(fmtValue(12.34, 'percent')).toBe('12.3%');
    expect(fmtValue(0, 'percent')).toBe('0.0%');
    expect(fmtValue(-5.55, 'percent')).toBe('-5.6%');
  });

  it('formats plain numbers with zero fraction digits', () => {
    expect(fmtValue(1234.5, 'number')).toBe('1,235');
    expect(fmtValue(50, 'number')).toBe('50');
    expect(fmtValue(-12.6, 'number')).toBe('-13');
  });
});

// ---------------------------------------------------------------------------
// Variance helpers
// ---------------------------------------------------------------------------

describe('variancePct', () => {
  it('computes the percentage change from base', () => {
    expect(variancePct(120, 100)).toBe(20);
    expect(variancePct(80, 100)).toBe(-20);
    expect(variancePct(100, 100)).toBe(0);
  });

  it('uses the absolute value of base so negative baselines behave', () => {
    expect(variancePct(-80, -100)).toBe(20);
    expect(variancePct(-120, -100)).toBe(-20);
  });

  it('returns 0 when the base is zero', () => {
    expect(variancePct(50, 0)).toBe(0);
    expect(variancePct(0, 0)).toBe(0);
  });
});

describe('isFavorable', () => {
  it('treats a delta within epsilon as favorable regardless of direction', () => {
    expect(isFavorable(100, 100.0005, true)).toBe(true);
    expect(isFavorable(100, 99.9995, false)).toBe(true);
  });

  it('scores increases as favorable when higher is better', () => {
    expect(isFavorable(110, 100, true)).toBe(true);
    expect(isFavorable(90, 100, true)).toBe(false);
  });

  it('scores decreases as favorable when lower is better', () => {
    expect(isFavorable(90, 100, false)).toBe(true);
    expect(isFavorable(110, 100, false)).toBe(false);
  });

  it('handles exact equality', () => {
    expect(isFavorable(100, 100, true)).toBe(true);
    expect(isFavorable(100, 100, false)).toBe(true);
  });
});

describe('barWidth', () => {
  it('returns 0 when max is 0', () => {
    expect(barWidth(10, 0)).toBe(0);
    expect(barWidth(0, 0)).toBe(0);
  });

  it('clamps to a minimum of 2% for non-zero values', () => {
    expect(barWidth(0, 100)).toBe(2);
    expect(barWidth(1, 1000)).toBe(2);
  });

  it('clamps to 100% for values at or beyond max', () => {
    expect(barWidth(100, 100)).toBe(100);
    expect(barWidth(250, 100)).toBe(100);
  });

  it('scales proportionally within bounds and uses absolute values', () => {
    expect(barWidth(50, 100)).toBe(50);
    expect(barWidth(-50, 100)).toBe(50);
    expect(barWidth(25, 50)).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// Merge strategies
// ---------------------------------------------------------------------------

describe('pickBest', () => {
  it('returns the scenario with the highest value when higher is better', () => {
    const r = pickBest([sLow, sMid, sHigh], 'revenue', true);
    expect(r).toEqual({ value: 2000, sourceId: 's3' });
  });

  it('returns the scenario with the lowest value when lower is better', () => {
    const r = pickBest([sLow, sMid, sHigh], 'burnRate', false);
    expect(r).toEqual({ value: 10, sourceId: 's3' });
  });

  it('keeps the first scenario on ties', () => {
    const a = makeScenario('a', { revenue: 100 });
    const b = makeScenario('b', { revenue: 100 });
    expect(pickBest([a, b], 'revenue', true).sourceId).toBe('a');
  });

  it('handles a single scenario', () => {
    expect(pickBest([sLow], 'revenue', true)).toEqual({ value: 1000, sourceId: 's1' });
  });
});

describe('pickWorst', () => {
  it('returns the scenario with the lowest value when higher is better', () => {
    const r = pickWorst([sLow, sMid, sHigh], 'revenue', true);
    expect(r).toEqual({ value: 1000, sourceId: 's1' });
  });

  it('returns the scenario with the highest value when lower is better', () => {
    const r = pickWorst([sLow, sMid, sHigh], 'burnRate', false);
    expect(r).toEqual({ value: 30, sourceId: 's2' });
  });

  it('keeps the first scenario on ties', () => {
    const a = makeScenario('a', { revenue: 100 });
    const b = makeScenario('b', { revenue: 100 });
    expect(pickWorst([a, b], 'revenue', true).sourceId).toBe('a');
  });
});

describe('averageValue', () => {
  it('computes the arithmetic mean across scenarios', () => {
    expect(averageValue([sLow, sMid, sHigh], 'revenue')).toBe(1500);
    expect(averageValue([sLow, sHigh], 'revenue')).toBe(1500);
    expect(averageValue([sLow], 'revenue')).toBe(1000);
  });

  it('averages negative and fractional values correctly', () => {
    const a = makeScenario('a', { revenue: -100 });
    const b = makeScenario('b', { revenue: 50 });
    expect(averageValue([a, b], 'revenue')).toBe(-25);
  });
});

// ---------------------------------------------------------------------------
// Severity helpers
// ---------------------------------------------------------------------------

describe('severityOf', () => {
  it('classifies >= 20% change as high', () => {
    expect(severityOf(20)).toBe('high');
    expect(severityOf(-25.5)).toBe('high');
    expect(severityOf(100)).toBe('high');
  });

  it('classifies 5-19.99% change as medium', () => {
    expect(severityOf(5)).toBe('medium');
    expect(severityOf(-19.99)).toBe('medium');
    expect(severityOf(12.3)).toBe('medium');
  });

  it('classifies < 5% change as low', () => {
    expect(severityOf(0)).toBe('low');
    expect(severityOf(4.99)).toBe('low');
    expect(severityOf(-4)).toBe('low');
  });
});

describe('severityColor', () => {
  it('maps every severity to a distinct tailwind class set', () => {
    expect(severityColor('high')).toContain('bg-red-100');
    expect(severityColor('medium')).toContain('bg-amber-100');
    expect(severityColor('low')).toContain('bg-gray-100');
    expect(severityColor('high')).not.toBe(severityColor('medium'));
    expect(severityColor('medium')).not.toBe(severityColor('low'));
  });
});
