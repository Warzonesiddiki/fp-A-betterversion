import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkforceStore } from './workforceStore';
import type { Employee, Department, PayrollPeriod } from './workforceStore';

describe('workforceStore', () => {
  beforeEach(() => {
    useWorkforceStore.setState({
      employees: [],
      departments: [],
      payrollPeriods: [],
      isLoading: false,
      error: null,
    });
  });

  it('should have initial empty state after reset', () => {
    const state = useWorkforceStore.getState();
    expect(state.employees).toEqual([]);
    expect(state.departments).toEqual([]);
    expect(state.payrollPeriods).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set employees', () => {
    const employees: Employee[] = [
      {
        id: 'e1',
        name: 'Alice',
        department: 'Engineering',
        position: 'Senior Engineer',
        salary: 150000,
        startDate: '2023-01-15',
        status: 'active',
      },
    ];
    useWorkforceStore.getState().setEmployees(employees);
    expect(useWorkforceStore.getState().employees).toEqual(employees);
  });

  it('should add an employee', () => {
    useWorkforceStore.getState().addEmployee({
      id: 'e2',
      name: 'Bob',
      department: 'Sales',
      position: 'Account Manager',
      salary: 100000,
      startDate: '2023-06-01',
      status: 'active',
    });
    expect(useWorkforceStore.getState().employees).toHaveLength(1);
    expect(useWorkforceStore.getState().employees[0].name).toBe('Bob');
  });

  it('should update an employee', () => {
    useWorkforceStore.getState().addEmployee({
      id: 'e3',
      name: 'Charlie',
      department: 'Marketing',
      position: 'Analyst',
      salary: 80000,
      startDate: '2024-01-01',
      status: 'active',
    });
    useWorkforceStore.getState().updateEmployee('e3', { position: 'Lead Analyst', salary: 95000 });
    const updated = useWorkforceStore.getState().employees[0];
    expect(updated.position).toBe('Lead Analyst');
    expect(updated.salary).toBe(95000);
  });

  it('should not update non-existent employee', () => {
    useWorkforceStore.getState().addEmployee({
      id: 'e4',
      name: 'Diana',
      department: 'Finance',
      position: 'Controller',
      salary: 120000,
      startDate: '2022-03-15',
      status: 'active',
    });
    useWorkforceStore.getState().updateEmployee('nonexistent', { position: 'CFO' });
    expect(useWorkforceStore.getState().employees[0].position).toBe('Controller');
  });

  it('should remove an employee', () => {
    useWorkforceStore.getState().addEmployee({
      id: 'e5',
      name: 'Eve',
      department: 'HR',
      position: 'Recruiter',
      salary: 70000,
      startDate: '2024-02-01',
      status: 'active',
    });
    useWorkforceStore.getState().removeEmployee('e5');
    expect(useWorkforceStore.getState().employees).toHaveLength(0);
  });

  it('should set departments', () => {
    const departments: Department[] = [
      { id: 'd1', name: 'Engineering', budget: 5000000, managerId: 'alice-id' },
    ];
    useWorkforceStore.getState().setDepartments(departments);
    expect(useWorkforceStore.getState().departments).toEqual(departments);
  });

  it('should set payroll periods', () => {
    const periods: PayrollPeriod[] = [
      {
        id: 'pp1',
        period: 'Jan 2026',
        totalGross: 1000000,
        totalNet: 800000,
        totalTax: 200000,
        employeeCount: 100,
      },
    ];
    useWorkforceStore.getState().setPayrollPeriods(periods);
    expect(useWorkforceStore.getState().payrollPeriods).toEqual(periods);
  });

  it('should set loading state', () => {
    useWorkforceStore.getState().setLoading(true);
    expect(useWorkforceStore.getState().isLoading).toBe(true);
  });

  it('should set error state', () => {
    useWorkforceStore.getState().setError('Failed');
    expect(useWorkforceStore.getState().error).toBe('Failed');
  });

  it('should clear all data', () => {
    useWorkforceStore.getState().addEmployee({
      id: 'e1',
      name: 'Test',
      department: 'Test',
      position: 'Test',
      salary: 50000,
      startDate: '2024-01-01',
      status: 'active',
    });
    useWorkforceStore.getState().setLoading(true);
    useWorkforceStore.getState().setError('err');
    useWorkforceStore.getState().clearAll();
    const state = useWorkforceStore.getState();
    expect(state.employees).toEqual([]);
    expect(state.departments).toEqual([]);
    expect(state.payrollPeriods).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should filter employees by department', () => {
    useWorkforceStore.getState().setEmployees([
      {
        id: 'e1',
        name: 'A',
        department: 'Engineering',
        position: 'Dev',
        salary: 100000,
        startDate: '2024-01-01',
        status: 'active',
      },
      {
        id: 'e2',
        name: 'B',
        department: 'Engineering',
        position: 'QA',
        salary: 90000,
        startDate: '2024-01-01',
        status: 'active',
      },
      {
        id: 'e3',
        name: 'C',
        department: 'Sales',
        position: 'Rep',
        salary: 80000,
        startDate: '2024-01-01',
        status: 'active',
      },
    ]);
    expect(useWorkforceStore.getState().getEmployeesByDepartment('Engineering')).toHaveLength(2);
    expect(useWorkforceStore.getState().getEmployeesByDepartment('Sales')).toHaveLength(1);
    expect(useWorkforceStore.getState().getEmployeesByDepartment('Nonexistent')).toHaveLength(0);
  });

  it('should return empty array for empty employees', () => {
    expect(useWorkforceStore.getState().getEmployeesByDepartment('Any')).toEqual([]);
  });

  it('should calculate total payroll for active employees', () => {
    useWorkforceStore.getState().setEmployees([
      {
        id: 'e1',
        name: 'A',
        department: 'D1',
        position: 'R1',
        salary: 100000,
        startDate: '2024-01-01',
        status: 'active',
      },
      {
        id: 'e2',
        name: 'B',
        department: 'D2',
        position: 'R2',
        salary: 120000,
        startDate: '2024-01-01',
        status: 'active',
      },
      {
        id: 'e3',
        name: 'C',
        department: 'D3',
        position: 'R3',
        salary: 80000,
        startDate: '2024-01-01',
        status: 'terminated',
      },
    ]);
    expect(useWorkforceStore.getState().getTotalPayroll()).toBe(220000);
  });

  it('should return 0 total payroll for empty employees', () => {
    expect(useWorkforceStore.getState().getTotalPayroll()).toBe(0);
  });

  it('should calculate headcount by department for active employees only', () => {
    useWorkforceStore.getState().setEmployees([
      {
        id: 'e1',
        name: 'A',
        department: 'Engineering',
        position: 'R1',
        salary: 100000,
        startDate: '2024-01-01',
        status: 'active',
      },
      {
        id: 'e2',
        name: 'B',
        department: 'Engineering',
        position: 'R2',
        salary: 120000,
        startDate: '2024-01-01',
        status: 'active',
      },
      {
        id: 'e3',
        name: 'C',
        department: 'Sales',
        position: 'R3',
        salary: 80000,
        startDate: '2024-01-01',
        status: 'active',
      },
      {
        id: 'e4',
        name: 'D',
        department: 'Engineering',
        position: 'R4',
        salary: 90000,
        startDate: '2024-01-01',
        status: 'terminated',
      },
    ]);
    const headcount = useWorkforceStore.getState().getHeadcountByDepartment();
    expect(headcount['Engineering']).toBe(2);
    expect(headcount['Sales']).toBe(1);
  });

  it('should return empty headcount for empty employees', () => {
    expect(useWorkforceStore.getState().getHeadcountByDepartment()).toEqual({});
  });
});
