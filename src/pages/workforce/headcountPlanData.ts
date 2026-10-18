import { sumMoney, roundTo, divideMoney } from '@/utils/money';

/**
 * Phase 10 — headcount plan derivation (decontaminated).
 *
 * This page previously multiplied a real average cost by INVENTED
 * department headcounts (`Math.floor(15 + ((idx * 7) % 40))` over a
 * hardcoded department list) and an invented monthly trend with
 * invented attrition. Every figure below derives from actual
 * workforce records: current headcount and salary cost per
 * department from active employees, and a hiring trend from actual
 * start dates. "Planned" headcount and attrition are NOT shown: no
 * plan or termination-date data exists anywhere to derive them
 * from, and inventing them is what got this page flagged.
 */

export interface HeadcountEmployee {
  department?: string;
  salary?: number;
  status?: string;
  startDate?: string;
}

export interface DepartmentHeadcount {
  department: string;
  current: number;
  cost: number;
}

export interface HeadcountTrendPoint {
  /** YYYY-MM */
  month: string;
  headcount: number;
}

export interface HeadcountPlan {
  departments: DepartmentHeadcount[];
  totalHeadcount: number;
  totalCost: number;
  avgCostPerHead: number;
  trend: HeadcountTrendPoint[];
}

function monthEnd(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(Date.UTC(y ?? 1970, m ?? 1, 0)).getUTCDate();
  return `${month}-${String(last).padStart(2, '0')}`;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export function deriveHeadcountPlan(
  employees: readonly HeadcountEmployee[],
  asOfMonth: string
): HeadcountPlan {
  const active = employees.filter((e) => e.status === 'active');

  const byDept = new Map<string, HeadcountEmployee[]>();
  for (const e of active) {
    const dept = (e.department ?? '').trim() || 'Unspecified department';
    const list = byDept.get(dept) ?? [];
    list.push(e);
    byDept.set(dept, list);
  }
  const departments: DepartmentHeadcount[] = [...byDept.entries()]
    .map(([department, members]) => ({
      department,
      current: members.length,
      cost: roundTo(sumMoney(members.map((m) => m.salary ?? 0)), 2),
    }))
    .sort((a, b) => b.current - a.current || a.department.localeCompare(b.department));

  const totalCost = sumMoney(active.map((e) => e.salary ?? 0));

  const trend: HeadcountTrendPoint[] = [];
  for (let back = 5; back >= 0; back--) {
    const month = shiftMonth(asOfMonth, -back);
    const end = monthEnd(month);
    trend.push({
      month,
      headcount: active.filter((e) => (e.startDate ?? '') !== '' && (e.startDate ?? '') <= end)
        .length,
    });
  }

  return {
    departments,
    totalHeadcount: active.length,
    totalCost: roundTo(totalCost, 2),
    avgCostPerHead: active.length > 0 ? roundTo(divideMoney(totalCost, active.length), 2) : 0,
    trend,
  };
}
