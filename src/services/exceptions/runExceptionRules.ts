/**
 * Phase 3 rule runner (plan §7, FR-008/FR-009): evaluates the catalogue-v2
 * entry-level rules (R-006…R-017) over a GL snapshot and returns findings.
 *
 * Contracts:
 * - **Every entry is examined by every rule** (DEC-017). Thresholds rank
 *   and tier findings; they never suppress a rule's output category.
 * - **Deterministic**: entries are processed in (date, accountCode, id)
 *   order, findings are returned sorted by findingKey, and timestamps come
 *   from the injected clock (`@/utils/clock`). Same ledger + same rule
 *   versions + same options → identical output, byte for byte.
 * - **Money-exact**: all sums/medians are Decimal via `@/utils/money`;
 *   unbalanced means Dr − Cr ≠ 0 to the cent — no tolerance window.
 * - **Candidates, never verdicts** (AGENTS.md rule 7): a finding says
 *   "worth a second look", with the rule id, the exact rows, and their
 *   source (`batch · row`) as evidence. Only a human disposition changes
 *   that status.
 * - The aggregate rules R-001…R-005 need prior-period baselines and are
 *   evaluated by the Phase 4 comparison workspace; this runner does not
 *   pretend to run them.
 */
import Decimal from 'decimal.js';
import { toDecimal } from '@/utils/money';
import {
  createFinding,
  EXCEPTION_RULES,
  type ExceptionFinding,
  type ExceptionRule,
} from '@/store/exceptionRuleCatalogue';

export interface ExceptionEntryInput {
  readonly id: string;
  readonly journalId?: string;
  readonly date: string;
  readonly period?: string;
  readonly accountCode: string;
  readonly accountName?: string;
  readonly debit: number;
  readonly credit: number;
  readonly description?: string;
  readonly reference?: string;
  readonly provenance?: {
    readonly batchId: string;
    readonly sourceFile: string;
    readonly sourceRow: number;
  };
}

export interface ExceptionRunOptions {
  /** R-011: minimum amount size (default 10,000). */
  readonly roundAmountMin?: number;
  /** R-011: round unit the amount must be a multiple of (default 1,000). */
  readonly roundAmountMultiple?: number;
  /** R-015: dormancy window in days (default 180). */
  readonly dormancyDays?: number;
  /** R-017: minimum entries per account before outlier detection (default 5). */
  readonly outlierMinEntries?: number;
  /** R-017: MAD multiplier (default 5). */
  readonly outlierMadFactor?: number;
}

export interface ExceptionRunResult {
  readonly findings: readonly ExceptionFinding[];
  /** Entries the run examined (all of them — DEC-017). */
  readonly examinedEntries: number;
  /** Entries with neither journal id nor reference: journal rules skipped them, counted here. */
  readonly skippedJournalEntries: number;
  /** The options actually applied, recorded so a run can be reproduced. */
  readonly options: Required<ExceptionRunOptions>;
}

const DEFAULT_OPTIONS: Required<ExceptionRunOptions> = {
  roundAmountMin: 10_000,
  roundAmountMultiple: 1_000,
  dormancyDays: 180,
  outlierMinEntries: 5,
  outlierMadFactor: 5,
};

function rule(ruleId: string): ExceptionRule {
  const found = EXCEPTION_RULES.find((r) => r.ruleId === ruleId && r.status !== 'RETIRED');
  if (!found) throw new Error(`Exception rule ${ruleId} is not in the catalogue`);
  return found;
}

function periodOf(entry: ExceptionEntryInput): string {
  return entry.period || entry.date.slice(0, 7);
}

function sourceRef(entry: ExceptionEntryInput): string {
  return entry.provenance
    ? `${entry.provenance.batchId} · row ${entry.provenance.sourceRow}`
    : `entry ${entry.id}`;
}

function evidenceOf(entries: readonly ExceptionEntryInput[]): {
  evidenceRows: string[];
  metadata: Record<string, unknown>;
} {
  return {
    evidenceRows: entries.map((x) => x.id),
    metadata: { sourceRefs: entries.map(sourceRef) },
  };
}

/** Journal identity: explicit journal id, else the voucher/reference. */
function journalKeyOf(entry: ExceptionEntryInput): string | null {
  const key = (entry.journalId || entry.reference || '').trim();
  return key.length > 0 ? key : null;
}

function dayMs(date: string): number {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function median(values: readonly Decimal[]): Decimal {
  const sorted = [...values].sort((a, b) => a.comparedTo(b));
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid]!;
  return sorted[mid - 1]!.plus(sorted[mid]!).dividedBy(2);
}

export function runExceptionRules(
  entries: readonly ExceptionEntryInput[],
  options: ExceptionRunOptions = {}
): ExceptionRunResult {
  const opts: Required<ExceptionRunOptions> = { ...DEFAULT_OPTIONS, ...options };
  const sorted = [...entries].sort((a, b) =>
    `${a.date}|${a.accountCode}|${a.id}`.localeCompare(`${b.date}|${b.accountCode}|${b.id}`)
  );
  const findings: ExceptionFinding[] = [];
  const push = (f: ExceptionFinding) => findings.push(f);

  // ---- Journal grouping (shared by R-006/R-008) --------------------------
  const journals = new Map<string, ExceptionEntryInput[]>();
  let skippedJournalEntries = 0;
  for (const entry of sorted) {
    const key = journalKeyOf(entry);
    if (key === null) {
      skippedJournalEntries += 1;
      continue;
    }
    const group = journals.get(key);
    if (group) group.push(entry);
    else journals.set(key, [entry]);
  }

  // ---- R-006 unbalanced journal / R-008 one-sided journal ----------------
  for (const [journalId, lines] of [...journals.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const totalDebit = lines.reduce((sum, x) => sum.plus(toDecimal(x.debit)), new Decimal(0));
    const totalCredit = lines.reduce((sum, x) => sum.plus(toDecimal(x.credit)), new Decimal(0));
    const net = totalDebit.minus(totalCredit);
    const periodKey = periodOf(lines[0]!);
    if (!net.isZero()) {
      push(
        createFinding({
          rule: rule('R-006'),
          targetId: journalId,
          periodKey,
          observedValue: net.toNumber(),
          expectedValue: 0,
          message: `Journal ${journalId} is out of balance by ${net.toString()} (debits ${totalDebit.toString()} vs credits ${totalCredit.toString()}). Worth a second look — not a confirmed error.`,
          ...evidenceOf(lines),
        })
      );
    }
    if (lines.length >= 2 && (totalDebit.isZero() || totalCredit.isZero())) {
      push(
        createFinding({
          rule: rule('R-008'),
          targetId: journalId,
          periodKey,
          observedValue: lines.length,
          message: `Journal ${journalId} posts only ${totalDebit.isZero() ? 'credits' : 'debits'} across ${lines.length} lines. Worth a second look — not a confirmed error.`,
          ...evidenceOf(lines),
        })
      );
    }
  }

  // ---- R-007 possible duplicate entry ------------------------------------
  const dupGroups = new Map<string, ExceptionEntryInput[]>();
  for (const entry of sorted) {
    const key = [
      entry.accountCode,
      entry.date,
      toDecimal(entry.debit).toString(),
      toDecimal(entry.credit).toString(),
      (entry.reference || '').trim(),
    ].join('|');
    const group = dupGroups.get(key);
    if (group) group.push(entry);
    else dupGroups.set(key, [entry]);
  }
  for (const [key, group] of [...dupGroups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (group.length < 2) continue;
    const [accountCode, date, debit, credit, reference] = key.split('|') as [
      string,
      string,
      string,
      string,
      string,
    ];
    push(
      createFinding({
        rule: rule('R-007'),
        targetId: accountCode,
        periodKey: periodOf(group[0]!),
        qualifier: `${date}|${debit}|${credit}|${reference}`,
        observedValue: group.length,
        message: `${group.length} entries share account ${accountCode}, date ${date}, debit ${debit}, credit ${credit}, reference "${reference}". Possible duplicates — a reviewer decides, not this rule.`,
        ...evidenceOf(group),
      })
    );
  }

  // ---- Per-entry rules R-009…R-014 ---------------------------------------
  const roundMin = toDecimal(opts.roundAmountMin);
  const roundMultiple = toDecimal(opts.roundAmountMultiple);
  for (const entry of sorted) {
    const debit = toDecimal(entry.debit);
    const credit = toDecimal(entry.credit);
    const periodKey = periodOf(entry);
    const base = {
      targetId: entry.accountCode,
      periodKey,
      qualifier: entry.id,
      ...evidenceOf([entry]),
    };

    if (debit.greaterThan(0) && credit.greaterThan(0)) {
      push(
        createFinding({
          rule: rule('R-009'),
          ...base,
          observedValue: `${debit.toString()} / ${credit.toString()}`,
          message: `Entry carries both a debit (${debit.toString()}) and a credit (${credit.toString()}) on one line. Worth a second look — not a confirmed error.`,
        })
      );
    }
    if (debit.isZero() && credit.isZero()) {
      push(
        createFinding({
          rule: rule('R-010'),
          ...base,
          observedValue: 0,
          message:
            'Entry has zero debit and zero credit. Worth a second look — not a confirmed error.',
        })
      );
    }
    const largest = Decimal.max(debit.abs(), credit.abs());
    if (largest.greaterThanOrEqualTo(roundMin) && largest.modulo(roundMultiple).isZero()) {
      push(
        createFinding({
          rule: rule('R-011'),
          ...base,
          observedValue: largest.toNumber(),
          message: `Large round amount ${largest.toString()} (≥ ${roundMin.toString()}, multiple of ${roundMultiple.toString()}). Worth a second look — not a confirmed error.`,
        })
      );
    }
    const weekday = new Date(dayMs(entry.date)).getUTCDay();
    if (weekday === 0 || weekday === 6) {
      push(
        createFinding({
          rule: rule('R-012'),
          ...base,
          observedValue: entry.date,
          message: `Entry dated ${entry.date} falls on a ${weekday === 0 ? 'Sunday' : 'Saturday'}. Worth a second look — not a confirmed error.`,
        })
      );
    }
    if (entry.period && entry.period !== entry.date.slice(0, 7)) {
      push(
        createFinding({
          rule: rule('R-013'),
          ...base,
          observedValue: entry.period,
          expectedValue: entry.date.slice(0, 7),
          message: `Posting period ${entry.period} differs from the entry-date month ${entry.date.slice(0, 7)}. Worth a second look — not a confirmed error.`,
        })
      );
    }
    if (!(entry.description || '').trim() || !(entry.reference || '').trim()) {
      const missing = [
        !(entry.description || '').trim() ? 'description' : null,
        !(entry.reference || '').trim() ? 'reference' : null,
      ]
        .filter(Boolean)
        .join(' and ');
      push(
        createFinding({
          rule: rule('R-014'),
          ...base,
          observedValue: missing,
          message: `Entry is missing its ${missing}. Worth a second look — not a confirmed error.`,
        })
      );
    }
  }

  // ---- R-015 dormancy / R-016 new account / R-017 outliers ---------------
  const byAccount = new Map<string, ExceptionEntryInput[]>();
  for (const entry of sorted) {
    const group = byAccount.get(entry.accountCode);
    if (group) group.push(entry);
    else byAccount.set(entry.accountCode, [entry]);
  }
  const allPeriods = [...new Set(sorted.map(periodOf))].sort();
  const latestPeriod = allPeriods[allPeriods.length - 1];

  for (const [accountCode, lines] of [...byAccount.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  )) {
    // R-015: consecutive postings (already date-sorted) with a long gap
    for (let i = 1; i < lines.length; i += 1) {
      const gapDays = Math.round((dayMs(lines[i]!.date) - dayMs(lines[i - 1]!.date)) / 86_400_000);
      if (gapDays > opts.dormancyDays) {
        push(
          createFinding({
            rule: rule('R-015'),
            targetId: accountCode,
            periodKey: periodOf(lines[i]!),
            qualifier: lines[i]!.id,
            observedValue: gapDays,
            message: `Account ${accountCode} was silent for ${gapDays} days before posting on ${lines[i]!.date}. Worth a second look — not a confirmed error.`,
            ...evidenceOf([lines[i]!]),
          })
        );
      }
    }

    // R-016: first posting in the ledger's latest period
    if (latestPeriod && allPeriods.length >= 2 && periodOf(lines[0]!) === latestPeriod) {
      push(
        createFinding({
          rule: rule('R-016'),
          targetId: accountCode,
          periodKey: latestPeriod,
          observedValue: lines[0]!.date,
          message: `Account ${accountCode} first posts in the latest period (${latestPeriod}). Worth a second look — not a confirmed error.`,
          ...evidenceOf([lines[0]!]),
        })
      );
    }

    // R-017: median/MAD outlier against the account's own amounts
    if (lines.length >= opts.outlierMinEntries) {
      const amounts = lines.map((x) => toDecimal(x.debit).minus(toDecimal(x.credit)).abs());
      const med = median(amounts);
      const deviations = amounts.map((x) => x.minus(med).abs());
      const mad = median(deviations);
      const limit = mad.times(opts.outlierMadFactor);
      lines.forEach((entry, i) => {
        const dev = deviations[i]!;
        const flagged = mad.isZero() ? !amounts[i]!.equals(med) : dev.greaterThan(limit);
        if (flagged) {
          push(
            createFinding({
              rule: rule('R-017'),
              targetId: accountCode,
              periodKey: periodOf(entry),
              qualifier: entry.id,
              observedValue: amounts[i]!.toNumber(),
              expectedValue: med.toNumber(),
              deviation: dev.toNumber(),
              message: `Amount ${amounts[i]!.toString()} is far from account ${accountCode}'s median ${med.toString()} (deviation ${dev.toString()}, MAD ${mad.toString()}). Worth a second look — not a confirmed error.`,
              ...evidenceOf([entry]),
            })
          );
        }
      });
    }
  }

  findings.sort((a, b) => a.findingKey.localeCompare(b.findingKey));
  return {
    findings,
    examinedEntries: sorted.length,
    skippedJournalEntries,
    options: opts,
  };
}
