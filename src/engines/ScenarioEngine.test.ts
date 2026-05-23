import { describe, it, expect } from 'vitest';
import { ScenarioEngine } from './ScenarioEngine';
import type { ScenarioMetrics } from '@/types';

describe('ScenarioEngine', () => {
  describe('monteCarlo', () => {
    it('should return empty array for zero iterations', () => {
      const result = ScenarioEngine.monteCarlo(
        [{ name: 'rev', type: 'uniform', min: 0, max: 100 }],
        0
      );
      expect(result).toHaveLength(0);
    });

    it('should return empty array for empty assumptions', () => {
      const result = ScenarioEngine.monteCarlo([], 100);
      expect(result).toHaveLength(0);
    });

    it('should generate correct number of iterations', () => {
      const result = ScenarioEngine.monteCarlo(
        [{ name: 'rev', type: 'uniform', min: 0, max: 10 }],
        5
      );
      expect(result).toHaveLength(5);
    });

    it('should produce values within uniform bounds', () => {
      const seeded = () => 0.5;
      const result = ScenarioEngine.monteCarlo(
        [{ name: 'x', type: 'uniform', min: 10, max: 20 }],
        10,
        seeded
      );
      result.forEach((r) => {
        expect(r.values.x).toBe(15);
        expect(r.output).toBe(15);
      });
    });

    it('should produce deterministic values with seeded random (uniform)', () => {
      let callCount = 0;
      const seeded = () => {
        callCount++;
        return [0.25, 0.75][callCount % 2];
      };
      const result = ScenarioEngine.monteCarlo(
        [{ name: 'val', type: 'uniform', min: 0, max: 100 }],
        2,
        seeded
      );
      expect(result[0].values.val).toBe(75);
      expect(result[1].values.val).toBe(25);
    });

    it('should support normal distribution with seeded random', () => {
      let callCount = 0;
      const seeded = () => {
        callCount++;
        return 0.5;
      };
      const result = ScenarioEngine.monteCarlo(
        [{ name: 'z', type: 'normal', mean: 100, stdDev: 10 }],
        3,
        seeded
      );
      expect(result).toHaveLength(3);
      result.forEach((r) => {
        expect(typeof r.values.z).toBe('number');
        expect(r.output).toBe(r.values.z);
      });
    });

    it('should support triangular distribution', () => {
      const seeded = () => 0.5;
      const result = ScenarioEngine.monteCarlo(
        [{ name: 't', type: 'triangular', min: 0, max: 100, mode: 50 }],
        1,
        seeded
      );
      expect(typeof result[0].values.t).toBe('number');
    });

    it('should aggregate multiple assumptions into output', () => {
      const seeded = () => 0.5;
      const result = ScenarioEngine.monteCarlo(
        [
          { name: 'rev', type: 'uniform', min: 100, max: 200 },
          { name: 'cost', type: 'uniform', min: 50, max: 100 },
        ],
        1,
        seeded
      );
      expect(result[0].values.rev).toBe(150);
      expect(result[0].values.cost).toBe(75);
      expect(result[0].output).toBe(225);
    });
  });

  describe('sensitivityAnalysis', () => {
    const baseCase: ScenarioMetrics = {
      revenue: 100000,
      ebitda: 25000,
      netIncome: 15000,
      cashFlow: 18000,
      headcount: 100,
      burnRate: 50000,
      runway: 12,
      grossMargin: 0.65,
      ebitdaMargin: 0.25,
    };

    it('should apply low/high ratios to base case', () => {
      const result = ScenarioEngine.sensitivityAnalysis(baseCase, [
        { name: 'Revenue Growth', baseValue: 100, lowValue: 80, highValue: 120 },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Revenue Growth');
      expect(result[0].lowImpact.revenue).toBe(80000);
      expect(result[0].highImpact.revenue).toBe(120000);
    });

    it('should scale all financial metrics proportionally', () => {
      const result = ScenarioEngine.sensitivityAnalysis(baseCase, [
        { name: 'Scale', baseValue: 100, lowValue: 90, highValue: 110 },
      ]);
      expect(result[0].lowImpact.ebitda).toBe(22500);
      expect(result[0].lowImpact.netIncome).toBe(13500);
      expect(result[0].lowImpact.cashFlow).toBe(16200);
    });

    it('should handle headcount rounding', () => {
      const result = ScenarioEngine.sensitivityAnalysis(baseCase, [
        { name: 'HC', baseValue: 100, lowValue: 33, highValue: 66 },
      ]);
      expect(Number.isInteger(result[0].lowImpact.headcount)).toBe(true);
      expect(Number.isInteger(result[0].highImpact.headcount)).toBe(true);
    });

    it('should handle zero base value with ratio fallback', () => {
      const result = ScenarioEngine.sensitivityAnalysis(baseCase, [
        { name: 'Zero', baseValue: 0, lowValue: 10, highValue: 20 },
      ]);
      expect(result[0].lowImpact.revenue).toBe(baseCase.revenue);
      expect(result[0].highImpact.revenue).toBe(baseCase.revenue);
      expect(result[0].lowImpact.ebitda).toBe(baseCase.ebitda);
    });

    it('should preserve margin metrics', () => {
      const result = ScenarioEngine.sensitivityAnalysis(baseCase, [
        { name: 'GM', baseValue: 100, lowValue: 80, highValue: 120 },
      ]);
      expect(result[0].lowImpact.grossMargin).toBe(baseCase.grossMargin);
      expect(result[0].lowImpact.ebitdaMargin).toBe(baseCase.ebitdaMargin);
    });

    it('should invert runway ratio', () => {
      const result = ScenarioEngine.sensitivityAnalysis(baseCase, [
        { name: 'Cost', baseValue: 100, lowValue: 80, highValue: 120 },
      ]);
      expect(result[0].lowImpact.runway).toBe(15);
      expect(result[0].highImpact.runway).toBe(10);
    });

    it('should handle multiple inputs', () => {
      const result = ScenarioEngine.sensitivityAnalysis(baseCase, [
        { name: 'Rev Growth', baseValue: 100, lowValue: 90, highValue: 110 },
        { name: 'Cost Reduction', baseValue: 100, lowValue: 95, highValue: 105 },
      ]);
      expect(result).toHaveLength(2);
    });
  });

  describe('tornadoChart', () => {
    it('should sort inputs by range descending', () => {
      const inputs = [
        { name: 'Revenue', baseValue: 100, lowValue: 50, highValue: 150 },
        { name: 'Cost', baseValue: 100, lowValue: 80, highValue: 120 },
        { name: 'Tax', baseValue: 100, lowValue: 90, highValue: 110 },
      ];
      const result = ScenarioEngine.tornadoChart(inputs);
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Revenue');
      expect(result[1].name).toBe('Cost');
      expect(result[2].name).toBe('Tax');
    });

    it('should include range for each item', () => {
      const inputs = [{ name: 'Rev', baseValue: 100, lowValue: 50, highValue: 150 }];
      const result = ScenarioEngine.tornadoChart(inputs);
      expect(result[0].range).toBe(100);
    });

    it('should handle single input', () => {
      const inputs = [{ name: 'Only', baseValue: 100, lowValue: 80, highValue: 120 }];
      const result = ScenarioEngine.tornadoChart(inputs);
      expect(result).toHaveLength(1);
    });

    it('should handle equal ranges maintaining input order', () => {
      const inputs = [
        { name: 'A', baseValue: 100, lowValue: 90, highValue: 110 },
        { name: 'B', baseValue: 100, lowValue: 90, highValue: 110 },
      ];
      const result = ScenarioEngine.tornadoChart(inputs);
      expect(result).toHaveLength(2);
    });
  });

  describe('probabilityWeighted', () => {
    it('should return zero metrics for empty scenarios', () => {
      const result = ScenarioEngine.probabilityWeighted([]);
      expect(result.revenue).toBe(0);
      expect(result.ebitda).toBe(0);
      expect(result.netIncome).toBe(0);
      expect(result.cashFlow).toBe(0);
      expect(result.headcount).toBe(0);
      expect(result.burnRate).toBe(0);
      expect(result.runway).toBe(0);
      expect(result.grossMargin).toBe(0);
      expect(result.ebitdaMargin).toBe(0);
    });

    it('should weight single scenario correctly', () => {
      const scenarios = [
        {
          metrics: {
            revenue: 1000,
            ebitda: 200,
            netIncome: 150,
            cashFlow: 180,
            headcount: 50,
            burnRate: 300,
            runway: 24,
            grossMargin: 0.6,
            ebitdaMargin: 0.2,
          },
          probability: 1,
        },
      ];
      const result = ScenarioEngine.probabilityWeighted(scenarios);
      expect(result.revenue).toBe(1000);
      expect(result.headcount).toBe(50);
    });

    it('should combine multiple scenarios by probability', () => {
      const scenarios = [
        {
          metrics: {
            revenue: 1000,
            ebitda: 200,
            netIncome: 150,
            cashFlow: 180,
            headcount: 50,
            burnRate: 300,
            runway: 24,
            grossMargin: 0.6,
            ebitdaMargin: 0.2,
          },
          probability: 0.3,
        },
        {
          metrics: {
            revenue: 2000,
            ebitda: 400,
            netIncome: 300,
            cashFlow: 360,
            headcount: 80,
            burnRate: 500,
            runway: 18,
            grossMargin: 0.65,
            ebitdaMargin: 0.25,
          },
          probability: 0.7,
        },
      ];
      const result = ScenarioEngine.probabilityWeighted(scenarios);
      expect(result.revenue).toBe(1700);
      expect(result.ebitda).toBe(340);
      expect(result.netIncome).toBe(255);
      expect(result.headcount).toBe(71);
    });

    it('should normalize probabilities that do not sum to 1', () => {
      const scenarios = [
        {
          metrics: {
            revenue: 100,
            ebitda: 20,
            netIncome: 10,
            cashFlow: 15,
            headcount: 10,
            burnRate: 50,
            runway: 12,
            grossMargin: 0.5,
            ebitdaMargin: 0.2,
          },
          probability: 1,
        },
        {
          metrics: {
            revenue: 300,
            ebitda: 60,
            netIncome: 30,
            cashFlow: 45,
            headcount: 20,
            burnRate: 100,
            runway: 10,
            grossMargin: 0.6,
            ebitdaMargin: 0.25,
          },
          probability: 1,
        },
      ];
      const result = ScenarioEngine.probabilityWeighted(scenarios);
      expect(result.revenue).toBe(200);
    });

    it('should handle all equal probabilities', () => {
      const scenarios = [
        {
          metrics: {
            revenue: 1000,
            ebitda: 200,
            netIncome: 150,
            cashFlow: 180,
            headcount: 50,
            burnRate: 300,
            runway: 24,
            grossMargin: 0.6,
            ebitdaMargin: 0.2,
          },
          probability: 0.5,
        },
        {
          metrics: {
            revenue: 2000,
            ebitda: 400,
            netIncome: 300,
            cashFlow: 360,
            headcount: 80,
            burnRate: 500,
            runway: 18,
            grossMargin: 0.65,
            ebitdaMargin: 0.25,
          },
          probability: 0.5,
        },
      ];
      const result = ScenarioEngine.probabilityWeighted(scenarios);
      expect(result.revenue).toBe(1500);
    });

    it('should handle zero total probability gracefully', () => {
      const scenarios = [
        {
          metrics: {
            revenue: 1000,
            ebitda: 200,
            netIncome: 150,
            cashFlow: 180,
            headcount: 50,
            burnRate: 300,
            runway: 24,
            grossMargin: 0.6,
            ebitdaMargin: 0.2,
          },
          probability: 0,
        },
      ];
      const result = ScenarioEngine.probabilityWeighted(scenarios);
      expect(result.revenue).toBe(0);
    });
  });
});
