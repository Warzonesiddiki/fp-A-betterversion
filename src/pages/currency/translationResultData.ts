/**
 * Translation Result page — pure money derivations.
 *
 * All arithmetic is decimal-backed via decimal.js; the page component only
 * renders. Extracted from TranslationResultPage.tsx per the money-AST
 * derivation-extraction pattern (W0.1.1/W0.1.6).
 */
import Decimal from 'decimal.js';
import type { MoneyInput } from '@/utils/money';
import { toDecimal } from '@/utils/money';

export interface TranslationInputEntry {
  readonly accountCode?: string;
  readonly accountName?: string;
  readonly debit?: MoneyInput;
  readonly credit?: MoneyInput;
}

export interface TranslationEntry {
  readonly accountCode: string;
  readonly accountName: string;
  readonly originalAmount: number;
  readonly translatedAmount: number;
  readonly gainLoss: number;
}

/** Signed net amount of one GL entry: debit − credit, exact. */
export function entryNetAmount(entry: TranslationInputEntry): number {
  return toDecimal(entry.debit ?? 0)
    .minus(toDecimal(entry.credit ?? 0))
    .toNumber();
}

export function buildTranslationEntries(
  entries: readonly TranslationInputEntry[],
  rate: number
): TranslationEntry[] {
  const accountMap = new Map<string, { name: string; total: Decimal }>();
  for (const entry of entries) {
    const code = entry.accountCode || 'Unknown';
    const net = toDecimal(entry.debit ?? 0).minus(toDecimal(entry.credit ?? 0));
    const existing = accountMap.get(code);
    if (existing) {
      existing.total = existing.total.plus(net);
    } else {
      accountMap.set(code, { name: entry.accountName || code, total: net });
    }
  }
  return Array.from(accountMap.entries())
    .map(([code, { name, total }]) => ({
      accountCode: code,
      accountName: name,
      originalAmount: total.toNumber(),
      translatedAmount: total.times(rate).toNumber(),
      gainLoss: total.times(rate).minus(total).toNumber(),
    }))
    .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
}
