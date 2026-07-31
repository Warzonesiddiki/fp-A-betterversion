/**
 * Event-sourced financial audit ledger (Omega Protocol §3).
 *
 * Append-only event store with a SHA-256 hash chain (reusing the synchronous,
 * NIST-verified `sha256Hex`), ULID time-sortable event IDs, and CQRS
 * correlation/causation IDs for end-to-end tracing. Current state is a DERIVED
 * projection — replaying the event stream yields the balance at any point in
 * time, which is what an audit or dispute actually needs.
 *
 * This is a NEW store alongside `auditTrailStore`; it does not rewrite or weaken
 * the existing tamper-evident chain. Like the existing chain it is tamper-
 * EVIDENT (detects mutation/reorder/truncation), not keyed by an external
 * secret — the keyed-HMAC hardening (N-0010) remains the same open architectural
 * item for both.
 */

import Decimal from 'decimal.js';
import { sha256Hex } from '@/utils/sha256';

// ── Event vocabulary (extensible union) ──────────────────────────────────────
export interface BalanceAdjustedEvent {
  readonly type: 'BALANCE_ADJUSTED';
  readonly accountId: string;
  /** Decimal string (cents-safe) so projection is float-free. */
  readonly delta: string;
  readonly reason: string;
}

export interface ConsolidationExecutedEvent {
  readonly type: 'CONSOLIDATION_EXECUTED';
  readonly parentId: string;
  readonly childIds: readonly string[];
  readonly snapshot: string;
}

export interface AllocationPerformedEvent {
  readonly type: 'ALLOCATION_PERFORMED';
  readonly sourceId: string;
  readonly allocations: readonly string[];
}

export type FinancialEvent =
  | BalanceAdjustedEvent
  | ConsolidationExecutedEvent
  | AllocationPerformedEvent;

/** Context carried across the events one user action produces. */
export interface EventContext {
  /** Traces a single user action end-to-end (the request that started it). */
  readonly correlationId: string;
  /** The event that CAUSED this one (event chaining), or null for a root. */
  readonly causationId: string | null;
  /** Hashed actor identity — never raw PII in the ledger. */
  readonly actorHash: string;
}

export interface LedgerEntry {
  readonly eventId: string; // ULID — time-sortable, unique
  readonly timestamp: string; // ISO 8601
  readonly correlationId: string;
  readonly causationId: string | null;
  readonly actorHash: string;
  readonly event: FinancialEvent;
  readonly prevHash: string;
  readonly hash: string;
}

export const LEDGER_GENESIS_HASH = '0'.repeat(64);

// ── ULID (Crockford base32, 26 chars, time-sortable, no dependency) ──────────
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function encodeTime(ms: number): string {
  let t = BigInt(ms);
  const chars: string[] = [];
  for (let i = 9; i >= 0; i--) {
    chars[i] = CROCKFORD.charAt(Number(t & 31n));
    t >>= 5n;
  }
  return chars.join('');
}

function encodeRandom(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  let s = '';
  for (let i = 0; i < 16; i++) s += CROCKFORD.charAt(buf[i]! % 32); // 256 % 32 === 0 → no bias
  return s;
}

/** Generate a 26-char ULID. `now` is injectable for deterministic tests. */
export function ulid(now: number = Date.now()): string {
  return encodeTime(now) + encodeRandom();
}

// ── Deterministic serialization for the hash chain ──────────────────────────
function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`)
    .join(',')}}`;
}

type UnsignedEntry = Omit<LedgerEntry, 'hash'>;

/** Accepts an unsigned entry OR a full entry; the `hash` (if present) is stripped
 * so an entry's hash is never computed over its own hash (circular). */
type HashableEntry = UnsignedEntry & { readonly hash?: string };

function computeHash(prevHash: string, entry: HashableEntry): string {
  const { hash: _omitted, ...record } = entry;
  void _omitted;
  return sha256Hex(`${prevHash}|${canonicalize(record)}`);
}

export interface ChainVerification {
  readonly valid: boolean;
  /** Index of the first broken link, or null if the whole chain holds. */
  readonly brokenAt: number | null;
  readonly reason: string | null;
}

/**
 * Append-only event ledger. Entries are frozen; the only mutator is `append`.
 * Use `project` to derive state by replaying the stream.
 */
export class EventLedger {
  private readonly entries: LedgerEntry[] = [];
  private chainHead: string = LEDGER_GENESIS_HASH;

  /** Append an event and return the frozen, hash-chained entry. */
  append(event: FinancialEvent, ctx: EventContext, now: number = Date.now()): LedgerEntry {
    const unsigned: UnsignedEntry = {
      eventId: ulid(now),
      timestamp: new Date(now).toISOString(),
      correlationId: ctx.correlationId,
      causationId: ctx.causationId,
      actorHash: ctx.actorHash,
      event,
      prevHash: this.chainHead,
    };
    const entry: LedgerEntry = { ...unsigned, hash: computeHash(this.chainHead, unsigned) };
    this.entries.push(Object.freeze(entry) as LedgerEntry);
    this.chainHead = entry.hash;
    return entry;
  }

  /** Immutable snapshot of the stream. */
  get stream(): readonly LedgerEntry[] {
    return this.entries;
  }

  get head(): string {
    return this.chainHead;
  }

  get length(): number {
    return this.entries.length;
  }

  /** Walk the chain; flag mutation, reordering, or truncation. */
  verify(): ChainVerification {
    let prev = LEDGER_GENESIS_HASH;
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i]!;
      if (entry.prevHash !== prev) {
        return { valid: false, brokenAt: i, reason: `prevHash mismatch at index ${i}` };
      }
      const expected = computeHash(prev, entry);
      if (expected !== entry.hash) {
        return { valid: false, brokenAt: i, reason: `hash mismatch at index ${i} (tampered)` };
      }
      prev = entry.hash;
    }
    if (prev !== this.chainHead) {
      return { valid: false, brokenAt: null, reason: 'chainHead does not match newest entry' };
    }
    return { valid: true, brokenAt: null, reason: null };
  }

  /**
   * CQRS projection: fold events in stream order (optionally up to `asOfMs`)
   * into a derived read-model. Replay of the same stream always yields the
   * same state (idempotent derivation).
   */
  project<T>(fold: (state: T, entry: LedgerEntry) => T, seed: T, asOfMs?: number): T {
    let state = seed;
    for (const entry of this.entries) {
      if (asOfMs !== undefined && Date.parse(entry.timestamp) > asOfMs) break;
      state = fold(state, entry);
    }
    return state;
  }

  /** Convenience read-model: per-account balances from BALANCE_ADJUSTED events. */
  projectBalances(asOfMs?: number): Record<string, Decimal> {
    return this.project(
      (balances, entry) => {
        if (entry.event.type !== 'BALANCE_ADJUSTED') return balances;
        const acct = entry.event.accountId;
        const next = (balances[acct] ?? new Decimal(0)).plus(entry.event.delta);
        return { ...balances, [acct]: next };
      },
      {} as Record<string, Decimal>,
      asOfMs
    );
  }

  /** Persist the stream (e.g. into a Zustand-backed store). */
  serialize(): { entries: readonly LedgerEntry[]; chainHead: string } {
    return { entries: this.entries.map((e) => e), chainHead: this.chainHead };
  }

  /** Rehydrate. The rehydrated chain must still verify — tampered payloads won't. */
  static deserialize(serialized: {
    entries: readonly LedgerEntry[];
    chainHead: string;
  }): EventLedger {
    const ledger = new EventLedger();
    for (const entry of serialized.entries) {
      ledger.entries.push(Object.freeze({ ...entry }) as LedgerEntry);
    }
    ledger.chainHead = serialized.chainHead;
    return ledger;
  }
}
