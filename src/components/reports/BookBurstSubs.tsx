import type { Entity, ReportVariable, ReportBook } from '@/engines/ReportBookEngine';

// ---------------------------------------------------------------------------
// Sub-components shared between BookBurstConfig and ReportGenerator
// ---------------------------------------------------------------------------

interface EntityToggleProps {
  entity: Entity;
  selected: boolean;
  onToggle: (id: string) => void;
}

export function EntityToggle({
  entity = { id: '', name: '', currency: 'USD' } as Entity,
  selected = false,
  onToggle = () => {},
}: EntityToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(entity.id)}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
        selected
          ? 'border-blue-500 bg-blue-600/20 text-blue-300'
          : 'border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:border-[var(--border-default)]'
      }`}
      aria-pressed={selected}
    >
      <span className={`h-2 w-2 rounded-full ${selected ? 'bg-blue-400' : 'bg-[var(--bg-hover)]'}`} />
      <span className="font-medium">{entity.name}</span>
      <span className="text-[var(--text-muted)]">{entity.currency}</span>
    </button>
  );
}

interface TemplateRowProps {
  preset: { id: string; name: string; description: string };
  selected: boolean;
  entityCount: number;
  onToggle: (id: string) => void;
}

export function TemplateRow({ preset, selected, entityCount, onToggle }: TemplateRowProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(preset.id)}
      className={`flex items-center justify-between w-full rounded-lg border px-3 py-2 text-left transition-colors ${
        selected
          ? 'border-emerald-500 bg-emerald-600/15 text-emerald-300'
          : 'border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:border-[var(--border-default)]'
      }`}
      aria-pressed={selected}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium">{preset.name}</p>
        <p className="text-xs text-[var(--text-muted)] truncate">{preset.description}</p>
      </div>
      {selected && (
        <span className="ml-3 shrink-0 text-xs text-emerald-400">
          {entityCount} entit{entityCount === 1 ? 'y' : 'ies'}
        </span>
      )}
    </button>
  );
}

interface VariableEditorProps {
  variables: ReportVariable[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export function VariableEditor({ variables, values, onChange }: VariableEditorProps) {
  return (
    <div className="space-y-2" role="region" aria-label="BookBurstSubs">
      <h4 className="text-xs font-medium text-[var(--text-muted)]">Variable Substitution</h4>
      <div className="grid grid-cols-2 gap-2">
        {variables.map((v) => (
          <div key={v.key}>
            <label htmlFor={`var-${v.key}`} className="block text-xs text-[var(--text-muted)] mb-0.5">
              <code className="text-blue-400">{`{${v.key}}`}</code> &mdash; {v.label}
            </label>
            <input
              id={`var-${v.key}`}
              type="text"
              value={values[v.key] ?? v.defaultValue}
              onChange={(e) => onChange(v.key, e.target.value)}
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:border-blue-500 outline-none"
              placeholder={v.defaultValue}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface MatrixPreviewProps {
  book: ReportBook;
  entities: Entity[];
}

export function MatrixPreview({ book, entities }: MatrixPreviewProps) {
  const enabledEntries = book.entries.filter((e) => e.enabled);
  if (enabledEntries.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="text-left py-1 px-2 text-[var(--text-muted)] border-b border-[var(--border-default)]">
              Report
            </th>
            {entities.map((e) => (
              <th
                key={e.id}
                className="text-center py-1 px-2 text-[var(--text-muted)] border-b border-[var(--border-default)]"
              >
                {e.name.split('(')[0]?.trim()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {enabledEntries.map((entry) => (
            <tr key={entry.id} className="border-b border-slate-800">
              <td className="py-1 px-2 text-white font-medium">{entry.reportName}</td>
              {entities.map((e) => (
                <td key={e.id} className="text-center py-1 px-2">
                  {entry.entityIds.includes(e.id) ? (
                    <span className="text-emerald-400">{'\u2713'}</span>
                  ) : (
                    <span className="text-[var(--text-muted)]">{'\u2014'}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface ProgressBarInlineProps {
  completed: number;
  total: number;
  status: string;
  currentReport?: string;
  currentEntity?: string;
  errors?: string[];
}

export function ProgressBarInline({
  completed,
  total,
  status,
  currentReport,
  currentEntity,
  errors,
}: ProgressBarInlineProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-[var(--text-muted)]">
        <span>{currentReport && `${currentReport} \u2014 ${currentEntity}`}</span>
        <span>
          {completed}/{total} ({pct}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--bg-hover)] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            status === 'error' ? 'bg-red-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {errors && errors.length > 0 && (
        <ul className="text-xs text-red-400 space-y-0.5 max-h-24 overflow-auto">
          {errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
