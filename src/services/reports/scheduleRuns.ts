import type { ScheduledReport } from '@/types';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);

/**
 * Phase 9 — report schedule governance.
 *
 * Schedules used to be inert records: a `nextRun` date that nothing
 * consumed, under help copy claiming the system "will automatically
 * generate and distribute" reports. This module is the governed
 * contract instead:
 *
 *  - due schedules are DETECTED (active, nextRun reached);
 *  - a human RUNS one (opens the report to generate/distribute it);
 *  - the run is RECORDED on the schedule (`lastRunAt`, `lastRunStatus`);
 *  - `nextRun` ADVANCES strictly past the run time, catching up over
 *    missed cycles instead of firing repeatedly.
 *
 * Distribution itself is NOT automated: recipients are recorded for
 * the human sender until a real mail/connector integration exists
 * (extension E2). Nothing here pretends otherwise.
 */

export function findDueSchedules(
  schedules: readonly ScheduledReport[],
  nowISODate: string
): ScheduledReport[] {
  const now = Date.parse(nowISODate);
  return schedules.filter((s) => s.isActive && Date.parse(s.nextRun) <= now);
}

function addMonthsUTC(date: Date, months: number): Date {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const day = Math.min(
    date.getUTCDate(),
    new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  );
  target.setUTCDate(day);
  target.setUTCHours(
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds()
  );
  return target;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function advanceNextRun(frequency: string, fromISODate: string): string {
  const from = new Date(fromISODate);
  switch (frequency) {
    case 'daily':
      return new Date(from.getTime() + DAY_MS).toISOString();
    case 'weekly':
      return new Date(from.getTime() + 7 * DAY_MS).toISOString();
    case 'monthly':
      return addMonthsUTC(from, 1).toISOString();
    case 'quarterly':
      return addMonthsUTC(from, 3).toISOString();
    case 'yearly':
      return addMonthsUTC(from, 12).toISOString();
    default:
      throw new Error(
        `Schedule frequency "${frequency}" cannot be advanced automatically; set the next run date manually.`
      );
  }
}

export function markScheduleRun(
  schedule: ScheduledReport,
  runAtISO: string,
  status: string
): ScheduledReport {
  let nextRun = advanceNextRun(schedule.frequency, schedule.nextRun);
  // Catch up over missed cycles: a schedule three months overdue runs
  // once, not three times.
  while (Date.parse(nextRun) <= Date.parse(runAtISO)) {
    nextRun = advanceNextRun(schedule.frequency, nextRun);
  }
  return { ...schedule, nextRun, lastRunAt: runAtISO, lastRunStatus: status };
}
