/**
 * Canonical account classification + statement sign contract (Phase 2,
 * F-P2-01/F-P2-03). The full contract is documented in
 * `docs/product/STATEMENT_SIGN_CONTRACT.md`; this module is its only
 * implementation. Statement builders (P&L, balance sheet, trial balance)
 * must classify through here — never by ad-hoc code-prefix checks.
 *
 * Resolution order for an entry's statement class:
 *   1. the account master's `type` (owner-correctable truth; glStore is the
 *      DEC-012 authoritative store) — CapEx presents as an asset;
 *   2. the documented code-prefix convention
 *      1 Asset · 2 Liability · 3 Equity · 4 Revenue · 5 COGS · 6 OpEx ·
 *      7 Interest · 8 Income tax;
 *   3. `unclassified` — counted and reported by every consumer, never
 *      silently dropped (DEC-017 honesty applied to statements).
 *
 * Interest/tax are presentation subclasses of expense: an OpEx-class entry
 * whose code carries prefix 7/8 presents as interest/tax regardless of which
 * resolution step classified it, so the P&L's net income always articulates
 * with the balance sheet's current-period earnings.
 *
 * Signs (natural balance): asset/COGS/OpEx/interest/tax are debit-normal
 * (Dr − Cr); liability/equity/revenue are credit-normal (Cr − Dr). This
 * agrees with `SignConventionEngine.getNaturalSign` for every AccountType
 * (pinned by test). Amounts are never absolutised: a credit-heavy expense
 * is a negative expense. Unclassified movement is reported debit-normal.
 */
import Decimal from 'decimal.js';
import type { AccountType, GLAccount } from '../types';
import { toDecimal, type MoneyInput } from './money';

export type AccountClass =
  | 'asset'
  | 'liability'
  | 'equity'
  | 'revenue'
  | 'cogs'
  | 'opex'
  | 'interest'
  | 'tax'
  | 'unclassified';

export interface ClassifiableEntry {
  readonly accountCode?: string | null;
  readonly accountType?: AccountType | 'Unknown' | null;
}

const PREFIX_CLASS: Readonly<Record<string, AccountClass>> = {
  '1': 'asset',
  '2': 'liability',
  '3': 'equity',
  '4': 'revenue',
  '5': 'cogs',
  '6': 'opex',
  '7': 'interest',
  '8': 'tax',
};

/** Class implied by the first digit of the account code, else unclassified. */
export function classifyByPrefix(code: string | null | undefined): AccountClass {
  if (!code) return 'unclassified';
  return PREFIX_CLASS[code.charAt(0)] ?? 'unclassified';
}

const TYPE_CLASS: Readonly<Partial<Record<AccountType, AccountClass>>> = {
  Asset: 'asset',
  CapEx: 'asset',
  Liability: 'liability',
  Equity: 'equity',
  Revenue: 'revenue',
  COGS: 'cogs',
  OpEx: 'opex',
};

/** Class implied by an account-master type; null when the type carries none. */
export function classFromAccountType(
  type: AccountType | 'Unknown' | null | undefined
): AccountClass | null {
  if (!type || type === 'Unknown') return null;
  return TYPE_CLASS[type] ?? null;
}

/** The one resolver every statement builder uses. Type wins; prefix falls back. */
export function resolveAccountClass(entry: ClassifiableEntry): AccountClass {
  const fromType = classFromAccountType(entry.accountType);
  const base = fromType ?? classifyByPrefix(entry.accountCode);
  if (base === 'opex') {
    const byPrefix = classifyByPrefix(entry.accountCode);
    if (byPrefix === 'interest' || byPrefix === 'tax') return byPrefix;
  }
  return base;
}

const DEBIT_NORMAL: ReadonlySet<AccountClass> = new Set([
  'asset',
  'cogs',
  'opex',
  'interest',
  'tax',
  'unclassified',
]);

/** True when the class's natural (positive) balance is Dr − Cr. */
export function isDebitNormal(cls: AccountClass): boolean {
  return DEBIT_NORMAL.has(cls);
}

/**
 * Signed movement of one entry in its class's natural direction, as an exact
 * Decimal. Debit-normal: Dr − Cr. Credit-normal: Cr − Dr. Never absolutised.
 */
export function signedClassAmount(
  entry: { readonly debit?: MoneyInput | null; readonly credit?: MoneyInput | null },
  cls: AccountClass
): Decimal {
  const debit = toDecimal(entry.debit ?? 0, 'debit');
  const credit = toDecimal(entry.credit ?? 0, 'credit');
  return isDebitNormal(cls) ? debit.minus(credit) : credit.minus(debit);
}

/** Exactly the entries contributing to a class figure — the drill/trace selector. */
export function entriesForClass<T extends ClassifiableEntry>(
  entries: readonly T[],
  cls: AccountClass
): T[] {
  return entries.filter((e) => resolveAccountClass(e) === cls);
}

/**
 * Enrich entries with their account-master type so statement builders can
 * resolve by type (step 1 of the contract) instead of falling back to code
 * prefixes. Lookup mirrors `glStore.generateTrialBalance`: by account id,
 * then by account code. Entries whose account is unknown keep whatever type
 * they already carry (usually none → prefix fallback downstream).
 */
export function withAccountTypes<
  T extends {
    readonly accountId?: string;
    readonly accountCode?: string;
    readonly accountType?: AccountType | 'Unknown' | null;
  },
>(
  entries: readonly T[],
  accounts:
    | readonly { readonly id: string; readonly code: string; readonly type: AccountType }[]
    | null
    | undefined
): T[] {
  if (!accounts || accounts.length === 0) return [...entries];
  const byKey = new Map<string, AccountType>();
  for (const account of accounts) {
    byKey.set(account.id, account.type);
    byKey.set(account.code, account.type);
  }
  return entries.map((entry) => {
    if (entry.accountType && entry.accountType !== 'Unknown') return entry;
    const type =
      (entry.accountId ? byKey.get(entry.accountId) : undefined) ??
      (entry.accountCode ? byKey.get(entry.accountCode) : undefined);
    return type ? { ...entry, accountType: type } : entry;
  });
}

const CLASS_TYPE: Readonly<Partial<Record<AccountClass, AccountType>>> = {
  asset: 'Asset',
  liability: 'Liability',
  equity: 'Equity',
  revenue: 'Revenue',
  cogs: 'COGS',
  opex: 'OpEx',
  interest: 'OpEx',
  tax: 'OpEx',
};

/**
 * Derive account-master rows for entry account codes that have none yet
 * (Phase 2, F-P2-01). The type comes from the prefix convention — the only
 * inference available at import; the owner can correct it in the account
 * master afterwards, and corrections win everywhere because classification
 * reads the type first. Codes no convention classifies get NO account:
 * inventing a type would fabricate financial structure. Existing accounts
 * (by id or code) are never touched.
 */
export function deriveAccountsFromEntries(
  entries: readonly {
    readonly accountId?: string;
    readonly accountCode?: string;
    readonly accountName?: string;
    readonly entityId?: string;
  }[],
  existing: readonly GLAccount[]
): GLAccount[] {
  const known = new Set<string>();
  for (const account of existing) {
    known.add(account.id);
    known.add(account.code);
  }
  const derived: GLAccount[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    const code = entry.accountCode ?? entry.accountId ?? '';
    if (!code || seen.has(code)) continue;
    seen.add(code);
    if (known.has(code) || (entry.accountId && known.has(entry.accountId))) continue;
    const type = CLASS_TYPE[classifyByPrefix(code)];
    if (!type) continue;
    derived.push({
      id: entry.accountId || code,
      code,
      name: entry.accountName || code,
      type,
      category: '',
      subCategory: '',
      parentId: null,
      level: 0,
      sortOrder: existing.length + derived.length,
      isActive: true,
      entityId: entry.entityId ?? '',
      departmentId: null,
      isCalculated: false,
      formula: null,
      children: [],
    });
  }
  return derived;
}
