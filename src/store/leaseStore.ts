/**
 * leaseStore â€” Lease portfolio persistence (GAP-NEW-A).
 *
 * Provides a typed, persisted store for lease inputs. The LeaseDashboard and
 * LeaseDetailPage read from this store (via useLeaseStore) instead of a
 * hardcoded module-level array, so the portfolio is real user data with a
 * reachable empty state.
 *
 * Conventions follow constructionStore.ts: zustand + subscribeWithSelector +
 * persist(immer) + masterStorage + enforce() RBAC on every mutator.
 */
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';
import { enforce, Permissions } from '@/utils/rbacEnforcer';

export type LeaseType = 'Operating' | 'Finance';

export interface LeaseInput {
  id: string;
  property: string;
  type: LeaseType;
  payment: number;
  commencementDate: string;
  leaseTerm: number;
  discountRate: number;
}

interface LeaseState {
  leases: LeaseInput[];
  addLease: (lease: LeaseInput) => void;
  updateLease: (id: string, updates: Partial<LeaseInput>) => void;
  removeLease: (id: string) => void;
  setLeases: (leases: LeaseInput[]) => void;
}

export const useLeaseStore = create<LeaseState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        // K17: no invented leases ship as persisted defaults.
        leases: [],

        addLease: enforce(Permissions.BUDGET_CREATE, 'addLease', (lease: LeaseInput) =>
          set((state) => {
            state.leases.push(lease);
          })
        ),

        updateLease: enforce(Permissions.BUDGET_UPDATE, 'updateLease', (id, updates) =>
          set((state) => {
            const idx = state.leases.findIndex((l) => l.id === id);
            if (idx !== -1) Object.assign(state.leases[idx]!, updates);
          })
        ),

        removeLease: enforce(Permissions.BUDGET_DELETE, 'removeLease', (id: string) =>
          set((state) => {
            state.leases = state.leases.filter((l) => l.id !== id);
          })
        ),

        setLeases: enforce(Permissions.ENTITY_UPDATE, 'setLeases', (leases: LeaseInput[]) =>
          set((state) => {
            state.leases = leases;
          })
        ),
      })),
      {
        name: 'lease-store',
        storage: masterStorage,
        // v2 (K17): drop the retired six-lease seed portfolio from any
        // persisted v1 state; user-entered leases are preserved.
        version: 2,
        migrate: (state) => {
          const s = state as { leases?: Array<Record<string, unknown>> };
          const seeded = new Set(['L001', 'L002', 'L003', 'L004', 'L005', 'L006']);
          return {
            ...s,
            leases: Array.isArray(s.leases)
              ? s.leases.filter((l) => !seeded.has(String(l.id)))
              : [],
          };
        },
      }
    )
  )
);
