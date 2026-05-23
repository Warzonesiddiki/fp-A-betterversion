import { memo } from 'react';

export interface VarianceDataRow {
  account: string;
  budget: string;
  actual: string;
  variance: string;
  percentVar: string;
  isFavorable?: boolean;
}

interface BudgetVsActualTableProps {
  data: VarianceDataRow[];
}

export const BudgetVsActualTable = memo(function BudgetVsActualTable({ data }: BudgetVsActualTableProps) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
      <table className="w-full text-sm" role="grid" aria-label="Budget vs Actual Variance Analysis data">
        <thead>
          <tr className="text-left text-slate-400 text-xs uppercase border-b border-[var(--border-subtle)]" role="row">
            <th className="px-6 py-3" role="columnheader">Account</th>
            <th className="px-6 py-3 text-right" role="columnheader">Budget</th>
            <th className="px-6 py-3 text-right" role="columnheader">Actual</th>
            <th className="px-6 py-3 text-right" role="columnheader">Variance</th>
            <th className="px-6 py-3 text-right" role="columnheader">% Var</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-slate-900/50" role="row">
              <td className="px-6 py-3 text-slate-300" role="gridcell">{row.account}</td>
              <td className="px-6 py-3 text-right tabular-nums" role="gridcell">{row.budget}</td>
              <td className="px-6 py-3 text-right tabular-nums" role="gridcell">{row.actual}</td>
              <td className={`px-6 py-3 text-right tabular-nums ${row.isFavorable ? 'text-green-400' : 'text-red-400'}`} role="gridcell">
                {row.variance}
              </td>
              <td className={`px-6 py-3 text-right tabular-nums ${row.isFavorable ? 'text-green-400' : 'text-red-400'}`} role="gridcell">
                {row.percentVar}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
