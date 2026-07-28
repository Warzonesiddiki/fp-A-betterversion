/**
 * Operational Driver Engine — Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createDriver,
  evaluateChain,
  evaluateChainPrecise,
  createChain,
  createHeadcountChain,
  analyzeSensitivity,
  createMatrix,
  getColumnTotal,
  getRowTotal,
} from '../OperationalDriverEngine';
import type { OperationalDriver } from '@/types/operational-drivers';

describe('OperationalDriverEngine', () => {
  const fteDriver = createDriver('fte-count', 'Engineering FTEs', 'FTE', 'headcount');
  const salaryDriver = createDriver('avg-salary', 'Avg Salary', '$/year', 'headcount');
  const benefitsDriver = createDriver(
    'benefits-multiplier',
    'Benefits Multiplier',
    'ratio',
    'headcount'
  );

  // Set values for Jan 2026
  const drivers = new Map<string, OperationalDriver>();
  const fteWithValues = { ...fteDriver, values: new Map([['2026-01', 100]]) };
  const salaryWithValues = { ...salaryDriver, values: new Map([['2026-01', 120000]]) };
  const benefitsWithValues = { ...benefitsDriver, values: new Map([['2026-01', 1.35]]) };
  drivers.set(fteDriver.id, fteWithValues);
  drivers.set(salaryDriver.id, salaryWithValues);
  drivers.set(benefitsDriver.id, benefitsWithValues);

  describe('createDriver', () => {
    it('creates a driver with correct properties', () => {
      expect(fteDriver.type).toBe('fte-count');
      expect(fteDriver.name).toBe('Engineering FTEs');
      expect(fteDriver.unit).toBe('FTE');
      expect(fteDriver.category).toBe('headcount');
      expect(fteDriver.isEditable).toBe(true);
      expect(fteDriver.id).toBeTruthy();
    });
  });

  describe('evaluateChain', () => {
    it('evaluates headcount compensation chain', () => {
      const chain = createHeadcountChain(
        fteDriver.id,
        salaryDriver.id,
        benefitsDriver.id,
        '2026-01'
      );

      const result = evaluateChain(chain, drivers, '2026-01');

      // 100 × 120000 × 1.35 = 16,200,000
      expect(result.result).toBeCloseTo(16200000, -3);
      expect(result.errors).toHaveLength(0);
      expect(Object.keys(result.driverValues)).toHaveLength(3);
    });

    it('reports errors for missing drivers', () => {
      const chain = createChain('Test', ['missing-driver'], 'test', '2026-01');
      const result = evaluateChain(chain, drivers, '2026-01');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('not found');
    });
  });

  describe('evaluateChainPrecise', () => {
    it('evaluates with precise arithmetic', () => {
      const chain = createHeadcountChain(
        fteDriver.id,
        salaryDriver.id,
        benefitsDriver.id,
        '2026-01'
      );

      const result = evaluateChainPrecise(chain, drivers, '2026-01');
      expect(result.result).toBeGreaterThan(0n);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('sensitivity analysis', () => {
    it('calculates sensitivity for driver changes', () => {
      const chain = createHeadcountChain(
        fteDriver.id,
        salaryDriver.id,
        benefitsDriver.id,
        '2026-01'
      );

      const sensitivity = analyzeSensitivity(chain, drivers, fteDriver.id, '2026-01', [-10, 10]);

      expect(sensitivity.driverId).toBe(fteDriver.id);
      expect(sensitivity.scenarios).toHaveLength(2);
      expect(sensitivity.scenarios[0]!.changePercent).toBe(-10);
      expect(sensitivity.scenarios[1]!.changePercent).toBe(10);
      // Elasticity should be ~1 (linear relationship)
      expect(sensitivity.elasticity).toBeCloseTo(1, 0);
    });
  });

  describe('driver matrix', () => {
    it('creates and queries a matrix', () => {
      const periods = ['2026-01', '2026-02'];
      const entities = ['Engineering', 'Sales'];
      const values = new Map([
        [
          'Engineering',
          new Map([
            ['2026-01', 100],
            ['2026-02', 110],
          ]),
        ],
        [
          'Sales',
          new Map([
            ['2026-01', 50],
            ['2026-02', 55],
          ]),
        ],
      ]);

      const matrix = createMatrix(fteDriver.id, periods, entities, 'base', values);

      expect(matrix.periods).toEqual(periods);
      expect(matrix.entities).toEqual(entities);
      expect(matrix.values).toHaveLength(2);
      expect(matrix.values[0]).toEqual([100, 110]);
      expect(matrix.values[1]).toEqual([50, 55]);

      expect(getColumnTotal(matrix, 0)).toBe(150); // Jan total
      expect(getRowTotal(matrix, 0)).toBe(210); // Engineering total
    });
  });
});
