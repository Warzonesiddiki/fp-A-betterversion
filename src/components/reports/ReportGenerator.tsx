import { useCallback, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ReportBookEngine,
  REPORT_TEMPLATE_PRESETS,
  type Entity,
  type GeneratedReport,
  type GenerationProgress,
  type BoardPackSection,
} from '@/engines/ReportBookEngine';
import { textToBytes, buildZip, downloadBlob, type ZipEntry } from '@/utils/zipBuilder';
import { ReportResultsPanel } from './ReportResultsPanel';
import { ProgressPanel, runBatched, reportToCsv } from './ReportGenHelpers';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MOCK_ENTITIES: Entity[] = [
  { id: 'ent-1', name: 'Acme Corp (US)', currency: 'USD', parentId: null },
  { id: 'ent-2', name: 'Acme Europe (UK)', currency: 'GBP', parentId: 'ent-1' },
  { id: 'ent-3', name: 'Acme Asia (JP)', currency: 'JPY', parentId: 'ent-1' },
  { id: 'ent-4', name: 'Acme LATAM (BR)', currency: 'BRL', parentId: 'ent-1' },
  { id: 'ent-5', name: 'Acme Middle East (AE)', currency: 'AED', parentId: 'ent-1' },
];

const PRESET_LIST = Object.values(REPORT_TEMPLATE_PRESETS);
const BATCH_SIZE = 4;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ReportGeneratorProps {
  engine?: ReportBookEngine;
  bookId?: string;
  entities?: Entity[];
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ReportGenerator({
  engine: externalEngine,
  bookId: externalBookId,
  entities: externalEntities,
}: ReportGeneratorProps) {
  const [internalEngine] = useState(() => {
    const e = new ReportBookEngine();
    const book = e.createBook('Batch Report', 'Multi-entity batch');
    const entityIds = MOCK_ENTITIES.map((ent) => ent.id);
    for (const preset of PRESET_LIST) {
      e.addEntry(book.id, {
        reportName: preset.name,
        templateId: preset.id,
        entityIds,
        variables: { period: 'FY 2026' },
        enabled: true,
      });
    }
    return e;
  });

  const engine = externalEngine ?? internalEngine;
  const bookId = externalBookId ?? engine.listBooks()[0]?.id ?? '';
  const entities = externalEntities ?? MOCK_ENTITIES;

  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [sections, setSections] = useState<BoardPackSection[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const startTimeRef = useRef(0);
  const [elapsed, setElapsed] = useState(0);

  const totalJobs = useMemo(() => {
    const book = engine.getBook(bookId);
    if (!book) return 0;
    return book.entries.filter((e) => e.enabled).reduce((s, e) => s + e.entityIds.length, 0);
  }, [bookId, engine]);

  // --- Handlers ---

  const handleGenerate = useCallback(async () => {
    const book = engine.getBook(bookId);
    if (!book) return;

    setIsComplete(false);
    setReports([]);
    setSections([]);
    startTimeRef.current = Date.now();

    const progressState: GenerationProgress = {
      total: totalJobs,
      completed: 0,
      currentEntity: '',
      currentReport: '',
      status: 'running',
      errors: [],
    };
    setProgress({ ...progressState });

    try {
      const enabledEntries = book.entries.filter((e) => e.enabled);
      const entityMap = new Map(entities.map((e) => [e.id, e]));

      const jobs: { entry: (typeof enabledEntries)[number]; entity: Entity }[] = [];
      for (const entry of enabledEntries) {
        for (const entityId of entry.entityIds) {
          const entity = entityMap.get(entityId);
          if (entity) jobs.push({ entry, entity });
        }
      }

      const allResults: GeneratedReport[] = [];

      await runBatched(jobs, BATCH_SIZE, async ({ entry, entity }) => {
        progressState.currentEntity = entity.name;
        progressState.currentReport = entry.reportName;
        setProgress({ ...progressState });
        setElapsed(Date.now() - startTimeRef.current);

        await new Promise((r) => setTimeout(r, 50 + Math.random() * 100));

        try {
          const data = {
            headers: ['Line Item', 'Actual', 'Budget', 'Variance', 'Var %'] as string[],
            rows: [
              [`${entry.reportName} \u2014 ${entity.name}`, '', '', '', ''] as (string | number | boolean | null)[],
              ['Revenue', 1250000, 1200000, 50000, '4.2%'] as (string | number | boolean | null)[],
              ['Cost of Goods Sold', 750000, 720000, -30000, '-4.2%'] as (string | number | boolean | null)[],
              ['Gross Profit', 500000, 480000, 20000, '4.2%'] as (string | number | boolean | null)[],
              ['Operating Expenses', 300000, 310000, 10000, '3.2%'] as (string | number | boolean | null)[],
              ['EBITDA', 200000, 170000, 30000, '17.6%'] as (string | number | boolean | null)[],
            ],
            footers: [`Generated ${new Date().toLocaleDateString()} | ${entity.currency}`],
          };

          allResults.push({
            entryId: entry.id,
            entityId: entity.id,
            entityName: entity.name,
            reportName: entry.reportName.replace(/\{entity_name\}/gi, entity.name),
            data,
            config: {
              title: entry.reportName,
              companyName: entity.name,
              date: new Date().toLocaleDateString(),
            },
            generatedAt: new Date().toISOString(),
          });
        } catch (err) {
          progressState.errors.push(
            `Failed: ${entry.reportName} for ${entity.name} \u2014 ${err instanceof Error ? err.message : String(err)}`
          );
        }

        progressState.completed++;
        setProgress({ ...progressState });
        setElapsed(Date.now() - startTimeRef.current);
      });

      // Build sections from results
      const sectionMap = new Map<string, GeneratedReport[]>();
      for (const report of allResults) {
        const key = report.entryId;
        if (!sectionMap.has(key)) sectionMap.set(key, []);
        sectionMap.get(key)!.push(report);
      }

      const builtSections: BoardPackSection[] = [];
      let isFirst = true;
      for (const [entryId, sectionReports] of sectionMap) {
        builtSections.push({
          id: entryId,
          title: sectionReports[0]?.reportName ?? 'Untitled',
          reports: sectionReports,
          pageBreakBefore: !isFirst,
        });
        isFirst = false;
      }

      progressState.status = progressState.errors.length > 0 ? 'error' : 'complete';
      setProgress({ ...progressState });
      setReports(allResults);
      setSections(builtSections);
      setIsComplete(true);
      setElapsed(Date.now() - startTimeRef.current);
    } catch {
      setProgress((prev) => (prev ? { ...prev, status: 'error' } : null));
    }
  }, [bookId, engine, entities, totalJobs]);

  const handleDownloadZip = useCallback(() => {
    if (reports.length === 0) return;
    const entries: ZipEntry[] = reports.map((report) => {
      const safeEntity = report.entityName.replace(/[^a-zA-Z0-9]/g, '_');
      const safeReport = report.reportName.replace(/[^a-zA-Z0-9]/g, '_');
      return { name: `${safeEntity}/${safeReport}.csv`, data: textToBytes(reportToCsv(report)) };
    });
    const zip = buildZip(entries);
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    downloadBlob(zip, `book-burst-${ts}.zip`, 'application/zip');
  }, [reports]);

  const handleDownloadBoardPack = useCallback(() => {
    if (reports.length === 0) return;
    const pack = {
      generatedAt: new Date().toISOString(),
      totalReports: reports.length,
      entities: [...new Set(reports.map((r) => r.entityName))],
      sections: sections.map((s) => ({
        title: s.title,
        reports: s.reports.map((r) => ({
          name: r.reportName,
          entity: r.entityName,
          generatedAt: r.generatedAt,
          data: r.data,
        })),
      })),
    };
    const json = JSON.stringify(pack, null, 2);
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    downloadBlob(textToBytes(json), `board-pack-${ts}.json`, 'application/json');
  }, [reports, sections]);

  // --- Render ---

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-4">
        <Card className="p-4 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Report Generator</h3>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-[var(--bg-elevated)] p-2">
              <p className="text-lg font-bold text-[var(--text-primary)]">{entities.length}</p>
              <p className="text-xs text-[var(--text-muted)]">Entities</p>
            </div>
            <div className="rounded-lg bg-[var(--bg-elevated)] p-2">
              <p className="text-lg font-bold text-emerald-400">{totalJobs}</p>
              <p className="text-xs text-[var(--text-muted)]">Total Reports</p>
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={progress?.status === 'running' || totalJobs === 0}
            className="w-full"
          >
            {progress?.status === 'running'
              ? `Generating... (${(elapsed / 1000).toFixed(1)}s)`
              : `Generate ${totalJobs} Reports`}
          </Button>
          <p className="text-xs text-[var(--text-muted)]">
            Parallel generation in batches of {BATCH_SIZE} for maximum throughput.
          </p>
        </Card>
        {progress && <ProgressPanel progress={progress} elapsed={elapsed} />}
      </div>

      <div className="lg:col-span-8">
        {isComplete && reports.length > 0 ? (
          <ReportResultsPanel
            reports={reports}
            sections={sections}
            onDownloadZip={handleDownloadZip}
            onDownloadBoardPack={handleDownloadBoardPack}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-[var(--text-muted)] text-sm space-y-2">
            <p>
              {progress?.status === 'running'
                ? 'Generating reports...'
                : 'Configure and generate reports to see results.'}
            </p>
            {progress?.status === 'running' && (
              <div className="w-48 h-2 rounded-full bg-[var(--bg-hover)] overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0}%`,
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
