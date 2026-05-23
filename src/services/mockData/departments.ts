import type { Department } from '@/types';

export const departments: Department[] = [
  {
    id: 'dept-engineering',
    name: 'Engineering',
    code: 'ENG',
    costCenter: 'CC-1001',
    headId: 'usr-007',
    headName: 'Lisa Wong',
    budgetAmount: 18_500_000,
    userCount: 45,
  },
  {
    id: 'dept-sales',
    name: 'Sales',
    code: 'SAL',
    costCenter: 'CC-1002',
    headId: 'usr-006',
    headName: 'Tom Baker',
    budgetAmount: 12_200_000,
    userCount: 28,
  },
  {
    id: 'dept-marketing',
    name: 'Marketing',
    code: 'MKT',
    costCenter: 'CC-1003',
    headId: null,
    headName: null,
    budgetAmount: 8_100_000,
    userCount: 18,
  },
  {
    id: 'dept-finance',
    name: 'Finance & Accounting',
    code: 'FIN',
    costCenter: 'CC-1004',
    headId: null,
    headName: null,
    budgetAmount: 6_500_000,
    userCount: 14,
  },
  {
    id: 'dept-operations',
    name: 'Operations',
    code: 'OPS',
    costCenter: 'CC-1005',
    headId: null,
    headName: null,
    budgetAmount: 5_300_000,
    userCount: 22,
  },
  {
    id: 'dept-ga',
    name: 'G&A',
    code: 'GNA',
    costCenter: 'CC-1006',
    headId: null,
    headName: null,
    budgetAmount: 4_200_000,
    userCount: 10,
  },
];

export function getDepartmentById(id: string): Department | undefined {
  return departments.find((d) => d.id === id);
}
