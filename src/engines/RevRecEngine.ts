/* eslint-disable @typescript-eslint/no-unused-vars */
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

    const totalContractValue = contract.totalValue;
    let totalRecognizedSoFar = 0;

    const poRecognitionState = new Map<string, number>(); // poId -> recognizedAmount
    const poCompletionHistory = new Map<string, number[]>(); // poId -> completion metrics per period

    periods.forEach((period, periodIndex) => {
      let periodAmount = 0;

      allocatedPOs.forEach((po) => {
        const allocatedValue = totalContractValue * po.allocationPercentage;
        const alreadyRecognized = poRecognitionState.get(po.id) || 0;

        if (po.recognitionMethod === 'point_in_time') {
          // Point-in-Time: Recognize full allocated value when recognitionDate is reached AND completionMetric is 1
          const recognitionPeriod = po.recognitionDate
            ? po.recognitionDate.slice(0, 7)
            : contract.startDate.slice(0, 7);
          // Require explicit completion (completionMetric must be exactly 1, not undefined)
          const isCompleted = po.completionMetric !== undefined && po.completionMetric >= 1;

          if (period === recognitionPeriod && isCompleted && alreadyRecognized === 0) {
            const amountToRecognize = allocatedValue;
            periodAmount += amountToRecognize;
            poRecognitionState.set(po.id, alreadyRecognized + amountToRecognize);
          }
        } else if (po.recognitionMethod === 'over_time') {
          const pattern = po.recognitionPattern || 'straight_line';
          if (pattern === 'straight_line') {
            // Straight-line over periods between start and end date
            const startPeriod = contract.startDate.slice(0, 7);
            const endPeriod = contract.endDate.slice(0, 7);

            if (period >= startPeriod && period <= endPeriod) {
              const contractPeriods = periods.filter((p) => p >= startPeriod && p <= endPeriod);
              const monthlyAmount = allocatedValue / Math.max(1, contractPeriods.length);

              // Ensure we don't over-recognize
              const amountToRecognize = Math.min(monthlyAmount, allocatedValue - alreadyRecognized);
              if (amountToRecognize > 0) {
                periodAmount += amountToRecognize;
                poRecognitionState.set(po.id, alreadyRecognized + amountToRecognize);
              }
            }
          } else if (pattern === 'output' || pattern === 'input') {
            // Percentage of Completion (POC) — cumulative method
            // Track completion metrics over time for proper cumulative recognition
            const currentMetric = po.completionMetric || 0;
            const history = poCompletionHistory.get(po.id) || [];
            history.push(currentMetric);
            poCompletionHistory.set(po.id, history);

            // Use the highest completion metric seen so far (cumulative, non-decreasing)
            const cumulativeCompletion = Math.max(...history);
            const targetTotalRecognition = allocatedValue * cumulativeCompletion;
            const amountToRecognize = Math.max(0, targetTotalRecognition - alreadyRecognized);

            if (amountToRecognize > 0) {
              periodAmount += amountToRecognize;
              poRecognitionState.set(po.id, alreadyRecognized + amountToRecognize);
            }
          }
        }
      });

      totalRecognizedSoFar += periodAmount;
      schedules.push({
        period,
        amount: periodAmount,
        recognizedToDate: totalRecognizedSoFar,
        remainingToRecognize: Math.max(0, totalContractValue - totalRecognizedSoFar),
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
    return variableAmount * (1 - probabilityOfReversal);
  }

  static getDeferredRevenue(schedules: RevenueSchedule[], asOfDate: string): number {
    const lastSchedule = schedules
      .filter((s) => s.period <= asOfDate)
      .sort((a, b) => b.period.localeCompare(a.period))[0];

    return lastSchedule ? lastSchedule.remainingToRecognize : 0;
  }
}
