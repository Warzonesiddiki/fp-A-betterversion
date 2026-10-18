import { toDecimal, roundTo } from '@/utils/money';
import { deriveOpenItemAging, type AgingEntry } from './openItemAging';

/**
 * Phase 10 — 13-week expected-settlement ladder.
 *
 * The cash page long declared a forward forecast unavailable because
 * "the GL carries no A/R or A/P aging". The aging now exists
 * (`deriveOpenItemAging`); this ladder is what it honestly supports:
 *
 *  - each open item is expected to settle on an ASSUMED due date =
 *    posting date + terms (default 30 days, caller-settable);
 *  - already-overdue items are placed in week 1;
 *  - the running line starts from the actual cash-account balance at
 *    the as-of date;
 *  - items due beyond week 13 are totalled and disclosed, not dropped.
 *
 * The assumptions travel with the result (`assumptions`) so any
 * surface rendering the ladder states them next to the numbers. This
 * is an aging-based expectation, not a promise: the GL carries no
 * due dates, no payroll calendar and no debt-service schedule, and
 * those remain outside this ladder.
 */

export interface LadderWeek {
  week: number;
  /** ISO date the week starts (week 1 starts on the as-of date). */
  weekStarting: string;
  expectedCollections: number;
  expectedPayments: number;
  net: number;
  runningCash: number;
}

export interface SettlementLadder {
  asOf: string;
  openingCash: number;
  weeks: LadderWeek[];
  beyondHorizon: { collections: number; payments: number };
  assumptions: string[];
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * 86_400_000);
  return d.toISOString().slice(0, 10);
}

export function deriveSettlementLadder(
  entries: readonly AgingEntry[],
  options: {
    asOf: string;
    arTermsDays?: number;
    apTermsDays?: number;
    cashAccount?: string;
  }
): SettlementLadder {
  const { asOf } = options;
  const arTerms = options.arTermsDays ?? 30;
  const apTerms = options.apTermsDays ?? 30;
  const cashAccount = options.cashAccount ?? '1000';

  const aging = deriveOpenItemAging(entries, asOf);

  let opening = toDecimal(0);
  for (const e of entries) {
    if (e.accountCode === cashAccount && (e.date ?? '') !== '' && (e.date ?? '') <= asOf) {
      opening = opening.plus(toDecimal(e.debit ?? 0)).minus(toDecimal(e.credit ?? 0));
    }
  }

  const collections = new Array(13).fill(0) as number[];
  const payments = new Array(13).fill(0) as number[];
  let beyondCollections = toDecimal(0);
  let beyondPayments = toDecimal(0);

  for (const item of aging.items) {
    const due = addDays(item.date, item.kind === 'AR' ? arTerms : apTerms);
    const daysOut = Math.floor(
      (Date.parse(`${due}T00:00:00Z`) - Date.parse(`${asOf}T00:00:00Z`)) / 86_400_000
    );
    const weekIndex = daysOut <= 0 ? 1 : Math.ceil(daysOut / 7);
    if (weekIndex > 13) {
      if (item.kind === 'AR') beyondCollections = beyondCollections.plus(toDecimal(item.amount));
      else beyondPayments = beyondPayments.plus(toDecimal(item.amount));
    } else if (item.kind === 'AR') {
      collections[weekIndex - 1] = roundTo(
        toDecimal(collections[weekIndex - 1] ?? 0).plus(toDecimal(item.amount)),
        2
      );
    } else {
      payments[weekIndex - 1] = roundTo(
        toDecimal(payments[weekIndex - 1] ?? 0).plus(toDecimal(item.amount)),
        2
      );
    }
  }

  let running = opening;
  const weeks: LadderWeek[] = collections.map((c, i) => {
    const net = toDecimal(c).minus(toDecimal(payments[i] ?? 0));
    running = running.plus(net);
    return {
      week: i + 1,
      weekStarting: addDays(asOf, i * 7),
      expectedCollections: c,
      expectedPayments: payments[i] ?? 0,
      net: roundTo(net, 2),
      runningCash: roundTo(running, 2),
    };
  });

  return {
    asOf,
    openingCash: roundTo(opening, 2),
    weeks,
    beyondHorizon: {
      collections: roundTo(beyondCollections, 2),
      payments: roundTo(beyondPayments, 2),
    },
    assumptions: [
      `Receivables assumed collected on ${arTerms}-day terms from posting; payables assumed paid on ${apTerms}-day terms from posting (the GL carries no due dates).`,
      'Overdue open items are placed in week 1. Payroll, debt service and other scheduled outflows are not in this ladder.',
      'Open items are GL-derived: settlements matched by document reference, then FIFO (see aging derivation).',
    ],
  };
}
