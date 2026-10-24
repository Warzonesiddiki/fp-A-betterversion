import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';
import { enforce, Permissions } from '@/utils/rbacEnforcer';

export interface MaintenancePoint {
  month: string;
  planned: number;
  reactive: number;
}

export interface FacilityEntry {
  id: string;
  name: string;
  opex_sqft: string;
  utilities: string;
  cleaning: string;
  maintenance: string;
  efficiency: string;
}

interface RealEstateState {
  maintenanceTrend: MaintenancePoint[];
  facilities: FacilityEntry[];
  setMaintenanceTrend: (data: MaintenancePoint[]) => void;
  setFacilities: (data: FacilityEntry[]) => void;
  addFacility: (facility: FacilityEntry) => void;
  updateFacility: (id: string, updates: Partial<FacilityEntry>) => void;
  removeFacility: (id: string) => void;
}

export const useRealEstateStore = create<RealEstateState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        // Session 028: cleared fabricated seed data. Maintenance trend and
        // facility-level opex are not known without a facilities management
        // system; the page now derives what it can from the GL and discloses
        // the rest. See FacilityManagementPage.tsx for the disclosure.
        maintenanceTrend: [],

        facilities: [],

        setMaintenanceTrend: enforce(Permissions.DASHBOARD_UPDATE, 'setMaintenanceTrend', (data) =>
          set((state) => {
            state.maintenanceTrend = data;
          })
        ),

        setFacilities: enforce(Permissions.ENTITY_UPDATE, 'setFacilities', (data) =>
          set((state) => {
            state.facilities = data;
          })
        ),

        addFacility: enforce(Permissions.ENTITY_CREATE, 'addFacility', (facility) =>
          set((state) => {
            state.facilities.push(facility);
          })
        ),

        updateFacility: enforce(Permissions.ENTITY_UPDATE, 'updateFacility', (id, updates) =>
          set((state) => {
            const idx = state.facilities.findIndex((f) => f.id === id);
            if (idx !== -1) Object.assign(state.facilities[idx]!, updates);
          })
        ),

        removeFacility: enforce(Permissions.ENTITY_DELETE, 'removeFacility', (id) =>
          set((state) => {
            state.facilities = state.facilities.filter((f) => f.id !== id);
          })
        ),
      })),

      {
        name: 'realestate-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);
