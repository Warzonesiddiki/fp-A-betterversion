import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';

export interface Program {
  id: string;
  name: string;
  department: string;
  enrollment: number;
  budget: number;
  revenue: number;
  status: 'Active' | 'Suspended' | 'Planned';
}

export interface EnrollmentTrend {
  semester: string;
  undergraduate: number;
  graduate: number;
  total: number;
}

export interface ScholarshipEntry {
  id: string;
  name: string;
  awarded: number;
  amount: number;
  recipients: number;
}

interface EducationState {
  programs: Program[];
  enrollmentTrends: EnrollmentTrend[];
  scholarships: ScholarshipEntry[];
  isLoading: boolean;
  error: string | null;
  setPrograms: (programs: Program[]) => void;
  addProgram: (program: Program) => void;
  updateProgram: (id: string, updates: Partial<Program>) => void;
  removeProgram: (id: string) => void;
  setEnrollmentTrends: (trends: EnrollmentTrend[]) => void;
  setScholarships: (scholarships: ScholarshipEntry[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearAll: () => void;
  getTotalEnrollment: () => number;
  getActiveProgramCount: () => number;
}

export const useEducationStore = create<EducationState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        programs: [],
        enrollmentTrends: [],
        scholarships: [],
        isLoading: false,
        error: null,
        setPrograms: (programs) =>
          set((s) => {
            s.programs = programs;
          }),
        addProgram: (program) =>
          set((s) => {
            s.programs.push(program);
          }),
        updateProgram: (id, updates) =>
          set((s) => {
            const i = s.programs.findIndex((p) => p.id === id);
            if (i !== -1) Object.assign(s.programs[i]!, updates);
          }),
        removeProgram: (id) =>
          set((s) => {
            s.programs = s.programs.filter((p) => p.id !== id);
          }),
        setEnrollmentTrends: (trends) =>
          set((s) => {
            s.enrollmentTrends = trends;
          }),
        setScholarships: (scholarships) =>
          set((s) => {
            s.scholarships = scholarships;
          }),
        setLoading: (isLoading) =>
          set((s) => {
            s.isLoading = isLoading;
          }),
        setError: (error) =>
          set((s) => {
            s.error = error;
          }),
        clearAll: () =>
          set((s) => {
            s.programs = [];
            s.enrollmentTrends = [];
            s.scholarships = [];
            s.isLoading = false;
            s.error = null;
          }),
        getTotalEnrollment: () => get().programs.reduce((sum, p) => sum + p.enrollment, 0),
        getActiveProgramCount: () => get().programs.filter((p) => p.status === 'Active').length,
      })),
      {
        name: 'education-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);
