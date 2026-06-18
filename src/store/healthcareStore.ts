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

interface HealthcareState {
  qualityMetrics: QualityMetric[];
  savingsData: SavingsEntry[];
  programs: ProgramEntry[];
  setQualityMetrics: (metrics: QualityMetric[]) => void;
  setSavingsData: (data: SavingsEntry[]) => void;
  addProgram: (program: ProgramEntry) => void;
  updateProgram: (id: string, updates: Partial<ProgramEntry>) => void;
}

export const useHealthcareStore = create<HealthcareState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
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
      })),

      {
        name: 'healthcare-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);
