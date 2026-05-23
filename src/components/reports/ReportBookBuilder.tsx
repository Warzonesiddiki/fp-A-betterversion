import { useCallback, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ReportBookEngine,
  REPORT_TEMPLATE_PRESETS,
  type ReportBook,
  type ReportBookEntry,
  type Entity,
  type GenerationProgress,
} from '@/engines/ReportBookEngine';

// ---------------------------------------------------------------------------
// Mock data — replace with store selectors in production
// ---------------------------------------------------------------------------

const MOCK_ENTITIES: Entity[] = [
  { id: 'ent-1', name: 'Acme Corp (US)', currency: 'USD', parentId: null },
  { id: 'ent-2', name: 'Acme Europe (UK)', currency: 'GBP', parentId: 'ent-1' },
  { id: 'ent-3', name: 'Acme Asia (JP)', currency: 'JPY', parentId: 'ent-1' },
];

const PRESET_LIST = Object.values(REPORT_TEMPLATE_PRESETS);

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
      className="text-left w-full rounded-lg border border-slate-700 bg-slate-800/50 p-3 hover:border-blue-500 hover:bg-slate-800 transition-colors"
    >
      <p className="text-sm font-medium text-white">{preset.name}</p>
      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{preset.description}</p>
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
    <div className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/30 p-3">
      {/* Drag handle / order controls */}
      <div className="flex flex-col gap-1 pt-1">
        <button
          type="button"
          onClick={() => onMoveUp(entry.id)}
          className="text-slate-500 hover:text-white text-xs"
          aria-label="Move up"
        >
          &#9650;
        </button>
        <span className="text-xs text-slate-500 text-center">{entry.order + 1}</span>
        <button
          type="button"
          onClick={() => onMoveDown(entry.id)}
          className="text-slate-500 hover:text-white text-xs"
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
          className="w-full bg-transparent border-b border-slate-600 text-white text-sm font-medium focus:border-blue-500 outline-none pb-1"
          placeholder="Report name"
        />
        <p className="text-xs text-slate-500">Template: {entry.templateId}</p>

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
                  : 'border-slate-600 text-slate-400 hover:border-slate-500'
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
              <span key={key} className="text-xs text-slate-500">
                {`{${key}}`}:
                <input
                  type="text"
                  value={val}
                  onChange={(e) =>
                    onUpdate(entry.id, {
                      variables: { ...entry.variables, [key]: e.target.value },
                    })
                  }
                  className="ml-1 bg-transparent border-b border-slate-700 text-slate-300 w-20 text-xs focus:border-blue-500 outline-none"
                />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-xs text-slate-400">
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
      <div className="flex justify-between text-xs text-slate-400">
        <span>
          {progress.currentReport && `${progress.currentReport} — ${progress.currentEntity}`}
        </span>
        <span>
          {progress.completed}/{progress.total} ({pct}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
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
// Main Component
// ---------------------------------------------------------------------------

export function ReportBookBuilder() {
  const [engine] = useState(() => new ReportBookEngine());
  const [book, setBook] = useState<ReportBook>(() =>
    engine.createBook('Board Pack', 'Monthly board pack with all entities'),
  );
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [previewEntry, setPreviewEntry] = useState<ReportBookEntry | null>(null);

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
        entityIds: MOCK_ENTITIES.map((e) => e.id),
        variables: defaultVars,
        enabled: true,
      });
      setBook({ ...engine.getBook(book.id)! });
    },
    [book.id, engine],
  );

  const handleUpdateEntry = useCallback(
    (entryId: string, updates: Partial<ReportBookEntry>) => {
      engine.updateEntry(book.id, entryId, updates);
      setBook({ ...engine.getBook(book.id)! });
    },
    [book.id, engine],
  );

  const handleRemoveEntry = useCallback(
    (entryId: string) => {
      if (!window.confirm('Remove this report entry?')) return;
      engine.removeEntry(book.id, entryId);
      setBook({ ...engine.getBook(book.id)! });
    },
    [book.id, engine],
  );

  const handleMoveUp = useCallback(
    (entryId: string) => {
      const idx = book.entries.findIndex((e) => e.id === entryId);
      if (idx <= 0) return;
      const ids = book.entries.map((e) => e.id);
      [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
      engine.reorderEntries(book.id, ids);
      setBook({ ...engine.getBook(book.id)! });
    },
    [book.id, book.entries, engine],
  );

  const handleMoveDown = useCallback(
    (entryId: string) => {
      const idx = book.entries.findIndex((e) => e.id === entryId);
      if (idx === -1 || idx >= book.entries.length - 1) return;
      const ids = book.entries.map((e) => e.id);
      [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
      engine.reorderEntries(book.id, ids);
      setBook({ ...engine.getBook(book.id)! });
    },
    [book.id, book.entries, engine],
  );

  // --- Generation ---

  const handleGenerate = useCallback(async () => {
    setProgress({
      total: 0,
      completed: 0,
      currentEntity: '',
      currentReport: '',
      status: 'pending',
      errors: [],
    });

    try {
      const results = await engine.generateReports(book.id, MOCK_ENTITIES, setProgress);
      // Results available for export
    } catch {
      // errors are captured in progress
    }
  }, [book.id, engine]);

  // --- Preview ---

  const previewData = useMemo(() => {
    if (!previewEntry) return null;
    const entity = MOCK_ENTITIES.find((e) => previewEntry.entityIds.includes(e.id));
    if (!entity) return null;

    // Mock preview — in production, call the registered generator
    return {
      headers: ['Line Item', 'Actual', 'Budget', 'Variance'],
      rows: [
        [previewEntry.reportName, '', '', ''],
        ['Revenue', '1,250,000', '1,200,000', '50,000'],
        ['COGS', '750,000', '720,000', '(30,000)'],
        ['Gross Profit', '500,000', '480,000', '20,000'],
      ],
    };
  }, [previewEntry]);

  // --- Render ---

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT: Template catalog */}
      <div className="lg:col-span-3 space-y-4">
        <h3 className="text-sm font-semibold text-white">Report Templates</h3>
        <div className="space-y-2">
          {PRESET_LIST.map((preset) => (
            <PresetCard key={preset.id} preset={preset} onAdd={handleAddPreset} />
          ))}
        </div>

        <div className="pt-4 border-t border-slate-700">
          <h4 className="text-xs font-medium text-slate-400 mb-2">Available Variables</h4>
          <div className="space-y-1">
            {availableVars.map((v) => (
              <div key={v.key} className="text-xs text-slate-500">
                <code className="text-blue-400">{`{${v.key}}`}</code> — {v.description}
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
                book.name = e.target.value;
                setBook({ ...book });
              }}
              className="text-lg font-bold text-white bg-transparent border-none outline-none"
            />
            <p className="text-xs text-slate-400">
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
            <div className="text-center py-12 text-slate-500 text-sm">
              Add reports from the template catalog on the left.
            </div>
          ) : (
            book.entries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => setPreviewEntry(entry)}
                className={`cursor-pointer rounded-lg transition-all ${
                  previewEntry?.id === entry.id ? 'ring-1 ring-blue-500' : ''
                }`}
              >
                <EntryRow
                  entry={entry}
                  entities={MOCK_ENTITIES}
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
        <h3 className="text-sm font-semibold text-white">Preview</h3>
        {previewData ? (
          <Card className="p-4 bg-white dark:bg-gray-800 dark:bg-gray-800 text-slate-900 overflow-auto max-h-[600px]">
            <h4 className="font-bold text-sm mb-3">{previewEntry?.reportName}</h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-slate-300">
                  {previewData.headers.map((h, i) => (
                    <th key={i} className={`py-1 px-2 ${i > 0 ? 'text-right' : 'text-left'}`}>
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
                        {String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <div className="text-center py-12 text-slate-500 text-sm">
            Click a report entry to preview.
          </div>
        )}
      </div>
    </div>
  );
}
