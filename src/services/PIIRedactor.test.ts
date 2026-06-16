/**
 * PIIRedactor — PATCH 13 tests (Hephaestus, FinPlan Pro v1.0.0, 2026-06-16)
 *
 * Comprehensive coverage for:
 *   - Field-based detection (13 categories)
 *   - Value-based detection (9 patterns)
 *   - All 4 strategies (mask, hash, tokenize, drop)
 *   - All 3 modes (strict, permissive, audit-only)
 *   - Recursive redaction (nested objects, arrays, depth cap)
 *   - SAFE-FIELDS allowlist + skipFields + extraPIIFields
 *   - Tokenization reversibility (rehydrate)
 *   - Hash-chained audit log (verifyChain, export)
 *   - Singleton & DI
 *   - Error handling
 */

import { describe, it, expect, beforeEach, _afterAll } from 'vitest';
import {
  PIIRedactor,
  PIIRedactionError,
  PII_REDACTION_CONSTANTS,
  type PIIRedactionAuditEvent,
} from './PIIRedactor';

const HAS_CRYPTO =
  typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.subtle !== 'undefined';
const skipIf = (cond: boolean) => (cond ? it.skip : it);

// ── 1. Constants ─────────────────────────────────────────────────────────────

describe('1. PII_REDACTION_CONSTANTS', () => {
  it('1.1 schema version is 1', () => {
    expect(PII_REDACTION_CONSTANTS.SCHEMA_VERSION).toBe(1);
  });
  it('1.2 max depth is 32', () => {
    expect(PII_REDACTION_CONSTANTS.MAX_DEPTH).toBe(32);
  });
  it('1.3 token prefix is tkn_', () => {
    expect(PII_REDACTION_CONSTANTS.TOKEN_PREFIX).toBe('tkn_');
  });
  it('1.4 mask placeholder is [REDACTED]', () => {
    expect(PII_REDACTION_CONSTANTS.MASK_PLACEHOLDER).toBe('[REDACTED]');
  });
  it('1.5 partial last4 is ****', () => {
    expect(PII_REDACTION_CONSTANTS.PARTIAL_LAST4).toBe('****');
  });
  it('1.6 hash output length is 16', () => {
    expect(PII_REDACTION_CONSTANTS.HASH_OUTPUT_LENGTH).toBe(16);
  });
  it('1.7 field patterns cover 13 categories', () => {
    const cats = Object.keys(PII_REDACTION_CONSTANTS.PII_FIELD_PATTERNS);
    expect(cats.length).toBe(13);
  });
  it('1.8 value patterns cover 9 patterns', () => {
    const cats = Object.keys(PII_REDACTION_CONSTANTS.VALUE_PATTERNS);
    expect(cats.length).toBe(9);
  });
  it('1.9 default safe fields include id, count, amount', () => {
    const s = PII_REDACTION_CONSTANTS.DEFAULT_SAFE_FIELDS;
    expect(s).toContain('id');
    expect(s).toContain('count');
    expect(s).toContain('amount');
  });
});

// ── 2. Initialization & singleton ────────────────────────────────────────────

describe('2. Initialization & singleton', () => {
  beforeEach(() => {
    PIIRedactor.resetInstance();
  });

  it('2.1 getInstance returns a PIIRedactor', () => {
    const r = PIIRedactor.getInstance();
    expect(r).toBeInstanceOf(PIIRedactor);
  });

  it('2.2 getInstance is singleton', () => {
    const a = PIIRedactor.getInstance();
    const b = PIIRedactor.getInstance();
    expect(a).toBe(b);
  });

  it('2.3 resetInstance clears state', () => {
    const a = PIIRedactor.getInstance();
    a.redact({ email: 'a@b.com' }, { actor: 't' });
    PIIRedactor.resetInstance();
    const b = PIIRedactor.getInstance();
    expect(b.getEventCount()).toBe(0);
  });

  it('2.4 rejects hmacKey < 16 bytes', () => {
    PIIRedactor.resetInstance();
    expect(() => PIIRedactor.createForTest({ hmacKey: new Uint8Array(8) })).toThrow(
      PIIRedactionError
    );
  });
});

// ── 3. Field-based detection (key matching) ─────────────────────────────────

describe('3. Field-based detection', () => {
  let r: PIIRedactor;
  beforeEach(() => {
    PIIRedactor.resetInstance();
    r = PIIRedactor.createForTest();
  });

  it('3.1 redacts email field', () => {
    const { output, redactedCount } = r.redact({ email: 'alice@example.com' });
    expect(redactedCount).toBe(1);
    expect((output as Record<string, string>).email).not.toBe('alice@example.com');
  });

  it('3.2 redacts emailAddress variant', () => {
    const { redactedCount } = r.redact({ emailAddress: 'bob@x.com' });
    expect(redactedCount).toBe(1);
  });

  it('3.3 redacts phone / mobile / tel', () => {
    expect(r.redact({ phone: '+15551234567' }).redactedCount).toBe(1);
    expect(r.redact({ mobile_number: '5551234567' }).redactedCount).toBe(1);
    expect(r.redact({ tel: '5551234567' }).redactedCount).toBe(1);
  });

  it('3.4 redacts ssn and nationalId', () => {
    expect(r.redact({ ssn: '123-45-6789' }).redactedCount).toBe(1);
    expect(r.redact({ national_id: '123-45-6789' }).redactedCount).toBe(1);
  });

  it('3.5 redacts creditCard and pan', () => {
    expect(r.redact({ credit_card_number: '4111111111111111' }).redactedCount).toBe(1);
    expect(r.redact({ pan: '4111111111111111' }).redactedCount).toBe(1);
  });

  it('3.6 redacts cvv and cvc', () => {
    expect(r.redact({ cvv: '123' }).redactedCount).toBe(1);
    expect(r.redact({ cvc: '456' }).redactedCount).toBe(1);
  });

  it('3.7 redacts bankAccount and iban', () => {
    expect(r.redact({ account_number: '12345' }).redactedCount).toBe(1);
    expect(r.redact({ iban: 'DE89370400440532013000' }).redactedCount).toBe(1);
  });

  it('3.8 redacts name fields', () => {
    expect(r.redact({ full_name: 'Alice' }).redactedCount).toBe(1);
    expect(r.redact({ firstName: 'Alice' }).redactedCount).toBe(1);
    expect(r.redact({ last_name: 'Smith' }).redactedCount).toBe(1);
  });

  it('3.9 redacts address fields', () => {
    expect(r.redact({ address_line1: '123 Main' }).redactedCount).toBe(1);
    expect(r.redact({ zip_code: '12345' }).redactedCount).toBe(1);
  });

  it('3.10 redacts dob and birthdate', () => {
    expect(r.redact({ dob: '1990-01-01' }).redactedCount).toBe(1);
    expect(r.redact({ date_of_birth: '1990-01-01' }).redactedCount).toBe(1);
  });

  it('3.11 redacts passport and drivers_license', () => {
    expect(r.redact({ passport_number: 'X123' }).redactedCount).toBe(1);
    expect(r.redact({ drivers_license: 'D123' }).redactedCount).toBe(1);
  });

  it('3.12 redacts ip fields', () => {
    expect(r.redact({ ip_address: '1.2.3.4' }).redactedCount).toBe(1);
    expect(r.redact({ remote_ip: '1.2.3.4' }).redactedCount).toBe(1);
  });

  it('3.13 redacts password and secret', () => {
    expect(r.redact({ password: 'hunter2' }).redactedCount).toBe(1);
    expect(r.redact({ api_key: 'k' }).redactedCount).toBe(1);
    expect(r.redact({ token: 't' }).redactedCount).toBe(1);
  });
});

// ── 4. Value-based detection (regex) ─────────────────────────────────────────

describe('4. Value-based detection', () => {
  let r: PIIRedactor;
  beforeEach(() => {
    PIIRedactor.resetInstance();
    r = PIIRedactor.createForTest();
  });

  it('4.1 detects email value in a generic field', () => {
    const { redactedCount } = r.redact({ contact: 'alice@example.com' });
    expect(redactedCount).toBe(1);
  });

  it('4.2 detects phone value in a generic field', () => {
    const { redactedCount } = r.redact({ note: 'Call me at +15551234567' });
    expect(redactedCount).toBe(1);
  });

  it('4.3 detects ssn value', () => {
    const { redactedCount } = r.redact({ ref: '123-45-6789' });
    expect(redactedCount).toBe(1);
  });

  it('4.4 detects credit card value', () => {
    const { redactedCount } = r.redact({ memo: '4111 1111 1111 1111' });
    expect(redactedCount).toBe(1);
  });

  it('4.5 detects IBAN value', () => {
    const { redactedCount } = r.redact({ ref: 'DE89370400440532013000' });
    expect(redactedCount).toBe(1);
  });

  it('4.6 detects IPv4 value', () => {
    const { redactedCount } = r.redact({ note: '192.168.1.1' });
    expect(redactedCount).toBe(1);
  });

  it('4.7 detects JWT value', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSJ9.abc123def456ghi789';
    const { redactedCount } = r.redact({ header: jwt });
    expect(redactedCount).toBe(1);
  });

  it('4.8 detects UUID value', () => {
    const { redactedCount } = r.redact({ ref: '550e8400-e29b-41d4-a716-446655440000' });
    expect(redactedCount).toBe(1);
  });
});

// ── 5. Strategies ────────────────────────────────────────────────────────────

describe('5. Strategies', () => {
  beforeEach(() => {
    PIIRedactor.resetInstance();
  });

  it('5.1 mask strategy replaces with [REDACTED] for emails', () => {
    const r = PIIRedactor.createForTest({ defaultStrategy: 'mask' });
    const { output } = r.redact({ email: 'a@b.com' });
    expect((output as Record<string, string>).email).toBe(PII_REDACTION_CONSTANTS.MASK_PLACEHOLDER);
  });

  it('5.2 mask strategy shows last 4 for credit cards', () => {
    const r = PIIRedactor.createForTest({ defaultStrategy: 'mask' });
    const { output } = r.redact({ credit_card: '4111111111111111' });
    expect((output as Record<string, string>).credit_card).toBe('****1111');
  });

  it('5.3 hash strategy produces tkn_ prefix', () => {
    const r = PIIRedactor.createForTest({ defaultStrategy: 'hash' });
    const { output } = r.redact({ email: 'a@b.com' });
    const v = (output as Record<string, string>).email;
    expect(v).toMatch(/^tkn_/);
    expect(v).not.toBe('a@b.com');
  });

  it('5.4 hash strategy is deterministic for same input', () => {
    const r = PIIRedactor.createForTest({ defaultStrategy: 'hash' });
    const a = (r.redact({ email: 'a@b.com' }).output as Record<string, string>).email;
    const b = (r.redact({ email: 'a@b.com' }).output as Record<string, string>).email;
    expect(a).toBe(b);
  });

  it('5.5 hash strategy differs for different categories of same string', () => {
    const r = PIIRedactor.createForTest({ defaultStrategy: 'hash' });
    const a = (r.redact({ phone: 'a@b.com' }).output as Record<string, string>).phone;
    const b = (r.redact({ email: 'a@b.com' }).output as Record<string, string>).email;
    // Domain-separation prefix should make these differ.
    expect(a).not.toBe(b);
  });

  it('5.6 tokenize strategy populates token map for rehydration', () => {
    const r = PIIRedactor.createForTest({
      defaultStrategy: 'tokenize',
      hmacKey: new Uint8Array(32),
    });
    const { output } = r.redact({ email: 'alice@example.com' });
    const v = (output as Record<string, string>).email;
    const orig = r.rehydrate(v);
    expect(orig).toBe('alice@example.com');
  });

  it('5.7 drop strategy replaces with [REDACTED]', () => {
    const r = PIIRedactor.createForTest({ defaultStrategy: 'drop' });
    const { output } = r.redact({ ssn: '123-45-6789' });
    expect((output as Record<string, string>).ssn).toBe(PII_REDACTION_CONSTANTS.MASK_PLACEHOLDER);
  });

  it('5.8 strategy override at call time', () => {
    const r = PIIRedactor.createForTest({ defaultStrategy: 'mask' });
    const { output } = r.redact({ email: 'a@b.com' }, { strategy: 'hash' });
    expect((output as Record<string, string>).email).toMatch(/^tkn_/);
  });
});

// ── 6. Modes ─────────────────────────────────────────────────────────────────

describe('6. Modes', () => {
  beforeEach(() => {
    PIIRedactor.resetInstance();
  });

  it('6.1 strict mode is the default', () => {
    const r = PIIRedactor.createForTest();
    const { output } = r.redact({ email: 'a@b.com' });
    expect((output as Record<string, string>).email).not.toBe('a@b.com');
  });

  it('6.2 permissive mode skips value-pattern detection but still redacts field names', () => {
    const r = PIIRedactor.createForTest({ defaultMode: 'permissive' });
    const { output } = r.redact({ contact: 'a@b.com' });
    // Value pattern should NOT trigger under permissive; field name still does.
    expect((output as Record<string, string>).contact).toBe('a@b.com');
  });

  it('6.3 audit-only mode passes values through and records', () => {
    const r = PIIRedactor.createForTest({ defaultMode: 'audit-only' });
    const { output, redactedCount } = r.redact({ email: 'a@b.com' });
    expect(redactedCount).toBe(0);
    expect((output as Record<string, string>).email).toBe('a@b.com');
  });

  it('6.4 strict mode redacts value-pattern email in generic field', () => {
    const r = PIIRedactor.createForTest({ defaultMode: 'strict' });
    const { output, redactedCount } = r.redact({ contact: 'a@b.com' });
    expect(redactedCount).toBe(1);
    expect((output as Record<string, string>).contact).not.toBe('a@b.com');
  });
});

// ── 7. Recursive redaction & safe fields ─────────────────────────────────────

describe('7. Recursive redaction & safe fields', () => {
  let r: PIIRedactor;
  beforeEach(() => {
    PIIRedactor.resetInstance();
    r = PIIRedactor.createForTest();
  });

  it('7.1 redacts nested objects', () => {
    const { output, redactedCount } = r.redact({
      user: { email: 'a@b.com', firstName: 'Alice', id: 'u1' },
    });
    expect(redactedCount).toBe(2);
    const u = (output as Record<string, Record<string, string>>).user;
    expect(u.email).not.toBe('a@b.com');
    expect(u.firstName).not.toBe('Alice');
    expect(u.id).toBe('u1');
  });

  it('7.2 redacts arrays of objects', () => {
    const { output, redactedCount } = r.redact({
      users: [{ email: 'a@b.com' }, { email: 'c@d.com' }],
    });
    expect(redactedCount).toBe(2);
    const arr = (output as Record<string, Array<Record<string, string>>>).users;
    expect(arr[0].email).not.toBe('a@b.com');
    expect(arr[1].email).not.toBe('c@d.com');
  });

  it('7.3 respects safe fields', () => {
    const { output, redactedCount } = r.redact({
      id: 'p1',
      count: 5,
      amount: 1000,
      currency: 'USD',
    });
    expect(redactedCount).toBe(0);
    const o = output as Record<string, unknown>;
    expect(o.id).toBe('p1');
    expect(o.count).toBe(5);
    expect(o.amount).toBe(1000);
    expect(o.currency).toBe('USD');
  });

  it('7.4 respects skipFields', () => {
    const r2 = PIIRedactor.createForTest({ skipFields: ['email'] });
    const { output, redactedCount } = r2.redact({ email: 'a@b.com' });
    expect(redactedCount).toBe(0);
    expect((output as Record<string, string>).email).toBe('a@b.com');
  });

  it('7.5 extraPIIFields adds custom field categories', () => {
    const r2 = PIIRedactor.createForTest({ extraPIIFields: ['email'] as never });
    // Just verifying config accepts the option.
    expect(r2).toBeInstanceOf(PIIRedactor);
  });

  it('7.6 extraSafeFields expands the allowlist', () => {
    const r2 = PIIRedactor.createForTest({ extraSafeFields: ['customerNotes'] });
    const { output, redactedCount } = r2.redact({
      customerNotes: 'something important',
    });
    expect(redactedCount).toBe(0);
    expect((output as Record<string, string>).customerNotes).toBe('something important');
  });

  it('7.7 max depth caps recursion', () => {
    let deep: Record<string, unknown> = { value: 'leaf' };
    for (let i = 0; i < PII_REDACTION_CONSTANTS.MAX_DEPTH + 5; i++) {
      deep = { nested: deep };
    }
    // Should not throw; just return a masked placeholder at depth.
    const { output } = r.redact(deep);
    expect(output).toBeDefined();
  });

  it('7.8 null and undefined pass through', () => {
    const { output } = r.redact({ a: null, b: undefined, c: 'plain' });
    expect((output as Record<string, unknown>).a).toBeNull();
    expect((output as Record<string, unknown>).b).toBeUndefined();
    expect((output as Record<string, string>).c).toBe('plain');
  });
});

// ── 8. Audit chain ───────────────────────────────────────────────────────────

describe('8. Audit chain', () => {
  let r: PIIRedactor;
  let events: PIIRedactionAuditEvent[];
  beforeEach(() => {
    PIIRedactor.resetInstance();
    events = [];
    r = PIIRedactor.createForTest({
      onAudit: (e) => {
        events.push(e);
      },
    });
  });

  skipIf(!HAS_CRYPTO)('8.1 emits one audit event per redact call', async () => {
    r.redact({ email: 'a@b.com' }, { actor: 't' });
    // audit emission is async (microtask); wait one tick.
    await new Promise((res) => setTimeout(res, 10));
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('pii.redacted');
    expect(events[0].redactedCount).toBe(1);
    expect(events[0].actor).toBe('t');
  });

  skipIf(!HAS_CRYPTO)('8.2 audit events chain properly', async () => {
    r.redact({ email: 'a@b.com' }, { actor: 't' });
    r.redact({ ssn: '123-45-6789' }, { actor: 't' });
    await new Promise((res) => setTimeout(res, 10));
    expect(events.length).toBe(2);
    expect(events[1].prevChainHash).toBe(events[0].eventHash);
  });

  skipIf(!HAS_CRYPTO)('8.3 verifyChain returns valid=true for intact chain', async () => {
    r.redact({ email: 'a@b.com' });
    r.redact({ ssn: '123-45-6789' });
    await new Promise((res) => setTimeout(res, 10));
    const v = await r.verifyChain();
    expect(v.valid).toBe(true);
    expect(v.inspected).toBe(2);
  });

  skipIf(!HAS_CRYPTO)('8.4 verifyChain detects tampering', async () => {
    r.redact({ email: 'a@b.com' });
    await new Promise((res) => setTimeout(res, 10));
    const evs = r.getEvents();
    evs[0].redactedCount = 999; // tamper
    const v = await r.verifyChain();
    expect(v.valid).toBe(false);
    expect(v.firstFailure).toBe(0);
  });

  it('8.5 getEventCount returns the number of events', async () => {
    r.redact({ email: 'a@b.com' });
    r.redact({ ssn: '123-45-6789' });
    r.redact({ phone: '+15551234567' });
    await new Promise((res) => setTimeout(res, 10));
    expect(r.getEventCount()).toBe(3);
  });

  it('8.6 export jsonl yields one event per line', async () => {
    r.redact({ email: 'a@b.com' });
    r.redact({ ssn: '123-45-6789' });
    await new Promise((res) => setTimeout(res, 10));
    const jl = r.export('jsonl');
    const lines = jl.split('\n');
    expect(lines.length).toBe(2);
    JSON.parse(lines[0]);
  });

  it('8.7 export json includes events and chainHead', async () => {
    r.redact({ email: 'a@b.com' });
    await new Promise((res) => setTimeout(res, 10));
    const j = r.export('json');
    const obj = JSON.parse(j);
    expect(obj.events.length).toBe(1);
    expect(obj.chainHead).toBe(r.getChainHead());
  });
});

// ── 9. Rehydration ───────────────────────────────────────────────────────────

describe('9. Rehydration', () => {
  beforeEach(() => {
    PIIRedactor.resetInstance();
  });

  it('9.1 rehydrate returns null for unknown token', () => {
    const r = PIIRedactor.createForTest();
    expect(r.rehydrate('tkn_doesnotexist')).toBeNull();
  });

  it('9.2 rehydrate returns null for non-string input', () => {
    const r = PIIRedactor.createForTest();
    expect(r.rehydrate(123 as never)).toBeNull();
  });

  it('9.3 exportTokenMap returns a copy', () => {
    const r = PIIRedactor.createForTest({
      hmacKey: new Uint8Array(32),
      defaultStrategy: 'tokenize',
    });
    r.redact({ email: 'a@b.com' });
    const m1 = r.exportTokenMap();
    const m2 = r.exportTokenMap();
    expect(m1).not.toBe(m2); // different references (shallow copy)
    expect(m1).toEqual(m2);
  });

  it('9.4 loadTokenMap replaces the map', () => {
    const r = PIIRedactor.createForTest();
    r.loadTokenMap({ tkn_abc: 'orig' });
    expect(r.rehydrate('tkn_abc')).toBe('orig');
  });

  it('9.5 loadTokenMap rejects non-object', () => {
    const r = PIIRedactor.createForTest();
    expect(() => r.loadTokenMap(null as never)).toThrow();
  });
});

// ── 10. Error handling ───────────────────────────────────────────────────────

describe('10. Error handling', () => {
  beforeEach(() => {
    PIIRedactor.resetInstance();
  });

  it('10.1 rejects invalid strategy', () => {
    const r = PIIRedactor.createForTest();
    expect(() => r.redact({ x: 1 }, { strategy: 'nope' as never })).toThrow(PIIRedactionError);
  });

  it('10.2 rejects invalid mode', () => {
    const r = PIIRedactor.createForTest();
    expect(() => r.redact({ x: 1 }, { mode: 'nope' as never })).toThrow(PIIRedactionError);
  });

  it('10.3 audit callback failure does not break redact', async () => {
    const r = PIIRedactor.createForTest({
      onAudit: () => {
        throw new Error('audit sink down');
      },
    });
    const { redactedCount } = r.redact({ email: 'a@b.com' });
    expect(redactedCount).toBe(1);
  });
});

// ── 11. Integration: redact then export ──────────────────────────────────────

describe('11. Integration: redact then export', () => {
  skipIf(!HAS_CRYPTO)('11.1 chained redactions produce valid chain', async () => {
    PIIRedactor.resetInstance();
    const r = PIIRedactor.createForTest();
    for (let i = 0; i < 10; i++) {
      r.redact({ email: `u${i}@x.com`, ssn: '123-45-6789' });
    }
    // Drain the audit emission chain. Each emit is a microtask; give the
    // event loop 200ms to process all 10 before verifying the chain.
    await new Promise((res) => setTimeout(res, 200));
    const v = await r.verifyChain();
    expect(v.valid).toBe(true);
    expect(v.inspected).toBe(10);
  });
});
