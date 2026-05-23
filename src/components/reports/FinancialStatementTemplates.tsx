import { useMemo } from 'react';
import type { ExportContext } from '@/engines/ExportTemplateEngine';
// =============================================================================
// Financial Statement Templates — P&L, Balance Sheet, Cash Flow, BvA
// =============================================================================
interface StatementRow {
  label: string;
  indent: number;
  isHeader?: boolean;
  isTotal?: boolean;
  isBlank?: boolean;
}
interface StatementColumn {
  key: string;
  label: string;
  align?: 'left' | 'right';
}
interface FinancialStatementProps {
  entity?: string;
  period?: string;
  currency?: string;
  data?: Record<string, number>;
  onExport?: (format: 'pdf' | 'excel' | 'csv') => void;
}
// --- P&L Template ---
const PL_ROWS: StatementRow[] = [
  { label: 'Revenue', indent: 0, isHeader: true },
  { label: 'Product Revenue', indent: 1 },
  { label: 'Service Revenue', indent: 1 },
  { label: 'Total Revenue', indent: 0, isTotal: true },
  { label: '', indent: 0, isBlank: true },
  { label: 'Cost of Goods Sold', indent: 0, isHeader: true },
  { label: '  Material Costs', indent: 1 },
  { label: '  Direct Labor', indent: 1 },
  { label: '  Manufacturing Overhead', indent: 1 },
  { label: 'Total COGS', indent: 0, isTotal: true },
  { label: '', indent: 0, isBlank: true },
  { label: 'Gross Profit', indent: 0, isTotal: true },
  { label: 'Gross Margin %', indent: 1 },
  { label: '', indent: 0, isBlank: true },
  { label: 'Operating Expenses', indent: 0, isHeader: true },
  { label: '  Sales & Marketing', indent: 1 },
  { label: '  Research & Development', indent: 1 },
  { label: '  General & Administrative', indent: 1 },
  { label: 'Total Operating Expenses', indent: 0, isTotal: true },
  { label: '', indent: 0, isBlank: true },
  { label: 'EBITDA', indent: 0, isTotal: true },
  { label: 'EBITDA Margin %', indent: 1 },
  { label: 'Depreciation & Amortization', indent: 1 },
  { label: 'Operating Income', indent: 0, isTotal: true },
  { label: '', indent: 0, isBlank: true },
  { label: 'Interest Income', indent: 1 },
  { label: 'Interest Expense', indent: 1 },
  { label: 'Pre-Tax Income', indent: 0, isTotal: true },
  { label: 'Income Tax', indent: 1 },
  { label: 'Net Income', indent: 0, isTotal: true },
  { label: 'Net Margin %', indent: 1 },
];
// --- Balance Sheet Template ---
const BS_ROWS: StatementRow[] = [
  { label: 'ASSETS', indent: 0, isHeader: true },
  { label: 'Current Assets', indent: 0, isHeader: true },
  { label: '  Cash & Equivalents', indent: 1 },
  { label: '  Accounts Receivable', indent: 1 },
  { label: '  Inventory', indent: 1 },
  { label: '  Prepaid Expenses', indent: 1 },
  { label: '  Other Current Assets', indent: 1 },
  { label: 'Total Current Assets', indent: 0, isTotal: true },
  { label: '', indent: 0, isBlank: true },
  { label: 'Non-Current Assets', indent: 0, isHeader: true },
  { label: '  Property, Plant & Equipment', indent: 1 },
  { label: '  Less: Accumulated Depreciation', indent: 1 },
  { label: '  Net PP&E', indent: 1 },
  { label: '  Goodwill', indent: 1 },
  { label: '  Intangible Assets', indent: 1 },
  { label: '  Other Non-Current Assets', indent: 1 },
  { label: 'Total Non-Current Assets', indent: 0, isTotal: true },
  { label: '', indent: 0, isBlank: true },
  { label: 'TOTAL ASSETS', indent: 0, isTotal: true },
  { label: '', indent: 0, isBlank: true },
  { label: 'LIABILITIES & EQUITY', indent: 0, isHeader: true },
  { label: 'Current Liabilities', indent: 0, isHeader: true },
  { label: '  Accounts Payable', indent: 1 },
  { label: '  Accrued Expenses', indent: 1 },
  { label: '  Short-Term Debt', indent: 1 },
  { label: '  Current Portion of Long-Term Debt', indent: 1 },
  { label: 'Total Current Liabilities', indent: 0, isTotal: true },
  { label: '', indent: 0, isBlank: true },
  { label: 'Non-Current Liabilities', indent: 0, isHeader: true },
  { label: '  Long-Term Debt', indent: 1 },
  { label: '  Deferred Tax Liabilities', indent: 1 },
  { label: '  Other Non-Current Liabilities', indent: 1 },
  { label: 'Total Non-Current Liabilities', indent: 0, isTotal: true },
  { label: '', indent: 0, isBlank: true },
  { label: 'TOTAL LIABILITIES', indent: 0, isTotal: true },
  { label: '', indent: 0, isBlank: true },
  { label: 'Stockholders\' Equity', indent: 0, isHeader: true },
  { label: '  Common Stock', indent: 1 },
  { label: '  Additional Paid-In Capital', indent: 1 },
  { label: '  Retained Earnings', indent: 1 },
  { label: '  Accumulated Other Comprehensive Income', indent: 1 },
  { label: 'Total Stockholders\' Equity', indent: 0, isTotal: true },
  { label: '', indent: 0, isBlank: true },
  { label: 'TOTAL LIABILITIES & EQUITY', indent: 0, isTotal: true },
];
// --- Cash Flow Template ---
const CF_ROWS: StatementRow[] = [
  { label: 'OPERATING ACTIVITIES', indent: 0, isHeader: true },
  { label: 'Net Income', indent: 1 },
  { label: 'Adjustments to Reconcile:', indent: 1, isHeader: true },
  { label: '  Depreciation & Amortization', indent: 2 },
  { label: '  Stock-Based Compensation', indent: 2 },
  { label: '  Deferred Income Taxes', indent: 2 },
  { label: '  Loss/(Gain) on Asset Disposal', indent: 2 },
  { label: 'Changes in Operating Assets/Liabilities:', indent: 1, isHeader: true },
  { label: '  Accounts Receivable', indent: 2 },
  { label: '  Inventory', indent: 2 },
  { label: '  Prepaid Expenses', indent: 2 },
  { label: '  Accounts Payable', indent: 2 },
  { label: '  Accrued Expenses', indent: 2 },
  { label: '  Other Operating', indent: 2 },
  { label: 'Net Cash from Operations', indent: 0, isTotal: true },
  { label: '', indent: 0, isBlank: true },
  { label: 'INVESTING ACTIVITIES', indent: 0, isHeader: true },
  { label: '  Capital Expenditures', indent: 1 },
  { label: '  Acquisitions, Net of Cash', indent: 1 },
  { label: '  Purchases of Investments', indent: 1 },
  { label: '  Maturities of Investments', indent: 1 },
  { label: '  Proceeds from Asset Sales', indent: 1 },
  { label: 'Net Cash from Investing', indent: 0, isTotal: true },
  { label: '', indent: 0, isBlank: true },
  { label: 'FINANCING ACTIVITIES', indent: 0, isHeader: true },
  { label: '  Proceeds from Debt', indent: 1 },
  { label: '  Repayments of Debt', indent: 1 },
  { label: '  Proceeds from Stock Issuance', indent: 1 },
  { label: '  Repurchases of Stock', indent: 1 },
  { label: '  Dividends Paid', indent: 1 },
  { label: 'Net Cash from Financing', indent: 0, isTotal: true },
  { label: '', indent: 0, isBlank: true },
  { label: 'Effect of Exchange Rates', indent: 1 },
  { label: '', indent: 0, isBlank: true },
  { label: 'NET CHANGE IN CASH', indent: 0, isTotal: true },
  { label: 'Beginning Cash Balance', indent: 1 },
  { label: 'ENDING CASH BALANCE', indent: 0, isTotal: true },
];
// --- Budget vs Actual Template ---
const BVA_COLUMNS: StatementColumn[] = [
  { key: 'item', label: 'Line Item', align: 'left' },
  { key: 'actual', label: 'Actual', align: 'right' },
  { key: 'budget', label: 'Budget', align: 'right' },
  { key: 'variance', label: 'Variance ($)', align: 'right' },
  { key: 'variancePct', label: 'Variance (%)', align: 'right' },
  { key: 'status', label: 'Status', align: 'right' },
];
// --- Shared renderer ---
function StatementTable({
  title,
  subtitle,
  columns,
  rows,
  data,
}: {
  title: string;
  subtitle: string;
  columns: StatementColumn[];
  rows: StatementRow[];
  data?: Record<string, number>;
}) {
  const fmt = (val: number | undefined): string => {
    if (val === undefined || val === null) return '—';
    return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };
  const fmtPct = (val: number | undefined): string => {
    if (val === undefined || val === null) return '—';
    return `${val.toFixed(1)}%`;
  };
  return (
    <div className="mb-8">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)] dark:text-gray-100">{title}</h2>
        <p className="text-sm text-[var(--text-muted)] dark:text-gray-400 dark:text-gray-500">{subtitle}</p>
      </div>
      <div className="overflow-x-auto border border-[var(--border-subtle)] dark:border-gray-700 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-white">
              {columns.map((col) => (
                <th key={col.key} className={`px-3 py-2.5 font-medium ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              if (row.isBlank) {
                return <tr key={i}><td colSpan={columns.length} className="h-2" /></tr>;
              }
              const rowClass = row.isHeader
                ? 'bg-gray-50 dark:bg-gray-900 dark:bg-gray-800/50 font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-300'
                : row.isTotal
                ? 'bg-blue-50 dark:bg-blue-900/20 font-bold text-[var(--text-primary)] dark:text-gray-100 border-t-2 border-blue-200 dark:border-blue-800'
                : 'text-[var(--text-secondary)] dark:text-gray-400 dark:text-gray-500';
              return (
                <tr key={i} className={`border-b border-gray-100 dark:border-gray-800 dark:border-gray-800 ${rowClass}`}>
                  {columns.map((col) => {
                    if (col.key === 'item') {
                      return (
                        <td key={col.key} className="px-3 py-1.5" style={{ paddingLeft: `${row.indent * 16 + 12}px` }}>
                          {row.label}
                        </td>
                      );
                    }
                    const dataKey = `${row.label.toLowerCase().replace(/[^a-z]/g, '')}_${col.key}`;
                    const val = data?.[dataKey];
                    if (col.key === 'variancePct') {
                      return <td key={col.key} className="px-3 py-1.5 text-right">{fmtPct(val)}</td>;
                    }
                    if (col.key === 'status') {
                      if (val === undefined) return <td key={col.key} className="px-3 py-1.5 text-right">—</td>;
                      const isGood = val >= 0;
                      return (
                        <td key={col.key} className="px-3 py-1.5 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            isGood ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {isGood ? 'Favorable' : 'Unfavorable'}
                          </span>
                        </td>
                      );
                    }
                    return <td key={col.key} className="px-3 py-1.5 text-right">{fmt(val)}</td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
// --- Exported Templates ---
export function ProfitLossStatement({ entity, period, currency, data, onExport }: FinancialStatementProps) {
  const subtitle = useMemo(() => `${entity ?? 'Company'} — ${period ?? 'FY 2026'} — ${currency ?? 'USD'}`, [entity, period, currency]);
  const columns: StatementColumn[] = [
    { key: 'item', label: 'Line Item', align: 'left' },
    { key: 'actual', label: 'Actual', align: 'right' },
    { key: 'budget', label: 'Budget', align: 'right' },
    { key: 'priorYear', label: 'Prior Year', align: 'right' },
    { key: 'varBudget', label: 'Var vs Budget', align: 'right' },
    { key: 'varPY', label: 'Var vs PY', align: 'right' },
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] dark:text-gray-100">Income Statement</h1>
        {onExport && (
          <div className="flex gap-2">
            <button onClick={() => onExport('pdf')} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm">PDF</button>
            <button onClick={() => onExport('excel')} className="px-3 py-1.5 bg-green-600 text-white rounded text-sm">Excel</button>
            <button onClick={() => onExport('csv')} className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm">CSV</button>
          </div>
        )}
      </div>
      <StatementTable title="" subtitle={subtitle} columns={columns} rows={PL_ROWS} data={data} />
    </div>
  );
}
export function BalanceSheet({ entity, period, currency, data, onExport }: FinancialStatementProps) {
  const subtitle = useMemo(() => `${entity ?? 'Company'} — ${period ?? 'FY 2026'} — ${currency ?? 'USD'}`, [entity, period, currency]);
  const columns: StatementColumn[] = [
    { key: 'item', label: 'Account', align: 'left' },
    { key: 'current', label: 'Current Period', align: 'right' },
    { key: 'prior', label: 'Prior Period', align: 'right' },
    { key: 'change', label: 'Change', align: 'right' },
    { key: 'changePct', label: '% Change', align: 'right' },
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] dark:text-gray-100">Balance Sheet</h1>
        {onExport && (
          <div className="flex gap-2">
            <button onClick={() => onExport('pdf')} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm">PDF</button>
            <button onClick={() => onExport('excel')} className="px-3 py-1.5 bg-green-600 text-white rounded text-sm">Excel</button>
            <button onClick={() => onExport('csv')} className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm">CSV</button>
          </div>
        )}
      </div>
      <StatementTable title="" subtitle={subtitle} columns={columns} rows={BS_ROWS} data={data} />
    </div>
  );
}
export function CashFlowStatement({ entity, period, currency, data, onExport }: FinancialStatementProps) {
  const subtitle = useMemo(() => `${entity ?? 'Company'} — ${period ?? 'FY 2026'} — ${currency ?? 'USD'}`, [entity, period, currency]);
  const columns: StatementColumn[] = [
    { key: 'item', label: 'Category', align: 'left' },
    { key: 'q1', label: 'Q1', align: 'right' },
    { key: 'q2', label: 'Q2', align: 'right' },
    { key: 'q3', label: 'Q3', align: 'right' },
    { key: 'q4', label: 'Q4', align: 'right' },
    { key: 'fy', label: 'FY', align: 'right' },
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] dark:text-gray-100">Cash Flow Statement</h1>
        {onExport && (
          <div className="flex gap-2">
            <button onClick={() => onExport('pdf')} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm">PDF</button>
            <button onClick={() => onExport('excel')} className="px-3 py-1.5 bg-green-600 text-white rounded text-sm">Excel</button>
            <button onClick={() => onExport('csv')} className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm">CSV</button>
          </div>
        )}
      </div>
      <StatementTable title="" subtitle={subtitle} columns={columns} rows={CF_ROWS} data={data} />
    </div>
  );
}
export function BudgetVsActual({ entity, period, currency, data, onExport }: FinancialStatementProps) {
  const subtitle = useMemo(() => `${entity ?? 'Company'} — ${period ?? 'FY 2026'} — ${currency ?? 'USD'}`, [entity, period, currency]);
  const bvaRows: StatementRow[] = [
    { label: 'Revenue', indent: 0, isHeader: true },
    { label: '  Product Revenue', indent: 1 },
    { label: '  Service Revenue', indent: 1 },
    { label: 'Total Revenue', indent: 0, isTotal: true },
    { label: '', indent: 0, isBlank: true },
    { label: 'Cost of Goods Sold', indent: 0, isHeader: true },
    { label: 'Gross Profit', indent: 0, isTotal: true },
    { label: 'Gross Margin %', indent: 1 },
    { label: '', indent: 0, isBlank: true },
    { label: 'Operating Expenses', indent: 0, isHeader: true },
    { label: '  Sales & Marketing', indent: 1 },
    { label: '  R&D', indent: 1 },
    { label: '  G&A', indent: 1 },
    { label: 'Total OpEx', indent: 0, isTotal: true },
    { label: '', indent: 0, isBlank: true },
    { label: 'EBITDA', indent: 0, isTotal: true },
    { label: 'EBITDA Margin %', indent: 1 },
    { label: 'Net Income', indent: 0, isTotal: true },
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] dark:text-gray-100">Budget vs Actual</h1>
        {onExport && (
          <div className="flex gap-2">
            <button onClick={() => onExport('pdf')} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm">PDF</button>
            <button onClick={() => onExport('excel')} className="px-3 py-1.5 bg-green-600 text-white rounded text-sm">Excel</button>
            <button onClick={() => onExport('csv')} className="px-3 py-1.5 bg-gray-600 text-white rounded text-sm">CSV</button>
          </div>
        )}
      </div>
      <StatementTable title="" subtitle={subtitle} columns={BVA_COLUMNS} rows={bvaRows} data={data} />
    </div>
  );
}
