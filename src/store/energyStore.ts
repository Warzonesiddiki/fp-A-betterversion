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
        // K17: no demo assets/generation/mix shipped as persisted defaults.
        // Empty stores render honest empty states; users record their own.
        assets: [],

        generationTrend: [],

        capacityMix: [],

        setAssets: enforce(Permissions.ENTITY_UPDATE, 'setAssets', (assets) =>
          set((state) => {
            state.assets = assets;
          })
        ),

        addAsset: enforce(Permissions.ENTITY_CREATE, 'addAsset', (asset) =>
          set((state) => {
            state.assets.push(asset);
          })
        ),

        removeAsset: enforce(Permissions.ENTITY_DELETE, 'removeAsset', (id) =>
          set((state) => {
            state.assets = state.assets.filter((a) => a.id !== id);
          })
        ),

        setGenerationTrend: enforce(Permissions.DASHBOARD_UPDATE, 'setGenerationTrend', (data) =>
          set((state) => {
            state.generationTrend = data;
          })
        ),

        setCapacityMix: enforce(Permissions.DASHBOARD_UPDATE, 'setCapacityMix', (data) =>
          set((state) => {
            state.capacityMix = data;
          })
        ),
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
