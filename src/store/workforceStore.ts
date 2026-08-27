import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';
import { sumMoney } from '@/utils/money';
// W6-P0-14: employees/departments are organizational master data (ENTITY_*
// family); payroll periods are financial records (BUDGET_UPDATE). Reads
// (getTotalPayroll etc.) and loading/error flags stay unguarded.
import { enforce, Permissions } from '../utils/rbacEnforcer';

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

        setEmployees: enforce(Permissions.ENTITY_UPDATE, 'setEmployees', (employees) =>
          set((state) => {
            state.employees = employees;
          })
        ),

        addEmployee: enforce(Permissions.ENTITY_CREATE, 'addEmployee', (employee) =>
          set((state) => {
            state.employees.push(employee);
          })
        ),

        updateEmployee: enforce(Permissions.ENTITY_UPDATE, 'updateEmployee', (id, updates) =>
          set((state) => {
            const idx = state.employees.findIndex((e) => e.id === id);
            if (idx !== -1) Object.assign(state.employees[idx]!, updates);
          })
        ),

        removeEmployee: enforce(Permissions.ENTITY_DELETE, 'removeEmployee', (id) =>
          set((state) => {
            state.employees = state.employees.filter((e) => e.id !== id);
          })
        ),

        setDepartments: enforce(Permissions.ENTITY_UPDATE, 'setDepartments', (departments) =>
          set((state) => {
            state.departments = departments;
          })
        ),

        setPayrollPeriods: enforce(Permissions.BUDGET_UPDATE, 'setPayrollPeriods', (periods) =>
          set((state) => {
            state.payrollPeriods = periods;
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

        clearAll: enforce(Permissions.ENTITY_DELETE, 'clearAll', () =>
          set((state) => {
            state.employees = [];
            state.departments = [];
            state.payrollPeriods = [];
            state.isLoading = false;
            state.error = null;
          })
        ),

        getEmployeesByDepartment: (deptId) =>
          get().employees.filter((e) => e.department === deptId),

        getTotalPayroll: () =>
          sumMoney(
            get()
              .employees.filter((e) => e.status === 'active')
              .map((e) => e.salary)
          ).toNumber(),

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
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);
