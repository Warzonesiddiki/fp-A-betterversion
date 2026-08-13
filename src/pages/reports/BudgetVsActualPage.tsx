import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  Database,
  TrendingDown,
  AlertTriangle,
  ChevronDown,
  CheckCircle,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { HelpPanel } from '@/components/ui/HelpPanel';
import { WaterfallChart, type WaterfallItem } from '@/components/ui/WaterfallChart';
import { useGLStore } from '@/store/glStore';
import { useBudgetStore } from '@/store/budgetStore';
import { VarianceDecompositionEngine } from '@/engines/VarianceDecompositionEngine';
import { ExportEngine } from '@/engines/ExportEngine';
import { BudgetVsActualHeader } from './components/BudgetVsActualHeader';
import { BudgetVsActualSummary } from './components/BudgetVsActualSummary';
import { BudgetVsActualTable, type VarianceDataRow } from './components/BudgetVsActualTable';
import { PAGE_HELP } from '../_docs';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { sumMoney, subtractMoney, roundTo, divideMoney } from '@/utils/money';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { formatPercent } from '@/utils/financialFormatting';;

const MATERIAL_THRESHOLD = 10;
const PERIOD_OPTIONS = ['Monthly', 'Quarterly', 'Annual'] as const;
const ACCOUNT_TYPE_OPTIONS = ['All', 'Revenue', 'Expense'] as const;

type PeriodMode = (typeof PERIOD_OPTIONS)[number];
type AccountTypeFilter = (typeof ACCOUNT_TYPE_OPTIONS)[number];
function formatCurrencyFull(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function getQuarterFromPeriod(period: string): number {
  return Math.ceil(parseInt(period.slice(-2), 10) / 3);
}

function matchesPeriod(entryPeriod: string, selectedPeriod: string, mode: PeriodMode): boolean {
  if (mode === 'Monthly') return entryPeriod === selectedPeriod;
  if (mode === 'Quarterly') {
    return (
      entryPeriod.slice(0, 4) === selectedPeriod.slice(0, 4) &&
      getQuarterFromPeriod(entryPeriod) === parseInt(selectedPeriod.slice(-1), 10)
    );
  }
  return entryPeriod.slice(0, 4) === selectedPeriod.slice(0, 4);
}

function computeQuarterOptions(): string[] {
  const currentYear = new Date().getFullYear();
  const qtrs: string[] = [];
  for (let y = currentYear - 2; y <= currentYear + 1; y++) {
    for (let q = 1; q <= 4; q++) qtrs.push(`${y}-Q${q}`);
  }
  return qtrs;
}

function computeAnnualOptions(): string[] {
  const currentYear = new Date().getFullYear();
  const yrs: string[] = [];
  for (let y = currentYear - 2; y <= currentYear + 1; y++) yrs.push(`${y}`);
  return yrs;
}

const quarterOptions = computeQuarterOptions();
const annualOptions = computeAnnualOptions();

interface VarianceRow {
  accountId: string;
  accountName: string;
  accountCode: string;
  accountType: string;
  departmentId?: string;
  budget: number;
  actual: number;
  variance: number;
  variancePct: number;
  isFavorable: boolean;
  isMaterial: boolean;
  isUnbudgeted: boolean;
}

export default function BudgetVsActualPage() {
  const fmt = useCurrencyFormatter();
  const { pathname } = useLocation();
  const [helpOpen, setHelpOpen] = useState(false);

  const { entries, isLoading, importError } = useGLStore();
  const { budgets, lineItems } = useBudgetStore();

  const [selectedBudgetId, setSelectedBudgetId] = useState('');
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [periodMode, setPeriodMode] = useState<PeriodMode>('Monthly');
  const [accountTypeFilter, setAccountTypeFilter] = useState<AccountTypeFilter>('All');
  const [minVarianceThreshold, setMinVarianceThreshold] = useState(0);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — Budget Vs Actual';
  }, []);

  const approvedBudgets = useMemo(() => budgets.filter((b) => b.status === 'Approved'), [budgets]);

  const effectiveBudgetId = useMemo(() => {
    if (selectedBudgetId) return selectedBudgetId;
    if (budgets.length === 0) return '';
    const approved = budgets.find((b) => b.status === 'Approved');
    return approved?.id ?? budgets[0]!.id;
  }, [selectedBudgetId, budgets]);

  const activeLineItems = useMemo(
    () => lineItems.filter((li) => li.budgetId === effectiveBudgetId),
    [lineItems, effectiveBudgetId]
  );

  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    activeLineItems.forEach((li) => {
      if (li.assumptions) deptSet.add(li.assumptions);
    });
    entries.forEach((e) => {
      if (e.departmentId && e.departmentId !== 'unknown') deptSet.add(e.departmentId);
    });
    return Array.from(deptSet).sort();
  }, [activeLineItems, entries]);

  const reportData = useMemo(() => {
    if (entries.length === 0 || !effectiveBudgetId) return null;

    const selectedBudget = budgets.find((b) => b.id === effectiveBudgetId);
    if (!selectedBudget) return null;

    const budgetMap = new Map<string, number>();
    const accountInfoMap = new Map<string, { name: string; type: string; departmentId?: string }>();

    activeLineItems.forEach((li) => {
      const code = li.accountCode;
      budgetMap.set(code, (budgetMap.get(code) ?? 0) + li.amount);
      if (!accountInfoMap.has(code)) {
        accountInfoMap.set(code, {
          name: li.accountName,
          type: li.accountCode.startsWith('4') ? 'Revenue' : 'Expense',
          departmentId: li.assumptions ?? undefined,
        });
      }
    });

    const actualMap = new Map<string, number>();
    entries.forEach((e) => {
      if (!matchesPeriod(e.period, period, periodMode)) return;
      const amount = Math.abs(e.debit - e.credit);
      actualMap.set(e.accountCode, (actualMap.get(e.accountCode) ?? 0) + amount);
      if (!accountInfoMap.has(e.accountCode)) {
        accountInfoMap.set(e.accountCode, {
          name: e.accountName || e.accountCode,
          type: e.accountCode.startsWith('4')
            ? 'Revenue'
            : e.accountCode.startsWith('5') || e.accountCode.startsWith('6')
              ? 'Expense'
              : 'Other',
          departmentId: e.departmentId,
        });
      }
    });

    const allCodes = new Set([...budgetMap.keys(), ...actualMap.keys()]);
    const rows: VarianceRow[] = [];

    allCodes.forEach((code) => {
      const budget = budgetMap.get(code) ?? 0;
      const actual = actualMap.get(code) ?? 0;
      const info = accountInfoMap.get(code);
      const isRevenue = code.startsWith('4');
      const accountType = info?.type ?? (isRevenue ? 'Revenue' : 'Expense');
      const variance = actual - budget;
      const variancePct = budget !== 0 ? (variance / Math.abs(budget)) * 100 : Infinity;
      const isFavorable = isRevenue ? variance >= 0 : variance <= 0;
      const isMaterial =
        budget !== 0 && isFinite(variancePct) && Math.abs(variancePct) > MATERIAL_THRESHOLD;
      const isUnbudgeted = budget === 0 && actual > 0;

      rows.push({
        accountId: code,
        accountName: info?.name ?? `Account ${code}`,
        accountCode: code,
        accountType,
        departmentId: info?.departmentId,
        budget,
        actual,
        variance,
        variancePct,
        isFavorable,
        isMaterial,
        isUnbudgeted,
      });
    });

    let filteredRows = rows;
    if (accountTypeFilter !== 'All') {
      filteredRows = filteredRows.filter((r) => r.accountType === accountTypeFilter);
    }
    if (departmentFilter !== 'All') {
      filteredRows = filteredRows.filter((r) => r.departmentId === departmentFilter);
    }
    if (minVarianceThreshold > 0) {
      filteredRows = filteredRows.filter(
        (r) =>
          r.isUnbudgeted ||
          (isFinite(r.variancePct) && Math.abs(r.variancePct) >= minVarianceThreshold)
      );
    }

    filteredRows.sort((a, b) => {
      if (a.accountType === 'Revenue' && b.accountType !== 'Revenue') return -1;
      if (a.accountType !== 'Revenue' && b.accountType === 'Revenue') return 1;
      return Math.abs(b.variancePct) - Math.abs(a.variancePct);
    });

    const totalBudget = roundTo(sumMoney(filteredRows.map((r) => r.budget)), 2);
    const totalActual = roundTo(sumMoney(filteredRows.map((r) => r.actual)), 2);
    const totalVar = roundTo(subtractMoney(totalActual, totalBudget), 2);
    const isTotalFavorable = totalVar >= 0;
    // Exact-decimal division so 1/3 * 100 = 33.33 (not 33.33333…).
    const totalUtilization =
      totalBudget > 0 ? roundTo(divideMoney(totalActual, totalBudget).times(100), 2) : 0;

    const topUnfavorable = [...filteredRows]
      .filter((r) => !r.isFavorable && !r.isUnbudgeted && isFinite(r.variancePct))
      .sort((a, b) => a.variancePct - b.variancePct)
      .slice(0, 5);

    const allOnTrack = filteredRows.every(
      (r) => r.isUnbudgeted || !isFinite(r.variancePct) || Math.abs(r.variancePct) <= 5
    );

    const waterfallItems: WaterfallItem[] = [
      { label: 'Budget', value: totalBudget, isTotal: true },
    ];
    filteredRows.forEach((r) => {
      const label =
        r.accountName.length > 14 ? r.accountName.slice(0, 14) + '\u2026' : r.accountName;
      waterfallItems.push({ label, value: r.variance });
    });
    waterfallItems.push({ label: 'Actual', value: totalActual, isTotal: true });

    const revenueRows = filteredRows.filter((r) => r.accountType === 'Revenue' && r.budget > 0);
    const decomposition = revenueRows.map((r) => {
      const pvm = VarianceDecompositionEngine.computePriceVolumeMix({
        budgetPrice: r.budget / 1000,
        actualPrice: r.actual / 1000,
        budgetVolume: 1000,
        actualVolume: r.budget > 0 ? (r.actual / r.budget) * 1000 : 1000,
      });
      return {
        ...r,
        priceVariance: pvm.priceVariance,
        volumeVariance: pvm.volumeVariance,
        totalVariance: pvm.totalVariance,
      };
    });

    const tableRows: VarianceDataRow[] = filteredRows.map((r) => ({
      account: r.accountName,
      budget: fmt.currency0(r.budget),
      actual: fmt.currency0(r.actual),
      variance: formatCurrencyFull(r.variance),
      percentVar: !isFinite(r.variancePct) ? '\u221E' : `${formatPercent(r.variancePct, 1)}`,
      isFavorable: r.isFavorable,
      isMaterial: r.isMaterial,
      isUnbudgeted: r.isUnbudgeted,
    }));

    return {
      totalBudget: fmt.currency0(totalBudget),
      totalActual: fmt.currency0(totalActual),
      netVariance: formatCurrencyFull(Math.abs(totalVar)),
      utilization: totalUtilization,
      isVarianceFavorable: isTotalFavorable,
      rows: tableRows,
      rawRows: filteredRows,
      topUnfavorable,
      allOnTrack,
      waterfallItems,
      decomposition,
      budgetName: selectedBudget.name,
    };
  }, [
    entries,
    effectiveBudgetId,
    budgets,
    activeLineItems,
    period,
    periodMode,
    accountTypeFilter,
    departmentFilter,
    minVarianceThreshold,
    fmt,
  ]);

  const handleExportPDF = () => {
    if (!reportData) return;
    void ExportEngine.exportToPDF(
      {
        headers: ['Account', 'Budget', 'Actual', 'Variance', '% Variance', 'Status'],
        rows: reportData.rows.map((r) => [
          r.account,
          r.budget,
          r.actual,
          r.variance,
          r.percentVar,
          r.isFavorable ? 'Favorable' : 'Unfavorable',
        ]),
      },
      { title: 'Budget vs Actual Report', companyName: 'FinPlan Pro' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    if (!reportData) return;
    void ExportEngine.exportToExcel(
      {
        headers: ['Account', 'Budget', 'Actual', 'Variance', '% Variance', 'Status'],
        rows: reportData.rows.map((r) => [
          r.account,
          r.budget,
          r.actual,
          r.variance,
          r.percentVar,
          r.isFavorable ? 'Favorable' : 'Unfavorable',
        ]),
      },
      { title: 'Budget_vs_Actual_Report' }
    ).catch(reportExportFailure);
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    const headers = ['Account', 'Budget', 'Actual', 'Variance', '% Variance', 'Status'];
    const csvRows = [headers.join(',')];
    reportData.rows.forEach((r) => {
      csvRows.push(
        [
          `"${r.account}"`,
          r.budget,
          r.actual,
          r.variance,
          r.percentVar,
          r.isFavorable ? 'Favorable' : 'Unfavorable',
        ].join(',')
      );
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Budget_vs_Actual_Report.csv';
    a.click();
    URL.revokeObjectURL(url);
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
        <p className="text-[var(--text-muted)] mb-6">{importError}</p>
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
        <p className="text-[var(--text-muted)] mb-6">Import your General Ledger data to see reports.</p>
        <Link
          to="/data"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Import Data
        </Link>
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <div className="p-12 text-center">
        <Database className="w-12 h-12 mx-auto mb-4 text-slate-500" />
        <h2 className="text-xl font-bold mb-2">No budgets found</h2>
        <p className="text-[var(--text-muted)] mb-6">Create an approved budget to compare against actuals.</p>
        <Link
          to="/budgets/create"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Budget
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

      <div className="flex flex-wrap items-center gap-3">
        {approvedBudgets.length > 0 && (
          <select
            value={effectiveBudgetId}
            onChange={(e) => setSelectedBudgetId(e.target.value)}
            className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm"
            aria-label="Select budget"
          >
            {approvedBudgets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.fiscalYear})
              </option>
            ))}
          </select>
        )}

        <select
          value={periodMode}
          onChange={(e) => {
            const mode = e.target.value as PeriodMode;
            setPeriodMode(mode);
            if (mode === 'Monthly') {
              const now = new Date();
              setPeriod(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
            } else if (mode === 'Quarterly') {
              const q = Math.ceil((new Date().getMonth() + 1) / 3);
              setPeriod(`${new Date().getFullYear()}-Q${q}`);
            } else {
              setPeriod(String(new Date().getFullYear()));
            }
          }}
          className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm"
          aria-label="Period type"
        >
          {PERIOD_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        {periodMode === 'Monthly' && (
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm w-40"
            aria-label="Select month"
          />
        )}
        {periodMode === 'Quarterly' && (
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm"
            aria-label="Select quarter"
          >
            {quarterOptions.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        )}
        {periodMode === 'Annual' && (
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm"
            aria-label="Select year"
          >
            {annualOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1 px-3 py-2 text-sm text-slate-400 hover:text-white bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg transition-colors"
          aria-label="Toggle filters"
        >
          Filters
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`}
          />
        </button>

        <button
          onClick={handleExportCSV}
          className="px-3 py-2 text-sm text-slate-400 hover:text-white bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg transition-colors"
          aria-label="Export CSV"
        >
          CSV
        </button>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label
                  htmlFor="filter-account-type"
                  className="block text-[10px] font-bold uppercase text-slate-500 mb-1"
                >
                  Account Type
                </label>
                <select
                  id="filter-account-type"
                  value={accountTypeFilter}
                  onChange={(e) => setAccountTypeFilter(e.target.value as AccountTypeFilter)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                >
                  {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="filter-department"
                  className="block text-[10px] font-bold uppercase text-slate-500 mb-1"
                >
                  Department
                </label>
                <select
                  id="filter-department"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="All">All Departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="filter-min-var"
                  className="block text-[10px] font-bold uppercase text-slate-500 mb-1"
                >
                  Min Variance %
                </label>
                <select
                  id="filter-min-var"
                  value={minVarianceThreshold}
                  onChange={(e) => setMinVarianceThreshold(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
                >
                  <option value={0}>Show All</option>
                  <option value={5}>{'>'}5%</option>
                  <option value={10}>{'>'}10% (Material)</option>
                  <option value={20}>{'>'}20%</option>
                  <option value={50}>{'>'}50%</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {reportData && (
        <>
          {reportData.allOnTrack && (
            <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-800/40 rounded-lg text-green-400 text-sm">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              All accounts on track — all variances within 5%
            </div>
          )}

          {reportData.topUnfavorable.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-400" />
                  Top 5 Most Unfavorable
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reportData.topUnfavorable.map((row, idx) => (
                    <div
                      key={row.accountId}
                      className="flex items-center justify-between p-2.5 bg-red-900/10 border border-red-800/20 rounded-lg hover:bg-red-900/20 transition-colors cursor-pointer"
                      onClick={() => {
                        const el = document.getElementById(`row-${row.accountCode}`);
                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          const el = document.getElementById(`row-${row.accountCode}`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 w-5">{idx + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{row.accountName}</p>
                          <p className="text-[10px] text-slate-500">{row.accountCode}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-400">
                          {formatPercent(row.variancePct, 1)}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {formatCurrencyFull(row.variance)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <BudgetVsActualSummary
            totalBudget={reportData.totalBudget}
            totalActual={reportData.totalActual}
            netVariance={reportData.netVariance}
            utilizationPercentage={reportData.utilization}
            isVarianceFavorable={reportData.isVarianceFavorable}
          />

          {reportData.waterfallItems.length > 2 && (
            <WaterfallChart
              data={reportData.waterfallItems}
              height={280}
              title="Budget to Actual Waterfall"
            />
          )}

          {reportData.decomposition.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-blue-400" />
                  Revenue Variance Decomposition (Price vs Volume)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" aria-label="Budget vs actual">
              <caption className="sr-only">Detailed budget vs actual</caption>
                    <thead>
                      <tr className="text-left text-[var(--text-muted)] text-xs uppercase border-b border-[var(--border-subtle)]">
                        <th scope="col" className="px-4 py-2">Account</th>
                        <th scope="col" className="px-4 py-2 text-right">Price Var</th>
                        <th scope="col" className="px-4 py-2 text-right">Volume Var</th>
                        <th scope="col" className="px-4 py-2 text-right">Total Var</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {reportData.decomposition.map((d) => (
                        <tr key={d.accountId} className="hover:bg-slate-900/50">
                          <td className="px-4 py-2 text-slate-300">{d.accountName}</td>
                          <td
                            className={`px-4 py-2 text-right tabular-nums ${d.priceVariance >= 0 ? 'text-green-400' : 'text-red-400'}`}
                          >
                            {formatCurrencyFull(d.priceVariance)}
                          </td>
                          <td
                            className={`px-4 py-2 text-right tabular-nums ${d.volumeVariance >= 0 ? 'text-green-400' : 'text-red-400'}`}
                          >
                            {formatCurrencyFull(d.volumeVariance)}
                          </td>
                          <td
                            className={`px-4 py-2 text-right tabular-nums font-bold ${d.totalVariance >= 0 ? 'text-green-400' : 'text-red-400'}`}
                          >
                            {formatCurrencyFull(d.totalVariance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <BudgetVsActualTable data={reportData.rows} />
        </>
      )}

      <HelpPanel
        title={PAGE_HELP[pathname]?.title || 'Budget vs Actual Help'}
        sections={PAGE_HELP[pathname]?.sections || []}
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </div>
  );
}
