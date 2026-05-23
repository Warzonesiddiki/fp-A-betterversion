import { describe, it, expect } from 'vitest';
import { LoanAmortizationEngine } from './LoanAmortizationEngine';

describe('LoanAmortizationEngine', () => {
  describe('monthlyPayment', () => {
    it('should calculate monthly payment', () => {
      const pmt = LoanAmortizationEngine.monthlyPayment(100000, 0.06, 360);
      expect(pmt).toBeCloseTo(599.55, 0);
    });

    it('should handle zero interest rate', () => {
      const pmt = LoanAmortizationEngine.monthlyPayment(120000, 0, 120);
      expect(pmt).toBe(1000);
    });

    it('should handle short term', () => {
      const pmt = LoanAmortizationEngine.monthlyPayment(12000, 0.06, 12);
      expect(pmt).toBeGreaterThan(900);
      expect(pmt).toBeLessThan(1100);
    });
  });

  describe('schedule', () => {
    it('should generate correct number of rows', () => {
      const result = LoanAmortizationEngine.schedule(100000, 0.06, 12);
      expect(result.schedule).toHaveLength(12);
    });

    it('should have final balance near zero', () => {
      const result = LoanAmortizationEngine.schedule(100000, 0.06, 12);
      expect(result.schedule[11].balance).toBeCloseTo(0, 0);
    });

    it('should track total interest', () => {
      const result = LoanAmortizationEngine.schedule(100000, 0.06, 12);
      expect(result.totalInterest).toBeGreaterThan(0);
    });

    it('should have consistent monthly payment', () => {
      const result = LoanAmortizationEngine.schedule(100000, 0.06, 12);
      const pmt = result.monthlyPayment;
      result.schedule.forEach((row) => {
        expect(row.payment).toBeCloseTo(pmt, 0);
      });
    });

    it('should decrease balance over time', () => {
      const result = LoanAmortizationEngine.schedule(100000, 0.06, 12);
      for (let i = 1; i < result.schedule.length; i++) {
        expect(result.schedule[i].balance).toBeLessThan(result.schedule[i - 1].balance);
      }
    });

    it('should increase principal portion over time', () => {
      const result = LoanAmortizationEngine.schedule(100000, 0.06, 12);
      for (let i = 1; i < result.schedule.length; i++) {
        expect(result.schedule[i].principal).toBeGreaterThan(result.schedule[i - 1].principal);
      }
    });
  });
});
