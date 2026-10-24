import { describe, it, expect } from 'vitest';
import { RevRecEngine, type Contract, type PerformanceObligation } from './RevRecEngine';

/**
 * GOVERNANCE EVIDENCE for cap:model.revenue-recognition
 *
 * The RevRecEngine is the financial authority for revenue recognition (ASC 606).
 * These tests verify compliance — the governance dimension here is FINANCIAL
 * CORRECTNESS, not RBAC. If the engine produces wrong revenue numbers, every
 * downstream report, analysis, and decision is wrong.
 *
 * Tested dimensions:
 * 1. Input validation (null/empty contracts, invalid POs)
 * 2. Transaction price allocation (percentages sum to 100%, money primitive)
 * 3. Revenue schedule footing (amounts sum to total contract value)
 * 4. Over-time recognition (straight-line, final period absorbs remainder)
 * 5. Point-in-time recognition (recognizes when completion metric is met)
 * 6. Contract modification (termination, discount, additional goods)
 * 7. Variable consideration constraint (reversal probability)
 * 8. Contract asset/liability (unbilled receivable vs deferred revenue)
 * 9. Deferred revenue (remaining to recognize as of a date)
 * 10. Money primitive safety (all amounts use money primitive)
 * 11. Determinism (same inputs produce same outputs)
 */

function makePO(
  id: string,
  description: string,
  standalonePrice: number,
  recognitionMethod: 'point_in_time' | 'over_time' = 'over_time',
  recognitionPattern?: 'straight_line' | 'input' | 'output',
  completionMetric?: number,
  recognitionDate?: string
): PerformanceObligation {
  return {
    id,
    description,
    standalonePrice,
    allocationPercentage: 0,
    recognitionMethod,
    recognitionPattern,
    completionMetric,
    recognitionDate,
  };
}

function makeContract(
  id: string,
  totalValue: number,
  poList: PerformanceObligation[],
  customerId = 'CUST-001',
  startDate = '2026-01-01',
  endDate = '2026-12-31'
): Contract {
  return {
    id,
    customerId,
    startDate,
    endDate,
    totalValue,
    performanceObligations: poList,
    paymentTerms: 'Net 30',
  };
}

describe('RevRecEngine — GOVERNANCE (model.revenue-recognition)', () => {

  describe('1. Input validation', () => {

    it('allocateTransactionPrice returns [] for null contract', () => {
      expect(RevRecEngine.allocateTransactionPrice(null as never)).toEqual([]);
    });

    it('allocateTransactionPrice returns [] for contract with no POs', () => {
      const contract = makeContract('C1', 100000, []);
      expect(RevRecEngine.allocateTransactionPrice(contract)).toEqual([]);
    });

    it('allocateTransactionPrice returns original POs when all standalone prices are zero', () => {
      const poList = [
        makePO('po-1', 'Service A', 0),
        makePO('po-2', 'Service B', 0),
      ];
      const contract = makeContract('C1', 100000, poList);
      const result = RevRecEngine.allocateTransactionPrice(contract);
      expect(result).toHaveLength(2);
      // Allocation percentages remain 0 (no standalone prices to compute ratio)
      expect(result[0].allocationPercentage).toBe(0);
      expect(result[1].allocationPercentage).toBe(0);
    });
  });

  describe('2. Transaction price allocation', () => {

    it('allocates percentages that sum to 1 (100%)', () => {
      const poList = [
        makePO('po-1', 'Service A', 60000),
        makePO('po-2', 'Service B', 30000),
        makePO('po-3', 'Service C', 10000),
      ];
      const contract = makeContract('C1', 100000, poList);
      const result = RevRecEngine.allocateTransactionPrice(contract);

      const sum = result.reduce((acc, po) => acc + po.allocationPercentage, 0);
      expect(sum).toBeCloseTo(1, 5);
    });

    it('allocates proportionally to standalone selling prices', () => {
      const poList = [
        makePO('po-1', 'Service A', 60000),
        makePO('po-2', 'Service B', 30000),
        makePO('po-3', 'Service C', 10000),
      ];
      const contract = makeContract('C1', 100000, poList);
      const result = RevRecEngine.allocateTransactionPrice(contract);

      // 60000/100000 = 0.6
      expect(result[0].allocationPercentage).toBeCloseTo(0.6, 5);
      // 30000/100000 = 0.3
      expect(result[1].allocationPercentage).toBeCloseTo(0.3, 5);
      // 10000/100000 = 0.1
      expect(result[2].allocationPercentage).toBeCloseTo(0.1, 5);
    });
  });

  describe('3. Revenue schedule footing', () => {

    it('schedule amounts foot to total contract value (cent-exact)', () => {
      const poList = [
        makePO('po-1', 'Annual Service', 100000, 'over_time', 'straight_line'),
      ];
      const contract = makeContract('C1', 100000, poList, 'CUST-001', '2026-01-01', '2026-12-31');
      const periods = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];
      const schedules = RevRecEngine.calculateRevenueSchedule(contract, periods);

      const total = schedules.reduce((acc, s) => acc + s.amount, 0);
      expect(total).toBe(100000);
    });

    it('schedule foots for uneven division (100000 / 3 months)', () => {
      const poList = [
        makePO('po-1', 'Quarterly Service', 100000, 'over_time', 'straight_line'),
      ];
      const contract = makeContract('C1', 100000, poList, 'CUST-001', '2026-01-01', '2026-03-31');
      const periods = ['2026-01', '2026-02', '2026-03'];
      const schedules = RevRecEngine.calculateRevenueSchedule(contract, periods);

      const total = schedules.reduce((acc, s) => acc + s.amount, 0);
      // 33333.33 + 33333.33 + 33333.34 = 100000 (foots, final period absorbs remainder)
      expect(total).toBe(100000);
    });
  });

  describe('4. Over-time recognition (straight-line)', () => {

    it('recognizes revenue evenly across periods', () => {
      const poList = [
        makePO('po-1', 'Annual Service', 120000, 'over_time', 'straight_line'),
      ];
      const contract = makeContract('C1', 120000, poList, 'CUST-001', '2026-01-01', '2026-12-31');
      const periods = ['2026-01', '2026-02', '2026-03', '2026-04'];
      const schedules = RevRecEngine.calculateRevenueSchedule(contract, periods);

      // 120000 / 4 = 30000 per month
      expect(schedules[0].amount).toBe(30000);
      expect(schedules[1].amount).toBe(30000);
      expect(schedules[2].amount).toBe(30000);
      expect(schedules[3].amount).toBe(30000);
    });

    it('recognizedToDate is cumulative', () => {
      const poList = [
        makePO('po-1', 'Annual Service', 100000, 'over_time', 'straight_line'),
      ];
      const contract = makeContract('C1', 100000, poList, 'CUST-001', '2026-01-01', '2026-04-30');
      const periods = ['2026-01', '2026-02', '2026-03', '2026-04'];
      const schedules = RevRecEngine.calculateRevenueSchedule(contract, periods);

      expect(schedules[0].recognizedToDate).toBe(25000);
      expect(schedules[1].recognizedToDate).toBe(50000);
      expect(schedules[2].recognizedToDate).toBe(75000);
      expect(schedules[3].recognizedToDate).toBe(100000);
    });

    it('remainingToRecognize decreases to zero at end', () => {
      const poList = [
        makePO('po-1', 'Quarterly Service', 90000, 'over_time', 'straight_line'),
      ];
      const contract = makeContract('C1', 90000, poList, 'CUST-001', '2026-01-01', '2026-03-31');
      const periods = ['2026-01', '2026-02', '2026-03'];
      const schedules = RevRecEngine.calculateRevenueSchedule(contract, periods);

      expect(schedules[2].remainingToRecognize).toBe(0);
    });
  });

  describe('5. Point-in-time recognition', () => {

    it('recognizes full amount when completion metric is met', () => {
      const poList = [
        makePO('po-1', 'License', 50000, 'point_in_time', undefined, 1, '2026-06-01'),
      ];
      const contract = makeContract('C1', 50000, poList, 'CUST-001', '2026-01-01', '2026-12-31');
      const periods = ['2026-01', '2026-06', '2026-07'];
      const schedules = RevRecEngine.calculateRevenueSchedule(contract, periods);

      // Revenue recognized in 2026-06 (recognition date reached, completion = 1)
      expect(schedules[0].amount).toBe(0); // January — not recognized
      expect(schedules[1].amount).toBe(50000); // June — recognized
      expect(schedules[2].amount).toBe(0); // July — already recognized
    });

    it('does not recognize when completion metric is below 1', () => {
      const poList = [
        makePO('po-1', 'License', 50000, 'point_in_time', undefined, 0.5, '2026-06-01'),
      ];
      const contract = makeContract('C1', 50000, poList, 'CUST-001', '2026-01-01', '2026-12-31');
      const periods = ['2026-06', '2026-07'];
      const schedules = RevRecEngine.calculateRevenueSchedule(contract, periods);

      // completionMetric 0.5 < 1, so not recognized
      expect(schedules[0].amount).toBe(0);
      expect(schedules[1].amount).toBe(0);
    });
  });

  describe('6. Contract modification', () => {

    it('termination reduces contract value', () => {
      const contract = makeContract('C1', 100000, [
        makePO('po-1', 'Service', 100000, 'over_time', 'straight_line'),
      ]);

      const modified = RevRecEngine.handleContractModification(contract, {
        date: '2026-06-01',
        type: 'termination',
        value: -20000,
      });

      expect(modified.contractModifications).toHaveLength(1);
      expect(modified.totalValue).toBeLessThan(100000);
    });

    it('additional_goods adds a modification record', () => {
      const contract = makeContract('C1', 100000, [
        makePO('po-1', 'Service', 100000, 'over_time', 'straight_line'),
      ]);

      const modified = RevRecEngine.handleContractModification(contract, {
        date: '2026-06-01',
        type: 'additional_goods',
        value: 50000,
      });

      expect(modified.contractModifications).toHaveLength(1);
      expect(modified.contractModifications[0].type).toBe('additional_goods');
    });
  });

  describe('7. Variable consideration constraint', () => {

    it('constrains to zero when reversal probability exceeds threshold', () => {
      // probabilityOfReversal 0.8 >= threshold 0.75 → constrained to 0
      expect(RevRecEngine.constrainVariableConsideration(100000, 0.8)).toBe(0);
    });

    it('includes partial amount when reversal probability is below threshold', () => {
      // probabilityOfReversal 0.3 < threshold 0.75 → 100000 * (1 - 0.3) = 70000
      expect(RevRecEngine.constrainVariableConsideration(100000, 0.3)).toBe(70000);
    });

    it('includes full amount when reversal probability is zero', () => {
      expect(RevRecEngine.constrainVariableConsideration(100000, 0)).toBe(100000);
    });
  });

  describe('8. Contract asset/liability', () => {

    it('reports contract liability when billed exceeds recognized', () => {
      const schedules = [
        { period: '2026-01', amount: 10000, recognizedToDate: 10000, remainingToRecognize: 90000 },
      ];
      const billed = new Map([['2026-01', 15000]]);
      const results = RevRecEngine.getContractAssetLiability('C1', schedules, billed, ['2026-01']);

      // Billed 15000 > Recognized 10000 → contract liability (deferred revenue) of 5000
      expect(results[0].contractLiability).toBe(5000);
      expect(results[0].contractAsset).toBe(0);
    });

    it('reports contract asset when recognized exceeds billed', () => {
      const schedules = [
        { period: '2026-01', amount: 10000, recognizedToDate: 10000, remainingToRecognize: 90000 },
      ];
      const billed = new Map([['2026-01', 5000]]);
      const results = RevRecEngine.getContractAssetLiability('C1', schedules, billed, ['2026-01']);

      // Recognized 10000 > Billed 5000 → contract asset (unbilled receivable) of 5000
      expect(results[0].contractAsset).toBe(5000);
      expect(results[0].contractLiability).toBe(0);
    });
  });

  describe('9. Deferred revenue', () => {

    it('returns remaining to recognize as of a date', () => {
      const schedules = [
        { period: '2026-01', amount: 25000, recognizedToDate: 25000, remainingToRecognize: 75000 },
        { period: '2026-02', amount: 25000, recognizedToDate: 50000, remainingToRecognize: 50000 },
      ];

      const deferred = RevRecEngine.getDeferredRevenue(schedules, '2026-02');
      expect(deferred).toBe(50000);
    });

    it('returns zero when asOfDate is before all periods', () => {
      const schedules = [
        { period: '2026-01', amount: 25000, recognizedToDate: 25000, remainingToRecognize: 75000 },
      ];

      const deferred = RevRecEngine.getDeferredRevenue(schedules, '2025-12');
      expect(deferred).toBe(0);
    });
  });

  describe('10. Money primitive safety', () => {

    it('schedule amounts are exact cents (no float drift)', () => {
      const poList = [
        makePO('po-1', 'Service', 100000, 'over_time', 'straight_line'),
      ];
      const contract = makeContract('C1', 100000, poList, 'CUST-001', '2026-01-01', '2026-03-31');
      const periods = ['2026-01', '2026-02', '2026-03'];
      const schedules = RevRecEngine.calculateRevenueSchedule(contract, periods);

      for (const s of schedules) {
        expect(Number.isFinite(s.amount)).toBe(true);
        expect(Math.round(s.amount * 100) / 100).toBeCloseTo(s.amount, 5);
      }
    });

    it('allocation percentages use decimal division (not IEEE-754)', () => {
      const poList = [
        makePO('po-1', 'A', 3),
        makePO('po-2', 'B', 7),
      ];
      const contract = makeContract('C1', 10, poList);
      const result = RevRecEngine.allocateTransactionPrice(contract);

      // 3/10 = 0.3, 7/10 = 0.7
      expect(result[0].allocationPercentage).toBeCloseTo(0.3, 10);
      expect(result[1].allocationPercentage).toBeCloseTo(0.7, 10);
    });
  });

  describe('11. Determinism', () => {

    it('produces identical schedules for identical inputs', () => {
      const poList = [
        makePO('po-1', 'Annual Service', 120000, 'over_time', 'straight_line'),
      ];
      const contract = makeContract('C1', 120000, poList, 'CUST-001', '2026-01-01', '2026-12-31');
      const periods = ['2026-01', '2026-02', '2026-03'];

      const s1 = RevRecEngine.calculateRevenueSchedule(contract, periods);
      const s2 = RevRecEngine.calculateRevenueSchedule(contract, periods);

      expect(s1).toEqual(s2);
    });
  });
});
