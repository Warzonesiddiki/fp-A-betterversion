/**
 * Phase 4 comparison engine (FR-011, plan §8): account × grain aggregates
 * with coverage honesty, on the Phase 2 sign contract.
 *
 * Honesty rules (all test-pinned):
 * - A period with no entries is `null` — rendered "not in file", never 0.
 * - The prior column is the calendar-prior period when the ledger covers
 *   it; otherwise the latest present period before the current one, and
 *   `priorIsCalendarPrior: false` says so on the column.
 * - The prior-year column exists only when that exact period is covered.
 * - Δ% is `null` when either side is missing or the prior base is 0 —
 *   never a fabricated −100%.
 * - Coverage per period states entries, distinct days present of days in
 *   the period, and the import batches that contributed.
 *
 * Figures are signed in each account's natural direction via the canonical
 * resolver (`@/utils/accountClassification`) and are exact decimals,
 * rounded once at emission. Rows are exhaustive (DEC-017), sorted by |Δ|
 * descending with missing deltas last — deterministically.
 */
import Decimal from 'decimal.js';
import { roundTo } from '@/utils/money';
import {
  resolveAccountClass,
  signedClassAmount,
  type AccountClass,
} from '@/utils/accountClassification';
import type { AccountType } from '@/types';

export type ComparisonGrain = 'day' | 'month' | 'year';

export interface ComparisonEntryInput {
  readonly id: string;
  readonly date: string;
  readonly period?: string;
  readonly accountCode: string;
  readonly accountName?: string;
  readonly accountType?: AccountType | 'Unknown' | null;
  readonly debit: number;
  readonly credit: number;
  readonly provenance?: {
    readonly batchId: string;
    readonly sourceFile: string;
    readonly sourceRow: number;
  };
}

export interface PeriodCoverage {
  readonly entryCount: number;
  readonly daysPresent: number;
  readonly daysInPeriod: number;
  readonly batches: readonly string[];
}

export interface ComparisonRow {
  readonly accountCode: string;
  readonly accountName: string;
  readonly accountClass: AccountClass;
  readonly current: number | null;
  readonly prior: number | null;
  readonly priorYear: number | null;
  readonly deltaMoney: number | null;
  readonly deltaPct: number | null;
}

export interface ComparisonResult {
  readonly grain: ComparisonGrain;
  readonly currentKey: string;
  readonly priorKey: string | null;
  readonly priorIsCalendarPrior: boolean;
  readonly priorYearKey: string | null;
  readonly rows: readonly ComparisonRow[];
  readonly coverage: ReadonlyMap<string, PeriodCoverage>;
  /** All period keys present in the ledger for this grain, ascending. */
  readonly periodKeys: readonly string[];
}

export function periodKeyOf(date: string, grain: ComparisonGrain): string {
  if (grain === 'day') return date.slice(0, 10);
  if (grain === 'year') return date.slice(0, 4);
  return date.slice(0, 7);
}

function daysInPeriod(key: string, grain: ComparisonGrain): number {
  if (grain === 'day') return 1;
  if (grain === 'year') {
    const year = Number(key.slice(0, 4));
    return (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86_400_000;
  }
  const [y, m] = key.split('-').map(Number);
  return new Date(Date.UTC(y ?? 1970, m ?? 1, 0)).getUTCDate();
}

function calendarPriorKey(key: string, grain: ComparisonGrain): string {
  if (grain === 'day') {
    const ms = Date.parse(`${key}T00:00:00Z`) - 86_400_000;
    return new Date(ms).toISOString().slice(0, 10);
  }
  if (grain === 'year') return String(Number(key) - 1);
  const [y, m] = key.split('-').map(Number);
  const month = (m ?? 1) - 1;
  return month === 0 ? `${(y ?? 1970) - 1}-12` : `${y}-${String(month).padStart(2, '0')}`;
}

function calendarPriorYearKey(key: string, grain: ComparisonGrain): string | null {
  if (grain === 'year') return null;
  if (grain === 'day') return `${Number(key.slice(0, 4)) - 1}${key.slice(4)}`;
  return `${Number(key.slice(0, 4)) - 1}${key.slice(4)}`;
}

/** Exactly the entries behind one grid cell — the drill selector (plan §8). */
export function entriesForAccountPeriod(
  entries: readonly ComparisonEntryInput[],
  accountCode: string,
  key: string,
  grain: ComparisonGrain
): ComparisonEntryInput[] {
  return entries.filter(
    (entry) => entry.accountCode === accountCode && periodKeyOf(entry.date, grain) === key
  );
}

export function buildComparison(
  entries: readonly ComparisonEntryInput[],
  args: { grain: ComparisonGrain; currentKey: string }
): ComparisonResult {
  const { grain, currentKey } = args;

  // Per account × period exact sums, in each entry's natural direction.
  const sums = new Map<string, Map<string, Decimal>>();
  const names = new Map<string, string>();
  const classes = new Map<string, AccountClass>();
  const coverageRaw = new Map<string, { count: number; days: Set<string>; batches: Set<string> }>();

  for (const entry of entries) {
    const key = periodKeyOf(entry.date, grain);
    const cls = resolveAccountClass(entry);
    if (!classes.has(entry.accountCode)) classes.set(entry.accountCode, cls);
    if (!names.has(entry.accountCode) && entry.accountName) {
      names.set(entry.accountCode, entry.accountName);
    }
    let perPeriod = sums.get(entry.accountCode);
    if (!perPeriod) {
      perPeriod = new Map();
      sums.set(entry.accountCode, perPeriod);
    }
    perPeriod.set(key, (perPeriod.get(key) ?? new Decimal(0)).plus(signedClassAmount(entry, cls)));

    let cov = coverageRaw.get(key);
    if (!cov) {
      cov = { count: 0, days: new Set(), batches: new Set() };
      coverageRaw.set(key, cov);
    }
    cov.count += 1;
    cov.days.add(entry.date.slice(0, 10));
    if (entry.provenance) cov.batches.add(entry.provenance.batchId);
  }

  const periodKeys = [...coverageRaw.keys()].sort();
  const present = new Set(periodKeys);

  const calPrior = calendarPriorKey(currentKey, grain);
  const priorKey = present.has(calPrior)
    ? calPrior
    : ([...periodKeys].filter((k) => k < currentKey).pop() ?? null);
  const priorIsCalendarPrior = priorKey !== null && priorKey === calPrior;

  const calPriorYear = calendarPriorYearKey(currentKey, grain);
  const priorYearKey = calPriorYear && present.has(calPriorYear) ? calPriorYear : null;

  const value = (accountCode: string, key: string | null): number | null => {
    if (key === null) return null;
    const v = sums.get(accountCode)?.get(key);
    return v === undefined ? null : roundTo(v, 2);
  };

  const rows: ComparisonRow[] = [...sums.keys()].map((accountCode) => {
    const current = value(accountCode, currentKey);
    const prior = value(accountCode, priorKey);
    const priorYear = value(accountCode, priorYearKey);
    let deltaMoney: number | null = null;
    let deltaPct: number | null = null;
    if (current !== null && prior !== null) {
      deltaMoney = roundTo(new Decimal(current).minus(prior), 2);
      if (prior !== 0) {
        deltaPct = roundTo(
          new Decimal(current).minus(prior).dividedBy(new Decimal(prior).abs()).times(100),
          2
        );
      }
    }
    return {
      accountCode,
      accountName: names.get(accountCode) ?? accountCode,
      accountClass: classes.get(accountCode) ?? 'unclassified',
      current,
      prior,
      priorYear,
      deltaMoney,
      deltaPct,
    };
  });

  rows.sort((a, b) => {
    const da = a.deltaMoney === null ? -1 : Math.abs(a.deltaMoney);
    const db = b.deltaMoney === null ? -1 : Math.abs(b.deltaMoney);
    if (db !== da) return db - da;
    return a.accountCode.localeCompare(b.accountCode);
  });

  const coverage = new Map<string, PeriodCoverage>();
  for (const key of periodKeys) {
    const raw = coverageRaw.get(key)!;
    coverage.set(key, {
      entryCount: raw.count,
      daysPresent: raw.days.size,
      daysInPeriod: daysInPeriod(key, grain),
      batches: [...raw.batches].sort(),
    });
  }

  return {
    grain,
    currentKey,
    priorKey,
    priorIsCalendarPrior,
    priorYearKey,
    rows,
    coverage,
    periodKeys,
  };
}
