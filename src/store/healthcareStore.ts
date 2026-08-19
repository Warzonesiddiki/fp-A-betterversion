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

export const useHealthcareStore = create<HealthcareState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        // NOTE (session 022): `qualityMetrics`, `savingsData` and `programs`
        // below still ship seeded defaults — invented figures persisted for
        // every tenant, the same class cleaned out of constructionStore and
        // insuranceStore in sessions 014–015. They feed ValueBasedCarePage,
        // which is the next fabrication worklist item; `clinicalTrials` is
        // added here already empty.
        clinicalTrials: [],
        qualityMetrics: [
          { subject: 'Readmission', A: 120, B: 110, fullMark: 150 },
          { subject: 'Patient Sat', A: 98, B: 130, fullMark: 150 },
          { subject: 'Mortality', A: 86, B: 130, fullMark: 150 },
          { subject: 'Safety', A: 99, B: 100, fullMark: 150 },
          { subject: 'Efficiency', A: 85, B: 90, fullMark: 150 },
          { subject: 'Clinical', A: 65, B: 85, fullMark: 150 },
        ],

        savingsData: [
          { category: 'Orthopedics', target: 2400000, actual: 2100000, savings: 300000 },
          { category: 'Cardiology', target: 1800000, actual: 1950000, savings: -150000 },
          { category: 'Neurology', target: 1500000, actual: 1200000, savings: 300000 },
          { category: 'Primary Care', target: 4500000, actual: 3800000, savings: 700000 },
        ],

        programs: [
          {
            id: 'V-01',
            program: 'MSSP ACO Track 3',
            population: '24,500',
            qualityScore: '94.2%',
            sharedSavings: '+$2.4M',
            status: 'High',
          },
          {
            id: 'V-02',
            program: 'BPCI-Advanced',
            population: '1,200',
            qualityScore: '88.7%',
            sharedSavings: '-$140k',
            status: 'Watch',
          },
          {
            id: 'V-03',
            program: 'CJR Bundle',
            population: '850',
            qualityScore: '96.8%',
            sharedSavings: '+$840k',
            status: 'High',
          },
          {
            id: 'V-04',
            program: 'Direct Contracting',
            population: '4,200',
            qualityScore: '76.3%',
            sharedSavings: '+$120k',
            status: 'Medium',
          },
        ],

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
        version: 2,
        // v1 -> v2 introduces `clinicalTrials`, defaulting to empty. A
        // persisted v1 workspace must not materialise trials it never entered.
        migrate: (state: unknown) => {
          if (state && typeof state === 'object' && !('clinicalTrials' in state)) {
            return { ...(state as Record<string, unknown>), clinicalTrials: [] };
          }
          return state;
        },
      }
    )
  )
);
