/**
 * MONEY MIGRATION (2026-08-03): All currency-bearing compensation costs
 * (salary, bonus, benefits, taxes, totalCost, equity) now use the canonical
 * money primitive (`src/utils/money.ts`) so that totalCost = salary + bonus + equity + benefits + taxes
 * cannot accumulate IEEE-754 drift. Headcount/attrition counts and percentages stay float.
 */

import type { HeadcountInput, AttritionForecast } from '@/types/sector-types';
import { addMoney, multiplyMoney, sumMoney, roundTo, toDecimal } from '@/utils/money';

export interface CompInput {
  salary: number;
  bonusPct: number;
  equityValue: number;
  benefitsPct: number;
  taxPct: number;
}

export class WorkforceEngine {
  static forecastHeadcount(input: HeadcountInput, periods: number): AttritionForecast[] {
    const forecasts: AttritionForecast[] = [];
    let headcount = input.current;

    for (let i = 1; i <= periods; i++) {
      const period = `Period ${i}`;
      const startingHeadcount = headcount;
      const hires = input.hires
        .filter((h) => h.period === period)
        .reduce((acc, h) => acc + h.count, 0);
      const departures = Math.round(startingHeadcount * (input.attrition / 100));
      headcount = startingHeadcount + hires - departures;

      forecasts.push({
        period,
        startingHeadcount,
        hires,
        departures,
        endingHeadcount: headcount,
        attritionRate: input.attrition,
      });
    }

    return forecasts;
  }

  static calculateCompCost(input: CompInput): {
    totalCost: number;
    costPerFTE: number;
    salary: number;
    bonus: number;
    equity: number;
    benefits: number;
    taxes: number;
  } {
    // Money migration: use addMoney/multiplyMoney/sumMoney/roundTo for currency values
    const salaryD = toDecimal(input.salary, 'salary');
    const bonusD = multiplyMoney(salaryD, input.bonusPct / 100);
    const benefitsD = multiplyMoney(salaryD, input.benefitsPct / 100);
    const preTax = addMoney(salaryD, bonusD);
    const taxesD = multiplyMoney(preTax, input.taxPct / 100);
    const equityD = toDecimal(input.equityValue, 'equityValue');
    const totalCostD = sumMoney([salaryD, bonusD, equityD, benefitsD, taxesD]);

    return {
      totalCost: roundTo(totalCostD),
      costPerFTE: roundTo(totalCostD),
      salary: roundTo(salaryD),
      bonus: roundTo(bonusD),
      equity: roundTo(equityD),
      benefits: roundTo(benefitsD),
      taxes: roundTo(taxesD),
    };
  }

  static calculateAttrition(headcount: number, departures: number): number {
    if (headcount <= 0) return 0;
    return (departures / headcount) * 100;
  }

  static modelHiring(
    current: number,
    target: number,
    rampMonths: number
  ): {
    month: number;
    hires: number;
    productive: number;
    total: number;
  }[] {
    const results: { month: number; hires: number; productive: number; total: number }[] = [];
    let headcount = current;
    const needed = target - current;
    const monthlyHires = Math.ceil(needed / Math.max(1, rampMonths));

    for (let i = 1; i <= rampMonths; i++) {
      const hires = i <= Math.ceil(needed / monthlyHires) ? monthlyHires : 0;
      headcount += hires;
      results.push({
        month: i,
        hires,
        productive: headcount - hires,
        total: headcount,
      });
    }

    return results;
  }
}
