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
  /** Stable identity shared by all immutable versions of this mapping. */
  readonly id: string;
  /** Monotonic configuration version. Editing a profile appends a new record. */
  readonly version: number;
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
  return profiles
    .filter((profile) => profile.signature === signature)
    .reduce<
      MappingProfile | undefined
    >((latest, profile) => (!latest || profile.version > latest.version ? profile : latest), undefined);
}

export function mappingProfilesEqual(
  left: Readonly<Record<string, string>>,
  right: Readonly<Record<string, string>>
): boolean {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every((key, index) => key === rightKeys[index] && left[key] === right[key])
  );
}

/** Upgrade legacy header-signature profiles without discarding their mapping. */
export function migrateMappingProfiles(value: unknown): MappingProfile[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error('Saved GL mapping profiles must be an array.');

  return value.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Saved GL mapping profile ${index + 1} is not an object.`);
    }
    const profile = item as Partial<MappingProfile>;
    if (
      typeof profile.id !== 'string' ||
      typeof profile.name !== 'string' ||
      typeof profile.signature !== 'string' ||
      !Array.isArray(profile.headers) ||
      !profile.headers.every((header) => typeof header === 'string') ||
      !profile.mappings ||
      typeof profile.mappings !== 'object' ||
      Array.isArray(profile.mappings) ||
      typeof profile.savedAt !== 'string'
    ) {
      throw new Error(`Saved GL mapping profile ${index + 1} has an invalid shape.`);
    }
    const mappings = profile.mappings as Record<string, unknown>;
    if (!Object.values(mappings).every((column) => typeof column === 'string')) {
      throw new Error(`Saved GL mapping profile ${index + 1} has invalid column mappings.`);
    }
    return {
      ...profile,
      headers: [...profile.headers],
      mappings: { ...mappings } as Record<string, string>,
      version:
        typeof profile.version === 'number' &&
        Number.isInteger(profile.version) &&
        profile.version > 0
          ? profile.version
          : 1,
    } as MappingProfile;
  });
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
  }) => MappingProfile;
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
      immer((set, get) => ({
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
          const name = input.name.trim() || 'Untitled profile';
          const current = findMappingProfile(get().mappingProfiles, input.headers);
          if (
            current &&
            current.name === name &&
            mappingProfilesEqual(current.mappings, input.mappings)
          ) {
            return current;
          }

          const profile: MappingProfile = {
            id: current?.id ?? `profile-${sha256Hex(signature).slice(0, 16)}`,
            version: (current?.version ?? 0) + 1,
            name,
            signature,
            headers: [...input.headers],
            mappings: { ...input.mappings },
            savedAt: nowISO(),
          };
          set((state) => {
            // Keep every prior version immutable for batch lineage and rollback.
            state.mappingProfiles.push({ ...profile, headers: [...profile.headers] });
          });
          return profile;
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
        version: 3,
        migrate: (state: unknown) => {
          const s = (state ?? {}) as Partial<GLUploadState>;
          return {
            ...s,
            mappingProfiles: migrateMappingProfiles(s.mappingProfiles),
          } as GLUploadState;
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
