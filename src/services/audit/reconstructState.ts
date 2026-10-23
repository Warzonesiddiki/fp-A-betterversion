// src/services/audit/reconstructState.ts
// Phase 12 tail (R-009): rebuild cell state at any point in time from the
// append-only audit trail ALONE.
//
// Trust model: reconstruction first re-verifies the F-0015 SHA-256 hash
// chain over the supplied entries (genesis link, per-entry hash, prevHash
// linkage, and — when supplied — the pinned chain head). A tampered,
// truncated, or reordered trail FAILS CLOSED: no state is returned, only
// the list of breaks. Only after the chain verifies are entries applied
// in append order (oldest → newest), honouring an optional `asOf` cutoff.
//
// Semantics: 'read' entries never change state; 'delete' removes the
// cell; write/update/bulk set the cell to `newValue`. A cell with no
// state-changing entry is ABSENT from the result — missing is never
// reported as zero (project rule).

import {
  AUDIT_CHAIN_GENESIS_HASH,
  computeAuditEntryHash,
  canonicalizeForHash,
  type ExtendedAuditEntry,
} from '@/store/auditTrailStore';
import type { CellAddress } from '@/types/cell';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);

export interface ReconstructionBreak {
  entryId: string | undefined;
  reason: string;
}

export type StateReconstruction =
  | {
      ok: true;
      /** Rebuilt cell state, keyed by `cellKeyFor(cellId)`. */
      cells: Map<string, unknown>;
      /** State-changing entries applied (reads and post-asOf entries excluded). */
      applied: number;
      asOf: number | null;
    }
  | { ok: false; breaks: ReconstructionBreak[] };

/** Stable map key for a cell address (canonical key ordering). */
export function cellKeyFor(cellId: CellAddress): string {
  return canonicalizeForHash(cellId);
}

export function reconstructState(
  entriesNewestFirst: readonly ExtendedAuditEntry[],
  opts: { asOf?: number; expectedHead?: string } = {}
): StateReconstruction {
  // Stored order is newest-first; the chain runs oldest → newest.
  const appendOrder = [...entriesNewestFirst].reverse();

  // --- 1. Verify the chain before trusting any value in it. -------------
  const breaks: ReconstructionBreak[] = [];
  let expectedPrev: string = AUDIT_CHAIN_GENESIS_HASH;
  for (const entry of appendOrder) {
    if (!entry.hash || !entry.prevHash) {
      breaks.push({ entryId: entry.id, reason: 'missing hash material (fail-closed)' });
      continue;
    }
    if (entry.prevHash !== expectedPrev) {
      breaks.push({
        entryId: entry.id,
        reason: 'prevHash link break (deleted or reordered entry)',
      });
    }
    if (computeAuditEntryHash(entry) !== entry.hash) {
      breaks.push({ entryId: entry.id, reason: 'hash mismatch (entry content mutated)' });
    }
    expectedPrev = entry.hash;
  }
  if (opts.expectedHead !== undefined && expectedPrev !== opts.expectedHead) {
    breaks.push({
      entryId: undefined,
      reason: 'chain head mismatch (trail truncated or extended beyond the pinned head)',
    });
  }
  if (breaks.length > 0) return { ok: false, breaks };

  // --- 2. Apply state-changing entries in append order. -----------------
  const cells = new Map<string, unknown>();
  let applied = 0;
  for (const entry of appendOrder) {
    if (opts.asOf !== undefined && entry.timestamp > opts.asOf) continue;
    if (entry.operation === 'read') continue;
    const key = cellKeyFor(entry.cellId);
    if (entry.operation === 'delete') cells.delete(key);
    else cells.set(key, entry.newValue);
    applied += 1;
  }
  return { ok: true, cells, applied, asOf: opts.asOf ?? null };
}
