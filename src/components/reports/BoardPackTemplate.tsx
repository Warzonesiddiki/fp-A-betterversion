import { useMemo, useState } from 'react';
import { ExportTemplateEngine } from '@/engines/ExportTemplateEngine';
import type { ExportContext, TemplateSection } from '@/engines/ExportTemplateEngine';

interface BoardPackTemplateProps {
  entity?: string;
  period?: string;
  currency?: string;
  preparedBy?: string;
  data?: Record<string, unknown>;
}

const engine = new ExportTemplateEngine();

function CoverSection({ section, ctx }: { section: TemplateSection; ctx: ExportContext }) {
  return (
    <div className="relative bg-gradient-to-br from-blue-900 to-blue-700 text-white rounded-lg p-8 mb-6">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold mb-3">{ctx.entity}</h1>
        <p className="text-xl text-blue-200">{ctx.period} Board Pack</p>
      </div>
      <div className="text-center mt-8 text-blue-200 text-sm space-y-1">
        <p>Prepared by: {ctx.preparedBy}</p>
        <p>Date: {ctx.date}</p>
      </div>
      {section.config.confidential ? (
        <p className="text-center mt-8 text-xs text-blue-300 opacity-70">
          CONFIDENTIAL — For Internal Use Only
        </p>
      ) : null}
    </div>
  );
}

function KPISummarySection({ section }: { section: TemplateSection }) {
  const kpis =
    (section.config.kpis as Array<{ label: string; value: string; change?: string }>) ?? [];

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
        {section.title}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => {
          const isPositive = kpi.change?.startsWith('+');
          const isNegative = kpi.change?.startsWith('-');
          return (
            <div
              key={i}
              className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-4"
            >
              <p className="text-xs text-[var(--text-muted)] mb-1">
                {kpi.label}
              </p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {kpi.value}
              </p>
              {kpi.change && (
                <p
                  className={`text-xs mt-1 font-medium ${
                    isPositive
                      ? 'fin-positive dark:text-green-400'
                      : isNegative
                        ? 'fin-negative dark:text-red-400'
                        : 'text-[var(--text-muted)]'
                  }`}
                >
                  {kpi.change} vs prior
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TableSection({ section }: { section: TemplateSection }) {
  const headers = (section.config.headers as string[]) ?? [];
  const rows = (section.config.rows as string[][]) ?? [];

  if (headers.length === 0) return null;

  const isBoldRow = (row: string[]) => {
    const label = row[0] ?? '';
    return label === label.toUpperCase() && label.length > 2 && !label.startsWith('  ');
  };

  return (
    <div className="mb-6">
      {section.title && (
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
          {section.title}
        </h2>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-white">
              {headers.map((h, i) => (
                <th key={i} className={`px-3 py-2 text-left ${i  scope="col"> 0 ? 'text-right' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-3 py-4 text-center text-gray-400 italic"
                >
                  No data loaded — connect data source to populate
                </td>
              </tr>
            ) : (
              rows.map((row, ri) => (
                <tr
                  key={ri}
                  className={`border-b border-gray-100 ${
                    isBoldRow(row)
                      ? 'bg-gray-50 font-semibold'
                      : ri % 2 === 0
                        ? 'bg-white'
                        : 'bg-gray-50'
                  }`}
                >
                  {row.map((cell, ci) => (
                    <td key={ci} className={`px-3 py-1.5 ${ci > 0 ? 'text-right' : ''}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TextSection({ section, ctx }: { section: TemplateSection; ctx: ExportContext }) {
  const content = ((section.config.content as string) ?? '')
    .replace(/\{entity\}/g, ctx.entity)
    .replace(/\{period\}/g, ctx.period)
    .replace(/\{currency\}/g, ctx.currency);

  return (
    <div className="mb-6">
      {section.title && (
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          {section.title}
        </h2>
      )}
      <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
        {content}
      </p>
    </div>
  );
}

export function BoardPackTemplate({
  entity = 'Acme Corporation',
  period = 'FY 2026',
  currency = 'USD',
  preparedBy = 'Finance Team',
  data = {},
}: BoardPackTemplateProps) {
  const [showExport, setShowExport] = useState(false);

  const ctx: ExportContext = useMemo(
    () => ({
      entity,
      period,
      currency,
      date: new Date().toLocaleDateString(),
      preparedBy,
      data,
    }),
    [entity, period, currency, preparedBy, data]
  );

  const template = engine.getTemplate('tpl-board-pack');
  const sections = useMemo(() => {
    if (!template) return [];
    return [...template.sections].sort((a, b) => a.order - b.order);
  }, [template]);

  const handleExportPDF = () => {
    engine.generatePDF('tpl-board-pack', ctx);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Board Pack Preview
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            {entity} — {period} — {currency}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
          >
            Export PDF
          </button>
          <button
            onClick={() => setShowExport(!showExport)}
            className="px-4 py-2 bg-[var(--bg-elevated)] text-[var(--text-secondary)] rounded-md hover:bg-[var(--bg-hover)] text-sm"
          >
            {showExport ? 'Hide' : 'Show'} Export Options
          </button>
        </div>
      </div>

      {/* Export options */}
      {showExport && (
        <div className="mb-6 p-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
            Export Options
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={handleExportPDF}
              className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            >
              PDF
            </button>
            <button
              onClick={() => {
                const exportData = {
                  headers: ['Line Item', 'Actual', 'Budget', 'Variance'],
                  rows: [],
                };
                import('@/engines/ExportEngine').then(({ ExportEngine }) => {
                  ExportEngine.exportToExcel(exportData, { title: `Board Pack ${period}` });
                });
              }}
              className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              Excel
            </button>
            <button
              onClick={() => {
                const exportData = {
                  headers: ['Line Item', 'Actual', 'Budget', 'Variance'],
                  rows: [],
                };
                import('@/engines/ExportEngine').then(({ ExportEngine }) => {
                  ExportEngine.exportToCSV(exportData, { title: `Board Pack ${period}` });
                });
              }}
              className="px-3 py-2 bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-hover)] text-sm"
            >
              CSV
            </button>
          </div>
        </div>
      )}

      {/* Rendered sections */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-6 shadow-sm">
        {sections.map((section) => {
          switch (section.type) {
            case 'cover':
              return <CoverSection key={section.id} section={section} ctx={ctx} />;
            case 'kpi_summary':
              return <KPISummarySection key={section.id} section={section} />;
            case 'table':
              return <TableSection key={section.id} section={section} />;
            case 'text':
              return <TextSection key={section.id} section={section} ctx={ctx} />;
            case 'page_break':
              return (
                <hr
                  key={section.id}
                  className="my-6 border-[var(--border-subtle)]"
                />
              );
            default:
              return null;
          }
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 text-center text-xs text-[var(--text-muted)]">
        Generated by FinPlan Pro — {new Date().toLocaleString()}
      </div>
    </div>
  );
}
