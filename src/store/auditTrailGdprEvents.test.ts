// src/store/auditTrailGdprEvents.test.ts
// Clio (Audit Muse) — Part 141 P0A-17 — F-CLIO-4 (CWE-778 Audit Completeness Gap) P1
// D-007 25th SHL CASCADE — GDPR event consumer unit tests
// Test coverage: 8 GDPR event types + idempotent subscription + filterByGdprAccess integration
// Date: 2026-06-18 TURN 396+ v0.2 EXECUTION

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAuditTrailStore } from './auditTrailStore';
import {
  subscribeToGdprEvents,
  __testEmitGdprEvent,
  __testResetGdprSubscription,
  type GdprEvent,
} from './auditTrailGdprEvents';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const baseEvent = {
  schemaVersion: '1.0.0' as const,
  emittedAt: '2026-06-18T12:00:00.000Z',
  source: 'hades-test',
  correlationId: 'test-corr-001',
};

const makeConsentCaptured = (): GdprEvent => ({
  ...baseEvent,
  type: 'consent.captured',
  consentId: 'consent-001',
  dataSubjectId: 'user-001',
  purpose: 'analytics',
  lawfulBasis: 'consent',
  capturedAt: '2026-06-18T12:00:00.000Z',
  version: 'v1.0',
});

const makeConsentWithdrawn = (): GdprEvent => ({
  ...baseEvent,
  type: 'consent.withdrawn',
  consentId: 'consent-001',
  dataSubjectId: 'user-001',
  withdrawnAt: '2026-06-18T13:00:00.000Z',
  reason: 'user_action',
  cascadingDeletionsScheduled: 42,
});

const makeRightsAccess = (): GdprEvent => ({
  ...baseEvent,
  type: 'rights.access',
  requestId: 'req-001',
  dataSubjectId: 'user-001',
  requestedAt: '2026-06-18T14:00:00.000Z',
  exportFormat: 'json',
  dataCategories: ['profile', 'transactions'],
});

const makeRightsErasure = (): GdprEvent => ({
  ...baseEvent,
  type: 'rights.erasure',
  requestId: 'req-002',
  dataSubjectId: 'user-001',
  requestedAt: '2026-06-18T15:00:00.000Z',
  erasureReason: 'consent_withdrawn',
  recordsDeleted: 17,
  recordsRetained: 0,
});

const makeRightsPortability = (): GdprEvent => ({
  ...baseEvent,
  type: 'rights.portability',
  requestId: 'req-003',
  dataSubjectId: 'user-001',
  requestedAt: '2026-06-18T16:00:00.000Z',
  exportFormat: 'json',
  exportSizeBytes: 4096,
});

const makeRightsRectification = (): GdprEvent => ({
  ...baseEvent,
  type: 'rights.rectification',
  requestId: 'req-004',
  dataSubjectId: 'user-001',
  requestedAt: '2026-06-18T17:00:00.000Z',
  fieldChanges: [
    { field: 'email', oldValue: 'old@example.com', newValue: 'new@example.com' },
    { field: 'phone', oldValue: '+1-555-0100', newValue: '+1-555-0200' },
  ],
});

const makeRightsObject = (): GdprEvent => ({
  ...baseEvent,
  type: 'rights.object',
  requestId: 'req-005',
  dataSubjectId: 'user-001',
  requestedAt: '2026-06-18T18:00:00.000Z',
  objectToProcessing: 'marketing',
  processingHalted: true,
});

const makeBreachDetected = (): GdprEvent => ({
  ...baseEvent,
  type: 'breach.detected',
  breachId: 'breach-001',
  detectedAt: '2026-06-18T19:00:00.000Z',
  severity: 'critical',
  affectedDataSubjects: 5000,
  dataCategoriesBreached: ['profile', 'credentials'],
  containmentStatus: 'contained',
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('auditTrailGdprEvents — F-CLIO-4 (CWE-778 Audit Completeness Gap) P1', () => {
  beforeEach(() => {
    // Reset audit store state before each test
    useAuditTrailStore.setState({
      entries: [],
      filters: {
        source: null,
        operation: null,
        userId: null,
        search: null,
        dateFrom: null,
        dateTo: null,
      },
    });
    // Reset GDPR subscription state
    __testResetGdprSubscription();
  });

  afterEach(() => {
    // Clean up any subscriptions
    vi.restoreAllMocks();
  });

  // --- 8 Event Type Coverage ---

  describe('Event 1: consent.captured (GDPR Art. 7(1))', () => {
    it('records write entry with source: gdpr and consentId', () => {
      const event = makeConsentCaptured();
      __testEmitGdprEvent(event);

      const entries = useAuditTrailStore.getState().entries;
      expect(entries).toHaveLength(1);
      const entry = entries[0]!;
      expect(entry.operation).toBe('write');
      expect(entry.source).toBe('gdpr');
      expect(entry.consentId).toBe('consent-001');
      expect(entry.userId).toBe('user-001');
      expect(entry.newValue).toEqual({
        consentId: 'consent-001',
        purpose: 'analytics',
        lawfulBasis: 'consent',
      });
    });
  });

  describe('Event 2: consent.withdrawn (GDPR Art. 7(3))', () => {
    it('records delete entry with cascadingDeletions count', () => {
      const event = makeConsentWithdrawn();
      __testEmitGdprEvent(event);

      const entries = useAuditTrailStore.getState().entries;
      expect(entries).toHaveLength(1);
      const entry = entries[0]!;
      expect(entry.operation).toBe('delete');
      expect(entry.source).toBe('gdpr');
      expect(entry.consentId).toBe('consent-001');
      expect(entry.metadata?.cascadingDeletions).toBe(42);
    });
  });

  describe('Event 3: rights.access (GDPR Art. 15)', () => {
    it('records read entry with exportFormat and dataCategories', () => {
      const event = makeRightsAccess();
      __testEmitGdprEvent(event);

      const entries = useAuditTrailStore.getState().entries;
      expect(entries).toHaveLength(1);
      const entry = entries[0]!;
      expect(entry.operation).toBe('read');
      expect(entry.source).toBe('gdpr');
      expect(entry.newValue).toEqual({
        requestId: 'req-001',
        exportFormat: 'json',
        dataCategories: ['profile', 'transactions'],
      });
    });
  });

  describe('Event 4: rights.erasure (GDPR Art. 17)', () => {
    it('records delete entry with recordsDeleted count', () => {
      const event = makeRightsErasure();
      __testEmitGdprEvent(event);

      const entries = useAuditTrailStore.getState().entries;
      expect(entries).toHaveLength(1);
      const entry = entries[0]!;
      expect(entry.operation).toBe('delete');
      expect(entry.source).toBe('gdpr');
      expect(entry.newValue).toEqual({ recordsDeleted: 17, recordsRetained: 0 });
      expect(entry.metadata?.reason).toBe('consent_withdrawn');
    });
  });

  describe('Event 5: rights.portability (GDPR Art. 20)', () => {
    it('records read entry with exportSizeBytes and REDACTED downloadUrl', () => {
      const event: GdprEvent = {
        ...makeRightsPortability(),
        downloadUrl: 'https://example.com/secret-token-abc123',
      };
      __testEmitGdprEvent(event);

      const entries = useAuditTrailStore.getState().entries;
      expect(entries).toHaveLength(1);
      const entry = entries[0]!;
      expect(entry.operation).toBe('read');
      expect(entry.source).toBe('gdpr');
      expect(entry.newValue).toEqual({ exportFormat: 'json', exportSizeBytes: 4096 });
      // CWE-200: downloadUrl must never be logged raw (contains auth token)
      expect(entry.metadata?.downloadUrl).toBe('[REDACTED]');
    });
  });

  describe('Event 6: rights.rectification (GDPR Art. 16)', () => {
    it('records update entry with field changes', () => {
      const event = makeRightsRectification();
      __testEmitGdprEvent(event);

      const entries = useAuditTrailStore.getState().entries;
      expect(entries).toHaveLength(1);
      const entry = entries[0]!;
      expect(entry.operation).toBe('update');
      expect(entry.source).toBe('gdpr');
      expect(entry.previousValue).toEqual({
        changes: [
          { field: 'email', value: 'old@example.com' },
          { field: 'phone', value: '+1-555-0100' },
        ],
      });
      expect(entry.newValue).toEqual({
        changes: [
          { field: 'email', value: 'new@example.com' },
          { field: 'phone', value: '+1-555-0200' },
        ],
      });
    });
  });

  describe('Event 7: rights.object (GDPR Art. 21)', () => {
    it('records update entry with processingHalted flag', () => {
      const event = makeRightsObject();
      __testEmitGdprEvent(event);

      const entries = useAuditTrailStore.getState().entries;
      expect(entries).toHaveLength(1);
      const entry = entries[0]!;
      expect(entry.operation).toBe('update');
      expect(entry.source).toBe('gdpr');
      expect(entry.newValue).toEqual({ processingHalted: true });
    });
  });

  describe('Event 8: breach.detected (GDPR Art. 33 — 72h authority notification)', () => {
    it('records write entry with breachEventId and severity', () => {
      const event: GdprEvent = {
        ...makeBreachDetected(),
        reportedToAuthorityAt: '2026-06-20T19:00:00.000Z', // 48h after detection (within 72h)
      };
      __testEmitGdprEvent(event);

      const entries = useAuditTrailStore.getState().entries;
      expect(entries).toHaveLength(1);
      const entry = entries[0]!;
      expect(entry.operation).toBe('write');
      expect(entry.source).toBe('gdpr');
      expect(entry.breachEventId).toBe('breach-001');
      expect(entry.severity).toBe('critical');
      expect(entry.metadata?.reportedToAuthorityAt).toBe('2026-06-20T19:00:00.000Z');
      expect(entry.metadata?.containmentStatus).toBe('contained');
    });
  });

  // --- filterByGdprAccess integration ---

  describe('filterByGdprAccess integration', () => {
    it('returns all 8 GDPR event types when filter is applied', () => {
      const events: GdprEvent[] = [
        makeConsentCaptured(),
        makeConsentWithdrawn(),
        makeRightsAccess(),
        makeRightsErasure(),
        makeRightsPortability(),
        makeRightsRectification(),
        makeRightsObject(),
        makeBreachDetected(),
      ];

      events.forEach((e) => __testEmitGdprEvent(e));

      const allEntries = useAuditTrailStore.getState().entries;
      expect(allEntries).toHaveLength(8);

      const gdprFiltered = useAuditTrailStore.getState().filterByGdprAccess(allEntries);
      expect(gdprFiltered).toHaveLength(8);
      expect(
        gdprFiltered.every(
          (e) => e.source === 'gdpr' || e.consentId !== undefined || e.breachEventId !== undefined
        )
      ).toBe(true);
    });

    it('filters out non-GDPR entries (manual, api, plugin sources)', () => {
      // Add a non-GDPR entry manually
      useAuditTrailStore.getState().recordWrite({
        cellId: { cube: 'test', coords: {}, measure: 'test' } as never,
        userId: 'admin',
        operation: 'write',
        dataType: 'object',
        previousValue: null,
        newValue: { test: 'data' },
        approvalStatus: 'auto',
        source: 'manual',
      });

      __testEmitGdprEvent(makeConsentCaptured());

      const allEntries = useAuditTrailStore.getState().entries;
      expect(allEntries).toHaveLength(2);

      const gdprFiltered = useAuditTrailStore.getState().filterByGdprAccess(allEntries);
      expect(gdprFiltered).toHaveLength(1);
      expect(gdprFiltered[0]!.source).toBe('gdpr');
    });
  });

  // --- Idempotent subscription ---

  describe('Idempotent subscription', () => {
    it('subscribeToGdprEvents() can be called multiple times without double-recording', () => {
      const cleanup1 = subscribeToGdprEvents();
      const cleanup2 = subscribeToGdprEvents();
      const cleanup3 = subscribeToGdprEvents();

      // All three should be the same cleanup function (no-op after first)
      expect(cleanup1).toBeDefined();
      expect(cleanup2).toBeDefined();
      expect(cleanup3).toBeDefined();

      // Emit a window event — should only be recorded ONCE
      const event = makeConsentCaptured();
      window.dispatchEvent(new CustomEvent('gdpr', { detail: event }));

      const entries = useAuditTrailStore.getState().entries;
      expect(entries).toHaveLength(1);

      // Cleanup
      cleanup1();
    });

    it('cleanup function resets subscription state for re-initialization', () => {
      const cleanup1 = subscribeToGdprEvents();
      cleanup1();

      // After cleanup, can subscribe again
      const cleanup2 = subscribeToGdprEvents();
      const event = makeConsentCaptured();
      window.dispatchEvent(new CustomEvent('gdpr', { detail: event }));

      const entries = useAuditTrailStore.getState().entries;
      expect(entries).toHaveLength(1);

      cleanup2();
    });
  });

  // --- Cross-channel event bus ---

  describe('Cross-channel event bus', () => {
    it('window CustomEvent channel records events', () => {
      subscribeToGdprEvents();
      const event = makeConsentCaptured();
      window.dispatchEvent(new CustomEvent('gdpr', { detail: event }));

      expect(useAuditTrailStore.getState().entries).toHaveLength(1);
    });

    it('globalThis.__gdprEmit channel records events', () => {
      subscribeToGdprEvents();
      const gdprEmit = (globalThis as { __gdprEmit?: (e: GdprEvent) => void }).__gdprEmit;
      expect(gdprEmit).toBeDefined();

      const event = makeBreachDetected();
      gdprEmit!(event);

      expect(useAuditTrailStore.getState().entries).toHaveLength(1);
      expect(useAuditTrailStore.getState().entries[0]!.breachEventId).toBe('breach-001');
    });
  });
});
