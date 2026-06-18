import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ColumnMapping } from '@/types';
import { masterStorage } from '@/utils/masterStorage';
import { enforce, Permissions } from '@/utils/rbacEnforcer';

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

  setFile: (fileInfo: UploadFileInfo, csvColumns: string[]) => void;
  setStep: (step: UploadStep) => void;
  setMappings: (mappings: Record<string, string>) => void;
  setPreview: (preview: UploadPreviewRow[], errors: string[]) => void;
  setProgress: (progress: Partial<UploadProgress>) => void;
  setAutoMapping: (isAuto: boolean) => void;
  completeSession: (session: UploadSession) => void;
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
        },

        setStep: enforce(Permissions.UI_UPDATE, 'setStep', (step) => set({ step })),

        setMappings: enforce(Permissions.IMPORT_UPDATE, 'setMappings', (mappings) => set({ mappings })),

        setPreview: enforce(Permissions.IMPORT_UPDATE, 'setPreview', (preview, validationErrors) => {
          set({ preview, validationErrors, step: preview.length > 0 ? 'preview' : 'error' });
        },

        setProgress: enforce(Permissions.UI_UPDATE, 'setProgress', (progress) =>
          set((state) => {
            state.progress = { ...state.progress, ...progress };
          }),

        setAutoMapping: enforce(Permissions.IMPORT_UPDATE, 'setAutoMapping', (isAutoMapping) => set({ isAutoMapping })),

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
          }),

        reset: enforce(Permissions.UI_UPDATE, 'reset', () => set({ ...initialState })),

        clearHistory: enforce(Permissions.IMPORT_DELETE, 'clearHistory', () => set({ sessionHistory: [] })),
      })),
      {
        name: 'gl-upload-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
        partialize: (state) => ({
          sessionHistory: state.sessionHistory,
          isAutoMapping: state.isAutoMapping,
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
