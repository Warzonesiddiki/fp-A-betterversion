import Decimal from 'decimal.js';
import { allocateMoney, multiplyMoney, roundTo } from '@/utils/money';

export interface PerformanceObligation {
  id: string;
  description: string;
  standalonePrice: number;
  allocationPercentage: number;
  recognitionMethod: 'point_in_time' | 'over_time';
  recognitionPattern?: 'straight_line' | 'input' | 'output';
  completionMetric?: number; // 0 to 1
  recognitionDate?: string; // YYYY-MM-DD for PIT
}

export interface ContractModification {
  date: string;
  type: 'additional_goods' | 'extension' | 'discount' | 'termination';
  value: number;
}

export interface Contract {
  id: string;
  customerId: string;
  startDate: string;
  endDate: string;
  totalValue: number;
  performanceObligations: PerformanceObligation[];
  paymentTerms: string;
  contractModifications?: ContractModification[];
}

export interface RevenueSchedule {
  period: string;
  amount: number;
  recognizedToDate: number;
  remainingToRecognize: number;
}

export interface ContractAssetLiability {
  contractId: string;
  period: string;
  contractAsset: number; // unbilled receivable (recognized > billed)
  contractLiability: number; // deferred revenue (billed > recognized)
  netPosition: number;
}

export class RevRecEngine {
  static allocateTransactionPrice(contract: Contract): PerformanceObligation[] {
    if (!contract || !Array.isArray(contract.performanceObligations)) {
      return [];
    }
    const totalStandalone = contract.performanceObligations.reduce(
      (acc, po) => acc + (Number.isFinite(po.standalonePrice) ? po.standalonePrice : 0),
      0
    );
    if (totalStandalone === 0) return contract.performanceObligations;

    return contract.performanceObligations.map((po) => ({
      ...po,
      allocationPercentage: po.standalonePrice / totalStandalone,
    }));
  }

  static calculateRevenueSchedule(contract: Contract, periods: string[]): RevenueSchedule[] {
    const schedules: RevenueSchedule[] = [];

    // Allocate transaction price across obligations first
    const allocatedPOs = RevRecEngine.allocateTransactionPrice(contract);

    // ASC 606 transaction-price allocation done EXACTLY: per-PO values sum to
    // totalContractValue to the cent (largest-remainder). The previous
    // `totalContractValue * allocationPercentage` used IEEE-754 doubles, so e.g.
    // 120000 * (80000/120000) evaluated to 79999.99999999999 and the per-PO
    // allocations did not reconcile to the contract total. All running totals
    // stay in Decimal; we round only when emitting numbers.
    const totalContractValue = new Decimal(contract.totalValue);
    const weights = allocatedPOs.map((po) =>
      Number.isFinite(po.standalonePrice) ? po.standalonePrice : 0
    );
    const totalStandalone = weights.reduce((a, b) => a + b, 0);
    const allocated: Decimal[] =
      totalStandalone > 0 && contract.totalValue > 0
        ? allocateMoney(contract.totalValue, weights)
        : weights.map(() => new Decimal(0));

    let totalRecognizedSoFar = new Decimal(0);

    const poRecognitionState = new Map<string, Decimal>(); // poId -> recognizedAmount
    const poCompletionHistory = new Map<string, number[]>(); // poId -> completion metrics per period

    periods.forEach((period, _periodIndex) => {
      let periodAmount = new Decimal(0);

      allocatedPOs.forEach((po, i) => {
        const allocatedValue = allocated[i]!;
        const alreadyRecognized = poRecognitionState.get(po.id) ?? new Decimal(0);

        if (po.recognitionMethod === 'point_in_time') {
          // Point-in-Time: Recognize full allocated value when recognitionDate is reached AND completionMetric is 1
          const recognitionPeriod = po.recognitionDate
            ? po.recognitionDate.slice(0, 7)
            : contract.startDate.slice(0, 7);
          // Require explicit completion (completionMetric must be exactly 1, not undefined)
          const isCompleted = po.completionMetric !== undefined && po.completionMetric >= 1;

          if (period === recognitionPeriod && isCompleted && alreadyRecognized.isZero()) {
            periodAmount = periodAmount.plus(allocatedValue);
            poRecognitionState.set(po.id, alreadyRecognized.plus(allocatedValue));
          }
        } else if (po.recognitionMethod === 'over_time') {
          const pattern = po.recognitionPattern || 'straight_line';
          if (pattern === 'straight_line') {
            // Straight-line over periods between start and end date
            const startPeriod = contract.startDate.slice(0, 7);
            const endPeriod = contract.endDate.slice(0, 7);

            if (period >= startPeriod && period <= endPeriod) {
              const contractPeriods = periods.filter((p) => p >= startPeriod && p <= endPeriod);
              const monthlyAmount = allocatedValue.div(Math.max(1, contractPeriods.length));

              // Ensure we don't over-recognize (exact remainder in the final period)
              const amountToRecognize = Decimal.min(
                monthlyAmount,
                allocatedValue.minus(alreadyRecognized)
              );
              if (amountToRecognize.gt(0)) {
                periodAmount = periodAmount.plus(amountToRecognize);
                poRecognitionState.set(po.id, alreadyRecognized.plus(amountToRecognize));
              }
            }
          } else if (pattern === 'output' || pattern === 'input') {
            // Percentage of Completion (POC) — cumulative method
            const currentMetric = po.completionMetric || 0;
            const history = poCompletionHistory.get(po.id) || [];
            history.push(currentMetric);
            poCompletionHistory.set(po.id, history);

            // Cumulative, non-decreasing
            const cumulativeCompletion = Math.max(...history);
            const targetTotalRecognition = allocatedValue.times(cumulativeCompletion);
            const amountToRecognize = Decimal.max(
              new Decimal(0),
              targetTotalRecognition.minus(alreadyRecognized)
            );

            if (amountToRecognize.gt(0)) {
              periodAmount = periodAmount.plus(amountToRecognize);
              poRecognitionState.set(po.id, alreadyRecognized.plus(amountToRecognize));
            }
          }
        }
      });

      totalRecognizedSoFar = totalRecognizedSoFar.plus(periodAmount);
      schedules.push({
        period,
        amount: roundTo(periodAmount),
        recognizedToDate: roundTo(totalRecognizedSoFar),
        remainingToRecognize: roundTo(
          Decimal.max(new Decimal(0), totalContractValue.minus(totalRecognizedSoFar))
        ),
      });
    });

    return schedules;
  }

  static handleContractModification(contract: Contract, mod: ContractModification): Contract {
    const updatedContract = JSON.parse(JSON.stringify(contract)) as Contract;
    if (!updatedContract.contractModifications) updatedContract.contractModifications = [];
    updatedContract.contractModifications.push(mod);

    // ASC 606 contract modification accounting:
    // - 'termination': reduce value
    // - 'discount': reduce value (prospective or cumulative catch-up)
    // - 'additional_goods': treat as separate contract if priced at standalone selling price
    // - 'extension': treat as termination of old + creation of new contract (prospective)
    switch (mod.type) {
      case 'termination':
        updatedContract.totalValue = Math.max(0, updatedContract.totalValue + mod.value);
        break;
      case 'discount':
        // Apply discount (mod.value should be negative for discounts)
        updatedContract.totalValue = Math.max(0, updatedContract.totalValue + mod.value);
        break;
      case 'additional_goods':
        // If priced at standalone selling price, treat as separate contract
        // Otherwise, treat as modification of existing contract (cumulative catch-up)
        updatedContract.totalValue += mod.value;
        break;
      case 'extension':
        // Extend contract and add value
        updatedContract.totalValue += mod.value;
        break;
      default:
        updatedContract.totalValue += mod.value;
    }

    return updatedContract;
  }

  static getContractAssetLiability(
    contractId: string,
    schedules: RevenueSchedule[],
    billedAmounts: Map<string, number>, // period -> billed amount
    periods: string[]
  ): ContractAssetLiability[] {
    const results: ContractAssetLiability[] = [];
    let cumulativeRecognized = 0;
    let cumulativeBilled = 0;

    periods.forEach((period) => {
      const schedule = schedules.find((s) => s.period === period);
      const billed = billedAmounts.get(period) || 0;

      cumulativeRecognized += schedule?.amount || 0;
      cumulativeBilled += billed;

      const contractAsset = Math.max(0, cumulativeRecognized - cumulativeBilled); // unbilled
      const contractLiability = Math.max(0, cumulativeBilled - cumulativeRecognized); // deferred

      results.push({
        contractId,
        period,
        contractAsset,
        contractLiability,
        netPosition: contractAsset - contractLiability,
      });
    });

    return results;
  }

  static constrainVariableConsideration(
    variableAmount: number,
    probabilityOfReversal: number,
    constraintThreshold: number = 0.75
  ): number {
    // ASC 606-10-32-11: Constrain variable consideration to amounts
    // for which it is probable that a significant reversal will not occur
    // probabilityOfReversal: 0 = no reversal likely, 1 = reversal certain
    if (probabilityOfReversal >= constraintThreshold) {
      return 0; // Constrain — don't include in transaction price
    }
    // Money × reversal ratio — use the canonical primitive so the constrained
    // consideration is rounded to the cent (ROUND_HALF_UP), not a raw float.
    return roundTo(multiplyMoney(variableAmount, 1 - probabilityOfReversal));
  }

  static getDeferredRevenue(schedules: RevenueSchedule[], asOfDate: string): number {
    const lastSchedule = schedules
      .filter((s) => s.period <= asOfDate)
      .sort((a, b) => b.period.localeCompare(a.period))[0];

    return lastSchedule ? lastSchedule.remainingToRecognize : 0;
  }
}
