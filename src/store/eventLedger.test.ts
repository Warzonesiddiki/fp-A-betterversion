import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { EventLedger, ulid, LEDGER_GENESIS_HASH, type BalanceAdjustedEvent } from './eventLedger';

const CTX = { correlationId: 'req-1', causationId: null, actorHash: 'sha-actor-7' };
const bal = (accountId: string, delta: string, reason: string): BalanceAdjustedEvent => ({
  type: 'BALANCE_ADJUSTED',
  accountId,
  delta,
  reason,
});

describe('ulid', () => {
  it('is 26 chars over the Crockford alphabet', () => {
    const id = ulid(1_700_000_000_000);
    expect(id).toHaveLength(26);
    expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it('is time-sortable — earlier timestamps sort first', () => {
    const t1 = 1_700_000_000_000;
    const a = ulid(t1);
    const b = ulid(t1 + 60_000);
    expect(a < b).toBe(true);
  });

  it('is unique across many IDs at the same timestamp', () => {
    const ids = new Set(Array.from({ length: 2000 }, () => ulid(1_700_000_000_000)));
    expect(ids.size).toBe(2000);
  });
});

describe('EventLedger — append-only + hash chain', () => {
  it('appends frozen entries and advances the chain head', () => {
    const ledger = new EventLedger();
    expect(ledger.length).toBe(0);
    expect(ledger.head).toBe(LEDGER_GENESIS_HASH);

    const entry = ledger.append(bal('acc-1', '100.00', 'open'), CTX);
    expect(ledger.length).toBe(1);
    expect(ledger.head).toBe(entry.hash);
    expect(Object.isFrozen(entry)).toBe(true);
    expect(entry.prevHash).toBe(LEDGER_GENESIS_HASH);
    expect(entry.correlationId).toBe('req-1');
    expect(entry.causationId).toBeNull();
    expect(entry.actorHash).toBe('sha-actor-7');
  });

  it('verifies a clean chain', () => {
    const ledger = new EventLedger();
    ledger.append(bal('acc-1', '10', 'a'), CTX);
    ledger.append(bal('acc-1', '20', 'b'), CTX);
    ledger.append(bal('acc-2', '5', 'c'), CTX);
    expect(ledger.verify()).toEqual({ valid: true, brokenAt: null, reason: null });
  });

  it('detects a tampered payload (hash mismatch)', () => {
    const ledger = new EventLedger();
    ledger.append(bal('acc-1', '10', 'original'), CTX);
    ledger.append(bal('acc-1', '20', 'second'), CTX);
    const { entries, chainHead } = ledger.serialize();

    // Rebuild with a secretly-modified reason but the original (now-wrong) hash.
    const tampered = entries.map((e, i) =>
      i === 0 ? { ...e, event: { ...e.event, reason: 'COVER-UP' } } : e
    );
    const rebuilt = EventLedger.deserialize({ entries: tampered, chainHead });
    const verdict = rebuilt.verify();
    expect(verdict.valid).toBe(false);
    expect(verdict.brokenAt).toBe(0);
  });

  it('detects reordering (prevHash mismatch)', () => {
    const ledger = new EventLedger();
    ledger.append(bal('acc-1', '10', 'first'), CTX);
    ledger.append(bal('acc-1', '20', 'second'), CTX);
    const { entries, chainHead } = ledger.serialize();
    const reordered = [entries[1]!, entries[0]!];
    const rebuilt = EventLedger.deserialize({ entries: reordered, chainHead });
    expect(rebuilt.verify().valid).toBe(false);
  });

  it('detects head truncation (chainHead drift)', () => {
    const ledger = new EventLedger();
    ledger.append(bal('acc-1', '10', 'a'), CTX);
    ledger.append(bal('acc-1', '20', 'b'), CTX);
    const { entries } = ledger.serialize();
    const rebuilt = EventLedger.deserialize({ entries, chainHead: 'wrong-head' });
    const verdict = rebuilt.verify();
    expect(verdict.valid).toBe(false);
    expect(verdict.reason).toMatch(/chainHead/);
  });
});

describe('EventLedger — CQRS projection', () => {
  it('replays BALANCE_ADJUSTED events into exact per-account balances', () => {
    const ledger = new EventLedger();
    ledger.append(bal('acc-1', '0.1', 'a'), CTX, 1_000);
    ledger.append(bal('acc-1', '0.2', 'b'), CTX, 2_000);
    ledger.append(bal('acc-2', '5.00', 'c'), CTX, 3_000);
    const balances = ledger.projectBalances();
    // 0.1 + 0.2 is exactly 0.3 (Decimal), not 0.30000000000000004.
    expect(balances['acc-1']!.equals(new Decimal('0.3'))).toBe(true);
    expect(balances['acc-2']!.equals(new Decimal('5'))).toBe(true);
  });

  it('projects to a point in time (asOf) and ignores later events', () => {
    const ledger = new EventLedger();
    ledger.append(bal('acc-1', '10', 'a'), CTX, 1_000);
    ledger.append(bal('acc-1', '20', 'b'), CTX, 2_000);
    ledger.append(bal('acc-1', '30', 'c'), CTX, 3_000);
    expect(ledger.projectBalances(1_500)['acc-1']!.toString()).toBe('10');
    expect(ledger.projectBalances(2_500)['acc-1']!.toString()).toBe('30');
    expect(ledger.projectBalances()['acc-1']!.toString()).toBe('60');
  });

  it('is an idempotent derivation — same stream, same state', () => {
    const ledger = new EventLedger();
    ledger.append(bal('acc-1', '7.77', 'a'), CTX);
    ledger.append(bal('acc-1', '2.23', 'b'), CTX);
    const a = ledger.projectBalances()['acc-1']!.toString();
    const b = ledger.projectBalances()['acc-1']!.toString();
    expect(a).toBe(b);
    expect(a).toBe('10');
  });

  it('serialize/deserialize round-trips and the chain still verifies', () => {
    const ledger = new EventLedger();
    ledger.append(bal('acc-1', '100', 'open'), CTX);
    ledger.append(bal('acc-1', '-25', 'withdraw'), CTX);
    const roundTripped = EventLedger.deserialize(ledger.serialize());
    expect(roundTripped.length).toBe(2);
    expect(roundTripped.verify().valid).toBe(true);
    expect(roundTripped.projectBalances()['acc-1']!.toString()).toBe('75');
  });
});
