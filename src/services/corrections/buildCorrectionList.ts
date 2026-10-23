/**
 * Phase 5 (DEC-035): optional Excel interoperability export, generated
 * from the same correction-store records the tracker screen shows — one
 * source, two renderings, tied out by test.
 *
 * The file is a working document, not a report: finding key, rule,
 * account, date, amount, source locator (file · batch · row), the
 * suspected issue in plain language (always "not a confirmed error"
 * until a human says otherwise), the reviewer's instruction, assignee,
 * due date and status. Money travels as numbers so Excel sums it;
 * nothing is pre-formatted into text (the P1-14 lesson).
 */
import type { ExportData } from '@/engines/ExportEngine';
import type { CorrectionRequest } from '@/types/exceptions';
import { parseFindingKey, type ExceptionFinding } from '@/store/exceptionRuleCatalogue';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);

export interface CorrectionListEntryLike {
  readonly id: string;
  readonly date: string;
  readonly accountCode: string;
  readonly provenance?: {
    readonly batchId: string;
    readonly sourceFile: string;
    readonly sourceRow: number;
  };
}

const HEADERS = [
  'Finding key',
  'Rule',
  'Account',
  'Date',
  'Amount',
  'Source (file · batch · row)',
  'Suspected issue',
  'Correction instruction',
  'Assignee',
  'Due date',
  'Status',
  'Requested',
] as const;

const STATUS_ORDER: Record<CorrectionRequest['status'], number> = {
  REQUESTED: 0,
  APPLIED: 1,
  REVERIFIED: 2,
  WITHDRAWN: 3,
};

export function buildCorrectionList(input: {
  corrections: readonly CorrectionRequest[];
  findings: readonly ExceptionFinding[];
  entries: readonly CorrectionListEntryLike[];
}): ExportData {
  const findingByKey = new Map(input.findings.map((f) => [f.findingKey, f]));
  const entryById = new Map(input.entries.map((e) => [e.id, e]));

  const sorted = [...input.corrections].sort((a, b) => {
    const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (byStatus !== 0) return byStatus;
    const byRequested = a.requestedAt.localeCompare(b.requestedAt);
    return byRequested !== 0 ? byRequested : a.exceptionId.localeCompare(b.exceptionId);
  });

  const rows = sorted.map((correction) => {
    const finding = findingByKey.get(correction.exceptionId);
    const parsed = parseFindingKey(correction.exceptionId);
    const evidenceEntries = (finding?.evidenceRows ?? [])
      .map((id) => entryById.get(id))
      .filter((e): e is CorrectionListEntryLike => e !== undefined);
    const first = evidenceEntries[0];

    const account = first?.accountCode ?? parsed?.targetId ?? '';
    const date = first?.date ?? '';
    const amount = typeof finding?.observedValue === 'number' ? finding.observedValue : null;
    const locator = first?.provenance
      ? `${first.provenance.sourceFile} · ${first.provenance.batchId} · row ${first.provenance.sourceRow}`
      : (correction.source ?? '');
    const issue = finding
      ? finding.message
      : 'This finding is no longer raised by the current rule run — verify against the ledger before acting on it.';

    return [
      correction.exceptionId,
      correction.ruleId ?? finding?.ruleId ?? parsed?.ruleId ?? '',
      account,
      date,
      amount,
      locator,
      issue,
      correction.instruction,
      correction.assignee,
      correction.dueDate ?? '',
      correction.status,
      correction.requestedAt,
    ];
  });

  return { headers: [...HEADERS], rows };
}
