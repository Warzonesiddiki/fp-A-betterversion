import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

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
    immer((set) => ({
      maintenanceTrend: [
        { month: 'Jan', planned: 120000, reactive: 45000 },
        { month: 'Feb', planned: 125000, reactive: 38000 },
        { month: 'Mar', planned: 110000, reactive: 62000 },
        { month: 'Apr', planned: 130000, reactive: 25000 },
        { month: 'May', planned: 120000, reactive: 18000 },
        { month: 'Jun', planned: 125000, reactive: 22000 },
      ],

      facilities: [
        {
          id: 'F-101',
          name: 'Skyline Tower',
          opex_sqft: '$8.42',
          utilities: '$42k',
          cleaning: '$18k',
          maintenance: '$24k',
          efficiency: 'A',
        },
        {
          id: 'F-105',
          name: 'Green Gardens',
          opex_sqft: '$5.15',
          utilities: '$12k',
          cleaning: '$8k',
          maintenance: '$15k',
          efficiency: 'B+',
        },
        {
          id: 'F-112',
          name: 'Harbor Logistics',
          opex_sqft: '$3.20',
          utilities: '$85k',
          cleaning: '$5k',
          maintenance: '$32k',
          efficiency: 'A-',
        },
        {
          id: 'F-108',
          name: 'Metro Plaza',
          opex_sqft: '$12.40',
          utilities: '$64k',
          cleaning: '$32k',
          maintenance: '$45k',
          efficiency: 'C',
        },
        {
          id: 'F-115',
          name: 'Westside Med',
          opex_sqft: '$15.80',
          utilities: '$92k',
          cleaning: '$45k',
          maintenance: '$58k',
          efficiency: 'A',
        },
      ],

      setMaintenanceTrend: (data) =>
        set((state) => {
          state.maintenanceTrend = data;
        }),

      setFacilities: (data) =>
        set((state) => {
          state.facilities = data;
        }),

      addFacility: (facility) =>
        set((state) => {
          state.facilities.push(facility);
        }),

      updateFacility: (id, updates) =>
        set((state) => {
          const idx = state.facilities.findIndex((f) => f.id === id);
          if (idx !== -1) Object.assign(state.facilities[idx], updates);
        }),

      removeFacility: (id) =>
        set((state) => {
          state.facilities = state.facilities.filter((f) => f.id !== id);
        }),
    }))
  )
);
