import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';
import { enforce, Permissions } from '@/utils/rbacEnforcer';

export interface RenewableAsset {
  id: string;
  name: string;
  type: 'Solar' | 'Wind' | 'Hydro' | 'Storage';
  capacity: string;
  outputYTD: string;
  availability: string;
  roi: string;
}

export interface GenerationPoint {
  date: string;
  solar: number;
  wind: number;
  hydro: number;
  total: number;
}

export interface CapacitySlice {
  name: string;
  value: number;
  color: string;
}

interface EnergyState {
  assets: RenewableAsset[];
  generationTrend: GenerationPoint[];
  capacityMix: CapacitySlice[];
  setAssets: (assets: RenewableAsset[]) => void;
  addAsset: (asset: RenewableAsset) => void;
  removeAsset: (id: string) => void;
  setGenerationTrend: (data: GenerationPoint[]) => void;
  setCapacityMix: (data: CapacitySlice[]) => void;
}

export const useEnergyStore = create<EnergyState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        assets: [
          {
            id: 'S-01',
            name: 'Mojave Solar I',
            type: 'Solar',
            capacity: '250 MW',
            outputYTD: '42.5 GWh',
            availability: '98.5%',
            roi: '12.4%',
          },
          {
            id: 'W-05',
            name: 'North Sea Wind',
            type: 'Wind',
            capacity: '400 MW',
            outputYTD: '85.2 GWh',
            availability: '92.1%',
            roi: '10.8%',
          },
          {
            id: 'H-02',
            name: 'Blue River Hydro',
            type: 'Hydro',
            capacity: '120 MW',
            outputYTD: '28.4 GWh',
            availability: '96.8%',
            roi: '15.2%',
          },
          {
            id: 'S-02',
            name: 'Arizona Array',
            type: 'Solar',
            capacity: '150 MW',
            outputYTD: '31.1 GWh',
            availability: '97.2%',
            roi: '11.5%',
          },
          {
            id: 'B-01',
            name: 'Tesla Megapack Hub',
            type: 'Storage',
            capacity: '100 MW',
            outputYTD: 'N/A',
            availability: '99.9%',
            roi: '8.4%',
          },
        ],

        generationTrend: [
          { date: '2026-01-01', solar: 450, wind: 320, hydro: 180, total: 950 },
          { date: '2026-01-05', solar: 480, wind: 290, hydro: 175, total: 945 },
          { date: '2026-01-10', solar: 520, wind: 410, hydro: 190, total: 1120 },
          { date: '2026-01-15', solar: 410, wind: 550, hydro: 210, total: 1170 },
          { date: '2026-01-20', solar: 550, wind: 380, hydro: 205, total: 1135 },
          { date: '2026-01-25', solar: 590, wind: 310, hydro: 195, total: 1095 },
          { date: '2026-01-31', solar: 540, wind: 350, hydro: 200, total: 1090 },
        ],

        capacityMix: [
          { name: 'Solar', value: 1200, color: '#f59e0b' },
          { name: 'Onshore Wind', value: 850, color: '#10b981' },
          { name: 'Offshore Wind', value: 450, color: '#059669' },
          { name: 'Small Hydro', value: 280, color: '#3b82f6' },
          { name: 'Battery Storage', value: 500, color: '#8b5cf6' },
        ],

        setAssets: enforce(Permissions.ENTITY_UPDATE, 'setAssets', (assets) =>
          set((state) => {
            state.assets = assets;
          })),

        addAsset: enforce(Permissions.ENTITY_CREATE, 'addAsset', (asset) =>
          set((state) => {
            state.assets.push(asset);
          })),

        removeAsset: enforce(Permissions.ENTITY_DELETE, 'removeAsset', (id) =>
          set((state) => {
            state.assets = state.assets.filter((a) => a.id !== id);
          })),

        setGenerationTrend: enforce(Permissions.DASHBOARD_UPDATE, 'setGenerationTrend', (data) =>
          set((state) => {
            state.generationTrend = data;
          })),

        setCapacityMix: enforce(Permissions.DASHBOARD_UPDATE, 'setCapacityMix', (data) =>
          set((state) => {
            state.capacityMix = data;
          })),
      })),

      {
        name: 'energy-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);
