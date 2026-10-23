/**
 * ConnectorImportEngine — pure mapping from connector-pulled transactions into
 * GL journal-entry rows (2026-08-12).
 *
 * Bridges the Integrations hub (`src/services/api-integration` external data
 * shapes) and the canonical ledger import path (`glStore.importGLData`): a
 * connector's `ExternalTransaction[]` becomes the `Partial<GLEntry>[]` rows
 * the GL import pipeline validates, de-duplicates, and stores.
 *
 * Scope: transaction (actuals) import only. Chart-of-accounts sync, invoice
 * mapping, and budget sync are out of scope for v1 and documented as such.
 *
 * MONEY: external amounts are passed through unmodified (the connectors round
 * to cents where they aggregate); debit/credit assignment is pure assignment,
 * not arithmetic. No float arithmetic and no raw `toFixed` — the downstream
 * `normalizeGLEntry` (glStore) performs the money-exact net-change math.
 */

import type { ExternalTransaction } from '@/services/api-integration/types';

export interface JournalEntryRow {
  accountCode: string;
  date: string;
  debit: number;
  credit: number;
  description: string;
  reference?: string;
}

export interface ConnectorImportResult {
  rows: JournalEntryRow[];
  skipped: number;
}

export interface ConnectorImportOptions {
  /** Cap on rows mapped per provider (safety valve, not a truncation). */
  maxRows?: number;
}

const DEFAULT_MAX_ROWS = 5_000;

/**
 * Map external transactions to GL journal-entry rows.
 *
 * Skip rules (each increments `skipped` and is honest about why):
 * - non-finite or non-positive amount (a 0/NaN amount row is noise, not data)
 * - missing date (the GL pipeline requires a posting date)
 * - missing account id (the GL pipeline requires an account code)
 */
export function buildJournalEntries(
  transactions: readonly ExternalTransaction[],
  sourceProvider: string,
  options: ConnectorImportOptions = {}
): ConnectorImportResult {
  const maxRows = options.maxRows ?? DEFAULT_MAX_ROWS;
  const rows: JournalEntryRow[] = [];
  let skipped = 0;

  for (const txn of transactions) {
    const amount = txn.amount;
    if (!Number.isFinite(amount) || amount <= 0) {
      skipped += 1;
      continue;
    }
    const date = String(txn.date ?? '').trim();
    if (!date) {
      skipped += 1;
      continue;
    }
    const accountCode = String(txn.accountId ?? '').trim();
    if (!accountCode) {
      skipped += 1;
      continue;
    }
    if (rows.length >= maxRows) {
      skipped += 1;
      continue;
    }

    rows.push({
      accountCode,
      date,
      debit: txn.type === 'debit' ? amount : 0,
      credit: txn.type === 'credit' ? amount : 0,
      description: `${sourceProvider}: ${txn.description || 'connector transaction'}`.slice(0, 300),
      reference: txn.reference ?? txn.externalId,
    });
  }

  return { rows, skipped };
}
