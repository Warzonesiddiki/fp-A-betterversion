import { memo } from 'react';

export interface VarianceDataRow {
  account: string;
  budget: string;
  actual: string;
  variance: string;
  percentVar: string;
  isFavorable?: boolean;
  isMaterial?: boolean;
  isUnbudgeted?: boolean;
}

interface BudgetVsActualTableProps {
  data: VarianceDataRow[];
}

export const BudgetVsActualTable = memo(function BudgetVsActualTable({
  data,
}: BudgetVsActualTableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-8 text-center">
        <p className="text-slate-400 text-sm">No matching variance rows for current filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
      <table
        className="w-full text-sm"
        role="grid"
        aria-label="Budget vs Actual Variance Analysis data"
      >
        <thead>
          <tr
            className="text-left text-slate-400 text-xs uppercase border-b border-[var(--border-subtle)]"
            role="row"
          >
            <th className="px-6 py-3" role="columnheader">
              Account
            </th>
            <th className="px-6 py-3 text-right" role="columnheader">
              Budget
            </th>
            <th className="px-6 py-3 text-right" role="columnheader">
              Actual
            </th>
            <th className="px-6 py-3 text-right" role="columnheader">
              Variance
            </th>
            <th className="px-6 py-3 text-right" role="columnheader">
              % Var
            </th>
            <th className="px-6 py-3 text-center" role="columnheader">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {data.map((row, idx) => (
            <tr
              key={idx}
              className={`hover:bg-slate-900/50 ${
                row.isUnbudgeted ? 'bg-yellow-900/10' : row.isFavorable ? '' : 'bg-red-900/5'
              }`}
              role="row"
            >
              <td className="px-6 py-3 text-slate-300" role="gridcell">
                <span className="flex items-center gap-2">
                  {row.account}
                  {row.isMaterial && !row.isUnbudgeted && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-500/20 text-orange-400">
                      Material
                    </span>
                  )}
                  {row.isUnbudgeted && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-500/20 text-yellow-400">
                      Unbudgeted
                    </span>
                  )}
                </span>
              </td>
              <td className="px-6 py-3 text-right tabular-nums" role="gridcell">
                {row.budget}
              </td>
              <td className="px-6 py-3 text-right tabular-nums" role="gridcell">
                {row.actual}
              </td>
              <td
                className={`px-6 py-3 text-right tabular-nums ${row.isFavorable ? 'text-green-400' : 'text-red-400'}`}
                role="gridcell"
              >
                {row.variance}
              </td>
              <td
                className={`px-6 py-3 text-right tabular-nums ${row.isFavorable ? 'text-green-400' : 'text-red-400'}`}
                role="gridcell"
              >
                {row.percentVar}
              </td>
              <td className="px-6 py-3 text-center" role="gridcell">
                {row.isUnbudgeted ? (
                  <span className="text-yellow-400 text-[10px] font-bold uppercase">Unknown</span>
                ) : row.isFavorable ? (
                  <span className="inline-flex items-center gap-1 text-green-400 text-[10px] font-bold uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Fav
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-red-400 text-[10px] font-bold uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Unfav
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
