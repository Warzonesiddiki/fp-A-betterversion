import { describe, it, expect } from 'vitest';
import { RevRecEngine, type Contract } from './RevRecEngine';

/**
 * Phase 8 gate (checklist row 18): contract-life validation. Over the
 * whole life of a contract, the recognised revenue must equal the
 * contract transaction price — to the cent, in the emitted schedule
 * itself (the column of period amounts must foot to the total, not
 * merely approximate it). Partial completion recognises partially;
 * an incomplete point-in-time obligation recognises nothing.
 */

const MONTHS_2026 = Array.from({ length: 12 }, (_, i) => `2026-${String(i + 1).padStart(2, '0')}`);

function sum(amounts: number[]): number {
  return Math.round(amounts.reduce((a, b) => a + b, 0) * 100) / 100;
}

describe('RevRecEngine — contract-life oracle', () => {
  it('straight-line: 12 equal months foot exactly to the contract value', () => {
    const contract: Contract = {
      id: 'c-1',
      customerId: 'cust-1',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      totalValue: 120000,
      performanceObligations: [
        {
          id: 'po-1',
          description: 'SaaS subscription',
          standalonePrice: 120000,
          allocationPercentage: 100,
          recognitionMethod: 'over_time',
          recognitionPattern: 'straight_line',
        },
      ],
      paymentTerms: 'Net 30',
    };
    const schedule = RevRecEngine.calculateRevenueSchedule(contract, MONTHS_2026);
    expect(schedule).toHaveLength(12);
    expect(schedule.every((s) => s.amount === 10000)).toBe(true);
    expect(sum(schedule.map((s) => s.amount))).toBe(120000);
    expect(schedule[11]!.recognizedToDate).toBe(120000);
    expect(schedule[11]!.remainingToRecognize).toBe(0);
  });

  it('non-divisible term: the emitted period amounts still foot to the cent', () => {
    const contract: Contract = {
      id: 'c-2',
      customerId: 'cust-1',
      startDate: '2026-01-01',
      endDate: '2026-03-31',
      totalValue: 100000,
      performanceObligations: [
        {
          id: 'po-1',
          description: 'Implementation',
          standalonePrice: 100000,
          allocationPercentage: 100,
          recognitionMethod: 'over_time',
          recognitionPattern: 'straight_line',
        },
      ],
      paymentTerms: 'Net 30',
    };
    const schedule = RevRecEngine.calculateRevenueSchedule(contract, MONTHS_2026.slice(0, 3));
    expect(sum(schedule.map((s) => s.amount))).toBe(100000);
    expect(schedule[2]!.recognizedToDate).toBe(100000);
    expect(schedule[2]!.remainingToRecognize).toBe(0);
    // No recognition leaks past the contract end.
    const longer = RevRecEngine.calculateRevenueSchedule(contract, MONTHS_2026.slice(0, 6));
    expect(sum(longer.map((s) => s.amount))).toBe(100000);
    expect(longer.slice(3).every((s) => s.amount === 0)).toBe(true);
  });

  it('mixed obligations: allocation + recognition reconcile to the transaction price', () => {
    const contract: Contract = {
      id: 'c-3',
      customerId: 'cust-2',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      totalValue: 100000,
      performanceObligations: [
        {
          id: 'po-hw',
          description: 'Hardware (delivered June)',
          standalonePrice: 80000,
          allocationPercentage: 0,
          recognitionMethod: 'point_in_time',
          recognitionDate: '2026-06-15',
          completionMetric: 1,
        },
        {
          id: 'po-svc',
          description: 'Services (straight line)',
          standalonePrice: 40000,
          allocationPercentage: 0,
          recognitionMethod: 'over_time',
          recognitionPattern: 'straight_line',
        },
      ],
      paymentTerms: 'Net 30',
    };
    const allocated = RevRecEngine.allocateTransactionPrice(contract);
    // Allocation percentages cover the whole transaction price.
    const pctSum = allocated.reduce((a, p) => a + p.allocationPercentage, 0);
    expect(Math.abs(pctSum - 1)).toBeLessThan(0.0001);
    const schedule = RevRecEngine.calculateRevenueSchedule(contract, MONTHS_2026);
    expect(sum(schedule.map((s) => s.amount))).toBe(100000);
    expect(schedule[11]!.recognizedToDate).toBe(100000);
    expect(schedule[11]!.remainingToRecognize).toBe(0);
    // The point-in-time obligation lands entirely in June.
    const june = schedule[5]!;
    const servicesOnly = 33333.33 / 12;
    expect(june.amount).toBeGreaterThan(60000);
    expect(Math.abs(june.amount - (66666.67 + servicesOnly))).toBeLessThan(1.01);
  });

  it('an incomplete point-in-time obligation recognises nothing, ever', () => {
    const contract: Contract = {
      id: 'c-4',
      customerId: 'cust-3',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      totalValue: 50000,
      performanceObligations: [
        {
          id: 'po-1',
          description: 'Undelivered hardware',
          standalonePrice: 50000,
          allocationPercentage: 100,
          recognitionMethod: 'point_in_time',
          recognitionDate: '2026-06-15',
          completionMetric: 0.5,
        },
      ],
      paymentTerms: 'Net 30',
    };
    const schedule = RevRecEngine.calculateRevenueSchedule(contract, MONTHS_2026);
    expect(sum(schedule.map((s) => s.amount))).toBe(0);
    expect(schedule[11]!.remainingToRecognize).toBe(50000);
  });
});
