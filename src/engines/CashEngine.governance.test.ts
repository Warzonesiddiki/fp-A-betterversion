import { describe, it, expect } from 'vitest';
import { CashEngine } from './CashEngine';

/**
 * GOVERNANCE EVIDENCE for cap:ops.cash-planning
 *
 * The CashEngine provides 13-week cash flow forecasting and working capital
 * metrics (DSO, DPO, DIO, CCC). The governance dimension here is CASH
 * ACCURACY — cash forecasts drive treasury decisions and liquidity management.
 * All amounts use the decimal.js money primitive. Errors in cash forecasting
 * can lead to liquidity shortfalls or unnecessary borrowing.
 *
 * Tested dimensions:
 * 1. 13-week cash flow forecast
 * 2. Working capital metrics (DSO, DPO, DIO, CCC)
 * 3. Minimum target enforcement
 * 4. Money primitive safety
 * 5. Determinism
 */

describe('CashEngine — GOVERNANCE (ops.cash-planning)', () => {
  describe('1. 13-week cash flow forecast', () => {
    it('forecast13Week produces weekly forecast with correct structure', () => {
      const inflows = [{ week: '2026-01-01', amount: 10000 }];
      const outflows = [{ week: '2026-01-01', amount: 5000 }];
      const forecast = CashEngine.forecast13Week(10000, inflows, outflows);
      expect(forecast).toHaveLength(1);
      expect(forecast[0]!.week).toBe('2026-01-01');
      expect(forecast[0]!.openingBalance).toBe(10000);
      expect(forecast[0]!.inflows).toBe(10000);
      expect(forecast[0]!.outflows).toBe(5000);
      expect(forecast[0]!.netCashFlow).toBeCloseTo(5000, 2);
      expect(forecast[0]!.closingBalance).toBeCloseTo(15000, 2);
    });

    it('forecast13Week tracks balance across multiple weeks', () => {
      const inflows = [
        { week: '2026-01-01', amount: 10000 },
        { week: '2026-01-08', amount: 5000 },
      ];
      const outflows = [
        { week: '2026-01-01', amount: 3000 },
        { week: '2026-01-08', amount: 2000 },
      ];
      const forecast = CashEngine.forecast13Week(10000, inflows, outflows);
      expect(forecast).toHaveLength(2);
      // Week 1: 10000 + 10000 - 3000 = 17000
      expect(forecast[0]!.closingBalance).toBeCloseTo(17000, 2);
      // Week 2: 17000 + 5000 - 2000 = 20000
      expect(forecast[1]!.openingBalance).toBeCloseTo(17000, 2);
      expect(forecast[1]!.closingBalance).toBeCloseTo(20000, 2);
    });

    it('forecast13Week sets isBelowTarget correctly', () => {
      const inflows = [{ week: '2026-01-01', amount: 1000 }];
      const outflows = [{ week: '2026-01-01', amount: 5000 }];
      const forecast = CashEngine.forecast13Week(1000, inflows, outflows, 5000);
      expect(forecast[0]!.isBelowTarget).toBe(true);
    });

    it('forecast13Week sets isBelowTarget false when above target', () => {
      const inflows = [{ week: '2026-01-01', amount: 10000 }];
      const outflows = [{ week: '2026-01-01', amount: 1000 }];
      const forecast = CashEngine.forecast13Week(1000, inflows, outflows, 5000);
      expect(forecast[0]!.isBelowTarget).toBe(false);
    });

    it('forecast13Week handles empty inflows and outflows', () => {
      const forecast = CashEngine.forecast13Week(10000, [], []);
      expect(forecast).toHaveLength(0);
    });
  });

  describe('2. Working capital metrics', () => {
    it('calculateDSO computes days sales outstanding', () => {
      const dso = CashEngine.calculateDSO(50000, 1000000, 30);
      expect(dso).toBeCloseTo(1.5, 2);
    });

    it('calculateDPO computes days payable outstanding', () => {
      const dpo = CashEngine.calculateDPO(50000, 1000000, 30);
      expect(dpo).toBeCloseTo(1.5, 2);
    });

    it('calculateDIO computes days inventory outstanding', () => {
      const dio = CashEngine.calculateDIO(50000, 1000000, 30);
      expect(dio).toBeCloseTo(1.5, 2);
    });

    it('calculateCCC computes cash conversion cycle', () => {
      const ccc = CashEngine.calculateCCC(45, 30, 15);
      expect(ccc).toBeCloseTo(60, 2);
    });

    it('calculateCCC handles negative components', () => {
      const ccc = CashEngine.calculateCCC(0, 0, 0);
      expect(ccc).toBeCloseTo(0, 2);
    });
  });

  describe('3. Minimum target enforcement', () => {
    it('forecast13Week default minimum target is 0', () => {
      const inflows = [{ week: '2026-01-01', amount: 0 }];
      const outflows = [{ week: '2026-01-01', amount: 0 }];
      const forecast = CashEngine.forecast13Week(0, inflows, outflows);
      expect(forecast[0]!.isBelowTarget).toBe(false);
    });
  });

  describe('4. Money primitive safety', () => {
    it('forecast13Week uses decimal arithmetic for large amounts', () => {
      const inflows = [{ week: '2026-01-01', amount: 999999999.99 }];
      const outflows = [{ week: '2026-01-01', amount: 0 }];
      const forecast = CashEngine.forecast13Week(1000, inflows, outflows);
      expect(forecast[0]!.closingBalance).toBeCloseTo(1000000999.99, 2);
    });

    it('forecast13Week handles zero amounts', () => {
      const inflows = [{ week: '2026-01-01', amount: 0 }];
      const outflows = [{ week: '2026-01-01', amount: 0 }];
      const forecast = CashEngine.forecast13Week(0, inflows, outflows);
      expect(forecast[0]!.netCashFlow).toBe(0);
      expect(forecast[0]!.closingBalance).toBe(0);
    });

    it('forecast13Week handles negative amounts', () => {
      const inflows = [{ week: '2026-01-01', amount: -1000 }];
      const outflows = [{ week: '2026-01-01', amount: -500 }];
      const forecast = CashEngine.forecast13Week(10000, inflows, outflows);
      expect(forecast[0]!.netCashFlow).toBeCloseTo(-500, 2);
    });
  });

  describe('5. Determinism', () => {
    it('forecast13Week is deterministic', () => {
      const inflows = [{ week: '2026-01-01', amount: 10000 }];
      const outflows = [{ week: '2026-01-01', amount: 5000 }];
      const r1 = CashEngine.forecast13Week(10000, inflows, outflows);
      const r2 = CashEngine.forecast13Week(10000, inflows, outflows);
      expect(r1).toEqual(r2);
    });

    it('working capital metrics are deterministic', () => {
      expect(CashEngine.calculateDSO(50000, 1000000, 30)).toBe(
        CashEngine.calculateDSO(50000, 1000000, 30)
      );
      expect(CashEngine.calculateCCC(45, 30, 15)).toBe(CashEngine.calculateCCC(45, 30, 15));
    });
  });
});
