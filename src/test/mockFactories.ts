export function mockGLAccount(
  overrides?: Partial<{
    id: string;
    code: string;
    name: string;
    type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
    balance: number;
  }>
) {
  return {
    id: `acc-${Date.now()}`,
    code: '1000',
    name: 'Cash',
    type: 'Asset' as const,
    balance: 100000,
    ...overrides,
  };
}

export function mockBudget(
  overrides?: Partial<{
    id: string;
    name: string;
    status: 'Draft' | 'InReview' | 'Approved' | 'Locked';
    fiscalYear: number;
    totalAmount: number;
  }>
) {
  return {
    id: `bud-${Date.now()}`,
    name: 'FY2026 Budget',
    status: 'Draft' as const,
    fiscalYear: 2026,
    totalAmount: 1000000,
    ...overrides,
  };
}

export function mockTransaction(
  overrides?: Partial<{
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'debit' | 'credit';
    accountCode: string;
  }>
) {
  return {
    id: `txn-${Date.now()}`,
    date: '2026-01-15',
    description: 'Office supplies',
    amount: 500,
    type: 'debit' as const,
    accountCode: '6100',
    ...overrides,
  };
}

export function mockUser(
  overrides?: Partial<{
    id: string;
    name: string;
    email: string;
    role: 'Admin' | 'Manager' | 'Analyst' | 'DeptHead' | 'Viewer';
  }>
) {
  return {
    id: `usr-${Date.now()}`,
    name: 'Test User',
    email: 'test@example.com',
    role: 'Analyst' as const,
    ...overrides,
  };
}

export function mockForecast(
  overrides?: Partial<{
    id: string;
    name: string;
    method: string;
    periods: number;
  }>
) {
  return {
    id: `fc-${Date.now()}`,
    name: 'Q1 Forecast',
    method: 'Linear',
    periods: 12,
    ...overrides,
  };
}

export function mockScenario(
  overrides?: Partial<{
    id: string;
    name: string;
    type: 'Best' | 'Base' | 'Worst' | 'Custom';
  }>
) {
  return {
    id: `scn-${Date.now()}`,
    name: 'Base Case',
    type: 'Base' as const,
    ...overrides,
  };
}
