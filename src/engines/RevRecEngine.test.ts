import { describe, it, expect } from 'vitest';
import { RevRecEngine, type Contract, type PerformanceObligation } from './RevRecEngine';

describe('RevRecEngine', () => {
  const baseContract: Contract = {
    id: 'ct-1',
    customerId: 'cust-1',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    totalValue: 120000,
    performanceObligations: [
      {
        id: 'po-1',
        description: 'Software License',
        standalonePrice: 80000,
        allocationPercentage: 0,
        recognitionMethod: 'point_in_time',
        completionMetric: 1, // ASC 606: must explicitly signal completion for PIT
      },
      {
        id: 'po-2',
        description: 'Support',
        standalonePrice: 40000,
        allocationPercentage: 0,
        recognitionMethod: 'over_time',
      },
    ],
    paymentTerms: 'Net 30',
  };

  describe('allocateTransactionPrice', () => {
    it('should allocate price proportionally', () => {
      const result = RevRecEngine.allocateTransactionPrice(baseContract);
      expect(result![0]!.allocationPercentage).toBeCloseTo(0.667, 2);
      expect(result![1]!.allocationPercentage).toBeCloseTo(0.333, 2);
    });

    it('should handle zero total standalone price', () => {
      const contract = {
        ...baseContract,
        performanceObligations: [
          {
            id: 'po-1',
            description: 'Item',
            standalonePrice: 0,
            allocationPercentage: 0,
            recognitionMethod: 'point_in_time' as const,
            completionMetric: 1,
          },
        ],
      };
      const result = RevRecEngine.allocateTransactionPrice(contract);
      expect(result![0]!.allocationPercentage).toBe(0);
    });
  });

  describe('calculateRevenueSchedule', () => {
    it('should calculate monthly revenue schedule', () => {
      const obligations = baseContract.performanceObligations.map((po) => ({
        ...po,
        allocationPercentage: 0.5,
      }));
      const contract = { ...baseContract, performanceObligations: obligations };
      const periods = ['2024-01', '2024-02', '2024-03'];
      const result = RevRecEngine.calculateRevenueSchedule(contract, periods);
      expect(result).toHaveLength(3);
      // allocateTransactionPrice re-calculates: PO-1=80000 (80000/120000*120000), PO-2=40000
      // PIT recognizes 80000 in period 0; OT straight-line = 40000/3 = 13333.33/period
      expect(result![0]!.amount).toBeCloseTo(93333.33, 0);
      expect(result![2]!.remainingToRecognize).toBeCloseTo(0, 5);
    });

    it('should handle single period', () => {
      const obligations = baseContract.performanceObligations.map((po) => ({
        ...po,
        allocationPercentage: 0.5,
      }));
      const contract = { ...baseContract, performanceObligations: obligations };
      const result = RevRecEngine.calculateRevenueSchedule(contract, ['2024-01']);
      // PIT recognizes 80000 + OT straight-line 40000 = 120000
      expect(result![0]!.amount).toBe(120000);
    });

    it('should NOT recognize point-in-time when completionMetric is undefined', () => {
      const contract: Contract = {
        ...baseContract,
        totalValue: 100000,
        performanceObligations: [
          {
            id: 'po-uncompleted',
            description: 'Incomplete delivery',
            standalonePrice: 100000,
            allocationPercentage: 1,
            recognitionMethod: 'point_in_time',
            // completionMetric intentionally omitted — ASC 606 requires explicit signal
          },
        ],
      };
      const periods = ['2024-01', '2024-02'];
      const result = RevRecEngine.calculateRevenueSchedule(contract, periods);
      // Should NOT recognize — completionMetric must be explicitly >= 1
      expect(result![0]!.amount).toBe(0);
      expect(result![1]!.amount).toBe(0);
      expect(result![0]!.remainingToRecognize).toBe(100000);
    });

    it('should recognize point-in-time when completionMetric is 1', () => {
      const contract: Contract = {
        ...baseContract,
        totalValue: 50000,
        performanceObligations: [
          {
            id: 'po-completed',
            description: 'Delivered software',
            standalonePrice: 50000,
            allocationPercentage: 1,
            recognitionMethod: 'point_in_time',
            completionMetric: 1,
          },
        ],
      };
      const periods = ['2024-01', '2024-02'];
      const result = RevRecEngine.calculateRevenueSchedule(contract, periods);
      expect(result![0]!.amount).toBe(50000);
      expect(result![1]!.amount).toBe(0);
      expect(result![0]!.remainingToRecognize).toBe(0);
    });
  });

  describe('handleContractModification', () => {
    it('should add modification and update total value', () => {
      const mod = { date: '2024-06-01', type: 'additional_goods' as const, value: 30000 };
      const updated = RevRecEngine.handleContractModification(baseContract, mod);
      expect(updated.totalValue).toBe(150000);
      expect(updated.contractModifications).toHaveLength(1);
    });

    it('should handle discount modification', () => {
      const mod = { date: '2024-06-01', type: 'discount' as const, value: -10000 };
      const updated = RevRecEngine.handleContractModification(baseContract, mod);
      expect(updated.totalValue).toBe(110000);
    });

    it('should handle termination modification', () => {
      const mod = { date: '2024-06-01', type: 'termination' as const, value: -50000 };
      const updated = RevRecEngine.handleContractModification(baseContract, mod);
      expect(updated.totalValue).toBe(70000);
    });

    it('should not allow negative total value on termination', () => {
      const mod = { date: '2024-06-01', type: 'termination' as const, value: -200000 };
      const updated = RevRecEngine.handleContractModification(baseContract, mod);
      expect(updated.totalValue).toBe(0);
    });

    it('should not mutate original contract', () => {
      const mod = { date: '2024-06-01', type: 'extension' as const, value: 10000 };
      RevRecEngine.handleContractModification(baseContract, mod);
      expect(baseContract.totalValue).toBe(120000);
    });
  });

  describe('getContractAssetLiability', () => {
    it('should calculate contract liability (deferred revenue) when billed > recognized', () => {
      const schedules = [
        { period: '2024-01', amount: 10000, recognizedToDate: 10000, remainingToRecognize: 90000 },
        { period: '2024-02', amount: 10000, recognizedToDate: 20000, remainingToRecognize: 80000 },
      ];
      const billed = new Map([
        ['2024-01', 50000],
        ['2024-02', 0],
      ]);
      const result = RevRecEngine.getContractAssetLiability('ct-1', schedules, billed, [
        '2024-01',
        '2024-02',
      ]);
      expect(result![0]!.contractLiability).toBe(40000); // 50000 billed - 10000 recognized
      expect(result![0]!.contractAsset).toBe(0);
    });

    it('should calculate contract asset (unbilled) when recognized > billed', () => {
      const schedules = [
        { period: '2024-01', amount: 50000, recognizedToDate: 50000, remainingToRecognize: 50000 },
      ];
      const billed = new Map([['2024-01', 10000]]);
      const result = RevRecEngine.getContractAssetLiability('ct-1', schedules, billed, ['2024-01']);
      expect(result![0]!.contractAsset).toBe(40000); // 50000 recognized - 10000 billed
      expect(result![0]!.contractLiability).toBe(0);
    });
  });

  describe('constrainVariableConsideration', () => {
    it('should include variable consideration when reversal probability is low', () => {
      // probabilityOfReversal = 0.3 (low), variableAmount = 10000
      const result = RevRecEngine.constrainVariableConsideration(10000, 0.3);
      expect(result).toBeCloseTo(7000, 0); // 10000 * (1 - 0.3) = 7000
    });

    it('should constrain variable consideration when reversal probability is high', () => {
      // probabilityOfReversal = 0.8 (> threshold 0.75)
      const result = RevRecEngine.constrainVariableConsideration(10000, 0.8);
      expect(result).toBe(0); // Constrained — too likely to reverse
    });

    it('should respect custom constraint threshold', () => {
      // threshold = 0.9, probability = 0.85
      const result = RevRecEngine.constrainVariableConsideration(10000, 0.85, 0.9);
      expect(result).toBeCloseTo(1500, 0); // 10000 * (1 - 0.85) = 1500
    });
  });

  describe('getDeferredRevenue', () => {
    it('should return remaining to recognize for a given date', () => {
      const schedules = [
        { period: '2024-01', amount: 10000, recognizedToDate: 10000, remainingToRecognize: 90000 },
        { period: '2024-02', amount: 10000, recognizedToDate: 20000, remainingToRecognize: 80000 },
      ];
      expect(RevRecEngine.getDeferredRevenue(schedules, '2024-01')).toBe(90000);
    });

    it('should return 0 if no schedules match', () => {
      expect(RevRecEngine.getDeferredRevenue([], '2024-01')).toBe(0);
    });
  });
});
