import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { WritableDraft } from 'immer';
import { DocumentEngine, type FinanceDocument } from '@/engines/DocumentEngine';
import { masterStorage } from '@/utils/masterStorage';
import { enforce, getCurrentUser, Permissions } from '@/utils/rbacEnforcer';

/**
 * Categories mirror FinanceDocument['type'] so every stored document can be
 * handed to the DocumentEngine versioning API without remapping.
 */
export type DocumentCategory = FinanceDocument['type'];

export const DOCUMENT_CATEGORIES: readonly DocumentCategory[] = [
  'budget',
  'forecast',
  'report',
  'scenario',
];

export interface ManagedDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  tags: string[];
  entityId: string | null;
  periodId: string | null;
  size: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
  contentRef: Record<string, unknown>;
}

export interface AddDocumentInput {
  name: string;
  category: DocumentCategory;
  size?: number;
  mimeType?: string;
  tags?: readonly string[];
  entityId?: string | null;
  periodId?: string | null;
  content?: Record<string, unknown>;
}

export type DocumentVersionInfo = ReturnType<DocumentEngine['getVersionHistory']>[number];

interface DocumentState {
  documents: ManagedDocument[];
  addDocument: (input: AddDocumentInput) => ManagedDocument;
  removeDocument: (id: string) => void;
  renameDocument: (id: string, name: string) => void;
  tagDocument: (id: string, tag: string) => void;
  linkDocumentToEntity: (id: string, entityId: string | null) => void;
  signLatestVersion: (id: string) => void;
  getVersionHistory: (id: string) => DocumentVersionInfo[];
}

/**
 * Session-scoped provenance trail. DocumentEngine keeps versions in memory
 * only — metadata below persists through masterStorage, but the version
 * history resets on reload until the engine gains a persistence contract.
 */
const documentEngine = new DocumentEngine();

let idSequence = 0;

function nextDocumentId(): string {
  idSequence += 1;
  return `doc-${Date.now()}-${idSequence}`;
}

function validateName(name: string): string {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Document name must be a non-empty string');
  }
  const trimmed = name.trim();
  if (trimmed.length > 200) {
    throw new Error('Document name must be 200 characters or less');
  }
  return trimmed;
}

function dedupeTags(tags: readonly string[] | undefined): string[] {
  if (!tags) return [];
  return [...new Set(tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0))];
}

function toFinanceDocument(doc: ManagedDocument): FinanceDocument {
  return { id: doc.id, name: doc.name, type: doc.category, content: doc.contentRef };
}

export const useDocumentStore = create<DocumentState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        documents: [],

        addDocument: enforce(
          Permissions.IMPORT_CREATE,
          'addDocument',
          (input: AddDocumentInput): ManagedDocument => {
            if (input.size !== undefined && (!Number.isFinite(input.size) || input.size < 0)) {
              throw new Error('Document size must be a non-negative finite number');
            }
            const now = new Date().toISOString();
            const doc: ManagedDocument = {
              id: nextDocumentId(),
              name: validateName(input.name),
              category: input.category,
              tags: dedupeTags(input.tags),
              entityId: input.entityId ?? null,
              periodId: input.periodId ?? null,
              size: input.size ?? 0,
              mimeType: input.mimeType ?? 'application/octet-stream',
              createdAt: now,
              updatedAt: now,
              contentRef: input.content
                ? (JSON.parse(JSON.stringify(input.content)) as Record<string, unknown>)
                : {},
            };
            documentEngine.createVersion(toFinanceDocument(doc), getCurrentUser()?.id ?? 'system');
            set((state) => {
              state.documents.push(doc as WritableDraft<ManagedDocument>);
            });
            return doc;
          }
        ),

        removeDocument: enforce(Permissions.IMPORT_DELETE, 'removeDocument', (id: string) => {
          set((state) => {
            const idx = state.documents.findIndex((d) => d.id === id);
            if (idx !== -1) state.documents.splice(idx, 1);
          });
        }),

        renameDocument: enforce(
          Permissions.IMPORT_UPDATE,
          'renameDocument',
          (id: string, name: string) => {
            const validated = validateName(name);
            set((state) => {
              const doc = state.documents.find((d) => d.id === id);
              if (doc) {
                doc.name = validated;
                doc.updatedAt = new Date().toISOString();
              }
            });
          }
        ),

        tagDocument: enforce(
          Permissions.IMPORT_UPDATE,
          'tagDocument',
          (id: string, tag: string) => {
            const trimmed = tag.trim();
            if (!trimmed) throw new Error('Tag must be a non-empty string');
            set((state) => {
              const doc = state.documents.find((d) => d.id === id);
              if (doc && !doc.tags.includes(trimmed)) {
                doc.tags.push(trimmed);
                doc.updatedAt = new Date().toISOString();
              }
            });
          }
        ),

        linkDocumentToEntity: enforce(
          Permissions.IMPORT_UPDATE,
          'linkDocumentToEntity',
          (id: string, entityId: string | null) => {
            set((state) => {
              const doc = state.documents.find((d) => d.id === id);
              if (doc) {
                doc.entityId = entityId;
                doc.updatedAt = new Date().toISOString();
              }
            });
          }
        ),

        signLatestVersion: enforce(Permissions.IMPORT_UPDATE, 'signLatestVersion', (id: string) => {
          const userId = getCurrentUser()?.id;
          if (!userId) return;
          const latest = documentEngine.getVersionHistory(id)[0];
          if (latest) documentEngine.signDocument(latest.id, userId);
        }),

        getVersionHistory: (id: string) => documentEngine.getVersionHistory(id),
      })),
      {
        name: 'document-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);

export const documentSelectors = {
  documents: (state: DocumentState) => state.documents,
  byId: (state: DocumentState, id: string) => state.documents.find((d) => d.id === id) ?? null,
  byCategory: (state: DocumentState, category: DocumentCategory) =>
    state.documents.filter((d) => d.category === category),
  byEntity: (state: DocumentState, entityId: string) =>
    state.documents.filter((d) => d.entityId === entityId),
  byTag: (state: DocumentState, tag: string) => state.documents.filter((d) => d.tags.includes(tag)),
  categories: (state: DocumentState): DocumentCategory[] => [
    ...new Set(state.documents.map((d) => d.category)),
  ],
  tagCloud: (state: DocumentState): { tag: string; count: number }[] => {
    const counts = new Map<string, number>();
    for (const doc of state.documents) {
      for (const tag of doc.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  },
};
