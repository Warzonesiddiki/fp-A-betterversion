import type { HeadcountInput, AttritionForecast } from '@/types/sector-types';

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
    const bonus = input.salary * (input.bonusPct / 100);
    const benefits = input.salary * (input.benefitsPct / 100);
    const taxes = (input.salary + bonus) * (input.taxPct / 100);
    const totalCost = input.salary + bonus + input.equityValue + benefits + taxes;

    return {
      totalCost,
      costPerFTE: totalCost,
      salary: input.salary,
      bonus,
      equity: input.equityValue,
      benefits,
      taxes,
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
