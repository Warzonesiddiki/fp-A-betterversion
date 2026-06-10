import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';

export interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  salary: number;
  startDate: string;
  status: 'active' | 'inactive' | 'terminated';
}

export interface Department {
  id: string;
  name: string;
  budget: number;
  managerId: string;
}

export interface PayrollPeriod {
  id: string;
  period: string;
  totalGross: number;
  totalNet: number;
  totalTax: number;
  employeeCount: number;
}

interface WorkforceState {
  employees: Employee[];
  departments: Department[];
  payrollPeriods: PayrollPeriod[];
  isLoading: boolean;
  error: string | null;

  setEmployees: (employees: Employee[]) => void;
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  removeEmployee: (id: string) => void;
  setDepartments: (departments: Department[]) => void;
  setPayrollPeriods: (periods: PayrollPeriod[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAll: () => void;

  getEmployeesByDepartment: (deptId: string) => Employee[];
  getTotalPayroll: () => number;
  getHeadcountByDepartment: () => Record<string, number>;
}

export const useWorkforceStore = create<WorkforceState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        employees: [],
        departments: [],
        payrollPeriods: [],
        isLoading: false,
        error: null,

        setEmployees: (employees) =>
          set((state) => {
            state.employees = employees;
          }),

        addEmployee: (employee) =>
          set((state) => {
            state.employees.push(employee);
          }),

        updateEmployee: (id, updates) =>
          set((state) => {
            const idx = state.employees.findIndex((e) => e.id === id);
            if (idx !== -1) Object.assign(state.employees[idx]!, updates);
          }),

        removeEmployee: (id) =>
          set((state) => {
            state.employees = state.employees.filter((e) => e.id !== id);
          }),

        setDepartments: (departments) =>
          set((state) => {
            state.departments = departments;
          }),

        setPayrollPeriods: (periods) =>
          set((state) => {
            state.payrollPeriods = periods;
          }),

        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading;
          }),

        setError: (error) =>
          set((state) => {
            state.error = error;
          }),

        clearAll: () =>
          set((state) => {
            state.employees = [];
            state.departments = [];
            state.payrollPeriods = [];
            state.isLoading = false;
            state.error = null;
          }),

        getEmployeesByDepartment: (deptId) =>
          get().employees.filter((e) => e.department === deptId),

        getTotalPayroll: () =>
          get()
            .employees.filter((e) => e.status === 'active')
            .reduce((sum, e) => sum + e.salary, 0),

        getHeadcountByDepartment: () =>
          get()
            .employees.filter((e) => e.status === 'active')
            .reduce<Record<string, number>>((acc, e) => {
              acc[e.department] = (acc[e.department] ?? 0) + 1;
              return acc;
            }, {}),
      })),
      {
        name: 'workforce-store',
        storage: masterStorage,
      }
    )
  )
);
