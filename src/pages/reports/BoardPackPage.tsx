import { useEffect, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useBudgetStore } from '@/store/budgetStore';
import { useReportStore } from '@/store/reportStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

import { FileText, Table as TableIcon, FileText as FileIcon, Save, FolderOpen } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { formatPercent } from '@/utils/financialFormatting';
import { roundTo, sumMoney, subtractMoney, divideMoney } from '@/utils/money';
import type { GLEntry } from '@/types';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
export interface BoardPackReport {
  revenue: number;
  expenses: number;
  netIncome: number;
  assets: number;
  liabilities: number;
  equity: number;
  grossMargin: number;
  totalBudget: number;
  budgetCount: number;
  entryCount: number;
}

export function sumByAccountPrefix(
  entries: readonly GLEntry[],
  prefixes: readonly string[],
  mode: 'debit' | 'credit' | 'abs'
): number {
  const matched = entries.filter((e) => {
    const code = e.accountCode || '';
    return prefixes.some((p) => code.startsWith(p));
  });
  const values = matched.map((e) => {
    if (mode === 'credit') {
      return subtractMoney(e.credit, e.debit);
    } else if (mode === 'debit') {
      return subtractMoney(e.debit, e.credit);
    } else {
      return Math.abs(roundTo(subtractMoney(e.debit, e.credit), 2));
    }
  });
  return roundTo(sumMoney(values), 2);
}

export function computeBoardPackReport(
  entries: readonly GLEntry[],
  budgets: readonly { totalAmount?: number }[]
): BoardPackReport | null {
  if (entries.length === 0) return null;
  const revenue = sumByAccountPrefix(entries, ['4'], 'credit');
  const expenses = sumByAccountPrefix(entries, ['5', '6'], 'abs');
  const assets = sumByAccountPrefix(entries, ['1'], 'debit');
  const liabilities = sumByAccountPrefix(entries, ['2'], 'credit');
  const equity = sumByAccountPrefix(entries, ['3'], 'credit');
  const netIncome = roundTo(subtractMoney(revenue, expenses), 2);
  const totalBudget = roundTo(
    sumMoney(budgets.map((b) => b.totalAmount || 0)),
    2
  );
  const grossMargin =
    revenue > 0
      ? roundTo(divideMoney(subtractMoney(revenue, expenses), revenue).times(100), 2)
      : 0;
  return {
    revenue,
    expenses,
    netIncome,
    assets,
    liabilities,
    equity,
    grossMargin,
    totalBudget,
    budgetCount: budgets.length,
    entryCount: entries.length,
  };
}

interface VarianceHighlight {
  id: string;
  category: string;
  variance: string;
  comment: string;
}

export default function BoardPackPage() {
  const fmt = useCurrencyFormatter();
  const [_helpOpen, _setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — Board Pack';
  }, []);

  const { entries } = useGLStore();
  const { budgets } = useBudgetStore();
  const { reports, createReport } = useReportStore();
  const navigate = useNavigate();

  const [commentary, setCommentary] = useState(
    'Revenue exceeded budget by 8% driven by stronger than expected enterprise bookings. Operating expenses were tightly controlled with a 2% favorable variance vs budget despite higher headcount. Net income of $4.5M represents a 22% YoY improvement. Management expects Q4 momentum to continue with the current pipeline.'
  );
  const [varianceHighlights, setVarianceHighlights] = useState<VarianceHighlight[]>([
    { id: 'vh1', category: 'Travel & Entertainment', variance: '($12,400)', comment: 'Deferred client visits to Q1' },
    { id: 'vh2', category: 'Software Subscriptions', variance: '($8,200)', comment: 'Annual renewals pulled forward' },
    { id: 'vh3', category: 'Office Supplies', variance: '$3,500', comment: 'Favorable bulk purchase discount' },
  ]);
  const [editingCommentary, setEditingCommentary] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const report = useMemo(() => {
    return computeBoardPackReport(entries, budgets);
  }, [entries, budgets]);

  const handleExportPDF = () => {
    if (!report) return;
    const data = {
      headers: ['Section', 'Category', 'Amount / Detail'],
      rows: [
        ['1. Cover', 'Title', 'Board Pack — Financial Review'],
        ['1. Cover', 'Date', new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })],
        ['2. Exec Summary', 'Revenue', fmt.currency0(report.revenue)],
        ['2. Exec Summary', 'Expenses', fmt.currency0(report.expenses)],
        ['2. Exec Summary', 'Net Income', fmt.currency0(report.netIncome)],
        ['2. Exec Summary', 'Gross Margin', formatPercent(report.grossMargin, 1)],
        ['3. P&L', 'Revenue', fmt.currency0(report.revenue)],
        ['3. P&L', 'Expenses', fmt.currency0(report.expenses)],
        ['3. P&L', 'Net Income', fmt.currency0(report.netIncome)],
        ['4. Balance Sheet', 'Total Assets', fmt.currency0(report.assets)],
        ['4. Balance Sheet', 'Total Liabilities', fmt.currency0(report.liabilities)],
        ['4. Balance Sheet', 'Total Equity', fmt.currency0(report.equity)],
        ['5. CF & Budgets', 'Total Budget', fmt.currency0(report.totalBudget)],
        ['5. CF & Budgets', 'Actual Spending', fmt.currency0(report.expenses)],
        ['5. CF & Budgets', 'Budget Count', String(report.budgetCount)],
        ['6. Variance Commentary', 'Executive Commentary', commentary],
        ...varianceHighlights.map((vh) => ['6. Variance Commentary', vh.category, `${vh.variance} — ${vh.comment}`]),
      ],
    };
    void ExportEngine.exportToPDF(data, {
      title: 'Board Pack (6 Sections)',
      companyName: 'FinPlan Pro',
      includeTimestamp: true,
    }).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    if (!report) return;
    const data = {
      headers: ['Section', 'Category', 'Amount'],
      rows: [
        ['Cover', 'Board Pack Title', 'Financial Review'],
        ['Exec Summary', 'Revenue', report.revenue],
        ['Exec Summary', 'Expenses', report.expenses],
        ['Exec Summary', 'Net Income', report.netIncome],
        ['Exec Summary', 'Gross Margin %', report.grossMargin],
        ['P&L', 'Revenue', report.revenue],
        ['P&L', 'Expenses', report.expenses],
        ['P&L', 'Net Income', report.netIncome],
        ['BS', 'Total Assets', report.assets],
        ['BS', 'Total Liabilities', report.liabilities],
        ['BS', 'Total Equity', report.equity],
        ['CF & Budgets', 'Total Budget', report.totalBudget],
        ['CF & Budgets', 'Actual Spending', report.expenses],
        ['Variance Commentary', 'Commentary', commentary],
        ...varianceHighlights.map((vh) => ['Variance Commentary', vh.category, vh.variance] as (string | number)[]),
      ],
    };
    void ExportEngine.exportToExcel(data, { title: 'Board_Pack_Export_6_Sections' }).catch(reportExportFailure);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    createReport({
      name: templateName.trim(),
      description: 'Board Pack template with 6 sections',
      format: 'BoardPack',
      createdAt: new Date().toISOString(),
      type: 'BoardPack',
      period: 'Monthly',
      status: 'Draft',
      columns: [],
      filters: [],
      groupBy: null,
      sortBy: null,
      sortDirection: 'asc',
      data: {
        commentary,
        varianceHighlights,
        sections: ['Cover', 'Exec Summary', 'P&L', 'BS', 'CF & Budgets', 'Variance Commentary'],
      },
      createdBy: 'user',
      createdByName: 'User',
      isPublic: false,
    });
    setTemplateName('');
    setShowTemplateModal(false);
  };

  const handleLoadTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = reports.find((r) => r.id === templateId);
    if (tmpl?.data) {
      if (typeof tmpl.data.commentary === 'string') setCommentary(tmpl.data.commentary);
      if (Array.isArray(tmpl.data.varianceHighlights)) setVarianceHighlights(tmpl.data.varianceHighlights as VarianceHighlight[]);
    }
  };

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <FileText className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to generate the Board Pack.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      {/* 1. Cover Section */}
      <div className="text-center py-10 border-b border-slate-800">
        <h1 className="text-4xl font-black tracking-tight mb-2">BOARD PACK</h1>
        <p className="text-[var(--text-muted)] font-medium uppercase tracking-widest text-sm">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} · FINANCIAL
          REVIEW
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Executive Summary</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">High-level financial performance and health KPIs</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2">
            <select
              value={selectedTemplateId}
              onChange={(e) => handleLoadTemplate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200"
              aria-label="Load template"
              data-testid="load-template"
            >
              <option value="">Load Template…</option>
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowTemplateModal(true)}
              data-testid="save-template"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" /> Save as Template
            </Button>
          </div>
          <Button size="sm" variant="ghost" onClick={handleExportPDF} aria-label="Export PDF" data-testid="export-pdf">
            <FileIcon className="h-3.5 w-3.5 mr-1.5" />
            PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={handleExportExcel} aria-label="Export Excel" data-testid="export-excel">
            <TableIcon className="h-3.5 w-3.5 mr-1.5" />
            Excel
          </Button>
        </div>
      </div>

      {/* 2. Exec Summary (4 KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Revenue</div>
            <div className="text-xl font-black text-green-400 tabular-nums">
              {report ? fmt.currency0(report.revenue) : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Expenses</div>
            <div className="text-xl font-black text-red-400 tabular-nums">
              {report ? fmt.currency0(report.expenses) : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Net Income</div>
            <div
              className={
                'text-xl font-black tabular-nums ' +
                (report && report.netIncome >= 0 ? 'text-green-400' : 'text-red-400')
              }
            >
              {report ? fmt.currency0(report.netIncome) : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Gross Margin</div>
            <div className="text-xl font-black tabular-nums">
              {report ? formatPercent(report.grossMargin, 1) : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 3. P&L Summary */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-[var(--text-muted)]">P&L Summary</h3>
            <table className="w-full text-sm" role="grid" aria-label="Profit and Loss Summary">
              <tbody className="divide-y divide-slate-800">
                <tr role="row">
                  <td className="py-2 text-[var(--text-secondary)]" role="gridcell">
                    Total Revenue
                  </td>
                  <td className="py-2 text-right tabular-nums text-green-400" role="gridcell">
                    {report ? fmt.currency0(report.revenue) : '-'}
                  </td>
                </tr>
                <tr role="row">
                  <td className="py-2 text-[var(--text-secondary)]" role="gridcell">
                    Total Expenses
                  </td>
                  <td className="py-2 text-right tabular-nums text-red-400" role="gridcell">
                    {report ? fmt.currency0(report.expenses) : '-'}
                  </td>
                </tr>
                <tr className="font-bold border-t-2 border-slate-700" role="row">
                  <td className="py-3 text-[var(--text-primary)]" role="gridcell">
                    NET INCOME
                  </td>
                  <td
                    className={
                      'py-3 text-right tabular-nums ' +
                      (report && report.netIncome >= 0 ? 'text-green-400' : 'text-red-400')
                    }
                    role="gridcell"
                  >
                    {report ? fmt.currency0(report.netIncome) : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* 4. BS Summary */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-[var(--text-muted)]">
              Balance Sheet Summary
            </h3>
            <table className="w-full text-sm" role="grid" aria-label="Balance Sheet Summary">
              <tbody className="divide-y divide-slate-800">
                <tr role="row">
                  <td className="py-2 text-[var(--text-secondary)]" role="gridcell">
                    Total Assets
                  </td>
                  <td className="py-2 text-right tabular-nums text-blue-400" role="gridcell">
                    {report ? fmt.currency0(report.assets) : '-'}
                  </td>
                </tr>
                <tr role="row">
                  <td className="py-2 text-[var(--text-secondary)]" role="gridcell">
                    Total Liabilities
                  </td>
                  <td className="py-2 text-right tabular-nums text-red-400" role="gridcell">
                    {report ? fmt.currency0(report.liabilities) : '-'}
                  </td>
                </tr>
                <tr role="row">
                  <td className="py-2 text-[var(--text-secondary)]" role="gridcell">
                    Total Equity
                  </td>
                  <td className="py-2 text-right tabular-nums text-green-400" role="gridcell">
                    {report ? fmt.currency0(report.equity) : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 5. Budget Overview (CF proxy) */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-[var(--text-muted)]">
              Budget vs Actual Overview
            </h3>
            {budgets.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No budgets created yet.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Total Budget</span>
                  <span className="font-bold tabular-nums">{fmt.currency0(report?.totalBudget || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Actual Spending</span>
                  <span className="font-bold tabular-nums text-red-400">
                    {fmt.currency0(report?.expenses || 0)}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all duration-1000"
                    style={{
                      width:
                        Math.min(report ? (report.expenses / report.totalBudget) * 100 : 0, 100) + '%',
                    }}
                  />
                </div>
                <p className="text-[10px] text-center font-bold text-slate-500 uppercase">
                  {report && report.totalBudget > 0
                    ? `${formatPercent((report.expenses / report.totalBudget) * 100, 1)} budget utilization`
                    : '0% utilization'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 5b? Actually part of 5 / placeholder */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-[var(--text-muted)]">Report Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Budgets</span>
                <span className="font-mono">{report?.budgetCount ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">GL Entries</span>
                <span className="font-mono">{report?.entryCount ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Sections</span>
                <span className="font-mono">6</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 6. Variance & Executive Commentary */}
      <Card data-testid="variance-commentary-section">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-[var(--text-muted)]">
              6. Variance & Executive Commentary
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditingCommentary((v) => !v)}
              data-testid="toggle-edit-commentary"
            >
              {editingCommentary ? 'Done' : 'Edit'}
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                Executive Commentary
              </h4>
              {editingCommentary ? (
                <textarea
                  value={commentary}
                  onChange={(e) => setCommentary(e.target.value)}
                  className="w-full min-h-[100px] bg-slate-800 border border-slate-700 rounded p-3 text-sm text-slate-200"
                  data-testid="commentary-input"
                />
              ) : (
                <p className="text-sm text-slate-300 bg-slate-800/50 rounded p-3" data-testid="commentary-display">
                  {commentary}
                </p>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                Variance Highlights
              </h4>
              <div className="space-y-2" data-testid="variance-highlights">
                {varianceHighlights.map((vh) => (
                  <div key={vh.id} className="flex gap-3 p-3 bg-slate-800/50 rounded-lg items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{vh.category}</div>
                      <div className="text-xs text-slate-400">{vh.comment}</div>
                    </div>
                    <div className="text-sm font-mono tabular-nums text-right">
                      <div className={vh.variance.includes('(') ? 'text-red-400' : 'text-green-400'}>{vh.variance}</div>
                    </div>
                  </div>
                ))}
              </div>
              {editingCommentary && (
                <div className="mt-3 flex gap-2">
                  <input
                    placeholder="Category"
                    id="vh-cat"
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const cat = (e.target as HTMLInputElement).value.trim();
                        if (cat) {
                          setVarianceHighlights((prev) => [
                            ...prev,
                            { id: `vh${Date.now()}`, category: cat, variance: '$0', comment: 'New highlight' },
                          ]);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                    data-testid="add-variance-input"
                  />
                  <span className="text-xs text-slate-500 self-center">Press Enter to add</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="template-modal">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <FolderOpen className="h-5 w-5" /> Save as Template
            </h3>
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name..."
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
              data-testid="template-name-input"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowTemplateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate} disabled={!templateName.trim()} data-testid="confirm-save-template">
                Save Template
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
