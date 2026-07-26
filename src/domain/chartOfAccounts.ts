import type { AccountType, GLAccount } from '@/types';

export interface ChartAccountDraft {
  code: string;
  name: string;
  type: AccountType;
  category?: string;
  subCategory?: string;
  parentId?: string | null;
}

export interface ChartAccountValidation {
  valid: boolean;
  errors: Record<string, string>;
}

export const ACCOUNT_TYPES: AccountType[] = [
  'Revenue',
  'COGS',
  'OpEx',
  'CapEx',
  'Asset',
  'Liability',
  'Equity',
];

export function normalizeAccountType(value: string | undefined | null): AccountType | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '');
  const aliases: Record<string, AccountType> = {
    revenue: 'Revenue',
    income: 'Revenue',
    sales: 'Revenue',
    cogs: 'COGS',
    costofgoodssold: 'COGS',
    opex: 'OpEx',
    expense: 'OpEx',
    expenses: 'OpEx',
    operatingexpense: 'OpEx',
    capex: 'CapEx',
    capitalexpenditure: 'CapEx',
    asset: 'Asset',
    assets: 'Asset',
    liability: 'Liability',
    liabilities: 'Liability',
    equity: 'Equity',
  };
  return aliases[normalized] ?? null;
}

export function getNormalBalance(type: AccountType): 'Debit' | 'Credit' {
  return type === 'Asset' || type === 'COGS' || type === 'OpEx' || type === 'CapEx'
    ? 'Debit'
    : 'Credit';
}

export function getDescendantAccountIds(accounts: GLAccount[], accountId: string): Set<string> {
  const childrenByParent = new Map<string, GLAccount[]>();
  for (const account of accounts) {
    if (!account.parentId) continue;
    childrenByParent.set(account.parentId, [
      ...(childrenByParent.get(account.parentId) ?? []),
      account,
    ]);
  }

  const descendants = new Set<string>();
  const stack = [...(childrenByParent.get(accountId) ?? [])];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (descendants.has(current.id)) continue;
    descendants.add(current.id);
    stack.push(...(childrenByParent.get(current.id) ?? []));
  }
  return descendants;
}

export function wouldCreateCircularParent(
  accounts: GLAccount[],
  accountId: string | null,
  parentId: string | null | undefined
): boolean {
  if (!accountId || !parentId) return false;
  if (accountId === parentId) return true;
  return getDescendantAccountIds(accounts, accountId).has(parentId);
}

export function validateChartAccountDraft(
  draft: ChartAccountDraft,
  accounts: GLAccount[],
  editingId: string | null = null
): ChartAccountValidation {
  const errors: Record<string, string> = {};
  const code = draft.code.trim().toUpperCase();
  const name = draft.name.trim();

  if (!code || code.length < 2) {
    errors.code = 'Code must be at least 2 characters';
  } else if (!/^[A-Z0-9._-]+$/.test(code)) {
    errors.code = 'Code may only contain letters, numbers, dots, underscores, or dashes';
  } else if (
    accounts.some((account) => account.code.toUpperCase() === code && account.id !== editingId)
  ) {
    errors.code = `Code "${code}" already exists`;
  }

  if (!name || name.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!ACCOUNT_TYPES.includes(draft.type)) {
    errors.type = `Account type must be one of: ${ACCOUNT_TYPES.join(', ')}`;
  }

  if (wouldCreateCircularParent(accounts, editingId, draft.parentId)) {
    errors.parentId = 'Parent account would create a circular hierarchy';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function rowValue(
  row: Record<string, string>,
  headers: string[],
  field: string,
  fallbackIndex = -1
): string {
  const lowerHeaders = headers.map((header) => header.toLowerCase());
  const index = lowerHeaders.indexOf(field.toLowerCase());
  const header = index >= 0 ? headers[index] : headers[fallbackIndex];
  return header ? (row[header] ?? '') : '';
}
