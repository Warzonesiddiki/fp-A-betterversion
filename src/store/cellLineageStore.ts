/**
 * Cell Lineage Store — Immutable Provenance Tracking
 *
 * Every cell value change is recorded as an immutable entry in a hash chain.
 * Enables "rewind to any point in time" and complete audit trails.
 *
 * DIFFERS FROM auditTrailStore: That store tracks GDPR/SOX compliance events.
 * This store tracks the COMPLETE VALUE HISTORY of every cell.
 *
 * @module cellLineageStore
 */

import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';
import type {
  CellLineageEntry,
  CellLineageChain,
  CellValueSnapshot,
  CellLineageActor,
  CellLineageReason,
  DataOrigin,
  CellLineageState,
} from '@/types/cell-lineage';

// ─── Hash Utility ──────────────────────────────────────────────────────────

async function hashEntry(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Store ─────────────────────────────────────────────────────────────────

interface CellLineageActions {
  /** Record a new lineage entry for a cell */
  recordChange: (
    cellId: string,
    oldValue: CellValueSnapshot,
    newValue: CellValueSnapshot,
    actor: CellLineageActor,
    reason: CellLineageReason,
    dataOrigin: DataOrigin,
    engineVersion?: string
  ) => Promise<string>;
  /** Get the complete lineage chain for a cell */
  getChain: (cellId: string) => CellLineageChain | null;
  /** Get the current value of a cell */
  getCurrentValue: (cellId: string) => CellValueSnapshot | null;
  /** Get the value of a cell at a specific point in time */
  getValueAtTime: (cellId: string, timestamp: string) => CellValueSnapshot | null;
  /** Rewind a cell to a previous value */
  rewindTo: (cellId: string, entryId: string) => CellValueSnapshot | null;
  /** Verify the integrity of all hash chains */
  verifyIntegrity: () => Promise<boolean>;
  /** Get entries matching a query */
  queryEntries: (cellIds: readonly string[]) => readonly CellLineageEntry[];
}

type CellLineageStoreState = CellLineageState & CellLineageActions;

export const useCellLineageStore = create<CellLineageStoreState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        chains: new Map<string, CellLineageChain>(),
        pendingEntries: [],
        integrityVerified: false,
        lastIntegrityCheck: null,

        recordChange: async (
          cellId,
          oldValue,
          newValue,
          actor,
          reason,
          dataOrigin,
          engineVersion
        ) => {
          const state = get();
          const chain = state.chains.get(cellId);
          const previousHash =
            chain?.entries[chain.entries.length - 1]?.entryHash ?? '0'.repeat(64);

          const entryId = `lin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const timestamp = new Date().toISOString();

          const entryData = JSON.stringify({
            id: entryId,
            cellId,
            oldValue,
            newValue,
            actor,
            timestamp,
            reason,
            dataOrigin,
            engineVersion: engineVersion ?? null,
            previousHash,
          });

          const entryHash = await hashEntry(entryData);

          const entry: CellLineageEntry = {
            id: entryId,
            cellId,
            oldValue,
            newValue,
            actor,
            timestamp,
            reason,
            engineVersion: engineVersion ?? null,
            dataOrigin,
            previousHash,
            entryHash,
            metadata: {},
          };

          set((state) => {
            const existing = state.chains.get(cellId);
            if (existing) {
              (existing.entries as CellLineageEntry[]).push(entry as CellLineageEntry);
              (existing as { currentValue: CellValueSnapshot }).currentValue = newValue;
              existing.changeCount++;
            } else {
              state.chains.set(cellId, {
                cellId,
                entries: [entry as CellLineageEntry],
                currentValue: newValue as unknown as CellValueSnapshot,
                createdAt: timestamp,
                changeCount: 1,
                uniqueActors: 1,
                integrityValid: true,
              } as unknown as Parameters<typeof state.chains.set>[1]);
            }
            (state.pendingEntries as CellLineageEntry[]).push(entry as CellLineageEntry);
          });

          return entryId;
        },

        getChain: (cellId) => {
          return get().chains.get(cellId) ?? null;
        },

        getCurrentValue: (cellId) => {
          return get().chains.get(cellId)?.currentValue ?? null;
        },

        getValueAtTime: (cellId, timestamp) => {
          const chain = get().chains.get(cellId);
          if (!chain) return null;

          const targetTime = new Date(timestamp).getTime();
          let best: CellValueSnapshot | null = null;

          for (const entry of chain.entries) {
            if (new Date(entry.timestamp).getTime() <= targetTime) {
              best = entry.newValue;
            }
          }

          return best;
        },

        rewindTo: (cellId, entryId) => {
          const chain = get().chains.get(cellId);
          if (!chain) return null;

          const entry = chain.entries.find((e) => e.id === entryId);
          if (!entry) return null;

          return entry.newValue;
        },

        verifyIntegrity: async () => {
          const state = get();
          let allValid = true;

          for (const [, chain] of state.chains) {
            let previousHash = '0'.repeat(64);

            for (const entry of chain.entries) {
              if (entry.previousHash !== previousHash) {
                allValid = false;
                break;
              }
              previousHash = entry.entryHash;
            }

            if (!allValid) break;
          }

          set((state) => {
            state.integrityVerified = allValid;
            state.lastIntegrityCheck = new Date().toISOString();
          });

          return allValid;
        },

        queryEntries: (cellIds) => {
          const state = get();
          const results: CellLineageEntry[] = [];

          for (const cellId of cellIds) {
            const chain = state.chains.get(cellId);
            if (chain) {
              results.push(...chain.entries);
            }
          }

          return results.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        },
      })),
      {
        name: 'cell-lineage-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);

// ─── Selectors ─────────────────────────────────────────────────────────────

export const cellLineageSelectors = {
  chainCount: (state: CellLineageStoreState) => state.chains.size,
  totalEntries: (state: CellLineageStoreState) => {
    let total = 0;
    for (const chain of state.chains.values()) {
      total += chain.entries.length;
    }
    return total;
  },
  integrityStatus: (state: CellLineageStoreState) => ({
    verified: state.integrityVerified,
    lastCheck: state.lastIntegrityCheck,
  }),
};
