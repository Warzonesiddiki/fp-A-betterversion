import { useCallback, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ReportBookEngine,
  REPORT_TEMPLATE_PRESETS,
  type ReportBook,
  type Entity,
} from '@/engines/ReportBookEngine';
import {
  EntityToggle,
  TemplateRow,
  VariableEditor,
  MatrixPreview,
} from './BookBurstSubs';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_ENTITIES: Entity[] = [
  { id: 'ent-1', name: 'Acme Corp (US)', currency: 'USD', parentId: null },
  { id: 'ent-2', name: 'Acme Europe (UK)', currency: 'GBP', parentId: 'ent-1' },
  { id: 'ent-3', name: 'Acme Asia (JP)', currency: 'JPY', parentId: 'ent-1' },
  { id: 'ent-4', name: 'Acme LATAM (BR)', currency: 'BRL', parentId: 'ent-1' },
  { id: 'ent-5', name: 'Acme Middle East (AE)', currency: 'AED', parentId: 'ent-1' },
];

const PRESET_LIST = Object.values(REPORT_TEMPLATE_PRESETS);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BookBurstConfigProps {
  onBookReady?: (engine: ReportBookEngine, bookId: string, entities: Entity[]) => void;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function BookBurstConfig({ onBookReady }: BookBurstConfigProps) {
  const [engine] = useState(() => new ReportBookEngine());
  const [book, setBook] = useState<ReportBook>(() =>
    engine.createBook('Book & Burst', 'Multi-entity report batch')
  );

  const [selectedEntityIds, setSelectedEntityIds] = useState<Set<string>>(
    () => new Set(MOCK_ENTITIES.map((e) => e.id))
  );
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(
    () => new Set(PRESET_LIST.map((p) => p.id))
  );
  const [variables, setVariables] = useState<Record<string, string>>({ period: 'FY 2026' });
  const [bookName, setBookName] = useState('Q2 2026 Book & Burst');

  const availableVars = useMemo(() => engine.getAvailableVariables(), [engine]);

  // --- Handlers ---

  const toggleEntity = useCallback((id: string) => {
    setSelectedEntityIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleTemplate = useCallback((id: string) => {
    setSelectedTemplateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleVarChange = useCallback((key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSync = useCallback(() => {
    const currentBook = engine.getBook(book.id);
    if (!currentBook) return;

    for (const entry of [...currentBook.entries]) {
      engine.removeEntry(book.id, entry.id);
    }

    const entityIds = Array.from(selectedEntityIds);
    for (const presetId of selectedTemplateIds) {
      const preset = PRESET_LIST.find((p) => p.id === presetId);
      if (!preset) continue;

      engine.addEntry(book.id, {
        reportName: preset.name,
        templateId: presetId,
        entityIds,
        variables,
        enabled: true,
      });
    }

    const updated = engine.getBook(book.id)!;
    updated.name = bookName;
    setBook({ ...updated });
  }, [book.id, bookName, engine, selectedEntityIds, selectedTemplateIds, variables]);

  const handleReady = useCallback(() => {
    onBookReady?.(engine, book.id, MOCK_ENTITIES.filter((e) => selectedEntityIds.has(e.id)));
  }, [book.id, engine, onBookReady, selectedEntityIds]);

  // --- Computed ---

  const totalGenerations = selectedTemplateIds.size * selectedEntityIds.size;

  const selectedEntities = useMemo(
    () => MOCK_ENTITIES.filter((e) => selectedEntityIds.has(e.id)),
    [selectedEntityIds]
  );

  // --- Render ---

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" role="region" aria-label="BookBurstConfig">
      {/* LEFT: Entity selection */}
      <div className="lg:col-span-4 space-y-4">
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Entities</h3>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setSelectedEntityIds(new Set(MOCK_ENTITIES.map((e) => e.id)))}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                All
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={() => setSelectedEntityIds(new Set())}
                className="text-xs text-slate-400 hover:text-slate-300"
              >
                None
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            {MOCK_ENTITIES.map((entity) => (
              <EntityToggle
                key={entity.id}
                entity={entity}
                selected={selectedEntityIds.has(entity.id)}
                onToggle={toggleEntity}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500">
            {selectedEntityIds.size} of {MOCK_ENTITIES.length} selected
          </p>
        </Card>

        <Card className="p-4">
          <VariableEditor variables={availableVars} values={variables} onChange={handleVarChange} />
        </Card>
      </div>

      {/* CENTER: Template selection */}
      <div className="lg:col-span-4">
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white">Report Templates</h3>
          <div className="space-y-1.5">
            {PRESET_LIST.map((preset) => (
              <TemplateRow
                key={preset.id}
                preset={preset}
                selected={selectedTemplateIds.has(preset.id)}
                entityCount={selectedEntityIds.size}
                onToggle={toggleTemplate}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* RIGHT: Summary + actions */}
      <div className="lg:col-span-4 space-y-4">
        <Card className="p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white">Book Configuration</h3>
          <div>
            <label htmlFor="book-name" className="block text-xs text-slate-400 mb-1">
              Book Name
            </label>
            <input
              id="book-name"
              type="text"
              value={bookName}
              onChange={(e) => setBookName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded text-sm text-white px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-slate-800/50 p-2">
              <p className="text-lg font-bold text-white">{selectedEntityIds.size}</p>
              <p className="text-xs text-slate-400">Entities</p>
            </div>
            <div className="rounded-lg bg-slate-800/50 p-2">
              <p className="text-lg font-bold text-white">{selectedTemplateIds.size}</p>
              <p className="text-xs text-slate-400">Templates</p>
            </div>
            <div className="rounded-lg bg-slate-800/50 p-2">
              <p className="text-lg font-bold text-emerald-400">{totalGenerations}</p>
              <p className="text-xs text-slate-400">Reports</p>
            </div>
          </div>

          <Button onClick={handleSync} className="w-full" variant="secondary">
            Sync Book Entries
          </Button>
          <Button onClick={handleReady} className="w-full" disabled={totalGenerations === 0}>
            Ready for Generation ({totalGenerations})
          </Button>
        </Card>

        {book.entries.length > 0 && (
          <Card className="p-4 space-y-2">
            <h3 className="text-sm font-semibold text-white">Matrix Preview</h3>
            <MatrixPreview book={book} entities={selectedEntities} />
          </Card>
        )}
      </div>
    </div>
  );
}
