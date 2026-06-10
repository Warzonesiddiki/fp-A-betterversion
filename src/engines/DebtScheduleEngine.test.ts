import { describe, it, expect } from 'vitest';
import { DebtScheduleEngine } from './DebtScheduleEngine';

describe('DebtScheduleEngine', () => {
  describe('amortize', () => {
    it('should generate a schedule', () => {
      const result = DebtScheduleEngine.amortize({
        id: 'loan1',
        name: 'Term Loan',
        principal: 100000,
        rate: 0.06,
        termMonths: 12,
        startDate: '2026-01-01',
        type: 'term_loan',
        paymentFrequency: 'monthly',
        amortizationType: 'fully_amortizing',
      });
      expect(result.schedule.length).toBeGreaterThan(0);
      expect(result.totalPayments).toBeGreaterThan(0);
    });

    it('should have correct number of periods', () => {
      const result = DebtScheduleEngine.amortize({
        id: 'loan1',
        name: 'Test',
        principal: 100000,
        rate: 0.06,
        termMonths: 24,
        startDate: '2026-01-01',
        type: 'term_loan',
        paymentFrequency: 'monthly',
        amortizationType: 'fully_amortizing',
      });
      expect(result.schedule).toHaveLength(24);
    });

    it('should end with near-zero balance', () => {
      const result = DebtScheduleEngine.amortize({
        id: 'loan1',
        name: 'Test',
        principal: 100000,
        rate: 0.06,
        termMonths: 12,
        startDate: '2026-01-01',
        type: 'term_loan',
        paymentFrequency: 'monthly',
        amortizationType: 'fully_amortizing',
      });
      const lastEntry = result.schedule[result.schedule.length - 1];
      expect(lastEntry!.endingBalance).toBeCloseTo(0, 0);
    });

    it('should track cumulative interest', () => {
      const result = DebtScheduleEngine.amortize({
        id: 'loan1',
        name: 'Test',
        principal: 100000,
        rate: 0.06,
        termMonths: 12,
        startDate: '2026-01-01',
        type: 'term_loan',
        paymentFrequency: 'monthly',
        amortizationType: 'fully_amortizing',
      });
      const lastEntry = result.schedule[result.schedule.length - 1];
      expect(lastEntry!.cumulativeInterest).toBeGreaterThan(0);
      expect(result.totalInterest).toBeCloseTo(lastEntry!.cumulativeInterest, 0);
    });

    it('should have consistent payments', () => {
      const result = DebtScheduleEngine.amortize({
        id: 'loan1',
        name: 'Test',
        principal: 100000,
        rate: 0.06,
        termMonths: 12,
        startDate: '2026-01-01',
        type: 'term_loan',
        paymentFrequency: 'monthly',
        amortizationType: 'fully_amortizing',
      });
      const payments = result.schedule.map((e) => e.payment);
      const firstPayment = payments[0];
      payments.forEach((p) => {
        expect(p).toBeCloseTo(firstPayment, 0);
      });
    });
  });
});
