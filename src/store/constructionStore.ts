import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';
import { enforce, Permissions } from '@/utils/rbacEnforcer';

export interface CostBreakdownItem {
  name: string;
  budget: number;
  actual: number;
}

export interface ChangeOrder {
  id: string;
  project: string;
  description: string;
  amount: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  impact: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface CostLedgerEntry {
  id: string;
  code: string;
  category: string;
  budget: string;
  actual: string;
  variance: string;
  status: 'Under' | 'Over';
}

interface ConstructionState {
  costBreakdown: CostBreakdownItem[];
  changeOrders: ChangeOrder[];
  costLedger: CostLedgerEntry[];
  setCostBreakdown: (items: CostBreakdownItem[]) => void;
  addChangeOrder: (order: ChangeOrder) => void;
  updateChangeOrder: (id: string, updates: Partial<ChangeOrder>) => void;
  setCostLedger: (entries: CostLedgerEntry[]) => void;
}

export const useConstructionStore = create<ConstructionState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        // Empty until the user posts a ledger or records a change order.
        // Persisted v1 seeded Downtown Plaza / CSI quotes; migrate drops them.
        costBreakdown: [],
        changeOrders: [],
        costLedger: [],

        setCostBreakdown: enforce(Permissions.BUDGET_UPDATE, 'setCostBreakdown', (items) =>
          set((state) => {
            state.costBreakdown = items;
          })
        ),

        addChangeOrder: enforce(Permissions.BUDGET_CREATE, 'addChangeOrder', (order) =>
          set((state) => {
            state.changeOrders.push(order);
          })
        ),

        updateChangeOrder: enforce(Permissions.BUDGET_UPDATE, 'updateChangeOrder', (id, updates) =>
          set((state) => {
            const idx = state.changeOrders.findIndex((o) => o.id === id);
            if (idx !== -1) Object.assign(state.changeOrders[idx]!, updates);
          })
        ),

        setCostLedger: enforce(Permissions.ENTITY_UPDATE, 'setCostLedger', (entries) =>
          set((state) => {
            state.costLedger = entries;
          })
        ),
      })),

      {
        name: 'construction-store',
        storage: masterStorage,
        version: 2,
        migrate: (state: unknown, version: number) => {
          if (version < 2) {
            return { costBreakdown: [], changeOrders: [], costLedger: [] };
          }
          return state;
        },
      }
    )
  )
);
