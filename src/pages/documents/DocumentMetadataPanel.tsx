import { useMemo, useState } from 'react';
import { PenLine, Save, ShieldCheck } from 'lucide-react';
import { useDocumentStore, type ManagedDocument } from '@/store/documentStore';
import { formatNumber } from '@/utils/financialFormatting';

export interface DocumentMetadataPanelProps {
  doc: ManagedDocument;
}

export function DocumentMetadataPanel({ doc }: DocumentMetadataPanelProps) {
  const renameDocument = useDocumentStore((s) => s.renameDocument);
  const tagDocument = useDocumentStore((s) => s.tagDocument);
  const signLatestVersion = useDocumentStore((s) => s.signLatestVersion);
  const documents = useDocumentStore((s) => s.documents);
  // getVersionHistory builds a fresh array per call, so it must not be used
  // directly as a zustand selector (unstable snapshot → render loop).
  const history = useMemo(
    () => useDocumentStore.getState().getVersionHistory(doc.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- documents is an invalidation key: engine history mutates alongside store mutations
    [doc.id, documents]
  );

  const [nameDraft, setNameDraft] = useState(doc.name);
  const [tagDraft, setTagDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const run = (action: () => void) => {
    setError(null);
    try {
      action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    }
  };

  const latest = history[0];

  return (
    <section
      aria-label={`Details for ${doc.name}`}
      className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
    >
      <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
        Document details
      </h2>

      <div className="mt-3 flex items-center gap-2">
        <label htmlFor="document-name-input" className="sr-only">
          Document name
        </label>
        <input
          id="document-name-input"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 text-sm font-semibold text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
        />
        <button
          type="button"
          onClick={() => run(() => renameDocument(doc.id, nameDraft))}
          className="inline-flex items-center gap-1 rounded-md border border-[var(--border-subtle)] px-2 py-1 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
        >
          <Save className="h-3.5 w-3.5" aria-hidden="true" />
          Save name
        </button>
      </div>

      <dl className="mt-4 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--text-secondary)]">Category</dt>
          <dd className="font-semibold capitalize text-[var(--text-primary)]">{doc.category}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--text-secondary)]">Size</dt>
          <dd className="font-semibold text-[var(--text-primary)]">
            {formatNumber(doc.size / 1024, 1)} KB
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--text-secondary)]">MIME type</dt>
          <dd className="truncate font-mono text-xs text-[var(--text-primary)]">{doc.mimeType}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--text-secondary)]">Entity</dt>
          <dd className="font-semibold text-[var(--text-primary)]">{doc.entityId ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--text-secondary)]">Period</dt>
          <dd className="font-semibold text-[var(--text-primary)]">{doc.periodId ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-[var(--text-secondary)]">Created</dt>
          <dd className="text-[var(--text-primary)]">{new Date(doc.createdAt).toLocaleString()}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Tags
        </span>
        <ul className="mt-1 flex flex-wrap gap-1.5">
          {doc.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-[var(--accent-subtle)] px-2 py-0.5 text-xs font-semibold text-[var(--text-accent)]"
            >
              {tag}
            </li>
          ))}
          {doc.tags.length === 0 && (
            <li className="text-xs text-[var(--text-muted)]">No tags yet</li>
          )}
        </ul>
        <div className="mt-2 flex items-center gap-2">
          <label htmlFor="document-tag-input" className="sr-only">
            Add tag
          </label>
          <input
            id="document-tag-input"
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            placeholder="Add tag…"
            className="min-w-0 flex-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
          />
          <button
            type="button"
            aria-label={`Add tag to ${doc.name}`}
            onClick={() =>
              run(() => {
                tagDocument(doc.id, tagDraft);
                setTagDraft('');
              })
            }
            className="inline-flex items-center gap-1 rounded-md border border-[var(--border-subtle)] px-2 py-1 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
          >
            <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
            Tag
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-dashed border-[var(--border-subtle)] p-3">
        <p className="text-xs text-[var(--text-secondary)]">
          Version snapshots: <span data-testid="version-count">{history.length}</span>{' '}
          {latest ? `(latest v${latest.version})` : ''}
          <span className="mt-0.5 block text-[10px] italic">
            Session-scoped provenance trail — resets when the app restarts.
          </span>
        </p>
        <button
          type="button"
          disabled={!latest}
          onClick={() => run(() => signLatestVersion(doc.id))}
          className="mt-2 inline-flex items-center gap-1 rounded-md border border-[var(--border-subtle)] px-2 py-1 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
        >
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Sign latest version
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs font-semibold text-[var(--text-negative)]">
          {error}
        </p>
      )}
    </section>
  );
}
