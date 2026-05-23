import { describe, it, expect } from 'vitest';
import { FinancialInstrumentsEngine } from './FinancialInstrumentsEngine';

describe('FinancialInstrumentsEngine', () => {
  // ---------------------------------------------------------------------------
  // Bond Pricing
  // ---------------------------------------------------------------------------

  describe('Bond Pricing', () => {
    it('should calculate bond price at par when coupon equals yield', () => {
      const price = FinancialInstrumentsEngine.bondPrice(1000, 0.05, 0.05, 10, 2);
      expect(price).toBeCloseTo(1000, 0);
    });

    it('should calculate bond price above par when coupon > yield', () => {
      const price = FinancialInstrumentsEngine.bondPrice(1000, 0.06, 0.05, 10, 2);
      expect(price).toBeGreaterThan(1000);
    });

    it('should calculate bond price below par when coupon < yield', () => {
      const price = FinancialInstrumentsEngine.bondPrice(1000, 0.04, 0.05, 10, 2);
      expect(price).toBeLessThan(1000);
    });

    it('should calculate YTM for a bond priced at par', () => {
      const ytm = FinancialInstrumentsEngine.bondYTM(1000, 0.05, 1000, 10, 2);
      expect(ytm).toBeCloseTo(0.05, 4);
    });

    it('should calculate duration', () => {
      const duration = FinancialInstrumentsEngine.bondDuration(1000, 0.05, 0.05, 10, 2);
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(10);
    });

    it('should calculate convexity', () => {
      const convexity = FinancialInstrumentsEngine.bondConvexity(1000, 0.05, 0.05, 10, 2);
      expect(convexity).toBeGreaterThan(0);
    });

    it('should calculate accrued interest', () => {
      const ai = FinancialInstrumentsEngine.accruedInterest(1000, 0.06, 90, 180, 2);
      expect(ai).toBeCloseTo(15, 0);
    });
  });

  // ---------------------------------------------------------------------------
  // Loan Amortization
  // ---------------------------------------------------------------------------

  describe('Loan Amortization', () => {
    it('should calculate monthly payment', () => {
      const payment = FinancialInstrumentsEngine.loanPayment(100000, 0.06, 360);
      expect(payment).toBeCloseTo(599.55, 0);
    });

    it('should generate amortization schedule', () => {
      const schedule = FinancialInstrumentsEngine.loanAmortization(100000, 0.06, 360);
      expect(schedule).toHaveLength(360);
      expect(schedule[0].payment).toBeCloseTo(599.55, 0);
      expect(schedule[359].balance).toBeCloseTo(0, 0);
    });

    it('should have decreasing interest over time', () => {
      const schedule = FinancialInstrumentsEngine.loanAmortization(100000, 0.06, 360);
      expect(schedule[0].interest).toBeGreaterThan(schedule[100].interest);
      expect(schedule[100].interest).toBeGreaterThan(schedule[200].interest);
    });

    it('should have increasing principal over time', () => {
      const schedule = FinancialInstrumentsEngine.loanAmortization(100000, 0.06, 360);
      expect(schedule[0].principal).toBeLessThan(schedule[100].principal);
      expect(schedule[100].principal).toBeLessThan(schedule[200].principal);
    });
  });

  // ---------------------------------------------------------------------------
  // Option Pricing (Black-Scholes)
  // ---------------------------------------------------------------------------

  describe('Option Pricing', () => {
    it('should calculate call and put prices', () => {
      const result = FinancialInstrumentsEngine.blackScholes(100, 100, 1, 0.05, 0.2);
      expect(result.callPrice).toBeGreaterThan(0);
      expect(result.putPrice).toBeGreaterThan(0);
      expect(result.callPrice).toBeGreaterThan(result.putPrice);
    });

    it('should satisfy put-call parity', () => {
      const S = 100,
        K = 100,
        T = 1,
        r = 0.05,
        sigma = 0.2;
      const result = FinancialInstrumentsEngine.blackScholes(S, K, T, r, sigma);
      const lhs = result.callPrice - result.putPrice;
      const rhs = S - K * Math.exp(-r * T);
      expect(lhs).toBeCloseTo(rhs, 2);
    });

    it('should calculate Greeks', () => {
      const result = FinancialInstrumentsEngine.blackScholes(100, 100, 1, 0.05, 0.2);
      expect(result.greeks.delta).toBeGreaterThan(0);
      expect(result.greeks.delta).toBeLessThan(1);
      expect(result.greeks.gamma).toBeGreaterThan(0);
      expect(result.greeks.vega).toBeGreaterThan(0);
    });

    it('should have delta near 1 for deep in-the-money calls', () => {
      const result = FinancialInstrumentsEngine.blackScholes(200, 100, 1, 0.05, 0.2);
      expect(result.greeks.delta).toBeGreaterThan(0.9);
    });

    it('should have delta near 0 for deep out-of-the-money calls', () => {
      const result = FinancialInstrumentsEngine.blackScholes(50, 100, 1, 0.05, 0.2);
      expect(result.greeks.delta).toBeLessThan(0.1);
    });
  });

  // ---------------------------------------------------------------------------
  // DCF Valuation
  // ---------------------------------------------------------------------------

  describe('DCF Valuation', () => {
    it('should calculate enterprise value', () => {
      const result = FinancialInstrumentsEngine.dcfValuation(
        [100, 110, 120, 130, 140],
        0.03,
        0.1,
        500,
        100
      );
      expect(result.enterpriseValue).toBeGreaterThan(0);
      expect(result.terminalValue).toBeGreaterThan(0);
      expect(result.equityValue).toBeGreaterThan(0);
    });

    it('should calculate WACC', () => {
      const wacc = FinancialInstrumentsEngine.wacc(600, 400, 0.12, 0.06, 0.25);
      expect(wacc).toBeGreaterThan(0);
      expect(wacc).toBeLessThan(0.12);
    });

    it('should have terminal value as significant portion of EV', () => {
      const result = FinancialInstrumentsEngine.dcfValuation(
        [100, 110, 120, 130, 140],
        0.03,
        0.1,
        0,
        100
      );
      expect(result.terminalValue).toBeGreaterThan(result.freeCashFlows[0]);
    });
  });

  // ---------------------------------------------------------------------------
  // Comparable Analysis
  // ---------------------------------------------------------------------------

  describe('Comparable Analysis', () => {
    it('should calculate EV/Revenue multiple', () => {
      const multiples = FinancialInstrumentsEngine.comparableMultiples(
        1000,
        500,
        200,
        100,
        100,
        50
      );
      expect(multiples.evRevenue).toBe(2);
      expect(multiples.evEbitda).toBe(5);
      expect(multiples.peRatio).toBe(50);
    });
  });

  // ---------------------------------------------------------------------------
  // Yield Curve
  // ---------------------------------------------------------------------------

  describe('Yield Curve', () => {
    it('should interpolate linearly', () => {
      const x = [1, 2, 3, 5, 7, 10];
      const y = [0.02, 0.025, 0.03, 0.035, 0.04, 0.045];
      const rate = FinancialInstrumentsEngine.linearInterpolation(x, y, 4);
      expect(rate).toBeCloseTo(0.0325, 4);
    });

    it('should return first value for x before range', () => {
      const x = [1, 2, 3];
      const y = [0.02, 0.025, 0.03];
      expect(FinancialInstrumentsEngine.linearInterpolation(x, y, 0)).toBe(0.02);
    });

    it('should return last value for x after range', () => {
      const x = [1, 2, 3];
      const y = [0.02, 0.025, 0.03];
      expect(FinancialInstrumentsEngine.linearInterpolation(x, y, 10)).toBe(0.03);
    });
  });

  // ---------------------------------------------------------------------------
  // Credit Risk
  // ---------------------------------------------------------------------------

  describe('Credit Risk', () => {
    it('should calculate expected loss', () => {
      const el = FinancialInstrumentsEngine.expectedLoss(0.05, 0.6, 1000000);
      expect(el).toBe(30000);
    });

    it('should return 0 for zero PD', () => {
      expect(FinancialInstrumentsEngine.expectedLoss(0, 0.6, 1000000)).toBe(0);
    });
  });
});
