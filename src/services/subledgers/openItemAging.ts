import { toDecimal, roundTo } from '@/utils/money';

/**
 * Phase 10 — AR/AP open-item aging derived from the general ledger.
 *
 * A posted GL has no sub-ledger, but it does carry document
 * references and dates. The derivation is the standard GL-only
 * algorithm, with every approximation disclosed rather than hidden:
 *
 *  1. Charges (AR debits / AP credits) and settlements (AR credits /
 *     AP debits) in the control accounts (1100 / 2100) up to the
 *     as-of date.
 *  2. Settlements carrying the charge's reference settle that charge.
 *  3. Remaining settlements apply FIFO to the oldest open charges.
 *  4. Whatever remains is reported, not force-matched: open charges
 *     aged in buckets from their posting date, leftover settlements
 *     as "unapplied" totals.
 *
 * Control identity (test-pinned): open − unapplied = the control
 * account balance, for both AR and AP. Amounts are signed so AR open
 * items are positive amounts owed TO the business and AP open items
 * positive amounts owed BY it.
 */

export interface AgingEntry {
  accountCode?: string;
  date?: string;
  period?: string;
  debit?: number;
  credit?: number;
  reference?: string;
}

export type AgingBucket = '0-30' | '31-60' | '61-90' | '90+';

export interface OpenItem {
  kind: 'AR' | 'AP';
  accountCode: string;
  /** Document reference; '' means the charge carried none. */
  reference: string;
  /** Posting date of the (remaining) charge. */
  date: string;
  daysOutstanding: number;
  bucket: AgingBucket;
  amount: number;
}

export interface OpenItemAging {
  asOf: string;
  items: OpenItem[];
  buckets: Record<AgingBucket, { AR: number; AP: number }>;
  totals: { arOpen: number; apOpen: number; arUnapplied: number; apUnapplied: number };
}

const BUCKETS: AgingBucket[] = ['0-30', '31-60', '61-90', '90+'];

function bucketFor(days: number): AgingBucket {
  if (days <= 30) return '0-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '90+';
}

function daysBetween(fromDate: string, toDate: string): number {
  const ms = Date.parse(`${toDate}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`);
  return Math.max(0, Math.floor(ms / 86_400_000));
}

interface Charge {
  reference: string;
  date: string;
  remaining: ReturnType<typeof toDecimal>;
}

function ageOneSide(
  entries: readonly AgingEntry[],
  accountCode: string,
  kind: 'AR' | 'AP',
  asOf: string
): { items: OpenItem[]; unapplied: number } {
  const inScope = entries
    .filter((e) => e.accountCode === accountCode && (e.date ?? '') !== '' && (e.date ?? '') <= asOf)
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));

  const charges: Charge[] = [];
  const settlements: { reference: string; amount: ReturnType<typeof toDecimal> }[] = [];
  for (const e of inScope) {
    // AR: debit = charge, credit = settlement. AP is the mirror.
    const chargeAmount = kind === 'AR' ? toDecimal(e.debit ?? 0) : toDecimal(e.credit ?? 0);
    const settleAmount = kind === 'AR' ? toDecimal(e.credit ?? 0) : toDecimal(e.debit ?? 0);
    if (chargeAmount.greaterThan(0)) {
      charges.push({ reference: e.reference ?? '', date: e.date ?? '', remaining: chargeAmount });
    }
    if (settleAmount.greaterThan(0)) {
      settlements.push({ reference: e.reference ?? '', amount: settleAmount });
    }
  }

  let unapplied = toDecimal(0);
  const applyTo = (charge: Charge, amount: ReturnType<typeof toDecimal>) => {
    const used = charge.remaining.lessThan(amount) ? charge.remaining : amount;
    charge.remaining = charge.remaining.minus(used);
    return amount.minus(used);
  };

  for (const s of settlements) {
    let left = s.amount;
    if (s.reference !== '') {
      const match = charges.find((c) => c.reference === s.reference && c.remaining.greaterThan(0));
      if (match) left = applyTo(match, left);
    }
    if (left.greaterThan(0)) {
      // FIFO against the oldest open charges (charges are date-sorted).
      for (const c of charges) {
        if (left.lessThanOrEqualTo(0)) break;
        if (c.remaining.greaterThan(0)) left = applyTo(c, left);
      }
    }
    if (left.greaterThan(0)) unapplied = unapplied.plus(left);
  }

  const items: OpenItem[] = charges
    .filter((c) => c.remaining.greaterThan(0))
    .map((c) => {
      const days = daysBetween(c.date, asOf);
      return {
        kind,
        accountCode,
        reference: c.reference,
        date: c.date,
        daysOutstanding: days,
        bucket: bucketFor(days),
        amount: roundTo(c.remaining, 2),
      };
    });

  return { items, unapplied: roundTo(unapplied, 2) };
}

export function deriveOpenItemAging(
  entries: readonly AgingEntry[],
  asOf: string,
  accounts: { ar: string; ap: string } = { ar: '1100', ap: '2100' }
): OpenItemAging {
  const ar = ageOneSide(entries, accounts.ar, 'AR', asOf);
  const ap = ageOneSide(entries, accounts.ap, 'AP', asOf);

  const buckets = Object.fromEntries(BUCKETS.map((b) => [b, { AR: 0, AP: 0 }])) as Record<
    AgingBucket,
    { AR: number; AP: number }
  >;
  const items = [...ar.items, ...ap.items].sort((a, b) => b.daysOutstanding - a.daysOutstanding);
  for (const item of items) {
    buckets[item.bucket][item.kind] = roundTo(
      toDecimal(buckets[item.bucket][item.kind]).plus(toDecimal(item.amount)),
      2
    );
  }

  return {
    asOf,
    items,
    buckets,
    totals: {
      arOpen: roundTo(
        items.filter((i) => i.kind === 'AR').reduce((a, i) => a + i.amount, 0),
        2
      ),
      apOpen: roundTo(
        items.filter((i) => i.kind === 'AP').reduce((a, i) => a + i.amount, 0),
        2
      ),
      arUnapplied: ar.unapplied,
      apUnapplied: ap.unapplied,
    },
  };
}
