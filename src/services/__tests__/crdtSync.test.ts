/**
 * CRDT Sync Engine — Tests
 */

import { describe, it, expect } from 'vitest';
import {
  incrementClock,
  mergeClocks,
  compareClocks,
  createSyncState,
  recordLocalOperation,
  detectConflicts,
  resolveConflict,
  applyIncomingOperations,
  getSyncSummary,
} from '../crdtSync';

describe('crdtSync', () => {
  describe('vector clock operations', () => {
    it('increments clock for a device', () => {
      const clock = incrementClock({ alice: 5, bob: 3 }, 'alice');
      expect(clock.alice).toBe(6);
      expect(clock.bob).toBe(3);
    });

    it('initializes missing device to 1', () => {
      const clock = incrementClock({}, 'charlie');
      expect(clock.charlie).toBe(1);
    });

    it('merges clocks by taking max', () => {
      const merged = mergeClocks({ alice: 5, bob: 3 }, { alice: 2, bob: 7, charlie: 1 });
      expect(merged.alice).toBe(5);
      expect(merged.bob).toBe(7);
      expect(merged.charlie).toBe(1);
    });

    it('detects before relationship', () => {
      expect(compareClocks({ a: 1 }, { a: 2 })).toBe('before');
    });

    it('detects after relationship', () => {
      expect(compareClocks({ a: 3 }, { a: 1 })).toBe('after');
    });

    it('detects concurrent operations', () => {
      expect(compareClocks({ a: 2, b: 1 }, { a: 1, b: 2 })).toBe('concurrent');
    });

    it('detects equal clocks', () => {
      expect(compareClocks({ a: 5, b: 3 }, { a: 5, b: 3 })).toBe('equal');
    });
  });

  describe('sync state management', () => {
    it('creates initial sync state', () => {
      const state = createSyncState('budgets', 'device-1');
      expect(state.domain).toBe('budgets');
      expect(state.status).toBe('idle');
      expect(state.pendingOps).toHaveLength(0);
    });

    it('records local operations with incremented clock', () => {
      let state = createSyncState('budgets', 'device-1');
      state = recordLocalOperation(state, {
        type: 'set',
        path: 'budgets.bgt-001.name',
        value: 'FY2026',
        deviceId: 'device-1',
        timestamp: new Date().toISOString(),
      }, 'device-1');

      expect(state.pendingOps).toHaveLength(1);
      expect(state.localClock['device-1']).toBe(1);
    });
  });

  describe('conflict detection and resolution', () => {
    it('detects concurrent conflicts', () => {
      const state = createSyncState('budgets', 'device-1');
      const stateWithLocal = recordLocalOperation(state, {
        type: 'set',
        path: 'budgets.bgt-001.amount',
        value: 100,
        deviceId: 'device-1',
        timestamp: '2026-07-27T10:00:00Z',
      }, 'device-1');

      const incoming = [{
        id: 'server-op-1',
        type: 'set' as const,
        path: 'budgets.bgt-001.amount',
        value: 200,
        deviceId: 'device-2',
        timestamp: '2026-07-27T10:00:01Z',
        clock: { 'device-2': 1 },
        acknowledged: true,
      }];

      const { conflicts } = applyIncomingOperations(stateWithLocal, incoming, 'device-1');
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0]!.path).toBe('budgets.bgt-001.amount');
    });

    it('resolves conflict with local-wins strategy', () => {
      const conflict = {
        id: 'conflict-1',
        path: 'test.path',
        localValue: 100,
        remoteValue: 200,
        localOp: {
          id: 'local-1', type: 'set' as const, path: 'test.path', value: 100,
          deviceId: 'd1', timestamp: '2026-07-27T10:00:00Z', clock: { d1: 1 }, acknowledged: false,
        },
        remoteOp: {
          id: 'remote-1', type: 'set' as const, path: 'test.path', value: 200,
          deviceId: 'd2', timestamp: '2026-07-27T10:00:01Z', clock: { d2: 1 }, acknowledged: true,
        },
        suggestedStrategy: 'local-wins' as const,
        isResolved: false,
        resolvedValue: null,
      };

      const resolved = resolveConflict(conflict, 'local-wins');
      expect(resolved.resolvedValue).toBe(100);
    });

    it('resolves conflict with latest-wins strategy', () => {
      const conflict = {
        id: 'conflict-1',
        path: 'test.path',
        localValue: 100,
        remoteValue: 200,
        localOp: {
          id: 'local-1', type: 'set' as const, path: 'test.path', value: 100,
          deviceId: 'd1', timestamp: '2026-07-27T10:00:00Z', clock: { d1: 1 }, acknowledged: false,
        },
        remoteOp: {
          id: 'remote-1', type: 'set' as const, path: 'test.path', value: 200,
          deviceId: 'd2', timestamp: '2026-07-27T10:00:05Z', clock: { d2: 1 }, acknowledged: true,
        },
        suggestedStrategy: 'latest-wins' as const,
        isResolved: false,
        resolvedValue: null,
      };

      const resolved = resolveConflict(conflict, 'latest-wins');
      expect(resolved.resolvedValue).toBe(200); // Remote is later
    });
  });

  describe('getSyncSummary', () => {
    it('returns correct summary', () => {
      const state = createSyncState('budgets', 'device-1');
      const summary = getSyncSummary(state);

      expect(summary.status).toBe('idle');
      expect(summary.pendingCount).toBe(0);
      expect(summary.conflictCount).toBe(0);
    });
  });
});
