// @money-ast-allow Reason: Impairment boolean: carryingAmount > recoverableAmount is an IAS 36 test producing a boolean, surrounded by exact arithmetic
/**
 * @fileoverview Depreciation Engine — Fixed asset depreciation calculations
 * Supports straight-line, declining balance, MACRS, units-of-production,
 * sum-of-years-digits, impairment testing, disposal, and revaluation.
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category Fixed Assets
 * @sector 16 (all)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 9th engine)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 */
/**
 * DepreciationEngine — Fixed asset depreciation calculations
 * Supports straight-line, declining balance, MACRS, units-of-production,
 * sum-of-years-digits, impairment testing, disposal, and revaluation.
 */

import Decimal from 'decimal.js';
import {
  allocateMoney,
  divideMoney,
  moneyEquals,
  multiplyMoney,
  roundTo,
  splitMoneyEvenly,
  subtractMoney,
  sumMoney,
  toDecimal,
} from '@/utils/money';
import { assertInvariant } from '@/utils/invariants';

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
    return roundTo(subtractMoney(cost, salvage).div(life));
  }

  // ─── Declining Balance ────────────────────────────────────────

  static decliningBalance(cost: number, salvage: number, life: number, rate: number): number[] {
    const schedule: number[] = [];
    let bookValue = toDecimal(cost);
    const salvageD = toDecimal(salvage);
    const rateD = toDecimal(rate);
    for (let year = 0; year < life; year++) {
      // dep = min(bookValue*rate, bookValue - salvage), exact decimal.
      const capped = bookValue.minus(salvageD);
      const dep = bookValue.times(rateD).lte(capped) ? bookValue.times(rateD) : capped;
      const depNum = dep.toNumber();
      schedule.push(depNum > 0 ? roundTo(dep) : 0);
      bookValue = bookValue.minus(dep);
      if (bookValue.lte(salvageD)) break;
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
    return roundTo(toDecimal(cost).times(rates![year - 1]!));
  }

  static macrsSchedule(cost: number, life: number): DepreciationEntry[] {
    const rates = this.MACRS_RATES[life];
    if (!rates) return [];
    let accumulated = toDecimal(0);
    const costD = toDecimal(cost);
    return rates.map((rate, i) => {
      const dep = roundTo(costD.times(rate));
      accumulated = accumulated.plus(dep);
      const accumulatedNum = accumulated.toNumber();
      const depNum = dep;
      return {
        period: i + 1,
        beginningValue: roundTo(costD.minus(accumulated.minus(depNum))),
        depreciation: depNum,
        accumulated: accumulatedNum,
        endingValue: roundTo(costD.minus(accumulated)),
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
    return roundTo(subtractMoney(cost, salvage).div(totalUnits).times(currentUnits));
  }

  // ─── Sum-of-Years-Digits ─────────────────────────────────────

  static sumOfYearsDigits(cost: number, salvage: number, life: number, year: number): number {
    if (life <= 0 || year < 1 || year > life) return 0;
    const sum = (life * (life + 1)) / 2;
    return roundTo(
      subtractMoney(cost, salvage)
        .times(life - year + 1)
        .div(sum)
    );
  }

  static sumOfYearsDigitsSchedule(
    cost: number,
    salvage: number,
    life: number
  ): DepreciationEntry[] {
    if (life <= 0) return [];
    const base = subtractMoney(cost, salvage);
    // Weights life, life-1, ..., 1 — a weighted allocation that sums EXACTLY to
    // the depreciable base (largest-remainder), avoiding IEEE-754 drift from
    // `(cost - salvage) * w / sum` per period.
    const weights = Array.from({ length: life }, (_, i) => life - i);
    const parts: Decimal[] = base.gt(0)
      ? allocateMoney(base, weights)
      : weights.map(() => new Decimal(0));
    assertInvariant(
      moneyEquals(sumMoney(parts), base),
      'DEP-1',
      'SYD depreciation must sum to the depreciable base (cost - salvage)'
    );
    let accumulated = new Decimal(0);
    const schedule: DepreciationEntry[] = [];
    for (let year = 1; year <= life; year++) {
      const dep = parts[year - 1]!;
      const beginningValue = toDecimal(cost).minus(accumulated);
      accumulated = accumulated.plus(dep);
      schedule.push({
        period: year,
        beginningValue: roundTo(beginningValue),
        depreciation: roundTo(dep),
        accumulated: roundTo(accumulated),
        endingValue: roundTo(toDecimal(cost).minus(accumulated)),
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
      // Currency: exact decimal subtraction, cent-rounded (F-0006).
      impairmentLoss: isImpaired ? roundTo(subtractMoney(carryingAmount, recoverableAmount)) : 0,
      adjustedValue: isImpaired ? recoverableAmount : carryingAmount,
    };
  }

  // ─── Asset Disposal ──────────────────────────────────────────

  static assetDisposal(cost: number, accumulatedDep: number, salePrice: number): DisposalResult {
    // Book value and gain/loss are currency: exact decimal (F-0006).
    const bookValue = roundTo(subtractMoney(cost, accumulatedDep));
    const gainLoss = roundTo(subtractMoney(salePrice, bookValue));
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
    // Currency: exact decimal (F-0006). The revaluation ratio is a unitless
    // metric; the accumulated-depreciation adjustment is its currency
    // product, cent-rounded with declared half-up — NOT Math.round, which
    // rounds 0.075 (binary 0.074999…) to 0 instead of 0.08.
    const bookValue = roundTo(subtractMoney(originalCost, accumulatedDep));
    const revaluationSurplus = roundTo(subtractMoney(newValue, bookValue));
    const ratio = divideMoney(newValue, originalCost);
    return {
      revaluationSurplus,
      adjustedCost: newValue,
      adjustedAccumDep: roundTo(multiplyMoney(accumulatedDep, ratio)),
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
        if (life <= 0) return [];
        const base = subtractMoney(cost, salvage);
        // Equal split of the depreciable base across the life — parts sum
        // exactly to (cost - salvage), so the final period lands on salvage.
        const parts: Decimal[] = base.gt(0)
          ? splitMoneyEvenly(base, life)
          : Array.from({ length: life }, () => new Decimal(0));
        assertInvariant(
          moneyEquals(sumMoney(parts), base),
          'DEP-2',
          'straight-line depreciation must sum to the depreciable base (cost - salvage)'
        );
        let accumulated = new Decimal(0);
        return parts.map((dep, i) => {
          const beginningValue = toDecimal(cost).minus(accumulated);
          accumulated = accumulated.plus(dep);
          return {
            period: i + 1,
            beginningValue: roundTo(beginningValue),
            depreciation: roundTo(dep),
            accumulated: roundTo(accumulated),
            endingValue: roundTo(toDecimal(cost).minus(accumulated)),
          };
        });
      }
      case 'decliningBalance':
        return this.decliningBalance(cost, salvage, life, options?.rate ?? 2 / life).map(
          (dep, i, arr) => {
            // Accumulated/beginning/ending values are currency: exact
            // decimal sums and differences, cent-rounded (F-0006).
            const acc = roundTo(sumMoney(arr.slice(0, i + 1)));
            const depDec = toDecimal(dep);
            return {
              period: i + 1,
              beginningValue: roundTo(subtractMoney(cost, subtractMoney(acc, depDec))),
              depreciation: dep,
              accumulated: acc,
              endingValue: roundTo(subtractMoney(cost, acc)),
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
