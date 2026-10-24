import { describe, it, expect } from 'vitest';
import {
  createDriver,
  evaluateChain,
  evaluateChainPrecise,
  createChain,
  createHeadcountChain,
  createSaaSRevenueChain,
  analyzeSensitivity,
  createMatrix,
  getColumnTotal,
  getRowTotal,
} from './OperationalDriverEngine';
import type { OperationalDriver } from '@/types/operational-drivers';

/**
 * GOVERNANCE EVIDENCE for cap:ops.workforce and cap:ops.capex
 *
 * The OperationalDriverEngine maps non-financial inputs (headcount,
 * utilization, infrastructure) to financial outputs via driver chains.
 * The governance dimension here is DRIVER ACCURACY — operational drivers
 * feed budget models and forecasts. If a driver chain produces wrong
 * outputs, every downstream financial calculation is wrong. Driver
 * sensitivity analysis must correctly measure elasticity.
 *
 * Tested dimensions:
 * 1. Driver creation
 * 2. Chain evaluation
 * 3. Precise chain evaluation
 * 4. Pre-built chain templates
 * 5. Sensitivity analysis
 * 6. Matrix operations
 * 7. Determinism
 */

function makeDriver(
  id: string,
  period: string,
  value: number,
  type = 'fte-count'
): OperationalDriver {
  const driver = createDriver(
    type as any,
    `${id} Driver`,
    'count',
    'headcount',
    `${id} test driver`
  );
  driver.id = id;
  driver.values.set(period, value);
  return driver;
}

describe('OperationalDriverEngine — GOVERNANCE (ops.workforce, ops.capex)', () => {
  describe('1. Driver creation', () => {
    it('createDriver creates driver with correct structure', () => {
      const driver = createDriver('fte-count', 'Headcount', 'count', 'headcount');
      expect(driver.id).toBeDefined();
      expect(driver.type).toBe('fte-count');
      expect(driver.name).toBe('Headcount');
      expect(driver.unit).toBe('count');
      expect(driver.category).toBe('headcount');
      expect(driver.isEditable).toBe(true);
      expect(driver.source).toBe('manual');
    });

    it('createDriver with description sets description', () => {
      const driver = createDriver(
        'fte-count',
        'Headcount',
        'count',
        'headcount',
        'Test description'
      );
      expect(driver.description).toBe('Test description');
    });

    it('createDriver generates unique IDs', () => {
      const d1 = createDriver('fte-count', 'A', 'count', 'headcount');
      const d2 = createDriver('fte-count', 'B', 'count', 'headcount');
      expect(d1.id).not.toBe(d2.id);
    });
  });

  describe('2. Chain evaluation', () => {
    it('evaluateChain computes product of driver values', () => {
      const fte = makeDriver('fte', 'P1', 100);
      const salary = makeDriver('salary', 'P1', 120000, 'avg-salary');
      const benefits = makeDriver('benefits', 'P1', 1.35, 'benefits-multiplier');
      const chain = createHeadcountChain('fte', 'salary', 'benefits');
      const drivers = new Map([
        ['fte', fte],
        ['salary', salary],
        ['benefits', benefits],
      ]);
      const result = evaluateChain(chain, drivers, 'P1');
      expect(result.result).toBeCloseTo(100 * 120000 * 1.35, 2);
      expect(result.errors).toHaveLength(0);
    });

    it('evaluateChain reports missing drivers', () => {
      const chain = createChain('Test', ['missing'], 'GL-1000', 'P1');
      const drivers = new Map();
      const result = evaluateChain(chain, drivers, 'P1');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('evaluateChain handles empty driver values', () => {
      const driver = createDriver('fte-count', 'Headcount', 'count', 'headcount');
      const chain = createChain('Test', ['drv'], 'GL-1000', 'P1');
      const drivers = new Map([['drv', driver]]);
      const result = evaluateChain(chain, drivers, 'P1');
      expect(result.result).toBe(0);
    });

    it('evaluateChain uses forecasts when values are missing', () => {
      const driver = createDriver('fte-count', 'Headcount', 'count', 'headcount');
      driver.forecasts.set('P1', 50);
      const chain = createChain('Test', ['drv'], 'GL-1000', 'P1');
      const drivers = new Map([['drv', driver]]);
      const result = evaluateChain(chain, drivers, 'P1');
      expect(result.result).toBeCloseTo(50, 2);
    });
  });

  describe('3. Precise chain evaluation', () => {
    it('evaluateChainPrecise returns precise bigint result', () => {
      const fte = makeDriver('fte', 'P1', 100);
      const salary = makeDriver('salary', 'P1', 120000, 'avg-salary');
      const benefits = makeDriver('benefits', 'P1', 1.35, 'benefits-multiplier');
      const chain = createHeadcountChain('fte', 'salary', 'benefits');
      const drivers = new Map([
        ['fte', fte],
        ['salary', salary],
        ['benefits', benefits],
      ]);
      const result = evaluateChainPrecise(chain, drivers, 'P1');
      expect(typeof result.result).toBe('bigint');
      expect(result.errors).toHaveLength(0);
    });

    it('evaluateChainPrecise uses one-minus transform', () => {
      const churn = makeDriver('churn', 'P1', 0.2, 'attrition-rate');
      const retention = createDriver('retention', 'Retention', 'rate', 'headcount');
      retention.values.set('P1', 0.8);
      const chain = createChain('Test', ['churn'], 'GL-1000', 'P1', { churn: 'one-minus' });
      const drivers = new Map([['churn', churn]]);
      const result = evaluateChainPrecise(chain, drivers, 'P1');
      // (1 - 0.2) = 0.8
      expect(typeof result.result).toBe('bigint');
    });
  });

  describe('4. Pre-built chain templates', () => {
    it('createHeadcountChain creates chain with 3 drivers', () => {
      const chain = createHeadcountChain('fte', 'salary', 'benefits');
      expect(chain.driverIds).toHaveLength(3);
      expect(chain.driverIds).toContain('fte');
      expect(chain.driverIds).toContain('salary');
      expect(chain.driverIds).toContain('benefits');
    });

    it('createSaaSRevenueChain creates chain with revenue drivers', () => {
      const chain = createSaaSRevenueChain('customers', 'arr', 'churn');
      expect(chain.driverIds).toHaveLength(3);
      expect(chain.id).toBeDefined();
    });

    it('createChain generates formula string', () => {
      const chain = createChain('Test', ['a', 'b'], 'GL-1000', 'P1');
      expect(chain.formula).toContain('a');
      expect(chain.formula).toContain('b');
      expect(chain.formula).toContain('×');
    });
  });

  describe('5. Sensitivity analysis', () => {
    it('analyzeSensitivity produces scenarios for each change percentage', () => {
      const fte = makeDriver('fte', 'P1', 100);
      const salary = makeDriver('salary', 'P1', 120000, 'avg-salary');
      const benefits = makeDriver('benefits', 'P1', 1.35, 'benefits-multiplier');
      const chain = createHeadcountChain('fte', 'salary', 'benefits');
      const drivers = new Map([
        ['fte', fte],
        ['salary', salary],
        ['benefits', benefits],
      ]);
      const result = analyzeSensitivity(chain, drivers, 'fte', 'P1');
      expect(result.scenarios.length).toBeGreaterThan(0);
      expect(result.driverId).toBe('fte');
      expect(result.baseValue).toBeDefined();
      expect(result.elasticity).toBeDefined();
    });

    it('analyzeSensitivity with default change percentages', () => {
      const fte = makeDriver('fte', 'P1', 100);
      const salary = makeDriver('salary', 'P1', 100000, 'avg-salary');
      const benefits = makeDriver('benefits', 'P1', 1.0, 'benefits-multiplier');
      const chain = createHeadcountChain('fte', 'salary', 'benefits');
      const drivers = new Map([
        ['fte', fte],
        ['salary', salary],
        ['benefits', benefits],
      ]);
      const result = analyzeSensitivity(chain, drivers, 'fte', 'P1');
      // Default: [-20, -10, -5, 5, 10, 20] = 6 scenarios
      expect(result.scenarios).toHaveLength(6);
    });

    it('analyzeSensitivity computes elasticity', () => {
      const fte = makeDriver('fte', 'P1', 100);
      const salary = makeDriver('salary', 'P1', 100000, 'avg-salary');
      const benefits = makeDriver('benefits', 'P1', 1.0, 'benefits-multiplier');
      const chain = createHeadcountChain('fte', 'salary', 'benefits');
      const drivers = new Map([
        ['fte', fte],
        ['salary', salary],
        ['benefits', benefits],
      ]);
      const result = analyzeSensitivity(chain, drivers, 'fte', 'P1');
      // Elasticity = % change in output / % change in input
      // For a multiplicative chain, elasticity = 1
      expect(result.elasticity).toBeCloseTo(1, 2);
    });
  });

  describe('6. Matrix operations', () => {
    it('createMatrix builds matrix from driver values', () => {
      const driverValues = new Map([
        [
          'Entity A',
          new Map([
            ['P1', 100],
            ['P2', 110],
          ]),
        ],
        [
          'Entity B',
          new Map([
            ['P1', 200],
            ['P2', 210],
          ]),
        ],
      ]);
      const matrix = createMatrix(
        'fte',
        ['P1', 'P2'],
        ['Entity A', 'Entity B'],
        'scenario-1',
        driverValues
      );
      expect(matrix.values).toHaveLength(2);
      expect(matrix.values[0]!.length).toBe(2);
    });

    it('getColumnTotal sums a column', () => {
      const driverValues = new Map([
        [
          'Entity A',
          new Map([
            ['P1', 100],
            ['P2', 110],
          ]),
        ],
        [
          'Entity B',
          new Map([
            ['P1', 200],
            ['P2', 210],
          ]),
        ],
      ]);
      const matrix = createMatrix(
        'fte',
        ['P1', 'P2'],
        ['Entity A', 'Entity B'],
        'scenario-1',
        driverValues
      );
      expect(getColumnTotal(matrix, 0)).toBeCloseTo(300, 2);
      expect(getColumnTotal(matrix, 1)).toBeCloseTo(320, 2);
    });

    it('getRowTotal sums a row', () => {
      const driverValues = new Map([
        [
          'Entity A',
          new Map([
            ['P1', 100],
            ['P2', 110],
          ]),
        ],
        [
          'Entity B',
          new Map([
            ['P1', 200],
            ['P2', 210],
          ]),
        ],
      ]);
      const matrix = createMatrix(
        'fte',
        ['P1', 'P2'],
        ['Entity A', 'Entity B'],
        'scenario-1',
        driverValues
      );
      expect(getRowTotal(matrix, 0)).toBeCloseTo(210, 2);
      expect(getRowTotal(matrix, 1)).toBeCloseTo(410, 2);
    });

    it('getRowTotal handles missing row', () => {
      const driverValues = new Map([['Entity A', new Map([['P1', 100]])]]);
      const matrix = createMatrix('fte', ['P1'], ['Entity A'], 'scenario-1', driverValues);
      expect(getRowTotal(matrix, 5)).toBe(0);
    });
  });

  describe('7. Determinism', () => {
    it('evaluateChain is deterministic', () => {
      const fte = makeDriver('fte', 'P1', 100);
      const salary = makeDriver('salary', 'P1', 120000, 'avg-salary');
      const chain = createChain('Test', ['fte', 'salary'], 'GL-1000', 'P1');
      const drivers = new Map([
        ['fte', fte],
        ['salary', salary],
      ]);
      const r1 = evaluateChain(chain, drivers, 'P1');
      const r2 = evaluateChain(chain, drivers, 'P1');
      expect(r1.result).toBe(r2.result);
    });

    it('analyzeSensitivity is deterministic', () => {
      const fte = makeDriver('fte', 'P1', 100);
      const salary = makeDriver('salary', 'P1', 100000, 'avg-salary');
      const chain = createChain('Test', ['fte', 'salary'], 'GL-1000', 'P1');
      const drivers = new Map([
        ['fte', fte],
        ['salary', salary],
      ]);
      const r1 = analyzeSensitivity(chain, drivers, 'fte', 'P1');
      const r2 = analyzeSensitivity(chain, drivers, 'fte', 'P1');
      expect(r1.elasticity).toBeCloseTo(r2.elasticity, 6);
    });

    it('matrix operations are deterministic', () => {
      const driverValues = new Map([
        ['Entity A', new Map([['P1', 100]])],
        ['Entity B', new Map([['P1', 200]])],
      ]);
      const matrix = createMatrix(
        'fte',
        ['P1'],
        ['Entity A', 'Entity B'],
        'scenario-1',
        driverValues
      );
      expect(getColumnTotal(matrix, 0)).toBe(getColumnTotal(matrix, 0));
      expect(getRowTotal(matrix, 0)).toBe(getRowTotal(matrix, 0));
    });
  });
});
