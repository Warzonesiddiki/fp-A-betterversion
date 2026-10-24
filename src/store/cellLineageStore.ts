/**
 * Cell Lineage Store — client-local lineage prototype
 *
 * The store appends cell-value snapshots and can reconstruct a per-cell
 * sequence. It has no production caller today and is not the product audit
 * authority. Its unkeyed hashes detect inconsistent payload/link changes but
 * are not tamper-proof against a complete rewrite and have no external anchor.
 *
 * @module cellLineageStore
 */

import { enableMapSet } from 'immer';
import { randomId } from '@/utils/cryptoId';
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

type CellLineageHashInput = Pick<
  CellLineageEntry,
  | 'id'
  | 'cellId'
  | 'oldValue'
  | 'newValue'
  | 'actor'
  | 'timestamp'
  | 'reason'
  | 'dataOrigin'
  | 'engineVersion'
  | 'previousHash'
>;

/** Keep field order identical to the v1 hash contract; metadata is non-authoritative. */
function serializeHashInput(entry: CellLineageHashInput): string {
  return JSON.stringify({
    id: entry.id,
    cellId: entry.cellId,
    oldValue: entry.oldValue,
    newValue: entry.newValue,
    actor: entry.actor,
    timestamp: entry.timestamp,
    reason: entry.reason,
    dataOrigin: entry.dataOrigin,
    engineVersion: entry.engineVersion ?? null,
    previousHash: entry.previousHash,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function valuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (typeof left !== 'object' || left === null || typeof right !== 'object' || right === null) {
    return false;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => valuesEqual(value, right[index]))
    );
  }

  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key, index) =>
        key === rightKeys[index] &&
        valuesEqual((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key])
    )
  );
}

function rebuildChainsFromEntries(
  entries: readonly CellLineageEntry[]
): Map<string, CellLineageChain> {
  const grouped = new Map<string, CellLineageEntry[]>();
  for (const entry of entries) {
    const cellEntries = grouped.get(entry.cellId) ?? [];
    cellEntries.push(entry);
    grouped.set(entry.cellId, cellEntries);
  }

  return new Map(
    Array.from(grouped, ([cellId, cellEntries]) => {
      const first = cellEntries[0]!;
      const last = cellEntries[cellEntries.length - 1]!;
      const actorIds = new Set(
        cellEntries.map((entry) =>
          [entry.actor.actorType, entry.actor.userId, entry.actor.engineId].join('|')
        )
      );
      return [
        cellId,
        {
          cellId,
          entries: cellEntries,
          currentValue: last.newValue,
          createdAt: first.timestamp,
          changeCount: cellEntries.length,
          uniqueActors: actorIds.size,
          integrityValid: false,
        },
      ];
    })
  );
}

function restoreChains(chains: unknown, pendingEntries: unknown): Map<string, CellLineageChain> {
  const markUnverified = (source: Map<string, CellLineageChain>) =>
    new Map(Array.from(source, ([cellId, chain]) => [cellId, { ...chain, integrityValid: false }]));

  if (chains instanceof Map) return markUnverified(chains);

  let restored: Map<string, CellLineageChain>;
  if (Array.isArray(chains)) {
    restored = new Map(chains as [string, CellLineageChain][]);
  } else if (isRecord(chains)) {
    restored = new Map(Object.entries(chains) as [string, CellLineageChain][]);
  } else {
    restored = new Map();
  }

  // v1 wrote a Map through JSON.stringify, which stored `{}`. Its append-ordered
  // pendingEntries array is the only surviving copy; rebuild chains from it.
  if (restored.size === 0 && Array.isArray(pendingEntries) && pendingEntries.length > 0) {
    return rebuildChainsFromEntries(pendingEntries as CellLineageEntry[]);
  }
  return markUnverified(restored);
}

// ─── Store ─────────────────────────────────────────────────────────────────

// W6-P0-14: recordChange appends a local lineage entry — permission-guarded
// with audit:create. rewindTo/verifyIntegrity/queryEntries/getChain/
// getCurrentValue/getValueAtTime are reads or derived status and stay unguarded.
import { enforce, Permissions } from '@/utils/rbacEnforcer';
import { nowISO } from '@/utils/clock';

// The store updates Map-backed chains through Immer drafts.
enableMapSet();

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

        recordChange: enforce(
          Permissions.AUDIT_CREATE,
          'recordChange',
          async (cellId, oldValue, newValue, actor, reason, dataOrigin, engineVersion) => {
            const state = get();
            const chain = state.chains.get(cellId);
            const previousHash =
              chain?.entries[chain.entries.length - 1]?.entryHash ?? '0'.repeat(64);

            const entryId = randomId('lin');
            const timestamp = nowISO();

            const entryHash = await hashEntry(
              serializeHashInput({
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
              })
            );

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

            const currentState = get();
            const chains = new Map(currentState.chains);
            const existing = chains.get(cellId);
            if (existing) {
              chains.set(cellId, {
                ...existing,
                entries: [...existing.entries, entry],
                currentValue: newValue,
                changeCount: existing.changeCount + 1,
                integrityValid: false,
              });
            } else {
              chains.set(cellId, {
                cellId,
                entries: [entry],
                currentValue: newValue,
                createdAt: timestamp,
                changeCount: 1,
                uniqueActors: 1,
                integrityValid: false,
              });
            }
            set({ chains, pendingEntries: [...currentState.pendingEntries, entry] });

            return entryId;
          }
        ),

        getChain: (cellId) => {
          return get().chains.get(cellId) ?? null;
        },

        getCurrentValue: (cellId) => {
          const chain = get().chains.get(cellId);
          return chain?.entries.at(-1)?.newValue ?? null;
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
          const pendingEntryById = new Map<string, unknown>();
          let pendingEntriesValid = Array.isArray(state.pendingEntries);
          if (pendingEntriesValid) {
            for (const entry of state.pendingEntries) {
              if (
                !isRecord(entry) ||
                typeof entry.id !== 'string' ||
                pendingEntryById.has(entry.id)
              ) {
                pendingEntriesValid = false;
                continue;
              }
              pendingEntryById.set(entry.id, entry);
            }
          }

          let allValid = pendingEntriesValid;
          const chainEntryIds = new Set<string>();
          const chainValidity = new Map<string, boolean>();

          for (const [cellId, chain] of state.chains) {
            let chainValid = chain.cellId === cellId && chain.entries.length > 0;
            let previousHash = '0'.repeat(64);

            for (const entry of chain.entries) {
              const pendingEntry = pendingEntryById.get(entry.id);
              if (
                typeof entry.id !== 'string' ||
                chainEntryIds.has(entry.id) ||
                !pendingEntry ||
                !valuesEqual(pendingEntry, entry)
              ) {
                chainValid = false;
              }
              chainEntryIds.add(entry.id);

              const expectedHash = await hashEntry(serializeHashInput(entry));
              if (
                entry.cellId !== cellId ||
                entry.previousHash !== previousHash ||
                entry.entryHash !== expectedHash
              ) {
                chainValid = false;
                break;
              }
              previousHash = entry.entryHash;
            }

            const firstEntry = chain.entries[0];
            const lastEntry = chain.entries.at(-1);
            const uniqueActors = new Set(
              chain.entries.map((entry) =>
                [entry.actor.actorType, entry.actor.userId, entry.actor.engineId].join('|')
              )
            );
            if (
              !firstEntry ||
              !lastEntry ||
              chain.createdAt !== firstEntry.timestamp ||
              chain.changeCount !== chain.entries.length ||
              chain.uniqueActors !== uniqueActors.size ||
              !valuesEqual(chain.currentValue, lastEntry.newValue)
            ) {
              chainValid = false;
            }

            chainValidity.set(cellId, chainValid);
            if (!chainValid) allValid = false;
          }

          if (pendingEntryById.size !== chainEntryIds.size) allValid = false;

          set((state) => {
            for (const [cellId, chain] of state.chains) {
              state.chains.set(cellId, {
                ...chain,
                integrityValid: chainValidity.get(cellId) ?? false,
              });
            }
            state.integrityVerified = allValid;
            state.lastIntegrityCheck = nowISO();
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
        version: 2,
        partialize: (state) =>
          ({
            chains: Object.fromEntries(state.chains),
            pendingEntries: state.pendingEntries,
            integrityVerified: state.integrityVerified,
            lastIntegrityCheck: state.lastIntegrityCheck,
          }) as unknown as CellLineageStoreState,
        migrate: (persistedState: unknown) => {
          const persisted = isRecord(persistedState) ? persistedState : {};
          const chains = restoreChains(persisted.chains, persisted.pendingEntries);
          return {
            ...persisted,
            chains: Object.fromEntries(chains),
            integrityVerified: false,
            lastIntegrityCheck: null,
          } as unknown as CellLineageStoreState;
        },
        merge: (persistedState, currentState) => {
          const persisted = isRecord(persistedState) ? persistedState : {};
          return {
            ...currentState,
            ...persisted,
            chains: restoreChains(persisted.chains, persisted.pendingEntries),
            integrityVerified: false,
            lastIntegrityCheck: null,
          } as CellLineageStoreState;
        },
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
