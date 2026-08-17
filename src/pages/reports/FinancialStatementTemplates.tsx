import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useReportStore } from '@/store/reportStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  ProfitLossStatement,
  BalanceSheet,
  CashFlowStatement,
  BudgetVsActual,
} from '@/components/reports/FinancialStatementTemplates';
import { ExportEngine } from '@/engines/ExportEngine';
import { FileText, Download, ChevronDown } from 'lucide-react';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { useBudgetStore } from '@/store/budgetStore';
import { deriveStatementData } from './financialStatementData';

type StatementType = 'pl' | 'bs' | 'cf' | 'bva';

const STATEMENT_OPTIONS: { key: StatementType; label: string }[] = [
  { key: 'pl', label: 'Income Statement' },
  { key: 'bs', label: 'Balance Sheet' },
  { key: 'cf', label: 'Cash Flow Statement' },
  { key: 'bva', label: 'Budget vs Actual' },
];

export default function FinancialStatementTemplatesPage() {
  useEffect(() => {
    document.title = 'FinPlan Pro — Financial Statement Templates';
  }, []);

  const { entries, accounts } = useGLStore();
  const lineItems = useBudgetStore((state) => state.lineItems);
  const { createReport } = useReportStore();
  const navigate = useNavigate();
  const [activeStatement, setActiveStatement] = useState<StatementType>('pl');
  const [showDropdown, setShowDropdown] = useState(false);

  const { data, unavailable, hasBudget } = useMemo(
    () => deriveStatementData(entries, lineItems),
    [entries, lineItems]
  );

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    const statement = STATEMENT_OPTIONS.find((s) => s.key === activeStatement);
    if (!statement) return;

    const headers = ['Line Item', 'Amount'];
    const rows =
      entries.length > 0 ? [['GL Data', String(entries.length) + ' entries']] : [['No data', '']];

    if (format === 'pdf') {
      void ExportEngine.exportToPDF({ headers, rows }, { title: statement.label }).catch(reportExportFailure);
    } else if (format === 'excel') {
      void ExportEngine.exportToExcel(
        { headers, rows },
        { title: statement.label.replace(/\s+/g, '_') }
      ).catch(reportExportFailure);
    }

    createReport({
      name: statement.label,
      type: statement.label,
      format,
      createdAt: new Date().toISOString(),
      createdBy: 'current-user',
    });
  };

  const activeOption = STATEMENT_OPTIONS.find((s) => s.key === activeStatement);

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <FileText className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No GL Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Import General Ledger entries to generate financial statement templates.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" role="main" aria-label="Financial Statement Templates page">
      <PageHeader
  title="Financial Statement Templates"
  purpose={
    <>
      {entries.length.toLocaleString()} GL entries · {accounts.length} accounts ·{' '}
      {hasBudget ? `${lineItems.length.toLocaleString()} budget lines` : 'no budget posted'}
    </>
  }
  actions={<div className="flex gap-2">
          <div className="relative">
            <Button
              variant="secondary"
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2"
            >
              {activeOption?.label}
              <ChevronDown className="h-4 w-4" />
            </Button>
            {showDropdown && (
              <div className="absolute right-0 mt-1 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10">
                {STATEMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setActiveStatement(opt.key);
                      setShowDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 transition-colors ${
                      activeStatement === opt.key
                        ? 'text-blue-400 bg-slate-700/50'
                        : 'text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleExport('pdf')}
            aria-label="Export as PDF"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            Export PDF
          </Button>
        </div>}
/>

      <Card>
        <CardContent className="p-6">
          {activeStatement === 'pl' && (
            <ProfitLossStatement
              entity="Company"
              period={new Date().getFullYear().toString()}
              currency="USD"
              data={data}
              onExport={handleExport}
            />
          )}
          {activeStatement === 'bs' && (
            <BalanceSheet
              entity="Company"
              period={new Date().getFullYear().toString()}
              currency="USD"
              data={data}
              onExport={handleExport}
            />
          )}
          {activeStatement === 'cf' && (
            <CashFlowStatement
              entity="Company"
              period={new Date().getFullYear().toString()}
              currency="USD"
              data={data}
              onExport={handleExport}
            />
          )}
          {activeStatement === 'bva' && (
            <BudgetVsActual
              entity="Company"
              period={new Date().getFullYear().toString()}
              currency="USD"
              data={data}
              onExport={handleExport}
            />
          )}
        </CardContent>
      </Card>

      {unavailable.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              Lines not derivable from the posted General Ledger
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              These captions render as an em dash rather than an estimate. OmniPlan never
              substitutes assumed ratios for posted balances.
            </p>
            <ul className="space-y-2">
              {unavailable.map((item) => (
                <li key={item.label} className="text-xs text-[var(--text-muted)]">
                  <span className="font-medium text-[var(--text-secondary)]">{item.label}</span>
                  {' — '}
                  {item.reason}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
