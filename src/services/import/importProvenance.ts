/**
 * Import provenance primitives (Gate 2 vertical slice: FR-002 / FR-003 /
 * FR-004 / FR-005 in docs/discovery/requirements-register.md).
 *
 * Everything here is pure and deterministic: same inputs → same outputs,
 * regardless of wall clock, store state or platform. The GL store calls these
 * from `importGLData`; the upload page calls `hashFileBytes` when a file is
 * read. No persistence decision (DEC-005) is baked in — provenance travels
 * on the entry itself, so it survives whichever store of record is chosen.
 */

import type { GLEntry, GLEntryProvenance, ImportControlTotals, ImportScope } from '@/types';
import { sha256Hex, sha256HexBytes } from '@/utils/sha256';
import { subtractMoney, sumMoney } from '@/utils/money';

/** SHA-256 of raw file bytes — the file's identity for duplicate detection. */
export function hashFileBytes(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return sha256HexBytes(view);
}

/**
 * Content hash for imports that do not come from a file (connectors, API).
 * Canonicalises each row to the fields that define a GL line so that key
 * order, undefined values and unrelated metadata do not change the hash.
 */
export function hashRowContent(rows: readonly Partial<GLEntry>[]): string {
  const canonical = rows.map((r) => [
    String(r.accountCode ?? r.accountId ?? ''),
    String(r.postDate ?? r.date ?? ''),
    r.debit === undefined ? '' : String(r.debit),
    r.credit === undefined ? '' : String(r.credit),
    r.amount === undefined ? '' : String(r.amount),
    String(r.description ?? ''),
    String(r.reference ?? ''),
    String(r.entityId ?? ''),
    String(r.departmentId ?? ''),
    String(r.journalId ?? ''),
    r.journalLine === undefined ? '' : String(r.journalLine),
  ]);
  return sha256Hex(JSON.stringify(canonical));
}

/**
 * Deterministic batch id. Two imports of the same content at the same
 * instant get the same id; a re-import of the same content later gets a
 * different id (and is rejected before reaching this point when the file
 * hash is already in history).
 */
export function makeBatchId(fileHash: string, importedAtISO: string): string {
  return `batch-${sha256Hex(`${fileHash}\n${importedAtISO}`).slice(0, 20)}`;
}

/** Attach provenance to every entry. `sourceRows[i]` is the 1-based source-file row of `entries[i]`. */
export function stampProvenance<T extends Partial<GLEntry>>(
  entries: readonly T[],
  batch: { batchId: string; fileHash: string; sourceFile: string },
  sourceRows: readonly number[]
): Array<T & { provenance: GLEntryProvenance }> {
  if (sourceRows.length !== entries.length) {
    throw new Error(
      `stampProvenance: sourceRows length ${sourceRows.length} does not match entries length ${entries.length}`
    );
  }
  return entries.map((entry, i) => ({
    ...entry,
    provenance: {
      batchId: batch.batchId,
      fileHash: batch.fileHash,
      sourceFile: batch.sourceFile,
      sourceRow: sourceRows[i]!,
    },
  }));
}

/** Default source-row numbers when the caller did not supply any: header is row 1, data starts at row 2. */
export function defaultSourceRows(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i + 2);
}

/**
 * Control totals computed independently of the trial-balance engine, with
 * the decimal money primitive, so a reviewer can tie the batch out against
 * the source system's own totals (FR-004). Returned as decimal strings —
 * never floats.
 */
export function computeControlTotals(
  entries: readonly Pick<GLEntry, 'debit' | 'credit'>[]
): ImportControlTotals {
  const debit = sumMoney(entries.map((e) => e.debit));
  const credit = sumMoney(entries.map((e) => e.credit));
  return {
    rows: entries.length,
    debit: debit.toFixed(2),
    credit: credit.toFixed(2),
    net: subtractMoney(debit, credit).toFixed(2),
  };
}

/** Find a previous successful import of the same content, if any. */
export function findPriorImport<T extends { fileHash?: string; status: string; batchId?: string }>(
  history: readonly T[],
  fileHash: string
): T | undefined {
  if (!fileHash) return undefined;
  return history.find(
    (h) => h.fileHash === fileHash && (h.status === 'success' || h.status === 'partial')
  );
}

/**
 * What the committed rows cover (FR-001). Entity and currency are reported
 * as `'unavailable'` when no row carried them — the UI must say so rather
 * than imply a single-entity, single-currency file.
 */
export function computeImportScope(
  entries: readonly Pick<GLEntry, 'date' | 'postDate' | 'period' | 'entityId' | 'currency'>[],
  importedAtISO: string
): ImportScope {
  const periods = new Set<string>();
  const entities = new Set<string>();
  const currencies = new Set<string>();
  let from: string | null = null;
  let to: string | null = null;
  for (const e of entries) {
    const date = e.postDate || e.date || '';
    const period = e.period || date.slice(0, 7);
    if (period) periods.add(period);
    if (date) {
      if (from === null || date < from) from = date;
      if (to === null || date > to) to = date;
    }
    if (e.entityId) entities.add(e.entityId);
    if (e.currency) currencies.add(e.currency);
  }
  return {
    periods: [...periods].sort(),
    dateRange: from !== null && to !== null ? { from, to } : null,
    entities: entities.size > 0 ? [...entities].sort() : 'unavailable',
    currencies: currencies.size > 0 ? [...currencies].sort() : 'unavailable',
    importedAt: importedAtISO,
  };
}
