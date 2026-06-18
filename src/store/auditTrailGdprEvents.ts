// src/store/auditTrailGdprEvents.ts
// Clio (Audit Muse) — Part 141 P0A-17 — F-CLIO-4 (CWE-778 Audit Completeness Gap) P1
// D-007 24th SHL CASCADE — GDPR event consumer bridges Hades T-15 (consentRegistry + rightsWorkflow + breachTimer) → auditTrailStore
// Lane: Sentinel-SecurityAuditor BRUTAL v2.0 P1 fix (one of 3 deferred after commit `6c8653e4` 27th DRIFT — 4 of 7 fixed)
// Date: 2026-06-18 TURN 396+ v0.2 EXECUTION
// PICK CHAIN: Hades T-15 (event emitter) + Mnemosyne T-2 (audit coupling) + Hermes T-FIX-03 (D2+D4 cross-witness) + Sentinel (P1 verification) + Hera T-4 (RBAC) + Demeter T-4.4 (designToken) + Hephaestus T-19 (type narrowing)

import { useAuditTrailStore, type ExtendedAuditEntry } from '@/store/auditTrailStore';
import type { CellAddress } from '@/types/cell';

// ---------------------------------------------------------------------------
// GDPR Event Interface Contract (8 event types per GDPR Art. citations)
// ---------------------------------------------------------------------------

/** Lawful basis for processing under GDPR Art. 6 */
export type LawfulBasis =
  | 'consent' // Art. 6(1)(a)
  | 'contract' // Art. 6(1)(b)
  | 'legal_obligation' // Art. 6(1)(c)
  | 'vital_interest' // Art. 6(1)(d)
  | 'public_task' // Art. 6(1)(e)
  | 'legitimate_interests'; // Art. 6(1)(f)

/** Common fields shared by all GDPR events */
interface GdprEventBase {
  /** Schema version for forward-compatibility */
  schemaVersion: '1.0.0';
  /** ISO 8601 timestamp of event creation */
  emittedAt: string;
  /** Source module (e.g., 'hades-consent-registry', 'hades-rights-workflow', 'hades-breach-timer') */
  source: string;
  /** Correlation ID for grouping related events (e.g., rights.access + subsequent data export) */
  correlationId?: string;
}

/** Event 1: consent.captured (GDPR Art. 7(1)) */
export interface ConsentCapturedEvent extends GdprEventBase {
  type: 'consent.captured';
  consentId: string;
  dataSubjectId: string;
  purpose: string;
  lawfulBasis: LawfulBasis;
  capturedAt: string;
  version: string;
  expiryDate?: string;
}

/** Event 2: consent.withdrawn (GDPR Art. 7(3)) */
export interface ConsentWithdrawnEvent extends GdprEventBase {
  type: 'consent.withdrawn';
  consentId: string;
  dataSubjectId: string;
  withdrawnAt: string;
  reason: 'user_action' | 'expiry' | 'purpose_removed' | 'erasure_request';
  cascadingDeletionsScheduled: number;
}

/** Event 3: rights.access (GDPR Art. 15) */
export interface RightsAccessEvent extends GdprEventBase {
  type: 'rights.access';
  requestId: string;
  dataSubjectId: string;
  requestedAt: string;
  fulfilledAt?: string;
  exportFormat: 'json' | 'csv' | 'pdf';
  dataCategories: string[];
  fulfilledBy?: string;
}

/** Event 4: rights.erasure (GDPR Art. 17) */
export interface RightsErasureEvent extends GdprEventBase {
  type: 'rights.erasure';
  requestId: string;
  dataSubjectId: string;
  requestedAt: string;
  erasureReason:
    | 'no_longer_necessary'
    | 'consent_withdrawn'
    | 'unlawful_processing'
    | 'legal_obligation';
  completedAt?: string;
  recordsDeleted: number;
  recordsRetained: number;
  retentionReason?: string;
}

/** Event 5: rights.portability (GDPR Art. 20) */
export interface RightsPortabilityEvent extends GdprEventBase {
  type: 'rights.portability';
  requestId: string;
  dataSubjectId: string;
  requestedAt: string;
  exportFormat: 'json' | 'csv' | 'xml';
  completedAt?: string;
  exportSizeBytes: number;
  downloadUrl?: string;
}

/** Event 6: rights.rectification (GDPR Art. 16) */
export interface RightsRectificationEvent extends GdprEventBase {
  type: 'rights.rectification';
  requestId: string;
  dataSubjectId: string;
  requestedAt: string;
  fieldChanges: Array<{ field: string; oldValue: string; newValue: string }>;
  completedAt?: string;
  verifiedBy?: string;
}

/** Event 7: rights.object (GDPR Art. 21) */
export interface RightsObjectEvent extends GdprEventBase {
  type: 'rights.object';
  requestId: string;
  dataSubjectId: string;
  requestedAt: string;
  objectToProcessing: 'marketing' | 'profiling' | 'legitimate_interests';
  completedAt?: string;
  processingHalted: boolean;
}

/** Event 8: breach.detected (GDPR Art. 33 — 72h authority notification) */
export interface BreachDetectedEvent extends GdprEventBase {
  type: 'breach.detected';
  breachId: string;
  detectedAt: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedDataSubjects: number;
  dataCategoriesBreached: string[];
  containmentStatus: 'detected' | 'contained' | 'remediated' | 'reported';
  reportedToAuthorityAt?: string;
  reportedToDataSubjectsAt?: string;
  dpoNotifiedAt?: string;
}

/** Discriminated union of all 8 GDPR event types */
export type GdprEvent =
  | ConsentCapturedEvent
  | ConsentWithdrawnEvent
  | RightsAccessEvent
  | RightsErasureEvent
  | RightsPortabilityEvent
  | RightsRectificationEvent
  | RightsObjectEvent
  | BreachDetectedEvent;

// ---------------------------------------------------------------------------
// Event → AuditEntry Mapper (exhaustive switch with `never` type guard)
// ---------------------------------------------------------------------------

/**
 * Convert a synthetic CellAddress for GDPR events. GDPR events are not cell-specific,
 * so we use a stable cellId that groups all GDPR events for a data subject.
 */
const gdprCellId = (eventType: string, dataSubjectId: string): CellAddress =>
  ({
    cube: 'gdpr',
    coords: { sectorId: 'privacy', periodId: eventType },
    measure: 'event',
    sectorId: 'privacy',
    scenarioId: dataSubjectId,
    periodId: eventType,
    lineItemId: 'audit',
  }) as CellAddress;

/**
 * Map a GDPR event to an ExtendedAuditEntry suitable for auditTrailStore.recordWrite/Update/Delete.
 * Exhaustive switch ensures all 8 event types are handled (TS compile error if missing case).
 */
const mapGdprEventToAuditEntry = (event: GdprEvent): ExtendedAuditEntry => {
  const baseEntry = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    cellId: gdprCellId(event.type, 'dataSubjectId' in event ? event.dataSubjectId : 'system'),
    userId: 'dataSubjectId' in event ? event.dataSubjectId : 'system',
    dataType: 'object' as const,
    approvalStatus: 'auto' as const,
    tags: ['gdpr', event.type.split('.')[0]!],
    source: 'gdpr' as const, // F-CLIO-4: 'gdpr' source now flows into audit trail
  };

  switch (event.type) {
    case 'consent.captured':
      return {
        ...baseEntry,
        operation: 'write',
        previousValue: null,
        newValue: {
          consentId: event.consentId,
          purpose: event.purpose,
          lawfulBasis: event.lawfulBasis,
        },
        consentId: event.consentId,
        metadata: {
          capturedAt: event.capturedAt,
          version: event.version,
          expiryDate: event.expiryDate,
          schemaVersion: event.schemaVersion,
          source: event.source,
          correlationId: event.correlationId,
        },
      };
    case 'consent.withdrawn':
      return {
        ...baseEntry,
        operation: 'delete',
        previousValue: { consentId: event.consentId },
        newValue: null,
        consentId: event.consentId,
        metadata: {
          withdrawnAt: event.withdrawnAt,
          reason: event.reason,
          cascadingDeletions: event.cascadingDeletionsScheduled,
          schemaVersion: event.schemaVersion,
          source: event.source,
          correlationId: event.correlationId,
        },
      };
    case 'rights.access':
      return {
        ...baseEntry,
        operation: 'read',
        previousValue: null,
        newValue: {
          requestId: event.requestId,
          exportFormat: event.exportFormat,
          dataCategories: event.dataCategories,
        },
        metadata: {
          requestedAt: event.requestedAt,
          fulfilledAt: event.fulfilledAt,
          fulfilledBy: event.fulfilledBy,
          schemaVersion: event.schemaVersion,
          source: event.source,
          correlationId: event.correlationId,
        },
      };
    case 'rights.erasure':
      return {
        ...baseEntry,
        operation: 'delete',
        previousValue: { requestId: event.requestId, dataSubjectId: event.dataSubjectId },
        newValue: { recordsDeleted: event.recordsDeleted, recordsRetained: event.recordsRetained },
        metadata: {
          requestedAt: event.requestedAt,
          completedAt: event.completedAt,
          reason: event.erasureReason,
          retentionReason: event.retentionReason,
          schemaVersion: event.schemaVersion,
          source: event.source,
          correlationId: event.correlationId,
        },
      };
    case 'rights.portability':
      return {
        ...baseEntry,
        operation: 'read',
        previousValue: null,
        newValue: { exportFormat: event.exportFormat, exportSizeBytes: event.exportSizeBytes },
        metadata: {
          requestedAt: event.requestedAt,
          completedAt: event.completedAt,
          downloadUrl: event.downloadUrl ? '[REDACTED]' : undefined, // CWE-200: never log download URL (contains token)
          schemaVersion: event.schemaVersion,
          source: event.source,
          correlationId: event.correlationId,
        },
      };
    case 'rights.rectification':
      return {
        ...baseEntry,
        operation: 'update',
        previousValue: {
          changes: event.fieldChanges.map((c) => ({ field: c.field, value: c.oldValue })),
        },
        newValue: {
          changes: event.fieldChanges.map((c) => ({ field: c.field, value: c.newValue })),
        },
        metadata: {
          requestedAt: event.requestedAt,
          completedAt: event.completedAt,
          verifiedBy: event.verifiedBy,
          schemaVersion: event.schemaVersion,
          source: event.source,
          correlationId: event.correlationId,
        },
      };
    case 'rights.object':
      return {
        ...baseEntry,
        operation: 'update',
        previousValue: { processing: event.objectToProcessing },
        newValue: { processingHalted: event.processingHalted },
        metadata: {
          requestedAt: event.requestedAt,
          completedAt: event.completedAt,
          schemaVersion: event.schemaVersion,
          source: event.source,
          correlationId: event.correlationId,
        },
      };
    case 'breach.detected':
      return {
        ...baseEntry,
        operation: 'write',
        previousValue: null,
        newValue: {
          breachId: event.breachId,
          severity: event.severity,
          affectedDataSubjects: event.affectedDataSubjects,
        },
        breachEventId: event.breachId,
        metadata: {
          detectedAt: event.detectedAt,
          containmentStatus: event.containmentStatus,
          reportedToAuthorityAt: event.reportedToAuthorityAt, // 72h countdown (Art. 33(1))
          reportedToDataSubjectsAt: event.reportedToDataSubjectsAt, // "without undue delay" (Art. 34(1))
          dpoNotifiedAt: event.dpoNotifiedAt,
          dataCategoriesBreached: event.dataCategoriesBreached,
          schemaVersion: event.schemaVersion,
          source: event.source,
          correlationId: event.correlationId,
        },
      };
    default: {
      // Exhaustiveness check: TS error if any case is missing
      const _exhaustive: never = event;
      throw new Error(`F-CLIO-4: Unknown GDPR event type: ${JSON.stringify(_exhaustive)}`);
    }
  }
};

// ---------------------------------------------------------------------------
// Event Subscription (Dual-Channel: window CustomEvent + globalThis hook)
// ---------------------------------------------------------------------------

/** Module-level idempotency guard */
let gdprSubscriptionInitialized = false;

/**
 * Subscribe to GDPR events emitted by Hades T-15 (consentRegistry + rightsWorkflow + breachTimer).
 *
 * Dual-channel pattern:
 * - Primary: window CustomEvent('gdpr', { detail: event }) — cross-frame compatible, testable
 * - Secondary: globalThis.__gdprEmit(event) — direct function hook for Hades T-15 if exposed
 *
 * Idempotent: subsequent calls are no-ops (returns same cleanup function).
 *
 * @returns Cleanup function that unsubscribes and resets state
 */
export const subscribeToGdprEvents = (): (() => void) => {
  if (gdprSubscriptionInitialized) {
    return () => {}; // Idempotent — return no-op cleanup
  }
  gdprSubscriptionInitialized = true;

  const handleEvent = (event: GdprEvent): void => {
    const entry = mapGdprEventToAuditEntry(event);
    const store = useAuditTrailStore.getState();

    // F-CLIO-4 P1: Convert ExtendedAuditEntry to RecordInput format
    // Use `as any` cast to bypass the narrower RecordInput.source type (matches Hephaestus T-FIX-01 L212-220 pattern)
    // Per cross-witness with Hephaestus T-19 (type narrowing decision pending ETA T+12h 2026-06-19 02:00 UTC)
    const recordInput = {
      cellId: entry.cellId,
      userId: entry.userId,
      operation: entry.operation,
      dataType: entry.dataType,
      previousValue: entry.previousValue,
      newValue: entry.newValue,
      approvalStatus: entry.approvalStatus,
      source: entry.source, // 'gdpr' — cast handled by RecordInput extension
      metadata: entry.metadata,
    } as Parameters<typeof store.recordWrite>[0];

    // Dispatch to the appropriate record action based on operation
    if (entry.operation === 'write' || entry.operation === 'bulk') {
      store.recordWrite(recordInput);
    } else if (entry.operation === 'update') {
      store.recordUpdate(recordInput);
    } else if (entry.operation === 'delete') {
      store.recordDelete(recordInput);
    }
  };

  // Primary channel: window CustomEvent
  const windowHandler = (e: Event): void => {
    const customEvent = e as CustomEvent<GdprEvent>;
    if (
      customEvent.detail &&
      typeof customEvent.detail === 'object' &&
      'type' in customEvent.detail
    ) {
      handleEvent(customEvent.detail);
    }
  };
  window.addEventListener('gdpr', windowHandler);

  // Secondary channel: globalThis hook for Hades T-15 integration
  (globalThis as unknown as { __gdprEmit?: (event: GdprEvent) => void }).__gdprEmit = handleEvent;

  return () => {
    window.removeEventListener('gdpr', windowHandler);
    delete (globalThis as unknown as { __gdprEmit?: (event: GdprEvent) => void }).__gdprEmit;
    gdprSubscriptionInitialized = false;
  };
};

/**
 * Test-only utility: manually emit a GDPR event bypassing the event bus.
 * Used in vitest unit tests for deterministic event injection.
 */
export const __testEmitGdprEvent = (event: GdprEvent): void => {
  const entry = mapGdprEventToAuditEntry(event);
  const store = useAuditTrailStore.getState();
  const recordInput = {
    cellId: entry.cellId,
    userId: entry.userId,
    operation: entry.operation,
    dataType: entry.dataType,
    previousValue: entry.previousValue,
    newValue: entry.newValue,
    approvalStatus: entry.approvalStatus,
    source: entry.source,
    metadata: entry.metadata,
  } as Parameters<typeof store.recordWrite>[0];

  if (entry.operation === 'write' || entry.operation === 'bulk') {
    store.recordWrite(recordInput);
  } else if (entry.operation === 'update') {
    store.recordUpdate(recordInput);
  } else if (entry.operation === 'delete') {
    store.recordDelete(recordInput);
  }
};

/** Test-only utility: reset subscription state (for beforeEach in vitest) */
export const __testResetGdprSubscription = (): void => {
  gdprSubscriptionInitialized = false;
};
