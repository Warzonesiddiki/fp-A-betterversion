// @money-ast-allow Reason: File size display converts bytes to KB (size / 1024), not money
import { useMemo, useState } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { FileDropZone } from '@/components/ui/FileDropZone';
import { EmptyListState } from '@/components/ui/EmptyListState';
import { confirm } from '@/components/ui/ConfirmDialog';
import {
  DOCUMENT_CATEGORIES,
  useDocumentStore,
  type DocumentCategory,
  type ManagedDocument,
} from '@/store/documentStore';
import { formatNumber } from '@/utils/financialFormatting';
import { cn } from '@/utils/cn';
import { DocumentMetadataPanel } from './DocumentMetadataPanel';

type CategoryFilter = 'all' | DocumentCategory;

function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

export function DocumentsPage() {
  const documents = useDocumentStore((s) => s.documents);
  const addDocument = useDocumentStore((s) => s.addDocument);
  const removeDocument = useDocumentStore((s) => s.removeDocument);

  const [filterCategory, setFilterCategory] = useState<CategoryFilter>('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('report');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadEntityId, setUploadEntityId] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const tagCloud = useMemo(() => [...new Set(documents.flatMap((d) => d.tags))], [documents]);

  const filtered = useMemo(
    () =>
      documents.filter(
        (d) =>
          (filterCategory === 'all' || d.category === filterCategory) &&
          (!activeTag || d.tags.includes(activeTag))
      ),
    [documents, filterCategory, activeTag]
  );

  const selectedDoc = documents.find((d: ManagedDocument) => d.id === selectedId) ?? null;

  const handleFile = (file: File) => {
    setUploadError(null);
    try {
      const created = addDocument({
        name: file.name,
        category: uploadCategory,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        tags: parseTags(uploadTags),
        entityId: uploadEntityId.trim() || null,
      });
      setSelectedId(created.id);
      setUploadTags('');
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    }
  };

  const handleDelete = async (doc: ManagedDocument) => {
    const confirmed = await confirm.delete(doc.name);
    if (!confirmed) return;
    removeDocument(doc.id);
    if (selectedId === doc.id) setSelectedId(null);
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Documents"
        icon={<FileText className="h-6 w-6" aria-hidden="true" />}
        purpose="Central register for uploaded financial artifacts — budgets, forecasts, reports and scenario packs."
        status={
          <span className="rounded-full bg-[var(--accent-subtle)] px-2.5 py-0.5 text-xs font-bold text-[var(--text-accent)]">
            {documents.length} {documents.length === 1 ? 'document' : 'documents'}
          </span>
        }
      >
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label
            htmlFor="document-category-filter"
            className="text-sm font-semibold text-[var(--text-primary)]"
          >
            Filter by category
          </label>
          <select
            id="document-category-filter"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as CategoryFilter)}
            className="rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1 text-sm text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
          >
            <option value="all">All categories</option>
            {DOCUMENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
          {tagCloud.map((tag) => (
            <button
              key={tag}
              type="button"
              aria-pressed={activeTag === tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]',
                activeTag === tag
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-subtle)] text-[var(--text-accent)]'
                  : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
              )}
            >
              #{tag}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <section
            aria-labelledby="upload-section-title"
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
          >
            <h2
              id="upload-section-title"
              className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]"
            >
              Upload a document
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="document-upload-category"
                  className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]"
                >
                  Category
                </label>
                <select
                  id="document-upload-category"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                  className="mt-1 w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1.5 text-sm capitalize text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                >
                  {DOCUMENT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="document-upload-tags"
                  className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]"
                >
                  Tags (comma-separated)
                </label>
                <input
                  id="document-upload-tags"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  placeholder="board, q3"
                  className="mt-1 w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1.5 text-sm text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                />
              </div>
              <div>
                <label
                  htmlFor="document-upload-entity"
                  className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]"
                >
                  Entity ID
                </label>
                <input
                  id="document-upload-entity"
                  value={uploadEntityId}
                  onChange={(e) => setUploadEntityId(e.target.value)}
                  placeholder="entity-001"
                  className="mt-1 w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1.5 text-sm text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                />
              </div>
            </div>
            <FileDropZone onFile={handleFile} aria-label="Upload document" />
            {uploadError && (
              <p role="alert" className="mt-2 text-sm font-semibold text-[var(--text-negative)]">
                {uploadError}
              </p>
            )}
          </section>

          {filtered.length === 0 ? (
            documents.length === 0 ? (
              <EmptyListState
                title="No documents yet"
                description="Upload your first CSV or Excel artifact above to start the document register."
              />
            ) : (
              <div role="status">
                <EmptyListState
                  title="No documents match the current filters"
                  description="Clear the category filter or tag selection to see the full register."
                />
              </div>
            )
          ) : (
            <ul aria-label="Document list" className="space-y-2">
              {filtered.map((doc) => (
                <li
                  key={doc.id}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border p-3 transition-colors',
                    selectedDoc?.id === doc.id
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-subtle)]'
                      : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)]'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(doc.id)}
                    aria-label={`Select ${doc.name}`}
                    aria-pressed={selectedDoc?.id === doc.id}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                  >
                    <FileText
                      className="h-5 w-5 shrink-0 text-[var(--text-secondary)]"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-[var(--text-primary)]">
                        {doc.name}
                      </span>
                      <span className="block text-xs text-[var(--text-secondary)]">
                        <span className="capitalize">{doc.category}</span> ·{' '}
                        {formatNumber(doc.size / 1024, 1)} KB ·{' '}
                        {new Date(doc.updatedAt).toLocaleDateString()}
                        {doc.tags.length > 0 && ` · ${doc.tags.map((t) => `#${t}`).join(' ')}`}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${doc.name}`}
                    onClick={() => void handleDelete(doc)}
                    className="shrink-0 rounded-md p-1.5 text-[var(--text-negative)] hover:bg-[var(--negative-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--danger-fill)]"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          {selectedDoc ? (
            <DocumentMetadataPanel key={selectedDoc.id} doc={selectedDoc} />
          ) : (
            <p className="rounded-xl border border-dashed border-[var(--border-subtle)] p-4 text-sm text-[var(--text-muted)]">
              Select a document to inspect its metadata.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
