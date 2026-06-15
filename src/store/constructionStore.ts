import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';

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
        costBreakdown: [
          { name: 'Labor', budget: 1200000, actual: 1150000 },
          { name: 'Materials', budget: 2400000, actual: 2850000 },
          { name: 'Equipment', budget: 850000, actual: 720000 },
          { name: 'Subcontracts', budget: 3200000, actual: 3100000 },
          { name: 'Overhead', budget: 450000, actual: 480000 },
        ],

        changeOrders: [
          {
            id: 'CO-402',
            project: 'Downtown Plaza',
            description: 'Structural steel reinforcement',
            amount: '+$142k',
            status: 'Approved',
            impact: 'High',
          },
          {
            id: 'CO-405',
            project: 'Skyway Bridge',
            description: 'Foundation soil remediation',
            amount: '+$580k',
            status: 'Pending',
            impact: 'Critical',
          },
          {
            id: 'CO-398',
            project: 'Tech Hub',
            description: 'HVAC specification change',
            amount: '-$12k',
            status: 'Approved',
            impact: 'Low',
          },
          {
            id: 'CO-410',
            project: 'Downtown Plaza',
            description: 'Facade material swap',
            amount: '+$84k',
            status: 'Rejected',
            impact: 'Medium',
          },
        ],

        costLedger: [
          {
            id: '101',
            code: '03-3000',
            category: 'Cast-in-Place Concrete',
            budget: '$1.2M',
            actual: '$1.1M',
            variance: '+8.4%',
            status: 'Under',
          },
          {
            id: '102',
            code: '05-1000',
            category: 'Structural Steel',
            budget: '$2.4M',
            actual: '$2.9M',
            variance: '-18.5%',
            status: 'Over',
          },
          {
            id: '103',
            code: '23-0000',
            category: 'HVAC Systems',
            budget: '$850k',
            actual: '$820k',
            variance: '+3.5%',
            status: 'Under',
          },
          {
            id: '104',
            code: '26-0000',
            category: 'Electrical',
            budget: '$1.5M',
            actual: '$1.6M',
            variance: '-6.2%',
            status: 'Over',
          },
        ],

        setCostBreakdown: (items) =>
          set((state) => {
            state.costBreakdown = items;
          }),

        addChangeOrder: (order) =>
          set((state) => {
            state.changeOrders.push(order);
          }),

        updateChangeOrder: (id, updates) =>
          set((state) => {
            const idx = state.changeOrders.findIndex((o) => o.id === id);
            if (idx !== -1) Object.assign(state.changeOrders[idx]!, updates);
          }),

        setCostLedger: (entries) =>
          set((state) => {
            state.costLedger = entries;
          }),
      })),

      {
        name: 'construction-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);
