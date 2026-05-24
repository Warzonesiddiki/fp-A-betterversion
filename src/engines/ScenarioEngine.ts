import type { ScenarioMetrics, GLEntry } from '@/types';

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
  static calculateBaseMetrics(entries: GLEntry[]): ScenarioMetrics {
    const revenue = entries
      .filter((e) => (e.accountCode || '').startsWith('4'))
      .reduce((s, e) => s + (e.debit - e.credit), 0);

    const cogs = entries
      .filter((e) => (e.accountCode || '').startsWith('5'))
      .reduce((s, e) => s + Math.abs(e.debit - e.credit), 0);

    const opex = entries
      .filter((e) => (e.accountCode || '').startsWith('6'))
      .reduce((s, e) => s + Math.abs(e.debit - e.credit), 0);

    const grossProfit = revenue - cogs;
    const ebitda = grossProfit - opex;
    const netIncome = ebitda; // Simplified for scenario modeling

    return {
      revenue: Math.abs(revenue),
      ebitda: ebitda,
      netIncome: netIncome,
      cashFlow: ebitda * 0.8, // Simplified cash conversion
      headcount: 100, // Mocked base headcount
      burnRate: opex / 12,
      runway: 18,
      grossMargin: revenue !== 0 ? (grossProfit / revenue) * 100 : 0,
      ebitdaMargin: revenue !== 0 ? (ebitda / revenue) * 100 : 0,
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

    const result = { ...base };

    drivers
      .filter((d) => d.isActive)
      .forEach((driver) => {
        const multiplier = driver.impactType === 'percentage' ? 1 + driver.value / 100 : 1;
        const absolute = driver.impactType === 'absolute' ? driver.value : 0;

        switch (driver.type) {
          case 'revenue':
            result.revenue = result.revenue * multiplier + absolute;
            break;
          case 'expense':
            result.ebitda -= base.revenue * (multiplier - 1) + absolute;
            break;
          case 'margin':
            result.grossMargin = result.grossMargin + driver.value;
            break;
        }
      });

    // Recalculate margins and net income based on adjusted revenue/ebitda
    result.netIncome = result.ebitda;
    result.ebitdaMargin = result.revenue !== 0 ? (result.ebitda / result.revenue) * 100 : 0;

    return result;
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
      const ratioLow = input.baseValue === 0 ? 1 : input.lowValue / input.baseValue;
      const ratioHigh = input.baseValue === 0 ? 1 : input.highValue / input.baseValue;

      const apply = (metrics: ScenarioMetrics, ratio: number): ScenarioMetrics => ({
        revenue: metrics.revenue * ratio,
        ebitda: metrics.ebitda * ratio,
        netIncome: metrics.netIncome * ratio,
        cashFlow: metrics.cashFlow * ratio,
        headcount: Math.round(metrics.headcount * ratio),
        burnRate: metrics.burnRate * ratio,
        runway: metrics.runway / ratio,
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

    const totalProb = scenarios.reduce((acc, s) => acc + s.probability, 0);
    const weight = totalProb === 0 ? 0 : 1 / totalProb;

    const result = {
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

    scenarios.forEach((s) => {
      const p = s.probability * weight;
      result.revenue += s.metrics.revenue * p;
      result.ebitda += s.metrics.ebitda * p;
      result.netIncome += s.metrics.netIncome * p;
      result.cashFlow += s.metrics.cashFlow * p;
      result.headcount += s.metrics.headcount * p;
      result.burnRate += s.metrics.burnRate * p;
      result.runway += s.metrics.runway * p;
      result.grossMargin += s.metrics.grossMargin * p;
      result.ebitdaMargin += s.metrics.ebitdaMargin * p;
    });

    return result;
  }
}
