import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nowISO } from '@/utils/clock';
import { assertPermission, getCurrentUser, Permissions } from '@/utils/rbacEnforcer';
import { masterStorage } from '@/utils/masterStorage';
import { parseImportDate } from '@/utils/parseImportDate';
import type {
  CorrectionAuditRecord,
  CorrectionRequest,
  CorrectionStatus,
  ExceptionDisposition,
  ExceptionDispositionAuditRecord,
  DispositionStatus,
} from '@/types/exceptions';

export type {
  ExceptionDisposition,
  ExceptionDispositionAuditRecord,
  DispositionStatus,
  CorrectionRequest,
  CorrectionAuditRecord,
  CorrectionStatus,
};

export interface SetDispositionInput {
  exceptionId: string;
  disposition: DispositionStatus;
  rationale: string;
  ruleId?: string;
  recordedBy?: string;
  recordedAt?: string;
  action?: string;
}

/** FR-010: the reviewer's ask to the accounts team, before it is normalised. */
export interface RequestCorrectionInput {
  exceptionId: string;
  /** What has to change. Required — a hand-off with no instruction is not one. */
  instruction: string;
  /** Who fixes it. Required — an unassigned correction has no owner. */
  assignee: string;
  /** `YYYY-MM-DD` (or any form the import date parser canonicalises). Optional. */
  dueDate?: string | null;
  /** Where the entry is: batch and source row, so it can be found. */
  source?: string | null;
  ruleId?: string;
}

function requireText(value: unknown, action: string, field: string, why: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${action}: ${field} is required — ${why}`);
  }
  return value.trim();
}

function requireCorrectionActor(action: string): string {
  const actorId = getCurrentUser()?.id;
  if (typeof actorId !== 'string' || actorId.trim() === '') {
    throw new Error(`${action}: authenticated actor ID is required for correction history`);
  }
  return actorId.trim();
}

/**
 * Canonical due date, or `null` when the caller agreed on none.
 *
 * A supplied date is parsed by the importer's own calendar-checked parser, so
 * `2026-02-30` is refused rather than stored, and an absent date stays `null`
 * — it is never replaced by "today", which would invent a commitment nobody
 * made.
 */
function normaliseDueDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (raw === '') return null;
  const canonical = parseImportDate(raw);
  if (canonical === null) {
    throw new Error(
      `requestCorrection: due date "${raw}" is not a valid calendar date (use YYYY-MM-DD)`
    );
  }
  return canonical;
}

export interface ExceptionDispositionState {
  dispositions: ExceptionDisposition[];
  auditTrail: ExceptionDispositionAuditRecord[];
  /** FR-010 — one active correction request per exception, with its history. */
  corrections: CorrectionRequest[];
  correctionAuditTrail: CorrectionAuditRecord[];

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

  requestCorrection: (input: RequestCorrectionInput) => CorrectionRequest;
  updateCorrectionStatus: (exceptionId: string, status: CorrectionStatus) => CorrectionRequest;
  getCorrection: (exceptionId: string) => CorrectionRequest | undefined;
  getCorrectionHistory: (exceptionId: string) => CorrectionAuditRecord[];
  getCorrections: () => CorrectionRequest[];

  clearDispositions: () => void;
  clearCorrections: () => void;
  reset: () => void;
}

export const useExceptionDispositionStore = create<ExceptionDispositionState>()(
  persist(
    (set, get) => ({
      dispositions: [],
      auditTrail: [],
      corrections: [],
      correctionAuditTrail: [],

      setDisposition: (input: SetDispositionInput) => {
        assertPermission(Permissions.EXCEPTION_DISPOSE, 'setDisposition');
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

      requestCorrection: (input) => {
        assertPermission(Permissions.EXCEPTION_DISPOSE, 'requestCorrection');
        const actorId = requireCorrectionActor('requestCorrection');
        const recordedAt = nowISO();
        const exceptionId = requireText(
          input.exceptionId,
          'requestCorrection',
          'exceptionId',
          'a correction belongs to one flagged entry'
        );
        const instruction = requireText(
          input.instruction,
          'requestCorrection',
          'instruction',
          'say what has to change'
        );
        const assignee = requireText(
          input.assignee,
          'requestCorrection',
          'assignee',
          'say who in the accounts team fixes it'
        );
        const dueDate = normaliseDueDate(input.dueDate);
        const source =
          typeof input.source === 'string' && input.source.trim() !== ''
            ? input.source.trim()
            : null;

        const state = get();
        const current = state.corrections.find((c) => c.exceptionId === exceptionId);

        const request: CorrectionRequest = {
          exceptionId,
          ruleId: input.ruleId ?? current?.ruleId,
          instruction,
          assignee,
          dueDate,
          source,
          status: 'REQUESTED',
          requestedAt: recordedAt,
          requestedBy: actorId,
        };

        const auditRecord: CorrectionAuditRecord = {
          ...request,
          recordedAt,
          recordedBy: actorId,
          previousStatus: current?.status,
          sequenceNumber: state.correctionAuditTrail.length + 1,
        };

        set({
          corrections: [...state.corrections.filter((c) => c.exceptionId !== exceptionId), request],
          correctionAuditTrail: [...state.correctionAuditTrail, auditRecord],
        });

        return request;
      },

      updateCorrectionStatus: (exceptionId, status) => {
        assertPermission(Permissions.EXCEPTION_DISPOSE, 'updateCorrectionStatus');
        const actorId = requireCorrectionActor('updateCorrectionStatus');
        const state = get();
        const current = state.corrections.find((c) => c.exceptionId === exceptionId);
        if (!current) {
          throw new Error(
            `updateCorrectionStatus: no correction request on file for "${exceptionId}"`
          );
        }

        // DEC-035 lifecycle (internal enum retained for persisted compatibility):
        // REQUESTED → APPLIED → REVERIFIED, WITHDRAWN from REQUESTED/APPLIED.
        // Everything else is refused — in
        // particular REVERIFIED before APPLIED ("we checked" before
        // "they fixed it") and any move out of a terminal state. The only
        // way back is an audited re-request, which restarts at REQUESTED.
        const LEGAL: Record<CorrectionStatus, readonly CorrectionStatus[]> = {
          REQUESTED: ['APPLIED', 'WITHDRAWN'],
          APPLIED: ['REVERIFIED', 'WITHDRAWN'],
          REVERIFIED: [],
          WITHDRAWN: [],
        };
        if (!LEGAL[current.status].includes(status)) {
          throw new Error(
            current.status === 'REVERIFIED' || current.status === 'WITHDRAWN'
              ? `updateCorrectionStatus: correction for "${exceptionId}" is ${current.status} (terminal) — re-request to start a new cycle`
              : `updateCorrectionStatus: cannot move correction for "${exceptionId}" from ${current.status} to ${status} — the lifecycle is REQUESTED → APPLIED → REVERIFIED`
          );
        }

        const updated: CorrectionRequest = { ...current, status };
        const auditRecord: CorrectionAuditRecord = {
          ...updated,
          recordedAt: nowISO(),
          recordedBy: actorId,
          previousStatus: current.status,
          sequenceNumber: state.correctionAuditTrail.length + 1,
        };

        set({
          corrections: [...state.corrections.filter((c) => c.exceptionId !== exceptionId), updated],
          correctionAuditTrail: [...state.correctionAuditTrail, auditRecord],
        });

        return updated;
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

      getCorrection: (exceptionId: string) => {
        return (get().corrections ?? []).find((c) => c.exceptionId === exceptionId);
      },

      getCorrectionHistory: (exceptionId: string) => {
        return (get().correctionAuditTrail ?? []).filter((r) => r.exceptionId === exceptionId);
      },

      getCorrections: () => {
        return get().corrections ?? [];
      },

      clearDispositions: () => {
        assertPermission(Permissions.EXCEPTION_CONFIGURE, 'clearDispositions');
        set({ dispositions: [], auditTrail: [] });
      },

      clearCorrections: () => {
        assertPermission(Permissions.EXCEPTION_CONFIGURE, 'clearCorrections');
        set({ corrections: [], correctionAuditTrail: [] });
      },

      reset: () => {
        assertPermission(Permissions.EXCEPTION_CONFIGURE, 'reset');
        set({ dispositions: [], auditTrail: [], corrections: [], correctionAuditTrail: [] });
      },
    }),
    {
      name: 'finplan_exception_dispositions',
      storage: masterStorage,
      // v1 → v2 introduced corrections (FR-010); v2 → v3 adds authenticated
      // event actor/time metadata. Legacy audit rows remain byte-for-byte
      // intact: absent actor/time is unknown and is never fabricated.
      version: 3,
      migrate: (persistedState: unknown) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return { dispositions: [], auditTrail: [], corrections: [], correctionAuditTrail: [] };
        }
        const stateObj = persistedState as Record<string, unknown>;
        const dispositions = Array.isArray(stateObj.dispositions) ? stateObj.dispositions : [];
        const auditTrail = Array.isArray(stateObj.auditTrail) ? stateObj.auditTrail : [];
        const corrections = Array.isArray(stateObj.corrections) ? stateObj.corrections : [];
        const correctionAuditTrail = Array.isArray(stateObj.correctionAuditTrail)
          ? stateObj.correctionAuditTrail
          : [];
        return {
          ...stateObj,
          dispositions,
          auditTrail,
          corrections,
          correctionAuditTrail,
        };
      },
      partialize: (state) => ({
        dispositions: state.dispositions,
        auditTrail: state.auditTrail,
        corrections: state.corrections,
        correctionAuditTrail: state.correctionAuditTrail,
      }),
    }
  )
);
