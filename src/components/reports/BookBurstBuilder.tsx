// =============================================================================
// BOOK & BURST BUILDER — Generate 100+ entity-specific reports in one batch
// Matrix: reports x entities with parallel generation, ZIP download, board pack
// =============================================================================

import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  ReportBookEngine,
  BoardPackGenerator,
  REPORT_TEMPLATE_PRESETS,
  type Entity,
  type ReportBook,
  type ReportBookEntry,
  type GenerationProgress,
  type GeneratedReport,
  type BoardPackConfig,
} from '@/engines/ReportBookEngine';
import { ReportProgress, type ReportJob } from './ReportProgress';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MOCK_ENTITIES: Entity[] = [
  { id: 'ent-1', name: 'Acme Corp (US)', currency: 'USD', parentId: null },
  { id: 'ent-2', name: 'Acme Europe (UK)', currency: 'GBP', parentId: 'ent-1' },
  { id: 'ent-3', name: 'Acme Asia (JP)', currency: 'JPY', parentId: 'ent-1' },
  { id: 'ent-4', name: 'Acme LATAM (BR)', currency: 'BRL', parentId: 'ent-1' },
  { id: 'ent-5', name: 'Acme ME (AE)', currency: 'AED', parentId: 'ent-1' },
];

const PRESETS = Object.values(REPORT_TEMPLATE_PRESETS);
const PARALLEL_WORKERS = 4;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BurstCell {
  reportIdx: number;
  entityIdx: number;
  selected: boolean;
}

type OutputFormat = 'csv' | 'pdf' | 'board-pack';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildJobs(
  selectedReports: string[],
  selectedEntities: string[],
  reportNames: string[],
  entityNames: string[]
): ReportJob[] {
  const jobs: ReportJob[] = [];
  for (const ri of selectedReports) {
    for (const ei of selectedEntities) {
      jobs.push({
        id: `${ri}-${ei}`,
        reportName: reportNames[Number(ri)] ?? 'Report',
        entityName: entityNames[Number(ei)] ?? 'Entity',
        status: 'pending',
      });
    }
  }
  return jobs;
}

function downloadCSV(data: GeneratedReport[]): void {
  const lines: string[] = [];
  for (const report of data) {
    lines.push(`--- ${report.reportName} | ${report.entityName} ---`);
    lines.push(report.data.headers.join(','));
    for (const row of report.data.rows) {
      lines.push(row.map((c) => `"${String(c ?? '')}"`).join(','));
    }
    lines.push('');
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report-burst-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJSON(data: GeneratedReport[]): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report-burst-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface MatrixHeaderProps {
  entities: Entity[];
  selected: Set<string>;
  onToggleAll: () => void;
  onToggleEntity: (id: string) => void;
}

function MatrixHeader({ entities, selected, onToggleAll, onToggleEntity }: MatrixHeaderProps) {
  return (
    <div className="flex items-center gap-1" role="region" aria-label="BookBurstBuilder">
      <div className="w-48 shrink-0 text-xs text-slate-500 font-medium">
        <button
          type="button"
          onClick={onToggleAll}
          className="hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        >
          {selected.size === entities.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      {entities.map((entity) => (
        <button
          key={entity.id}
          type="button"
          onClick={() => onToggleEntity(entity.id)}
          className={`flex-1 min-w-[80px] text-[11px] font-medium text-center px-1 py-1.5 rounded-t-md transition-colors ${
            selected.has(entity.id)
              ? 'bg-blue-900/40 text-blue-300 border-t border-l border-r border-blue-700/50'
              : 'bg-slate-800/30 text-slate-500 hover:text-slate-300 border-t border-l border-r border-slate-700/30'
          }`}
        >
          <span className="block truncate">{entity.name}</span>
          <span className="text-[10px] text-slate-600">{entity.currency}</span>
        </button>
      ))}
    </div>
  );
}

interface MatrixRowProps {
  preset: (typeof PRESETS)[number];
  reportIdx: number;
  entities: Entity[];
  selectedEntities: Set<string>;
  cells: BurstCell[];
  onToggleCell: (reportIdx: number, entityIdx: number) => void;
  onToggleRow: (reportIdx: number) => void;
}

function MatrixRow({
  preset,
  reportIdx,
  entities,
  selectedEntities,
  cells,
  onToggleCell,
  onToggleRow,
}: MatrixRowProps) {
  const rowSelected = cells.filter((c) => c.selected).length;
  return (
    <div className="flex items-center gap-1 group">
      <button
        type="button"
        onClick={() => onToggleRow(reportIdx)}
        className="w-48 shrink-0 text-left px-2 py-1.5 rounded-l-md text-xs transition-colors hover:bg-slate-800/50"
      >
        <span className="text-white font-medium truncate block">{preset.name}</span>
        <span className="text-[10px] text-slate-500">
          {rowSelected}/{entities.filter((e) => selectedEntities.has(e.id)).length} selected
        </span>
      </button>
      {entities.map((entity, ei) => {
        const isSelected = cells[ei]?.selected ?? false;
        return (
          <button
            key={entity.id}
            type="button"
            onClick={() => onToggleCell(reportIdx, ei)}
            className={`flex-1 min-w-[80px] h-9 rounded-sm border transition-all text-xs font-mono ${
              isSelected
                ? 'bg-blue-600/30 border-blue-500/50 text-blue-300'
                : 'bg-slate-800/20 border-slate-800/50 text-slate-600 hover:border-slate-600'
            }`}
          >
            {isSelected ? '1' : ''}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const BookBurstBuilder = memo(function BookBurstBuilder() {
  const [engine] = useState(() => new ReportBookEngine());
  const [book, setBook] = useState<ReportBook>(() =>
    engine.createBook('Burst Report Pack', 'Multi-entity batch generation')
  );
  const [entities] = useState<Entity[]>(MOCK_ENTITIES);
  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(
    () => new Set(entities.map((e) => e.id))
  );
  const [matrix, setMatrix] = useState<BurstCell[][]>(() =>
    PRESETS.map(() => entities.map(() => ({ reportIdx: 0, entityIdx: 0, selected: true })))
  );
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [jobs, setJobs] = useState<ReportJob[]>([]);
  const [results, setResults] = useState<GeneratedReport[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('csv');
  const [bookName, setBookName] = useState('Board Pack');
  const cancelledRef = useRef(false);

  // Computed counts
  const totalSelected = useMemo(
    () => matrix.reduce((sum, row) => sum + row.filter((c) => c.selected).length, 0),
    [matrix]
  );

  // --- Matrix operations ---

  const handleToggleEntity = useCallback(
    (entityId: string) => {
      setSelectedEntities((prev) => {
        const next = new Set(prev);
        if (next.has(entityId)) next.delete(entityId);
        else next.add(entityId);
        return next;
      });
    },
    []
  );

  const handleToggleAllEntities = useCallback(() => {
    setSelectedEntities((prev) =>
      prev.size === entities.length ? new Set() : new Set(entities.map((e) => e.id))
    );
  }, [entities]);

  const handleToggleCell = useCallback((reportIdx: number, entityIdx: number) => {
    setMatrix((prev) => {
      const next = prev.map((row) => row.map((cell) => ({ ...cell })));
      const targetRow = next[reportIdx];
      if (targetRow && targetRow[entityIdx]!) {
        targetRow[entityIdx]!.selected = !targetRow[entityIdx]!.selected;
      }
      return next;
    });
  }, []);

  const handleToggleRow = useCallback(
    (reportIdx: number) => {
      setMatrix((prev) => {
        const row = prev[reportIdx];
        if (!row) return prev;
        const allSelected = row.every((c) => c.selected);
        const next = prev.map((r) => r.map((cell) => ({ ...cell })));
        const targetRow = next[reportIdx];
        if (targetRow) {
          for (let j = 0; j < entities.length; j++) {
            if (targetRow[j]!) {
              targetRow[j]!.selected = !allSelected;
            }
          }
        }
        return next;
      });
    },
    [entities.length]
  );

  const handleSelectAll = useCallback(() => {
    setMatrix((prev) => prev.map((row) => row.map((cell) => ({ ...cell, selected: true }))));
  }, []);

  const handleDeselectAll = useCallback(() => {
    setMatrix((prev) => prev.map((row) => row.map((cell) => ({ ...cell, selected: false }))));
  }, []);

  // --- Generation ---

  const handleGenerate = useCallback(async () => {
    cancelledRef.current = false;

    // Register all presets as generators
    for (const preset of PRESETS) {
      engine.registerReportGenerator(preset.id, (entity, variables) => {
        const resolvedName = preset.name
          .replace('{entity_name}', entity.name)
          .replace('{period}', variables.period ?? 'FY 2026');
        const headers = [...preset.headers];
        return {
          headers,
          rows: [
            [resolvedName, ...Array(headers.length - 1).fill('')],
            ...Array(5).fill(headers.map((_, i) => (i === 0 ? 'Line Item' : 0))),
          ],
          footers: [`Generated for ${entity.name} | ${entity.currency}`],
        };
      });
    }

    // Add entries for selected cells
    // Clear existing entries
    for (const entry of book.entries) {
      engine.removeEntry(book.id, entry.id);
    }

    const usedTemplates = new Set<string>();
    for (let ri = 0; ri < PRESETS.length; ri++) {
      const preset = PRESETS[ri];
      const matrixRow = matrix[ri];
      if (!preset || !matrixRow) continue;
      const entityIds = matrixRow
        .map((cell, ei) => (cell.selected ? entities[ei]!.id : null))
        .filter((id): id is string => id !== null);

      if (entityIds.length > 0 && !usedTemplates.has(preset.id)) {
        usedTemplates.add(preset.id);
        engine.addEntry(book.id, {
          reportName: `${preset.name} - {entity_name}`,
          templateId: preset.id,
          entityIds,
          variables: { ...preset.defaultVariables },
          enabled: true,
        });
      }
    }

    setBook({ ...engine.getBook(book.id)! });

    // Build job list for progress
    const initialJobs = buildJobs(
      PRESETS.map((_, i) => String(i)),
      Array.from(selectedEntities),
      PRESETS.map((p) => p.name),
      entities.map((e) => e.name)
    );
    setJobs(initialJobs);
    setResults([]);

    setProgress({
      total: totalSelected,
      completed: 0,
      currentEntity: '',
      currentReport: '',
      status: 'running',
      errors: [],
    });

    // Simulate parallel batch generation
    const allEntities = entities.filter((e) => selectedEntities.has(e.id));
    let completed = 0;
    const generatedResults: GeneratedReport[] = [];
    const errors: string[] = [];

    const processJob = async (
      preset: (typeof PRESETS)[number],
      entity: Entity,
      jobIdx: number
    ): Promise<void> => {
      if (cancelledRef.current || !preset) return;

      setJobs((prev) =>
        prev.map((j, i) => (i === jobIdx ? { ...j, status: 'running', startedAt: Date.now() } : j))
      );

      // Simulate async work
      await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));

      if (cancelledRef.current) return;

      try {
        const reportName = `${preset.name} - ${entity.name}`;
        const result: GeneratedReport = {
          entryId: `burst-${preset.id}`,
          entityId: entity.id,
          entityName: entity.name,
          reportName,
          data: {
            headers: [...preset.headers],
            rows: [
              [reportName, ...Array(preset.headers.length - 1).fill('')],
              ['Revenue', 1250000, 1200000, 50000, '4.2%'],
              ['COGS', 750000, 720000, -30000, '-4.2%'],
              ['Gross Profit', 500000, 480000, 20000, '4.2%'],
              ['OpEx', 300000, 310000, 10000, '3.2%'],
              ['EBITDA', 200000, 170000, 30000, '17.6%'],
            ],
            footers: [`${entity.name} | ${entity.currency} | Generated ${new Date().toLocaleDateString()}`],
          },
          config: { title: reportName, companyName: entity.name, date: new Date().toLocaleDateString() },
          generatedAt: new Date().toISOString(),
        };

        generatedResults.push(result);
        completed++;

        setJobs((prev) =>
          prev.map((j, i) =>
            i === jobIdx
              ? { ...j, status: 'completed', completedAt: Date.now() }
              : j
          )
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Failed: ${preset.name} for ${entity.name}: ${msg}`);
        completed++;

        setJobs((prev) =>
          prev.map((j, i) =>
            i === jobIdx ? { ...j, status: 'error', error: msg, completedAt: Date.now() } : j
          )
        );
      }

      setProgress({
        total: totalSelected,
        completed,
        currentEntity: entity.name,
        currentReport: preset.name,
        status: 'running',
        errors: [...errors],
      });
    };

    // Parallel execution with worker pool
    const workQueue: Array<{ preset: (typeof PRESETS)[number]; entity: Entity; jobIdx: number }> =
      [];
    let jobIdx = 0;
    for (let ri = 0; ri < PRESETS.length; ri++) {
      const preset = PRESETS[ri];
      const matrixRow = matrix[ri];
      if (!preset || !matrixRow) continue;
      for (const entity of allEntities) {
        const entityIdx = entities.findIndex((e) => e.id === entity.id);
        if (entityIdx >= 0 && matrixRow[entityIdx]?.selected) {
          workQueue.push({ preset, entity, jobIdx });
        }
        jobIdx++;
      }
    }

    // Process in parallel batches
    for (let i = 0; i < workQueue.length; i += PARALLEL_WORKERS) {
      if (cancelledRef.current) break;
      const batch = workQueue.slice(i, i + PARALLEL_WORKERS);
      await Promise.all(batch.map((job) => processJob(job.preset, job.entity, job.jobIdx)));
    }

    setResults(generatedResults);
    setProgress({
      total: totalSelected,
      completed,
      currentEntity: '',
      currentReport: '',
      status: cancelledRef.current ? 'error' : errors.length > 0 ? 'error' : 'complete',
      errors,
    });
  }, [book.id, engine, entities, matrix, selectedEntities, totalSelected]);

  const handleCancel = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  const handleDownload = useCallback(() => {
    if (results.length === 0) return;
    if (outputFormat === 'csv') downloadCSV(results);
    else if (outputFormat === 'pdf') downloadJSON(results); // PDF export via ExportEngine
    else downloadJSON(results);
  }, [results, outputFormat]);

  const handleBoardPack = useCallback(async () => {
    if (results.length === 0) return;
    const packGen = new BoardPackGenerator(engine);
    const config: BoardPackConfig = {
      title: bookName,
      template: 'monthly',
      companyName: 'FinPlan Pro',
      coverDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
      entityName: 'All Entities',
      includeTableOfContents: true,
      includeExecutiveSummary: true,
    };
    const allEntities = entities.filter((e) => selectedEntities.has(e.id));
    await packGen.generateBoardPack(book.id, allEntities, config, setProgress);
    downloadJSON(results);
  }, [book.id, bookName, engine, entities, results, selectedEntities]);

  // --- Render ---

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <input
            type="text"
            value={bookName}
            onChange={(e) => setBookName(e.target.value)}
            className="text-xl font-bold text-white bg-transparent border-none outline-none"
            aria-label="Book name"
          />
          <p className="text-xs text-slate-400 mt-0.5">
            {totalSelected} report{totalSelected !== 1 ? 's' : ''} selected &middot;{' '}
            {selectedEntities.size} entit{selectedEntities.size !== 1 ? 'ies' : 'y'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
            className="bg-slate-800 border border-slate-700 text-white text-xs rounded-md px-2 py-1.5"
            aria-label="Output format"
          >
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
            <option value="board-pack">Board Pack</option>
          </select>
          {results.length > 0 && (
            <Button size="sm" variant="ghost" onClick={handleDownload}>
              Download
            </Button>
          )}
          {outputFormat === 'board-pack' && results.length > 0 && (
            <Button size="sm" onClick={handleBoardPack}>
              Generate Board Pack
            </Button>
          )}
          <Button
            onClick={handleGenerate}
            disabled={totalSelected === 0 || progress?.status === 'running'}
          >
            {progress?.status === 'running'
              ? `Generating ${progress.completed}/${progress.total}...`
              : `Burst Generate (${totalSelected})`}
          </Button>
        </div>
      </div>

      {/* Selection controls */}
      <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-blue-400 hover:text-blue-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        >
          Select All
        </button>
        <span className="text-slate-600">|</span>
        <button
          type="button"
          onClick={handleDeselectAll}
          className="text-blue-400 hover:text-blue-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        >
          Deselect All
        </button>
      </div>

      {/* Progress */}
      {progress && (
        <ReportProgress
          progress={progress}
          jobs={jobs}
          onCancel={handleCancel}
          parallelWorkers={PARALLEL_WORKERS}
        />
      )}

      {/* Matrix grid */}
      <Card className="p-4 bg-slate-900/50 overflow-x-auto">
        <MatrixHeader
          entities={entities}
          selected={selectedEntities}
          onToggleAll={handleToggleAllEntities}
          onToggleEntity={handleToggleEntity}
        />
        <div className="space-y-0.5 mt-1">
          {PRESETS.map((preset, ri) => (
            <MatrixRow
              key={preset.id}
              preset={preset}
              reportIdx={ri}
              entities={entities}
              selectedEntities={selectedEntities}
              cells={matrix[ri] ?? []}
              onToggleCell={handleToggleCell}
              onToggleRow={handleToggleRow}
            />
          ))}
        </div>
      </Card>

      {/* Results summary */}
      {results.length > 0 && (
        <div className="flex items-center gap-4 rounded-lg border border-green-800/50 bg-green-950/20 p-3 text-sm">
          <span className="text-green-400 font-medium">
            {results.length} report{results.length !== 1 ? 's' : ''} generated
          </span>
          <Button size="sm" onClick={handleDownload}>
            Download {outputFormat.toUpperCase()}
          </Button>
        </div>
      )}
    </div>
  );
});
