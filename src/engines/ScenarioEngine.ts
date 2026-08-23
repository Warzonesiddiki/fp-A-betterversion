import type Decimal from 'decimal.js';
import type { ScenarioMetrics, GLEntry } from '@/types';
import {
  toDecimal,
  roundTo,
  sumMoney,
  addMoney,
  subtractMoney,
  multiplyMoney,
  divideMoney,
} from '../utils/money';

/**
 * Currency amounts are rounded to cents; ratio/margin/percentage outputs keep
 * more precision (they are ratios, not settleable money) but are still produced
 * by exact decimal arithmetic so they do not inherit IEEE-754 drift.
 */
const CURRENCY_PLACES = 2;
const RATIO_PLACES = 10;

export interface Distribution {
  name: string;
  type: 'normal' | 'uniform' | 'triangular';
  mean?: number;
  stdDev?: number;
  min?: number;
  max?: number;
  mode?: number;
}

export interface SimulationResult {
  iteration: number;
  values: Record<string, number>;
  output: number;
}

export interface SensitivityInput {
  name: string;
  baseValue: number;
  lowValue: number;
  highValue: number;
}

export interface TornadoItem {
  name: string;
  lowImpact: number;
  highImpact: number;
  range: number;
}

export interface ScenarioDriver {
  id: string;
  name: string;
  type: 'revenue' | 'expense' | 'headcount' | 'margin';
  impactType: 'percentage' | 'absolute';
  value: number;
  isActive: boolean;
}

export class ScenarioEngine {
  /**
   * Derive scenario base metrics from GL entries.
   *
   * BASIS OF PREPARATION (K17/K18 honesty):
   * - revenue, cogs, opex and both margins are DERIVED from posted GL
   *   account-prefix activity.
   * - netIncome equals EBITDA by simplification: this simulator splits out no
   *   tax or interest lines.
   * - cashFlow is a simplified conversion at 80% of EBITDA — not measured
   *   cash movement.
   * - burnRate is the monthly average of posted OpEx (opex ÷ 12), not a
   *   forward-looking burn forecast.
   * - headcount is a SIMULATOR BASE ASSUMPTION (user-editable driver input),
   *   seeded so driver/WhatIf/sensitivity math has a base to scale — it is
   *   not a measured actual.
   * - runway is a SIMULATOR BASE ASSUMPTION held constant at 18 months — it
   *   is not derived from cash/burn runway arithmetic.
   *
   * The numeric defaults above are intentional simulation inputs and stay
   * intact; consumers that DISPLAY these figures must present them as
   * assumptions, not measured actuals.
   */
  static calculateBaseMetrics(entries: GLEntry[]): ScenarioMetrics {
    // All monetary arithmetic is routed through the canonical money primitive
    // (decimal.js-backed) so GL sums and derived metrics carry no IEEE-754 drift.
    const netOf = (prefix: string) =>
      sumMoney(
        entries
          .filter((e) => (e.accountCode || '').startsWith(prefix))
          .map((e) => subtractMoney(e.debit, e.credit))
      );

    const revenue = netOf('4');
    const cogs = netOf('5').abs();
    const opex = netOf('6').abs();

    const grossProfit = revenue.minus(cogs);
    const ebitda = grossProfit.minus(opex);
    // Simplification: net income equals EBITDA in this simulator — no tax or
    // interest lines are split out of the GL for scenario modeling.
    const netIncome = ebitda;

    return {
      revenue: roundTo(revenue.abs(), CURRENCY_PLACES),
      ebitda: roundTo(ebitda, CURRENCY_PLACES),
      netIncome: roundTo(netIncome, CURRENCY_PLACES),
      // Simulator base assumption — simplified cash conversion at 80% of
      // EBITDA; not measured cash movement.
      cashFlow: roundTo(multiplyMoney(ebitda, '0.8'), CURRENCY_PLACES),
      // Simulator base assumption (user-editable) — seeded so driver/WhatIf
      // math has a base to scale; NOT a measured actual.
      headcount: 100,
      // Simulator base assumption — monthly average of posted OpEx, not a
      // forward-looking burn forecast.
      burnRate: roundTo(divideMoney(opex, 12), CURRENCY_PLACES),
      // Simulator base assumption (constant 18 months) — not derived from
      // cash/burn runway arithmetic.
      runway: 18,
      grossMargin: revenue.isZero()
        ? 0
        : roundTo(divideMoney(grossProfit, revenue).times(100), RATIO_PLACES),
      ebitdaMargin: revenue.isZero()
        ? 0
        : roundTo(divideMoney(ebitda, revenue).times(100), RATIO_PLACES),
    };
  }

  static applyDrivers(base: ScenarioMetrics, drivers: ScenarioDriver[]): ScenarioMetrics {
    // Input validation
    if (!base || typeof base !== 'object') {
      throw new Error('base metrics must be an object');
    }
    if (!Array.isArray(drivers)) {
      throw new Error('drivers must be an array');
    }
    for (const driver of drivers) {
      if (!driver.id || typeof driver.id !== 'string') {
        throw new Error('Each driver must have a non-empty id');
      }
      if (!driver.name || typeof driver.name !== 'string') {
        throw new Error(`Driver "${driver.id}" must have a non-empty name`);
      }
      const validTypes = ['revenue', 'expense', 'headcount', 'margin'];
      if (!validTypes.includes(driver.type)) {
        throw new Error(`Driver "${driver.id}" type must be one of: ${validTypes.join(', ')}`);
      }
      const validImpactTypes = ['percentage', 'absolute'];
      if (!validImpactTypes.includes(driver.impactType)) {
        throw new Error(
          `Driver "${driver.id}" impactType must be one of: ${validImpactTypes.join(', ')}`
        );
      }
      if (typeof driver.value !== 'number' || !Number.isFinite(driver.value)) {
        throw new Error(`Driver "${driver.id}" value must be a finite number`);
      }
    }

    // Accumulate in exact decimals; round to cents once at the end so a chain
    // of driver applications cannot compound float error.
    let revenue = toDecimal(base.revenue, 'base.revenue');
    let ebitda = toDecimal(base.ebitda, 'base.ebitda');
    let grossMargin = toDecimal(base.grossMargin, 'base.grossMargin');
    const baseRevenue = toDecimal(base.revenue, 'base.revenue');

    drivers
      .filter((d) => d.isActive)
      .forEach((driver) => {
        const multiplier =
          driver.impactType === 'percentage'
            ? addMoney(1, divideMoney(driver.value, 100))
            : toDecimal(1);
        const absolute = driver.impactType === 'absolute' ? toDecimal(driver.value) : toDecimal(0);

        switch (driver.type) {
          case 'revenue':
            revenue = revenue.times(multiplier).plus(absolute);
            break;
          case 'expense':
            ebitda = ebitda.minus(baseRevenue.times(multiplier.minus(1)).plus(absolute));
            break;
          case 'margin':
            grossMargin = grossMargin.plus(toDecimal(driver.value));
            break;
        }
      });

    // Recalculate margins and net income based on adjusted revenue/ebitda
    return {
      ...base,
      revenue: roundTo(revenue, CURRENCY_PLACES),
      ebitda: roundTo(ebitda, CURRENCY_PLACES),
      netIncome: roundTo(ebitda, CURRENCY_PLACES),
      grossMargin: roundTo(grossMargin, RATIO_PLACES),
      ebitdaMargin: revenue.isZero()
        ? 0
        : roundTo(divideMoney(ebitda, revenue).times(100), RATIO_PLACES),
    };
  }

  static monteCarlo(
    assumptions: Distribution[],
    iterations: number,
    randomFn: () => number = Math.random
  ): SimulationResult[] {
    // Input validation
    if (!Array.isArray(assumptions)) {
      throw new Error('assumptions must be an array');
    }
    if (typeof iterations !== 'number' || !Number.isFinite(iterations)) {
      throw new Error('iterations must be a finite number');
    }
    if (iterations < 0) {
      throw new Error('iterations cannot be negative');
    }
    if (iterations > 1000000) {
      throw new Error('iterations cannot exceed 1,000,000');
    }
    for (const assumption of assumptions) {
      if (!assumption.name || typeof assumption.name !== 'string') {
        throw new Error('Each assumption must have a non-empty name');
      }
      const validTypes = ['normal', 'uniform', 'triangular'];
      if (!validTypes.includes(assumption.type)) {
        throw new Error(
          `Assumption "${assumption.name}" type must be one of: ${validTypes.join(', ')}`
        );
      }
      if (
        assumption.type === 'normal' &&
        (typeof assumption.mean !== 'number' || !Number.isFinite(assumption.mean))
      ) {
        throw new Error(
          `Assumption "${assumption.name}" mean must be a finite number for normal distribution`
        );
      }
      if (
        assumption.type === 'normal' &&
        (typeof assumption.stdDev !== 'number' || assumption.stdDev < 0)
      ) {
        throw new Error(
          `Assumption "${assumption.name}" stdDev must be a non-negative number for normal distribution`
        );
      }
      if (
        assumption.type === 'uniform' &&
        (typeof assumption.min !== 'number' || typeof assumption.max !== 'number')
      ) {
        throw new Error(
          `Assumption "${assumption.name}" must have min and max for uniform distribution`
        );
      }
      if (assumption.type === 'uniform' && assumption.min! >= assumption.max!) {
        throw new Error(`Assumption "${assumption.name}" min must be less than max`);
      }
    }

    if (iterations <= 0 || assumptions.length === 0) return [];

    const results: SimulationResult[] = [];

    const getSample = (dist: Distribution): number => {
      const r = randomFn();
      switch (dist.type) {
        case 'uniform':
          return (dist.min ?? 0) + r * ((dist.max ?? 1) - (dist.min ?? 0));
        case 'normal': {
          const u1 = randomFn();
          const u2 = randomFn();
          const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
          return (dist.mean ?? 0) + z0 * (dist.stdDev ?? 1);
        }
        case 'triangular': {
          const a = dist.min ?? 0;
          const b = dist.max ?? 1;
          const c = dist.mode ?? 0.5;
          const fc = (c - a) / (b - a);
          if (r < fc) return a + Math.sqrt(r * (b - a) * (c - a));
          return b - Math.sqrt((1 - r) * (b - a) * (b - c));
        }
        default:
          return dist.mean ?? 0;
      }
    };

    for (let i = 0; i < iterations; i++) {
      const values: Record<string, number> = {};
      let output = 0;
      assumptions.forEach((a) => {
        const val = getSample(a);
        values[a.name] = val;
        output += val;
      });
      results.push({ iteration: i + 1, values, output });
    }

    return results;
  }

  static sensitivityAnalysis(
    baseCase: ScenarioMetrics,
    inputs: SensitivityInput[]
  ): { name: string; lowImpact: ScenarioMetrics; highImpact: ScenarioMetrics }[] {
    return inputs.map((input) => {
      const base = toDecimal(input.baseValue, 'baseValue');
      const ratioLow = base.isZero() ? toDecimal(1) : divideMoney(input.lowValue, base);
      const ratioHigh = base.isZero() ? toDecimal(1) : divideMoney(input.highValue, base);

      const apply = (metrics: ScenarioMetrics, ratio: Decimal): ScenarioMetrics => ({
        revenue: roundTo(multiplyMoney(metrics.revenue, ratio), CURRENCY_PLACES),
        ebitda: roundTo(multiplyMoney(metrics.ebitda, ratio), CURRENCY_PLACES),
        netIncome: roundTo(multiplyMoney(metrics.netIncome, ratio), CURRENCY_PLACES),
        cashFlow: roundTo(multiplyMoney(metrics.cashFlow, ratio), CURRENCY_PLACES),
        headcount: Math.round(multiplyMoney(metrics.headcount, ratio).toNumber()),
        burnRate: roundTo(multiplyMoney(metrics.burnRate, ratio), CURRENCY_PLACES),
        // A zero ratio makes runway undefined; surface it rather than emitting Infinity.
        runway: ratio.isZero() ? 0 : roundTo(divideMoney(metrics.runway, ratio), RATIO_PLACES),
        grossMargin: metrics.grossMargin,
        ebitdaMargin: metrics.ebitdaMargin,
      });

      return {
        name: input.name,
        lowImpact: apply(baseCase, ratioLow),
        highImpact: apply(baseCase, ratioHigh),
      };
    });
  }

  static tornadoChart(inputs: SensitivityInput[]): TornadoItem[] {
    return inputs
      .map((input) => ({
        name: input.name,
        lowImpact: input.lowValue,
        highImpact: input.highValue,
        range: Math.abs(input.highValue - input.lowValue),
      }))
      .sort((a, b) => b.range - a.range);
  }

  static probabilityWeighted(
    scenarios: { metrics: ScenarioMetrics; probability: number }[]
  ): ScenarioMetrics {
    if (scenarios.length === 0) {
      return {
        revenue: 0,
        ebitda: 0,
        netIncome: 0,
        cashFlow: 0,
        headcount: 0,
        burnRate: 0,
        runway: 0,
        grossMargin: 0,
        ebitdaMargin: 0,
      };
    }

    const totalProb = sumMoney(scenarios.map((s) => s.probability));

    // Probability-weighted expectation. Weights are normalised by the exact
    // probability total, so scenarios that do not sum to 1 still combine
    // correctly and the parts sum back to the whole without float residue.
    const acc = {
      revenue: toDecimal(0),
      ebitda: toDecimal(0),
      netIncome: toDecimal(0),
      cashFlow: toDecimal(0),
      headcount: toDecimal(0),
      burnRate: toDecimal(0),
      runway: toDecimal(0),
      grossMargin: toDecimal(0),
      ebitdaMargin: toDecimal(0),
    };

    if (!totalProb.isZero()) {
      scenarios.forEach((s) => {
        const p = divideMoney(s.probability, totalProb);
        acc.revenue = acc.revenue.plus(multiplyMoney(s.metrics.revenue, p));
        acc.ebitda = acc.ebitda.plus(multiplyMoney(s.metrics.ebitda, p));
        acc.netIncome = acc.netIncome.plus(multiplyMoney(s.metrics.netIncome, p));
        acc.cashFlow = acc.cashFlow.plus(multiplyMoney(s.metrics.cashFlow, p));
        acc.headcount = acc.headcount.plus(multiplyMoney(s.metrics.headcount, p));
        acc.burnRate = acc.burnRate.plus(multiplyMoney(s.metrics.burnRate, p));
        acc.runway = acc.runway.plus(multiplyMoney(s.metrics.runway, p));
        acc.grossMargin = acc.grossMargin.plus(multiplyMoney(s.metrics.grossMargin, p));
        acc.ebitdaMargin = acc.ebitdaMargin.plus(multiplyMoney(s.metrics.ebitdaMargin, p));
      });
    }

    return {
      revenue: roundTo(acc.revenue, CURRENCY_PLACES),
      ebitda: roundTo(acc.ebitda, CURRENCY_PLACES),
      netIncome: roundTo(acc.netIncome, CURRENCY_PLACES),
      cashFlow: roundTo(acc.cashFlow, CURRENCY_PLACES),
      headcount: roundTo(acc.headcount, RATIO_PLACES),
      burnRate: roundTo(acc.burnRate, CURRENCY_PLACES),
      runway: roundTo(acc.runway, RATIO_PLACES),
      grossMargin: roundTo(acc.grossMargin, RATIO_PLACES),
      ebitdaMargin: roundTo(acc.ebitdaMargin, RATIO_PLACES),
    };
  }

  static mergeScenarios(
    base: ScenarioMetrics,
    other: ScenarioMetrics,
    weight: number
  ): ScenarioMetrics {
    const w = toDecimal(Math.max(0, Math.min(1, weight)), 'weight');
    const invW = subtractMoney(1, w);

    // Exact linear blend: base×(1−w) + other×w. Because (1−w) is computed in
    // decimal, the two weights sum to exactly 1 and the blend is unbiased.
    const blend = (a: number, b: number) => multiplyMoney(a, invW).plus(multiplyMoney(b, w));

    return {
      revenue: roundTo(blend(base.revenue, other.revenue), CURRENCY_PLACES),
      ebitda: roundTo(blend(base.ebitda, other.ebitda), CURRENCY_PLACES),
      netIncome: roundTo(blend(base.netIncome, other.netIncome), CURRENCY_PLACES),
      cashFlow: roundTo(blend(base.cashFlow, other.cashFlow), CURRENCY_PLACES),
      headcount: Math.round(blend(base.headcount, other.headcount).toNumber()),
      burnRate: roundTo(blend(base.burnRate, other.burnRate), CURRENCY_PLACES),
      runway: roundTo(blend(base.runway, other.runway), RATIO_PLACES),
      grossMargin: roundTo(blend(base.grossMargin, other.grossMargin), RATIO_PLACES),
      ebitdaMargin: roundTo(blend(base.ebitdaMargin, other.ebitdaMargin), RATIO_PLACES),
    };
  }

  static lockScenario<T extends { isLocked: boolean; updatedAt: string }>(scenario: T): T {
    return { ...scenario, isLocked: true, updatedAt: new Date().toISOString() };
  }

  static unlockScenario<T extends { isLocked: boolean; updatedAt: string }>(scenario: T): T {
    return { ...scenario, isLocked: false, updatedAt: new Date().toISOString() };
  }
}
