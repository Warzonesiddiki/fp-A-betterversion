import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';
import { enforce, Permissions } from '@/utils/rbacEnforcer';

export interface CapExProject {
  id: string;
  name: string;
  category: string;
  budget: number;
  actual: number;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  paybackPeriod: number;
  irr: number;
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  cost: number;
  usefulLife: number;
  nbv: number;
  annualDep: number;
  acquisitionDate: string;
}

export interface DepreciationEntry {
  year: number;
  assetId: string;
  assetName: string;
  beginningValue: number;
  depreciation: number;
  endingValue: number;
}

interface CapExState {
  projects: CapExProject[];
  assets: Asset[];
  depreciationSchedule: DepreciationEntry[];
  isLoading: boolean;
  error: string | null;

  setProjects: (projects: CapExProject[]) => void;
  addProject: (project: CapExProject) => void;
  updateProject: (id: string, updates: Partial<CapExProject>) => void;
  removeProject: (id: string) => void;
  setAssets: (assets: Asset[]) => void;
  setDepreciationSchedule: (entries: DepreciationEntry[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAll: () => void;

  getProjectsByStatus: (status: string) => CapExProject[];
  getTotalBudget: () => number;
  getTotalActual: () => number;
  getAssetsByCategory: (category: string) => Asset[];
}

export const useCapExStore = create<CapExState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        projects: [],
        assets: [],
        depreciationSchedule: [],
        isLoading: false,
        error: null,

        setProjects: enforce(Permissions.CAPEX_UPDATE, 'setProjects', (projects) =>
          set((state) => {
            state.projects = projects;
          })
        ),

        addProject: enforce(Permissions.CAPEX_CREATE, 'addProject', (project) =>
          set((state) => {
            state.projects.push(project);
          })
        ),

        updateProject: enforce(Permissions.CAPEX_UPDATE, 'updateProject', (id, updates) =>
          set((state) => {
            const idx = state.projects.findIndex((p) => p.id === id);
            if (idx !== -1) Object.assign(state.projects[idx]!, updates);
          })
        ),

        removeProject: enforce(Permissions.CAPEX_DELETE, 'removeProject', (id) =>
          set((state) => {
            state.projects = state.projects.filter((p) => p.id !== id);
          })
        ),

        setAssets: enforce(Permissions.CAPEX_UPDATE, 'setAssets', (assets) =>
          set((state) => {
            state.assets = assets;
          })
        ),

        setDepreciationSchedule: enforce(
          Permissions.CAPEX_UPDATE,
          'setDepreciationSchedule',
          (entries) =>
            set((state) => {
              state.depreciationSchedule = entries;
            })
        ),

        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading;
          }),

        setError: (error) =>
          set((state) => {
            state.error = error;
          }),

        clearAll: enforce(Permissions.CAPEX_DELETE, 'clearAll', () =>
          set((state) => {
            state.projects = [];
            state.assets = [];
            state.depreciationSchedule = [];
            state.isLoading = false;
            state.error = null;
          })
        ),

        getProjectsByStatus: (status) => get().projects.filter((p) => p.status === status),

        getTotalBudget: () => get().projects.reduce((sum, p) => sum + p.budget, 0),

        getTotalActual: () => get().projects.reduce((sum, p) => sum + p.actual, 0),

        getAssetsByCategory: (category) => get().assets.filter((a) => a.category === category),
      })),
      {
        name: 'capex-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);
