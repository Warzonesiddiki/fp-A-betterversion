/**
 * GAP-1 (F-0006) known-answer tests for ScenarioEngine's money migration.
 *
 * Every case below is a FIXED input -> EXACT expected decimal. Each one is a
 * value the previous raw IEEE-754 implementation got WRONG; the literal float
 * result it produced is recorded in a comment next to the assertion so the
 * regression is self-documenting. `toBe` (Object.is) is used deliberately
 * instead of `toBeCloseTo` — an approximate assertion cannot detect the very
 * drift these tests exist to prevent.
 */
import { describe, it, expect } from 'vitest';
import { ScenarioEngine } from './ScenarioEngine';
import type { ScenarioMetrics, GLEntry } from '@/types';

/** Minimal GLEntry factory — only the fields the engine reads carry meaning. */
function glEntry(accountCode: string, debit: number, credit: number, id: string): GLEntry {
  return {
    id,
    accountId: `acct-${accountCode}`,
    accountCode,
    accountName: `Account ${accountCode}`,
    period: '2026-01',
    periodName: 'Jan 2026',
    debit,
    credit,
    netChange: 0,
    date: '2026-01-31',
    amount: 0,
    description: 'known-answer fixture',
    reference: id,
  };
}

const metrics = (over: Partial<ScenarioMetrics> = {}): ScenarioMetrics => ({
  revenue: 0,
  ebitda: 0,
  netIncome: 0,
  cashFlow: 0,
  headcount: 0,
  burnRate: 0,
  runway: 0,
  grossMargin: 0,
  ebitdaMargin: 0,
  ...over,
});

describe('ScenarioEngine — money primitive known answers (GAP-1 / F-0006)', () => {
  describe('calculateBaseMetrics', () => {
    it('computes cashFlow as exactly 80% of EBITDA (float gave 799.9200000000001)', () => {
      // revenue 1000.10, cogs 0.20, opex 0 -> ebitda 999.90 -> cashFlow 799.92
      const entries = [glEntry('4000', 1000.1, 0, 'rev-1'), glEntry('5000', 0.2, 0, 'cogs-1')];
      const result = ScenarioEngine.calculateBaseMetrics(entries);

      expect(result.revenue).toBe(1000.1);
      expect(result.ebitda).toBe(999.9);
      // Raw float: 999.9 * 0.8 === 799.9200000000001
      expect(result.cashFlow).toBe(799.92);
      expect(result.netIncome).toBe(999.9);
    });

    it('nets debit against credit exactly across many small entries', () => {
      // 0.10 x 3 = 0.30 exactly; float 0.1+0.1+0.1 === 0.30000000000000004
      const entries = [
        glEntry('4000', 0.1, 0, 'r1'),
        glEntry('4000', 0.1, 0, 'r2'),
        glEntry('4000', 0.1, 0, 'r3'),
      ];
      expect(ScenarioEngine.calculateBaseMetrics(entries).revenue).toBe(0.3);
    });

    it('computes burnRate as opex/12 rounded to cents', () => {
      // opex 100.10 -> 100.10/12 = 8.34166... -> 8.34 at cent precision
      const entries = [glEntry('6000', 100.1, 0, 'opex-1')];
      expect(ScenarioEngine.calculateBaseMetrics(entries).burnRate).toBe(8.34);
    });

    it('returns zero margins for zero revenue instead of NaN or Infinity', () => {
      const result = ScenarioEngine.calculateBaseMetrics([glEntry('6000', 500, 0, 'o1')]);
      expect(result.revenue).toBe(0);
      expect(result.grossMargin).toBe(0);
      expect(result.ebitdaMargin).toBe(0);
      expect(Number.isFinite(result.ebitda)).toBe(true);
    });

    it('computes gross margin percentage from exact decimals', () => {
      // revenue 2.10, cogs 0.70 -> grossProfit 1.40 -> 66.666666...%
      const entries = [glEntry('4000', 2.1, 0, 'r1'), glEntry('5000', 0.7, 0, 'c1')];
      const result = ScenarioEngine.calculateBaseMetrics(entries);
      expect(result.grossMargin).toBe(66.6666666667);
    });
  });

  describe('applyDrivers', () => {
    it('applies a fractional percentage driver exactly (10.1% of 1000.10)', () => {
      const base = metrics({ revenue: 1000.1, ebitda: 500.05, grossMargin: 50 });
      const result = ScenarioEngine.applyDrivers(base, [
        {
          id: 'd1',
          name: 'Revenue uplift',
          type: 'revenue',
          impactType: 'percentage',
          value: 10.1,
          isActive: true,
        },
      ]);
      // 1000.10 * 1.101 = 1101.1101 -> 1101.11 at cent precision
      expect(result.revenue).toBe(1101.11);
      expect(result.netIncome).toBe(result.ebitda);
    });

    it('chains three percentage drivers without compounding float error', () => {
      const base = metrics({ revenue: 100, ebitda: 10 });
      const driver = (id: string, value: number) => ({
        id,
        name: id,
        type: 'revenue' as const,
        impactType: 'percentage' as const,
        value,
        isActive: true,
      });
      const result = ScenarioEngine.applyDrivers(base, [
        driver('a', 10),
        driver('b', 10),
        driver('c', 10),
      ]);
      // 100 * 1.1^3 = 133.1 exactly
      expect(result.revenue).toBe(133.1);
    });

    it('ignores inactive drivers', () => {
      const base = metrics({ revenue: 1000, ebitda: 100 });
      const result = ScenarioEngine.applyDrivers(base, [
        {
          id: 'd1',
          name: 'Off',
          type: 'revenue',
          impactType: 'percentage',
          value: 50,
          isActive: false,
        },
      ]);
      expect(result.revenue).toBe(1000);
    });

    it('applies an absolute expense driver against EBITDA exactly', () => {
      const base = metrics({ revenue: 1000, ebitda: 100.05 });
      const result = ScenarioEngine.applyDrivers(base, [
        {
          id: 'd1',
          name: 'New cost',
          type: 'expense',
          impactType: 'absolute',
          value: 0.1,
          isActive: true,
        },
      ]);
      // 100.05 - 0.10 = 99.95 (float: 99.94999999999999)
      expect(result.ebitda).toBe(99.95);
    });

    it('reports zero ebitdaMargin when adjusted revenue is zero', () => {
      const base = metrics({ revenue: 100, ebitda: 50 });
      const result = ScenarioEngine.applyDrivers(base, [
        {
          id: 'd1',
          name: 'Wipe revenue',
          type: 'revenue',
          impactType: 'percentage',
          value: -100,
          isActive: true,
        },
      ]);
      expect(result.revenue).toBe(0);
      expect(result.ebitdaMargin).toBe(0);
    });
  });

  describe('probabilityWeighted', () => {
    it('weights runway exactly (float gave 19.799999999999997)', () => {
      const result = ScenarioEngine.probabilityWeighted([
        { metrics: metrics({ runway: 24 }), probability: 0.3 },
        { metrics: metrics({ runway: 18 }), probability: 0.7 },
      ]);
      // Raw float: 24 * 0.3 + 18 * 0.7 === 19.799999999999997
      expect(result.runway).toBe(19.8);
    });

    it('weights cent-level revenue exactly', () => {
      const result = ScenarioEngine.probabilityWeighted([
        { metrics: metrics({ revenue: 1000.1 }), probability: 0.3 },
        { metrics: metrics({ revenue: 2000.2 }), probability: 0.7 },
      ]);
      // 300.03 + 1400.14 = 1700.17
      expect(result.revenue).toBe(1700.17);
    });

    it('normalises probabilities that do not sum to 1', () => {
      const result = ScenarioEngine.probabilityWeighted([
        { metrics: metrics({ revenue: 100 }), probability: 3 },
        { metrics: metrics({ revenue: 200 }), probability: 1 },
      ]);
      // (100*3 + 200*1) / 4 = 125
      expect(result.revenue).toBe(125);
    });

    it('returns zeros for an all-zero probability set rather than NaN', () => {
      const result = ScenarioEngine.probabilityWeighted([
        { metrics: metrics({ revenue: 1000 }), probability: 0 },
      ]);
      expect(result.revenue).toBe(0);
      expect(Number.isNaN(result.revenue)).toBe(false);
    });

    it('preserves the total when splitting one value across many scenarios', () => {
      // Ten equal 1/3-weighted scenarios of 0.10 must total exactly 0.10.
      const scenarios = Array.from({ length: 10 }, () => ({
        metrics: metrics({ revenue: 0.1 }),
        probability: 1 / 3,
      }));
      expect(ScenarioEngine.probabilityWeighted(scenarios).revenue).toBe(0.1);
    });
  });

  describe('mergeScenarios', () => {
    it('blends cent values exactly (float gave 1100.1100000000001)', () => {
      const a = metrics({ revenue: 1000.1 });
      const b = metrics({ revenue: 2000.2 });
      // Raw float: 1000.10 * 0.9 + 2000.20 * 0.1 === 1100.1100000000001
      expect(ScenarioEngine.mergeScenarios(a, b, 0.1).revenue).toBe(1100.11);
    });

    it('returns the base exactly at weight 0 and the other exactly at weight 1', () => {
      const a = metrics({ revenue: 1000.07, ebitda: 33.33 });
      const b = metrics({ revenue: 2000.03, ebitda: 66.67 });
      expect(ScenarioEngine.mergeScenarios(a, b, 0).revenue).toBe(1000.07);
      expect(ScenarioEngine.mergeScenarios(a, b, 1).revenue).toBe(2000.03);
    });

    it('clamps out-of-range weights to [0, 1]', () => {
      const a = metrics({ revenue: 1000.07 });
      const b = metrics({ revenue: 2000.03 });
      expect(ScenarioEngine.mergeScenarios(a, b, -5).revenue).toBe(1000.07);
      expect(ScenarioEngine.mergeScenarios(a, b, 5).revenue).toBe(2000.03);
    });

    it('splits a 50/50 blend of odd cents without bias', () => {
      const a = metrics({ revenue: 0.01 });
      const b = metrics({ revenue: 0.02 });
      // 0.005 + 0.010 = 0.015 -> ROUND_HALF_UP to cents = 0.02
      expect(ScenarioEngine.mergeScenarios(a, b, 0.5).revenue).toBe(0.02);
    });
  });

  describe('sensitivityAnalysis', () => {
    it('scales cent-level metrics by an exact ratio', () => {
      const base = metrics({ revenue: 1000.1, ebitda: 250.05, cashFlow: 180.03 });
      const [row] = ScenarioEngine.sensitivityAnalysis(base, [
        { name: 'Scale', baseValue: 100, lowValue: 90, highValue: 110 },
      ]);
      // 1000.10 * 0.9 = 900.09 (float: 900.0900000000001)
      expect(row!.lowImpact.revenue).toBe(900.09);
      // 250.05 * 1.1 = 275.055 -> 275.06 half-up
      expect(row!.highImpact.ebitda).toBe(275.06);
    });

    it('inverts runway by the ratio exactly', () => {
      const base = metrics({ runway: 12 });
      const [row] = ScenarioEngine.sensitivityAnalysis(base, [
        { name: 'Cost', baseValue: 100, lowValue: 80, highValue: 120 },
      ]);
      expect(row!.lowImpact.runway).toBe(15);
      // 12 / 1.2 = 10 exactly
      expect(row!.highImpact.runway).toBe(10);
    });

    it('falls back to a ratio of 1 when the base value is zero', () => {
      const base = metrics({ revenue: 1234.56 });
      const [row] = ScenarioEngine.sensitivityAnalysis(base, [
        { name: 'Zero', baseValue: 0, lowValue: 10, highValue: 20 },
      ]);
      expect(row!.lowImpact.revenue).toBe(1234.56);
      expect(row!.highImpact.revenue).toBe(1234.56);
    });

    it('returns 0 runway for a zero ratio instead of Infinity', () => {
      const base = metrics({ revenue: 100, runway: 12 });
      const [row] = ScenarioEngine.sensitivityAnalysis(base, [
        { name: 'Collapse', baseValue: 100, lowValue: 0, highValue: 200 },
      ]);
      expect(row!.lowImpact.runway).toBe(0);
      expect(Number.isFinite(row!.lowImpact.runway)).toBe(true);
    });
  });
});
