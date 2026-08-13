import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Star,
  Copy,
  Trash2,
  Plus,
  BarChart3,
  DollarSign,
  TrendingUp,
  PieChart,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/utils/cn';
import {
  ReportBuilderEngine,
  type ReportDefinition,
  type TemplateType,
} from '@/engines/ReportBuilderEngine';

/* ────────────────── props ────────────────── */

export interface ReportTemplateLibraryProps {
  savedReports?: ReportDefinition[];
  onSelectTemplate?: (template: TemplateType) => void;
  onSelectReport?: (report: ReportDefinition) => void;
  onDeleteReport?: (reportId: string) => void;
  onCloneReport?: (report: ReportDefinition) => void;
  className?: string;
}

/* ────────────────── template thumbnails ────────────────── */

const TEMPLATE_ICONS: Record<TemplateType, React.ReactNode> = {
  income_statement: <DollarSign className="h-8 w-8" />,
  balance_sheet: <BarChart3 className="h-8 w-8" />,
  cash_flow: <TrendingUp className="h-8 w-8" />,
  budget_vs_actual: <PieChart className="h-8 w-8" />,
  variance_analysis: <FileText className="h-8 w-8" />,
  board_pack: <Star className="h-8 w-8" />,
  executive_summary: <BarChart3 className="h-8 w-8" />,
  custom: <Plus className="h-8 w-8" />,
};

const TEMPLATE_COLORS: Record<TemplateType, string> = {
  income_statement: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
  balance_sheet: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
  cash_flow: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/30',
  budget_vs_actual: 'from-violet-500/20 to-violet-600/5 border-violet-500/30',
  variance_analysis: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
  board_pack: 'from-rose-500/20 to-rose-600/5 border-rose-500/30',
  executive_summary: 'from-indigo-500/20 to-indigo-600/5 border-indigo-500/30',
  custom: 'from-slate-500/20 to-slate-600/5 border-slate-500/30',
};

const TEMPLATE_ICON_COLORS: Record<TemplateType, string> = {
  income_statement: 'text-emerald-400',
  balance_sheet: 'text-blue-400',
  cash_flow: 'text-cyan-400',
  budget_vs_actual: 'text-violet-400',
  variance_analysis: 'text-amber-400',
  board_pack: 'text-rose-400',
  executive_summary: 'text-indigo-400',
  custom: 'text-[var(--text-muted)]',
};

/* ────────────────── template preview ────────────────── */

function TemplateThumbnail({ template }: { template: TemplateType }) {
  // Mini preview showing column/row structure
  const layout = ReportBuilderEngine.getTemplateLayout(template);
  const previewRows = layout.rows.slice(0, 8);
  const previewCols = layout.columns.slice(0, 4);

  return (
    <div className="bg-[var(--bg-elevated)] rounded p-2 space-y-0.5">
      {/* Header */}
      <div className="flex gap-0.5">
        {previewCols.map((col) => (
          <div
            key={col.id}
            className={cn(
              'h-3 rounded-sm flex-1',
              col.type === 'label'
                ? 'bg-[var(--bg-hover)]'
                : col.period === 'actual'
                  ? 'bg-emerald-500/30'
                  : col.period === 'budget'
                    ? 'bg-blue-500/30'
                    : 'bg-amber-500/30'
            )}
          />
        ))}
      </div>
      {/* Rows */}
      {previewRows.map((row) => (
        <div key={row.id} className="flex gap-0.5">
          {previewCols.map((col, ci) => (
            <div
              key={col.id}
              className={cn(
                'h-2 rounded-sm flex-1',
                row.type === 'total'
                  ? 'bg-[var(--bg-hover)]'
                  : row.type === 'subtotal'
                    ? 'bg-[var(--bg-hover)]/50'
                    : ci === 0
                      ? 'bg-[var(--bg-hover)]'
                      : 'bg-[var(--bg-elevated)]'
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ────────────────── main component ────────────────── */

export function ReportTemplateLibrary({
  savedReports = [],
  onSelectTemplate,
  onSelectReport,
  onDeleteReport,
  onCloneReport,
  className,
}: ReportTemplateLibraryProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'saved'>('templates');
  const [searchQuery, setSearchQuery] = useState('');

  const templates = useMemo(() => ReportBuilderEngine.getAvailableTemplates(), []);

  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return templates;
    const q = searchQuery.toLowerCase();
    return templates.filter(
      (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    );
  }, [templates, searchQuery]);

  const filteredReports = useMemo(() => {
    if (!searchQuery) return savedReports;
    const q = searchQuery.toLowerCase();
    return savedReports.filter(
      (r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
    );
  }, [savedReports, searchQuery]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Report Library</h2>

        {/* Tabs */}
        <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-1">
          <button
            className={cn(
              'flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              activeTab === 'templates'
                ? 'bg-[var(--bg-active)] text-[var(--text-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
            onClick={() => setActiveTab('templates')}
          >
            Templates
          </button>
          <button
            className={cn(
              'flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              activeTab === 'saved' ? 'bg-[var(--bg-active)] text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            )}
            onClick={() => setActiveTab('saved')}
          >
            My Reports ({savedReports.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'templates' ? 'Search templates...' : 'Search reports...'}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {activeTab === 'templates' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredTemplates.map((template) => (
              <Card
                key={template.type}
                className={cn(
                  'cursor-pointer hover:scale-[1.02] transition-all border bg-gradient-to-br',
                  TEMPLATE_COLORS[template.type]
                )}
                onClick={() => onSelectTemplate?.(template.type)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        'p-2 rounded-lg bg-[var(--bg-elevated)]',
                        TEMPLATE_ICON_COLORS[template.type]
                      )}
                    >
                      {TEMPLATE_ICONS[template.type]}
                    </div>
                    <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded">
                      {template.type === 'custom' ? 'Blank' : 'Template'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-[var(--text-heading)] text-sm">
                      {template.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                  <TemplateThumbnail template={template.type} />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredReports.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)]">
                <FileText className="h-10 w-10 mx-auto mb-3 text-[var(--text-muted)]" />
                <p className="text-sm">No saved reports yet</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Create a report from a template to get started
                </p>
              </div>
            ) : (
              filteredReports.map((report) => (
                <Card
                  key={report.id}
                  className="cursor-pointer hover:border-slate-600 transition-colors border border-slate-700"
                  onClick={() => onSelectReport?.(report)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[var(--text-primary)] text-sm truncate">{report.name}</h3>
                      <p className="text-xs text-[var(--text-muted)]">
                        {report.template !== 'custom' && `${report.template.replace(/_/g, ' ')} · `}
                        Updated {new Date(report.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded mr-2">
                        v{report.version}
                      </span>
                      {onCloneReport && (
                        <button
                          className="p-1.5 text-[var(--text-muted)] hover:text-blue-400 hover:bg-[var(--bg-elevated)] rounded transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCloneReport(report);
                          }}
                          aria-label="Clone report"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      )}
                      {onDeleteReport && (
                        <button
                          className="p-1.5 text-[var(--text-muted)] hover:text-red-400 hover:bg-[var(--bg-elevated)] rounded transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Delete this report?')) onDeleteReport(report.id);
                          }}
                          aria-label="Delete report"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
