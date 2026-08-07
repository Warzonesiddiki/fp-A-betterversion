/**
 * AuditLogEngine.ext.test.ts — SOX-critical depth: hash-chain integrity,
 * HMAC signatures, async flush queue, retention auto-prune, CSV
 * formula-injection escaping (CWE-1236), and date-range filtering
 * (MISSION D wave 2, 2026-08-07).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditLogEngine } from './AuditLogEngine';

const base = {
  userId: 'u1',
  userName: 'Alice',
  action: 'UPDATE' as const,
  resource: 'budget',
  resourceId: 'b-1',
  details: 'changed amount',
};

describe('AuditLogEngine — filtering & pruning', () => {
  let e: AuditLogEngine;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-07T00:00:00Z'));
    e = new AuditLogEngine();
  });
  afterEach(() => {
    vi.useRealTimers();
    e.dispose();
  });

  it('filter combines all fields with newest-first ordering and limit', () => {
    e.log({ ...base, timestamp: undefined as never });
    vi.setSystemTime(new Date('2026-08-07T00:01:00Z'));
    e.log({ ...base, action: 'CREATE', details: 'second' });
    vi.setSystemTime(new Date('2026-08-07T00:02:00Z'));
    e.log({ ...base, action: 'DELETE', details: 'third', resourceId: 'b-2' });
    const all = e.filter({});
    expect(all).toHaveLength(3);
    expect(all[0]!.details).toBe('third'); // newest first

    const filtered = e.filter({
      action: 'CREATE',
      userId: 'u1',
      resource: 'budget',
      resourceId: 'b-1',
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]!.details).toBe('second');
  });

  it('filter by date range', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    e.log({ ...base, details: 'jan' });
    vi.setSystemTime(new Date('2026-06-01T00:00:00Z'));
    e.log({ ...base, details: 'jun' });
    vi.setSystemTime(new Date('2026-12-01T00:00:00Z'));
    e.log({ ...base, details: 'dec' });

    const mid = e.filter({
      startDate: '2026-03-01T00:00:00.000Z',
      endDate: '2026-09-01T00:00:00.000Z',
    });
    expect(mid.map((x) => x.details)).toEqual(['jun']);
    const limited = e.filter({ limit: 2 });
    expect(limited).toHaveLength(2);
  });

  it('prune removes entries older than retentionDays', () => {
    vi.setSystemTime(new Date('2020-01-01T00:00:00Z'));
    e.log({ ...base, details: 'old' });
    vi.setSystemTime(new Date('2026-08-07T00:00:00Z'));
    e.log({ ...base, details: 'new' });
    // default retention 2555 days (~7y) — 2020-01-01 is ~2420 days back → kept;
    // tighten retention and re-prune
    const removed = e.prune(); // uses retentionDays from constructor (2555)
    expect(removed).toBe(0);
    e.setRetentionPolicy({ maxAgeDays: 100 });
    expect(e.getRetentionPolicy().maxAgeDays).toBe(100);
    // setRetentionPolicy auto-prunes on install
    expect(e.getEntries().map((x) => x.details)).toEqual(['new']);
  });

  it('autoPrune enforces maxEntries from the front', () => {
    for (let i = 0; i < 5; i++) e.log({ ...base, details: `e${i}` });
    // policy install auto-prunes down to maxEntries=2
    e.setRetentionPolicy({ maxEntries: 2, maxAgeDays: 3650 });
    expect(e.getEntries().map((x) => x.details)).toEqual(['e3', 'e4']);
    expect(e.autoPrune()).toBe(0);
  });
});

describe('AuditLogEngine — CSV injection defense (CWE-1236)', () => {
  it('prefixes formula-injection starters with a single quote', () => {
    const e = new AuditLogEngine();
    e.log({ ...base, details: '=HYPERLINK("http://evil")' });
    e.log({ ...base, details: '+SUM(1,1)' });
    e.log({ ...base, details: '-2+3' });
    e.log({ ...base, details: '@cmd' });
    e.log({ ...base, details: '\tleading-tab' });
    const csv = e.exportCSV();
    expect(csv).toContain('\'=HYPERLINK("http://evil")');
    expect(csv).toContain("'+SUM(1,1)");
    expect(csv).toContain("'-2+3");
    expect(csv).toContain("'@cmd");
    expect(csv).toContain("'\tleading-tab");
  });

  it('RFC-4180 quotes commas, quotes and newlines', () => {
    const e = new AuditLogEngine();
    e.log({ ...base, details: 'comma,here' });
    e.log({ ...base, details: 'quote"here' });
    e.log({ ...base, details: 'line\nbreak' });
    const csv = e.exportCSV();
    expect(csv).toContain('"comma,here"');
    expect(csv).toContain('"quote""here"');
    expect(csv).toContain('"line\nbreak"');
  });

  it('serialize / deserialize round-trips', () => {
    const e = new AuditLogEngine();
    e.log(base);
    e.log({ ...base, action: 'DELETE' });
    const json = e.serialize();
    const e2 = new AuditLogEngine();
    e2.deserialize(json);
    expect(e2.getEntries()).toHaveLength(2);
    expect(e2.getEntries()[0]!.action).toBe('UPDATE');
    e2.clear();
    expect(e2.getEntries()).toHaveLength(0);
  });
});

describe('AuditLogEngine — hash chain integrity (CWE-345)', () => {
  let e: AuditLogEngine;
  beforeEach(() => {
    e = new AuditLogEngine();
  });
  afterEach(() => e.dispose());

  it('empty chain verifies as ok', async () => {
    expect(await e.verifyIntegrity()).toMatchObject({ ok: true, reason: 'EMPTY_CHAIN' });
    expect(e.chainHead()).toBe('0'.repeat(64));
  });

  it('logChain extends a verifiable SHA-256 chain', async () => {
    const a = await e.logChain(base);
    const b = await e.logChain({ ...base, action: 'CREATE' });
    expect(a.entryHash).toHaveLength(64);
    expect(b.prevHash).toBe(a.entryHash);
    expect(e.chainHead()).toBe(b.entryHash);
    const v = await e.verifyIntegrity();
    expect(v.ok).toBe(true);
    expect(v.totalEntries).toBe(2);
  });

  it('detects a tampered entry', async () => {
    await e.logChain(base);
    await e.logChain({ ...base, action: 'CREATE' });
    // tamper with entry #2 in place (deserialize replaces the internal array)
    const arr = JSON.parse(e.serialize()) as { details: string }[];
    arr[1]!.details = 'tampered';
    e.deserialize(JSON.stringify(arr));
    const v = await e.verifyIntegrity();
    expect(v.ok).toBe(false);
    expect(v.brokenAt).toBe(1);
    expect(v.reason).toBe('BROKEN_HASH_MISMATCH');
  });
});

describe('AuditLogEngine — HMAC signatures', () => {
  let e: AuditLogEngine;
  let key: CryptoKey;
  beforeEach(async () => {
    e = new AuditLogEngine();
    key = await crypto.subtle.generateKey({ name: 'HMAC', hash: 'SHA-256' }, true, [
      'sign',
      'verify',
    ]);
  });
  afterEach(() => e.dispose());

  it('returns null without a signing key', async () => {
    expect(await e.sign(base as never)).toBeNull();
    expect(await e.verifySignature(base as never, 'sig')).toBe(false);
  });

  it('signs and verifies with a key, and rejects tampering', async () => {
    await e.setSigningKey(key);
    const entry = e.log(base);
    const sig = await e.sign(entry);
    expect(sig).toBeTruthy();
    expect(await e.verifySignature(entry, sig!)).toBe(true);
    expect(await e.verifySignature({ ...entry, details: 'changed' }, sig!)).toBe(false);
    expect(await e.verifySignature(entry, 'garbage')).toBe(false);
  });
});

describe('AuditLogEngine — async flush queue', () => {
  let e: AuditLogEngine;
  beforeEach(() => {
    vi.useFakeTimers();
    e = new AuditLogEngine();
  });
  afterEach(() => {
    vi.useRealTimers();
    e.dispose();
  });

  it('buffers up to maxBatchSize then flushes automatically', async () => {
    const flushed: number[] = [];
    e.configureAsyncQueue({
      maxBatchSize: 3,
      maxBatchDelayMs: 1000,
      onFlush: (batch) => flushed.push(batch.length),
    });
    e.enqueue(base);
    e.enqueue(base);
    expect(e.queueSize()).toBe(2);
    expect(flushed).toHaveLength(0);
    e.enqueue(base); // reaches batch size → auto flush
    expect(e.queueSize()).toBe(0);
    expect(flushed).toEqual([3]);
    expect(await e.flush()).toEqual([]);
  });

  it('flushes on the delay timer', async () => {
    const flushed: number[] = [];
    e.configureAsyncQueue({
      maxBatchSize: 10,
      maxBatchDelayMs: 250,
      onFlush: (b) => flushed.push(b.length),
    });
    e.enqueue(base);
    expect(e.queueSize()).toBe(1);
    await vi.advanceTimersByTimeAsync(300);
    expect(e.queueSize()).toBe(0);
    expect(flushed).toEqual([1]);
  });

  it('swallows sink errors and force-flush returns the batch', async () => {
    e.configureAsyncQueue({
      maxBatchSize: 10,
      maxBatchDelayMs: 0,
      onFlush: () => {
        throw new Error('sink down');
      },
    });
    const created = e.enqueue(base);
    expect(created.id).toBeTruthy();
    const batch = await e.flush();
    expect(batch).toHaveLength(1);
  });
});
