/**
 * DepreciationEngine — Fixed asset depreciation calculations
 * Supports straight-line, declining balance, MACRS, units-of-production,
 * sum-of-years-digits, impairment testing, disposal, and revaluation.
 */

export interface Asset {
  id: string;
  name: string;
  cost: number;
  salvage: number;
  usefulLife: number;
  placedInService: string;
  accumulatedDepreciation: number;
  currentValue: number;
}

export interface DepreciationEntry {
  period: number;
  beginningValue: number;
  depreciation: number;
  accumulated: number;
  endingValue: number;
}

export interface DisposalResult {
  cost: number;
  accumulatedDep: number;
  bookValue: number;
  salePrice: number;
  gainLoss: number;
  isGain: boolean;
}

export class DepreciationEngine {
  // ─── Straight-Line ────────────────────────────────────────────

  static straightLine(cost: number, salvage: number, life: number): number {
    if (life <= 0) return 0;
    return (cost - salvage) / life;
  }

  // ─── Declining Balance ────────────────────────────────────────

  static decliningBalance(cost: number, salvage: number, life: number, rate: number): number[] {
    const schedule: number[] = [];
    let bookValue = cost;
    for (let year = 0; year < life; year++) {
      const dep = Math.min(bookValue * rate, bookValue - salvage);
      schedule.push(dep > 0 ? dep : 0);
      bookValue -= dep;
      if (bookValue <= salvage) break;
    }
    return schedule;
  }

  // ─── MACRS (Modified Accelerated Cost Recovery System) ────────

  private static MACRS_RATES: Record<number, number[]> = {
    3: [0.3333, 0.4445, 0.1481, 0.0741],
    5: [0.2, 0.32, 0.192, 0.1152, 0.1152, 0.0576],
    7: [0.1429, 0.2449, 0.1749, 0.1249, 0.0893, 0.0892, 0.0893, 0.0446],
    10: [0.1, 0.18, 0.144, 0.1152, 0.0922, 0.0737, 0.0655, 0.0655, 0.0656, 0.0655, 0.0328],
    15: [
      0.05, 0.095, 0.0855, 0.077, 0.0693, 0.0623, 0.059, 0.059, 0.0591, 0.059, 0.0591, 0.059,
      0.0591, 0.059, 0.0591, 0.0295,
    ],
    20: [
      0.0375, 0.07219, 0.06677, 0.06177, 0.05713, 0.05285, 0.04888, 0.04522, 0.04462, 0.04461,
      0.04462, 0.04461, 0.04462, 0.04461, 0.04462, 0.04461, 0.04462, 0.04461, 0.04462, 0.04461,
      0.02231,
    ],
  };

  static macrs(cost: number, life: number, year: number): number {
    const rates = this.MACRS_RATES[life];
    if (!rates || year < 1 || year > rates.length) return 0;
    return cost * rates[year - 1];
  }

  static macrsSchedule(cost: number, life: number): DepreciationEntry[] {
    const rates = this.MACRS_RATES[life];
    if (!rates) return [];
    let accumulated = 0;
    return rates.map((rate, i) => {
      const dep = cost * rate;
      accumulated += dep;
      return {
        period: i + 1,
        beginningValue: cost - (accumulated - dep),
        depreciation: dep,
        accumulated,
        endingValue: cost - accumulated,
      };
    });
  }

  // ─── Units of Production ──────────────────────────────────────

  static unitsOfProduction(
    cost: number,
    salvage: number,
    totalUnits: number,
    currentUnits: number
  ): number {
    if (totalUnits <= 0) return 0;
    return ((cost - salvage) / totalUnits) * currentUnits;
  }

  // ─── Sum-of-Years-Digits ─────────────────────────────────────

  static sumOfYearsDigits(cost: number, salvage: number, life: number, year: number): number {
    if (life <= 0 || year < 1 || year > life) return 0;
    const sum = (life * (life + 1)) / 2;
    return ((cost - salvage) * (life - year + 1)) / sum;
  }

  static sumOfYearsDigitsSchedule(
    cost: number,
    salvage: number,
    life: number
  ): DepreciationEntry[] {
    const sum = (life * (life + 1)) / 2;
    let accumulated = 0;
    const schedule: DepreciationEntry[] = [];
    for (let year = 1; year <= life; year++) {
      const dep = ((cost - salvage) * (life - year + 1)) / sum;
      accumulated += dep;
      schedule.push({
        period: year,
        beginningValue: cost - (accumulated - dep),
        depreciation: dep,
        accumulated,
        endingValue: cost - accumulated,
      });
    }
    return schedule;
  }

  // ─── Impairment Testing ───────────────────────────────────────

  static impairmentTest(
    carryingAmount: number,
    recoverableAmount: number
  ): {
    isImpaired: boolean;
    impairmentLoss: number;
    adjustedValue: number;
  } {
    const isImpaired = carryingAmount > recoverableAmount;
    return {
      isImpaired,
      impairmentLoss: isImpaired ? carryingAmount - recoverableAmount : 0,
      adjustedValue: isImpaired ? recoverableAmount : carryingAmount,
    };
  }

  // ─── Asset Disposal ──────────────────────────────────────────

  static assetDisposal(cost: number, accumulatedDep: number, salePrice: number): DisposalResult {
    const bookValue = cost - accumulatedDep;
    const gainLoss = salePrice - bookValue;
    return {
      cost,
      accumulatedDep,
      bookValue,
      salePrice,
      gainLoss,
      isGain: gainLoss > 0,
    };
  }

  // ─── Asset Revaluation ───────────────────────────────────────

  static assetRevaluation(
    originalCost: number,
    accumulatedDep: number,
    newValue: number
  ): {
    revaluationSurplus: number;
    adjustedCost: number;
    adjustedAccumDep: number;
  } {
    const bookValue = originalCost - accumulatedDep;
    const revaluationSurplus = newValue - bookValue;
    const ratio = newValue / originalCost;
    return {
      revaluationSurplus,
      adjustedCost: newValue,
      adjustedAccumDep: Math.round(accumulatedDep * ratio),
    };
  }

  // ─── Schedule Generation ─────────────────────────────────────

  static generateSchedule(
    method:
      | 'straightLine'
      | 'decliningBalance'
      | 'macrs'
      | 'unitsOfProduction'
      | 'sumOfYearsDigits',
    cost: number,
    salvage: number,
    life: number,
    options?: { rate?: number; totalUnits?: number }
  ): DepreciationEntry[] {
    switch (method) {
      case 'straightLine': {
        const dep = this.straightLine(cost, salvage, life);
        let accumulated = 0;
        return Array.from({ length: life }, (_, i) => {
          accumulated += dep;
          return {
            period: i + 1,
            beginningValue: cost - (accumulated - dep),
            depreciation: dep,
            accumulated,
            endingValue: cost - accumulated,
          };
        });
      }
      case 'decliningBalance':
        return this.decliningBalance(cost, salvage, life, options?.rate ?? 2 / life).map(
          (dep, i, arr) => {
            const acc = arr.slice(0, i + 1).reduce((a, b) => a + b, 0);
            return {
              period: i + 1,
              beginningValue: cost - (acc - dep),
              depreciation: dep,
              accumulated: acc,
              endingValue: cost - acc,
            };
          }
        );
      case 'macrs':
        return this.macrsSchedule(cost, life);
      case 'sumOfYearsDigits':
        return this.sumOfYearsDigitsSchedule(cost, salvage, life);
      case 'unitsOfProduction':
        return [];
      default:
        return [];
    }
  }
}
