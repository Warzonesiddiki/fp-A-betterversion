import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Database } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGLStore } from '@/store/glStore';
import { ExportEngine } from '@/engines/ExportEngine';
import { BudgetVsActualHeader } from './components/BudgetVsActualHeader';
import { BudgetVsActualSummary } from './components/BudgetVsActualSummary';
import { BudgetVsActualTable, type VarianceDataRow } from './components/BudgetVsActualTable';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function BudgetVsActualPage() {
  const [helpOpen, setHelpOpen] = useState(false);
  const { entries, isLoading, importError } = useGLStore();

  useEffect(() => {
    document.title = 'FinPlan Pro — Budget Vs Actual';
  }, []);

  const reportData = useMemo(() => {
    if (entries.length === 0) return null;

    const revenueEntries = entries.filter(e => (e.accountCode || '').startsWith('4'));
    const cogsEntries = entries.filter(e => (e.accountCode || '').startsWith('5'));
    const opexEntries = entries.filter(e => (e.accountCode || '').startsWith('6'));

    const sumActual = (items: typeof entries) =>
      items.reduce((s, e) => s + Math.abs(e.debit - e.credit), 0);

    const revenueActual = sumActual(revenueEntries);
    const cogsActual = sumActual(cogsEntries);
    const opexActual = sumActual(opexEntries);

    // Budget estimates (105% of actual for revenue, 95% for expenses as baseline)
    const revenueBudget = revenueActual * 1.05 || 1500000;
    const cogsBudget = cogsActual * 0.95 || 600000;
    const opexBudget = opexActual * 0.93 || 450000;

    const totalBudget = revenueBudget + cogsBudget + opexBudget;
    const totalActual = revenueActual + cogsActual + opexActual;
    const netVariance = totalBudget - totalActual;
    const utilization = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

    const rows: VarianceDataRow[] = [
      {
        account: 'Sales Revenue',
        budget: formatCurrency(revenueBudget),
        actual: formatCurrency(revenueActual),
        variance: formatCurrency(revenueBudget - revenueActual),
        percentVar: `${(((revenueBudget - revenueActual) / revenueBudget) * 100).toFixed(1)}%`,
        isFavorable: revenueActual >= revenueBudget,
      },
      {
        account: 'Cost of Goods Sold',
        budget: formatCurrency(cogsBudget),
        actual: formatCurrency(cogsActual),
        variance: formatCurrency(cogsBudget - cogsActual),
        percentVar: `${(((cogsBudget - cogsActual) / cogsBudget) * 100).toFixed(1)}%`,
        isFavorable: cogsActual <= cogsBudget,
      },
      {
        account: 'Operating Expenses',
        budget: formatCurrency(opexBudget),
        actual: formatCurrency(opexActual),
        variance: formatCurrency(opexBudget - opexActual),
        percentVar: `${(((opexBudget - opexActual) / opexBudget) * 100).toFixed(1)}%`,
        isFavorable: opexActual <= opexBudget,
      },
    ];

    return {
      totalBudget: formatCurrency(totalBudget),
      totalActual: formatCurrency(totalActual),
      netVariance: formatCurrency(Math.abs(netVariance)),
      utilization,
      isVarianceFavorable: netVariance >= 0,
      rows,
      raw: { revenueBudget, revenueActual, cogsBudget, cogsActual, opexBudget, opexActual },
    };
  }, [entries]);

  const handleExportPDF = () => {
    if (!reportData) return;
    ExportEngine.exportToPDF(
      {
        headers: ['Account', 'Budget', 'Actual', 'Variance', '% Variance'],
        rows: reportData.rows.map(r => [r.account, r.budget, r.actual, r.variance, r.percentVar]),
      },
      { title: 'Budget vs Actual Report', companyName: 'FinPlan Pro' }
    );
  };

  const handleExportExcel = () => {
    if (!reportData) return;
    ExportEngine.exportToExcel(
      {
        headers: ['Account', 'Budget', 'Actual', 'Variance', '% Variance'],
        rows: reportData.rows.map(r => [r.account, r.budget, r.actual, r.variance, r.percentVar]),
      },
      { title: 'Budget_vs_Actual_Report' }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton count={1} height="40px" width="30%" className="mb-4" />
        <Skeleton count={8} variant="rectangular" height="24px" />
      </div>
    );
  }

  if (importError) {
    return (
      <div className="p-12 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
        <h2 className="text-xl font-bold mb-2">Failed to load data</h2>
        <p className="text-slate-400 mb-6">{importError}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="p-12 text-center">
        <Database className="w-12 h-12 mx-auto mb-4 text-slate-500" />
        <h2 className="text-xl font-bold mb-2">No data yet</h2>
        <p className="text-slate-400 mb-6">Import your General Ledger data to see reports.</p>
        <Link
          to="/data"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Import Data
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <BudgetVsActualHeader
        onHelpClick={() => setHelpOpen(true)}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
      />
      {reportData && (
        <>
          <BudgetVsActualSummary
            totalBudget={reportData.totalBudget}
            totalActual={reportData.totalActual}
            netVariance={reportData.netVariance}
            utilizationPercentage={reportData.utilization}
            isVarianceFavorable={reportData.isVarianceFavorable}
          />
          <BudgetVsActualTable data={reportData.rows} />
        </>
      )}
    </div>
  );
}
