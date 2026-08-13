import { memo, useCallback, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ReportBookEngine,
  REPORT_TEMPLATE_PRESETS,
  type ReportBook,
  type ReportBookEntry,
  type Entity,
  type GenerationProgress,
  type GeneratedReport,
  type BoardPackSection,
} from '@/engines/ReportBookEngine';
import { buildReportData } from '@/engines/reportDataBuilder';
import { useGLStore } from '@/store/glStore';
import { useBudgetStore } from '@/store/budgetStore';
import { useEntityStore } from '@/store/entityStore';
import { ReportResultsPanel } from './ReportResultsPanel';
import { formatNumber } from '@/utils/financialFormatting';

const PRESET_LIST = Object.values(REPORT_TEMPLATE_PRESETS);

/** Synthetic consolidated target when no explicit entities exist. */
const CONSOLIDATED_ENTITY: Entity = {
  id: 'entity-consolidated',
  name: 'All Entities (Consolidated)',
  currency: 'USD',
  parentId: null,
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface PresetCardProps {
  preset: (typeof PRESET_LIST)[number];
  onAdd: (presetId: string, name: string) => void;
}

function PresetCard({ preset, onAdd }: PresetCardProps) {
  return (
    <button
      type="button"
      onClick={() => onAdd(preset.id, preset.name)}
      className="text-left w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3 hover:border-blue-500 hover:bg-[var(--bg-hover)] transition-colors"
    >
      <p className="text-sm font-medium text-[var(--text-primary)]">{preset.name}</p>
      <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{preset.description}</p>
    </button>
  );
}

interface EntryRowProps {
  entry: ReportBookEntry;
  entities: Entity[];
  onUpdate: (id: string, updates: Partial<ReportBookEntry>) => void;
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

function EntryRow({ entry, entities, onUpdate, onRemove, onMoveUp, onMoveDown }: EntryRowProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3" role="region" aria-label="ReportBookBuilder">
      {/* Drag handle / order controls */}
      <div className="flex flex-col gap-1 pt-1">
        <button
          type="button"
          onClick={() => onMoveUp(entry.id)}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs"
          aria-label="Move up"
        >
          &#9650;
        </button>
        <span className="text-xs text-[var(--text-muted)] text-center">{entry.order + 1}</span>
        <button
          type="button"
          onClick={() => onMoveDown(entry.id)}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs"
          aria-label="Move down"
        >
          &#9660;
        </button>
      </div>

      {/* Report name + template */}
      <div className="flex-1 min-w-0 space-y-2">
        <input
          type="text"
          value={entry.reportName}
          onChange={(e) => onUpdate(entry.id, { reportName: e.target.value })}
          className="w-full bg-transparent border-b border-[var(--border-default)] text-[var(--text-primary)] text-sm font-medium focus:border-blue-500 outline-none pb-1"
          placeholder="Report name"
        />
        <p className="text-xs text-[var(--text-muted)]">Template: {entry.templateId}</p>

        {/* Entity multi-select */}
        <div className="flex flex-wrap gap-1">
          {entities.map((entity) => (
            <button
              key={entity.id}
              type="button"
              onClick={() => {
                const next = entry.entityIds.includes(entity.id)
                  ? entry.entityIds.filter((id) => id !== entity.id)
                  : [...entry.entityIds, entity.id];
                onUpdate(entry.id, { entityIds: next });
              }}
              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                entry.entityIds.includes(entity.id)
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'border-[var(--border-default)] text-[var(--text-muted)] hover:border-[var(--border-default)]'
              }`}
            >
              {entity.name}
            </button>
          ))}
        </div>

        {/* Variables */}
        {Object.keys(entry.variables).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(entry.variables).map(([key, val]) => (
              <span key={key} className="text-xs text-[var(--text-muted)]">
                {`{${key}}`}:
                <input
                  type="text"
                  value={val}
                  onChange={(e) =>
                    onUpdate(entry.id, {
                      variables: { ...entry.variables, [key]: e.target.value },
                    })
                  }
                  className="ml-1 bg-transparent border-b border-[var(--border-default)] text-[var(--text-secondary)] w-20 text-xs focus:border-blue-500 outline-none"
                />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
          <input
            type="checkbox"
            checked={entry.enabled}
            onChange={(e) => onUpdate(entry.id, { enabled: e.target.checked })}
            className="rounded"
          />
          On
        </label>
        <button
          type="button"
          onClick={() => onRemove(entry.id)}
          className="text-red-400 hover:text-red-300 text-xs"
          aria-label="Remove entry"
        >
          &#10005;
        </button>
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
        <ul className="text-xs text-red-400 space-y-0.5">
          {progress.errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component — real data via glStore / budgetStore / entityStore
// ---------------------------------------------------------------------------

export const ReportBookBuilder = memo(function ReportBookBuilder() {
  const [engine] = useState(() => new ReportBookEngine());
  const [book, setBook] = useState<ReportBook>(() =>
    engine.createBook('Board Pack', 'Monthly board pack with all entities')
  );
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [previewEntry, setPreviewEntry] = useState<ReportBookEntry | null>(null);
  const [results, setResults] = useState<GeneratedReport[]>([]);
  const [sections, setSections] = useState<BoardPackSection[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const glEntries = useGLStore((s) => s.entries);
  const budgetItems = useBudgetStore((s) => s.lineItems);
  const storeEntities = useEntityStore((s) => s.entities);

  // Real entity list (entityStore), with an honest consolidated fallback.
  const entities: Entity[] = useMemo(() => {
    if (storeEntities.length > 0) {
      return storeEntities.map((e) => ({
        id: e.id,
        name: e.name,
        currency: e.currency || 'USD',
        parentId: e.parentId,
      }));
    }
    return [CONSOLIDATED_ENTITY];
  }, [storeEntities]);

  const availableVars = useMemo(() => engine.getAvailableVariables(), [engine]);

  // --- Entry operations ---

  const handleAddPreset = useCallback(
    (presetId: string, name: string) => {
      const preset = PRESET_LIST.find((p) => p.id === presetId);
      const defaultVars: Record<string, string> = {};
      if (preset) {
        for (const v of Object.entries(preset.defaultVariables)) {
          defaultVars[v[0]] = v[1];
        }
      }

      engine.addEntry(book.id, {
        reportName: name,
        templateId: presetId,
        entityIds: entities.map((e) => e.id),
        variables: defaultVars,
        enabled: true,
      });
      setBook({ ...engine.getBook(book.id)! });
    },
    [book.id, engine, entities]
  );

  const handleUpdateEntry = useCallback(
    (entryId: string, updates: Partial<ReportBookEntry>) => {
      engine.updateEntry(book.id, entryId, updates);
      setBook({ ...engine.getBook(book.id)! });
    },
    [book.id, engine]
  );

  const handleRemoveEntry = useCallback(
    (entryId: string) => {
      if (!window.confirm('Remove this report entry?')) return;
      engine.removeEntry(book.id, entryId);
      setBook({ ...engine.getBook(book.id)! });
    },
    [book.id, engine]
  );

  const handleMoveUp = useCallback(
    (entryId: string) => {
      const idx = book.entries.findIndex((e) => e.id === entryId);
      if (idx <= 0) return;
      const ids = book.entries.map((e) => e.id);
      const prev = ids[idx - 1];
      const curr = ids[idx];
      ids[idx - 1] = curr!;
      ids[idx] = prev!;
      engine.reorderEntries(book.id, ids);
      setBook({ ...engine.getBook(book.id)! });
    },
    [book.id, book.entries, engine]
  );

  const handleMoveDown = useCallback(
    (entryId: string) => {
      const idx = book.entries.findIndex((e) => e.id === entryId);
      if (idx === -1 || idx >= book.entries.length - 1) return;
      const ids = book.entries.map((e) => e.id);
      const a = ids[idx];
      const b = ids[idx + 1];
      ids[idx] = b!;
      ids[idx + 1] = a!;
      engine.reorderEntries(book.id, ids);
      setBook({ ...engine.getBook(book.id)! });
    },
    [book.id, book.entries, engine]
  );

  // --- Real data resolution ---

  const dataForEntity = useCallback(
    (entity: Entity) => {
      const filtered =
        entity.id === CONSOLIDATED_ENTITY.id
          ? glEntries
          : glEntries.filter((e) => !e.entityId || e.entityId === entity.id);
      // Budget line items carry no entity scoping — applied globally.
      return {
        entries: filtered,
        budgetItems,
        entityName: entity.name,
        currency: entity.currency,
        periodLabel: 'FY 2026',
      };
    },
    [glEntries, budgetItems]
  );

  // --- Generation ---

  const handleGenerate = useCallback(async () => {
    setResults([]);
    setSections([]);
    setIsComplete(false);
    setProgress({
      total: 0,
      completed: 0,
      currentEntity: '',
      currentReport: '',
      status: 'pending',
      errors: [],
    });

    try {
      // Register real-data generators for every template the engine knows.
      for (const preset of PRESET_LIST) {
        engine.registerReportGenerator(preset.id, (entity, variables) => {
          const input = dataForEntity(entity);
          return buildReportData(
            {
              ...input,
              periodLabel: variables.period ?? 'FY 2026',
            },
            preset.id
          );
        });
      }

      const allResults = await engine.generateReports(book.id, entities, setProgress);

      // Build sections from results (grouped by entry)
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

      setResults(allResults);
      setSections(builtSections);
      setIsComplete(true);
    } catch {
      setProgress((prev) => (prev ? { ...prev, status: 'error' } : null));
    }
  }, [book.id, engine, entities, dataForEntity]);

  // --- Preview (real data) ---

  const previewData = useMemo(() => {
    if (!previewEntry) return null;
    const entity = entities.find((e) => previewEntry.entityIds.includes(e.id));
    if (!entity) return null;
    return buildReportData(dataForEntity(entity), previewEntry.templateId);
  }, [previewEntry, entities, dataForEntity]);

  // --- Render ---

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT: Template catalog */}
      <div className="lg:col-span-3 space-y-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Report Templates</h3>
        <div className="space-y-2">
          {PRESET_LIST.map((preset) => (
            <PresetCard key={preset.id} preset={preset} onAdd={handleAddPreset} />
          ))}
        </div>

        <div className="pt-4 border-t border-slate-700">
          <h4 className="text-xs font-medium text-[var(--text-muted)] mb-2">Available Variables</h4>
          <div className="space-y-1">
            {availableVars.map((v) => (
              <div key={v.key} className="text-xs text-[var(--text-muted)]">
                <code className="text-[var(--accent-primary)]">{`{${v.key}}`}</code> — {v.description}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER: Book entries */}
      <div className="lg:col-span-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <input
              type="text"
              value={book.name}
              onChange={(e) => {
                setBook((prev) => ({ ...prev, name: e.target.value }));
              }}
              className="text-lg font-bold text-[var(--text-primary)] bg-transparent border-none outline-none"
            />
            <p className="text-xs text-[var(--text-muted)]">
              {book.entries.length} report(s) &middot;{' '}
              {book.entries.reduce((s, e) => s + e.entityIds.length, 0)} generation(s)
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={book.entries.length === 0 || progress?.status === 'running'}
          >
            {progress?.status === 'running' ? 'Generating...' : 'Generate All'}
          </Button>
        </div>

        {progress && <ProgressBar progress={progress} />}

        <div className="space-y-2">
          {book.entries.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-sm">
              Add reports from the template catalog on the left.
            </div>
          ) : (
            book.entries.map((entry) => (
              <div
                key={entry.id}
                role="button"
                tabIndex={0}
                onClick={() => setPreviewEntry(entry)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setPreviewEntry(entry);
                }}
                className={`cursor-pointer rounded-lg transition-all ${
                  previewEntry?.id === entry.id ? 'ring-1 ring-blue-500' : ''
                }`}
              >
                <EntryRow
                  entry={entry}
                  entities={entities}
                  onUpdate={handleUpdateEntry}
                  onRemove={handleRemoveEntry}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT: Preview */}
      <div className="lg:col-span-4 space-y-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Preview</h3>
        {isComplete && results.length > 0 ? (
          <ReportResultsPanel reports={results} sections={sections} />
        ) : previewData ? (
          <Card className="p-4 bg-[var(--bg-elevated)] text-[var(--text-primary)] overflow-auto max-h-[600px]">
            <h4 className="font-bold text-sm mb-3">{previewEntry?.reportName}</h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-slate-300">
                  {previewData.headers.map((h, i) => (
                    <th key={i} className={`py-1 px-2 ${i > 0 ? 'text-right' : 'text-left'}`} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.rows.map((row, ri) => (
                  <tr key={ri} className="border-b border-slate-100">
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`py-1 px-2 ${ci > 0 ? 'text-right font-mono' : ''} ${
                          ri === 0 ? 'font-semibold' : ''
                        }`}
                      >
                        {typeof cell === 'number' ? formatNumber(cell) : String(cell ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.footers?.map((f, i) => (
              <p key={i} className="text-[10px] text-[var(--text-muted)] mt-2">
                {f}
              </p>
            ))}
          </Card>
        ) : (
          <div className="text-center py-12 text-[var(--text-muted)] text-sm">
            Click a report entry to preview.
          </div>
        )}
      </div>
    </div>
  );
});
