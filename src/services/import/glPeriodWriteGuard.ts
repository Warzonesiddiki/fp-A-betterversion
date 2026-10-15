/** DEC-008: pure, conservative GL write policy against the local close authority. */
import type { GLEntry } from '@/types';
import type { PeriodCloseEntry } from '@/engines/PeriodCloseStateMachine';
import { parseImportDate } from '@/utils/parseImportDate';

export interface FiscalCloseScope {
  readonly startDate: string;
  readonly endDate: string;
  readonly isAdjustingPeriod: boolean;
}

export interface GLPeriodAuthority {
  readonly entries: Readonly<Record<string, PeriodCloseEntry>>;
  readonly checklists: Readonly<Record<string, { readonly fiscalScope?: FiscalCloseScope }>>;
}

export interface GLPeriodWriteIssue {
  /** Input index, or -1 for an authority-wide failure. */
  readonly index: number;
  readonly reason: string;
}

/**
 * Unknown entity means all entities are candidates, never an invented default.
 * No close records after successful hydration means no local close restrictions.
 * Soft-close is read-only too: corrections require an explicit audited reopen.
 * Unmapped legacy scopes and overlapping/adjusting ranges fail closed for review.
 */
export function getGLPeriodWriteIssues(
  rows: readonly Partial<GLEntry>[],
  authority: GLPeriodAuthority,
  hydrated: boolean
): GLPeriodWriteIssue[] {
  if (rows.length === 0) return [];
  if (!hydrated) {
    return [
      {
        index: -1,
        reason: 'Period-close state is not loaded. Retry after storage hydration succeeds.',
      },
    ];
  }
  const records = Object.values(authority.entries);
  if (records.length === 0) return [];
  const issues: GLPeriodWriteIssue[] = [];
  rows.forEach((row, index) => {
    // A legacy display label in `entity` is not a verified entity ID.
    const entity = row.entityId;
    const candidates = records.filter(
      (entry) => !entity || !entry.entityId || entry.entityId === entity
    );
    if (candidates.length === 0) return;
    const date = parseImportDate(row.postDate || row.date || '');
    if (!date) {
      issues.push({
        index,
        reason: 'Cannot resolve posting date against the fiscal close calendar.',
      });
      return;
    }
    if (
      (row.date && row.postDate && parseImportDate(row.date) !== date) ||
      (row.period && /^\d{4}-\d{2}$/.test(row.period) && row.period !== date.slice(0, 7))
    ) {
      issues.push({
        index,
        reason:
          'Conflicting posting date or calendar-month metadata. Correct the source before changing GL data.',
      });
      return;
    }
    const matches: PeriodCloseEntry[] = [];
    for (const entry of candidates) {
      const scope = authority.checklists[entry.periodId]?.fiscalScope;
      if (
        !scope ||
        parseImportDate(scope.startDate) !== scope.startDate ||
        parseImportDate(scope.endDate) !== scope.endDate ||
        scope.startDate > scope.endDate
      ) {
        issues.push({
          index,
          reason: `Fiscal scope for ${entry.periodId} is unavailable or invalid. Validate the calendar before changing GL data.`,
        });
        return;
      }
      const inRange = date >= scope.startDate && date <= scope.endDate;
      if (!inRange && (row.fiscalPeriod === entry.periodId || row.period === entry.periodId)) {
        issues.push({
          index,
          reason: `Posting date is outside the declared fiscal period ${entry.periodId}.`,
        });
        return;
      }
      if (inRange) matches.push(entry);
    }
    if (matches.length > 1) {
      issues.push({
        index,
        reason:
          'Posting date matches multiple fiscal close periods. Resolve the entity/adjusting-period ambiguity before changing GL data.',
      });
      return;
    }
    const match = matches[0];
    if (match && match.state !== 'open') {
      issues.push({
        index,
        reason: `Fiscal period ${match.periodId} is ${match.state}. An authorized audited reopen is required before changing GL data.`,
      });
    }
  });
  return issues;
}
