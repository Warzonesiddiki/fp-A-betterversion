import { describe, it, expect } from 'vitest';
import { CapExEngine } from './CapExEngine';
import type { AssetInput } from '@/types/sector-types';

/**
 * GOVERNANCE EVIDENCE for cap:ops.capex
 *
 * The CapExEngine computes capital expenditure depreciation schedules and
 * investment metrics (NPV, IRR, payback period, ROI). The governance dimension
 * here is INVESTMENT ACCURACY — CapEx decisions involve significant capital
 * outlays and long-term depreciation. All amounts use the decimal.js money
 * primitive. Errors in CapEx calculations misstate asset values and
 * investment returns.
 *
 * Tested dimensions:
 * 1. Depreciation schedules (straight-line, double-declining, sum-of-years)
 * 2. Net present value (NPV)
 * 3. Internal rate of return (IRR)
 * 4. Payback period
 * 5. Return on investment (ROI)
 * 6. Money primitive safety
 * 7. Determinism
 */

function makeAsset(overrides: Partial<AssetInput> = {}): AssetInput {
  return {
    id: 'asset-1',
    name: 'Server Equipment',
    cost: 100000,
    salvageValue: 10000,
    usefulLife: 5,
    startDate: '2026-01-01',
    depreciationMethod: 'straight_line',
    ...overrides,
  };
}

describe('CapExEngine — GOVERNANCE (ops.capex)', () => {
  describe('1. Depreciation schedules', () => {
    it('calculateDepreciation produces schedule with correct number of periods', () => {
      const asset = makeAsset({ usefulLife: 5 });
      const schedule = CapExEngine.calculateDepreciation(asset);
      expect(schedule).toHaveLength(5);
    });

    it('straight-line depreciation has constant annual expense', () => {
      const asset = makeAsset({ usefulLife: 5 });
      const schedule = CapExEngine.calculateDepreciation(asset);
      const expense = schedule[0]!.depreciationExpense;
      for (const entry of schedule) {
        expect(entry.depreciationExpense).toBeCloseTo(expense, 2);
      }
    });

    it('straight-line depreciation expense equals (cost - salvage) / life', () => {
      const asset = makeAsset({ cost: 100000, salvageValue: 10000, usefulLife: 5 });
      const schedule = CapExEngine.calculateDepreciation(asset);
      // (100000 - 10000) / 5 = 18000
      expect(schedule[0]!.depreciationExpense).toBeCloseTo(18000, 2);
    });

    it('accumulated depreciation increases monotonically', () => {
      const asset = makeAsset({ usefulLife: 5 });
      const schedule = CapExEngine.calculateDepreciation(asset);
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i]!.accumulatedDepreciation).toBeGreaterThanOrEqual(
          schedule[i - 1]!.accumulatedDepreciation
        );
      }
    });

    it('book value decreases monotonically', () => {
      const asset = makeAsset({ usefulLife: 5 });
      const schedule = CapExEngine.calculateDepreciation(asset);
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i]!.bookValue).toBeLessThanOrEqual(schedule[i - 1]!.bookValue);
      }
    });

    it('final book value equals salvage value', () => {
      const asset = makeAsset({ salvageValue: 10000 });
      const schedule = CapExEngine.calculateDepreciation(asset);
      expect(schedule[schedule.length - 1]!.bookValue).toBeCloseTo(10000, 2);
    });

    it('double-declining depreciation produces schedule', () => {
      const asset = makeAsset({ depreciationMethod: 'double_declining' });
      const schedule = CapExEngine.calculateDepreciation(asset);
      expect(schedule).toHaveLength(5);
    });

    it('sum-of-years depreciation produces schedule', () => {
      const asset = makeAsset({ depreciationMethod: 'sum_of_years' });
      const schedule = CapExEngine.calculateDepreciation(asset);
      expect(schedule).toHaveLength(5);
    });
  });

  describe('2. Net present value (NPV)', () => {
    it('calculateNPV computes NPV for investment cash flows', () => {
      const npv = CapExEngine.calculateNPV([-100000, 30000, 30000, 30000, 30000, 30000], 0.1);
      expect(npv).toBeCloseTo(12476, 0);
    });

    it('calculateNPV returns negative for investment with no return', () => {
      const npv = CapExEngine.calculateNPV([-100000, 0, 0, 0, 0], 0.1);
      expect(npv).toBeLessThan(0);
    });

    it('calculateNPV returns zero for zero discount rate and balanced flows', () => {
      const npv = CapExEngine.calculateNPV([-100, 100], 0);
      expect(npv).toBeCloseTo(0, 2);
    });
  });

  describe('3. Internal rate of return (IRR)', () => {
    it('calculateIRR computes IRR for investment cash flows', () => {
      const irr = CapExEngine.calculateIRR([-100000, 30000, 30000, 30000, 30000, 30000]);
      expect(irr).toBeCloseTo(0.15, 2);
    });

    it('calculateIRR handles negative cash flows', () => {
      const irr = CapExEngine.calculateIRR([-100, -50, 200]);
      expect(irr).toBeDefined();
    });
  });

  describe('4. Payback period', () => {
    it('calculatePaybackPeriod computes payback period', () => {
      const payback = CapExEngine.calculatePaybackPeriod([-100000, 50000, 50000, 50000]);
      expect(payback).toBeCloseTo(3, 1);
    });

    it('calculatePaybackPeriod handles immediate payback', () => {
      const payback = CapExEngine.calculatePaybackPeriod([-100, 200]);
      expect(payback).toBeCloseTo(1.5, 1);
    });
  });

  describe('5. Return on investment (ROI)', () => {
    it('calculateROI computes return on investment', () => {
      const roi = CapExEngine.calculateROI(150000, 100000);
      expect(roi).toBeCloseTo(0.5, 2);
    });

    it('calculateROI handles zero cost', () => {
      const roi = CapExEngine.calculateROI(100, 0);
      expect(roi).toBe(0);
    });

    it('calculateROI handles negative return', () => {
      const roi = CapExEngine.calculateROI(50000, 100000);
      expect(roi).toBeCloseTo(-0.5, 2);
    });
  });

  describe('6. Money primitive safety', () => {
    it('calculateDepreciation uses decimal arithmetic for large amounts', () => {
      const asset = makeAsset({ cost: 999999999, salvageValue: 0, usefulLife: 10 });
      const schedule = CapExEngine.calculateDepreciation(asset);
      expect(schedule[0]!.depreciationExpense).toBeCloseTo(99999999.9, 2);
    });

    it('calculateNPV handles large cash flows', () => {
      const npv = CapExEngine.calculateNPV([-999999999, 500000000, 500000000, 500000000], 0.1);
      expect(npv).toBeDefined();
    });
  });

  describe('7. Determinism', () => {
    it('calculateDepreciation is deterministic', () => {
      const asset = makeAsset();
      const r1 = CapExEngine.calculateDepreciation(asset);
      const r2 = CapExEngine.calculateDepreciation(asset);
      expect(r1).toEqual(r2);
    });

    it('calculateNPV is deterministic', () => {
      const r1 = CapExEngine.calculateNPV([-100, 50, 50, 50], 0.1);
      const r2 = CapExEngine.calculateNPV([-100, 50, 50, 50], 0.1);
      expect(r1).toBe(r2);
    });

    it('calculateIRR is deterministic', () => {
      const r1 = CapExEngine.calculateIRR([-100, 50, 50, 50]);
      const r2 = CapExEngine.calculateIRR([-100, 50, 50, 50]);
      expect(r1).toBeCloseTo(r2, 6);
    });
  });
});
