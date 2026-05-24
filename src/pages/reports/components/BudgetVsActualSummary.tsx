import { memo } from 'react';

interface BudgetVsActualSummaryProps {
  totalBudget: string;
  totalActual: string;
  netVariance: string;
  utilizationPercentage: number;
  isVarianceFavorable?: boolean;
}

export const BudgetVsActualSummary = memo(function BudgetVsActualSummary({
  totalBudget,
  totalActual,
  netVariance,
  utilizationPercentage,
  isVarianceFavorable = false,
}: BudgetVsActualSummaryProps) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-sm p-8">
      <div className="flex items-center justify-center space-x-12 mb-10">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-60 mb-2">
            Total Budget
          </p>
          <p className="text-3xl font-black text-slate-800">{totalBudget}</p>
        </div>
        <div className="w-px h-12 bg-slate-100" />
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-60 mb-2">
            Total Actual
          </p>
          <p className="text-3xl font-black text-slate-800">{totalActual}</p>
        </div>
        <div className="w-px h-12 bg-slate-100" />
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-60 mb-2">
            Net Variance
          </p>
          <p
            className={`text-3xl font-black ${isVarianceFavorable ? 'text-green-600' : 'text-red-600'}`}
          >
            {netVariance}
          </p>
        </div>
      </div>

      <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 flex">
        <div
          className="h-full bg-blue-500 transition-all duration-1000"
          style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
        />
      </div>
      <p className="mt-2 text-[10px] text-center font-bold text-slate-400 uppercase tracking-tighter">
        {utilizationPercentage.toFixed(1)}% of budget utilized
      </p>
    </div>
  );
});
