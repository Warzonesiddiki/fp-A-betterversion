import { describe, it, expect } from 'vitest';
import { MonteCarloEngine } from './MonteCarloEngine';
import type {
  MonteCarloConfig,
  DistributionConfig,
  ScenarioMonteCarloConfig,
  MonteCarloDriver,
} from './MonteCarloEngine';
import type { ScenarioMetrics } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseMetrics: ScenarioMetrics = {
  revenue: 1000000,
  ebitda: 250000,
  netIncome: 150000,
  cashFlow: 200000,
  headcount: 100,
  burnRate: 50000,
  runway: 18,
  grossMargin: 65,
  ebitdaMargin: 25,
};

function sumModel(samples: Record<string, number>): number {
  return Object.values(samples).reduce((s, v) => s + v, 0);
}

function revenueModel(samples: Record<string, number>): number {
  return (samples['revenue'] ?? 100) * (1 + (samples['growth'] ?? 0) / 100);
}

// ---------------------------------------------------------------------------
// MonteCarloEngine.simulate
// ---------------------------------------------------------------------------

describe('MonteCarloEngine', () => {
  describe('simulate', () => {
    describe('validation', () => {
      it('should throw if config is not an object', () => {
        expect(() => MonteCarloEngine.simulate(null as unknown as MonteCarloConfig)).toThrow(
          'config must be an object'
        );
      });

      it('should throw if assumptions is not an array', () => {
        expect(() =>
          MonteCarloEngine.simulate({
            iterations: 10,
            confidenceLevel: 0.95,
            assumptions: 'bad' as unknown as DistributionConfig[],
            model: sumModel,
          })
        ).toThrow('assumptions must be an array');
      });

      it('should throw if iterations is not finite', () => {
        expect(() =>
          MonteCarloEngine.simulate({
            iterations: Infinity,
            confidenceLevel: 0.95,
            assumptions: [{ name: 'x', type: 'uniform', min: 0, max: 1 }],
            model: sumModel,
          })
        ).toThrow('iterations must be a finite number');
      });

      it('should throw if iterations < 1', () => {
        expect(() =>
          MonteCarloEngine.simulate({
            iterations: 0,
            confidenceLevel: 0.95,
            assumptions: [{ name: 'x', type: 'uniform', min: 0, max: 1 }],
            model: sumModel,
          })
        ).toThrow('iterations must be at least 1');
      });

      it('should throw if iterations > 1,000,000', () => {
        expect(() =>
          MonteCarloEngine.simulate({
            iterations: 1_000_001,
            confidenceLevel: 0.95,
            assumptions: [{ name: 'x', type: 'uniform', min: 0, max: 1 }],
            model: sumModel,
          })
        ).toThrow('iterations cannot exceed 1,000,000');
      });

      it('should throw if confidenceLevel is 0', () => {
        expect(() =>
          MonteCarloEngine.simulate({
            iterations: 10,
            confidenceLevel: 0,
            assumptions: [{ name: 'x', type: 'uniform', min: 0, max: 1 }],
            model: sumModel,
          })
        ).toThrow('confidenceLevel must be between 0 and 1');
      });

      it('should throw if confidenceLevel is 1', () => {
        expect(() =>
          MonteCarloEngine.simulate({
            iterations: 10,
            confidenceLevel: 1,
            assumptions: [{ name: 'x', type: 'uniform', min: 0, max: 1 }],
            model: sumModel,
          })
        ).toThrow('confidenceLevel must be between 0 and 1');
      });

      it('should throw if model is not a function', () => {
        expect(() =>
          MonteCarloEngine.simulate({
            iterations: 10,
            confidenceLevel: 0.95,
            assumptions: [{ name: 'x', type: 'uniform', min: 0, max: 1 }],
            model: 'not a function' as unknown as typeof sumModel,
          })
        ).toThrow('model must be a function');
      });

      it('should throw if distribution name is empty', () => {
        expect(() =>
          MonteCarloEngine.simulate({
            iterations: 10,
            confidenceLevel: 0.95,
            assumptions: [{ name: '', type: 'uniform', min: 0, max: 1 }],
            model: sumModel,
          })
        ).toThrow('non-empty name');
      });

      it('should throw if distribution type is invalid', () => {
        expect(() =>
          MonteCarloEngine.simulate({
            iterations: 10,
            confidenceLevel: 0.95,
            assumptions: [
              { name: 'x', type: 'invalid' as DistributionConfig['type'], min: 0, max: 1 },
            ],
            model: sumModel,
          })
        ).toThrow('must be one of');
      });

      it('should throw if model returns non-finite value', () => {
        expect(() =>
          MonteCarloEngine.simulate({
            iterations: 1,
            confidenceLevel: 0.95,
            assumptions: [{ name: 'x', type: 'uniform', min: 0, max: 1 }],
            model: () => Infinity,
          })
        ).toThrow('non-finite value');
      });
    });

    describe('uniform distribution', () => {
      it('should produce values within bounds', () => {
        const result = MonteCarloEngine.simulate({
          iterations: 100,
          confidenceLevel: 0.95,
          assumptions: [{ name: 'x', type: 'uniform', min: 10, max: 20 }],
          model: sumModel,
          seed: 42,
        });
        expect(result.min).toBeGreaterThanOrEqual(10);
        expect(result.max).toBeLessThanOrEqual(20);
      });

      it('should have mean near midpoint', () => {
        const result = MonteCarloEngine.simulate({
          iterations: 10000,
          confidenceLevel: 0.95,
          assumptions: [{ name: 'x', type: 'uniform', min: 0, max: 100 }],
          model: sumModel,
          seed: 42,
        });
        expect(result.mean).toBeGreaterThan(45);
        expect(result.mean).toBeLessThan(55);
      });

      it('should be deterministic with same seed', () => {
        const config: MonteCarloConfig = {
          iterations: 50,
          confidenceLevel: 0.95,
          assumptions: [{ name: 'x', type: 'uniform', min: 0, max: 100 }],
          model: sumModel,
          seed: 123,
        };
        const r1 = MonteCarloEngine.simulate(config);
        const r2 = MonteCarloEngine.simulate(config);
        expect(r1.values).toEqual(r2.values);
        expect(r1.mean).toBe(r2.mean);
      });

      it('should produce different results with different seeds', () => {
        const r1 = MonteCarloEngine.simulate({
          iterations: 50,
          confidenceLevel: 0.95,
          assumptions: [{ name: 'x', type: 'uniform', min: 0, max: 100 }],
          model: sumModel,
          seed: 1,
        });
        const r2 = MonteCarloEngine.simulate({
          iterations: 50,
          confidenceLevel: 0.95,
          assumptions: [{ name: 'x', type: 'uniform', min: 0, max: 100 }],
          model: sumModel,
          seed: 2,
        });
        expect(r1.values).not.toEqual(r2.values);
      });
    });

    describe('normal distribution', () => {
      it('should produce values centered around mean', () => {
        const result = MonteCarloEngine.simulate({
          iterations: 10000,
          confidenceLevel: 0.95,
          assumptions: [{ name: 'x', type: 'normal', mean: 100, stdDev: 10 }],
          model: sumModel,
          seed: 42,
        });
        expect(result.mean).toBeGreaterThan(95);
        expect(result.mean).toBeLessThan(105);
      });

      it('should have stdDev near input stdDev', () => {
        const result = MonteCarloEngine.simulate({
          iterations: 10000,
          confidenceLevel: 0.95,
          assumptions: [{ name: 'x', type: 'normal', mean: 0, stdDev: 15 }],
          model: sumModel,
          seed: 42,
        });
        expect(result.stdDev).toBeGreaterThan(12);
        expect(result.stdDev).toBeLessThan(18);
      });
    });

    describe('triangular distribution', () => {
      it('should produce values within min/max bounds', () => {
        const result = MonteCarloEngine.simulate({
          iterations: 100,
          confidenceLevel: 0.95,
          assumptions: [{ name: 'x', type: 'triangular', min: 10, max: 50, mode: 30 }],
          model: sumModel,
          seed: 42,
        });
        expect(result.min).toBeGreaterThanOrEqual(10);
        expect(result.max).toBeLessThanOrEqual(50);
      });
    });

    describe('lognormal distribution', () => {
      it('should produce positive values', () => {
        const result = MonteCarloEngine.simulate({
          iterations: 100,
          confidenceLevel: 0.95,
          assumptions: [{ name: 'x', type: 'lognormal', mean: 0, stdDev: 1 }],
          model: sumModel,
          seed: 42,
        });
        expect(result.min).toBeGreaterThan(0);
      });

      it('should be right-skewed', () => {
        const result = MonteCarloEngine.simulate({
          iterations: 10000,
          confidenceLevel: 0.95,
          assumptions: [{ name: 'x', type: 'lognormal', mean: 0, stdDev: 0.5 }],
          model: sumModel,
          seed: 42,
        });
        expect(result.skewness).toBeGreaterThan(0);
      });
    });

    describe('beta distribution', () => {
      it('should produce values between 0 and 1', () => {
        const result = MonteCarloEngine.simulate({
          iterations: 100,
          confidenceLevel: 0.95,
          assumptions: [{ name: 'x', type: 'beta', alpha: 2, betaParam: 5 }],
          model: sumModel,
          seed: 42,
        });
        expect(result.min).toBeGreaterThanOrEqual(0);
        expect(result.max).toBeLessThanOrEqual(1);
      });
    });

    describe('exponential distribution', () => {
      it('should produce non-negative values', () => {
        const result = MonteCarloEngine.simulate({
          iterations: 100,
          confidenceLevel: 0.95,
          assumptions: [{ name: 'x', type: 'exponential', lambda: 2 }],
          model: sumModel,
          seed: 42,
        });
        expect(result.min).toBeGreaterThanOrEqual(0);
      });

      it('should have mean near 1/lambda', () => {
        const result = MonteCarloEngine.simulate({
          iterations: 10000,
          confidenceLevel: 0.95,
          assumptions: [{ name: 'x', type: 'exponential', lambda: 3 }],
          model: sumModel,
          seed: 42,
        });
        // Mean of exponential(3) = 1/3 â‰ˆ 0.333
        expect(result.mean).toBeGreaterThan(0.28);
        expect(result.mean).toBeLessThan(0.4);
      });
    });

    describe('poisson distribution', () => {
      it('should produce non-negative integer-like values', () => {
        const result = MonteCarloEngine.simulate({
          iterations: 100,
          confidenceLevel: 0.95,
          assumptions: [{ name: 'x', type: 'poisson', lambda: 5 }],
          model: sumModel,
          seed: 42,
        });
        expect(result.min).toBeGreaterThanOrEqual(0);
        // All values should be whole numbers
        result.values.forEach((v) => {
          expect(v).toBe(Math.floor(v));
        });
      });

      it('should have mean near lambda', () => {
        const result = MonteCarloEngine.simulate({
          iterations: 10000,
          confidenceLevel: 0.95,
          assumptions: [{ name: 'x', type: 'poisson', lambda: 10 }],
          model: sumModel,
          seed: 42,
        });
        expect(result.mean).toBeGreaterThan(9);
        expect(result.mean).toBeLessThan(11);
      });
    });

    describe('statistics', () => {
      it('should compute correct percentiles', () => {
        const result = MonteCarloEngine.simulate({
          iterations: 10000,
          confidenceLevel: 0.95,
          assumptions: [{ name: 'x', type: 'uniform', min: 0, max: 100 }],
          model: sumModel,
          seed: 42,
        });
        expect(result.percentiles[50]!).toBeCloseTo(result.median, 0);
        expect(result.percentiles[5]!).toBeGreaterThan(0);
        expect(result.percentiles[95]!).toBeLessThan(100);
      });

      it('should compute confidence interval', () => {
        const result = MonteCarloEngine.simulate({
          iterations: 10000,
          confidenceLevel: 0.95,
          assumptions: [{ name: 'x', type: 'normal', mean: 100, stdDev: 10 }],
          model: sumModel,
          seed: 42,
        });
        expect(result.confidenceInterval.level).toBe(0.95);
        expect(result.confidenceInterval.lower).toBeLessThan(result.mean);
        expect(result.confidenceInterval.upper).toBeGreaterThan(result.mean);
      });

      it('should compute histogram with bins', () => {
        const result = MonteCarloEngine.simulate({
          iterations: 1000,
          confidenceLevel: 0.95,
          assumptions: [{ name: 'x', type: 'uniform', min: 0, max: 100 }],
          model: sumModel,
          seed: 42,
        });
        expect(result.histogram.length).toBeGreaterThan(0);
        const totalCount = result.histogram.reduce((s, b) => s + b.count, 0);
        expect(totalCount).toBe(1000);
      });

      it('should compute variance and stdDev correctly', () => {
        const result = MonteCarloEngine.simulate({
          iterations: 10000,
          confidenceLevel: 0.95,
          assumptions: [{ name: 'x', type: 'uniform', min: 0, max: 100 }],
          model: sumModel,
          seed: 42,
        });
        expect(result.variance).toBeCloseTo(result.stdDev * result.stdDev, 0);
        expect(result.stdDev).toBeGreaterThan(0);
      });

      it('should compute skewness near 0 for symmetric distribution', () => {
        const result = MonteCarloEngine.simulate({
          iterations: 10000,
          confidenceLevel: 0.95,
          assumptions: [{ name: 'x', type: 'normal', mean: 50, stdDev: 10 }],
          model: sumModel,
          seed: 42,
        });
        expect(Math.abs(result.skewness)).toBeLessThan(0.2);
      });

      it('should include drawsByIteration', () => {
        const result = MonteCarloEngine.simulate({
          iterations: 5,
          confidenceLevel: 0.95,
          assumptions: [
            { name: 'a', type: 'uniform', min: 0, max: 10 },
            { name: 'b', type: 'uniform', min: 0, max: 10 },
          ],
          model: sumModel,
          seed: 42,
        });
        expect(result.drawsByIteration).toHaveLength(5);
        expect(result.drawsByIteration[0]!).toHaveProperty('a');
        expect(result.drawsByIteration[0]!).toHaveProperty('b');
      });
    });

    describe('multi-variable model', () => {
      it('should sum multiple distributions', () => {
        const result = MonteCarloEngine.simulate({
          iterations: 100,
          confidenceLevel: 0.95,
          assumptions: [
            { name: 'a', type: 'uniform', min: 10, max: 20 },
            { name: 'b', type: 'uniform', min: 30, max: 40 },
          ],
          model: sumModel,
          seed: 42,
        });
        expect(result.mean).toBeGreaterThan(45);
        expect(result.mean).toBeLessThan(55);
      });

      it('should work with custom model function', () => {
        const result = MonteCarloEngine.simulate({
          iterations: 100,
          confidenceLevel: 0.95,
          assumptions: [
            { name: 'revenue', type: 'uniform', min: 100, max: 200 },
            { name: 'growth', type: 'uniform', min: 5, max: 15 },
          ],
          model: revenueModel,
          seed: 42,
        });
        // Revenue * (1 + growth/100) with revenue in [100,200], growth in [5,15]
        expect(result.min).toBeGreaterThan(100);
        expect(result.max).toBeLessThan(230);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // MonteCarloEngine.simulateScenario
  // ---------------------------------------------------------------------------

  describe('simulateScenario', () => {
    describe('validation', () => {
      it('should throw if config is not an object', () => {
        expect(() =>
          MonteCarloEngine.simulateScenario(null as unknown as ScenarioMonteCarloConfig)
        ).toThrow('config must be an object');
      });

      it('should throw if baseMetrics is not an object', () => {
        expect(() =>
          MonteCarloEngine.simulateScenario({
            baseMetrics: null as unknown as ScenarioMetrics,
            drivers: [
              {
                name: 'rev',
                distribution: { name: 'rev', type: 'normal', mean: 0, stdDev: 5 },
                targetMetric: 'revenue',
                impactType: 'percentage',
              },
            ],
            iterations: 10,
            confidenceLevel: 0.95,
          })
        ).toThrow('baseMetrics must be an object');
      });

      it('should throw if drivers is empty', () => {
        expect(() =>
          MonteCarloEngine.simulateScenario({
            baseMetrics,
            drivers: [],
            iterations: 10,
            confidenceLevel: 0.95,
          })
        ).toThrow('drivers must not be empty');
      });

      it('should throw if targetMetric is invalid', () => {
        expect(() =>
          MonteCarloEngine.simulateScenario({
            baseMetrics,
            drivers: [
              {
                name: 'bad',
                distribution: { name: 'bad', type: 'uniform', min: 0, max: 1 },
                targetMetric: 'invalidMetric' as keyof ScenarioMetrics,
                impactType: 'percentage',
              },
            ],
            iterations: 10,
            confidenceLevel: 0.95,
          })
        ).toThrow('targetMetric');
      });

      it('should throw if impactType is invalid', () => {
        expect(() =>
          MonteCarloEngine.simulateScenario({
            baseMetrics,
            drivers: [
              {
                name: 'bad',
                distribution: { name: 'bad', type: 'uniform', min: 0, max: 1 },
                targetMetric: 'revenue',
                impactType: 'invalid' as MonteCarloDriver['impactType'],
              },
            ],
            iterations: 10,
            confidenceLevel: 0.95,
          })
        ).toThrow('impactType');
      });
    });

    describe('revenue driver with percentage impact', () => {
      it('should vary revenue by percentage', () => {
        const result = MonteCarloEngine.simulateScenario({
          baseMetrics,
          drivers: [
            {
              name: 'growth',
              distribution: { name: 'growth', type: 'uniform', min: -10, max: 10 },
              targetMetric: 'revenue',
              impactType: 'percentage',
            },
          ],
          iterations: 1000,
          confidenceLevel: 0.95,
          seed: 42,
        });
        // Revenue should vary between 900k and 1.1M
        expect(result.metrics.revenue.min).toBeGreaterThan(850000);
        expect(result.metrics.revenue.max).toBeLessThan(1150000);
      });
    });

    describe('revenue driver with absolute impact', () => {
      it('should add absolute value to revenue', () => {
        const result = MonteCarloEngine.simulateScenario({
          baseMetrics,
          drivers: [
            {
              name: 'adjustment',
              distribution: {
                name: 'adjustment',
                type: 'uniform',
                min: -50000,
                max: 50000,
              },
              targetMetric: 'revenue',
              impactType: 'absolute',
            },
          ],
          iterations: 1000,
          confidenceLevel: 0.95,
          seed: 42,
        });
        expect(result.metrics.revenue.min).toBeGreaterThan(900000);
        expect(result.metrics.revenue.max).toBeLessThan(1100000);
      });
    });

    describe('multiple drivers', () => {
      it('should apply multiple drivers simultaneously', () => {
        const result = MonteCarloEngine.simulateScenario({
          baseMetrics,
          drivers: [
            {
              name: 'revGrowth',
              distribution: {
                name: 'revGrowth',
                type: 'normal',
                mean: 5,
                stdDev: 2,
              },
              targetMetric: 'revenue',
              impactType: 'percentage',
            },
            {
              name: 'costCut',
              distribution: {
                name: 'costCut',
                type: 'normal',
                mean: -3,
                stdDev: 1,
              },
              targetMetric: 'ebitda',
              impactType: 'percentage',
            },
          ],
          iterations: 1000,
          confidenceLevel: 0.95,
          seed: 42,
        });
        // Both metrics should have distribution
        expect(result.metrics.revenue.stdDev).toBeGreaterThan(0);
        expect(result.metrics.ebitda.stdDev).toBeGreaterThan(0);
      });
    });

    describe('probability of profit', () => {
      it('should compute probability > 0 for profitable base case', () => {
        const result = MonteCarloEngine.simulateScenario({
          baseMetrics,
          drivers: [
            {
              name: 'growth',
              distribution: { name: 'growth', type: 'normal', mean: 5, stdDev: 3 },
              targetMetric: 'revenue',
              impactType: 'percentage',
            },
          ],
          iterations: 1000,
          confidenceLevel: 0.95,
          seed: 42,
        });
        expect(result.probabilityOfProfit).toBeGreaterThan(0.5);
        expect(result.probabilityOfProfit).toBeLessThanOrEqual(1);
      });
    });

    describe('Value at Risk', () => {
      it('should compute VaR and CVaR', () => {
        const result = MonteCarloEngine.simulateScenario({
          baseMetrics,
          drivers: [
            {
              name: 'volatility',
              distribution: {
                name: 'volatility',
                type: 'normal',
                mean: 0,
                stdDev: 10,
              },
              targetMetric: 'ebitda',
              impactType: 'percentage',
            },
          ],
          iterations: 5000,
          confidenceLevel: 0.95,
          seed: 42,
        });
        expect(result.valueAtRisk).toBeDefined();
        expect(result.conditionalValueAtRisk).toBeDefined();
        // CVaR (expected shortfall) should be >= VaR in magnitude
        expect(result.conditionalValueAtRisk).toBeGreaterThanOrEqual(result.valueAtRisk);
      });
    });

    describe('net income recalculation', () => {
      it('should recalculate netIncome from ebitda', () => {
        const result = MonteCarloEngine.simulateScenario({
          baseMetrics,
          drivers: [
            {
              name: 'margin',
              distribution: { name: 'margin', type: 'uniform', min: -5, max: 5 },
              targetMetric: 'ebitda',
              impactType: 'percentage',
            },
          ],
          iterations: 100,
          confidenceLevel: 0.95,
          seed: 42,
        });
        // netIncome should match ebitda values
        expect(result.netIncome.mean).toBeCloseTo(result.metrics.ebitda.mean, 0);
      });
    });

    describe('ebitdaMargin recalculation', () => {
      it('should recalculate ebitdaMargin from ebitda/revenue', () => {
        const result = MonteCarloEngine.simulateScenario({
          baseMetrics,
          drivers: [
            {
              name: 'rev',
              distribution: { name: 'rev', type: 'uniform', min: -5, max: 5 },
              targetMetric: 'revenue',
              impactType: 'percentage',
            },
          ],
          iterations: 100,
          confidenceLevel: 0.95,
          seed: 42,
        });
        // ebitdaMargin should be recalculated
        expect(result.metrics.ebitdaMargin.stdDev).toBeGreaterThan(0);
      });
    });

    describe('deterministic with seed', () => {
      it('should produce identical results with same seed', () => {
        const config: ScenarioMonteCarloConfig = {
          baseMetrics,
          drivers: [
            {
              name: 'growth',
              distribution: { name: 'growth', type: 'normal', mean: 5, stdDev: 3 },
              targetMetric: 'revenue',
              impactType: 'percentage',
            },
          ],
          iterations: 100,
          confidenceLevel: 0.95,
          seed: 999,
        };
        const r1 = MonteCarloEngine.simulateScenario(config);
        const r2 = MonteCarloEngine.simulateScenario(config);
        expect(r1.netIncome.values).toEqual(r2.netIncome.values);
        expect(r1.probabilityOfProfit).toBe(r2.probabilityOfProfit);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Distribution validation
  // ---------------------------------------------------------------------------

  describe('validateDistribution', () => {
    it('should validate normal distribution', () => {
      expect(() =>
        MonteCarloEngine.validateDistribution({
          name: 'n',
          type: 'normal',
          mean: 0,
          stdDev: -1,
        })
      ).toThrow('stdDev must be non-negative');
    });

    it('should validate uniform distribution', () => {
      expect(() =>
        MonteCarloEngine.validateDistribution({
          name: 'u',
          type: 'uniform',
          min: 10,
          max: 5,
        })
      ).toThrow('min must be less than max');
    });

    it('should require min/max for uniform', () => {
      expect(() =>
        MonteCarloEngine.validateDistribution({
          name: 'u',
          type: 'uniform',
        })
      ).toThrow('must have min and max');
    });

    it('should validate triangular distribution', () => {
      expect(() =>
        MonteCarloEngine.validateDistribution({
          name: 't',
          type: 'triangular',
          min: 10,
          max: 5,
          mode: 7,
        })
      ).toThrow('min must be less than max');
    });

    it('should validate beta distribution alpha', () => {
      expect(() =>
        MonteCarloEngine.validateDistribution({
          name: 'b',
          type: 'beta',
          alpha: -1,
          betaParam: 2,
        })
      ).toThrow('alpha must be positive');
    });

    it('should validate beta distribution betaParam', () => {
      expect(() =>
        MonteCarloEngine.validateDistribution({
          name: 'b',
          type: 'beta',
          alpha: 2,
          betaParam: 0,
        })
      ).toThrow('betaParam must be positive');
    });

    it('should validate exponential lambda', () => {
      expect(() =>
        MonteCarloEngine.validateDistribution({
          name: 'e',
          type: 'exponential',
          lambda: 0,
        })
      ).toThrow('lambda must be positive');
    });

    it('should validate poisson lambda', () => {
      expect(() =>
        MonteCarloEngine.validateDistribution({
          name: 'p',
          type: 'poisson',
          lambda: -5,
        })
      ).toThrow('lambda must be positive');
    });

    it('should validate lognormal stdDev', () => {
      expect(() =>
        MonteCarloEngine.validateDistribution({
          name: 'ln',
          type: 'lognormal',
          stdDev: -1,
        })
      ).toThrow('stdDev must be non-negative');
    });

    it('should pass valid distributions', () => {
      expect(() =>
        MonteCarloEngine.validateDistribution({
          name: 'n',
          type: 'normal',
          mean: 0,
          stdDev: 1,
        })
      ).not.toThrow();
      expect(() =>
        MonteCarloEngine.validateDistribution({
          name: 'u',
          type: 'uniform',
          min: 0,
          max: 1,
        })
      ).not.toThrow();
      expect(() =>
        MonteCarloEngine.validateDistribution({
          name: 't',
          type: 'triangular',
          min: 0,
          max: 1,
          mode: 0.5,
        })
      ).not.toThrow();
      expect(() =>
        MonteCarloEngine.validateDistribution({
          name: 'ln',
          type: 'lognormal',
          mean: 0,
          stdDev: 1,
        })
      ).not.toThrow();
      expect(() =>
        MonteCarloEngine.validateDistribution({
          name: 'b',
          type: 'beta',
          alpha: 2,
          betaParam: 5,
        })
      ).not.toThrow();
      expect(() =>
        MonteCarloEngine.validateDistribution({
          name: 'e',
          type: 'exponential',
          lambda: 1,
        })
      ).not.toThrow();
      expect(() =>
        MonteCarloEngine.validateDistribution({
          name: 'p',
          type: 'poisson',
          lambda: 5,
        })
      ).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // Correlated samples
  // ---------------------------------------------------------------------------

  describe('generateCorrelatedSamples', () => {
    it('should generate correct number of samples', () => {
      const samples = MonteCarloEngine.generateCorrelatedSamples(
        [
          { name: 'a', type: 'normal', mean: 0, stdDev: 1 },
          { name: 'b', type: 'normal', mean: 0, stdDev: 1 },
        ],
        [
          [1, 0.5],
          [0.5, 1],
        ],
        100,
        42
      );
      expect(samples).toHaveLength(100);
      expect(samples[0]!).toHaveProperty('a');
      expect(samples[0]!).toHaveProperty('b');
    });

    it('should throw if matrix rows mismatch', () => {
      expect(() =>
        MonteCarloEngine.generateCorrelatedSamples(
          [{ name: 'a', type: 'normal', mean: 0, stdDev: 1 }],
          [
            [1, 0],
            [0, 1],
          ],
          10
        )
      ).toThrow('correlationMatrix rows must match');
    });

    it('should throw if matrix is not square', () => {
      // 3 distributions but matrix has 3 rows with only 2 columns each
      expect(() =>
        MonteCarloEngine.generateCorrelatedSamples(
          [
            { name: 'a', type: 'normal', mean: 0, stdDev: 1 },
            { name: 'b', type: 'normal', mean: 0, stdDev: 1 },
            { name: 'c', type: 'normal', mean: 0, stdDev: 1 },
          ],
          [
            [1, 0],
            [0, 1],
            [0.5, 0.5],
          ],
          10
        )
      ).toThrow('correlationMatrix must be square');
    });

    it('should produce correlated samples with identity matrix', () => {
      const samples = MonteCarloEngine.generateCorrelatedSamples(
        [
          { name: 'x', type: 'uniform', min: 0, max: 100 },
          { name: 'y', type: 'uniform', min: 0, max: 100 },
        ],
        [
          [1, 0],
          [0, 1],
        ],
        1000,
        42
      );
      // With identity matrix, samples should be independent
      expect(samples.length).toBe(1000);
    });
  });

  // ---------------------------------------------------------------------------
  // createRunner
  // ---------------------------------------------------------------------------

  describe('createRunner', () => {
    it('should create a reusable runner', () => {
      const runner = MonteCarloEngine.createRunner({
        iterations: 100,
        confidenceLevel: 0.95,
        assumptions: [{ name: 'x', type: 'uniform', min: 0, max: 100 }],
        model: sumModel,
      });
      const r1 = runner.run(42);
      const r2 = runner.run(42);
      expect(r1.values).toEqual(r2.values);
    });

    it('should produce different results with different seeds', () => {
      const runner = MonteCarloEngine.createRunner({
        iterations: 100,
        confidenceLevel: 0.95,
        assumptions: [{ name: 'x', type: 'uniform', min: 0, max: 100 }],
        model: sumModel,
      });
      const r1 = runner.run(1);
      const r2 = runner.run(2);
      expect(r1.values).not.toEqual(r2.values);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  describe('edge cases', () => {
    it('should handle single iteration', () => {
      const result = MonteCarloEngine.simulate({
        iterations: 1,
        confidenceLevel: 0.95,
        assumptions: [{ name: 'x', type: 'uniform', min: 5, max: 10 }],
        model: sumModel,
        seed: 42,
      });
      expect(result.iterations).toBe(1);
      expect(result.values).toHaveLength(1);
      expect(result.histogram).toHaveLength(1);
    });

    it('should handle identical values (zero variance)', () => {
      const result = MonteCarloEngine.simulate({
        iterations: 10,
        confidenceLevel: 0.95,
        assumptions: [{ name: 'x', type: 'uniform', min: 5, max: 5.0001 }],
        model: () => 42, // constant model
        seed: 42,
      });
      expect(result.stdDev).toBe(0);
      expect(result.skewness).toBe(0);
      expect(result.kurtosis).toBe(0);
    });

    it('should handle very small confidence level', () => {
      const result = MonteCarloEngine.simulate({
        iterations: 100,
        confidenceLevel: 0.01,
        assumptions: [{ name: 'x', type: 'uniform', min: 0, max: 100 }],
        model: sumModel,
        seed: 42,
      });
      expect(result.confidenceInterval.level).toBe(0.01);
    });

    it('should handle large number of assumptions', () => {
      const assumptions: DistributionConfig[] = Array.from({ length: 20 }, (_, i) => ({
        name: `var_${i}`,
        type: 'uniform' as const,
        min: 0,
        max: 10,
      }));
      const result = MonteCarloEngine.simulate({
        iterations: 100,
        confidenceLevel: 0.95,
        assumptions,
        model: sumModel,
        seed: 42,
      });
      // Sum of 20 uniform(0,10) ~ mean 100
      expect(result.mean).toBeGreaterThan(80);
      expect(result.mean).toBeLessThan(120);
    });

    it('should handle mixed distribution types in one simulation', () => {
      const result = MonteCarloEngine.simulate({
        iterations: 100,
        confidenceLevel: 0.95,
        assumptions: [
          { name: 'normal', type: 'normal', mean: 100, stdDev: 10 },
          { name: 'uniform', type: 'uniform', min: 0, max: 50 },
          { name: 'triangular', type: 'triangular', min: 0, max: 100, mode: 50 },
          { name: 'lognormal', type: 'lognormal', mean: 0, stdDev: 0.5 },
          { name: 'exponential', type: 'exponential', lambda: 2 },
        ],
        model: sumModel,
        seed: 42,
      });
      expect(result.iterations).toBe(100);
      expect(result.values).toHaveLength(100);
    });
  });
});
