import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nowISO } from '@/utils/clock';
import { masterStorage } from '@/utils/masterStorage';
import type {
  ExceptionDisposition,
  ExceptionDispositionAuditRecord,
  DispositionStatus,
} from '@/types/exceptions';

export type { ExceptionDisposition, ExceptionDispositionAuditRecord, DispositionStatus };

export interface SetDispositionInput {
  exceptionId: string;
  disposition: DispositionStatus;
  rationale: string;
  ruleId?: string;
  recordedBy?: string;
  recordedAt?: string;
  action?: string;
}

export interface ExceptionDispositionState {
  dispositions: ExceptionDisposition[];
  auditTrail: ExceptionDispositionAuditRecord[];

  setDisposition: (input: SetDispositionInput) => void;
  recordDisposition: (
    exceptionId: string,
    disposition: DispositionStatus,
    rationale: string,
    options?: { ruleId?: string; recordedBy?: string; action?: string }
  ) => void;
  updateDisposition: (
    exceptionId: string,
    status: DispositionStatus,
    reason: string,
    action?: string,
    userId?: string
  ) => void;

  getDisposition: (exceptionId: string) => ExceptionDisposition | undefined;
  getHistory: (exceptionId: string) => ExceptionDispositionAuditRecord[];
  getAuditTrail: (exceptionId?: string) => ExceptionDispositionAuditRecord[];

  clearDispositions: () => void;
  reset: () => void;
}

export const useExceptionDispositionStore = create<ExceptionDispositionState>()(
  persist(
    (set, get) => ({
      dispositions: [],
      auditTrail: [],

      setDisposition: (input: SetDispositionInput) => {
        const state = get();
        const current = state.dispositions.find((d) => d.exceptionId === input.exceptionId);
        const recordedAt = input.recordedAt ?? nowISO();
        const recordedBy = input.recordedBy ?? 'user';

        const updated: ExceptionDisposition = {
          exceptionId: input.exceptionId,
          ruleId: input.ruleId ?? current?.ruleId,
          disposition: input.disposition,
          rationale: input.rationale,
          recordedAt,
          recordedBy,
          action: input.action ?? current?.action,
        };

        const auditRecord: ExceptionDispositionAuditRecord = {
          ...updated,
          previousDisposition: current?.disposition,
          sequenceNumber: state.auditTrail.length + 1,
        };

        const otherDispositions = state.dispositions.filter(
          (d) => d.exceptionId !== input.exceptionId
        );

        set({
          dispositions: [...otherDispositions, updated],
          auditTrail: [...state.auditTrail, auditRecord],
        });
      },

      recordDisposition: (exceptionId, disposition, rationale, options) => {
        get().setDisposition({
          exceptionId,
          disposition,
          rationale,
          ruleId: options?.ruleId,
          recordedBy: options?.recordedBy,
          action: options?.action,
        });
      },

      updateDisposition: (exceptionId, status, reason, action, userId) => {
        get().setDisposition({
          exceptionId,
          disposition: status,
          rationale: reason,
          action,
          recordedBy: userId,
        });
      },

      getDisposition: (exceptionId: string) => {
        return get().dispositions.find((d) => d.exceptionId === exceptionId);
      },

      getHistory: (exceptionId: string) => {
        return (get().auditTrail ?? []).filter((r) => r.exceptionId === exceptionId);
      },

      getAuditTrail: (exceptionId?: string) => {
        const trail = get().auditTrail ?? [];
        return exceptionId ? trail.filter((r) => r.exceptionId === exceptionId) : trail;
      },

      clearDispositions: () => {
        set({ dispositions: [], auditTrail: [] });
      },

      reset: () => {
        set({ dispositions: [], auditTrail: [] });
      },
    }),
    {
      name: 'finplan_exception_dispositions',
      storage: masterStorage,
      version: 1,
      migrate: (persistedState: unknown) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return { dispositions: [], auditTrail: [] };
        }
        const stateObj = persistedState as Record<string, unknown>;
        const dispositions = Array.isArray(stateObj.dispositions) ? stateObj.dispositions : [];
        const auditTrail = Array.isArray(stateObj.auditTrail) ? stateObj.auditTrail : [];
        return {
          ...stateObj,
          dispositions,
          auditTrail,
        };
      },
      partialize: (state) => ({
        dispositions: state.dispositions,
        auditTrail: state.auditTrail,
      }),
    }
  )
);
