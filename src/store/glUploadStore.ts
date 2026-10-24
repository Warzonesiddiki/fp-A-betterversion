import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ColumnMapping } from '@/types';
import { masterStorage } from '@/utils/masterStorage';
import { enforce, Permissions } from '@/utils/rbacEnforcer';
import { nowISO } from '@/utils/clock';
import { sha256Hex } from '@/utils/sha256';

export type UploadStep = 'select' | 'mapping' | 'preview' | 'importing' | 'complete' | 'error';
export type ImportFormat = 'csv' | 'xlsx' | 'xls' | 'unknown';

export interface UploadFileInfo {
  name: string;
  size: number;
  format: ImportFormat;
  rowCount: number;
  columnCount: number;
  columns: string[];
}

export interface UploadPreviewRow {
  rowNum: number;
  data: Record<string, unknown>;
  valid: boolean;
  errors: string[];
}

export interface UploadProgress {
  percent: number;
  message: string;
  rowsProcessed: number;
  totalRows: number;
}

export interface UploadSession {
  id: string;
  startedAt: string;
  completedAt?: string;
  fileInfo: UploadFileInfo;
  mappings: ColumnMapping[];
  rowCount: number;
  errorCount: number;
  status: 'success' | 'partial' | 'error';
}

/**
 * A saved column-mapping for one source header set (IMP-03). Keyed by the
 * normalised header signature, so the monthly export from the same source
 * is recognised — and the owner's corrected mapping re-applied — without
 * hand-mapping every month. User preference, never financial truth.
 */
export interface MappingProfile {
  readonly id: string;
  readonly name: string;
  /** Normalised, sorted header signature (see mappingProfileSignature). */
  readonly signature: string;
  // Mutable array type (contents are still treated as read-only by callers):
  // the zustand/immer draft of this interface requires it for assignment.
  readonly headers: string[];
  readonly mappings: Record<string, string>;
  readonly savedAt: string;
}

/** Order/case/punctuation-insensitive identity of a file's header set. */
export function mappingProfileSignature(headers: readonly string[]): string {
  return headers
    .map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter((h) => h.length > 0)
    .sort()
    .join('|');
}

export function findMappingProfile(
  profiles: readonly MappingProfile[],
  headers: readonly string[]
): MappingProfile | undefined {
  const signature = mappingProfileSignature(headers);
  return profiles.find((p) => p.signature === signature);
}

export interface GLUploadState {
  step: UploadStep;
  fileInfo: UploadFileInfo | null;
  csvColumns: string[];
  mappings: Record<string, string>;
  preview: UploadPreviewRow[];
  validationErrors: string[];
  progress: UploadProgress;
  session: UploadSession | null;
  sessionHistory: UploadSession[];
  isAutoMapping: boolean;
  mappingProfiles: MappingProfile[];

  setFile: (fileInfo: UploadFileInfo, csvColumns: string[]) => void;
  setStep: (step: UploadStep) => void;
  setMappings: (mappings: Record<string, string>) => void;
  setPreview: (preview: UploadPreviewRow[], errors: string[]) => void;
  setProgress: (progress: Partial<UploadProgress>) => void;
  setAutoMapping: (isAuto: boolean) => void;
  completeSession: (session: UploadSession) => void;
  saveMappingProfile: (input: {
    name: string;
    headers: readonly string[];
    mappings: Record<string, string>;
  }) => void;
  deleteMappingProfile: (id: string) => void;
  reset: () => void;
  clearHistory: () => void;
}

const initialState = {
  step: 'select' as UploadStep,
  fileInfo: null as UploadFileInfo | null,
  csvColumns: [] as string[],
  mappings: {} as Record<string, string>,
  preview: [] as UploadPreviewRow[],
  validationErrors: [] as string[],
  progress: { percent: 0, message: '', rowsProcessed: 0, totalRows: 0 },
  session: null as UploadSession | null,
  sessionHistory: [] as UploadSession[],
  isAutoMapping: false,
  mappingProfiles: [] as MappingProfile[],
};

export const useGLUploadStore = create<GLUploadState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        ...initialState,

        setFile: enforce(Permissions.IMPORT_CREATE, 'setFile', (fileInfo, csvColumns) => {
          set({
            fileInfo,
            csvColumns,
            step: 'mapping',
            mappings: {},
            preview: [],
            validationErrors: [],
            progress: { percent: 0, message: '', rowsProcessed: 0, totalRows: 0 },
          });
        }),

        setStep: enforce(Permissions.UI_UPDATE, 'setStep', (step) => set({ step })),

        setMappings: enforce(Permissions.IMPORT_UPDATE, 'setMappings', (mappings) =>
          set({ mappings })
        ),

        setPreview: enforce(
          Permissions.IMPORT_UPDATE,
          'setPreview',
          (preview, validationErrors) => {
            set({ preview, validationErrors, step: preview.length > 0 ? 'preview' : 'error' });
          }
        ),

        setProgress: enforce(Permissions.UI_UPDATE, 'setProgress', (progress) =>
          set((state) => {
            state.progress = { ...state.progress, ...progress };
          })
        ),

        setAutoMapping: enforce(Permissions.IMPORT_UPDATE, 'setAutoMapping', (isAutoMapping) =>
          set({ isAutoMapping })
        ),

        completeSession: enforce(Permissions.IMPORT_CREATE, 'completeSession', (session) =>
          set((state) => {
            state.session = session;
            state.sessionHistory.unshift(session);
            state.step = 'complete';
            state.progress = {
              percent: 100,
              message: 'Import complete',
              rowsProcessed: session.rowCount,
              totalRows: session.rowCount,
            };
          })
        ),

        saveMappingProfile: enforce(Permissions.IMPORT_UPDATE, 'saveMappingProfile', (input) => {
          const signature = mappingProfileSignature(input.headers);
          const profile: MappingProfile = {
            id: `profile-${sha256Hex(signature).slice(0, 16)}`,
            name: input.name.trim() || 'Untitled profile',
            signature,
            headers: [...input.headers],
            mappings: { ...input.mappings },
            savedAt: nowISO(),
          };
          set((state) => {
            const existing = state.mappingProfiles.findIndex((p) => p.signature === signature);
            // Fresh literals: the immer draft wants mutable shapes, the
            // exported profile type is readonly.
            const draftProfile = { ...profile, headers: [...profile.headers] };
            if (existing >= 0) {
              state.mappingProfiles[existing] = draftProfile;
            } else {
              state.mappingProfiles.push(draftProfile);
            }
          });
        }),

        deleteMappingProfile: enforce(Permissions.IMPORT_DELETE, 'deleteMappingProfile', (id) => {
          set((state) => {
            state.mappingProfiles = state.mappingProfiles.filter((p) => p.id !== id);
          });
        }),

        reset: enforce(Permissions.UI_UPDATE, 'reset', () => set({ ...initialState })),

        clearHistory: enforce(Permissions.IMPORT_DELETE, 'clearHistory', () =>
          set({ sessionHistory: [] })
        ),
      })),
      {
        name: 'gl-upload-store',
        storage: masterStorage,
        version: 2,
        migrate: (state: unknown) => {
          const s = (state ?? {}) as Partial<GLUploadState>;
          return { ...s, mappingProfiles: s.mappingProfiles ?? [] } as GLUploadState;
        },
        partialize: (state) => ({
          sessionHistory: state.sessionHistory,
          isAutoMapping: state.isAutoMapping,
          mappingProfiles: state.mappingProfiles,
        }),
      }
    )
  )
);

export const glUploadSelectors = {
  fileInfo: (state: GLUploadState) => state.fileInfo,
  step: (state: GLUploadState) => state.step,
  mappings: (state: GLUploadState) => state.mappings,
  preview: (state: GLUploadState) => state.preview,
  progress: (state: GLUploadState) => state.progress,
  session: (state: GLUploadState) => state.session,
  history: (state: GLUploadState) => state.sessionHistory,
  isAutoMapping: (state: GLUploadState) => state.isAutoMapping,
  hasFile: (state: GLUploadState) => state.fileInfo !== null,
  isComplete: (state: GLUploadState) => state.step === 'complete',
  hasErrors: (state: GLUploadState) => state.validationErrors.length > 0,
  errorCount: (state: GLUploadState) => state.validationErrors.length,
  mappedColumns: (state: GLUploadState) => Object.keys(state.mappings).length,
};
