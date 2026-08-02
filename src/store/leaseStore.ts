/**
 * leaseStore — Lease portfolio persistence (GAP-NEW-A).
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

/** Seed portfolio (kept so existing dashboard tests that assert engine-computed
 * liability on the real PV path continue to pass). Users can clear/edit it. */
const SEED_LEASES: LeaseInput[] = [
  {
    id: 'L001',
    property: 'HQ Office - Floor 12',
    type: 'Finance',
    payment: 45000,
    commencementDate: '2026-01-01',
    leaseTerm: 48,
    discountRate: 0.06,
  },
  {
    id: 'L002',
    property: 'Warehouse - East',
    type: 'Operating',
    payment: 28000,
    commencementDate: '2026-01-01',
    leaseTerm: 36,
    discountRate: 0.05,
  },
  {
    id: 'L003',
    property: 'Data Center - North',
    type: 'Finance',
    payment: 62000,
    commencementDate: '2026-01-01',
    leaseTerm: 60,
    discountRate: 0.06,
  },
  {
    id: 'L004',
    property: 'Retail - Downtown',
    type: 'Operating',
    payment: 18000,
    commencementDate: '2026-01-01',
    leaseTerm: 24,
    discountRate: 0.05,
  },
  {
    id: 'L005',
    property: 'Office - West Wing',
    type: 'Finance',
    payment: 35000,
    commencementDate: '2024-01-01',
    leaseTerm: 24,
    discountRate: 0.06,
  },
  {
    id: 'L006',
    property: 'Lab Space - South',
    type: 'Operating',
    payment: 52000,
    commencementDate: '2025-07-01',
    leaseTerm: 12,
    discountRate: 0.05,
  },
];

export const useLeaseStore = create<LeaseState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        leases: SEED_LEASES,

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
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);
