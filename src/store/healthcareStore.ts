import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';
import { enforce, Permissions } from '@/utils/rbacEnforcer';

export interface QualityMetric {
  subject: string;
  A: number;
  B: number;
  fullMark: number;
}

export interface SavingsEntry {
  category: string;
  target: number;
  actual: number;
  savings: number;
}

export interface ProgramEntry {
  id: string;
  program: string;
  population: string;
  qualityScore: string;
  sharedSavings: string;
  status: 'High' | 'Watch' | 'Medium';
}

/**
 * A clinical trial the user has actually recorded.
 *
 * Added in session 022. `ClinicalTrialCostPage` previously hardcoded five
 * trials at named institutions (Onco-Shield Ph III at Mayo Clinic,
 * Neuro-Restore Ph II at Johns Hopkins, …) with budgets and spend, plus six
 * months of budget/actual/enrolment. Trials are not general-ledger objects, so
 * they live here as user input and default to an empty list.
 */
export interface ClinicalTrial {
  id: string;
  name: string;
  site: string;
  phase: string;
  /** Approved trial budget. */
  budget: number;
  /** Spend recorded against the trial to date. */
  actualSpend: number;
  /** Patients targeted for enrolment. */
  targetEnrollment: number;
  /** Patients enrolled to date. */
  enrolled: number;
  status: 'planned' | 'enrolling' | 'active' | 'completed';
}

interface HealthcareState {
  qualityMetrics: QualityMetric[];
  savingsData: SavingsEntry[];
  programs: ProgramEntry[];
  clinicalTrials: ClinicalTrial[];
  setQualityMetrics: (metrics: QualityMetric[]) => void;
  setSavingsData: (data: SavingsEntry[]) => void;
  addProgram: (program: ProgramEntry) => void;
  updateProgram: (id: string, updates: Partial<ProgramEntry>) => void;
  setClinicalTrials: (trials: ClinicalTrial[]) => void;
  addClinicalTrial: (trial: ClinicalTrial) => void;
  removeClinicalTrial: (id: string) => void;
}

/**
 * Persist migration (exported for direct testing).
 *
 * v1 → v2 introduced `clinicalTrials` (default empty; a persisted v1
 * workspace must not materialise trials it never entered).
 * v2 → v3 (session 024) clears the seeded `qualityMetrics`, `savingsData`
 * and `programs` collections: sessions ≤023 shipped invented quality
 * scores, episode costs and ACO rows for every tenant, and upgrading
 * workspaces must not keep fabricated figures that were never their own
 * records. `clinicalTrials` — genuine user input — survives.
 */
export function migrateHealthcareState(state: unknown, version: number): unknown {
  const base = (state && typeof state === 'object' ? state : {}) as Record<string, unknown>;
  const withTrials = 'clinicalTrials' in base ? base : { ...base, clinicalTrials: [] };
  if (version < 3) {
    return { ...withTrials, qualityMetrics: [], savingsData: [], programs: [] };
  }
  return withTrials;
}

export const useHealthcareStore = create<HealthcareState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        // Session 024: `qualityMetrics`, `savingsData` and `programs` no
        // longer ship seeded defaults. Sessions ≤023 persisted invented
        // quality scores, episode costs and ACO program rows for EVERY
        // tenant — the same class cleaned out of constructionStore (s014)
        // and insuranceStore (s015). They default to empty and are user
        // input only; the persist bump v2 → v3 below clears them for
        // upgrading workspaces.
        clinicalTrials: [],
        qualityMetrics: [],
        savingsData: [],
        programs: [],

        setQualityMetrics: enforce(Permissions.DASHBOARD_UPDATE, 'setQualityMetrics', (metrics) =>
          set((state) => {
            state.qualityMetrics = metrics;
          })
        ),

        setSavingsData: enforce(Permissions.BUDGET_UPDATE, 'setSavingsData', (data) =>
          set((state) => {
            state.savingsData = data;
          })
        ),

        addProgram: enforce(Permissions.BUDGET_CREATE, 'addProgram', (program) =>
          set((state) => {
            state.programs.push(program);
          })
        ),

        updateProgram: enforce(Permissions.BUDGET_UPDATE, 'updateProgram', (id, updates) =>
          set((state) => {
            const idx = state.programs.findIndex((p) => p.id === id);
            if (idx !== -1) Object.assign(state.programs[idx]!, updates);
          })
        ),

        setClinicalTrials: enforce(Permissions.ENTITY_UPDATE, 'setClinicalTrials', (trials) =>
          set((state) => {
            state.clinicalTrials = trials;
          })
        ),

        addClinicalTrial: enforce(Permissions.ENTITY_CREATE, 'addClinicalTrial', (trial) =>
          set((state) => {
            state.clinicalTrials.push(trial);
          })
        ),

        removeClinicalTrial: enforce(Permissions.ENTITY_DELETE, 'removeClinicalTrial', (id) =>
          set((state) => {
            state.clinicalTrials = state.clinicalTrials.filter((t) => t.id !== id);
          })
        ),
      })),

      {
        name: 'healthcare-store',
        storage: masterStorage,
        version: 3,
        migrate: migrateHealthcareState,
      }
    )
  )
);
