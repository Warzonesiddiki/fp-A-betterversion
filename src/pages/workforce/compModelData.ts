import { toDecimal, sumMoney, roundTo, divideMoney, multiplyMoney } from '@/utils/money';

/**
 * Phase 10 — compensation modelling derivation (decontaminated).
 *
 * This page previously modelled merit on a hardcoded LEVELS table:
 * invented salary bands, invented headcounts (45/80/55/25/10/8) and
 * invented performance ratings, presented as the company's comp
 * structure and projected over five years. None of it came from
 * data.
 *
 * The derivation below uses only what the workforce store actually
 * carries: active employees with a position and a salary. Positions
 * group the rows; min/max/average are the ACTUAL salaries in each
 * group; merit is the user's scenario input applied to actual cost.
 * Performance ratings are not carried anywhere, so no rating column
 * exists. With no active employees there is nothing to model and the
 * page says so.
 */

export interface CompEmployee {
  position?: string;
  salary?: number;
  status?: string;
}

export interface PositionComp {
  position: string;
  headcount: number;
  minSalary: number;
  maxSalary: number;
  avgSalary: number;
  totalCost: number;
}

export interface PositionCompWithMerit extends PositionComp {
  newCost: number;
  increase: number;
}

export function derivePositionComp(employees: readonly CompEmployee[]): PositionComp[] {
  const groups = new Map<string, number[]>();
  for (const e of employees) {
    if (e.status !== 'active') continue;
    const position = (e.position ?? '').trim() || 'Unspecified position';
    const list = groups.get(position) ?? [];
    list.push(e.salary ?? 0);
    groups.set(position, list);
  }
  return [...groups.entries()]
    .map(([position, salaries]) => {
      const total = sumMoney(salaries);
      const decimals = salaries.map((s) => toDecimal(s));
      const min = decimals.reduce((a, b) => (b.lessThan(a) ? b : a));
      const max = decimals.reduce((a, b) => (b.greaterThan(a) ? b : a));
      return {
        position,
        headcount: salaries.length,
        minSalary: roundTo(min, 2),
        maxSalary: roundTo(max, 2),
        avgSalary: roundTo(divideMoney(total, salaries.length), 2),
        totalCost: roundTo(total, 2),
      };
    })
    .sort(
      (a, b) =>
        toDecimal(b.totalCost).comparedTo(toDecimal(a.totalCost)) ||
        a.position.localeCompare(b.position)
    );
}

export function applyMeritIncrease(
  rows: readonly PositionComp[],
  meritPct: number
): PositionCompWithMerit[] {
  return rows.map((r) => {
    const newCost = roundTo(multiplyMoney(r.totalCost, 1 + meritPct / 100), 2);
    return {
      ...r,
      newCost,
      increase: roundTo(toDecimal(newCost).minus(toDecimal(r.totalCost)), 2),
    };
  });
}
