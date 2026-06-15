import { useCallback, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  BoardPackGenerator as BoardPackEngine,
  ReportBookEngine,
  type BoardPackConfig,
  type BoardPackSection,
  type Entity,
  type GenerationProgress,
} from '@/engines/ReportBookEngine';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_ENTITIES: Entity[] = [
  { id: 'ent-1', name: 'Acme Corp (US)', currency: 'USD', parentId: null },
  { id: 'ent-2', name: 'Acme Europe (UK)', currency: 'GBP', parentId: 'ent-1' },
  { id: 'ent-3', name: 'Acme Asia (JP)', currency: 'JPY', parentId: 'ent-1' },
];

const TEMPLATE_OPTIONS: { value: BoardPackConfig['template']; label: string }[] = [
  { value: 'monthly', label: 'Monthly Board Pack' },
  { value: 'quarterly', label: 'Quarterly Board Pack' },
  { value: 'annual', label: 'Annual Board Pack' },
];

const DEFAULT_SECTIONS = [
  { presetId: 'preset-pl', name: 'Profit & Loss' },
  { presetId: 'preset-bs', name: 'Balance Sheet' },
  { presetId: 'preset-cf', name: 'Cash Flow Statement' },
  { presetId: 'preset-bva', name: 'Budget vs Actual' },
  { presetId: 'preset-kpi', name: 'KPI Dashboard' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface CoverPagePreviewProps {
  config: BoardPackConfig;
}

function CoverPagePreview({ config }: CoverPagePreviewProps) {
  return (
    <div className="bg-[var(--bg-elevated)] rounded-lg shadow-2xl p-10 text-[var(--text-primary)] min-h-[400px] flex flex-col justify-between">
      <div>
        {config.logoUrl && <img src={config.logoUrl} alt="Company logo" className="h-12 mb-8" />}
        <h1 className="text-3xl font-bold mb-2">{config.title}</h1>
        {config.subtitle && <p className="text-lg text-[var(--text-muted)] mb-6">{config.subtitle}</p>}
      </div>

      <div className="space-y-1 text-sm text-[var(--text-secondary)]">
        <p>{config.companyName}</p>
        <p>{config.entityName}</p>
        <p>{config.coverDate}</p>
      </div>
    </div>
  );
}

interface SectionPreviewProps {
  section: BoardPackSection;
  sectionIndex: number;
}

function SectionPreview({ section, sectionIndex }: SectionPreviewProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-[var(--text-primary)]">
        {sectionIndex + 1}. {section.title}
      </h4>
      <div className="space-y-1">
        {section.reports.map((report, ri) => (
          <div
            key={ri}
            className="flex items-center justify-between text-xs text-[var(--text-muted)] bg-[var(--bg-hover)] rounded px-2 py-1"
          >
            <span>
              {report.entityName} — {report.reportName}
            </span>
            <span className="text-[var(--text-muted)]">{report.data.rows.length} rows</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ProgressBarProps {
  progress: GenerationProgress;
}

function ProgressBar({ progress }: ProgressBarProps) {
  const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-[var(--text-muted)]">
        <span>
          {progress.currentReport && `${progress.currentReport} — ${progress.currentEntity}`}
        </span>
        <span>
          {progress.completed}/{progress.total} ({pct}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--bg-hover)] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            progress.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {progress.errors.length > 0 && (
        <ul className="text-xs text-[var(--negative)] space-y-0.5 max-h-24 overflow-auto">
          {progress.errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function BoardPackGenerator() {
  const [bookEngine] = useState(() => {
    const engine = new ReportBookEngine();
    const book = engine.createBook('Board Pack', 'Monthly board pack');
    // Pre-populate with default sections
    for (const section of DEFAULT_SECTIONS) {
      engine.addEntry(book.id, {
        reportName: section.name,
        templateId: section.presetId,
        entityIds: MOCK_ENTITIES.map((e) => e.id),
        variables: { period: 'May 2026' },
        enabled: true,
      });
    }
    return engine;
  });

  const [packEngine] = useState(() => new BoardPackEngine(bookEngine));

  const [config, setConfig] = useState<BoardPackConfig>({
    title: 'Monthly Board Pack',
    subtitle: 'Consolidated Financial Review',
    template: 'monthly',
    companyName: 'Acme Corporation',
    coverDate: 'May 2026',
    entityName: 'All Entities (Consolidated)',
    includeTableOfContents: true,
    includeExecutiveSummary: true,
  });

  const [sections, setSections] = useState<BoardPackSection[]>([]);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [isGenerated, setIsGenerated] = useState(false);

  const book = useMemo(() => bookEngine.listBooks()[0], [bookEngine]);

  // --- Handlers ---

  const handleConfigChange = useCallback(
    (field: keyof BoardPackConfig, value: string | boolean) => {
      setConfig((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleGenerate = useCallback(async () => {
    if (!book) return;

    setProgress({
      total: 0,
      completed: 0,
      currentEntity: '',
      currentReport: '',
      status: 'pending',
      errors: [],
    });
    setIsGenerated(false);

    try {
      const result = await packEngine.generateBoardPack(
        book.id,
        MOCK_ENTITIES,
        config,
        setProgress
      );
      setSections(result.sections);
      setIsGenerated(true);
    } catch {
      // errors captured in progress
    }
  }, [book, config, packEngine]);

  const handleExportPDF = useCallback(() => {
    if (!isGenerated) return;
    // PDF export handled by ExportEngine
 
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenerated, sections]);
 

  const handleExportExcel = useCallback(() => {
    if (!isGenerated) return;
 
 
    // Excel export handled by ExportEngine
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenerated, sections]);
 

  // --- Computed ---

  const totalReports = useMemo(
    () => book?.entries.filter((e) => e.enabled).reduce((s, e) => s + e.entityIds.length, 0) ?? 0,
    [book]
  );

  // --- Render ---

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT: Configuration */}
      <div className="lg:col-span-4 space-y-6">
        <Card className="p-4 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Board Pack Configuration</h3>

          {/* Template selector */}
          <div>
            <label htmlFor="bp-template" className="block text-xs text-[var(--text-muted)] mb-1">
              Template
            </label>
            <select
              id="bp-template"
              value={config.template}
              onChange={(e) => handleConfigChange('template', e.target.value)}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded text-sm text-[var(--text-primary)] px-3 py-2"
            >
              {TEMPLATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="bp-title" className="block text-xs text-[var(--text-muted)] mb-1">
              Title
            </label>
            <input
              id="bp-title"
              type="text"
              value={config.title}
              onChange={(e) => handleConfigChange('title', e.target.value)}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded text-sm text-[var(--text-primary)] px-3 py-2"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label htmlFor="bp-subtitle" className="block text-xs text-[var(--text-muted)] mb-1">
              Subtitle
            </label>
            <input
              id="bp-subtitle"
              type="text"
              value={config.subtitle ?? ''}
              onChange={(e) => handleConfigChange('subtitle', e.target.value)}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded text-sm text-[var(--text-primary)] px-3 py-2"
            />
          </div>

          {/* Company */}
          <div>
            <label htmlFor="bp-company" className="block text-xs text-[var(--text-muted)] mb-1">
              Company Name
            </label>
            <input
              id="bp-company"
              type="text"
              value={config.companyName}
              onChange={(e) => handleConfigChange('companyName', e.target.value)}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded text-sm text-[var(--text-primary)] px-3 py-2"
            />
          </div>

          {/* Entity */}
          <div>
            <label htmlFor="bp-entity" className="block text-xs text-[var(--text-muted)] mb-1">
              Entity
            </label>
            <select
              id="bp-entity"
              value={config.entityName}
              onChange={(e) => handleConfigChange('entityName', e.target.value)}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded text-sm text-[var(--text-primary)] px-3 py-2"
            >
              <option value="All Entities (Consolidated)">All Entities (Consolidated)</option>
              {MOCK_ENTITIES.map((ent) => (
                <option key={ent.id} value={ent.name}>
                  {ent.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="bp-cover-date" className="block text-xs text-[var(--text-muted)] mb-1">
              Cover Date
            </label>
            <input
              id="bp-cover-date"
              type="text"
              value={config.coverDate}
              onChange={(e) => handleConfigChange('coverDate', e.target.value)}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded text-sm text-[var(--text-primary)] px-3 py-2"
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <input
                type="checkbox"
                checked={config.includeTableOfContents}
                onChange={(e) => handleConfigChange('includeTableOfContents', e.target.checked)}
                className="rounded"
              />
              Include Table of Contents
            </label>
            <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <input
                type="checkbox"
                checked={config.includeExecutiveSummary}
                onChange={(e) => handleConfigChange('includeExecutiveSummary', e.target.checked)}
                className="rounded"
              />
              Include Executive Summary
            </label>
          </div>

          {/* Generate */}
          <div className="pt-2 space-y-2">
            <Button
              onClick={handleGenerate}
              disabled={progress?.status === 'running'}
              className="w-full"
            >
              {progress?.status === 'running'
                ? 'Generating...'
                : `Generate Board Pack (${totalReports} reports)`}
            </Button>
            {progress && <ProgressBar progress={progress} />}
          </div>
        </Card>

        {/* Export buttons */}
        {isGenerated && (
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Export</h3>
            <div className="flex gap-2">
              <Button onClick={handleExportPDF} className="flex-1">
                Export PDF
              </Button>
              <Button onClick={handleExportExcel} variant="secondary" className="flex-1">
                Export Excel
              </Button>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              PDF includes cover page, table of contents, executive summary, and all report sections
              with page breaks.
            </p>
          </Card>
        )}
      </div>

      {/* CENTER + RIGHT: Preview */}
      <div className="lg:col-span-8 space-y-6">
        {/* Cover page preview */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Cover Page Preview</h3>
          <CoverPagePreview config={config} />
        </div>

        {/* Table of contents */}
        {config.includeTableOfContents && (
          <Card className="p-4 space-y-2">
            <h3 className="text-sm font-semibold text-white">Table of Contents</h3>
            <ol className="space-y-1 text-xs text-[var(--text-muted)] list-decimal list-inside">
              {config.includeExecutiveSummary && <li>Executive Summary</li>}
              {book?.entries
                .filter((e) => e.enabled)
                .map((entry, i) => (
                  <li key={entry.id}>
                    {i + (config.includeExecutiveSummary ? 2 : 1)}. {entry.reportName}
                  </li>
                ))}
            </ol>
          </Card>
        )}

        {/* Generated sections */}
        {isGenerated && sections.length > 0 && (
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-white">
              Generated Sections ({sections.length})
            </h3>
            <div className="space-y-4">
              {sections.map((section, i) => (
                <SectionPreview key={section.id} section={section} sectionIndex={i} />
              ))}
            </div>
          </Card>
        )}

        {/* Empty state */}
        {!isGenerated && (
          <div className="text-center py-16 text-[var(--text-muted)] text-sm">
            Configure the board pack on the left and click &quot;Generate Board Pack&quot; to
            preview the output.
          </div>
        )}
      </div>
    </div>
  );
}
